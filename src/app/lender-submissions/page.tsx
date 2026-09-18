import Link from "next/link";

import { Disclosures } from "@/components/public/Disclosures";

const steps = [
  ["1", "Freeze one financing-readiness package", "The records selected for handoff become one stable, hashed package. Any change creates a new version."],
  ["2", "Review exactly what will leave", "The customer and required human reviewer see the exact package before consent. Nothing is inferred from an earlier version."],
  ["3", "Name the provider and recipient", "Consent binds one package version, one provider, one verified recipient, one purpose, one channel, and an expiry."],
  ["4", "Verify the destination", "Furlong confirms the destination out of band. Raw email addresses are never treated as dispatch authority by themselves."],
  ["5", "Open the case room", "The named provider can access only the consent-bound package. Revocation and expiry fail closed; every access and delivery event is replayable."],
] as const;

export default function LenderSubmissionsPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-slate-100">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-300">Furlong Case Room</p>
            <h1 className="mt-2 text-4xl font-semibold">You choose exactly what leaves Furlong — and exactly who can receive it.</h1>
            <p className="mt-4 max-w-3xl text-slate-300">This is the managed handoff between your financing-readiness file and a named provider. Comparing providers sends nothing. A package moves only after exact-version review, consent, and recipient verification.</p>
          </div>
          <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-4 py-2 text-sm font-semibold text-amber-200">TESTING · LIVE EXTERNAL DELIVERY BLOCKED</span>
        </div>

        <section className="grid gap-4 md:grid-cols-5">
          {steps.map(([number, title, text]) => (
            <article key={number} className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-full bg-emerald-400/15 font-semibold text-emerald-300">{number}</div>
              <h2 className="font-semibold">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
            </article>
          ))}
        </section>

        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-xl font-semibold">What is working in the controlled build</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <p className="rounded-xl bg-slate-950 p-4 text-sm"><span className="block font-semibold text-emerald-300">Package controls</span>Build, preview, human review, exact-version customer consent, recipient verification, dispatch authorization, and simulated delivery.</p>
            <p className="rounded-xl bg-slate-950 p-4 text-sm"><span className="block font-semibold text-emerald-300">Access controls</span>Borrower ownership, named-provider binding, package-version binding, and fail-closed revocation/expiry are enforced.</p>
            <p className="rounded-xl bg-slate-950 p-4 text-sm"><span className="block font-semibold text-amber-300">Still gated</span>Live external delivery credentials and network calls stay blocked until the controlled promotion and assurance gates pass.</p>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-emerald-400/25 bg-emerald-400/5 p-6">
          <h2 className="text-xl font-semibold">The provider does not have to adopt Furlong as its loan system.</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">The case room is an interoperability boundary: the provider receives access to the exact customer-authorized package and can return status or requested follow-up without moving its own underwriting authority into Furlong. The lender or agency remains the decision-maker.</p>
        </section>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/capital-network" className="rounded-lg bg-emerald-400 px-4 py-2 font-semibold text-slate-950">Compare verified providers</Link>
          <Link href="/portal/borrower" className="rounded-lg border border-slate-700 px-4 py-2 font-semibold">Return to My Furlong</Link>
        </div>
        <div className="mt-8"><Disclosures variant="full" tone="dark" showManifesto={false} /></div>
      </div>
    </main>
  );
}
