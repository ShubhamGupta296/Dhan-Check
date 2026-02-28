import "./globals.css";
import type { ReactNode } from "react";
import Link from "next/link";

export const metadata = {
  title: "Dhan-Check",
  description: "Proof-of-Donation platform with AI verification and on-chain proofs."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-50">
        <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-6">
          <header className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-500 text-slate-950 font-bold">
                DC
              </div>
              <div>
                <h1 className="text-xl font-semibold tracking-tight">Dhan-Check</h1>
                <p className="text-xs text-slate-400">
                  Proof-of-Donation with AI-verified impact.
                </p>
              </div>
            </div>
            <nav className="flex items-center gap-4 text-xs text-slate-400">
              <Link href="/" className="hover:text-primary-400">
                Overview
              </Link>
              <Link href="/ngo-verify" className="hover:text-primary-400">
                NGO Verification
              </Link>
            </nav>
          </header>
          <main className="flex-1">{children}</main>
          <footer className="mt-8 border-t border-slate-800 pt-4 text-xs text-slate-500">
            Built with FastAPI · Next.js · Hardhat · Polygon · IPFS
          </footer>
        </div>
      </body>
    </html>
  );
}

