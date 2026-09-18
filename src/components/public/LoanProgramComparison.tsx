import {
  LOAN_COMPARISON_NOTE,
  LOAN_PROGRAMS,
} from "@/lib/financing/loanProgramComparison";
import { buildCapitalRates } from "@/lib/property/capitalRatesCurated";
import { accentForLane } from "@/lib/property/laneThemes";

/**
 * LoanProgramComparison — the merged "which program fits + today's rate"
 * side-by-side (founder direction 2026-07-20: combine the program comparison
 * with the capital-rates block so each program shows its CURRENT rate). Shows how
 * 7(a) / 504 / B&I / Express are built AND today's rate for each; never a quote or
 * a qualification. Server component; purple.
 */

const PURPLE = accentForLane("financing-capital", "light"); // #534AB7

const cell = {
  fontSize: 12.5,
  color: "#3b475a",
  lineHeight: 1.5,
} as const;

// Map each program card to its published capital-rate line (from the live/
// committed rate snapshot). Express prices off Prime like 7(a) but with a higher
// spread cap, so it has no distinct published number → an honest fill-in.
const RATE_KEY: Record<string, string | null> = {
  sba_7a: "SBA 7(a)",
  sba_504: "SBA 504",
  usda_bi: "USDA Business & Industry (B&I)",
  sba_express: null,
};

const RATE_FILL_IN: Record<string, string> = {
  usda_bi: "Lender-negotiated · set at closing",
  sba_express: "Prime-based · set at closing",
  sba_504: "Set at the monthly debenture sale",
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "grid", gap: 1 }}>
      <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: "0.05em", textTransform: "uppercase", color: "#8a97a8" }}>{label}</span>
      <span style={cell}>{value}</span>
    </div>
  );
}

export function LoanProgramComparison() {
  const rates = buildCapitalRates();
  const rateByProgram = new Map(rates.lines.map((l) => [l.program, l]));
  const currentRate = (code: string): string => {
    const key = RATE_KEY[code];
    const line = key ? rateByProgram.get(key) : undefined;
    return line?.current ?? RATE_FILL_IN[code] ?? "Set at closing";
  };
  // FSA + Conventional live in the rate snapshot but not the program cards — keep
  // them as an "also today" line so nothing is lost by merging the two blocks.
  const fsa = rateByProgram.get("USDA / FSA program")?.current ?? null;
  const conventional = rateByProgram.get("Conventional");

  return (
    <section aria-label="SBA and USDA programs with today's rates" style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "grid", gap: 4 }}>
        <span style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: PURPLE }}>
          Which program fits — and today&apos;s rate
        </span>
        <p style={{ margin: 0, fontSize: 13, color: "#3b475a", lineHeight: 1.6, maxWidth: 720 }}>
          How the main programs are built and what each is priced at right now — so you can see which one
          your project points to. Not a quote or an approval; the funding institution confirms the fit.
        </p>
        <span style={{ fontSize: 11.5, color: "#7a8aa0" }}>As of {rates.asOf} · your rate is set at your loan&apos;s closing</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
        {LOAN_PROGRAMS.map((p) => (
          <div
            key={p.code}
            style={{
              border: "1px solid #d7deea",
              borderTop: `3px solid ${PURPLE}`,
              borderRadius: 14,
              background: "#ffffff",
              padding: "16px 16px",
              display: "grid",
              gap: 10,
              alignContent: "start",
            }}
          >
            <div style={{ display: "grid", gap: 2 }}>
              <strong style={{ fontSize: 16, color: "#101a2b" }}>{p.name}</strong>
              <span style={{ fontSize: 11.5, color: "#708997" }}>{p.guarantor}</span>
            </div>
            {/* Today's rate — the headline number, merged in from the rates block. */}
            <div style={{ display: "grid", gap: 1, background: "#f3f2fb", borderRadius: 10, padding: "8px 10px" }}>
              <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: "0.05em", textTransform: "uppercase", color: PURPLE }}>Today&apos;s rate</span>
              <strong style={{ fontSize: 15, color: "#101a2b", fontVariantNumeric: "tabular-nums", lineHeight: 1.25 }}>{currentRate(p.code)}</strong>
            </div>
            <div style={{ fontSize: 13, color: PURPLE, fontWeight: 700, lineHeight: 1.4 }}>{p.bestFor}</div>
            <Row label="Max size" value={p.maxSize} />
            <Row label="Equity / down payment" value={p.equity} />
            <Row label="Use of proceeds" value={p.useOfProceeds} />
            <Row label="Term" value={p.term} />
            <Row label="How the rate is set" value={p.rateStructure} />
            <Row label="Key fit" value={p.keyHinge} />
          </div>
        ))}
      </div>

      {/* Also in today's snapshot but not a comparison card: FSA + conventional. */}
      {(fsa || conventional) && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", color: "#8a97a8" }}>Also today</span>
          {fsa && (
            <span style={{ fontSize: 12.5, fontWeight: 700, color: "#101a2b", background: "#eef2f6", borderRadius: 999, padding: "5px 12px" }}>
              {fsa}
            </span>
          )}
          {conventional && (
            <span style={{ fontSize: 12.5, fontWeight: 700, color: "#101a2b", background: "#eef2f6", borderRadius: 999, padding: "5px 12px" }}>
              Conventional: {conventional.current ?? "bank-set, at closing"}
            </span>
          )}
        </div>
      )}

      <span style={{ fontSize: 11.5, color: "#708997", lineHeight: 1.5 }}>{LOAN_COMPARISON_NOTE}</span>
    </section>
  );
}
