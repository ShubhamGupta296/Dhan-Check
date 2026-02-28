export default function HomePage() {
  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow-lg shadow-slate-950/40">
        <h2 className="text-2xl font-semibold tracking-tight">
          Agentic Proof-of-Donation
        </h2>
        <p className="mt-2 text-sm text-slate-300">
          Dhan-Check uses an AI verification agent and on-chain smart contracts to
          ensure NGO milestones are truly met before funds move.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
            <h3 className="text-sm font-semibold text-slate-100">Donors</h3>
            <p className="mt-1 text-xs text-slate-400">
              Create and fund milestone-based campaigns with transparent,
              verifiable outcomes.
            </p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
            <h3 className="text-sm font-semibold text-slate-100">NGOs</h3>
            <p className="mt-1 text-xs text-slate-400">
              Upload on-the-ground evidence (photos, videos) and get AI-backed
              verification proofs.
            </p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
            <h3 className="text-sm font-semibold text-slate-100">Smart Contracts</h3>
            <p className="mt-1 text-xs text-slate-400">
              Automatically release milestone funds only when proofs check out
              on-chain.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
          <h3 className="text-sm font-semibold text-slate-100">
            Multi-Agent Flow (High Level)
          </h3>
          <ol className="mt-2 space-y-2 text-xs text-slate-300">
            <li>
              <span className="font-semibold text-primary-400">1. Evidence Agent:</span>{" "}
              Frontend collects NGO evidence and stores it on IPFS.
            </li>
            <li>
              <span className="font-semibold text-primary-400">2. AI Agent:</span>{" "}
              FastAPI + YOLOv10 analyze evidence and issue a cryptographic proof.
            </li>
            <li>
              <span className="font-semibold text-primary-400">3. On-Chain Agent:</span>{" "}
              Solidity contracts validate the proof before releasing funds.
            </li>
          </ol>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
          <h3 className="text-sm font-semibold text-slate-100">
            Next Steps for Developers
          </h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-300">
            <li>Wire the frontend to the FastAPI `/verify` endpoint.</li>
            <li>Define the canonical verification proof schema and signature scheme.</li>
            <li>Extend `DonationVerifier` to check real signatures and conditions.</li>
          </ul>
        </div>
      </section>
    </div>
  );
}

