import type { Metadata } from "next";
import Link from "next/link";

import { Disclosures } from "@/components/public/Disclosures";

/**
 * /readiness — BRIDGE PAGE (founder direction 2026-07-17: readiness is not a
 * separate destination; it is folded into the property analysis).
 *
 * The readiness ENGINE (assessBorrowerReadiness + the governed assessment
 * runtime, Vol I–V obligations) is unchanged and still feeds the
 * deeper-analysis workspace: the readiness percent, missing items (they
 * drive the risks section), document recommendations, and the human-review
 * boundary all render there — in the context of an actual property, where
 * they mean something. The old standalone demo assessment (borrower-demo
 * IDs, a context-free percentage) is retired.
 *
 * This route stays alive because governed journey runtimes and runbooks name
 * it (discoveryRuntime, publicAlphaCustomerJourneyRuntime, pathwayEngine,
 * onboardingCore) — visitors who land here get oriented and routed, never a
 * dead link.
 */

export const metadata: Metadata = {
  title: "Readiness | Furlong",
  description:
    "Readiness lives inside your property analysis — missing items, document recommendations, and human review, in the context of a real property.",
};

const GOLD = "#d4b06a";

export default function ReadinessPage() {
  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "48px 24px 80px", display: "grid", gap: 20 }}>
      <section
        aria-label="Readiness moved into the property analysis"
        style={{
          background: "linear-gradient(180deg, #0c2233, #0a1b29 60%, #081521)",
          border: "1px solid #2c5876",
          borderRadius: 20,
          padding: "30px 28px",
          color: "#dce8ee",
          display: "grid",
          gap: 14,
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: GOLD }}>
          Readiness
        </span>
        <h1 style={{ margin: 0, fontSize: 26, lineHeight: 1.2, color: "#f2f7fa" }}>
          Readiness lives inside your property analysis now.
        </h1>
        <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.65, color: "#b7ccd9", maxWidth: "58ch" }}>
          There is no separate readiness score to chase. When you analyze a property, the deeper
          analysis carries your readiness in context — what is still missing, which documents are
          worth preparing and why each matters, and where human review picks up. Readiness about a
          real property beats readiness in the abstract.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link
            href="/discover"
            style={{
              display: "inline-flex",
              alignItems: "center",
              minHeight: 42,
              padding: "0 18px",
              borderRadius: 999,
              background: "#0f766e",
              color: "#ffffff",
              fontSize: 14,
              fontWeight: 800,
              textDecoration: "none",
            }}
          >
            Start with a property
          </Link>
          <Link
            href="/portal/borrower"
            style={{
              display: "inline-flex",
              alignItems: "center",
              minHeight: 42,
              padding: "0 18px",
              borderRadius: 999,
              border: "1px solid #2c5876",
              color: "#b7ccd9",
              fontSize: 14,
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            Already working with us? Your documents
          </Link>
        </div>
        <p style={{ margin: 0, fontSize: 12, lineHeight: 1.6, color: "#6f96ac" }}>
          Readiness signals are advisory and review-bound — never an approval, eligibility
          determination, certification, or public verification. Human review is required before any
          readiness signal is treated as a decision.
        </p>
      </section>

      <Disclosures variant="compact" />
    </main>
  );
}
