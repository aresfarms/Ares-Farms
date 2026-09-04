"use client";

/**
 * FinanceAnalysisPanel — the Finance tab's property-side numbers (founder
 * direction 2026-08-05: best use, DSCR clearance, and the lender-test
 * scorecard, on-screen). Two sections, each rendered only when its data
 * exists:
 *   - Commercial best-use income screen: modeled NOI + DSCR per candidate
 *     use at lender-shaped reference terms, best use highlighted.
 *   - Lender-test scorecard: which of a lender's property-side tests this
 *     property passes on paper — never an approval probability (approval is
 *     a licensed credit decision about a person; this is about the parcel).
 */

import type { CommercialUseScreen } from "@/lib/property/commercialUseModel";
import type { LenderTest } from "@/lib/property/financingProgramFit";
import { OperatingModelWorkbench } from "@/components/property/OperatingModelWorkbench";

const card = { background: "#fff", border: "1px solid #E5E0D5", borderRadius: 14, padding: "16px 18px" } as const;

const STATUS_STYLE: Record<LenderTest["status"], { label: string; bg: string; ink: string }> = {
  pass: { label: "PASS", bg: "#E7F0E9", ink: "#1C4532" },
  fail: { label: "FAIL", bg: "#FDECEC", ink: "#8F1F1F" },
  unknown: { label: "UNKNOWN", bg: "#F3F4F6", ink: "#6B7280" },
};

const dollars = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
const monthRange = (r: { low: number; high: number }) => r.low === r.high ? `${r.low} months` : `${r.low}–${r.high} months`;

export function FinanceAnalysisPanel({
  useScreen,
  scorecard,
  location,
}: {
  useScreen: CommercialUseScreen | null;
  scorecard: LenderTest[] | null;
  location?: string | null;
}) {
  if (!useScreen && !scorecard) return null;
  return (
    <>
      {useScreen && (
        <section style={{ ...card, display: "grid", gap: 10 }} aria-label="Best-use income screen">
          <span style={{ fontSize: 10.5, fontWeight: 850, letterSpacing: ".14em", textTransform: "uppercase", color: "#8F6E1F" }}>
            What this building earns best — modeled income and coverage by use
          </span>
          <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))" }}>
            <div style={{ border: "1px solid #E5E0D5", borderRadius: 10, padding: "10px 12px", background: "#FAFAF8" }}>
              <div style={{ fontSize: 10, color: "#6B7280", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em" }}>Property classification</div>
              <div style={{ marginTop: 4, color: "#1C2B45", fontWeight: 800, fontSize: 13 }}>{useScreen.propertyClassification}</div>
            </div>
            <div style={{ border: "1px solid #E5E0D5", borderRadius: 10, padding: "10px 12px", background: "#FAFAF8" }}>
              <div style={{ fontSize: 10, color: "#6B7280", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em" }}>Current use</div>
              <div style={{ marginTop: 4, color: "#1C2B45", fontWeight: 800, fontSize: 13 }}>{useScreen.currentUse ?? "Not verified from the parcel record"}</div>
            </div>
            <div style={{ border: "1px solid #D9E5DC", borderRadius: 10, padding: "10px 12px", background: "#F5FAF6" }}>
              <div style={{ fontSize: 10, color: "#53705B", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em" }}>Best-supported use</div>
              <div style={{ marginTop: 4, color: "#1C4532", fontWeight: 800, fontSize: 13 }}>{useScreen.bestSupportedUse?.use ?? "Needs more operating data"}</div>
            </div>
            <div style={{ border: "1px solid #E8D7A6", borderRadius: 10, padding: "10px 12px", background: "#FFF9EA" }}>
              <div style={{ fontSize: 10, color: "#8F6E1F", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em" }}>Secondary opportunity</div>
              <div style={{ marginTop: 4, color: "#5B4611", fontWeight: 800, fontSize: 13 }}>{useScreen.secondaryOpportunity?.use ?? "No second use surfaced yet"}</div>
            </div>
          </div>
          {useScreen.bestUse ? (
            <p style={{ margin: 0, color: "#1C2B45", fontSize: 13.5, lineHeight: 1.6 }}>
              <strong>Best modeled use: {useScreen.bestUse.use}</strong> — ≈{dollars(useScreen.bestUse.noiMid ?? 0)}/yr modeled NOI,
              DSCR {useScreen.bestUse.dscr?.toFixed(2)} against the 1.25x floor at {useScreen.referenceTerms}
              {useScreen.bestUse.clearsFloor ? " — clears on the property's own paper." : " — under the floor at the stated screening value."}
            </p>
          ) : (
            <p style={{ margin: 0, color: "#5A6172", fontSize: 13, lineHeight: 1.6 }}>{useScreen.note}</p>
          )}
          {useScreen.secondaryOpportunity && (
            <div style={{ border: "1px solid #E8D7A6", borderRadius: 12, background: "#FFFDF7", padding: "12px 14px", display: "grid", gap: 8 }}>
              <div style={{ color: "#5B4611", fontWeight: 850, fontSize: 13 }}>
                Secondary opportunity: {useScreen.secondaryOpportunity.use} — subject to zoning/conversion review
              </div>
              <p style={{ margin: 0, color: "#3D4655", fontSize: 12.5, lineHeight: 1.6 }}>
                <strong>Approval runway:</strong> zoning/land-use review ≈ {monthRange(useScreen.secondaryOpportunity.conversion.zoningReviewMonths)};
                end-to-end entitlement/design/permit runway ≈ {monthRange(useScreen.secondaryOpportunity.conversion.endToEndMonths)}.
                A redesign, denial or resubmission cycle can push the outer case toward {useScreen.secondaryOpportunity.conversion.resubmissionUpperMonths}+ months.
              </p>
              <p style={{ margin: 0, color: "#3D4655", fontSize: 12.5, lineHeight: 1.6 }}>
                <strong>Screening professional-cost allowance:</strong> {dollars(useScreen.secondaryOpportunity.conversion.professionalSoftCost.low)}–{dollars(useScreen.secondaryOpportunity.conversion.professionalSoftCost.high)}
                before construction, plus municipal application/permit fees that Furlong should pull from the current local fee schedule.
              </p>
              <p style={{ margin: 0, color: "#6B7280", fontSize: 11.5, lineHeight: 1.55 }}>
                {useScreen.secondaryOpportunity.conversion.pathLabel}. {useScreen.secondaryOpportunity.conversion.note}
              </p>
              <details>
                <summary style={{ cursor: "pointer", color: "#1C4532", fontWeight: 800, fontSize: 12 }}>How Furlong streamlines the zoning/conversion path</summary>
                <ol style={{ margin: "8px 0 0 20px", padding: 0, color: "#3D4655", fontSize: 12, lineHeight: 1.6 }}>
                  {useScreen.secondaryOpportunity.conversion.steps.map((step) => <li key={step}>{step}</li>)}
                </ol>
              </details>
              <OperatingModelWorkbench screen={useScreen} location={location} />
            </div>
          )}
          {useScreen.uses.some((u) => u.noiMid != null) && (
            <div style={{ overflowX: "auto" }}>
              <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 12 }}>
                <thead>
                  <tr style={{ textAlign: "left", color: "#6B7280" }}>
                    <th style={{ padding: "6px 8px", borderBottom: "1px solid #E5E0D5" }}>Use</th>
                    <th style={{ padding: "6px 8px", borderBottom: "1px solid #E5E0D5" }}>Net $/sq ft/yr</th>
                    <th style={{ padding: "6px 8px", borderBottom: "1px solid #E5E0D5" }}>Modeled NOI</th>
                    <th style={{ padding: "6px 8px", borderBottom: "1px solid #E5E0D5" }}>DSCR</th>
                    <th style={{ padding: "6px 8px", borderBottom: "1px solid #E5E0D5" }}>1.25x floor</th>
                  </tr>
                </thead>
                <tbody>
                  {useScreen.uses.map((u) => (
                    <tr key={u.use} style={{ background: u.use === useScreen.bestUse?.use ? "#FBF5E6" : "transparent" }}>
                      <td style={{ padding: "6px 8px", borderBottom: "1px solid #F0EDE4", color: "#1C2B45", fontWeight: u.use === useScreen.bestUse?.use ? 800 : 500 }}>{u.use}</td>
                      <td style={{ padding: "6px 8px", borderBottom: "1px solid #F0EDE4", color: "#3d4655" }}>{u.financialModelAvailable ? `$${u.netPerSqftLow}–$${u.netPerSqftHigh}` : "unit/room model required"}</td>
                      <td style={{ padding: "6px 8px", borderBottom: "1px solid #F0EDE4", color: "#3d4655" }}>{u.noiMid != null ? `${dollars(u.noiLow ?? 0)}–${dollars(u.noiHigh ?? 0)}` : u.financialModelAvailable ? "needs sq ft" : "operating model required"}</td>
                      <td style={{ padding: "6px 8px", borderBottom: "1px solid #F0EDE4", color: "#1C2B45", fontWeight: 700 }}>{u.dscr != null ? u.dscr.toFixed(2) : "—"}</td>
                      <td style={{ padding: "6px 8px", borderBottom: "1px solid #F0EDE4" }}>
                        {u.clearsFloor == null ? <span style={{ color: "#6B7280" }}>—</span> : u.clearsFloor ? <span style={{ color: "#1C4532", fontWeight: 800 }}>CLEARS</span> : <span style={{ color: "#8F1F1F", fontWeight: 700 }}>SHORT</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p style={{ margin: 0, color: "#6B7280", fontSize: 11, lineHeight: 1.55 }}>{useScreen.note}</p>
        </section>
      )}

      {scorecard && scorecard.length > 0 && (
        <section style={{ ...card, display: "grid", gap: 8 }} aria-label="Lender-test scorecard">
          <span style={{ fontSize: 10.5, fontWeight: 850, letterSpacing: ".14em", textTransform: "uppercase", color: "#1C4532" }}>
            The lender&apos;s property-side tests — where this parcel stands on paper
          </span>
          <div style={{ display: "grid", gap: 7 }}>
            {scorecard.map((t) => {
              const style = STATUS_STYLE[t.status];
              return (
                <div key={t.test} style={{ display: "flex", gap: 9, alignItems: "baseline" }}>
                  <span style={{ flexShrink: 0, fontSize: 9.5, fontWeight: 850, letterSpacing: ".1em", padding: "3px 9px", borderRadius: 999, background: style.bg, color: style.ink }}>{style.label}</span>
                  <span style={{ fontSize: 12.5, color: "#3d4655", lineHeight: 1.55 }}>
                    <strong style={{ color: "#1C2B45" }}>{t.test}:</strong> {t.detail}
                  </span>
                </div>
              );
            })}
          </div>
          <p style={{ margin: 0, color: "#6B7280", fontSize: 11, lineHeight: 1.55 }}>
            Property-side screening only — which of a lender&apos;s own checklist items this parcel passes on paper.
            It is not an approval, an approval probability, or an eligibility determination; borrower
            qualification is the licensed lender&apos;s decision.
          </p>
        </section>
      )}
    </>
  );
}
