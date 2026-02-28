# Dhan-Check: Decentralized "Proof-of-Donation" 🛡️💰

A 3rd-year AI & Data Science project aimed at building radical trust in philanthropy using **Agentic AI** and **Blockchain Escrow**.

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


//Future Scope