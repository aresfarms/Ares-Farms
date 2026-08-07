import Link from "next/link";

import { SIGNATURE_BLOCKER_CODES } from "@/lib/signature-execution/blockers";
import { SIGNATURE_EXECUTION_DOCTRINE, SIGNATURE_EXECUTION_STATES } from "@/lib/signature-execution/doctrine";

export const metadata = { title: "Signature execution readiness | Furlong" };

export default function SignatureExecutionsPage() {
  return (
    <main className="min-h-screen bg-[#f5f2ea] px-6 py-12 text-[#1c2b45]">
      <div className="mx-auto max-w-5xl space-y-8">
        <Link href="/" className="text-sm underline underline-offset-4">← Return to Furlong</Link>
        <header className="rounded-2xl border border-[#c8b88a] bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#8b641f]">Governed execution readiness</p>
          <h1 className="mt-3 text-4xl font-semibold">Signature execution is in offline validation</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-[#46536a]">
            Furlong now builds one PDF containing the instrument and its execution evidence. Live signing and delivery remain blocked until legal, identity, provider, privacy, review, and production-promotion controls are approved.
          </p>
          <div className="mt-6 inline-flex rounded-full bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-900">No legally operative signatures are accepted</div>
        </header>
        <section className="grid gap-5 md:grid-cols-3">
          {[
            ["Furlong-authored documents", "Only certified, versioned signature zones may be used."],
            ["Third-party documents", "Original pages remain intact; a governed execution page is appended inside the same PDF."],
            ["Evidence and truth", "Consent, intent, capture, execution, delivery, and acknowledgment stay separate."],
          ].map(([title, body]) => <article key={title} className="rounded-xl border border-[#d9d2c2] bg-white p-6"><h2 className="font-semibold">{title}</h2><p className="mt-2 leading-7 text-[#5b6474]">{body}</p></article>)}
        </section>
        <section className="rounded-2xl border border-[#d9d2c2] bg-white p-8">
          <h2 className="text-2xl font-semibold">What the gate checks</h2>
          <p className="mt-2 text-[#5b6474]">Any missing, stale, conflicting, unknown, or failed control stops execution.</p>
          <dl className="mt-6 grid gap-3 sm:grid-cols-2">
            <div><dt className="font-semibold">Doctrine</dt><dd className="text-sm text-[#5b6474]">{SIGNATURE_EXECUTION_DOCTRINE.canonicalId}</dd></div>
            <div><dt className="font-semibold">Current mode</dt><dd className="text-sm text-[#5b6474]">Offline mock validation only</dd></div>
            <div><dt className="font-semibold">Truth states</dt><dd className="text-sm text-[#5b6474]">{SIGNATURE_EXECUTION_STATES.length} explicit states</dd></div>
            <div><dt className="font-semibold">Blocker vocabulary</dt><dd className="text-sm text-[#5b6474]">{SIGNATURE_BLOCKER_CODES.length} canonical blocker codes</dd></div>
          </dl>
        </section>
      </div>
    </main>
  );
}
