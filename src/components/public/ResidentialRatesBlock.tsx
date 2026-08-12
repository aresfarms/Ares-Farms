/**
 * Residential mortgage rates that track and change as rates move (founder
 * direction 2026-07-18), for the Residential lane. Split into two pieces so the
 * at-a-glance rate TILES can sit in the column beside the map (under the "Homes
 * to live in" box) while the wide loan-options TABLE stays full-width below.
 * Server components; every figure sourced and labeled — not a rate offer.
 */

import { buildResidentialRates } from "@/lib/property/residentialRatesCurated";
import { LANE_THEMES } from "@/lib/property/laneThemes";

// The Residential module wears its BLUE identity (trust/stability/security).
const R = LANE_THEMES.residential;

const card = {
  border: "1px solid #d7deea",
  background: "#ffffff",
  borderRadius: 14,
  padding: "14px 15px",
} as const;

function RateTile({ label, rate, sub }: { label: string; rate: number; sub: string }) {
  return (
    <div style={{ ...card, background: R.tileBg, border: `1px solid ${R.tileBg}`, display: "grid", gap: 2, minWidth: 150, flex: "1 1 150px" }}>
      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: R.tileLabel }}>{label}</span>
      <strong style={{ fontSize: 30, color: R.tileValue, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{rate.toFixed(2)}%</strong>
      <span style={{ fontSize: 11.5, color: R.tileLabel }}>{sub}</span>
    </div>
  );
}

/** Compact rate tiles — for the column beside the map. */
export function ResidentialRateTiles() {
  const view = buildResidentialRates();
  return (
    <section aria-label="Current residential mortgage rates" style={{ display: "grid", gap: 10 }}>
      <div style={{ display: "grid", gap: 3 }}>
        <span style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: R.accent }}>
          Today&apos;s mortgage rates
        </span>
        <strong style={{ fontSize: 17, color: "#101a2b", lineHeight: 1.15 }}>What it costs to borrow right now</strong>
        {view.weekOf && (
          <span style={{ fontSize: 11.5, color: "#7a8aa0" }}>Tracks Freddie Mac PMMS · week of {view.weekOf}</span>
        )}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        <RateTile label="30-year fixed" rate={view.rate30} sub="Freddie Mac national average" />
        {view.rate15 != null && <RateTile label="15-year fixed" rate={view.rate15} sub="Higher payment, less total interest" />}
      </div>
    </section>
  );
}

/** Full loan-options table — full width, below the listings shelf. */
export function ResidentialLoanTable() {
  const view = buildResidentialRates();
  return (
    <section aria-label="Residential loan options" style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "grid", gap: 4 }}>
        <span style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: R.accent }}>
          Every way to finance a home
        </span>
        <strong style={{ fontSize: 22, color: "#101a2b", lineHeight: 1.15 }}>Which loan fits which buyer</strong>
      </div>
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
                <td style={{ padding: "9px 12px 9px 0", color: R.accent, fontWeight: 700, whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>{o.rateLabel}</td>
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
