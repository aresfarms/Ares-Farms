import {
  FINANCING_FEE_LINES,
  FINANCING_FEE_NOTES,
  FINANCING_FREE_STATEMENT,
} from "@/lib/financing/financingFeeSchedule";
import { accentForLane } from "@/lib/property/laneThemes";

/**
 * FinancingFeeChart — the Financial module's fee chart. Leads plainly with
 * "applications are free," then lists the only paid services: one-on-one time
 * with the licensed lender ($250/hr or Guild-included) and other financial
 * analysis a licensed mortgage broker can provide. Server component; purple.
 *
 * Master Volume Governance: FACILITATION-001 (loan is the lender's; free to
 * apply); CANON-TREASURY-001 §9.1 (fees disclosed up front); bright line — no
 * transaction-tied compensation.
 */

const PURPLE = accentForLane("financing-capital", "light"); // #534AB7

const cellBase = {
  padding: "11px 12px",
  borderBottom: "1px solid #e6ebf3",
  fontSize: 13,
  color: "#3b475a",
  lineHeight: 1.5,
  verticalAlign: "top" as const,
};

export function FinancingFeeChart() {
  return (
    <section aria-label="Financing fees" style={{ display: "grid", gap: 12 }}>
      <div
        style={{
          background: "#eef7f1",
          border: "1px solid #cfe6d8",
          borderLeft: "4px solid #127a4f",
          borderRadius: 12,
          padding: "14px 16px",
          display: "grid",
          gap: 4,
        }}
      >
        <strong style={{ fontSize: 16, color: "#12513a" }}>{FINANCING_FREE_STATEMENT.lead}</strong>
        <p style={{ margin: 0, fontSize: 13, color: "#2f5f49", lineHeight: 1.6 }}>{FINANCING_FREE_STATEMENT.body}</p>
      </div>

      <div style={{ display: "grid", gap: 4 }}>
        <span style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: PURPLE }}>
          The only paid services — one-on-one with the licensed lender
        </span>
        <p style={{ margin: 0, fontSize: 13, color: "#3b475a", lineHeight: 1.6, maxWidth: 720 }}>
          Optional advisory time, billed by the hour or included with a Guild membership. Everything to
          do with applying for and getting a loan stays free.
        </p>
      </div>

      <div style={{ overflowX: "auto", border: "1px solid #d7deea", borderRadius: 14, background: "#ffffff" }}>
        <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 560 }}>
          <thead>
            <tr style={{ background: "#f1f0fb" }}>
              <th style={{ ...cellBase, textAlign: "left", fontWeight: 800, color: "#101a2b", fontSize: 12 }}>Service</th>
              <th style={{ ...cellBase, textAlign: "left", fontWeight: 800, color: "#101a2b", fontSize: 12, whiteSpace: "nowrap" }}>Fee</th>
              <th style={{ ...cellBase, textAlign: "left", fontWeight: 800, color: "#101a2b", fontSize: 12, whiteSpace: "nowrap" }}>Guild member</th>
            </tr>
          </thead>
          <tbody>
            {FINANCING_FEE_LINES.map((line) => (
              <tr key={line.service}>
                <td style={cellBase}>
                  <strong style={{ color: "#101a2b", fontSize: 13.5 }}>{line.service}</strong>
                  <div style={{ fontSize: 12, color: "#708997", marginTop: 3 }}>{line.detail}</div>
                </td>
                <td style={{ ...cellBase, whiteSpace: "nowrap", fontWeight: 700, color: line.feeConfirmed ? "#101a2b" : "#9a6b12" }}>
                  {line.fee}
                </td>
                <td style={{ ...cellBase, whiteSpace: "nowrap", color: PURPLE, fontWeight: 700 }}>
                  Included / credited
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: "grid", gap: 4 }}>
        <span style={{ fontSize: 11.5, color: "#708997", lineHeight: 1.5 }}>{FINANCING_FEE_NOTES.guild}</span>
        <span style={{ fontSize: 11.5, color: "#708997", lineHeight: 1.5 }}>{FINANCING_FEE_NOTES.broker}</span>
        <span style={{ fontSize: 11.5, color: "#708997", lineHeight: 1.5 }}>{FINANCING_FEE_NOTES.disclosure}</span>
      </div>
    </section>
  );
}
