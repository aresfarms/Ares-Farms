/**
 * CommercialRatesBlock — current capital rates for the Commercial lane (founder
 * direction 2026-07-18: show current SBA and USDA rates next to the map, under
 * live listings, with the honest note that the binding rate is set at the loan's
 * closing date). Compact for the column beside the map. Teal (commercial)
 * identity. Server component; not a rate offer.
 */

import { COMMERCIAL_CAPITAL_RATES } from "@/lib/property/commercialLaneCurated";
import { LANE_THEMES } from "@/lib/property/laneThemes";

const COM = LANE_THEMES.commercial;

export function CommercialRatesBlock() {
  const r = COMMERCIAL_CAPITAL_RATES;
  return (
    <section aria-label="Current capital rates" style={{ display: "grid", gap: 10 }}>
      <div style={{ display: "grid", gap: 3 }}>
        <span style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: COM.accent }}>
          Today&apos;s capital rates
        </span>
        <strong style={{ fontSize: 17, color: "#101a2b", lineHeight: 1.15 }}>SBA, USDA &amp; commercial financing</strong>
        <span style={{ fontSize: 11.5, color: "#7a8aa0" }}>As of {r.asOf} · your rate is set at your loan&apos;s closing</span>
      </div>

      <div style={{ border: "1px solid #d7deea", background: "#ffffff", borderRadius: 14, padding: "12px 14px", display: "grid", gap: 9 }}>
        {r.lines.map((line) => (
          <div key={line.program} style={{ display: "grid", gap: 2, borderTop: "1px solid #eef2f6", paddingTop: 9 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
              <strong style={{ fontSize: 13, color: "#101a2b" }}>{line.program}</strong>
              {line.current && (
                <span style={{ fontSize: 12.5, fontWeight: 800, color: COM.accent, whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>{line.current}</span>
              )}
            </div>
            <span style={{ fontSize: 12, color: "#4d596d", lineHeight: 1.45 }}>{line.basis}</span>
          </div>
        ))}
      </div>

      <span style={{ fontSize: 11, color: "#9aa6b6", lineHeight: 1.5 }}>{r.note}</span>
    </section>
  );
}
