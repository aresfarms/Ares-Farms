"use client";

import { useMemo, useState } from "react";
import { compareFinancingScenario, type FinancingScenarioInput } from "@/lib/financing/financingCostComparison";

type Editable = Omit<FinancingScenarioInput, "id"> & { id: string };

const initial = (id: string, label: string): Editable => ({
  id,
  label,
  projectCostUsd: 1_000_000,
  equityPct: 20,
  annualRatePct: 7,
  amortizationYears: 25,
  termYears: 10,
  upfrontFeePct: 1,
  annualNoiUsd: null,
});

const money = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
const number = (value: number, digits = 2) => value.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });

export function FinancingCostComparator() {
  const [rows, setRows] = useState<Editable[]>([initial("a", "Option A"), initial("b", "Option B")]);
  const comparison = useMemo(() => {
    try {
      return { results: rows.map((row) => compareFinancingScenario(row)), error: null as string | null };
    } catch (err) {
      return { results: [], error: err instanceof Error ? err.message : "Check the scenario inputs." };
    }
  }, [rows]);
  const { results, error } = comparison;

  function set<K extends keyof Editable>(id: string, key: K, value: Editable[K]) {
    setRows((current) => current.map((row) => row.id === id ? { ...row, [key]: value } : row));
  }

  function add() {
    if (rows.length >= 4) return;
    const id = String.fromCharCode(97 + rows.length);
    setRows((current) => [...current, initial(id, `Option ${String.fromCharCode(65 + current.length)}`)]);
  }

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <section style={{ border: "1px solid #d7deea", borderRadius: 16, background: "#fff", padding: 18, display: "grid", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <h2 style={{ margin: 0, color: "#162033", fontSize: 20 }}>Enter the terms you actually want to compare</h2>
            <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 13 }}>Furlong does not invent lender quotes here. Use a published program assumption or a provider&apos;s actual term sheet.</p>
          </div>
          <button type="button" onClick={add} disabled={rows.length >= 4} style={button}>+ Add option</button>
        </div>
        {rows.map((row, index) => (
          <article key={row.id} style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 14, background: "#fbfcfe", display: "grid", gap: 10 }}>
            <div style={{ display: "flex", gap: 8, justifyContent: "space-between" }}>
              <input aria-label={`Option ${index + 1} label`} value={row.label} onChange={(event) => set(row.id, "label", event.target.value)} style={{ ...field, fontWeight: 800 }} />
              {rows.length > 2 && <button type="button" onClick={() => setRows((current) => current.filter((item) => item.id !== row.id))} style={removeButton}>Remove</button>}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 9 }}>
              <Field label="Project cost" value={row.projectCostUsd} onChange={(v) => set(row.id, "projectCostUsd", v)} prefix="$" />
              <Field label="Equity / down" value={row.equityPct} onChange={(v) => set(row.id, "equityPct", v)} suffix="%" />
              <Field label="Annual rate" value={row.annualRatePct} onChange={(v) => set(row.id, "annualRatePct", v)} suffix="%" step="0.01" />
              <Field label="Amortization" value={row.amortizationYears} onChange={(v) => set(row.id, "amortizationYears", v)} suffix="yr" />
              <Field label="Term / balloon" value={row.termYears} onChange={(v) => set(row.id, "termYears", v)} suffix="yr" />
              <Field label="Upfront fee" value={row.upfrontFeePct} onChange={(v) => set(row.id, "upfrontFeePct", v)} suffix="%" step="0.01" />
              <Field label="Annual NOI (optional)" value={row.annualNoiUsd ?? ""} onChange={(v) => set(row.id, "annualNoiUsd", v > 0 ? v : null)} prefix="$" />
            </div>
          </article>
        ))}
        {error && <p role="alert" style={{ margin: 0, color: "#b42318", fontSize: 13 }}>{error}</p>}
      </section>

      {results.length > 0 && (
        <section style={{ overflowX: "auto", border: "1px solid #d7deea", borderRadius: 16, background: "#fff", padding: 18 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
            <caption style={{ textAlign: "left", fontWeight: 800, color: "#162033", paddingBottom: 12 }}>Side-by-side financing screen</caption>
            <thead><tr><th style={th}>Measure</th>{results.map((result) => <th key={result.id} style={th}>{result.label}</th>)}</tr></thead>
            <tbody>
              <Row label="Loan amount" values={results.map((r) => money(r.loanAmountUsd))} />
              <Row label="Cash equity" values={results.map((r) => money(r.equityCashUsd))} />
              <Row label="Upfront fee" values={results.map((r) => money(r.upfrontFeeUsd))} />
              <Row label="Cash before other closing costs" values={results.map((r) => money(r.estimatedCashBeforeOtherClosingCostsUsd))} />
              <Row label="Monthly principal + interest" values={results.map((r) => money(r.monthlyPrincipalInterestUsd))} />
              <Row label="Annual debt service" values={results.map((r) => money(r.annualDebtServiceUsd))} />
              <Row label="DSCR (if NOI entered)" values={results.map((r) => r.dscr == null ? "—" : `${number(r.dscr)}×`)} />
              <Row label="Principal paid through stated term" values={results.map((r) => money(r.principalReductionThroughTermUsd))} />
              <Row label="Interest through stated term" values={results.map((r) => money(r.interestThroughTermUsd))} />
              <Row label="Remaining balance / balloon" values={results.map((r) => r.hasBalloon ? money(r.remainingBalanceAtTermUsd) : "$0")} />
              <Row label="Screening financing cost through term" values={results.map((r) => money(r.screeningFinancingCostThroughTermUsd))} />
            </tbody>
          </table>
        </section>
      )}

      <section style={{ border: "1px solid #ead8aa", borderRadius: 14, background: "#fffaf0", padding: "15px 17px", display: "grid", gap: 6, color: "#5b4a22", fontSize: 12.5, lineHeight: 1.55 }}>
        <strong>This is a transparent cost screen, not an APR disclosure or a lender quote.</strong>
        <span>“Screening financing cost” = scheduled interest through the stated term + the upfront fee you entered. It excludes legal, appraisal, environmental, guarantee, insurance, servicing, prepayment, third-party, tax and other closing costs unless you model them separately. A balloon is the modeled remaining principal at the stated term.</span>
      </section>
    </div>
  );
}

function Field({ label, value, onChange, prefix, suffix, step = "1" }: { label: string; value: number | string; onChange: (value: number) => void; prefix?: string; suffix?: string; step?: string }) {
  return <label style={{ display: "grid", gap: 4, color: "#475569", fontSize: 12, fontWeight: 700 }}><span>{label}</span><span style={{ display: "flex", alignItems: "center", gap: 5 }}>{prefix && <span>{prefix}</span>}<input type="number" min="0" step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} style={{ ...field, width: "100%" }} />{suffix && <span>{suffix}</span>}</span></label>;
}

function Row({ label, values }: { label: string; values: string[] }) {
  return <tr><td style={{ ...td, fontWeight: 700, color: "#334155" }}>{label}</td>{values.map((value, index) => <td key={`${label}-${index}`} style={td}>{value}</td>)}</tr>;
}

const field = { minHeight: 38, border: "1px solid #cbd5e1", borderRadius: 9, background: "#fff", color: "#162033", padding: "7px 9px", fontSize: 13 } as const;
const button = { border: "1px solid #0f766e", borderRadius: 999, background: "#fff", color: "#0f766e", fontWeight: 800, padding: "8px 12px", cursor: "pointer" } as const;
const removeButton = { border: 0, background: "transparent", color: "#9a3412", fontSize: 12, fontWeight: 700, cursor: "pointer" } as const;
const th = { textAlign: "right", padding: "8px 10px", borderBottom: "1px solid #cbd5e1", color: "#64748b", fontSize: 12 } as const;
const td = { textAlign: "right", padding: "9px 10px", borderBottom: "1px solid #eef2f7", color: "#334155", fontSize: 13 } as const;
