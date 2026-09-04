"use client";

import { useMemo, useState } from "react";
import type { CommercialUseScreen } from "@/lib/property/commercialUseModel";
import type { PropertyOperatingModelResult, OperatingUseType, OperatingRevenueCadence } from "@/lib/property/propertyOperatingModel";
import type { OperatingModelAiAdvice } from "@/lib/property/propertyOperatingModelAdvisor";

type ExpenseKey = "payrollMonthly" | "utilitiesMonthly" | "insuranceMonthly" | "propertyTaxMonthly" | "maintenanceHousekeepingMonthly" | "foodServicesMonthly" | "managementMarketingMonthly" | "licensingOtherMonthly";

type FormState = {
  useType: OperatingUseType;
  revenueCadence: OperatingRevenueCadence;
  unitCount: string;
  occupancyPct: string;
  averageUnitRevenue: string;
  ancillaryRevenueMonthly: string;
  replacementReservePct: string;
  acquisitionPrice: string;
  conversionCapex: string;
  professionalSoftCost: string;
  contingencyPct: string;
  loanAmount: string;
  interestRatePct: string;
  amortizationYears: string;
  targetDscr: string;
  expenses: Record<ExpenseKey, string>;
};

const money = (n: number | null | undefined) => n == null ? "—" : `$${Math.round(n).toLocaleString("en-US")}`;
const num = (v: string) => v.trim() === "" ? 0 : Number(v.replace(/,/g, "")) || 0;
const fieldStyle = { width: "100%", border: "1px solid #CBD5E1", borderRadius: 8, padding: "8px 9px", fontSize: 12.5, boxSizing: "border-box" as const, background: "#fff" };
const labelStyle = { display: "grid", gap: 4, color: "#475569", fontSize: 11.5, fontWeight: 700 } as const;

function targetDefaults(screen: CommercialUseScreen): Pick<FormState, "useType" | "revenueCadence"> {
  const target = screen.secondaryOpportunity?.use ?? screen.bestSupportedUse?.use ?? "";
  if (/senior/i.test(target)) return { useType: "senior_independent_living", revenueCadence: "monthly" };
  if (/extended-stay/i.test(target)) return { useType: "extended_stay", revenueCadence: "nightly" };
  if (/hotel|hospitality|lodging/i.test(target)) return { useType: "hotel", revenueCadence: "nightly" };
  return { useType: "other_units", revenueCadence: "monthly" };
}

export function OperatingModelWorkbench({ screen, location }: { screen: CommercialUseScreen; location?: string | null }) {
  const initial = useMemo(() => {
    const target = targetDefaults(screen);
    const soft = screen.secondaryOpportunity?.conversion.professionalSoftCost;
    const professionalSoftCost = soft ? String(Math.round((soft.low + soft.high) / 2)) : "";
    const acquisition = screen.screeningPrice ?? 0;
    return {
      ...target,
      unitCount: "",
      occupancyPct: "75",
      averageUnitRevenue: "",
      ancillaryRevenueMonthly: "0",
      replacementReservePct: "3",
      acquisitionPrice: acquisition ? String(acquisition) : "",
      conversionCapex: "",
      professionalSoftCost,
      contingencyPct: "10",
      loanAmount: acquisition ? String(Math.round(acquisition * 0.8)) : "",
      interestRatePct: screen.referenceRatePct ? screen.referenceRatePct.toFixed(2) : "",
      amortizationYears: "25",
      targetDscr: "1.25",
      expenses: {
        payrollMonthly: "",
        utilitiesMonthly: "",
        insuranceMonthly: "",
        propertyTaxMonthly: "",
        maintenanceHousekeepingMonthly: "",
        foodServicesMonthly: "",
        managementMarketingMonthly: "",
        licensingOtherMonthly: "",
      },
    } satisfies FormState;
  }, [screen]);

  const [form, setForm] = useState<FormState>(initial);
  const [goal, setGoal] = useState("");
  const [concern, setConcern] = useState("unknown");
  const [result, setResult] = useState<PropertyOperatingModelResult | null>(null);
  const [advice, setAdvice] = useState<OperatingModelAiAdvice | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = (key: keyof Omit<FormState, "expenses">, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const updateExpense = (key: ExpenseKey, value: string) => setForm((current) => ({ ...current, expenses: { ...current.expenses, [key]: value } }));

  async function calculate() {
    setBusy(true);
    setError(null);
    try {
      const payload = {
        model: {
          useType: form.useType,
          revenueCadence: form.revenueCadence,
          unitCount: num(form.unitCount),
          occupancyPct: num(form.occupancyPct),
          averageUnitRevenue: num(form.averageUnitRevenue),
          ancillaryRevenueMonthly: num(form.ancillaryRevenueMonthly),
          replacementReservePct: num(form.replacementReservePct),
          acquisitionPrice: num(form.acquisitionPrice),
          conversionCapex: num(form.conversionCapex),
          professionalSoftCost: num(form.professionalSoftCost),
          contingencyPct: num(form.contingencyPct),
          loanAmount: num(form.loanAmount),
          interestRatePct: num(form.interestRatePct),
          amortizationYears: num(form.amortizationYears),
          targetDscr: num(form.targetDscr),
          expenses: Object.fromEntries(Object.entries(form.expenses).map(([k, v]) => [k, num(v)])),
        },
        propertyContext: {
          classification: screen.propertyClassification,
          currentUse: screen.currentUse,
          targetUse: screen.secondaryOpportunity?.use ?? screen.bestSupportedUse?.use,
          location: location ?? null,
          entitlementSummary: screen.secondaryOpportunity ? `${screen.secondaryOpportunity.conversion.pathLabel}; ${screen.secondaryOpportunity.conversion.endToEndMonths.low}-${screen.secondaryOpportunity.conversion.endToEndMonths.high} month screening runway` : null,
        },
        customerGoal: goal,
        financingConcern: concern,
        requestAdvice: true,
      };
      const response = await fetch("/api/public/property-operating-model", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await response.json() as { ok?: boolean; error?: string; result?: PropertyOperatingModelResult; advice?: OperatingModelAiAdvice };
      if (!response.ok || !data.ok || !data.result) throw new Error(data.error || "The operating-model service could not complete the analysis.");
      setResult(data.result);
      setAdvice(data.advice ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "The model could not be calculated.");
    } finally {
      setBusy(false);
    }
  }

  const targetName = screen.secondaryOpportunity?.use ?? screen.bestSupportedUse?.use ?? "this use";
  const revenueLabel = form.revenueCadence === "nightly" ? "Average daily rate (ADR)" : "Monthly revenue per occupied unit";
  const expenseFields: Array<[ExpenseKey, string]> = [
    ["payrollMonthly", "Payroll / staffing per month"],
    ["utilitiesMonthly", "Utilities per month"],
    ["insuranceMonthly", "Insurance per month"],
    ["propertyTaxMonthly", "Property tax per month"],
    ["maintenanceHousekeepingMonthly", "Maintenance / housekeeping per month"],
    ["foodServicesMonthly", "Food / resident services per month"],
    ["managementMarketingMonthly", "Management / marketing per month"],
    ["licensingOtherMonthly", "Licensing / other per month"],
  ];

  return (
    <details style={{ borderTop: "1px solid #E8D7A6", paddingTop: 8 }}>
      <summary style={{ cursor: "pointer", color: "#1C4532", fontWeight: 850, fontSize: 12.5 }}>
        Model {targetName} with your own numbers + AI review
      </summary>
      <div style={{ display: "grid", gap: 12, marginTop: 10 }}>
        <p style={{ margin: 0, fontSize: 11.5, color: "#64748B", lineHeight: 1.55 }}>
          You supply the operating assumptions. Furlong calculates revenue, NOI, debt service, DSCR, break-even occupancy, capital need and sensitivity with deterministic math; AI then explains the result, challenges weak assumptions and suggests what to verify next. The AI cannot change the math or issue a credit decision.
        </p>
        <div style={{ fontSize: 11.5, color: "#334155", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 9, padding: "8px 10px", lineHeight: 1.55 }}>
          <strong>Furlong's finish line is the closing table, not a lender introduction.</strong> This model is meant to feed the same case through entitlement, environmental, conversion budget, Capital Readiness, USDA/FSA/SBA/conventional comparison, borrower-obstacle work, Capital Network matching, lender conditions and closing readiness.
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 8 }}>
          <label style={labelStyle}>Use model<select value={form.useType} onChange={(e) => update("useType", e.target.value)} style={fieldStyle}><option value="extended_stay">Extended-stay hospitality</option><option value="hotel">Hotel</option><option value="senior_independent_living">Senior independent living</option><option value="senior_assisted_living">Senior assisted living / care</option><option value="other_units">Other room/unit use</option></select></label>
          <label style={labelStyle}>Revenue cadence<select value={form.revenueCadence} onChange={(e) => update("revenueCadence", e.target.value)} style={fieldStyle}><option value="nightly">Nightly</option><option value="monthly">Monthly</option></select></label>
          <label style={labelStyle}>Rooms / units<input inputMode="numeric" value={form.unitCount} onChange={(e) => update("unitCount", e.target.value)} style={fieldStyle} placeholder="30" /></label>
          <label style={labelStyle}>Stabilized occupancy %<input inputMode="decimal" value={form.occupancyPct} onChange={(e) => update("occupancyPct", e.target.value)} style={fieldStyle} /></label>
          <label style={labelStyle}>{revenueLabel}<input inputMode="decimal" value={form.averageUnitRevenue} onChange={(e) => update("averageUnitRevenue", e.target.value)} style={fieldStyle} placeholder={form.revenueCadence === "nightly" ? "125" : "3,250"} /></label>
          <label style={labelStyle}>Other revenue / month<input inputMode="decimal" value={form.ancillaryRevenueMonthly} onChange={(e) => update("ancillaryRevenueMonthly", e.target.value)} style={fieldStyle} /></label>
          <label style={labelStyle}>Replacement reserve %<input inputMode="decimal" value={form.replacementReservePct} onChange={(e) => update("replacementReservePct", e.target.value)} style={fieldStyle} /></label>
        </div>

        <details><summary style={{ cursor: "pointer", fontWeight: 800, color: "#334155", fontSize: 12 }}>Operating expenses</summary><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 8, marginTop: 8 }}>{expenseFields.map(([key, label]) => <label key={key} style={labelStyle}>{label}<input inputMode="decimal" value={form.expenses[key]} onChange={(e) => updateExpense(key, e.target.value)} style={fieldStyle} /></label>)}</div></details>

        <details><summary style={{ cursor: "pointer", fontWeight: 800, color: "#334155", fontSize: 12 }}>Acquisition, conversion and debt assumptions</summary><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 8, marginTop: 8 }}>
          <label style={labelStyle}>Purchase / screening price<input inputMode="decimal" value={form.acquisitionPrice} onChange={(e) => update("acquisitionPrice", e.target.value)} style={fieldStyle} /></label>
          <label style={labelStyle}>Conversion construction capex<input inputMode="decimal" value={form.conversionCapex} onChange={(e) => update("conversionCapex", e.target.value)} style={fieldStyle} /></label>
          <label style={labelStyle}>Professional / entitlement soft cost<input inputMode="decimal" value={form.professionalSoftCost} onChange={(e) => update("professionalSoftCost", e.target.value)} style={fieldStyle} /></label>
          <label style={labelStyle}>Construction contingency %<input inputMode="decimal" value={form.contingencyPct} onChange={(e) => update("contingencyPct", e.target.value)} style={fieldStyle} /></label>
          <label style={labelStyle}>Proposed loan amount<input inputMode="decimal" value={form.loanAmount} onChange={(e) => update("loanAmount", e.target.value)} style={fieldStyle} /></label>
          <label style={labelStyle}>Interest rate %<input inputMode="decimal" value={form.interestRatePct} onChange={(e) => update("interestRatePct", e.target.value)} style={fieldStyle} /></label>
          <label style={labelStyle}>Amortization years<input inputMode="decimal" value={form.amortizationYears} onChange={(e) => update("amortizationYears", e.target.value)} style={fieldStyle} /></label>
          <label style={labelStyle}>DSCR target<input inputMode="decimal" value={form.targetDscr} onChange={(e) => update("targetDscr", e.target.value)} style={fieldStyle} /></label>
        </div></details>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,2fr) minmax(180px,1fr)", gap: 8 }}>
          <label style={labelStyle}>What are you trying to accomplish? (optional)<input value={goal} onChange={(e) => setGoal(e.target.value.slice(0, 1000))} style={fieldStyle} placeholder="Example: convert the hotel to independent senior living and close with the lowest practical cash injection." /></label>
          <label style={labelStyle}>Biggest financing concern<select value={concern} onChange={(e) => setConcern(e.target.value)} style={fieldStyle}><option value="unknown">Not sure yet</option><option value="none">No known concern</option><option value="credit">Credit profile</option><option value="equity">Cash injection / equity</option><option value="liquidity">Liquidity</option><option value="documentation">Documentation</option><option value="experience">Operating experience</option><option value="time">Time to close</option></select></label>
        </div>

        <button type="button" disabled={busy} onClick={() => void calculate()} style={{ justifySelf: "start", border: 0, borderRadius: 9, background: "#1C4532", color: "white", fontWeight: 850, padding: "9px 14px", cursor: busy ? "wait" : "pointer" }}>{busy ? "Calculating…" : "Calculate + review with AI"}</button>
        {error && <div style={{ color: "#991B1B", fontSize: 12 }}>{error}</div>}

        {result && <div style={{ display: "grid", gap: 9 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 7 }}>{[
            ["Annual revenue", money(result.annualRevenue)], ["NOI", money(result.noi)], ["NOI margin", result.noiMarginPct == null ? "—" : `${result.noiMarginPct.toFixed(1)}%`], ["Annual debt service", money(result.annualDebtService)], ["DSCR", result.dscr == null ? "—" : `${result.dscr.toFixed(2)}x`], ["Break-even occupancy", result.breakEvenOccupancyPct == null ? "—" : `${result.breakEvenOccupancyPct.toFixed(1)}%`], ["Project cost", money(result.totalProjectCost)], ["Equity required", result.equityRequired == null ? "—" : `${money(result.equityRequired)}${result.equityRequiredPct == null ? "" : ` (${result.equityRequiredPct.toFixed(1)}%)`}`], ["Loan supported at target", money(result.maxLoanSupportedAtTarget)]
          ].map(([label, value]) => <div key={label} style={{ border: "1px solid #E2E8F0", borderRadius: 9, padding: "8px 10px", background: "#F8FAFC" }}><div style={{ fontSize: 9.5, color: "#64748B", fontWeight: 800, textTransform: "uppercase" }}>{label}</div><div style={{ marginTop: 3, color: "#0F172A", fontSize: 13, fontWeight: 850 }}>{value}</div></div>)}</div>
          {result.annualCoverageGap != null && result.annualCoverageGap > 0 && <div style={{ fontSize: 12, color: "#92400E", background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 9, padding: "8px 10px" }}>At the entered debt terms, this property-side case needs about <strong>{money(result.annualCoverageGap)}/yr more NOI</strong> to reach the {result.targetDscr.toFixed(2)}x target. That gap can be attacked through price, debt structure, revenue, occupancy, expense control or verified outside/global support where a lender/program permits it.</div>}
          <details><summary style={{ cursor: "pointer", color: "#334155", fontSize: 12, fontWeight: 800 }}>Sensitivity — what happens if occupancy or unit revenue moves?</summary><div style={{ overflowX: "auto", marginTop: 7 }}><table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11.5 }}><thead><tr><th style={{ textAlign: "left", padding: 5 }}>Case</th><th style={{ textAlign: "right", padding: 5 }}>Revenue</th><th style={{ textAlign: "right", padding: 5 }}>NOI</th><th style={{ textAlign: "right", padding: 5 }}>DSCR</th></tr></thead><tbody>{result.sensitivity.map((s) => <tr key={s.label}><td style={{ padding: 5, borderTop: "1px solid #E2E8F0" }}>{s.label}</td><td style={{ padding: 5, borderTop: "1px solid #E2E8F0", textAlign: "right" }}>{money(s.annualRevenue)}</td><td style={{ padding: 5, borderTop: "1px solid #E2E8F0", textAlign: "right" }}>{money(s.noi)}</td><td style={{ padding: 5, borderTop: "1px solid #E2E8F0", textAlign: "right" }}>{s.dscr == null ? "—" : `${s.dscr.toFixed(2)}x`}</td></tr>)}</tbody></table></div></details>
        </div>}

        {advice && <div style={{ border: "1px solid #C7D7CD", borderRadius: 11, background: "#F7FBF8", padding: "11px 13px", display: "grid", gap: 7 }}>
          <div style={{ color: "#1C4532", fontWeight: 900, fontSize: 12.5 }}>Furlong AI feasibility review <span style={{ fontWeight: 600, color: "#64748B" }}>({advice.source === "ai" ? "AI interpretation of deterministic math" : "deterministic fallback"})</span></div>
          <p style={{ margin: 0, fontSize: 12.5, color: "#334155", lineHeight: 1.55 }}>{advice.summary}</p>
          {advice.strengths.length > 0 && <div><strong style={{ fontSize: 11.5 }}>What helps:</strong><ul style={{ margin: "4px 0 0 18px", padding: 0, fontSize: 11.5, lineHeight: 1.55 }}>{advice.strengths.map((x) => <li key={x}>{x}</li>)}</ul></div>}
          {advice.concerns.length > 0 && <div><strong style={{ fontSize: 11.5 }}>What could stop it:</strong><ul style={{ margin: "4px 0 0 18px", padding: 0, fontSize: 11.5, lineHeight: 1.55 }}>{advice.concerns.map((x) => <li key={x}>{x}</li>)}</ul></div>}
          <div><strong style={{ fontSize: 11.5 }}>Questions that most improve the answer:</strong><ul style={{ margin: "4px 0 0 18px", padding: 0, fontSize: 11.5, lineHeight: 1.55 }}>{advice.questionsToImproveModel.map((x) => <li key={x}>{x}</li>)}</ul></div>
          <div><strong style={{ fontSize: 11.5 }}>Execution path:</strong><ol style={{ margin: "4px 0 0 18px", padding: 0, fontSize: 11.5, lineHeight: 1.55 }}>{advice.nextActions.map((x) => <li key={x}>{x}</li>)}</ol></div>
          <p style={{ margin: 0, fontSize: 11.5, color: "#475569", lineHeight: 1.55 }}><strong>Financing:</strong> {advice.financingPosture}</p>
          <p style={{ margin: 0, fontSize: 11.5, color: "#475569", lineHeight: 1.55 }}><strong>Credit:</strong> {advice.creditContext}</p>
        </div>}

        {result && <details>
          <summary style={{ cursor: "pointer", fontWeight: 850, color: "#1C2B45", fontSize: 12 }}>From this model to keys — transaction execution chain</summary>
          <ol style={{ margin: "8px 0 0 20px", padding: 0, fontSize: 11.5, color: "#475569", lineHeight: 1.6 }}>
            <li><strong>Evidence lock:</strong> replace estimates with operating statements, market support and vendor/contractor evidence.</li>
            <li><strong>Entitlement + environmental:</strong> resolve use permission, hearings, change-of-occupancy, environmental and site constraints.</li>
            <li><strong>Conversion budget:</strong> bind construction, professional, permit, licensing and contingency costs.</li>
            <li><strong>Operating economics:</strong> rerun this model with verified inputs and lender-specific DSCR requirements.</li>
            <li><strong>Capital Readiness:</strong> compare USDA, FSA, SBA and conventional paths without forcing the customer into one program family.</li>
            <li><strong>Borrower obstacle work:</strong> credit, equity, liquidity, experience or documentation issues become specific cure/workup tasks, not automatic rejection.</li>
            <li><strong>Capital Network:</strong> rank verified providers for fit + execution; borrower selects exactly who receives the file.</li>
            <li><strong>Underwriting + conditions:</strong> track third-party reports, questions, conditions and exceptions to a closing-ready checklist.</li>
            <li><strong>Closing:</strong> confirm final terms/documents/funds and close the transaction — keys/possession are the success event.</li>
          </ol>
          <a href="/financing-pathways" style={{ display: "inline-flex", marginTop: 9, borderRadius: 8, padding: "7px 10px", background: "#1C2B45", color: "#fff", textDecoration: "none", fontSize: 11.5, fontWeight: 850 }}>Continue to financing pathways</a>
        </details>}
      </div>
    </details>
  );
}
