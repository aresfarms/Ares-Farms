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

  const price = assumedPrice ?? props.listedPrice;
  const priceIsAssumption = assumedPrice !== null;

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
    if (Number.isFinite(parsed) && parsed >= 10_000) setAssumedPrice(Math.round(parsed));
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
          display: "flex",
          gap: 10,
          alignItems: "center",
          flexWrap: "wrap",
          fontSize: 13,
          color: theme.inkSoft,
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
          <span>
            This listing does not publish a price. Enter the price you would offer and the numbers
            fill in — the number stays on this page:
          </span>
        )}
        <span style={{ display: "inline-flex", gap: 6 }}>
          <input
            inputMode="numeric"
            aria-label="Price to estimate with, dollars"
            placeholder="e.g. 250,000"
            value={priceInput}
            onChange={(event) => setPriceInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") applyPriceInput();
            }}
            style={{
              font: "inherit",
              fontSize: 13,
              width: 120,
              padding: "6px 10px",
              borderRadius: 8,
              border: `1px solid ${theme.plateBorder}`,
              background: theme.cellBg,
              color: theme.ink,
            }}
          />
          <button
            type="button"
            onClick={applyPriceInput}
            style={{
              font: "inherit",
              fontSize: 12.5,
              fontWeight: 800,
              padding: "6px 14px",
              borderRadius: 8,
              border: `1px solid ${theme.accent}`,
              background: "transparent",
              color: theme.accent,
              cursor: "pointer",
            }}
          >
            Estimate
          </button>
        </span>
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
                The cost horizon (FHA path, today&apos;s dollars)
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
            const outlook = buildEquityOutlook(price, props.context);
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
