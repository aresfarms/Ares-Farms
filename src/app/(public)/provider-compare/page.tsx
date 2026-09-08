import type { Metadata } from "next";
import Link from "next/link";

import { CustomerJourneyBar } from "@/components/borrower/CustomerJourneyBar";
import { Disclosures } from "@/components/public/Disclosures";
import { FINANCING_FREE_STATEMENT } from "@/lib/financing/financingFeeSchedule";

export const metadata: Metadata = {
  title: "Compare Verified Financing Providers | Furlong",
  description: "How Furlong compares source-verified provider credit boxes without lead selling, paid ranking, or silent file delivery.",
};

export default function ProviderComparePage() {
  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: "42px 24px 80px", display: "grid", gap: 24 }}>
      <header style={{ display: "grid", gap: 10 }}>
        <span style={{ fontSize: 12, fontWeight: 850, letterSpacing: "0.1em", textTransform: "uppercase", color: "#534ab7" }}>Furlong Capital Network</span>
        <h1 style={{ margin: 0, color: "#162033", fontSize: "clamp(31px,5vw,48px)", lineHeight: 1.06 }}>Compare providers only after Furlong has enough verified information to explain the fit.</h1>
        <p style={{ margin: 0, maxWidth: 800, color: "#526074", fontSize: 16.5, lineHeight: 1.65 }}>
          Furlong compares a financing request with source-verified published provider credit boxes. Affiliation, license fees, subscriptions, referral economics, and other compensation do not increase a provider&apos;s score or rank. If a published box is not verified, Furlong does not present that provider as a transaction fit.
        </p>
      </header>

      <CustomerJourneyBar current="finance" financeHref="/provider-compare" />

      <section style={{ border: "1px solid #b9e3d4", background: "#f4fbf8", borderRadius: 16, padding: "18px 20px", display: "grid", gap: 8 }}>
        <strong style={{ color: "#0f6e56" }}>{FINANCING_FREE_STATEMENT.lead}</strong>
        <span style={{ color: "#3b475a", lineHeight: 1.6 }}>{FINANCING_FREE_STATEMENT.body}</span>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 12 }}>
        <article style={card}><strong style={title}>1. Build the readiness file</strong><span style={body}>Start with the property/project and the financing path worth testing. Furlong records the deal facts used for provider comparison; the lender still owns credit and eligibility decisions.</span><Link href="/explore?lane=financing-capital" style={link}>Start financing readiness →</Link></article>
        <article style={card}><strong style={title}>2. Review verified provider fit</strong><span style={body}>Once you have a financing reference, Check Status shows eligible verified providers and why the published box fits. Comparing or selecting a provider does not share your file.</span><Link href="/status" style={link}>I already have a Furlong reference →</Link></article>
        <article style={card}><strong style={title}>3. Compare the actual structure</strong><span style={body}>When a lender gives terms, compare cash equity, payment, debt service, DSCR, interest through term, and balloon exposure instead of looking at rate alone.</span><Link href="/financing-compare" style={link}>Compare financing terms →</Link></article>
      </section>

      <section style={{ border: "1px solid #ead8aa", background: "#fffaf0", borderRadius: 16, padding: "18px 20px", display: "grid", gap: 8 }}>
        <strong style={{ color: "#854f0b" }}>A match is not a submission and it is not an approval.</strong>
        <span style={{ color: "#526074", lineHeight: 1.6 }}>The customer chooses each recipient. Before a provider receives anything, Furlong freezes the exact package, obtains separate exact-recipient consent, verifies recipient authority, and opens an expiring provider-specific case room. Revocation and expiry fail closed.</span>
      </section>

      <Disclosures variant="full" />
    </main>
  );
}

const card = { border: "1px solid #d7deea", borderRadius: 16, background: "#fff", padding: "18px 20px", display: "grid", gap: 9 } as const;
const title = { color: "#162033", fontSize: 16 } as const;
const body = { color: "#526074", fontSize: 13.5, lineHeight: 1.6 } as const;
const link = { color: "#0f766e", fontWeight: 800, fontSize: 13.5 } as const;
