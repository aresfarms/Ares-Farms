"use client";

/**
 * FarmAgricultureTab — the farm lane's Agriculture tab content (founder
 * request 2026-07-28: "best crop, orchard, hay crop, flower, vines, etc. for
 * growing here ... one crop or diversify?"; 2026-08-12: replace the ranked
 * cards with a living pro-forma — a coverage verdict up top, then a numbers
 * table with per-enterprise economics that recompute as the visitor changes
 * inputs, so the answer to "can this land pay for itself?" is prominent).
 *
 * When the parcel's economics (acreage + price + soil) are resolved, the
 * living pro-forma leads. The older ranked-options fallback still renders when
 * only the qualitative best-use is available. Advisory screening only.
 */

import type { FarmBestUse } from "@/lib/property/farmAnswerEngine";
import { FarmLivingProForma, type FarmLivingProFormaProps } from "@/components/property/FarmLivingProForma";

const card = { background: "#fff", border: "1px solid #E5E0D5", borderRadius: 14, padding: "16px 18px" } as const;

const TIER_STYLE: Record<string, { label: string; bg: string; ink: string }> = {
  best: { label: "BEST FIT", bg: "#1C4532", ink: "#ffffff" },
  strong: { label: "STRONG", bg: "#E7F0E9", ink: "#1C4532" },
  possible: { label: "POSSIBLE", bg: "#FFF9E8", ink: "#8F6E1F" },
  marginal: { label: "MARGINAL", bg: "#F3F4F6", ink: "#6B7280" },
};

const disclaimer = (
  <p style={{ margin: 0, color: "#6B7280", fontSize: 11.5, lineHeight: 1.6 }}>
    Screening guidance from public data (USDA-NRCS soil survey, USDA NASS county yields and rents,
    market-access signals) — not an agronomic prescription, eligibility finding, or income guarantee.
    Zoning, water rights, and an actual buyer for each crop still control; the county extension office
    and NRCS field staff are the free first calls before committing acreage.
  </p>
);

export function FarmAgricultureTab({
  bestUse,
  proForma,
}: {
  bestUse: FarmBestUse | null;
  proForma?: FarmLivingProFormaProps | null;
}) {
  // Living pro-forma leads whenever the parcel economics are resolved.
  if (proForma) {
    return (
      <>
        {bestUse && (
          <section style={{ ...card, display: "grid", gap: 8 }}>
            <span style={{ fontSize: 10.5, fontWeight: 850, letterSpacing: ".14em", textTransform: "uppercase", color: "#8F6E1F" }}>
              What this ground grows best
            </span>
            <p style={{ margin: 0, color: "#3d4655", fontSize: 13.5, lineHeight: 1.65 }}>{bestUse.headline}</p>
          </section>
        )}
        <div style={card}>
          <FarmLivingProForma {...proForma} />
        </div>
        {disclaimer}
      </>
    );
  }

  if (!bestUse) {
    return (
      <div style={card}>
        The growing analysis needs the parcel&apos;s soil and county context — it appears once the
        property facts finish resolving for a farm-shaped parcel.
      </div>
    );
  }

  // Fallback: qualitative best-use when economics aren't resolved yet.
  const advice = bestUse.portfolioAdvice;
  return (
    <>
      <section style={{ ...card, display: "grid", gap: 8 }}>
        <span style={{ fontSize: 10.5, fontWeight: 850, letterSpacing: ".14em", textTransform: "uppercase", color: "#8F6E1F" }}>
          What this ground grows best
        </span>
        <p style={{ margin: 0, color: "#3d4655", fontSize: 13.5, lineHeight: 1.65 }}>{bestUse.headline}</p>
      </section>

      <section
        aria-label="One crop or diversify"
        style={{ ...card, borderColor: advice.verdict === "diversify" ? "#B08A2E" : "#1C4532", background: advice.verdict === "diversify" ? "#FFF9E8" : "#F0F7F2", display: "grid", gap: 8 }}
      >
        <span style={{ fontSize: 10.5, fontWeight: 850, letterSpacing: ".14em", textTransform: "uppercase", color: advice.verdict === "diversify" ? "#8F6E1F" : "#1C4532" }}>
          One crop, or diversify?
        </span>
        <strong style={{ color: "#1C2B45", fontSize: 16, lineHeight: 1.4 }}>{advice.title}</strong>
        <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 5 }}>
          {advice.reasons.map((reason) => (
            <li key={reason} style={{ color: "#4d596d", fontSize: 12.5, lineHeight: 1.6 }}>{reason}</li>
          ))}
        </ul>
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 10 }}>
        {bestUse.options.map((option, index) => {
          const tier = TIER_STYLE[option.tier] ?? TIER_STYLE.marginal;
          return (
            <article key={option.name} style={{ ...card, borderColor: index === 0 ? "#1C4532" : "#E5E0D5", display: "grid", gap: 7, alignContent: "start" }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ fontSize: 9.5, fontWeight: 850, letterSpacing: ".1em", padding: "3px 9px", borderRadius: 999, background: tier.bg, color: tier.ink }}>{tier.label}</span>
                <strong style={{ color: "#1C2B45", fontSize: 14.5 }}>{index + 1}. {option.name}</strong>
              </div>
              <span style={{ color: "#8F6E1F", fontSize: 12, fontWeight: 750 }}>{option.grossPerAcre}</span>
              <p style={{ margin: 0, color: "#5A6172", fontSize: 12.5, lineHeight: 1.6 }}>{option.why}</p>
            </article>
          );
        })}
      </div>

      {disclaimer}
    </>
  );
}
