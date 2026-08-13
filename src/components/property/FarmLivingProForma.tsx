"use client";

/**
 * FarmLivingProForma — the interactive best-use + coverage answer for a parcel
 * (founder direction 2026-08-12). Replaces the old "Diversify" cards with:
 *   1. a PROMINENT coverage verdict — "can this property carry its own debt?"
 *      (clears / close / cannot), leading with the plain-language buy / walk-away
 *      call and the WHY;
 *   2. a living pro-forma TABLE — every modeled enterprise with its real per-acre
 *      and annual economics, so the numbers are visible and comparable;
 *   3. a "your scenario" pick — choose a different enterprise than best-case and
 *      watch the verdict and numbers recompute.
 *
 * All math is the DETERMINISTIC pure optimizer + dscrCoverageSolver run
 * client-side — no AI generates any number or the verdict. Advisory screening
 * only: never an appraisal, agronomic prescription, or credit decision.
 */

import { Fragment, useMemo, useState, type CSSProperties } from "react";
import { optimizeAgriculturalOpportunities, type OpportunityKey } from "@/lib/property/agriculturalOpportunityOptimizer";
import { solveDscrCoverage, type SoilConstraintInput, DSCR_FLOOR } from "@/lib/property/dscrCoverageSolver";

const money = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
const perAc = (total: number, acres: number) => (acres > 0 ? total / acres : 0);
const signed = (n: number) => `${n < 0 ? "−" : ""}$${Math.abs(Math.round(n)).toLocaleString("en-US")}`;

// Word-document calm, spreadsheet-precise.
const ink = "#1a2233";
const inkSoft = "#5a6472";
const line = "#e4e7ec";
const paper = "#ffffff";
const railBg = "#f7f8fa";
const figures = { fontVariantNumeric: "tabular-nums", fontFeatureSettings: '"tnum"' } as const;

export interface FarmLivingProFormaProps {
  acres: number;
  /** List price when known; null falls back to the BPO estimate. */
  listPrice: number | null;
  /** Broker price opinion / estimated value, used when no list price. */
  bpo?: number | null;
  ratePct?: number;
  amortYears?: number;
  ltv?: number;
  soil?: SoilConstraintInput | null;
}

export function FarmLivingProForma(props: FarmLivingProFormaProps) {
  const ratePct = props.ratePct ?? 7;
  const amortYears = props.amortYears ?? 25;
  const ltv = props.ltv ?? 0.8;
  const hasList = typeof props.listPrice === "number" && props.listPrice > 0;

  const [acres, setAcres] = useState(props.acres > 0 ? props.acres : 60);
  const [useBpo, setUseBpo] = useState(!hasList);
  const [price, setPrice] = useState(
    (hasList ? props.listPrice : props.bpo) ?? 600_000,
  );
  const [rate, setRate] = useState(ratePct);
  const [pick, setPick] = useState<OpportunityKey | null>(null);
  const [openRow, setOpenRow] = useState<OpportunityKey | null>(null);

  const r = rate / 100;
  const annualDebtService = useMemo(
    () => (price > 0 ? price * ltv * (r > 0 ? r / (1 - Math.pow(1 + r, -amortYears)) : 1 / amortYears) : 0),
    [price, ltv, r, amortYears],
  );

  const coverage = useMemo(
    () =>
      solveDscrCoverage({
        acres,
        screeningPrice: price,
        annualDebtService,
        ratePct: rate,
        amortYears,
        ltv,
        soil: props.soil ?? null,
      }),
    [acres, price, annualDebtService, rate, amortYears, ltv, props.soil],
  );

  const model = useMemo(
    () =>
      optimizeAgriculturalOpportunities({
        acres,
        purchasePrice: price,
        debtService: annualDebtService,
        waterScore: 70,
        laborCapacity: 55,
        capitalCapacity: 55,
        marketAccess: 60,
        gridEvidence: false,
        solarZoningEvidence: false,
        ...(props.soil?.capabilityClass != null
          ? { soilSuitability: props.soil.capabilityClass <= 2 ? 85 : props.soil.capabilityClass <= 4 ? 60 : 35 }
          : {}),
      }),
    [acres, price, annualDebtService, props.soil],
  );

  // Rows: every eligible enterprise, ranked by real net; money-losers sink to
  // the bottom because we rank on NOI (fixes commodity-as-best on small ground).
  const rows = useMemo(
    () => model.ranked.filter((x) => x.eligible).slice().sort((a, b) => b.noi - a.noi),
    [model],
  );

  const bestKey = rows[0]?.key ?? null;
  const pickedRow = pick ? rows.find((x) => x.key === pick) ?? null : null;
  const pickedDscr = pickedRow && annualDebtService > 0 ? pickedRow.noi / annualDebtService : null;

  // Verdict styling.
  const v = coverage.verdict;
  const tone =
    v === "clears" ? { bg: "#eef7f0", bd: "#57997a", ink: "#14532d", tag: "CARRIES ITS OWN DEBT" }
    : v === "close" ? { bg: "#fdf6e9", bd: "#c99a3a", ink: "#7a5312", tag: "CLOSE — DOESN'T CLEAR THE LENDER FLOOR" }
    : { bg: "#fbeeee", bd: "#c26565", ink: "#7f1d1d", tag: "THE NUMBERS SAY THINK HARD" };

  const bestNoi = Math.max(coverage.bestSingle?.annualNoi ?? 0, coverage.bestMix?.annualNoi ?? 0);
  const bestDscr = annualDebtService > 0 ? bestNoi / annualDebtService : 0;

  // Best case is the most profitable PLAN — a combination of revenue streams
  // when the mix out-earns any single enterprise (common on small acreage),
  // otherwise the single enterprise, stated plainly (founder direction
  // 2026-08-13: evaluate all streams, and say when one alone is genuinely best).
  const mixNoi = coverage.bestMix?.annualNoi ?? 0;
  const bestIsMix = mixNoi >= (coverage.bestSingle?.annualNoi ?? 0) && (coverage.bestMix?.parts.length ?? 0) > 1;
  const bestPlanLabel = bestIsMix
    ? coverage.bestMix!.parts.map((pt) => `${pt.sharePct}% ${pt.label}`).join("  +  ")
    : coverage.bestSingle?.label ?? rows[0]?.label ?? "No feasible use";
  const bestPlanKind = bestIsMix
    ? `Combination — ${coverage.bestMix!.parts.length} revenue streams`
    : "Single enterprise is best here";

  const verdictLine =
    v === "clears"
      ? `On the screening numbers, this parcel can carry its own mortgage: the best modeled use nets about ${money(bestNoi)}/yr against ~${money(coverage.annualDebtService)}/yr of debt service — a ${bestDscr.toFixed(2)}× coverage, at or above the ${DSCR_FLOOR}× a lender looks for.`
      : v === "close"
        ? `This parcel covers the payment but falls short of the ${DSCR_FLOOR}× lenders want. The best modeled use nets about ${money(bestNoi)}/yr (${bestDscr.toFixed(2)}×) against ~${money(coverage.annualDebtService)}/yr of debt — a gap of about ${money(coverage.gapAnnual ?? 0)}/yr. It pencils with roughly ${money(coverage.outsideIncomeNeeded ?? 0)}/yr of off-farm income (counted in global coverage), or at a price near ${coverage.maxSupportablePrice ? money(coverage.maxSupportablePrice) : "—"}.`
        : `On the numbers, agriculture alone will not carry this purchase at ${money(price)}. The best modeled use nets about ${money(bestNoi)}/yr (${bestDscr.toFixed(2)}×) against ~${money(coverage.annualDebtService)}/yr of debt — short about ${money(coverage.gapAnnual ?? 0)}/yr. It only starts to pencil near a price of ${coverage.maxSupportablePrice ? money(coverage.maxSupportablePrice) : "—"}, or with about ${money(coverage.outsideIncomeNeeded ?? 0)}/yr of outside income. Honestly: unless you're bringing that income or documented history the county screen doesn't see, this one is a hard look before you commit ${money(price)}.`;

  const th: CSSProperties = { textAlign: "right", padding: "8px 12px", fontSize: 11, fontWeight: 700, letterSpacing: ".03em", color: inkSoft, textTransform: "uppercase", borderBottom: `1.5px solid ${line}`, whiteSpace: "nowrap" };
  const thL: CSSProperties = { ...th, textAlign: "left" };
  const td: CSSProperties = { textAlign: "right", padding: "9px 12px", fontSize: 13.5, color: ink, borderBottom: `1px solid ${line}`, ...figures };
  const tdL: CSSProperties = { ...td, textAlign: "left" };

  const numInput = (label: string, value: number, onChange: (n: number) => void, step: number, prefix?: string) => (
    <label style={{ display: "grid", gap: 4, fontSize: 12, fontWeight: 650, color: inkSoft }}>
      {label}
      <span style={{ position: "relative", display: "flex", alignItems: "center" }}>
        {prefix && <span style={{ position: "absolute", left: 10, color: inkSoft, fontSize: 13 }}>{prefix}</span>}
        <input
          type="number" min="0" step={step} value={value}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          style={{ width: "100%", padding: prefix ? "8px 10px 8px 20px" : "8px 10px", border: `1px solid ${line}`, borderRadius: 8, fontSize: 14, color: ink, background: paper, ...figures }}
        />
      </span>
    </label>
  );

  return (
    <section data-testid="farm-living-proforma" style={{ display: "grid", gap: 16, color: ink, background: paper }}>
      <header style={{ display: "grid", gap: 5 }}>
        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", color: "#2f7d5b" }}>Can this land pay for itself?</span>
        <h3 style={{ margin: 0, fontSize: "clamp(19px,2.4vw,25px)", lineHeight: 1.2 }}>Best-use pro-forma for this parcel</h3>
        <p style={{ margin: 0, maxWidth: 760, fontSize: 13, lineHeight: 1.6, color: inkSoft }}>
          A screening estimate from county economics and the parcel&apos;s soil — not an appraisal, an agronomic
          prescription, or a credit decision. Change the inputs and the numbers move; verify soils, water, zoning,
          contracts, and buyers before you commit.
        </p>
      </header>

      {/* 1 — THE VERDICT */}
      <div style={{ border: `1px solid ${tone.bd}`, background: tone.bg, borderRadius: 12, padding: "16px 18px", display: "grid", gap: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 850, letterSpacing: ".08em", color: tone.ink }}>{tone.tag}</span>
        <p style={{ margin: 0, fontSize: 15, lineHeight: 1.55, color: tone.ink, fontWeight: 500 }}>{verdictLine}</p>
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap", fontSize: 12.5, color: tone.ink, ...figures }}>
          <span><strong>Debt service</strong> ~{money(coverage.annualDebtService)}/yr</span>
          <span><strong>Best modeled net</strong> {money(bestNoi)}/yr</span>
          <span><strong>Coverage</strong> {bestDscr.toFixed(2)}×</span>
          {coverage.maxSupportablePrice != null && v !== "clears" && (
            <span><strong>Pencils near</strong> {money(coverage.maxSupportablePrice)}</span>
          )}
        </div>
      </div>

      {/* Inputs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12, padding: 14, border: `1px solid ${line}`, borderRadius: 12, background: railBg }}>
        {numInput("Acres modeled", acres, setAcres, 1)}
        {numInput(useBpo ? "Estimated value (BPO)" : "Purchase price", price, setPrice, 5000, "$")}
        {numInput("Interest rate %", rate, setRate, 0.125)}
        {!hasList && (
          <label style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: inkSoft, alignSelf: "end", paddingBottom: 8 }}>
            <input type="checkbox" checked={useBpo} onChange={(e) => setUseBpo(e.target.checked)} /> Using estimated value (no list price)
          </label>
        )}
      </div>

      {/* 2 — THE LIVING TABLE */}
      <div style={{ overflowX: "auto", border: `1px solid ${line}`, borderRadius: 12 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 640 }}>
          <thead>
            <tr>
              <th style={thL}>Enterprise</th>
              <th style={th}>Acres</th>
              <th style={th}>Gross / ac</th>
              <th style={th}>Expenses / ac</th>
              <th style={th}>Net / ac</th>
              <th style={th}>Total net / yr</th>
              <th style={th}>Coverage</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((x) => {
              const isBest = x.key === bestKey;
              const isPick = x.key === pick;
              const dscr = annualDebtService > 0 ? x.noi / annualDebtService : null;
              const net = x.noi;
              const rowBg = isPick ? "#eef4ff" : isBest ? "#f3faf5" : paper;
              return (
                <Fragment key={x.key}>
                  <tr
                    onClick={() => setPick(isPick ? null : x.key)}
                    style={{ background: rowBg, cursor: "pointer" }}
                    title="Click to set as your scenario"
                  >
                    <td style={{ ...tdL, fontWeight: isBest || isPick ? 700 : 500 }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                        <span
                          onClick={(e) => { e.stopPropagation(); setOpenRow(openRow === x.key ? null : x.key); }}
                          style={{ color: inkSoft, fontSize: 12, width: 14, display: "inline-block" }}
                          aria-hidden
                        >{openRow === x.key ? "▾" : "▸"}</span>
                        {x.label}
                        {isBest && <span style={{ fontSize: 10, fontWeight: 800, color: "#166534", background: "#dcefe1", borderRadius: 5, padding: "1px 6px" }}>BEST</span>}
                        {isPick && !isBest && <span style={{ fontSize: 10, fontWeight: 800, color: "#1d4ed8", background: "#dbe6ff", borderRadius: 5, padding: "1px 6px" }}>YOUR PICK</span>}
                      </span>
                    </td>
                    <td style={td}>{x.usedAcres.toFixed(0)}</td>
                    <td style={td}>{money(perAc(x.gross, x.usedAcres))}</td>
                    <td style={td}>{money(perAc(x.opex, x.usedAcres))}</td>
                    <td style={{ ...td, color: net < 0 ? "#b91c1c" : ink, fontWeight: 600 }}>{signed(perAc(net, x.usedAcres))}</td>
                    <td style={{ ...td, color: net < 0 ? "#b91c1c" : ink, fontWeight: 700 }}>{signed(net)}</td>
                    <td style={td}>{dscr != null ? `${dscr.toFixed(2)}×` : "—"}</td>
                  </tr>
                  {openRow === x.key && (
                    <tr key={`${x.key}-detail`} style={{ background: railBg }}>
                      <td colSpan={7} style={{ padding: "10px 16px 12px 34px", fontSize: 12.5, color: inkSoft, borderBottom: `1px solid ${line}`, lineHeight: 1.6 }}>
                        <div style={{ display: "flex", gap: 20, flexWrap: "wrap", ...figures }}>
                          <span><strong style={{ color: ink }}>Gross</strong> {money(x.gross)}/yr</span>
                          <span><strong style={{ color: ink }}>Operating expenses</strong> {money(x.opex)}/yr</span>
                          <span><strong style={{ color: ink }}>Startup / establishment</strong> {money(x.startup)}</span>
                          {x.irrigationAnnual > 0 && <span><strong style={{ color: ink }}>Irrigation (in opex)</strong> {money(x.irrigationAnnual)}/yr</span>}
                        </div>
                        <p style={{ margin: "8px 0 0" }}>{x.note}</p>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 3 — BEST vs YOUR PICK */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>
        <div style={{ border: `1px solid ${line}`, borderRadius: 11, padding: 14, background: "#f3faf5" }}>
          <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase", color: "#166534" }}>Best case &middot; {bestPlanKind}</div>
          <strong style={{ display: "block", marginTop: 4, fontSize: 15, lineHeight: 1.35 }}>{bestPlanLabel}</strong>
          <div style={{ marginTop: 6, fontSize: 13, color: ink, ...figures }}>{money(bestNoi)}/yr &middot; {bestDscr.toFixed(2)}× coverage {bestIsMix ? "(all streams combined)" : ""}</div>
        </div>
        <div style={{ border: `1px solid ${pickedRow ? "#1d4ed8" : line}`, borderRadius: 11, padding: 14, background: pickedRow ? "#eef4ff" : railBg }}>
          <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase", color: pickedRow ? "#1d4ed8" : inkSoft }}>Your scenario</div>
          {pickedRow ? (
            <>
              <strong style={{ display: "block", marginTop: 4, fontSize: 15 }}>{pickedRow.label}</strong>
              <div style={{ marginTop: 6, fontSize: 13, color: ink, ...figures }}>
                {signed(pickedRow.noi)}/yr &middot; {pickedDscr != null ? `${pickedDscr.toFixed(2)}×` : "—"} coverage
                {pickedDscr != null && (
                  <span style={{ marginLeft: 8, color: pickedDscr >= DSCR_FLOOR ? "#166534" : pickedDscr >= 1 ? "#7a5312" : "#b91c1c", fontWeight: 700 }}>
                    {pickedDscr >= DSCR_FLOOR ? "clears the floor" : pickedDscr >= 1 ? "covers the payment, below floor" : `short ${money(annualDebtService - pickedRow.noi)}/yr`}
                  </span>
                )}
              </div>
            </>
          ) : (
            <p style={{ margin: "6px 0 0", fontSize: 12.5, color: inkSoft }}>Click any enterprise in the table to model it as your plan and compare it to the best case.</p>
          )}
        </div>
      </div>

      <p style={{ margin: 0, fontSize: 11.5, lineHeight: 1.55, color: inkSoft }}>
        {coverage.notes[0]}{" "}Screening model only — a documented operating history outranks these county assumptions at underwriting.
      </p>
    </section>
  );
}
