"use client";

import { useMemo, useState } from "react";
import type { ChartTableBriefProps } from "@/components/property/ChartTableBrief";
import { CHART_THEMES } from "@/lib/property/chartThemes";
import type { OfficialPropertyEvidenceRecord } from "@/lib/property/propertyEvidenceIngestion";

export type PropertyCommandCenterProps = ChartTableBriefProps & { deedEvidence?: OfficialPropertyEvidenceRecord[] };
type TabId = "summary" | "property" | "utilities" | "finance" | "environmental" | "education" | "misc" | "report";

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



function financingProgramNote(name: string, lane: string) {
  const value = name.toLowerCase();
  if (value.includes("203(k)")) return { fit: "Renovation-oriented FHA path", why: "Relevant when the residence needs substantial repair and the acquisition and rehabilitation may be combined.", watch: "Requires eligible owner occupancy, an approved lender, appraisal support, and a documented rehabilitation scope." };
  if (value.includes("fha")) return { fit: "Owner-occupied residential path", why: "Potential fit for a primary residence with a lower down-payment structure.", watch: "Property condition, appraisal, flood insurance, mortgage insurance, and borrower eligibility still control." };
  if (/\bva\b/.test(value)) return { fit: "Veteran owner-occupant path", why: "Potentially strong when an eligible veteran intends to occupy the property.", watch: "COE, borrower qualification, VA appraisal/minimum-property requirements, and renovation-lender availability are handled in the personalized Financial module." };
  if (value.includes("conventional")) {
    if (/commercial|business/.test(lane.toLowerCase())) return { fit: "Conventional commercial real-estate financing", why: "Useful when the property value, permitted use, occupancy, and operating cash flow support ordinary commercial real-estate underwriting.", watch: "Lenders will still test appraisal, debt-service coverage, borrower strength, environmental risk, property condition, tenant or owner occupancy, and any business or equipment value included in the purchase." };
    if (/farm|agricultural/.test(lane.toLowerCase())) return { fit: "Conventional agricultural real-estate financing", why: "Useful when land value, improvements, farm cash flow, and collateral quality support a conventional agricultural mortgage.", watch: "Production history, farm income, appraisal, water and access rights, environmental condition, and the value of included improvements or equipment still control." };
    return { fit: "Standard residential financing", why: "Useful when appraisal and condition support ordinary mortgage collateral requirements.", watch: "A teardown or major rehabilitation may require renovation or construction financing instead." };
  }
  if (value.includes("seller financing") || value.includes("seller-financed")) return { fit: "Seller-carried financing", why: "The seller may carry part or all of the purchase price through a negotiated note, sometimes alongside bank, SBA, Farm Credit, or buyer equity.", watch: "Price, down payment, interest rate, amortization, balloon date, lien priority, collateral, default remedies, due-on-sale terms, and independent legal and tax review must be documented before reliance." };
  if (value.includes("hard money") || value.includes("private asset-based") || value.includes("private bridge")) return { fit: "Private asset-based bridge financing (often called hard money)", why: "A short-term lender may underwrite primarily to collateral value and exit strategy when speed, condition, occupancy, or conventional seasoning prevents ordinary financing.", watch: "These loans are commonly higher-cost and shorter-term, with points, fees, conservative loan-to-value limits, extension charges, personal guarantees, and a required refinance or sale exit. They should be compared on total dollars and downside risk—not headline rate alone." };
  if (value.includes("construction") || value.includes("renovation")) {
    if (/commercial|business/.test(lane.toLowerCase())) return { fit: "Commercial acquisition, renovation, or value-add financing", why: "Commercial lenders commonly finance acquisition and approved improvements together through a bank portfolio loan, SBA structure, bridge facility, or construction-to-permanent execution; it is not automatically a separate residential-style construction loan.", watch: "The lender will size proceeds to purchase price, stabilized value, renovation budget, debt-service coverage, borrower liquidity, environmental condition, permits, contractor controls, and the timing of business or tenant occupancy." };
    if (/farm|agricultural/.test(lane.toLowerCase())) return { fit: "Agricultural improvement or construction financing", why: "Farm and agricultural lenders may combine land acquisition with eligible building, drainage, fencing, equipment, or rehabilitation costs when the operating plan supports repayment.", watch: "Plans, budget, appraisal, farm cash flow, permits, contractor controls, and program-specific eligible-use rules still govern." };
    return { fit: "Major-repair or replacement path", why: "Relevant when the existing structure has limited contributory value or needs extensive rehabilitation.", watch: "Requires plans, budget, contractor controls, appraisal-as-completed, and lender-specific draw administration." };
  }
  if (value.includes("usda")) {
    if (/commercial|business/.test(lane.toLowerCase())) return { fit: "Rural business-purpose financing", why: "Potentially relevant when the property supports an eligible operating business in a USDA-eligible rural area.", watch: "Rural eligibility, eligible business purpose, lender participation, repayment ability, collateral, appraisal, environmental review, and use-of-proceeds rules still control." };
    if (/farm|agricultural/.test(lane.toLowerCase())) return { fit: "Agricultural or rural-property financing", why: "Potentially relevant when the farm, land, or owner-occupied rural use matches the specific USDA or FSA program.", watch: "The exact program, geography, farm or household eligibility, repayment ability, appraisal, occupancy, and use-of-proceeds rules still control." };
    return { fit: "Owner-occupied rural housing pathway", why: "Potentially relevant only when this is an eligible primary residence in a USDA-eligible rural area.", watch: "Property geography, household income, owner occupancy, appraisal, condition, and program limits still control." };
  }
  if (value.includes("sba")) return { fit: "Business-purpose pathway", why: "Potential fit only when the property supports an eligible operating business rather than passive ownership.", watch: "Business use, borrower/entity eligibility, injection, repayment ability, and collateral rules are reviewed in the Financial module." };
  return { fit: "Property-relevant financing family", why: "Surfaced from the property type, intended use, location, and currently available evidence.", watch: "Price, appraisal, condition, occupancy, insurance, and borrower-specific eligibility still control final fit." };
}

function suppressResolvedUnknowns(
  facts: NonNullable<ChartTableBriefProps["intelligence"]>["verifiedFacts"],
  unknowns: NonNullable<ChartTableBriefProps["intelligence"]>["unknowns"]
) {
  const factText = facts.map((fact) => `${fact.label} ${fact.value} ${fact.text}`.toLowerCase()).join(" ");
  return unknowns.filter((item) => {
    const label = item.label.toLowerCase();
    if (/flood zone/.test(label) && /flood zone|flood and insurance posture|waterfront exposure/.test(factText)) return false;
    if (/condition|repair scope/.test(label) && /known condition and repair posture|major rehabilitation|teardown/.test(factText)) return false;
    if (/size|lot|what conveys|parcel/.test(label) && /size|acre|parcel count|parcel and conveyance profile|two lots|recorded deed/.test(factText)) return false;
    if (/planned construction|public works/.test(label) && /nearby public works screening|regional us 113 projects/.test(factText)) return false;
    if (/higher education|college/.test(label) && /higher education/.test(factText)) return false;
    if (/broadband/.test(label) && /broadband/.test(factText)) return false;
    if (/county/.test(label) && /county/.test(factText)) return false;
    if (/historic/.test(label) && /historic status/.test(factText)) return false;
    return true;
  });
}

export function PropertyCommandCenter(props: PropertyCommandCenterProps) {
  const theme = CHART_THEMES[props.variant ?? "buyer"];
  const [tab, setTab] = useState<TabId>(() => /farm|ranch|agric/i.test(props.propertyType) ? "property" : "summary");
  const [ownerFeatureInput, setOwnerFeatureInput] = useState("");
  const [localOwnerAssertions, setLocalOwnerAssertions] = useState<Array<{ label: string; value: string; text: string; provenance: string; tone: "neutral" }>>([]);
  const facts = props.intelligence?.verifiedFacts ?? [];
  const rawUnknowns = props.intelligence?.unknowns ?? [];
  const unknowns = useMemo(() => suppressResolvedUnknowns(facts, rawUnknowns), [facts, rawUnknowns]);
  const lane = laneLabel(props.propertyType);
  const hasPrice = !/not captured|unknown|enter|not provided|—/i.test(props.priceLabel);
  const ownerAssertions = [...(props.intelligence?.ownerAssertions ?? []), ...localOwnerAssertions];
  const deedEvidence = (props.deedEvidence ?? []).filter((record) => record.domain === "title");

  const categoryForFact = (label: string): Exclude<TabId, "summary" | "report" | "finance"> => {
    const value = label.toLowerCase();
    if (/school|education|college|university|district|parochial/.test(value)) return "education";
    if (/electric|utility|water|sewer|septic|well|broadband|internet|gas|fuel|wastewater/.test(value)) return "utilities";
    if (/environment|flood|wetland|hazard|historic|contamin|storm|climate|soil|waterfront exposure/.test(value)) return "environmental";
    if (/acre|parcel|lot|bed|bath|price|tax|assessment|property type|year built|square feet|size|deed|title/.test(value)) return "property";
    return "misc";
  };
  const categoryForUnknown = (item: NonNullable<ChartTableBriefProps["intelligence"]>["unknowns"][number]): Exclude<TabId, "summary" | "report" | "finance"> => {
    const value = `${item.label} ${item.pointer} ${item.howToFind}`.toLowerCase();
    if (/school|education|college|university|district/.test(value)) return "education";
    if (/electric|utility|water|sewer|septic|well|broadband|internet|gas|fuel|wastewater/.test(value)) return "utilities";
    if (/environment|flood|wetland|hazard|historic|contamin|storm|climate|soil/.test(value)) return "environmental";
    if (/acre|parcel|lot|bed|bath|price|tax|assessment|property type|year built|square feet|size|deed|title|zoning/.test(value)) return "property";
    return "misc";
  };

  const factsByTab = useMemo(() => {
    const out: Record<string, typeof facts> = { property: [], utilities: [], environmental: [], education: [], misc: [] };
    for (const fact of facts) out[categoryForFact(fact.label)].push(fact);
    return out;
  }, [facts]);
  const unknownsByTab = useMemo(() => {
    const out: Record<string, typeof unknowns> = { property: [], utilities: [], environmental: [], education: [], misc: [] };
    for (const item of unknowns) out[categoryForUnknown(item)].push(item);
    return out;
  }, [unknowns]);

  const tabs: Array<{ id: TabId; label: string }> = [
    { id: "summary", label: "Summary" },
    { id: "property", label: "Property" },
    { id: "utilities", label: "Utilities" },
    { id: "finance", label: "Finance" },
    { id: "environmental", label: "Environmental" },
    { id: "education", label: "Education" },
    { id: "misc", label: "Misc. / Other" },
    { id: "report", label: "Report" },
  ];

  const shell = { background: "#FAF8F3", border: "1px solid #E5E0D5", borderRadius: 18, overflow: "hidden" } as const;
  const card = { background: "#fff", border: "1px solid #E5E0D5", borderRadius: 14, padding: "16px 18px" } as const;
  const renderFact = (fact: (typeof facts)[number]) => <article key={`${fact.label}-${fact.value}`} style={card}><span style={{ fontSize: 10, color: "#8A8F9C", fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase" }}>{fact.label}</span><strong style={{ display: "block", color: "#1C2B45", marginTop: 4, lineHeight: 1.4 }}>{fact.value}</strong><details><summary style={{ marginTop: 7, cursor: "pointer", color: "#8F6E1F", fontSize: 11.5 }}>Source and explanation</summary><p style={{ fontSize: 12, color: "#5A6172", lineHeight: 1.55 }}>{fact.text}</p><p style={{ fontSize: 10.5, color: "#8A8F9C" }}>{fact.provenance}</p></details></article>;
  const renderUnknown = (item: (typeof unknowns)[number]) => <article key={item.label} style={{ ...card, background: "#FFFCF5", borderColor: "#E8D9B5" }}><strong style={{ display: "block", color: "#1C2B45", fontSize: 13 }}>{item.label}</strong><span style={{ display: "block", color: "#5A6172", fontSize: 11.5, lineHeight: 1.45, marginTop: 4 }}>{item.howToFind}</span><span style={{ display: "block", color: "#8A6A20", fontSize: 10.5, marginTop: 5 }}>Verification source: {item.pointer}</span></article>;
  const renderCategory = (id: "property" | "utilities" | "environmental" | "education" | "misc", title: string, intro: string) => <><header style={card}><h3 style={{ margin: 0, color: "#1C2B45", fontFamily: "Georgia,serif" }}>{title}</h3><p style={{ margin: "5px 0 0", color: "#5A6172", fontSize: 13 }}>{intro}</p></header>{factsByTab[id].length > 0 && <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 10 }}>{factsByTab[id].map(renderFact)}</div>}{unknownsByTab[id].length > 0 && <details style={{ ...card, background: "#FFFCF5", borderColor: "#E8D9B5" }}><summary style={{ cursor: "pointer", color: "#1C2B45", fontWeight: 800 }}>Follow-up checks ({unknownsByTab[id].length})</summary><p style={{ margin: "7px 0 10px", color: "#5A6172", fontSize: 12.5, lineHeight: 1.5 }}>These are not blank property facts. They are additional records that have not yet been verified for this parcel.</p><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: 9 }}>{unknownsByTab[id].map(renderUnknown)}</div></details>}{factsByTab[id].length === 0 && unknownsByTab[id].length === 0 && <div style={card}>No information is currently available in this section.</div>}</>;

  return <section aria-label="Property command center" data-testid="property-command-center" data-consumer-lane={lane} style={shell}>
    <nav aria-label="Property workspace sections" style={{ position: "sticky", top: 0, zIndex: 4, background: "rgba(250,248,243,.97)", borderBottom: "1px solid #E5E0D5", padding: "10px 12px", display: "flex", gap: 7, overflowX: "auto", alignItems: "center" }}>
      <img src="/brand/furlong-emblem.png" alt="Furlong emblem" width={38} height={38} style={{ width: 38, height: 38, objectFit: "contain", flex: "none", marginRight: 4 }} />
      {tabs.map((item) => <button key={item.id} type="button" onClick={() => setTab(item.id)} aria-current={tab === item.id ? "page" : undefined} style={{ border: 0, borderRadius: 9, padding: "9px 12px", whiteSpace: "nowrap", fontWeight: 750, cursor: "pointer", background: tab === item.id ? "#fff" : "transparent", color: tab === item.id ? "#1C2B45" : "#5A6172", boxShadow: tab === item.id ? "0 1px 4px rgba(28,43,69,.12)" : "none" }}>{item.label}</button>)}
    </nav>
    <div style={{ padding: 20, display: "grid", gap: 16 }}>
      {tab === "summary" && <>
        <article style={{ ...card, background: "linear-gradient(155deg,#20304E,#16233C)", color: "#fff", border: 0, display: "grid", gap: 9 }}><span style={{ color: "#CBA24A", fontSize: 10.5, fontWeight: 800, letterSpacing: ".16em", textTransform: "uppercase" }}>Property summary</span><h2 style={{ margin: 0, color: "#fff", fontFamily: "Georgia,serif", fontSize: 24 }}>{props.title}</h2><span style={{ color: "#AEB6C6", fontSize: 13 }}>{props.location} · {lane}</span><p style={{ margin: 0, lineHeight: 1.6, color: "#E6E9EF" }}>{props.headline}</p></article>
        <section style={{ ...card, display: "grid", gap: 9 }}><strong style={{ color: "#1C2B45" }}>Everything at a glance</strong><p style={{ margin: 0, color: "#5A6172", lineHeight: 1.6, fontSize: 13 }}>{hasPrice ? `Price basis: ${props.priceLabel}. ` : "Price is not yet confirmed. "}{factsByTab.property.length} property fact{factsByTab.property.length === 1 ? "" : "s"}, {factsByTab.utilities.length} utility fact{factsByTab.utilities.length === 1 ? "" : "s"}, {factsByTab.environmental.length} environmental fact{factsByTab.environmental.length === 1 ? "" : "s"}, {factsByTab.education.length} education fact{factsByTab.education.length === 1 ? "" : "s"}, and {factsByTab.misc.length} other fact{factsByTab.misc.length === 1 ? "" : "s"} are organized in the tabs above. {unknowns.length ? `${unknowns.length} item${unknowns.length === 1 ? " remains" : "s remain"} to verify.` : "No unresolved diligence items are currently listed."}</p></section>
        <section style={{ ...card, borderColor: "#D7B85A", background: "#FFF9E8", display: "grid", gap: 9 }}><strong style={{ color: "#1C2B45" }}>Something Furlong missed?</strong><form onSubmit={(event) => { event.preventDefault(); const value = ownerFeatureInput.trim(); if (!value) return; setLocalOwnerAssertions((current) => [...current, { label: value, value: "Owner reported — pending verification", text: "Customer-supplied property feature pending source verification.", provenance: "Owner assertion added in the property workspace", tone: "neutral" }]); setOwnerFeatureInput(""); }} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><input value={ownerFeatureInput} onChange={(event) => setOwnerFeatureInput(event.target.value)} placeholder="e.g. deeded pier, two parcels" aria-label="Property feature Furlong missed" style={{ flex: "1 1 260px", border: "1px solid #B08A2E", borderRadius: 9, padding: "10px 12px" }} /><button type="submit" style={{ border: 0, borderRadius: 9, padding: "10px 14px", background: "#1C2B45", color: "#fff", fontWeight: 800 }}>Add feature</button></form>{ownerAssertions.length > 0 && <div style={{ display: "grid", gap: 7 }}><strong style={{ color: "#1C2B45", fontSize: 12 }}>Owner-reported property features</strong>{ownerAssertions.map((fact) => <span key={`${fact.label}-${fact.value}`} style={{ color: "#5A6172", fontSize: 12 }}><strong>{fact.label}:</strong> {fact.value}</span>)}</div>}</section>
      </>}
      {tab === "property" && renderCategory("property", "Property", "Lot size, parcel identity, bedrooms and bathrooms, price, taxes, deed, and core physical identity live here.")}
      {tab === "utilities" && renderCategory("utilities", "Utilities", "Electricity, water, sewer, septic, well, gas, broadband, and recurring infrastructure costs live here.")}
      {tab === "environmental" && renderCategory("environmental", "Environmental", "Flood, wetlands, hazards, contamination, historic constraints, soils, climate, and environmental diligence live here.")}
      {tab === "education" && renderCategory("education", "Education", "Assigned-school evidence, nearby public and private options, higher education, and state choice rules live here.")}
      {tab === "misc" && renderCategory("misc", "Miscellaneous and other", "Location, amenities, transportation, market context, operations, and facts that do not belong in the other dedicated sections live here.")}
      {tab === "finance" && <><header style={card}><h3 style={{ margin: 0, color: "#1C2B45", fontFamily: "Georgia,serif" }}>Finance</h3><p style={{ margin: "5px 0 0", color: "#5A6172", fontSize: 13 }}>Current rate and term comparisons, ownership costs, cash to close, and property-relevant financing pathways live here.</p></header>{props.costsSlot ?? <div style={card}>Enter or confirm the property price to begin the financial model.</div>}<section style={card}><h3 style={{ margin: 0, color: "#1C2B45", fontSize: 16 }}>Property financing programs</h3><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: 9, marginTop: 10 }}>{props.financingLanes.length ? props.financingLanes.map((item, index) => { const note = financingProgramNote(item, lane); return <article key={item} style={{ border: `1px solid ${index === 0 ? "#B08A2E" : "#E5E0D5"}`, borderRadius: 10, padding: "12px 13px", background: index === 0 ? "#FBF5E6" : "#fff", display: "grid", gap: 6 }}><strong style={{ color: "#1C2B45" }}>{index + 1}. {item}</strong><span style={{ color: "#8F6E1F", fontSize: 11.5, fontWeight: 800 }}>{note.fit}</span><span style={{ color: "#5A6172", fontSize: 11.5 }}>{note.why}</span><span style={{ color: "#6B7280", fontSize: 10.8 }}><b>What still controls:</b> {note.watch}</span></article>; }) : <span>No property-relevant program has been produced yet.</span>}</div></section></>}
      {tab === "report" && <><header style={card}><h3 style={{ margin: 0, color: "#1C2B45", fontFamily: "Georgia,serif" }}>Report and pro forma</h3><p style={{ margin: "5px 0 0", color: "#5A6172", fontSize: 13 }}>View, download, print, save, and continue to the personalized pro forma from one place.</p></header>{props.actionsSlot && <section style={{ ...card, display: "grid", gap: 9, borderColor: "#C8D8EA", background: "#F7FAFD" }}>{props.actionsSlot}</section>}<section style={{ ...card, borderColor: "#C8D8EA", background: "#F7FAFD", display: "grid", gap: 9 }}><h3 style={{ margin: 0, color: "#1C2B45", fontSize: 16 }}>Personalized pro forma</h3><p style={{ margin: 0, color: "#5A6172", fontSize: 12.5 }}>Continue when you want borrower-specific qualification, document review, and a finalized pro forma from the licensed Financial module.</p><a href="/explore#personalized-financing" style={{ justifySelf: "start", borderRadius: 9, padding: "10px 14px", background: "#1C2B45", color: "#fff", fontWeight: 800, textDecoration: "none" }}>Continue to personalized Financial module</a></section>{deedEvidence.length > 0 && <details style={card}><summary style={{ cursor: "pointer", fontWeight: 800, color: "#1C2B45" }}>Restricted deed evidence</summary><p style={{ color: "#5A6172", fontSize: 12 }}>Recorded deed evidence is available inside an authorized financial or lender workspace.</p></details>}</>}
    </div>
  </section>;
}
