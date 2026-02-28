
import os
from io import BytesIO
from typing import Any, Dict

from dotenv import load_dotenv
from eth_account import Account
from eth_abi import encode as abi_encode
from eth_utils import keccak, to_checksum_address
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from PIL import Image
from pydantic import BaseModel
from ultralytics import YOLO

load_dotenv()

app = FastAPI(title="Dhan-Check AI Engine", version="0.1.0")


YOLO_MODEL_PATH = "yolov10s.pt"
TARGET_CLASSES = {"backpack", "handbag"}
EIP712_DOMAIN_NAME = "DhanCheckVerification"
EIP712_DOMAIN_VERSION = "1"


_yolo_model: YOLO | None = None


def get_yolo_model() -> YOLO:
    """
    Lazily load the YOLOv10 small model.

    Expects the weights file (yolov10s.pt) to be present on disk
    or otherwise resolvable by the Ultralytics loader.
    """
    global _yolo_model
    if _yolo_model is None:
        _yolo_model = YOLO(YOLO_MODEL_PATH)
    return _yolo_model


def count_blankets_or_bags(image_bytes: bytes) -> Dict[str, Any]:
    """
    Run YOLOv10 inference and count detections for COCO classes
    that we treat as a proxy for blankets or bags.

    Currently uses the 'handbag' and 'backpack' COCO classes.
    """
    model = get_yolo_model()
    image = Image.open(BytesIO(image_bytes)).convert("RGB")

    results = model(image)[0]

    # Ultralytics models expose class names via either results.names or model.names
    names = getattr(results, "names", None) or getattr(model, "names", {})

    total_proxy_count = 0
    per_class: Dict[str, int] = {}

    boxes = getattr(results, "boxes", None)
    if boxes is not None and getattr(boxes, "cls", None) is not None:
        class_ids = boxes.cls.tolist()
        for cid in class_ids:
            name = str(names[int(cid)])
            per_class[name] = per_class.get(name, 0) + 1
            if name in TARGET_CLASSES:
                total_proxy_count += 1

    return {
        "total_proxy_count": total_proxy_count,
        "per_class": per_class,
    }


def _eip712_domain_separator(chain_id: int, verifying_contract: str) -> bytes:
    """
    Compute the EIP-712 domain separator used on-chain in DonationVerifier.
    Must match the Solidity calculation exactly.
    """
    domain_typehash = keccak(
        text="EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
    )
    name_hash = keccak(text=EIP712_DOMAIN_NAME)
    version_hash = keccak(text=EIP712_DOMAIN_VERSION)
    vc = to_checksum_address(verifying_contract)

    return keccak(
        abi_encode(
            ["bytes32", "bytes32", "bytes32", "uint256", "address"],
            [domain_typehash, name_hash, version_hash, chain_id, vc],
        )
    )


def _hash_verification_struct(
    campaign_id: int,
    milestone_id: int,
    detected_count: int,
    target_count: int,
) -> bytes:
    """
    Hash the Verification struct according to EIP-712.
    """
    typehash = keccak(
        text="Verification(uint256 campaignId,uint256 milestoneId,uint256 detectedCount,uint256 targetCount)"
    )

    return keccak(
        abi_encode(
            ["bytes32", "uint256", "uint256", "uint256", "uint256"],
            [typehash, campaign_id, milestone_id, detected_count, target_count],
        )
    )


def sign_verification(
    campaign_id: str,
    milestone_id: str,
    detected_count: int,
    target_count: int,
) -> str:
    """
    Sign an EIP-712 Verification(campaignId, milestoneId, detectedCount, targetCount)
    payload using the AGENT_PRIVATE_KEY.

    The domain parameters (chainId, verifyingContract) are taken from environment:
    - EIP712_CHAIN_ID (default: 1337)
    - EIP712_VERIFYING_CONTRACT (must be set to the DonationVerifier address)
    """
    private_key = os.getenv("AGENT_PRIVATE_KEY")
    if not private_key:
        raise RuntimeError("AGENT_PRIVATE_KEY is not set in environment")

    verifying_contract = os.getenv("EIP712_VERIFYING_CONTRACT")
    if not verifying_contract:
        raise RuntimeError("EIP712_VERIFYING_CONTRACT is not set in environment")

    chain_id_str = os.getenv("EIP712_CHAIN_ID", "1337")
    try:
        chain_id = int(chain_id_str)
    except ValueError as exc:  # noqa: BLE001
        raise RuntimeError("EIP712_CHAIN_ID must be an integer") from exc

    domain_separator = _eip712_domain_separator(chain_id, verifying_contract)

    struct_hash = _hash_verification_struct(
        int(campaign_id),
        int(milestone_id),
        int(detected_count),
        int(target_count),
    )

    digest = keccak(b"\x19\x01" + domain_separator + struct_hash)

    signed = Account.sign_hash(digest, private_key=private_key)
    return signed.signature.hex()


class VerificationRequest(BaseModel):
    evidence_uri: str
    campaign_id: str
    milestone_id: str
    extra_metadata: Dict[str, Any] | None = None


class VerificationProof(BaseModel):
    campaign_id: str
    milestone_id: str
    detections: Dict[str, Any]
    detected_count: int | None = None
    target_count: int | None = None
    status: str = "pending"
    proof_signature: str


@app.get("/health")
async def health() -> Dict[str, str]:
    return {"status": "ok", "service": "ai_engine"}


@app.post("/verify", response_model=VerificationProof)
async def verify(request: VerificationRequest) -> VerificationProof:
    """
    Placeholder endpoint for YOLOv10-based verification.

    In the real implementation this should:
    - Fetch image(s) from the evidence_uri (e.g., IPFS gateway).
    - Run YOLOv10 object detection.
    - Build a canonical verification payload.
    - Sign the payload with a private key and return the signature.
    """
    # TODO: integrate YOLOv10 and real signing logic
    dummy_detections: Dict[str, Any] = {
        "objects": [],
        "model": "yolov10-placeholder",
        "summary": "verification not yet implemented",
    }

    dummy_signature = "0xdeadbeef"  # replace with real cryptographic signature

    return VerificationProof(
        campaign_id=request.campaign_id,
        milestone_id=request.milestone_id,
        detections=dummy_detections,
        detected_count=None,
        target_count=None,
        status="pending",
        proof_signature=dummy_signature,
    )


@app.post("/verify_upload", response_model=VerificationProof)
async def verify_upload(
    campaign_id: str = Form(...),
    milestone_id: str = Form(...),
    target_count: int = Form(...),
    file: UploadFile = File(...),
) -> VerificationProof:
    """
    Accepts an image upload and a target_count, then:
    - Runs YOLOv10s on the image.
    - Counts 'backpack' or 'handbag' detections (proxy for blankets/bags).
    - Compares detected_count against target_count.
    - Returns a success status and a mock Agent Signature if threshold is met.
    """
    image_bytes = await file.read()

    detection_summary = count_blankets_or_bags(image_bytes)
    detected_count = int(detection_summary["total_proxy_count"])

    success = detected_count >= target_count
    status = "success" if success else "failed"

    # Real Ethereum signature using AGENT_PRIVATE_KEY; only sign on success.
    if success:
        try:
            agent_signature = sign_verification(
                campaign_id,
                milestone_id,
                detected_count,
                target_count,
            )
        except Exception as exc:  # noqa: BLE001
            raise HTTPException(status_code=500, detail=f"Signing failed: {exc}") from exc
    else:
        agent_signature = ""

    detections_payload: Dict[str, Any] = {
        "model": "yolov10s",
        "proxy_classes": list(TARGET_CLASSES),
        "detected_count": detected_count,
        "target_count": target_count,
        "summary": detection_summary,
    }

    return VerificationProof(
        campaign_id=campaign_id,
        milestone_id=milestone_id,
        detections=detections_payload,
        detected_count=detected_count,
        target_count=target_count,
        status=status,
        proof_signature=agent_signature,
    )

