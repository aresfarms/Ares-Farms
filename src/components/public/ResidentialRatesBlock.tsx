/**
 * ResidentialRatesBlock — current residential mortgage rates that track and
 * change as rates move (founder direction 2026-07-18), for the Residential
 * lane. Two live benchmark rates (PMMS 30- and 15-year fixed) up top, then the
 * applicable loan options with structure. Server component; every figure
 * sourced and labeled — not a rate offer.
 */

import { buildResidentialRates } from "@/lib/property/residentialRatesCurated";

const card = {
  border: "1px solid #d7deea",
  background: "#ffffff",
  borderRadius: 14,
  padding: "14px 15px",
} as const;

export function ResidentialRatesBlock() {
  const view = buildResidentialRates();
  return (
    <section aria-label="Current residential mortgage rates" style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "grid", gap: 4 }}>
          <span style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "#0f766e" }}>
            Today&apos;s mortgage rates
          </span>
          <strong style={{ fontSize: 22, color: "#101a2b", lineHeight: 1.15 }}>
            What it costs to borrow right now
          </strong>
        </div>
        {view.weekOf && (
          <span style={{ fontSize: 12, color: "#7a8aa0" }}>Tracks Freddie Mac PMMS · week of {view.weekOf}</span>
        )}
      </div>

      {/* The two live benchmark rates */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
        <div style={{ ...card, background: "#0f2430", border: "1px solid #0f2430", display: "grid", gap: 2, minWidth: 180, flex: "1 1 180px" }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: "#7fa8b8" }}>
            30-year fixed
          </span>
          <strong style={{ fontSize: 30, color: "#eaf3f7", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
            {view.rate30.toFixed(2)}%
          </strong>
          <span style={{ fontSize: 11.5, color: "#7fa8b8" }}>Freddie Mac national average</span>
        </div>
        {view.rate15 != null && (
          <div style={{ ...card, background: "#0f2430", border: "1px solid #0f2430", display: "grid", gap: 2, minWidth: 180, flex: "1 1 180px" }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: "#7fa8b8" }}>
              15-year fixed
            </span>
            <strong style={{ fontSize: 30, color: "#eaf3f7", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
              {view.rate15.toFixed(2)}%
            </strong>
            <span style={{ fontSize: 11.5, color: "#7fa8b8" }}>Higher payment, less total interest</span>
          </div>
        )}
      </div>

      {/* The applicable loan options */}
      <div style={{ ...card, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: "left", color: "#708997" }}>
              {["Loan option", "Rate", "Down", "Mortgage insurance", "Who it's for"].map((h) => (
                <th key={h} style={{ padding: "0 12px 8px 0", fontWeight: 600, fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {view.options.map((o) => (
              <tr key={o.name} style={{ borderTop: "1px solid #e5ebef", verticalAlign: "top" }}>
                <td style={{ padding: "9px 12px 9px 0", fontWeight: 700, color: "#101a2b" }}>
                  {o.name}
                  {o.note && <span style={{ display: "block", fontSize: 11.5, fontWeight: 400, color: "#9a3412", marginTop: 3, lineHeight: 1.45 }}>{o.note}</span>}
                </td>
                <td style={{ padding: "9px 12px 9px 0", color: "#0f766e", fontWeight: 700, whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>{o.rateLabel}</td>
                <td style={{ padding: "9px 12px 9px 0", color: "#101a2b", whiteSpace: "nowrap" }}>{o.downPayment}</td>
                <td style={{ padding: "9px 12px 9px 0", color: "#4d596d" }}>{o.mortgageInsurance}</td>
                <td style={{ padding: "9px 0", color: "#4d596d" }}>{o.whoFor}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <span style={{ fontSize: 11.5, color: "#7a8aa0", lineHeight: 1.5 }}>{view.provenanceNote}</span>
    </section>
  );
}
