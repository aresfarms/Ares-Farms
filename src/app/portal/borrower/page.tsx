import type { Metadata } from "next";
import Link from "next/link";

import { Disclosures } from "@/components/public/Disclosures";

/**
 * /portal/borrower — Borrower Portal (Build 53)
 *
 * Public placeholder. Borrower Portal is pending Alpha activation.
 * Internal module list removed. Clean public surface only.
 * Per Build 53 public surface remediation.
 *
 * Required content tokens (Customer Journey §6):
 *   - four-stage escalation: Exploration, Human Review, Lender Engagement, Application Submission
 *   - five reviewer roles (Borrower Intake Reviewer, Document Verification Reviewer,
 *     Qualified Governance Reviewer, Data Rights Officer, Chief Governance Authority)
 *   - next-step guidance
 *
 * Governance:
 *   - No approval, eligibility, or official-determination language.
 *   - Public Alpha remains PENDING.
 *   - "The map reveals opportunities, not the visitor."
 */

export const metadata: Metadata = {
  title:       "Borrower Portal | Furlong",
  description: "The Furlong Borrower Portal is pending Alpha activation. Explore the map while you wait.",
};

const container = {
  maxWidth: 720,
  margin:   "0 auto",
  padding:  "48px 24px 80px",
  display:  "grid",
  gap:      24,
} as const;

const whitePanel = {
  background:   "#ffffff",
  border:       "1px solid #d7deea",
  borderRadius: 14,
  padding:      "24px 28px",
  display:      "grid",
  gap:          12,
} as const;

const muted = {
  color:      "#5d687a",
  lineHeight: 1.65,
} as const;

export default function BorrowerPortalPage() {
  return (
    <main>
      <div style={container}>

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <header style={{ display: "grid", gap: 10 }}>
          <h1 style={{ margin: 0, fontSize: 34, fontWeight: 800, letterSpacing: -0.02, lineHeight: 1.12, color: "#162033" }}>
            Borrower Portal
          </h1>
          <p style={{ margin: 0, fontSize: 18, ...muted }}>
            Borrower Portal is pending Alpha activation.
          </p>
        </header>

        {/* ── Pending message ──────────────────────────────────────────────── */}
        <section style={whitePanel} aria-label="Portal pending activation">
          <p style={{ margin: 0, fontSize: 16, ...muted }}>
            When available, the Borrower Portal is where your exploration
            continues — reviewing pathways, understanding readiness, and
            choosing whether to take the next step. Until then, you can explore
            the full map of possibilities without an account.
          </p>
          <Link
            href="/onboarding"
            style={{
              display:        "inline-flex",
              justifyContent: "center",
              alignItems:     "center",
              minHeight:      48,
              padding:        "0 22px",
              borderRadius:   999,
              background:     "#0f766e",
              color:          "#ffffff",
              fontWeight:     800,
              textDecoration: "none",
              fontSize:       16,
            }}
          >
            Explore Your Possibilities →
          </Link>
        </section>

        {/* ── How the process works ────────────────────────────────────────── */}
        {/* Required: four-stage escalation (Exploration, Human Review,
            Lender Engagement, Application Submission) per CJ §6 */}
        <section style={whitePanel} aria-label="How the process works">
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#162033" }}>
            How the process works — when you're ready
          </h2>
          <p style={{ margin: 0, fontSize: 15, ...muted }}>
            You decide when your information moves between stages. Furlong will never
            silently advance your information.
          </p>
          <ol style={{ margin: 0, paddingLeft: 22, color: "#162033", lineHeight: 1.8, display: "grid", gap: 4 }}>
            <li><strong>Exploration</strong> — Browse the map. No account. No personal information required.</li>
            <li><strong>Human Review</strong> — When you choose, a named human reviewer looks at your readiness before anything moves forward.</li>
            <li><strong>Lender Engagement</strong> — Only with your permission does any information reach a lender.</li>
            <li><strong>Application Submission</strong> — You decide if and when to proceed with a formal application.</li>
          </ol>
          <p style={{ margin: 0, fontSize: 14, ...muted }}>
            Whatever you do next is your decision. We will tell you what we recommend,
            what the trade-offs are, and what the next stage requires.
          </p>
        </section>

        {/* ── Available review paths ───────────────────────────────────────── */}
        {/* Required: five reviewer roles per CJ §6 + Vol VII Operational Annex */}
        <section style={whitePanel} aria-label="Available review paths">
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#162033" }}>
            Available review paths
          </h2>
          <p style={{ margin: 0, fontSize: 15, ...muted }}>
            Every review that affects you lands on a named, credentialed human.
          </p>
          <ul style={{ margin: 0, paddingLeft: 22, color: "#162033", lineHeight: 1.8, display: "grid", gap: 4 }}>
            <li><strong>Borrower intake review</strong> — Borrower Intake Reviewer</li>
            <li><strong>Document review</strong> — Document Verification Reviewer</li>
            <li><strong>Independent governance review</strong> — Qualified Governance Reviewer</li>
            <li><strong>Data-rights fulfillment</strong> — Data Rights Officer</li>
            <li><strong>Final authority decisions</strong> — Chief Governance Authority</li>
          </ul>
        </section>

        {/* ── Advisory disclosure ──────────────────────────────────────────── */}
        <section
          style={{
            background:   "#f8fafc",
            border:       "1px solid #d7deea",
            borderRadius: 14,
            padding:      "20px 24px",
            display:      "grid",
            gap:          8,
          }}
          aria-label="Advisory disclosure"
        >
          {/* Canonical disclosures — single source of truth (see Disclosures.tsx). */}
          <Disclosures variant="full" />
        </section>

        {/* Page-level footer: contextual CTA only. Site nav is in the layout header/footer. */}
        <div style={{ paddingTop: 8 }}>
          <Link
            href="/onboarding"
            style={{ color: "#0f766e", fontSize: 14, fontWeight: 700, textDecoration: "none" }}
          >
            Explore Your Possibilities →
          </Link>
        </div>

      </div>
    </main>
  );
}
