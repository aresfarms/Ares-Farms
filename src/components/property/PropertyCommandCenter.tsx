"use client";

import { useMemo, useState } from "react";
import type { ChartTableBriefProps } from "@/components/property/ChartTableBrief";
import { CHART_THEMES } from "@/lib/property/chartThemes";

export type PropertyCommandCenterProps = ChartTableBriefProps;
type TabId = "summary" | "financing" | "diligence" | "readiness";

type DiligenceGroup = { id: string; title: string; items: Array<{ label: string; how: string; source: string }> };

function laneLabel(propertyType: string): "Residential" | "Farm & agricultural" | "Commercial & business" {
  const value = propertyType.toLowerCase();
  if (/farm|ranch|agric/.test(value)) return "Farm & agricultural";
  if (/commercial|business|hotel|hospitality|mobile|industrial|warehouse|retail/.test(value)) return "Commercial & business";
  return "Residential";
}

function groupUnknowns(items: NonNullable<ChartTableBriefProps["intelligence"]>["unknowns"]): DiligenceGroup[] {
  const groups: Record<string, DiligenceGroup> = {
    risk: { id: "risk", title: "Site & environmental risk", items: [] },
    title: { id: "title", title: "Property, title & taxes", items: [] },
    systems: { id: "systems", title: "Infrastructure & physical systems", items: [] },
    market: { id: "market", title: "Market, operations & daily use", items: [] },
  };
  for (const item of items) {
    const text = `${item.label} ${item.pointer} ${item.howToFind}`.toLowerCase();
    const key = /flood|wetland|environment|hazard|contamin|historic/.test(text)
      ? "risk"
      : /title|tax|parcel|deed|easement|zoning|permit|covenant|lien/.test(text)
        ? "title"
        : /water|sewer|well|septic|electric|utility|broadband|condition|inspection|roof|structure/.test(text)
          ? "systems"
          : "market";
    groups[key].items.push({ label: item.label, how: item.howToFind, source: item.pointer });
  }
  return Object.values(groups).filter((group) => group.items.length > 0);
}

export function PropertyCommandCenter(props: PropertyCommandCenterProps) {
  const theme = CHART_THEMES[props.variant ?? "buyer"];
  const [tab, setTab] = useState<TabId>("summary");
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ risk: true });
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const facts = props.intelligence?.verifiedFacts ?? [];
  const unknowns = props.intelligence?.unknowns ?? [];
  const groups = useMemo(() => groupUnknowns(unknowns), [unknowns]);
  const totalChecks = unknowns.length;
  const completedChecks = Object.values(completed).filter(Boolean).length;
  const evidenceTotal = facts.length + unknowns.length;
  const evidencePct = evidenceTotal > 0 ? Math.round((facts.length / evidenceTotal) * 100) : 0;
  const lane = laneLabel(props.propertyType);
  const hasPrice = !/not captured|unknown|enter|not provided|—/i.test(props.priceLabel);
  const recommendationEligible = hasPrice && facts.length >= 4 && unknowns.length <= 5;
  const posture = recommendationEligible ? "READY FOR REVIEW" : facts.length ? "MORE INFORMATION NEEDED" : "PROPERTY IDENTIFIED";

  const shell = { background: "#FAF8F3", border: "1px solid #E5E0D5", borderRadius: 18, overflow: "hidden" } as const;
  const card = { background: "#fff", border: "1px solid #E5E0D5", borderRadius: 14, padding: "16px 18px" } as const;
  const tabs: Array<{ id: TabId; label: string; badge?: string }> = [
    { id: "summary", label: "Summary" },
    { id: "financing", label: "Financial model" },
    { id: "diligence", label: "Due diligence", badge: `${completedChecks}/${totalChecks}` },
    { id: "readiness", label: "Decision readiness", badge: String(unknowns.length + (hasPrice ? 0 : 1)) },
  ];

  return (
    <section aria-label="Property command center" data-testid="property-command-center" data-consumer-lane={lane} style={shell}>
      <nav aria-label="Property workspace sections" style={{ position: "sticky", top: 0, zIndex: 4, background: "rgba(250,248,243,.96)", borderBottom: "1px solid #E5E0D5", padding: "10px 12px", display: "flex", gap: 6, overflowX: "auto" }}>
        {tabs.map((item) => (
          <button key={item.id} type="button" onClick={() => setTab(item.id)} aria-current={tab === item.id ? "page" : undefined} style={{ border: 0, borderRadius: 9, padding: "9px 13px", whiteSpace: "nowrap", fontWeight: 750, cursor: "pointer", background: tab === item.id ? "#fff" : "transparent", color: tab === item.id ? "#1C2B45" : "#5A6172", boxShadow: tab === item.id ? "0 1px 4px rgba(28,43,69,.12)" : "none" }}>
            {item.label}{item.badge ? <span style={{ marginLeft: 7, background: "#B08A2E", color: "#fff", borderRadius: 999, padding: "1px 7px", fontSize: 10.5 }}>{item.badge}</span> : null}
          </button>
        ))}
      </nav>

      <div style={{ padding: 20, display: "grid", gap: 16 }}>
        {tab === "summary" && <>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.15fr) minmax(260px,.85fr)", gap: 14 }}>
            <article style={{ ...card, background: "linear-gradient(155deg,#20304E,#16233C)", color: "#fff", border: 0, display: "grid", gap: 10 }}>
              <span style={{ color: "#CBA24A", fontSize: 10.5, fontWeight: 800, letterSpacing: ".16em", textTransform: "uppercase" }}>The answer, first</span>
              <h2 style={{ margin: 0, color: "#fff", fontFamily: "Georgia,serif", fontSize: 24 }}>{props.title}</h2>
              <span style={{ color: "#AEB6C6", fontSize: 13 }}>{props.location} · {lane}</span>
              <span style={{ justifySelf: "start", borderRadius: 999, padding: "5px 11px", background: recommendationEligible ? "#EAF4EE" : "#FBF1E0", color: recommendationEligible ? "#2E7D4F" : "#A2661F", fontSize: 12, fontWeight: 800 }}>{posture}</span>
              <p style={{ margin: 0, lineHeight: 1.6, color: "#E6E9EF" }}>{props.headline}</p>
              <span style={{ fontSize: 11, color: "#9EA8BA" }}>Property intelligence only. A recommendation appears only after the minimum evidence threshold is satisfied.</span>
            </article>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                ["Evidence completeness", `${evidencePct}%`, `${facts.length} verified · ${unknowns.length} open`],
                ["Property lane", lane, "Auto-detected from property evidence"],
                ["Capital needed", hasPrice ? props.priceLabel : "Enter price", hasPrice ? "Current price basis" : "Required for financial modeling"],
                ["Potential pathways", String(props.financingLanes.length), props.financingLanes.slice(0, 2).join(" · ") || "None confirmed yet"],
              ].map(([label, value, note]) => <div key={label} style={{ ...card, padding: 14 }}><span style={{ fontSize: 10, color: "#8A8F9C", fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase" }}>{label}</span><strong style={{ display: "block", color: "#1C2B45", fontSize: 17, marginTop: 4 }}>{value}</strong><span style={{ color: "#8A8F9C", fontSize: 11.5 }}>{note}</span></div>)}
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 10 }}>
            {facts.slice(0, 8).map((fact) => <article key={`${fact.label}-${fact.value}`} style={card}><span style={{ fontSize: 10, color: "#8A8F9C", fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase" }}>{fact.label}</span><strong style={{ display: "block", color: "#1C2B45", marginTop: 4, lineHeight: 1.4 }}>{fact.value}</strong><details><summary style={{ marginTop: 7, cursor: "pointer", color: "#8F6E1F", fontSize: 11.5 }}>Source and explanation</summary><p style={{ fontSize: 12, color: "#5A6172", lineHeight: 1.55 }}>{fact.text}</p><p style={{ fontSize: 10.5, color: "#8A8F9C" }}>{fact.provenance}</p></details></article>)}
          </div>
          {facts.length > 8 && <details style={card}><summary style={{ cursor: "pointer", fontWeight: 800, color: "#1C2B45" }}>View {facts.length - 8} additional verified facts</summary><div style={{ display: "grid", gap: 8, marginTop: 10 }}>{facts.slice(8).map((fact) => <div key={`${fact.label}-${fact.value}`}><strong>{fact.label}:</strong> {fact.value}</div>)}</div></details>}
        </>}

        {tab === "financing" && <>
          <header style={card}><h3 style={{ margin: 0, color: "#1C2B45", fontFamily: "Georgia,serif" }}>Financial model</h3><p style={{ margin: "5px 0 0", color: "#5A6172", fontSize: 13 }}>Price, ownership costs, capital structure, and pathway matches stay together here. Raw form mappings remain collapsed until the relevant lane and authorization exist.</p></header>
          {props.costsSlot ?? <div style={card}>Enter or confirm the property price to begin the financial model.</div>}
          <section style={card}><h3 style={{ margin: 0, color: "#1C2B45", fontSize: 16 }}>Potential financing pathways</h3><div style={{ display: "grid", gap: 9, marginTop: 10 }}>{props.financingLanes.length ? props.financingLanes.map((item, index) => <div key={item} style={{ border: `1px solid ${index === 0 ? "#B08A2E" : "#E5E0D5"}`, borderRadius: 10, padding: "11px 13px", background: index === 0 ? "#FBF5E6" : "#fff" }}><strong style={{ color: "#1C2B45" }}>{item}</strong><span style={{ display: "block", fontSize: 11.5, color: "#5A6172" }}>{index === 0 ? "Best preliminary alignment from the available property evidence." : "Possible pathway requiring additional use, borrower, and structure evidence."}</span></div>) : <span style={{ color: "#5A6172" }}>No financing pathway can be responsibly matched yet.</span>}</div></section>
          <details style={card}><summary style={{ cursor: "pointer", color: "#1C2B45", fontWeight: 800 }}>View supporting form mapping</summary><p style={{ color: "#5A6172", fontSize: 12.5 }}>SBA, FSA, and project-finance field mappings appear only after a relevant lane, price basis, and authorization state exist. Furlong presents them as information it can pre-fill—not as consumer homework.</p></details>
        </>}

        {tab === "diligence" && <>
          <header style={card}><div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline", flexWrap: "wrap" }}><h3 style={{ margin: 0, color: "#1C2B45", fontFamily: "Georgia,serif" }}>{completedChecks} of {totalChecks} checks cleared</h3><span style={{ color: "#8F6E1F", fontWeight: 700, fontSize: 12 }}>Generated for the {lane.toLowerCase()} lane</span></div><div style={{ height: 8, background: "#EFE5CC", borderRadius: 999, marginTop: 12, overflow: "hidden" }}><span style={{ display: "block", width: `${totalChecks ? completedChecks / totalChecks * 100 : 100}%`, height: "100%", background: "#B08A2E" }} /></div></header>
          {groups.length ? groups.map((group) => <section key={group.id} style={{ ...card, padding: 0, overflow: "hidden" }}><button type="button" onClick={() => setOpenGroups((value) => ({ ...value, [group.id]: !value[group.id] }))} style={{ width: "100%", border: 0, background: "transparent", padding: "15px 17px", display: "flex", justifyContent: "space-between", cursor: "pointer", color: "#1C2B45", fontWeight: 800 }}><span>{group.title}</span><span>{group.items.filter((item) => completed[`${group.id}:${item.label}`]).length}/{group.items.length} {openGroups[group.id] ? "▴" : "▾"}</span></button>{openGroups[group.id] && <div style={{ padding: "0 16px 16px", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 8 }}>{group.items.map((item) => { const key = `${group.id}:${item.label}`; return <label key={key} style={{ border: "1px solid #EFEBE1", borderRadius: 10, padding: 11, display: "flex", gap: 9, background: completed[key] ? "#EAF4EE" : "#fff" }}><input type="checkbox" checked={Boolean(completed[key])} onChange={(event) => setCompleted((value) => ({ ...value, [key]: event.target.checked }))} /><span><strong style={{ display: "block", color: "#1C2B45", fontSize: 13 }}>{item.label}</strong><span style={{ display: "block", color: "#5A6172", fontSize: 11.5, lineHeight: 1.45 }}>{item.how}</span><span style={{ display: "block", color: "#8A8F9C", fontSize: 10.5, marginTop: 3 }}>{item.source}</span></span></label>; })}</div>}</section>) : <div style={card}>No unresolved property checks are currently listed.</div>}
        </>}

        {tab === "readiness" && <>
          <header style={card}><h3 style={{ margin: 0, color: "#1C2B45", fontFamily: "Georgia,serif" }}>Decision readiness</h3><p style={{ margin: "5px 0 0", color: "#5A6172", fontSize: 13 }}>This is the customer file’s readiness—not Furlong’s internal release governance.</p></header>
          {[{ title: "Property identity and intended use", done: Boolean(props.propertyType), note: `${lane} lane selected from the available evidence.` }, { title: "Purchase assumptions", done: hasPrice, note: hasPrice ? props.priceLabel : "Enter or confirm the purchase price." }, { title: "Material property evidence", done: facts.length >= 4, note: `${facts.length} property-specific facts verified.` }, { title: "Major diligence questions", done: unknowns.length <= 5, note: `${unknowns.length} unresolved items remain.` }].map((item) => <article key={item.title} style={{ ...card, display: "flex", gap: 12, alignItems: "flex-start" }}><span style={{ width: 28, height: 28, borderRadius: "50%", display: "grid", placeItems: "center", flex: "none", background: item.done ? "#EAF4EE" : "#FBF1E0", color: item.done ? "#2E7D4F" : "#A2661F", fontWeight: 900 }}>{item.done ? "✓" : "!"}</span><div><strong style={{ color: "#1C2B45" }}>{item.title}</strong><p style={{ margin: "3px 0 0", color: "#5A6172", fontSize: 12.5 }}>{item.note}</p></div></article>)}
          <section style={{ ...card, background: recommendationEligible ? "#EAF4EE" : "#FBF5E6" }}><strong style={{ color: "#1C2B45" }}>{recommendationEligible ? "Minimum evidence threshold satisfied" : "Recommendation not unlocked yet"}</strong><p style={{ margin: "4px 0 0", color: "#5A6172", fontSize: 12.5 }}>{recommendationEligible ? "The file can move into a named human review for a supported recommendation." : "Furlong will not manufacture a score, renegotiation posture, or ranked course while material property or price evidence is missing."}</p></section>
          {props.actionsSlot}
        </>}
      </div>
    </section>
  );
}
