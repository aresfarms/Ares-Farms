"use client";

import { useMemo, useState } from "react";

import type { ChartTheme } from "@/lib/property/chartThemes";
import { financingProgramsFor } from "@/lib/property/financingProgramsCurated";
import {
  buildEquityOutlook,
  buildOwnershipCostModel,
  buildPriceContext,
  type OwnershipCostContext,
} from "@/lib/property/ownershipCostModel";
import type { PropertyProfileId } from "@/lib/property/propertyProfile";
import { buildResidentialRates } from "@/lib/property/residentialRatesCurated";

/**
 * OwnershipCostPanel — "what it costs to buy, and then what it costs to KEEP"
 * (founder direction 2026-07-17). Renders inside the Chart Table as its own
 * waypoint: cash-to-close by financing lane, the full monthly bill including
 * the costs people underestimate (taxes, insurance, electricity, maintenance),
 * and the years-1–5 total. Pure client math over a tiny server-resolved
 * context slice; every figure is labeled illustrative guidance.
 *
 * Price-on-request listings ask the visitor for the price they would offer —
 * that number stays on this page (component state only; never sent anywhere).
 */

const fmt = (n: number): string => `$${n.toLocaleString("en-US")}`;
const monthlyPayment = (principal: number, annualRate: number, years: number): number => {
  const months = years * 12;
  const rate = annualRate / 100 / 12;
  if (rate === 0) return Math.round(principal / months);
  return Math.round(principal * rate * Math.pow(1 + rate, months) / (Math.pow(1 + rate, months) - 1));
};

export interface OwnershipCostPanelProps {
  theme: ChartTheme;
  context: OwnershipCostContext;
  /** Listed price when the source record carries one; null → ask the visitor. */
  listedPrice: number | null;
  isHome: boolean;
  farmShaped: boolean;
  /** Working-farm/ranch — use FSA/USDA farm-loan lanes, not consumer mortgages. */
  farmMode?: boolean;
  /** Classified profile — drives the "programs you may also qualify for" block. */
  profileId?: PropertyProfileId;
}

export function OwnershipCostPanel(props: OwnershipCostPanelProps) {
  const { theme } = props;
  const [assumedPrice, setAssumedPrice] = useState<number | null>(null);
  const [priceInput, setPriceInput] = useState("");
  const [priceMessage, setPriceMessage] = useState<string | null>(null);

  const price = assumedPrice ?? props.listedPrice;
  const priceIsAssumption = assumedPrice !== null;
  const residentialRates = useMemo(() => buildResidentialRates(), []);

  const model = useMemo(
    () =>
      price != null
        ? buildOwnershipCostModel(
            {
              price,
              priceIsAssumption,
              isHome: props.isHome,
              farmShaped: props.farmShaped,
              farmMode: props.farmMode,
            },
            props.context
          )
        : null,
    [price, priceIsAssumption, props.isHome, props.farmShaped, props.farmMode, props.context]
  );

  const applyPriceInput = () => {
    const parsed = Number(priceInput.replace(/[^0-9.]/g, ""));
    if (!Number.isFinite(parsed) || parsed < 10_000) {
      setPriceMessage("Enter a purchase price of at least $10,000.");
      return;
    }
    const rounded = Math.round(parsed);
    setAssumedPrice(rounded);
    setPriceInput(rounded.toLocaleString("en-US"));
    setPriceMessage(`Estimate updated using ${fmt(rounded)}.`);
  };

  const cellStyle: React.CSSProperties = {
    padding: "7px 10px",
    fontSize: 12.5,
    color: theme.ink,
    borderBottom: `1px solid ${theme.cellBorder}`,
    textAlign: "left" as const,
    verticalAlign: "top" as const,
  };
  const headStyle: React.CSSProperties = {
    ...cellStyle,
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    color: theme.inkSoft,
  };

  return (
    <div style={{ display: "grid", gap: 14 }}>
      {/* Price line / assumption input */}
      <div
        style={{
          display: "grid",
          gap: 12,
          padding: "18px",
          border: "2px solid #C9B26A",
          borderRadius: 14,
          background: "#FFFFFF",
          boxShadow: "0 6px 20px rgba(28,43,69,.10)",
          fontSize: 14,
          color: "#1C2B45",
        }}
      >
        {price != null ? (
          <span>
            Figured at <strong style={{ color: theme.ink }}>{fmt(price)}</strong>
            {priceIsAssumption
              ? " — the price you entered."
              : " — the listed price. Try a different number any time:"}
          </span>
        ) : (
          <span style={{ fontWeight: 650, lineHeight: 1.55 }}>
            This listing does not publish a price. Enter the price you would offer and the numbers
            fill in — the number stays on this page.
          </span>
        )}
        <form onSubmit={(event) => { event.preventDefault(); applyPriceInput(); }} style={{ display: "flex", gap: 10, alignItems: "stretch", flexWrap: "wrap" }}>
          <input
            inputMode="numeric"
            aria-label="Price to estimate with, dollars"
            placeholder="e.g. 250,000"
            value={priceInput}
            onChange={(event) => { setPriceInput(event.target.value); setPriceMessage(null); }}
            style={{
              font: "inherit",
              fontSize: 13,
              width: 190,
              minHeight: 44,
              padding: "10px 13px",
              borderRadius: 9,
              border: "2px solid #1C2B45",
              background: "#FFFFFF",
              color: "#16233C",
              fontWeight: 750,
              outlineColor: "#B08A2E",
            }}
          />
          <button
            type="submit"
            style={{
              font: "inherit",
              fontSize: 13.5,
              fontWeight: 850,
              minHeight: 44,
              padding: "10px 18px",
              borderRadius: 9,
              border: "2px solid #1C2B45",
              background: "#1C2B45",
              color: "#FFFFFF",
              cursor: "pointer",
            }}
          >
            Estimate
          </button>
        </form>
        {priceMessage && <span role="status" aria-live="polite" style={{ color: assumedPrice ? "#2E7D4F" : "#9A3412", fontSize: 12.5, fontWeight: 750 }}>{priceMessage}</span>}
      </div>

      {model && price != null && (() => {
        const priceContext = buildPriceContext(price, props.context);
        return priceContext ? (
          <div
            style={{
              padding: "10px 14px",
              border: `1px solid ${theme.plateBorder}`,
              borderRadius: 10,
              background: theme.plate,
              fontSize: 12.5,
              lineHeight: 1.6,
              color: theme.inkSoft,
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: theme.accent, display: "block", marginBottom: 4 }}>
              Price context — against published benchmarks
            </span>
            {priceContext.text} <em style={{ color: theme.inkFaint }}>[{priceContext.provenance}]</em>
          </div>
        ) : null;
      })()}

      {model && price != null && props.isHome && (
        <div style={{ padding: "16px 18px", border: `1px solid ${theme.plateBorder}`, borderRadius: 12, background: theme.plate }}>
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: theme.accent, marginBottom: 6 }}>
            Current rate and term comparison
          </div>
          {(() => {
            const loan = Math.round(price * 0.8);
            const rate30 = residentialRates.rate30;
            const rate15 = residentialRates.rate15 ?? rate30;
            const rows = [
              { term: "30-year fixed benchmark", rate: rate30, payment: monthlyPayment(loan, rate30, 30), note: "Current Freddie Mac national benchmark." },
              { term: "15-year fixed benchmark", rate: rate15, payment: monthlyPayment(loan, rate15, 15), note: "Current Freddie Mac national benchmark." },
              { term: "40-year payment illustration", rate: rate30, payment: monthlyPayment(loan, rate30, 40), note: "Payment comparison only. A 40-year purchase loan is not a standard universally available product; lender and program availability must be confirmed." },
              { term: "ARM initial-rate sensitivity", rate: Math.max(0.01, rate30 - 0.5), payment: monthlyPayment(loan, Math.max(0.01, rate30 - 0.5), 30), note: "Illustrates an initial rate 0.50 percentage point below the current 30-year benchmark—not a live ARM quote. The payment can rise after adjustment." },
            ];
            return <>
              <p style={{ margin: "0 0 10px", fontSize: 12.5, lineHeight: 1.55, color: theme.inkSoft }}>
                Calculated on an illustrative 80% loan of <strong>{fmt(loan)}</strong> for this {fmt(price)} property. Principal and interest only; taxes, insurance, mortgage insurance, fees, and program-specific charges are added elsewhere in this model.
              </p>
              <div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse", background: theme.cellBg }}><thead><tr><th style={headStyle}>Term / structure</th><th style={headStyle}>Rate used</th><th style={headStyle}>Monthly P&amp;I</th><th style={headStyle}>What it means</th></tr></thead><tbody>{rows.map((row) => <tr key={row.term}><td style={cellStyle}><strong>{row.term}</strong></td><td style={cellStyle}>{row.rate.toFixed(2)}%</td><td style={cellStyle}>{fmt(row.payment)}/mo</td><td style={cellStyle}>{row.note}</td></tr>)}</tbody></table></div>
              <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 8 }}>
                {[0.5, 1, 2].map((pointPct) => <div key={pointPct} style={{ border: `1px solid ${theme.cellBorder}`, borderRadius: 9, padding: 10, background: theme.cellBg }}><strong style={{ display: "block", color: theme.ink }}>{pointPct} point{pointPct === 1 ? "" : "s"} = {pointPct}%</strong><span style={{ fontSize: 12, color: theme.inkSoft }}>{fmt(Math.round(loan * pointPct / 100))} on this illustrative loan</span></div>)}
              </div>
              <p style={{ margin: "10px 0 0", fontSize: 11.5, lineHeight: 1.5, color: theme.inkFaint }}>{residentialRates.provenanceNote} Snapshot week: {residentialRates.weekOf ?? "date unavailable"}. Points may buy a lower rate, cover lender compensation, or reflect pricing adjustments; the lender must disclose the actual rate, APR, dollar cost, and break-even period.</p>
            </>;
          })()}
        </div>
      )}

      {model && (
        <>
          {/* ── Cash to close ─────────────────────────────────────────── */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: theme.accent, marginBottom: 6 }}>
              Cash to close, by financing lane
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", background: theme.cellBg, borderRadius: 10 }}>
                <thead>
                  <tr>
                    <th style={headStyle}>Lane</th>
                    <th style={headStyle}>Down payment</th>
                    <th style={headStyle}>Monthly P&amp;I</th>
                    <th style={headStyle}>Mortgage ins.</th>
                    <th style={headStyle}>Income that works</th>
                  </tr>
                </thead>
                <tbody>
                  {model.purchase.scenarios.map((s) => (
                    <tr key={s.program}>
                      <td style={cellStyle}>
                        <strong>{s.program}</strong>
                        <div style={{ fontSize: 11.5, color: theme.inkFaint, marginTop: 2 }}>{s.fit}</div>
                        {s.upfrontFeeNote && (
                          <div style={{ fontSize: 11.5, color: theme.inkFaint, marginTop: 2 }}>{s.upfrontFeeNote}</div>
                        )}
                      </td>
                      <td style={cellStyle}>
                        {s.downPayment === 0 ? "$0" : fmt(s.downPayment)}
                        <div style={{ fontSize: 11.5, color: theme.inkFaint }}>{s.downPaymentPct}%</div>
                      </td>
                      <td style={cellStyle}>{fmt(s.monthlyPrincipalInterest)}/mo</td>
                      <td style={cellStyle}>
                        {s.monthlyMortgageInsurance > 0 ? `${fmt(s.monthlyMortgageInsurance)}/mo` : "None"}
                        {s.mortgageInsuranceNote && (
                          <div style={{ fontSize: 11.5, color: theme.inkFaint, marginTop: 2 }}>{s.mortgageInsuranceNote}</div>
                        )}
                      </td>
                      <td style={{ ...cellStyle, whiteSpace: "nowrap" }}>
                        ≈{fmt(s.incomeGuidance.comfortableAnnual)}/yr
                        <div style={{ fontSize: 11.5, color: theme.inkFaint, marginTop: 2, whiteSpace: "normal" }}>
                          sometimes from {fmt(s.incomeGuidance.stretchAnnual)}
                          {s.program.startsWith("USDA") ? " · county income caps apply" : ""}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p style={{ margin: "8px 0 0", fontSize: 12, lineHeight: 1.6, color: theme.inkFaint }}>
              The income column sizes each lane&apos;s full house payment (with taxes and insurance)
              against that program&apos;s customary housing ratio — so you can see whether your bracket
              plausibly funds this without telling anyone your income. Lenders qualify on the whole
              picture — existing debts, credit, down payment — never income alone. USDA additionally
              caps eligible household income by county; USDA&apos;s eligibility site or a lender confirms
              the county cap.
            </p>
            <p style={{ margin: "8px 0 0", fontSize: 12.5, lineHeight: 1.6, color: theme.inkSoft }}>
              On top of the down payment, closing costs typically run{" "}
              <strong style={{ color: theme.ink }}>
                {fmt(model.purchase.closingLow)}–{fmt(model.purchase.closingHigh)}
              </strong>
              . {model.purchase.closingNote} Inspection and insurance set-up costs are itemized in the
              diligence section above.
            </p>
          </div>

          {/* ── The monthly bill beyond the mortgage ──────────────────── */}
          <div>
            <div
              data-testid="post-sale-tax-scenario"
              style={{
                display: "grid",
                gap: 6,
                padding: "12px 14px",
                marginBottom: 10,
                border: `1px solid ${theme.plateBorder}`,
                borderRadius: 10,
                background: theme.plate,
              }}
            >
              <strong style={{ fontSize: 13, color: theme.ink }}>
                Post-purchase property-tax check
              </strong>
              <span style={{ fontSize: 12.5, color: theme.ink, lineHeight: 1.55 }}>
                Stabilized buyer estimate: <strong>{fmt(model.tax.stabilizedAnnual)}/yr</strong>
                {" · "}Adverse case: <strong>{fmt(model.tax.adverseAnnual)}/yr</strong>
                {model.tax.sellerCurrentAnnual != null && (
                  <> · Seller&apos;s current bill: <strong>{fmt(model.tax.sellerCurrentAnnual)}/yr</strong></>
                )}
              </span>
              <span style={{ fontSize: 11.5, color: theme.inkFaint, lineHeight: 1.55 }}>
                {model.tax.warning} [{model.tax.rule}]
              </span>
            </div>
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: theme.accent, marginBottom: 6 }}>
              The rest of the monthly bill — the part people underestimate
            </div>
            <div style={{ display: "grid", gap: 6 }}>
              {model.monthly.map((line) => (
                <div
                  key={line.label}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(120px, 170px) minmax(90px, 130px) 1fr",
                    gap: 10,
                    padding: "7px 10px",
                    background: theme.cellBg,
                    border: `1px solid ${theme.cellBorder}`,
                    borderRadius: 8,
                    alignItems: "baseline",
                  }}
                >
                  <strong style={{ fontSize: 12.5, color: theme.ink }}>{line.label}</strong>
                  <span style={{ fontSize: 12.5, color: theme.ink, whiteSpace: "nowrap" }}>
                    {fmt(line.low)}–{fmt(line.high)}/mo
                  </span>
                  <span style={{ fontSize: 11.5, lineHeight: 1.55, color: theme.inkFaint }}>
                    {line.note} <em>[{line.provenance}]</em>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Totals + five-year view ───────────────────────────────── */}
          <div
            style={{
              display: "grid",
              gap: 8,
              padding: "12px 14px",
              border: `1px solid ${theme.plateBorder}`,
              borderRadius: 10,
              background: theme.plate,
            }}
          >
            {model.monthlyTotals.map((total) => (
              <div key={total.program} style={{ fontSize: 13, color: theme.ink }}>
                All-in monthly on <strong>{total.program}</strong>:{" "}
                <strong style={{ color: theme.accent }}>
                  {fmt(total.low)}–{fmt(total.high)}
                </strong>
              </div>
            ))}
            <div style={{ borderTop: `1px dashed ${theme.plateBorder}`, paddingTop: 8, display: "grid", gap: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: theme.accent }}>
                The cost horizon ({props.farmMode ? "FSA" : "FHA"} path, today&apos;s dollars)
              </span>
              {(
                [
                  ["Year 1 — buying in", model.horizon.year1],
                  ["Years 2–5", model.horizon.years2to5],
                  ["Years 6–10", model.horizon.years6to10],
                  ["Years 11–30", model.horizon.years11to30],
                ] as const
              ).map(([label, band]) => (
                <div key={label} style={{ display: "grid", gap: 2 }}>
                  <div style={{ fontSize: 13, color: theme.ink }}>
                    <strong>{label}:</strong>{" "}
                    <strong style={{ color: theme.accent }}>
                      {fmt(band.low)}–{fmt(band.high)}
                    </strong>
                  </div>
                  <span style={{ fontSize: 11.5, lineHeight: 1.55, color: theme.inkFaint }}>{band.note}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Equity outlook — the long view (scenarios, never predictions) ── */}
          {price != null && (() => {
            const outlook = buildEquityOutlook(price, props.context, props.farmMode ?? false);
            if (!outlook) return null;
            return (
              <div style={{ display: "grid", gap: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: theme.accent }}>
                  If you hold it — value and equity scenarios
                </div>
                <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.6, color: theme.inkSoft }}>{outlook.intro}</p>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", background: theme.cellBg, borderRadius: 10 }}>
                    <thead>
                      <tr>
                        {["Year", "Still owed", "Flat (0%)", `Slower (${outlook.slowerRatePct}%)`, `Steady (${outlook.steadyRatePct}%)`].map((head) => (
                          <th
                            key={head}
                            style={{ padding: "7px 10px", fontSize: 11, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", color: theme.inkSoft, borderBottom: `1px solid ${theme.cellBorder}`, textAlign: "left" }}
                          >
                            {head}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {outlook.rows.map((row) => (
                        <tr key={row.year}>
                          <td style={{ padding: "6px 10px", fontSize: 12.5, fontWeight: 700, color: theme.ink, borderBottom: `1px solid ${theme.cellBorder}` }}>
                            {row.year}
                          </td>
                          <td style={{ padding: "6px 10px", fontSize: 12.5, color: theme.inkSoft, borderBottom: `1px solid ${theme.cellBorder}`, whiteSpace: "nowrap" }}>
                            {row.loanBalance > 0 ? fmt(row.loanBalance) : "Paid off"}
                          </td>
                          {([row.flat, row.slower, row.steady] as const).map((scenario, index) => (
                            <td
                              key={index}
                              style={{ padding: "6px 10px", fontSize: 12.5, color: theme.ink, borderBottom: `1px solid ${theme.cellBorder}`, whiteSpace: "nowrap" }}
                            >
                              {fmt(scenario.value)}
                              <span style={{ display: "block", fontSize: 11, color: theme.inkFaint }}>
                                equity ≈ {fmt(scenario.equity)}
                              </span>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {outlook.disclaimers.map((line) => (
                  <p key={line} style={{ margin: 0, fontSize: 11.5, lineHeight: 1.55, color: theme.inkFaint }}>
                    {line}
                  </p>
                ))}
              </div>
            );
          })()}

          {(() => {
            const group = props.profileId ? financingProgramsFor(props.profileId) : null;
            if (!group) return null;
            return (
              <div
                style={{
                  display: "grid",
                  gap: 12,
                  padding: "16px 18px",
                  borderRadius: 12,
                  background: theme.plate,
                  border: `1px solid ${theme.plateBorder}`,
                }}
              >
                <div style={{ display: "grid", gap: 4 }}>
                  <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: theme.ink }}>
                    Programs you may also qualify for
                  </h4>
                  <p style={{ margin: 0, fontSize: 12, lineHeight: 1.55, color: theme.inkSoft }}>
                    Beyond the purchase lanes above — grants and government-backed programs, with their real
                    mechanism and where to confirm. Not offers or approvals.
                  </p>
                </div>
                {group.note && (
                  <p style={{ margin: 0, fontSize: 12, lineHeight: 1.55, color: theme.inkSoft }}>{group.note}</p>
                )}
                <div style={{ display: "grid", gap: 10 }}>
                  {group.programs.map((prog) => (
                    <div
                      key={prog.id}
                      style={{
                        display: "grid",
                        gap: 3,
                        padding: "10px 12px",
                        borderRadius: 9,
                        background: theme.cellBg,
                        border: `1px solid ${theme.cellBorder}`,
                      }}
                    >
                      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: theme.ink }}>{prog.name}</span>
                        <span
                          style={{
                            fontSize: 10.5,
                            fontWeight: 600,
                            textTransform: "uppercase",
                            letterSpacing: 0.4,
                            color: theme.accent,
                          }}
                        >
                          {prog.mechanism}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5, color: theme.ink }}>{prog.terms}</p>
                      <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5, color: theme.inkSoft }}>
                        <strong style={{ fontWeight: 600 }}>Who qualifies:</strong> {prog.eligibility}
                      </p>
                      <p style={{ margin: 0, fontSize: 11.5, lineHeight: 1.5, color: theme.inkFaint }}>
                        Confirm at {prog.confirmAt}. {prog.source} · {prog.asOf}.
                      </p>
                    </div>
                  ))}
                </div>
                <p style={{ margin: 0, fontSize: 11.5, lineHeight: 1.55, color: theme.inkFaint }}>
                  {group.disclaimer}
                </p>
              </div>
            );
          })()}

          <div style={{ display: "grid", gap: 4 }}>
            {model.disclaimers.map((line) => (
              <p key={line} style={{ margin: 0, fontSize: 11.5, lineHeight: 1.55, color: theme.inkFaint }}>
                {line}
              </p>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
