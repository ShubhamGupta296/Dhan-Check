# Dhan-Check: Decentralized "Proof-of-Donation" 🛡️💰

A project aimed at building radical trust in philanthropy using **Agentic AI** and **Blockchain Escrow**.

## 🚀 The Vision
People hesitate to donate because of opacity. **Dhan-Check** automates honesty. Funds are locked in a smart contract and only released when our **AI Auditor (YOLOv10)** verifies physical evidence of impact.

## 🛠️ Technical Stack
- **AI Backend:** FastAPI, YOLOv10, PyTorch
- **Blockchain:** Solidity, Hardhat, Polygon, Ethers.js
- **Frontend:** Next.js, Tailwind CSS
- **Security:** EIP-712 Cryptographic Signatures

## 📋 System Workflow
1. **Escrow:** Donors fund campaigns; money is held in a Solidity contract.
2. **Evidence:** NGOs upload photo/video proof via the dashboard.
3. **Audit:** YOLOv10 counts items and generates a digital signature.
4. **Release:** The contract validates the signature and releases funds.

## 🔧 Installation & Setup

### AI Engine
```bash
cd ai_engine
python -m venv .venv
source .venv/bin/activate # or .\.venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn main:app --reload



Future Scope: Scaling "Radical Trust"
1. Advanced Anti-Fraud & Deepfake Detection
Media Authenticity: Integrate specialized CNN layers to detect image metadata manipulation and AI-generated "Deepfake" evidence.

Video Stream Auditing: Transition from static image analysis to temporal video processing to verify that objects aren't being moved or re-counted in the same frame.

2. Decentralized Data Sovereignty
IPFS & Filecoin Integration: Move evidence storage from centralized servers to decentralized networks to ensure all proofs are permanent and tamper-proof.

On-Chain Evidence Hashes: Store the CID (Content Identifier) of the IPFS evidence directly in the smart contract to create an immutable audit trail.

3. Multi-Chain & Layer-2 Expansion
Cross-Chain Interoperability: Deploy on multiple Layer-2 networks (like Arbitrum or Optimism) to provide donors with the lowest possible gas fees for micro-donations.

Stablecoin Support: Allow donations in USDC or USDT to protect NGO funds from the volatility of native crypto tokens.

4. Community-Driven Governance (DAO)
Dispute Resolution: Implement a decentralized jury system where community members can review "NEEDS_HUMAN_REVIEW" cases flagged by the AI.

Incentivized Auditing: Reward users with governance tokens for contributing to the dataset or helping train the YOLO model for new donation types (e.g., medical supplies, solar panels).

5. IoT Integration: "Real-World Oracles"
Smart Sensors: Connect the smart contract to IoT sensors (e.g., water flow meters for well projects) to trigger fund releases based on hardware data rather than just visual proof.
