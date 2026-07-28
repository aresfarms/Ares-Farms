"use client";

import { useState } from "react";
import { AgriculturalOpportunityOptimizerPanel } from "@/components/property/AgriculturalOpportunityOptimizerPanel";
import { CHART_THEMES } from "@/lib/property/chartThemes";

const inputStyle = {
  width: "100%",
  border: "1px solid #cbd5e1",
  borderRadius: 9,
  padding: "9px 10px",
  fontSize: 14,
  color: "#101a2b",
  background: "#fff",
} as const;

export function FarmBestUseFinanceWorkspace() {
  const [acreage, setAcreage] = useState(340);
  const [price, setPrice] = useState(4250000);
  const [rate, setRate] = useState(6);

  return (
    <section aria-label="Farm acquisition and best-use workspace" style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "grid", gap: 5 }}>
        <span style={{ fontSize: 11.5, fontWeight: 850, letterSpacing: "0.08em", textTransform: "uppercase", color: "#2f7d5b" }}>Property-specific farm model</span>
        <h2 style={{ margin: 0, color: "#101a2b", fontSize: "clamp(22px,3vw,30px)" }}>What operation can realistically carry this property?</h2>
        <p style={{ margin: 0, maxWidth: 860, color: "#4d596d", fontSize: 13.5, lineHeight: 1.6 }}>Enter the acquisition basics, then compare singular enterprises, diversified portfolios, irrigation economics, soil and weather fit, labor, local markets, competition, and debt coverage in the same workspace.</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 10, padding: 14, border: "1px solid #d7deea", borderRadius: 12, background: "#f8fafc" }}>
        <label style={{ display: "grid", gap: 5, fontSize: 12, fontWeight: 750, color: "#334155" }}>Total acres modeled<input aria-label="Total acres modeled" type="number" min="1" step="0.1" value={acreage} onChange={(e) => setAcreage(Number(e.target.value) || 0)} style={inputStyle} /></label>
        <label style={{ display: "grid", gap: 5, fontSize: 12, fontWeight: 750, color: "#334155" }}>Purchase price<input aria-label="Purchase price" type="number" min="0" step="10000" value={price} onChange={(e) => setPrice(Number(e.target.value) || 0)} style={inputStyle} /></label>
        <label style={{ display: "grid", gap: 5, fontSize: 12, fontWeight: 750, color: "#334155" }}>Interest rate (%)<input aria-label="Interest rate" type="number" min="0" max="30" step="0.125" value={rate} onChange={(e) => setRate(Number(e.target.value) || 0)} style={inputStyle} /></label>
      </div>
      <AgriculturalOpportunityOptimizerPanel acreage={acreage} price={price} rate={rate} theme={CHART_THEMES.finance} />
    </section>
  );
}
