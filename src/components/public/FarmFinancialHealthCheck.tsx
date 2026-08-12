"use client";

/**
 * FarmFinancialHealthCheck — the free Farm Financial Health self-check.
 *
 * Founder direction 2026-07-20 ("add it in"): the Pinion-SnapShot idea done the
 * Furlong way — a farmer enters their OWN numbers and sees the standard public
 * Farm Financial Scorecard measures with their published "strong / watch /
 * vulnerable" bands. Facts + calculator only. Never advice: "what do I do about
 * it" routes to the Guild / Stuart's licensed advisory (the licensing seam).
 *
 * Stateless + client-side: the operator's numbers live only in this component's
 * React state — nothing is sent anywhere, nothing is persisted (no PII store).
 * The math is the pure, fs-free computeScorecard(); this file is only the UI.
 */

import { useMemo, useState } from "react";

import {
  computeScorecard,
  emptyScorecardInputs,
  type ScorecardInputs,
  type ScorecardMeasure,
  type ScorecardZone,
} from "@/lib/property/farmFinancialScorecard";
import { LANE_THEMES } from "@/lib/property/laneThemes";

const FARM = LANE_THEMES.farm;

// Zone → color. Semantic (good / watch / critical), deliberately NOT the farm
// accent so a healthy green ratio never reads as "this is the brand color".
const ZONE_COLOR: Record<ScorecardZone, { fg: string; bg: string; border: string }> = {
  strong: { fg: "#12603f", bg: "#e7f4ec", border: "#bfe2ce" },
  watch: { fg: "#8a4b09", bg: "#fdf1e1", border: "#f0d4ac" },
  vulnerable: { fg: "#9f1d1d", bg: "#fbe9e9", border: "#f0c4c4" },
  info: { fg: "#64748b", bg: "#eef2f6", border: "#dbe2ea" },
};

const card = {
  border: "1px solid #d7deea",
  borderRadius: 14,
  background: "#ffffff",
  padding: "16px 17px",
} as const;

const sectionKicker = {
  fontSize: 11.5,
  fontWeight: 800,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: FARM.accent,
} as const;

const labelStyle = {
  fontSize: 12,
  fontWeight: 700,
  color: "#3b475a",
  lineHeight: 1.35,
} as const;

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid #cdd6e4",
  borderRadius: 9,
  padding: "8px 10px 8px 22px",
  fontSize: 14,
  fontVariantNumeric: "tabular-nums",
  color: "#101a2b",
  background: "#ffffff",
} as const;

// The nine inputs, grouped the way a farmer's own balance sheet / income
// statement is laid out.
const FIELDS: {
  key: keyof ScorecardInputs;
  label: string;
  hint: string;
  group: string;
}[] = [
  { key: "totalFarmAssets", label: "Total farm assets", hint: "everything the farm owns, at market value", group: "Balance sheet" },
  { key: "totalFarmLiabilities", label: "Total farm liabilities", hint: "everything the farm owes", group: "Balance sheet" },
  { key: "currentFarmAssets", label: "Current assets", hint: "cash + what you'll sell or use within 12 months", group: "Balance sheet" },
  { key: "currentFarmLiabilities", label: "Current liabilities", hint: "what's due within 12 months", group: "Balance sheet" },
  { key: "grossFarmRevenue", label: "Gross farm revenue", hint: "a full year of farm income", group: "Income & expense (one year)" },
  { key: "operatingExpense", label: "Operating expense", hint: "cash operating costs — NOT interest or depreciation", group: "Income & expense (one year)" },
  { key: "interestExpense", label: "Interest expense", hint: "total interest paid that year", group: "Income & expense (one year)" },
  { key: "depreciationExpense", label: "Depreciation", hint: "the year's depreciation", group: "Income & expense (one year)" },
  { key: "termDebtPayments", label: "Scheduled term-loan payments", hint: "principal + interest owed that year on term debt", group: "Income & expense (one year)" },
];

function ZoneChip({ measure }: { measure: ScorecardMeasure }) {
  const c = ZONE_COLOR[measure.zone];
  return (
    <span
      style={{
        fontSize: 10.5,
        fontWeight: 800,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        color: c.fg,
        background: c.bg,
        border: `1px solid ${c.border}`,
        borderRadius: 999,
        padding: "3px 9px",
        whiteSpace: "nowrap",
      }}
    >
      {measure.zoneLabel}
    </span>
  );
}

function MeasureRow({ measure }: { measure: ScorecardMeasure }) {
  const computed = measure.value !== null;
  const c = ZONE_COLOR[measure.zone];
  return (
    <div
      style={{
        display: "grid",
        gap: 6,
        padding: "12px 0",
        borderTop: "1px solid #eef2f6",
        opacity: computed ? 1 : 0.6,
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <strong style={{ fontSize: 14, color: "#101a2b", lineHeight: 1.25 }}>
          {measure.label}
          {measure.approximate && (
            <span style={{ fontSize: 10.5, fontWeight: 700, color: "#8a4b09", marginLeft: 6 }}>rough screen</span>
          )}
        </strong>
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 17, fontWeight: 800, color: computed ? c.fg : "#9aa6b6", fontVariantNumeric: "tabular-nums" }}>
            {measure.display}
          </span>
          {computed && <ZoneChip measure={measure} />}
        </span>
      </div>
      <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5, color: "#4d596d" }}>{measure.whatItMeasures}</p>
      <span style={{ fontSize: 11, color: "#8a97a8", fontVariantNumeric: "tabular-nums" }}>{measure.benchmark}</span>
    </div>
  );
}

export function FarmFinancialHealthCheck() {
  const [inputs, setInputs] = useState<ScorecardInputs>(emptyScorecardInputs());
  const [raw, setRaw] = useState<Record<string, string>>({});

  const result = useMemo(() => computeScorecard(inputs), [inputs]);

  const setField = (key: keyof ScorecardInputs, text: string) => {
    setRaw((r) => ({ ...r, [key]: text }));
    const cleaned = text.replace(/[^0-9.\-]/g, "");
    const n = cleaned === "" || cleaned === "-" ? null : Number(cleaned);
    setInputs((prev) => ({ ...prev, [key]: n !== null && Number.isFinite(n) ? n : null }));
  };

  const reset = () => {
    setInputs(emptyScorecardInputs());
    setRaw({});
  };

  // Download the operator's own numbers as a local ledger (founder direction
  // 2026-07-20). Device-side only — nothing is sent to or stored on the server;
  // the file is built in the browser from the current inputs + computed measures.
  const downloadLedger = () => {
    const payload = {
      document: "Furlong — Farm Financial Health self-check",
      generatedOn: new Date().toISOString().slice(0, 10),
      privacy: "Your numbers stay on your device. Furlong stored nothing.",
      yourNumbers: inputs,
      netFarmIncome: result.netFarmIncome,
      measures: result.measures.map((m) => ({
        measure: m.label,
        category: m.category,
        value: m.display,
        band: m.zoneLabel,
        benchmark: m.benchmark,
      })),
      sources: "Farm Financial Standards Council; University of Minnesota CFFM / FINBIN. Illustrative, not advice.",
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "furlong-farm-financials.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const groups = Array.from(new Set(FIELDS.map((f) => f.group)));
  const anyComputed = result.computedCount > 0;

  return (
    <section aria-label="Farm financial health self-check" style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "grid", gap: 4 }}>
        <span style={sectionKicker}>Farm financial health — self-check</span>
        <strong style={{ fontSize: 22, color: "#101a2b", lineHeight: 1.15 }}>
          Is the operation healthy? Run your own numbers.
        </strong>
        <p style={{ margin: "2px 0 0", fontSize: 13, lineHeight: 1.6, color: "#3b475a", maxWidth: "70ch" }}>
          Enter your farm&apos;s numbers and see the standard{" "}
          <strong>Farm Financial Scorecard</strong>{" "}measures — the same liquidity, solvency, profitability,
          efficiency, and repayment ratios a lender or advisor runs — each next to its published
          &ldquo;strong / watch / vulnerable&rdquo; band. Nothing you type leaves this page or is saved. This is a
          calculator, not advice.
        </p>
      </div>

      {/* Inputs */}
      <div style={{ ...card, display: "grid", gap: 16 }}>
        {groups.map((group) => (
          <div key={group} style={{ display: "grid", gap: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.05em", textTransform: "uppercase", color: "#708997" }}>
              {group}
            </span>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
              {FIELDS.filter((f) => f.group === group).map((f) => (
                <label key={f.key} style={{ display: "grid", gap: 4 }}>
                  <span style={labelStyle}>{f.label}</span>
                  <span style={{ position: "relative", display: "block" }}>
                    <span
                      aria-hidden
                      style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "#9aa6b6" }}
                    >
                      $
                    </span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={raw[f.key] ?? ""}
                      onChange={(e) => setField(f.key, e.target.value)}
                      placeholder="0"
                      aria-label={`${f.label} in dollars`}
                      style={inputStyle}
                    />
                  </span>
                  <span style={{ fontSize: 10.5, color: "#8a97a8", lineHeight: 1.35 }}>{f.hint}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <span style={{ fontSize: 11.5, color: "#8a97a8" }}>
            Enter whatever you have — every ratio computes on its own as soon as its inputs are filled.
          </span>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {anyComputed && (
              <button
                type="button"
                onClick={downloadLedger}
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: "#ffffff",
                  background: FARM.accent,
                  border: "none",
                  borderRadius: 999,
                  padding: "6px 14px",
                  cursor: "pointer",
                }}
              >
                ↓ Download my numbers
              </button>
            )}
            <button
              type="button"
              onClick={reset}
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#4d596d",
                background: "#ffffff",
                border: "1px solid #d7deea",
                borderRadius: 999,
                padding: "6px 14px",
                cursor: "pointer",
              }}
            >
              Clear
            </button>
          </div>
        </div>
        {anyComputed && (
          <span style={{ fontSize: 11, color: "#8a97a8", lineHeight: 1.5 }}>
            &ldquo;Download my numbers&rdquo; saves your figures + these ratios to a file on your device — your
            local ledger. Nothing is sent to us or stored on our servers.
          </span>
        )}
      </div>

      {/* Results */}
      {anyComputed && (
        <>
          {typeof result.netFarmIncome === "number" && (
            <div
              style={{
                ...card,
                background: FARM.tileBg,
                border: `1px solid ${FARM.tileBg}`,
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <span style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", color: FARM.tileLabel }}>
                Net farm income from operations
              </span>
              <strong style={{ fontSize: 26, color: FARM.tileValue, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
                {result.measures.find((m) => m.id === "net-farm-income")?.display}
              </strong>
            </div>
          )}

          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", alignItems: "start" }}>
            {result.categories
              .filter((cat) => cat.measures.some((m) => m.value !== null))
              .map((cat) => (
                <div key={cat.name} style={{ ...card, display: "grid", gap: 2 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 800, color: "#101a2b" }}>{cat.name}</span>
                  <span style={{ fontSize: 11.5, color: "#708997", lineHeight: 1.45 }}>{cat.blurb}</span>
                  {cat.measures.map((m) => (
                    <MeasureRow key={m.id} measure={m} />
                  ))}
                </div>
              ))}
          </div>
        </>
      )}

      {/* The licensing seam — the ONLY place "what do I do about it" is answered. */}
      <div
        style={{
          background: "#eef0fe",
          border: "1px solid #d5d8fa",
          borderLeft: "3px solid #534AB7",
          borderRadius: "0 12px 12px 0",
          padding: "14px 16px",
          display: "grid",
          gap: 6,
        }}
      >
        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.05em", textTransform: "uppercase", color: "#534AB7" }}>
          What the numbers don&apos;t tell you
        </span>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: "#312a6b" }}>
          A ratio shows you <em>where</em>{" "}the operation stands — not <em>what to do</em>{" "}about it. Reading a watch or
          vulnerable band, and building the plan that moves it, is licensed financial and lending work. That&apos;s the
          Guild &mdash; and, for lending, Stuart&apos;s licensed desk. Bring these numbers to a real advisor before you
          act on them.
        </p>
      </div>

      {/* Sources + honesty line */}
      <p style={{ margin: 0, fontSize: 11, lineHeight: 1.6, color: "#8a97a8", maxWidth: "78ch" }}>
        Measures and critical values are the published Farm Financial Scorecard (Farm Financial Standards Council;
        University of Minnesota Center for Farm Financial Management / FINBIN). &ldquo;Rough screen&rdquo; measures
        simplify the full definition — they omit inputs this quick check doesn&apos;t ask for (unpaid operator labor,
        off-farm income, family living, income tax), so read them as a floor, not a finding. Confirm your figures and
        the full ratios with public tools like University of Illinois{" "}
        <a href="https://farmdoc.illinois.edu/" target="_blank" rel="noopener noreferrer" style={{ color: FARM.accent }}>
          farmdoc ↗
        </a>
        . Illustrative and educational — not financial, lending, tax, or investment advice.
      </p>
    </section>
  );
}
