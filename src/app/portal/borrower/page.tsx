import type { Metadata } from "next";

import { MyFurlongDashboard } from "@/components/borrower/MyFurlongDashboard";
import { Disclosures } from "@/components/public/Disclosures";

export const metadata: Metadata = {
  title: "My Furlong | Properties, Readiness & Capital",
  description: "Keep the properties you are exploring, reopen analysis, compare verified providers, and control any financing handoff.",
};

const reviewPaths = [
  ["Borrower intake", "Borrower Intake Reviewer"],
  ["Document review", "Document Verification Reviewer"],
  ["Independent governance review", "Qualified Governance Reviewer"],
  ["Data-rights fulfillment", "Data Rights Officer"],
  ["Final authority decisions", "Chief Governance Authority"],
] as const;

export default function BorrowerPortalPage() {
  return (
    <main style={{ maxWidth: 1040, margin: "0 auto", padding: "42px 24px 80px", display: "grid", gap: 28 }}>
      <MyFurlongDashboard />

      <section aria-labelledby="handoff-control-heading" style={{ border: "1px solid #cbd5e1", borderRadius: 16, background: "#fff", padding: 20, display: "grid", gap: 14 }}>
        <div style={{ display: "grid", gap: 6 }}>
          <span style={{ color: "#0f766e", fontSize: 11, fontWeight: 850, letterSpacing: ".12em", textTransform: "uppercase" }}>You control the handoff</span>
          <h2 id="handoff-control-heading" style={{ margin: 0, color: "#162033", fontSize: 22 }}>Nothing moves to a human or lender silently.</h2>
          <p style={{ margin: 0, color: "#526074", lineHeight: 1.65 }}>
            Users decide when information moves from Exploration → Human Review → Lender Engagement → Application Submission. Furlong may recommend escalation but will not silently perform escalation.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 9 }}>
          {reviewPaths.map(([path, reviewer]) => (
            <article key={reviewer} style={{ border: "1px solid #e2e8f0", borderRadius: 11, padding: "11px 12px", display: "grid", gap: 3 }}>
              <strong style={{ color: "#162033", fontSize: 13.5 }}>{path}</strong>
              <span style={{ color: "#64748b", fontSize: 12.5 }}>{reviewer}</span>
            </article>
          ))}
        </div>

        <p style={{ margin: 0, color: "#526074", lineHeight: 1.65 }}>
          Whatever you do next is your decision. We will tell you what we recommend, what the trade-offs are, and what the next stage requires. Each escalation lands on a named, credentialed human; authority assignments are recorded in the operational authority registry.
        </p>
      </section>

      <Disclosures variant="full" />
    </main>
  );
}
