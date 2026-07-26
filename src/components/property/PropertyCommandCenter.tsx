"use client";

import { useMemo, useState } from "react";
import type { ChartTableBriefProps } from "@/components/property/ChartTableBrief";
import { CHART_THEMES } from "@/lib/property/chartThemes";
import type { OfficialPropertyEvidenceRecord } from "@/lib/property/propertyEvidenceIngestion";

export type PropertyCommandCenterProps = ChartTableBriefProps & { deedEvidence?: OfficialPropertyEvidenceRecord[] };
type TabId = "summary" | "report" | "financing" | "diligence" | "readiness";

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


function suppressResolvedUnknowns(
  facts: NonNullable<ChartTableBriefProps["intelligence"]>["verifiedFacts"],
  unknowns: NonNullable<ChartTableBriefProps["intelligence"]>["unknowns"]
) {
  const factText = facts.map((fact) => `${fact.label} ${fact.value} ${fact.text}`.toLowerCase()).join(" ");
  return unknowns.filter((item) => {
    const label = item.label.toLowerCase();
    if (/flood zone/.test(label) && /flood zone/.test(factText)) return false;
    if (/size|lot|what conveys|parcel/.test(label) && /size|acre|parcel count|recorded deed/.test(factText)) return false;
    if (/higher education|college/.test(label) && /higher education/.test(factText)) return false;
    if (/broadband/.test(label) && /broadband/.test(factText)) return false;
    if (/county/.test(label) && /county/.test(factText)) return false;
    if (/historic/.test(label) && /historic status/.test(factText)) return false;
    return true;
  });
}

export function PropertyCommandCenter(props: PropertyCommandCenterProps) {
  const theme = CHART_THEMES[props.variant ?? "buyer"];
  const [tab, setTab] = useState<TabId>("summary");
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ risk: true });
  const [showAllFacts, setShowAllFacts] = useState(false);
  const [ownerFeatureInput, setOwnerFeatureInput] = useState("");
  const [localOwnerAssertions, setLocalOwnerAssertions] = useState<Array<{ label: string; value: string; text: string; provenance: string; tone: "neutral" }>>([]);
  const facts = props.intelligence?.verifiedFacts ?? [];
  const marketValueFact = facts.find((fact) => fact.label === "Waterfront market value context");
  const deedEvidence = (props.deedEvidence ?? []).filter((record) => record.domain === "title");
  const ownerAssertions = [...(props.intelligence?.ownerAssertions ?? []), ...localOwnerAssertions];
  const rawUnknowns = props.intelligence?.unknowns ?? [];
  const unknowns = useMemo(() => suppressResolvedUnknowns(facts, rawUnknowns), [facts, rawUnknowns]);
  const groups = useMemo(() => groupUnknowns(unknowns), [unknowns]);
  const totalChecks = unknowns.length;
  const evidenceTotal = facts.length + unknowns.length;
  const evidencePct = evidenceTotal > 0 ? Math.round((facts.length / evidenceTotal) * 100) : 0;
  const lane = laneLabel(props.propertyType);
  const hasPrice = !/not captured|unknown|enter|not provided|—/i.test(props.priceLabel);
  const propertyProfileEstablished = Boolean(props.propertyType) && facts.length >= 8;
  const recommendationEligible = hasPrice && facts.length >= 4 && unknowns.length <= 5;
  const posture = recommendationEligible
    ? "READY FOR REVIEW"
    : propertyProfileEstablished
      ? "PROPERTY PROFILE ESTABLISHED"
      : facts.length
        ? "PROPERTY PROFILE IN PROGRESS"
        : "PROPERTY IDENTIFIED";
  const remainingDecisionInputs = [
    ...(!hasPrice ? ["Purchase or offer price"] : []),
    ...unknowns.slice(0, 4).map((item) => item.label),
  ];

  const shell = { background: "#FAF8F3", border: "1px solid #E5E0D5", borderRadius: 18, overflow: "hidden" } as const;
  const card = { background: "#fff", border: "1px solid #E5E0D5", borderRadius: 14, padding: "16px 18px" } as const;
  const tabs: Array<{ id: TabId; label: string; badge?: string }> = [
    { id: "summary", label: "Summary" },
    { id: "report", label: "Property report" },
    { id: "financing", label: "Financial model" },
    { id: "diligence", label: "Due diligence", badge: `${totalChecks} open` },
    { id: "readiness", label: "Decision readiness", badge: `${unknowns.length + (hasPrice ? 0 : 1)} actions` },
  ];

  return (
    <section aria-label="Property command center" data-testid="property-command-center" data-consumer-lane={lane} style={shell}>
      <nav aria-label="Property workspace sections" style={{ position: "sticky", top: 0, zIndex: 4, background: "rgba(250,248,243,.96)", borderBottom: "1px solid #E5E0D5", padding: "10px 12px", display: "flex", gap: 8, overflowX: "auto", alignItems: "center" }}>
        <img src="/brand/furlong-emblem.png" alt="Furlong emblem" width={38} height={38} style={{ width: 38, height: 38, objectFit: "contain", flex: "none", marginRight: 4 }} />
        {tabs.map((item) => (
          <button key={item.id} type="button" onClick={() => setTab(item.id)} aria-current={tab === item.id ? "page" : undefined} style={{ border: 0, borderRadius: 9, padding: "9px 13px", whiteSpace: "nowrap", fontWeight: 750, cursor: "pointer", background: tab === item.id ? "#fff" : "transparent", color: tab === item.id ? "#1C2B45" : "#5A6172", boxShadow: tab === item.id ? "0 1px 4px rgba(28,43,69,.12)" : "none" }}>
            {item.label}{item.badge ? <span style={{ marginLeft: 7, background: "#B08A2E", color: "#fff", borderRadius: 999, padding: "1px 7px", fontSize: 10.5 }}>{item.badge}</span> : null}
          </button>
        ))}
      </nav>

      <div style={{ padding: 20, display: "grid", gap: 16 }}>
        {tab === "summary" && <>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.15fr) minmax(260px,.85fr)", gap: 14 }}>
            <article style={{ ...card, background: "linear-gradient(155deg,#20304E,#16233C)", color: "#fff", border: 0, display: "grid", gap: 10, position: "relative", overflow: "hidden" }}>
              <img src="/brand/furlong-emblem.png" alt="" aria-hidden="true" width={92} height={92} style={{ position: "absolute", right: 14, top: 12, width: 92, height: 92, objectFit: "contain", opacity: .2 }} />
              <span style={{ color: "#CBA24A", fontSize: 10.5, fontWeight: 800, letterSpacing: ".16em", textTransform: "uppercase", position: "relative" }}>The answer, first</span>
              <h2 style={{ margin: 0, color: "#fff", fontFamily: "Georgia,serif", fontSize: 24 }}>{props.title}</h2>
              <span style={{ color: "#AEB6C6", fontSize: 13 }}>{props.location} · {lane}</span>
              <span style={{ justifySelf: "start", borderRadius: 999, padding: "5px 11px", background: recommendationEligible ? "#EAF4EE" : "#FBF1E0", color: recommendationEligible ? "#2E7D4F" : "#A2661F", fontSize: 12, fontWeight: 800 }}>{posture}</span>
              <p style={{ margin: 0, lineHeight: 1.6, color: "#E6E9EF" }}>{props.headline}</p>
              <span style={{ fontSize: 11, color: "#9EA8BA" }}>{propertyProfileEstablished && !recommendationEligible ? "The property profile is established. Deal-specific inputs still control whether Furlong can issue a recommendation." : "Property intelligence only. A recommendation appears only after the minimum evidence threshold is satisfied."}</span>
            </article>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                ["Property evidence", propertyProfileEstablished ? "Established" : `${evidencePct}%`, `${facts.length} verified facts · ${unknowns.length} diligence items`],
                ["Property lane", lane, "Auto-detected from property evidence"],
                ["Market / price basis", hasPrice ? props.priceLabel : marketValueFact?.value ?? "Enter offer price", hasPrice ? "User-entered deal basis" : marketValueFact ? "Preliminary market context — not asking price" : "Required for financial modeling"],
                ["Potential pathways", String(props.financingLanes.length), props.financingLanes.slice(0, 2).join(" · ") || "None confirmed yet"],
              ].map(([label, value, note]) => <div key={label} style={{ ...card, padding: 14 }}><span style={{ fontSize: 10, color: "#8A8F9C", fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase" }}>{label}</span><strong style={{ display: "block", color: "#1C2B45", fontSize: 17, marginTop: 4 }}>{value}</strong><span style={{ color: "#8A8F9C", fontSize: 11.5 }}>{note}</span></div>)}
            </div>
          </div>
          {propertyProfileEstablished && !recommendationEligible && <section style={{ ...card, borderColor: "#B9C6D8", background: "#F5F8FC", display: "grid", gap: 8 }}><strong style={{ color: "#1C2B45" }}>What is still needed for a deal recommendation?</strong><p style={{ margin: 0, color: "#5A6172", fontSize: 12.5 }}>Furlong already has enough information to establish the property profile. These remaining items affect price, financing, insurability, or the final acquisition recommendation:</p><div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>{remainingDecisionInputs.map((item) => <span key={item} style={{ border: "1px solid #CBD5E1", borderRadius: 999, background: "#fff", padding: "5px 9px", color: "#334155", fontSize: 11.5, fontWeight: 700 }}>{item}</span>)}</div></section>}
          <section style={{ ...card, borderColor: "#D7B85A", background: "#FFF9E8", display: "grid", gap: 9 }}><strong style={{ color: "#1C2B45" }}>Something Furlong missed?</strong><span style={{ color: "#5A6172", fontSize: 12 }}>Add a property feature such as “deeded pier,” “two parcels,” or “waterfront.” It will be marked owner-reported until a source or document verifies it.</span><form onSubmit={(event) => { event.preventDefault(); const value = ownerFeatureInput.trim(); if (!value) return; setLocalOwnerAssertions((current) => [...current, { label: value, value: "Owner reported — pending verification", text: "This customer-supplied property feature is kept separate from source-verified facts. Furlong will add the appropriate parcel, deed, permit, or inspection check before relying on it.", provenance: "Owner assertion added in the command center", tone: "neutral" }]); setOwnerFeatureInput(""); }} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><input value={ownerFeatureInput} onChange={(event) => setOwnerFeatureInput(event.target.value)} placeholder="e.g. deeded pier, two parcels" aria-label="Property feature Furlong missed" style={{ flex: "1 1 260px", minWidth: 0, border: "1px solid #B08A2E", borderRadius: 9, padding: "10px 12px", background: "#fff", color: "#1C2B45" }} /><button type="submit" style={{ border: 0, borderRadius: 9, padding: "10px 14px", background: "#1C2B45", color: "#fff", fontWeight: 800, cursor: "pointer" }}>Add feature</button></form></section>
          {ownerAssertions.length > 0 && <section style={{ ...card, borderColor: "#D7B85A", background: "#FFF9E8" }}><strong style={{ color: "#1C2B45" }}>Owner-reported property features</strong><p style={{ margin: "4px 0 10px", color: "#5A6172", fontSize: 12 }}>Useful information kept separate from source-verified facts until supporting records arrive.</p><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 8 }}>{ownerAssertions.map((fact) => <article key={`${fact.label}-${fact.value}`} style={{ border: "1px solid #E8D28A", borderRadius: 10, padding: 11, background: "#fff" }}><strong style={{ display: "block", color: "#1C2B45", fontSize: 13 }}>{fact.label}</strong><span style={{ display: "block", color: "#8F6E1F", fontSize: 12, fontWeight: 750, marginTop: 3 }}>{fact.value}</span><span style={{ display: "block", color: "#6B7280", fontSize: 11, marginTop: 4 }}>{fact.text}</span></article>)}</div></section>}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 10 }}>
            {(showAllFacts ? facts : facts.slice(0, 8)).map((fact) => <article key={`${fact.label}-${fact.value}`} style={card}><span style={{ fontSize: 10, color: "#8A8F9C", fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase" }}>{fact.label}</span><strong style={{ display: "block", color: "#1C2B45", marginTop: 4, lineHeight: 1.4 }}>{fact.value}</strong><details><summary style={{ marginTop: 7, cursor: "pointer", color: "#8F6E1F", fontSize: 11.5 }}>Source and explanation</summary><p style={{ fontSize: 12, color: "#5A6172", lineHeight: 1.55 }}>{fact.text}</p><p style={{ fontSize: 10.5, color: "#8A8F9C" }}>{fact.provenance}</p></details></article>)}
          </div>
          {facts.length > 8 && <button type="button" onClick={() => setShowAllFacts((value) => !value)} style={{ justifySelf: "start", border: "1px solid #B08A2E", borderRadius: 10, background: showAllFacts ? "#fff" : "#B08A2E", color: showAllFacts ? "#8F6E1F" : "#fff", padding: "10px 15px", fontWeight: 800, cursor: "pointer" }}>{showAllFacts ? "Show fewer verified facts" : `View ${facts.length - 8} additional verified facts`}</button>}
        </>}


        {tab === "report" && <>
          <header style={{ ...card, background: "linear-gradient(145deg,#20304E,#16233C)", border: 0, color: "#fff" }}>
            <span style={{ color: "#CBA24A", fontSize: 10.5, fontWeight: 800, letterSpacing: ".14em", textTransform: "uppercase" }}>Customer property pro forma</span>
            <h2 style={{ margin: "6px 0 3px", color: "#fff", fontFamily: "Georgia,serif" }}>{props.title}</h2>
            <p style={{ margin: 0, color: "#D7DCE6", fontSize: 13 }}>{props.location} · {lane}</p>
          </header>
          <section style={{ ...card, borderColor: "#D7B85A", background: "#FFF9E8" }}>
            <strong style={{ color: "#1C2B45", fontSize: 17 }}>Preliminary conclusion</strong>
            <p style={{ margin: "6px 0 0", color: "#4B5563", lineHeight: 1.6 }}>{props.headline}</p>
            <p style={{ margin: "8px 0 0", color: "#6B7280", fontSize: 12.5 }}>This report is generated from the evidence available now. Open diligence items reduce confidence or change deal terms; they do not erase the customer answer.</p>
          </section>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 10 }}>
            <article style={card}><span style={{ fontSize: 10, color: "#8A8F9C", fontWeight: 800, textTransform: "uppercase" }}>Value / offer basis</span><strong style={{ display: "block", color: "#1C2B45", marginTop: 5, fontSize: 18 }}>{hasPrice ? props.priceLabel : marketValueFact?.value ?? "Comparable-sales support still needed"}</strong><p style={{ margin: "6px 0 0", color: "#6B7280", fontSize: 12 }}>{hasPrice ? "Current deal assumption." : "Preliminary market context, not an appraisal or seller asking price."}</p></article>
            <article style={card}><span style={{ fontSize: 10, color: "#8A8F9C", fontWeight: 800, textTransform: "uppercase" }}>Evidence posture</span><strong style={{ display: "block", color: "#1C2B45", marginTop: 5, fontSize: 18 }}>{facts.length} verified · {unknowns.length} open</strong><p style={{ margin: "6px 0 0", color: "#6B7280", fontSize: 12 }}>Open items are carried into the recommendation as conditions, not used to suppress the report.</p></article>
            <article style={card}><span style={{ fontSize: 10, color: "#8A8F9C", fontWeight: 800, textTransform: "uppercase" }}>Preliminary financing fit</span><strong style={{ display: "block", color: "#1C2B45", marginTop: 5, fontSize: 18 }}>{props.financingLanes[0] ?? "Conventional / cash analysis"}</strong><p style={{ margin: "6px 0 0", color: "#6B7280", fontSize: 12 }}>Property-level fit only. Personalized qualification happens in the Financial module.</p></article>
          </div>
          <section style={card}><h3 style={{ margin: 0, color: "#1C2B45" }}>What supports the conclusion</h3><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 8, marginTop: 10 }}>{facts.slice(0, 8).map((fact) => <article key={`report:${fact.label}:${fact.value}`} style={{ border: "1px solid #D8E2EF", borderRadius: 10, padding: 11, background: "#F8FAFD" }}><strong style={{ display: "block", color: "#1C2B45", fontSize: 13 }}>{fact.label}</strong><span style={{ display: "block", color: "#334155", fontSize: 12, marginTop: 3 }}>{fact.value}</span></article>)}</div></section>
          <section style={card}><h3 style={{ margin: 0, color: "#1C2B45" }}>Conditions before commitment</h3><div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 10 }}>{unknowns.slice(0, 8).map((item) => <span key={`condition:${item.label}`} style={{ border: "1px solid #E8D9B5", borderRadius: 999, background: "#FFFCF5", padding: "6px 10px", color: "#7A5A16", fontSize: 11.5, fontWeight: 700 }}>{item.label}</span>)}</div></section>
          <footer style={{ ...card, display: "grid", gap: 9 }}><strong style={{ color: "#1C2B45" }}>Generate, save, or export this property report</strong><p style={{ margin: 0, color: "#6B7280", fontSize: 12 }}>Property report actions live here—not in financing intake, environmental review, or internal governance surfaces.</p>{props.actionsSlot}</footer>
        </>}

        {tab === "financing" && <>
          <header style={card}><h3 style={{ margin: 0, color: "#1C2B45", fontFamily: "Georgia,serif" }}>Financial model</h3><p style={{ margin: "5px 0 0", color: "#5A6172", fontSize: 13 }}>Price, ownership costs, capital structure, and pathway matches stay together here. Raw form mappings remain collapsed until the relevant lane and authorization exist.</p></header>
          {props.costsSlot ?? <div style={card}>Enter or confirm the property price to begin the financial model.</div>}
          <section style={card}><h3 style={{ margin: 0, color: "#1C2B45", fontSize: 16 }}>Ranked financing pathways</h3><p style={{ margin: "5px 0 0", color: "#5A6172", fontSize: 12 }}>Ranked from the property evidence first; borrower eligibility, appraisal, condition, occupancy, and price still control the final fit.</p><div style={{ display: "grid", gap: 9, marginTop: 10 }}>{props.financingLanes.length ? props.financingLanes.map((item, index) => <div key={item} style={{ border: `1px solid ${index === 0 ? "#B08A2E" : "#E5E0D5"}`, borderRadius: 10, padding: "11px 13px", background: index === 0 ? "#FBF5E6" : "#fff" }}><strong style={{ color: "#1C2B45" }}>{index + 1}. {item}</strong><span style={{ display: "block", fontSize: 11.5, color: "#5A6172" }}>{index === 0 ? "Best preliminary property fit from the evidence currently available. This is not borrower qualification." : "Alternative path to examine after price, appraisal, condition, occupancy, and eligibility are confirmed."}</span></div>) : <span style={{ color: "#5A6172" }}>No verified borrower-specific match exists yet. Property-relevant financing families will still appear here when the asset type supports them.</span>}</div></section>
          <section style={{ ...card, borderColor: "#C8D8EA", background: "#F7FAFD", display: "grid", gap: 9 }}><h3 style={{ margin: 0, color: "#1C2B45", fontSize: 16 }}>Personalized financing and VA eligibility</h3><p style={{ margin: 0, color: "#5A6172", fontSize: 12.5 }}>This property page contains no borrower PII, income, credit, assets, liabilities, or COE upload. Continue only when you intentionally want the personalized Financial module and Stuart’s licensed financing workflow.</p><a href="/explore#personalized-financing" style={{ justifySelf: "start", borderRadius: 9, padding: "10px 14px", background: "#1C2B45", color: "#fff", fontWeight: 800, textDecoration: "none" }}>Continue to personalized Financial module</a><span style={{ color: "#6B7280", fontSize: 11.5 }}>VA eligibility questions, COE upload, personal and financial documents, consent, anonymization, and licensed review begin there—not on the property report.</span></section>
          <section style={card}><h3 style={{ margin: 0, color: "#1C2B45", fontSize: 16 }}>Deed and title verification</h3>{deedEvidence.length ? <div style={{ display: "grid", gap: 9, marginTop: 10 }}>{deedEvidence.map((record) => <article key={record.recordId} style={{ border: "1px solid #D8E2EF", borderRadius: 10, padding: 12, background: "#F8FAFD" }}><strong style={{ display: "block", color: "#1C2B45" }}>Recorded deed located</strong><span style={{ display: "block", color: "#5A6172", fontSize: 12, marginTop: 3 }}>{record.reference} · recorded {record.effectiveDate ?? "date unavailable"}</span><span style={{ display: "block", color: "#6B7280", fontSize: 11, marginTop: 5 }}>{(record.notes ?? []).filter((note) => !note.startsWith("Restricted deed document reference:")).join(" ")}</span></article>)}</div> : <p style={{ margin: "7px 0 0", color: "#5A6172", fontSize: 12.5 }}>The county-recorder verification source has not returned an approved deed record for this parcel yet. Furlong can use address and parcel identifiers without publishing the owner’s identity.</p>}<div style={{ marginTop: 10, border: "1px solid #E8D28A", borderRadius: 10, padding: 11, background: "#FFF9E8", color: "#5A6172", fontSize: 12 }}>The deed image remains restricted. It becomes viewable or printable only inside an authorized financial file or lender workspace, and every access must be ledgered.</div></section>
          <details style={card}><summary style={{ cursor: "pointer", color: "#1C2B45", fontWeight: 800 }}>View supporting form mapping</summary><p style={{ color: "#5A6172", fontSize: 12.5 }}>SBA, FSA, and project-finance field mappings appear only after a relevant lane, price basis, and authorization state exist. Furlong presents them as information it can pre-fill—not as consumer homework.</p></details>
        </>}

        {tab === "diligence" && <>
          <header style={card}><div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline", flexWrap: "wrap" }}><h3 style={{ margin: 0, color: "#1C2B45", fontFamily: "Georgia,serif" }}>{facts.length} verified · {totalChecks} open</h3><span style={{ color: "#8F6E1F", fontWeight: 700, fontSize: 12 }}>Generated for the {lane.toLowerCase()} lane</span></div><div style={{ height: 8, background: "#EFE5CC", borderRadius: 999, marginTop: 12, overflow: "hidden" }}><span style={{ display: "block", width: `${evidencePct}%`, height: "100%", background: "#B08A2E" }} /></div><p style={{ margin: "8px 0 0", color: "#5A6172", fontSize: 12.5 }}>Verified evidence counts automatically. Open items remain open until a source, document, or professional review resolves them.</p></header>
          {facts.length > 0 && <details style={card}><summary style={{ cursor: "pointer", fontWeight: 800, color: "#1C2B45" }}>Resolved evidence ({facts.length})</summary><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 8, marginTop: 12 }}>{facts.map((fact) => <article key={`${fact.label}-${fact.value}`} style={{ border: "1px solid #CFE4D6", background: "#F3FAF5", borderRadius: 10, padding: 11 }}><strong style={{ display: "block", color: "#1C2B45", fontSize: 13 }}>{fact.label}</strong><span style={{ display: "block", color: "#2E7D4F", fontSize: 12, fontWeight: 750, marginTop: 3 }}>{fact.value}</span><span style={{ display: "block", color: "#6B7280", fontSize: 10.5, marginTop: 4 }}>{fact.provenance}</span></article>)}</div></details>}
          {groups.length ? groups.map((group) => <section key={group.id} style={{ ...card, padding: 0, overflow: "hidden" }}><button type="button" onClick={() => setOpenGroups((value) => ({ ...value, [group.id]: !value[group.id] }))} style={{ width: "100%", border: 0, background: "transparent", padding: "15px 17px", display: "flex", justifyContent: "space-between", cursor: "pointer", color: "#1C2B45", fontWeight: 800 }}><span>{group.title}</span><span>{group.items.length} open {openGroups[group.id] ? "▴" : "▾"}</span></button>{openGroups[group.id] && <div style={{ padding: "0 16px 16px", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 8 }}>{group.items.map((item) => <article key={`${group.id}:${item.label}`} style={{ border: "1px solid #E8D9B5", borderRadius: 10, padding: 11, background: "#FFFCF5" }}><strong style={{ display: "block", color: "#1C2B45", fontSize: 13 }}>{item.label}</strong><span style={{ display: "block", color: "#5A6172", fontSize: 11.5, lineHeight: 1.45, marginTop: 3 }}>{item.how}</span><span style={{ display: "block", color: "#8A6A20", fontSize: 10.5, marginTop: 4 }}>Verification source: {item.source}</span></article>)}</div>}</section>) : <div style={card}>No unresolved property checks are currently listed.</div>}
        </>}

        {tab === "readiness" && <>
          <header style={card}><h3 style={{ margin: 0, color: "#1C2B45", fontFamily: "Georgia,serif" }}>Decision readiness</h3><p style={{ margin: "5px 0 0", color: "#5A6172", fontSize: 13 }}>This is the customer file’s readiness—not Furlong’s internal release governance.</p></header>
          {[{ title: "Property identity and intended use", done: Boolean(props.propertyType), note: `${lane} lane selected from the available evidence.` }, { title: "Purchase assumptions", done: hasPrice, note: hasPrice ? props.priceLabel : "Enter or confirm the purchase price." }, { title: "Material property evidence", done: facts.length >= 4, note: `${facts.length} property-specific facts verified.` }, { title: "Major diligence questions", done: unknowns.length <= 5, note: `${unknowns.length} unresolved items remain.` }].map((item) => <article key={item.title} style={{ ...card, display: "flex", gap: 12, alignItems: "flex-start" }}><span style={{ width: 28, height: 28, borderRadius: "50%", display: "grid", placeItems: "center", flex: "none", background: item.done ? "#EAF4EE" : "#FBF1E0", color: item.done ? "#2E7D4F" : "#A2661F", fontWeight: 900 }}>{item.done ? "✓" : "!"}</span><div><strong style={{ color: "#1C2B45" }}>{item.title}</strong><p style={{ margin: "3px 0 0", color: "#5A6172", fontSize: 12.5 }}>{item.note}</p></div></article>)}
          <section style={{ ...card, background: recommendationEligible ? "#EAF4EE" : "#FBF5E6", display: "grid", gap: 7 }}><strong style={{ color: "#1C2B45" }}>{recommendationEligible ? "Supported review threshold satisfied" : "Preliminary property conclusion available"}</strong><p style={{ margin: 0, color: "#5A6172", fontSize: 12.5 }}>{recommendationEligible ? "The current report can move into named human review for final recommendation posture." : "Furlong has generated the customer property report using the available evidence. Remaining items are conditions and confidence limits—not a reason to withhold the answer. Furlong will not manufacture a score; it will provide an evidence-linked conclusion with the unresolved conditions shown."}</p><button type="button" onClick={() => setTab("report")} style={{ justifySelf: "start", border: 0, borderRadius: 9, padding: "9px 13px", background: "#1C2B45", color: "#fff", fontWeight: 800, cursor: "pointer" }}>Open property pro forma report</button></section>
        </>}
      </div>
    </section>
  );
}
