"use client";

import { useMemo, useState } from "react";
import type { ChartTheme } from "@/lib/property/chartThemes";
import { optimizeAgriculturalOpportunities } from "@/lib/property/agriculturalOpportunityOptimizer";

const money = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

export function AgriculturalOpportunityOptimizerPanel(p: { acreage: number; price: number; rate: number; theme: ChartTheme }) {
  const debt = p.price * 0.8 * (p.rate / 100) / (1 - Math.pow(1 + p.rate / 100, -40));
  const [x, setX] = useState({ waterScore: 70, laborCapacity: 55, capitalCapacity: 55, marketAccess: 60, gridEvidence: false, solarZoningEvidence: false, hayYieldTonsPerAcre: 5, hayBaleWeightLb: 55, haySummerPrice: 20, hayWinterPrice: 35, hayWinterShare: 35, hayVariableCostPerAcre: 1400, hayHandlingCostPerBale: 2, hayShrinkPct: 8 });
  const m = useMemo(() => optimizeAgriculturalOpportunities({ acres: p.acreage, purchasePrice: p.price, debtService: debt, ...x }), [p.acreage, p.price, debt, x]);

  const slider = (k: keyof typeof x, label: string) => typeof x[k] === "number" ? (
    <label style={{ fontSize: 12, display: "grid", gap: 6, padding: 10, border: `1px solid ${p.theme.cellBorder}`, borderRadius: 9, background: "#fff" }}>
      <span style={{ display: "flex", justifyContent: "space-between", gap: 10 }}><strong>{label}</strong><span>{String(x[k])}/100</span></span>
      <input type="range" min="0" max="100" value={x[k] as number} onChange={e => setX(v => ({ ...v, [k]: Number(e.target.value) }))} />
    </label>
  ) : null;

  return (
    <section data-testid="agricultural-opportunity-optimizer" style={{ display: "grid", gap: 18, padding: "clamp(14px,2vw,22px)", border: `2px solid ${p.theme.accent}`, borderRadius: 14, background: p.theme.plate }}>
      <header style={{ display: "grid", gap: 5 }}>
        <strong style={{ fontSize: "clamp(18px,2.2vw,24px)", color: p.theme.ink }}>Best-use agricultural opportunity optimizer</strong>
        <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55, color: p.theme.inkSoft }}>Compare singular enterprises and diversified portfolios. Commodity crops are one option—not the assumed answer.</p>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 10 }}>
        {slider("waterScore", "Water / irrigation")}
        {slider("laborCapacity", "Labor / management")}
        {slider("capitalCapacity", "Capital capacity")}
        {slider("marketAccess", "Market / offtake")}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 10 }}>
        <label style={{ padding: 10, border: `1px solid ${p.theme.cellBorder}`, borderRadius: 9, background: "#fff", fontSize: 12.5, lineHeight: 1.4 }}><input type="checkbox" checked={x.gridEvidence} onChange={e => setX(v => ({ ...v, gridEvidence: e.target.checked }))} /> Grid / interconnection evidence exists</label>
        <label style={{ padding: 10, border: `1px solid ${p.theme.cellBorder}`, borderRadius: 9, background: "#fff", fontSize: 12.5, lineHeight: 1.4 }}><input type="checkbox" checked={x.solarZoningEvidence} onChange={e => setX(v => ({ ...v, solarZoningEvidence: e.target.checked }))} /> Solar zoning / site feasibility is evidenced</label>
      </div>

      <details style={{ border: `1px solid ${p.theme.cellBorder}`, borderRadius: 10, background: "#fff", padding: 12 }}>
        <summary style={{ cursor: "pointer", fontWeight: 800, color: p.theme.ink }}>Premium small-square alfalfa assumptions</summary>
        <p style={{ margin: "7px 0 10px", fontSize: 12, lineHeight: 1.5, color: p.theme.inkSoft }}>Editable operator assumptions. Revenue is calculated by the bale—not by a generic bulk-hay tonnage rate.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(145px,1fr))", gap: 9 }}>
          {[
            ["hayYieldTonsPerAcre", "Yield, tons/acre", 0.1],
            ["hayBaleWeightLb", "Bale weight, lb", 1],
            ["haySummerPrice", "Summer $/bale", 1],
            ["hayWinterPrice", "Winter $/bale", 1],
            ["hayWinterShare", "Sold in winter, %", 1],
            ["hayVariableCostPerAcre", "Field cost $/acre", 25],
            ["hayHandlingCostPerBale", "Handling $/bale", 0.25],
            ["hayShrinkPct", "Shrink / loss, %", 1],
          ].map(([key, label, step]) => (
            <label key={String(key)} style={{ display: "grid", gap: 4, fontSize: 11.5, color: p.theme.inkSoft }}>
              {String(label)}
              <input type="number" min="0" step={Number(step)} value={x[key as keyof typeof x] as number} onChange={e => setX(v => ({ ...v, [key]: Number(e.target.value) }))} style={{ width: "100%", padding: "7px 8px", border: `1px solid ${p.theme.cellBorder}`, borderRadius: 7, fontSize: 13 }} />
            </label>
          ))}
        </div>
      </details>

      <div style={{ display: "grid", gap: 10 }}>
        {m.ranked.map((r, i) => {
          const status = r.eligible ? "Screenable" : "Blocked pending evidence";
          return (
            <article key={r.key} style={{ display: "grid", gap: 10, padding: 14, border: `1px solid ${p.theme.cellBorder}`, borderRadius: 12, background: "#fff" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start", minWidth: 0 }}>
                  <span style={{ flex: "0 0 auto", width: 28, height: 28, borderRadius: 999, display: "grid", placeItems: "center", fontWeight: 850, background: p.theme.accent, color: "#fff" }}>{i + 1}</span>
                  <div style={{ minWidth: 0 }}>
                    <strong style={{ display: "block", fontSize: 15, color: p.theme.ink }}>{r.label}</strong>
                    <p style={{ margin: "4px 0 0", fontSize: 12.5, lineHeight: 1.5, color: p.theme.inkSoft }}>{r.note}</p>
                  </div>
                </div>
                <span style={{ flex: "0 0 auto", borderRadius: 999, padding: "5px 9px", fontSize: 11, fontWeight: 800, background: r.eligible ? "#e8f5ee" : "#fff2df", color: r.eligible ? "#166534" : "#92400e" }}>{status}</span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(105px,1fr))", gap: 8 }}>
                {[
                  ["Fit", `${r.fit.toFixed(0)}/100`],
                  ["Acres", r.usedAcres.toFixed(1)],
                  ["Annual NOI", r.eligible ? money(r.noi) : "$0"],
                  ["DSCR", `${r.dscr?.toFixed(2) ?? "—"}x`],
                ].map(([label, value]) => (
                  <div key={label} style={{ padding: "8px 10px", borderRadius: 8, background: p.theme.plate }}>
                    <div style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.06em", color: p.theme.inkSoft }}>{label}</div>
                    <strong style={{ display: "block", marginTop: 2, fontSize: 14, color: p.theme.ink }}>{value}</strong>
                  </div>
                ))}
              </div>
            </article>
          );
        })}
      </div>

      <div style={{ padding: 14, border: `1px solid ${p.theme.cellBorder}`, borderRadius: 11, background: "#fff" }}>
        <strong style={{ fontSize: 15 }}>Highest-ranked diversified screen</strong>
        <p style={{ margin: "6px 0 10px", fontSize: 13, lineHeight: 1.5 }}>{m.diversified.map(r => `${Math.round(r.portfolioShare * 100)}% ${r.label}`).join(" + ") || "No feasible portfolio yet"}</p>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 13 }}><span><strong>Modeled NOI:</strong> {money(m.portfolioNoi)}</span><span><strong>DSCR:</strong> {m.portfolioDscr?.toFixed(2) ?? "—"}x</span></div>
      </div>

      <p style={{ margin: 0, fontSize: 11.5, lineHeight: 1.5, color: p.theme.inkSoft }}>{m.warning}</p>
    </section>
  );
}
