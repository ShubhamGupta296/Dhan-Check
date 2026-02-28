// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/// @title DonationVerifier
/// @notice Milestone-based Proof-of-Donation escrow with AI-signed verification.
contract DonationVerifier {
    using ECDSA for bytes32;

    // EIP-712 domain and type hashes
    bytes32 private constant EIP712_DOMAIN_TYPEHASH =
        keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)");
    bytes32 private constant VERIFICATION_TYPEHASH =
        keccak256("Verification(uint256 campaignId,uint256 milestoneId,uint256 detectedCount,uint256 targetCount)");

    bytes32 private immutable _DOMAIN_SEPARATOR;

    /// @notice Address of the AI verification agent. Only this address' signatures are accepted.
    address public immutable verifierAddress;

    struct Milestone {
        uint256 id;
        string description;
        bool released;
    }

    struct Campaign {
        uint256 id;
        address ngo;
        address donor;
        mapping(uint256 => Milestone) milestones;
        uint256 milestoneCount;
    }

    mapping(uint256 => Campaign) private campaigns;

    event CampaignCreated(uint256 indexed campaignId, address indexed ngo, address indexed donor);
    event MilestoneAdded(uint256 indexed campaignId, uint256 indexed milestoneId, string description);
    event MilestoneReleased(uint256 indexed campaignId, uint256 indexed milestoneId, bytes32 proofHash);

    /// @param _verifierAddress The AI agent address. This is hard-bound at deployment and cannot be changed.
    constructor(address _verifierAddress) {
        require(_verifierAddress != address(0), "Invalid verifier");
        verifierAddress = _verifierAddress;

        uint256 chainId;
        assembly {
            chainId := chainid()
        }

        _DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                EIP712_DOMAIN_TYPEHASH,
                keccak256(bytes("DhanCheckVerification")),
                keccak256(bytes("1")),
                chainId,
                address(this)
            )
        );
    }

    /// @notice Returns the EIP-712 domain separator used for verification.
    function domainSeparator() external view returns (bytes32) {
        return _DOMAIN_SEPARATOR;
    }

    /// @dev Compute the EIP-712 digest for a verification payload.
    function _hashVerification(
        uint256 campaignId,
        uint256 milestoneId,
        uint256 detectedCount,
        uint256 targetCount
    ) internal view returns (bytes32) {
        bytes32 structHash = keccak256(
            abi.encode(
                VERIFICATION_TYPEHASH,
                campaignId,
                milestoneId,
                detectedCount,
                targetCount
            )
        );

        return keccak256(abi.encodePacked("\x19\x01", _DOMAIN_SEPARATOR, structHash));
    }

    function createCampaign(uint256 campaignId, address ngo, address donor) external {
        Campaign storage c = campaigns[campaignId];
        require(c.ngo == address(0), "Campaign already exists");
        c.id = campaignId;
        c.ngo = ngo;
        c.donor = donor;
        emit CampaignCreated(campaignId, ngo, donor);
    }

    function addMilestone(
        uint256 campaignId,
        uint256 milestoneId,
        string calldata description
    ) external {
        Campaign storage c = campaigns[campaignId];
        require(msg.sender == c.donor || msg.sender == c.ngo, "Not authorized");
        require(!c.milestones[milestoneId].released, "Milestone already exists");

        c.milestones[milestoneId] = Milestone({
            id: milestoneId,
            description: description,
            released: false
        });
        c.milestoneCount += 1;

        emit MilestoneAdded(campaignId, milestoneId, description);
    }

    /// @notice Verify an AI-signed proof and release a milestone if valid.
    /// @param campaignId The campaign ID.
    /// @param milestoneId The milestone ID.
    /// @param detectedCount The object count produced by the AI.
    /// @param targetCount The required object count threshold.
    /// @param signature The EIP-712 signature produced by the AI agent.
    function verifyAndRelease(
        uint256 campaignId,
        uint256 milestoneId,
        uint256 detectedCount,
        uint256 targetCount,
        bytes calldata signature
    ) external {
        Campaign storage c = campaigns[campaignId];
        require(msg.sender == c.donor, "Only donor can release");
        Milestone storage m = c.milestones[milestoneId];
        require(!m.released, "Milestone already released");

        // Recover signer from EIP-712 digest and ensure it matches the AI verifier address.
        bytes32 digest = _hashVerification(campaignId, milestoneId, detectedCount, targetCount);
        address signer = ECDSA.recover(digest, signature);
        require(signer == verifierAddress, "Invalid AI verifier signature");

        m.released = true;

        emit MilestoneReleased(campaignId, milestoneId, digest);
    }
}

