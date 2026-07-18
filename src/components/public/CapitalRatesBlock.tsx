/**
 * CapitalRatesBlock — SBA / prime / 504 / USDA capital rates, shared by the
 * commercial and farm lanes (founder direction 2026-07-18). Compact for the
 * column beside the map. Accent is passed per lane (teal for commercial, green
 * for farm). Server component; not a rate offer.
 */

import { buildCapitalRates } from "@/lib/property/capitalRatesCurated";

export function CapitalRatesBlock({ accent, subtitle }: { accent: string; subtitle?: string }) {
  const r = buildCapitalRates();
  return (
    <section aria-label="Current capital rates" style={{ display: "grid", gap: 10 }}>
      <div style={{ display: "grid", gap: 3 }}>
        <span style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: accent }}>
          Today&apos;s capital rates
        </span>
        <strong style={{ fontSize: 17, color: "#101a2b", lineHeight: 1.15 }}>{subtitle ?? "SBA, USDA & commercial financing"}</strong>
        <span style={{ fontSize: 11.5, color: "#7a8aa0" }}>As of {r.asOf} · your rate is set at your loan&apos;s closing</span>
      </div>

      <div style={{ border: "1px solid #d7deea", background: "#ffffff", borderRadius: 14, padding: "12px 14px", display: "grid", gap: 9 }}>
        {r.lines.map((line) => (
          <div key={line.program} style={{ display: "grid", gap: 2, borderTop: "1px solid #eef2f6", paddingTop: 9 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
              <strong style={{ fontSize: 13, color: "#101a2b" }}>{line.program}</strong>
              {line.current && (
                <span style={{ fontSize: 12.5, fontWeight: 800, color: accent, whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>{line.current}</span>
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
