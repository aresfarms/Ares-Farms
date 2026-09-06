import Link from "next/link";

import { accentForLane } from "@/lib/property/laneThemes";

/**
 * HundredPercentFinancingCallout — a cross-lane cue that some federal/agricultural
 * structures can materially reduce borrower equity needs. It routes to the Capital Desk
 * for comparison only; it is never a promise, qualification, or credit determination.
 *
 * Master Volume Governance: FACILITATION-001 — facilitate, not decide; routes
 * to the Capital Desk, which makes no credit determination.
 */

const PURPLE = accentForLane("financing-capital", "light"); // #534AB7

export function HundredPercentFinancingCallout() {
  return (
    <Link
      // Straight to the LENDER INTAKE FORM (founder 2026-07-29: not the
      // address form, not the lane page — the "Submit your financing deal"
      // panel itself).
      href="/explore?lane=financing-capital#lender-intake"
      style={{
        display: "flex",
        gap: 14,
        alignItems: "center",
        textDecoration: "none",
        border: `1.5px solid ${PURPLE}`,
        background: "#f3f2fc",
        borderRadius: 14,
        padding: "14px 16px",
      }}
    >
      <span
        style={{
          flexShrink: 0,
          fontSize: 11.5,
          fontWeight: 900,
          letterSpacing: "0.06em",
          color: "#ffffff",
          background: PURPLE,
          borderRadius: 999,
          padding: "5px 11px",
          whiteSpace: "nowrap",
        }}
      >
        LOWER EQUITY
      </span>
      <span style={{ display: "grid", gap: 2 }}>
        <strong style={{ fontSize: 14.5, color: "#101a2b", lineHeight: 1.3 }}>
          Some programs can substantially reduce upfront equity.
        </strong>
        <span style={{ fontSize: 12.5, color: "#4d596d", lineHeight: 1.45 }}>
          USDA, FSA, SBA, and other structures can differ sharply in equity requirements. Compare the published pathways in the Capital Desk; the funding institution confirms what actually applies →
        </span>
      </span>
    </Link>
  );
}
