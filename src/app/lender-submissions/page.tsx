import Link from "next/link";

import { Disclosures } from "@/components/public/Disclosures";

const steps = [
  ["1", "Build package", "Freeze the selected records into a stable, hashed package."],
  ["2", "Human review", "Review the exact package. Any change creates a new version."],
  ["3", "Customer consent", "The customer approves that version, lender, recipient scope, purpose, and channel."],
  ["4", "Verify recipient", "Confirm the lender destination out of band; raw addresses are never dispatch inputs."],
  ["5", "Sandbox delivery", "Run all thirteen gates and test delivery without contacting a lender."],
];

export default function LenderSubmissionsPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-slate-100">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div><p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-300">Governed lender submission</p><h1 className="mt-2 text-4xl font-semibold">Prepare the exact package before anything leaves Furlong.</h1><p className="mt-4 max-w-3xl text-slate-300">Packages are immutable, customer-approved, recipient-verified, replayable, and currently limited to sandbox testing.</p></div>
          <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-4 py-2 text-sm font-semibold text-amber-200">LIVE DELIVERY BLOCKED</span>
        </div>
        <section className="grid gap-4 md:grid-cols-5">{steps.map(([number, title, text]) => <article key={number} className="rounded-2xl border border-slate-800 bg-slate-900 p-5"><div className="mb-4 flex h-9 w-9 items-center justify-center rounded-full bg-emerald-400/15 font-semibold text-emerald-300">{number}</div><h2 className="font-semibold">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-400">{text}</p></article>)}</section>
        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6"><h2 className="text-xl font-semibold">Current safety posture</h2><div className="mt-4 grid gap-3 sm:grid-cols-3"><p className="rounded-xl bg-slate-950 p-4 text-sm"><span className="block font-semibold text-emerald-300">Available now</span>Build, preview, review, consent, recipient verification, authorization, and simulated delivery.</p><p className="rounded-xl bg-slate-950 p-4 text-sm"><span className="block font-semibold text-amber-300">Human checkpoint</span>No dispatch authorization without an explicit human package review.</p><p className="rounded-xl bg-slate-950 p-4 text-sm"><span className="block font-semibold text-rose-300">Not available</span>Live lender delivery, production credentials, or external network calls.</p></div></section>
        <div className="mt-8"><Disclosures variant="full" tone="dark" showManifesto={false} /></div>
        <div className="mt-8 flex gap-3"><Link href="/lender-desk" className="rounded-lg bg-emerald-400 px-4 py-2 font-semibold text-slate-950">Return to lender desk</Link><Link href="/governance" className="rounded-lg border border-slate-700 px-4 py-2 font-semibold">Review governance</Link></div>
      </div>
    </main>
  );
}
