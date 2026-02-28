"use client";

import { useState, FormEvent } from "react";
import { BrowserProvider, Contract } from "ethers";

const donationVerifierAbi = [
  "function verifyAndRelease(uint256 campaignId, uint256 milestoneId, uint256 detectedCount, uint256 targetCount, bytes signature) external"
];

const AI_ENGINE_URL = process.env.NEXT_PUBLIC_AI_ENGINE_URL ?? "http://localhost:8000";
const DONATION_VERIFIER_ADDRESS =
  process.env.NEXT_PUBLIC_DONATION_VERIFIER_ADDRESS ?? "0xYourVerifierAddressHere";

type VerificationResponse = {
  campaign_id: string;
  milestone_id: string;
  detections: {
    model: string;
    proxy_classes: string[];
    detected_count: number;
    target_count: number;
    summary: unknown;
  };
  detected_count: number;
  target_count: number;
  status: string;
  proof_signature: string;
};

export default function NgoVerifyPage() {
  const [campaignId, setCampaignId] = useState("");
  const [milestoneId, setMilestoneId] = useState("");
  const [targetCount, setTargetCount] = useState("10");
  const [file, setFile] = useState<File | null>(null);

  const [aiLoading, setAiLoading] = useState(false);
  const [txLoading, setTxLoading] = useState(false);
  const [aiResult, setAiResult] = useState<VerificationResponse | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setTxHash(null);
    setAiResult(null);
    setStatusMessage(null);

    if (!file) {
      setError("Please select an image to upload.");
      return;
    }

    if (!campaignId || !milestoneId) {
      setError("Campaign ID and Milestone ID are required.");
      return;
    }

    setAiLoading(true);
    setStatusMessage("AI Counting...");
    try {
      const formData = new FormData();
      formData.append("campaign_id", campaignId);
      formData.append("milestone_id", milestoneId);
      formData.append("target_count", targetCount);
      formData.append("file", file);

      const res = await fetch(`${AI_ENGINE_URL}/verify_upload`, {
        method: "POST",
        body: formData
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`AI verification failed: ${res.status} ${text}`);
      }

      const data: VerificationResponse = await res.json();
      setAiResult(data);

      if (data.status !== "success") {
        setError(
          `AI verification did not meet target. Detected ${data.detected_count} vs target ${data.target_count}.`
        );
        return;
      }

      if (!data.proof_signature) {
        throw new Error("AI did not return a proof_signature.");
      }

      setStatusMessage("Generating Proof...");

      // Proceed to blockchain step
      setTxLoading(true);
      setStatusMessage("On-Chain Confirmation...");

      if (typeof window === "undefined" || !(window as any).ethereum) {
        throw new Error("No Ethereum provider found. Please install MetaMask.");
      }

      const provider = new BrowserProvider((window as any).ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();

      const verifier = new Contract(
        DONATION_VERIFIER_ADDRESS,
        donationVerifierAbi,
        signer
      );

      const tx = await verifier.verifyAndRelease(
        BigInt(campaignId),
        BigInt(milestoneId),
        BigInt(data.detected_count ?? 0),
        BigInt(data.target_count ?? 0),
        data.proof_signature
      );

      setTxHash(tx.hash);
      const receipt = await tx.wait();

      if (receipt.status === 1n) {
        setSuccessMessage("Milestone successfully released on-chain.");
        setStatusMessage("Completed.");
      } else {
        setError("Transaction failed on-chain.");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      setAiLoading(false);
      setTxLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow-lg shadow-slate-950/40">
        <h2 className="text-2xl font-semibold tracking-tight">
          NGO Verification Flow
        </h2>
        <p className="mt-2 text-sm text-slate-300">
          Upload field evidence, let the AI verify counts, and trigger
          on-chain fund release in a single flow.
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-200">
                Campaign ID
              </label>
              <input
                className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-primary-500"
                value={campaignId}
                onChange={(e) => setCampaignId(e.target.value)}
                placeholder="e.g. 1"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-200">
                Milestone ID
              </label>
              <input
                className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-primary-500"
                value={milestoneId}
                onChange={(e) => setMilestoneId(e.target.value)}
                placeholder="e.g. 1"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-200">
                Target Count (blankets/bags)
              </label>
              <input
                className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-primary-500"
                type="number"
                min={0}
                value={targetCount}
                onChange={(e) => setTargetCount(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-200">
              Evidence Image
            </label>
            <input
              type="file"
              accept="image/*"
              className="text-xs text-slate-300 file:mr-3 file:rounded-md file:border-0 file:bg-primary-500 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-slate-950 hover:file:bg-primary-600"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <p className="mt-1 text-[11px] text-slate-500">
              The AI currently uses COCO &apos;handbag&apos; and &apos;backpack&apos; as
              proxies for blankets/bags.
            </p>
          </div>

          <button
            type="submit"
            disabled={aiLoading || txLoading}
            className="inline-flex items-center justify-center rounded-md bg-primary-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {aiLoading
              ? "AI Counting..."
              : txLoading
              ? "On-Chain Confirmation..."
              : "Verify & Release Funds"}
          </button>
        </form>

        {statusMessage && (
          <div className="mt-3 text-xs text-primary-300">
            Status: {statusMessage}
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-md border border-red-500/60 bg-red-950/40 px-3 py-2 text-xs text-red-100">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mt-4 rounded-md border border-emerald-500/60 bg-emerald-950/40 px-3 py-2 text-xs text-emerald-100">
            {successMessage}
          </div>
        )}

        {aiResult && (
          <div className="mt-4 rounded-md border border-slate-800 bg-slate-900/60 p-3 text-xs text-slate-200">
            <div className="mb-1 font-semibold text-slate-100">
              AI Verification Summary
            </div>
            <div className="flex flex-wrap gap-4">
              <div>
                <span className="font-medium">Model:</span> {aiResult.detections.model}
              </div>
              <div>
                <span className="font-medium">Detected:</span>{" "}
                {aiResult.detected_count}
              </div>
              <div>
                <span className="font-medium">Target:</span> {aiResult.target_count}
              </div>
              <div>
                <span className="font-medium">Status:</span>{" "}
                <span
                  className={
                    aiResult.status === "success"
                      ? "text-emerald-400"
                      : "text-amber-400"
                  }
                >
                  {aiResult.status}
                </span>
              </div>
            </div>
          </div>
        )}

        {txHash && (
          <div className="mt-3 text-[11px] text-slate-400">
            Tx hash:{" "}
            <span className="font-mono break-all text-slate-300">{txHash}</span>
          </div>
        )}
      </section>

      {(aiLoading || txLoading) && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/40 backdrop-blur-md">
          <div className="mx-4 max-w-sm rounded-2xl border border-slate-700/60 bg-slate-900/60 p-6 shadow-2xl shadow-slate-950/80">
            <div className="mb-3 text-xs font-medium uppercase tracking-wide text-primary-300">
              AI Agent is auditing evidence...
            </div>
            <p className="text-sm text-slate-200">
              We&apos;re securely counting blankets/bags and preparing a signed
              verification proof before touching your funds on-chain.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

