import {
  ENVIRONMENTAL_FEE_LINES,
  ENVIRONMENTAL_FEE_NOTES,
} from "@/lib/property/environmentalFeeSchedule";
import { accentForLane } from "@/lib/property/laneThemes";

/**
 * EnvironmentalFeeChart — the Environmental module's typical fee chart. Shows
 * the licensed PE's services with the founder-provided $300/hr general rate and
 * a Guild-credit column; fixed-service fees read "Quoted to scope" until the PE
 * provides real figures (no fabricated fees). Server component; emerald accent.
 *
 * Master Volume Governance: CANON-TREASURY-001 §9.1 (fees disclosed up front,
 * quoted + approved before work, no post-hoc fees); PE ethics (fee is for work
 * performed, never contingent on a loan/transaction).
 */

const EMERALD = accentForLane("environmental-compliance", "light"); // #127a4f

const cellBase = {
  padding: "11px 12px",
  borderBottom: "1px solid #e6ebf3",
  fontSize: 13,
  color: "#3b475a",
  lineHeight: 1.5,
  verticalAlign: "top" as const,
};

export function EnvironmentalFeeChart() {
  return (
    <section aria-label="Typical environmental fees" style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "grid", gap: 4 }}>
        <span style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: EMERALD }}>
          Typical fees — licensed environmental & chemical engineering
        </span>
        <p style={{ margin: 0, fontSize: 13, color: "#3b475a", lineHeight: 1.6, maxWidth: 720 }}>
          Field and consulting services performed by a licensed PE. General work is billed hourly;
          defined scopes are quoted. Guild members receive credits toward these services.
        </p>
      </div>

      <div style={{ overflowX: "auto", border: "1px solid #d7deea", borderRadius: 14, background: "#ffffff" }}>
        <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 560 }}>
          <thead>
            <tr style={{ background: "#f2f8f5" }}>
              <th style={{ ...cellBase, textAlign: "left", fontWeight: 800, color: "#101a2b", fontSize: 12 }}>Service</th>
              <th style={{ ...cellBase, textAlign: "left", fontWeight: 800, color: "#101a2b", fontSize: 12, whiteSpace: "nowrap" }}>Typical fee</th>
              <th style={{ ...cellBase, textAlign: "left", fontWeight: 800, color: "#101a2b", fontSize: 12, whiteSpace: "nowrap" }}>Guild member</th>
            </tr>
          </thead>
          <tbody>
            {ENVIRONMENTAL_FEE_LINES.map((line) => (
              <tr key={line.service}>
                <td style={cellBase}>
                  <strong style={{ color: "#101a2b", fontSize: 13.5 }}>{line.service}</strong>
                  <div style={{ fontSize: 12, color: "#708997", marginTop: 3 }}>{line.detail}</div>
                </td>
                <td style={{ ...cellBase, whiteSpace: "nowrap", fontWeight: 700, color: line.feeConfirmed ? "#101a2b" : "#9a6b12" }}>
                  {line.fee}
                </td>
                <td style={{ ...cellBase, whiteSpace: "nowrap", color: EMERALD, fontWeight: 700 }}>
                  Credits applied
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: "grid", gap: 4 }}>
        <span style={{ fontSize: 11.5, color: "#708997", lineHeight: 1.5 }}>{ENVIRONMENTAL_FEE_NOTES.guild}</span>
        <span style={{ fontSize: 11.5, color: "#708997", lineHeight: 1.5 }}>{ENVIRONMENTAL_FEE_NOTES.labs}</span>
        <span style={{ fontSize: 11.5, color: "#708997", lineHeight: 1.5 }}>{ENVIRONMENTAL_FEE_NOTES.disclosure}</span>
      </div>
    </section>
  );
}
