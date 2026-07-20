import {
  LOAN_COMPARISON_NOTE,
  LOAN_PROGRAMS,
} from "@/lib/financing/loanProgramComparison";
import { accentForLane } from "@/lib/property/laneThemes";

/**
 * LoanProgramComparison — informational SBA/USDA side-by-side on the Financial
 * module. Shows how 7(a) / 504 / B&I / Express are built so a visitor can see
 * which one fits; never a quote or a qualification. Server component; purple.
 */

const PURPLE = accentForLane("financing-capital", "light"); // #534AB7

const cell = {
  fontSize: 12.5,
  color: "#3b475a",
  lineHeight: 1.5,
} as const;

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "grid", gap: 1 }}>
      <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: "0.05em", textTransform: "uppercase", color: "#8a97a8" }}>{label}</span>
      <span style={cell}>{value}</span>
    </div>
  );
}

export function LoanProgramComparison() {
  return (
    <section aria-label="SBA and USDA program comparison" style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "grid", gap: 4 }}>
        <span style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: PURPLE }}>
          Which program fits? SBA vs USDA, side by side
        </span>
        <p style={{ margin: 0, fontSize: 13, color: "#3b475a", lineHeight: 1.6, maxWidth: 720 }}>
          How the main programs are built — so you can see which one your project points to. Not a
          quote or an approval; the licensed lender confirms the fit.
        </p>
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

      <span style={{ fontSize: 11.5, color: "#708997", lineHeight: 1.5 }}>{LOAN_COMPARISON_NOTE}</span>
    </section>
  );
}
