"use client";

import { useMemo, useState } from "react";
import type { ChartTheme } from "@/lib/property/chartThemes";
import { buildAgriculturalProForma, defaultAgriculturalProFormaInputs } from "@/lib/property/agriculturalProForma";

const money = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
const num = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 1 });

export function AgriculturalProFormaPanel(props: { acreage: number; price: number; rate: number; theme: ChartTheme }) {
  const [inputs, setInputs] = useState(() => defaultAgriculturalProFormaInputs({ tractAcres: props.acreage, purchasePrice: props.price, annualRatePct: props.rate }));
  const model = useMemo(() => buildAgriculturalProForma(inputs), [inputs]);
  const set = (key: keyof typeof inputs, value: string) => setInputs((current) => ({ ...current, [key]: Number(value) || 0 }));
  const input = (label: string, key: keyof typeof inputs, suffix: string) => <label style={{ display: "grid", gap: 4, fontSize: 11.5, color: props.theme.inkSoft }}><span>{label}</span><span style={{ display: "flex", alignItems: "center", gap: 5 }}><input value={inputs[key]} onChange={(e) => set(key, e.target.value)} inputMode="decimal" style={{ width: 92, padding: "7px 8px", border: `1px solid ${props.theme.cellBorder}`, borderRadius: 7, font: "inherit", color: props.theme.ink }} /><span>{suffix}</span></span></label>;
  const pass = (model.debt.dscr ?? 0) >= model.debt.threshold;
  return <section style={{ display: "grid", gap: 12, padding: 16, border: `2px solid ${props.theme.accent}`, borderRadius: 12, background: props.theme.plate }}>
    <div><strong style={{ display: "block", fontSize: 16, color: props.theme.ink }}>Working-farm operating pro forma</strong><span style={{ fontSize: 12, color: props.theme.inkSoft }}>Editable tract-level underwriting model. Assumptions are visible and do not masquerade as verified farm records.</span></div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 9 }}>{input("Tract acreage", "tractAcres", "ac")}{input("Tillable share", "tillablePct", "%")}{input("Corn share", "cornSharePct", "%")}{input("Corn yield", "cornYieldBu", "bu/ac")}{input("Soybean yield", "soybeanYieldBu", "bu/ac")}{input("Corn price", "cornPrice", "$/bu")}{input("Soybean price", "soybeanPrice", "$/bu")}{input("Corn variable cost", "cornVariableCostPerAcre", "$/ac")}{input("Soy variable cost", "soybeanVariableCostPerAcre", "$/ac")}{input("Fixed overhead", "fixedOverheadPerAcre", "$/ac")}{input("Down payment", "downPaymentPct", "%")}{input("Rate", "annualRatePct", "%")}{input("Amortization", "amortizationYears", "years")}</div>
    <div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}><tbody>
      <tr><th style={{ textAlign: "left", padding: 7 }}>Acreage allocation</th><td style={{ padding: 7 }}>{num(model.acreage.tillableAcres)} tillable · {num(model.acreage.nonTillableAcres)} non-tillable · {num(model.acreage.cornAcres)} corn · {num(model.acreage.soybeanAcres)} soybeans</td></tr>
      <tr><th style={{ textAlign: "left", padding: 7 }}>Gross crop revenue</th><td style={{ padding: 7 }}>{money(model.revenue.grossCropRevenue)} ({money(model.revenue.cornRevenue)} corn + {money(model.revenue.soybeanRevenue)} soybeans)</td></tr>
      <tr><th style={{ textAlign: "left", padding: 7 }}>Operating expense</th><td style={{ padding: 7 }}>{money(model.expenses.totalOperatingExpense)} ({money(model.expenses.cornVariableCosts)} corn + {money(model.expenses.soybeanVariableCosts)} soybeans + {money(model.expenses.fixedOverhead)} overhead)</td></tr>
      <tr><th style={{ textAlign: "left", padding: 7 }}>Farm NOI</th><td style={{ padding: 7 }}><strong>{money(model.revenue.grossCropRevenue - model.expenses.totalOperatingExpense)}</strong></td></tr>
      <tr><th style={{ textAlign: "left", padding: 7 }}>Annual debt service</th><td style={{ padding: 7 }}>{money(model.debt.annualDebtService)} on {money(model.debt.loanAmount)}</td></tr>
      <tr><th style={{ textAlign: "left", padding: 7 }}>DSCR</th><td style={{ padding: 7 }}><strong style={{ color: pass ? "#166534" : "#9A3412" }}>{model.debt.dscr?.toFixed(2)}x — {pass ? "meets" : "does not meet"} the 1.25x screening threshold</strong></td></tr>
      <tr><th style={{ textAlign: "left", padding: 7 }}>Cash-rent alternative</th><td style={{ padding: 7 }}>{money(model.revenue.cashRentLow)}–{money(model.revenue.cashRentHigh)}/yr · DSCR {model.debt.cashRentDscrLow?.toFixed(2)}x–{model.debt.cashRentDscrHigh?.toFixed(2)}x</td></tr>
    </tbody></table></div>
    <details><summary style={{ cursor: "pointer", fontWeight: 800 }}>Sources, assumptions, and lender-readiness gaps</summary><ul style={{ fontSize: 11.5, lineHeight: 1.55 }}>{Object.values(model.provenance).map((line) => <li key={line}>{line}</li>)}{model.readiness.map((line) => <li key={line}>{line}</li>)}</ul></details>
  </section>;
}
