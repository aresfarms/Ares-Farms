import Link from "next/link";

import { accentForLane } from "@/lib/property/laneThemes";

/**
 * HundredPercentFinancingCallout — a cross-lane cue that 100% (no-money-down)
 * financing genuinely exists for some buyers and programs (USDA, VA, and select
 * SBA/farm structures), routing to the licensed lender. Founder direction
 * 2026-07-19 (per Stuart, these are real). Honest + hedged: "possible for some,"
 * never a promise or a qualification; the licensed lender confirms fit.
 *
 * Master Volume Governance: FACILITATION-001 — facilitate, not decide; routes
 * to the licensed lender, makes no credit determination.
 */

const PURPLE = accentForLane("financing-capital", "light"); // #534AB7

export function HundredPercentFinancingCallout() {
  return (
    <Link
      href="/explore?lane=financing-capital"
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
        0% DOWN
      </span>
      <span style={{ display: "grid", gap: 2 }}>
        <strong style={{ fontSize: 14.5, color: "#101a2b", lineHeight: 1.3 }}>
          100% financing is possible for some buyers.
        </strong>
        <span style={{ fontSize: 12.5, color: "#4d596d", lineHeight: 1.45 }}>
          No-money-down programs exist (USDA, VA, and select structures). Talk with our licensed lender
          to see if one fits your situation →
        </span>
      </span>
    </Link>
  );
}
