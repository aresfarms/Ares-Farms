"use client";

/**
 * GovernedLaneChassis — the SINGLE-SOURCE compliance substrate under all three
 * consumer lane workspaces (founder-approved decomposition, 2026-07-28).
 *
 * The chassis owns everything that is legally sensitive or provenance-bearing
 * and must never fork per lane:
 *   - sticky tab navigation shell + single-assignment fact routing,
 *   - the fact card with "Source and explanation" provenance on every figure,
 *   - record-fact promotion from the matched parcel/listing record,
 *   - resolved-unknown suppression (suppressResolvedUnknowns),
 *   - the owner-correction loop ("Something Furlong missed?"),
 *   - the Report tab (save/export actions + personalized pro forma hand-off),
 *   - customer-safe language only — no internal governance state.
 *
 * Everything a lane OWNS arrives through its LaneDefinition: tab list and
 * intros, initial tab, financing ranking + program notes + rate labels, and
 * the best-first-path rationale. Farm, commercial, and residential evolve
 * independently in their own files; the substrate stays here, once.
 */

import { useMemo, useState, type ReactNode } from "react";
import type { ChartTableBriefProps } from "@/components/property/ChartTableBrief";
import { CHART_THEMES } from "@/lib/property/chartThemes";
import type { OfficialPropertyEvidenceRecord } from "@/lib/property/propertyEvidenceIngestion";
import { indicateMarketValue } from "@/lib/property/marketValueIndication";

export type TabId = "summary" | "property" | "agriculture" | "utilities" | "finance" | "environmental" | "education" | "misc" | "report";
export type CategoryTabId = Exclude<TabId, "summary" | "report" | "finance">;

export type FinancingRateContext = {
  fsaOwnershipDirectPct: number | null;
  fsaDownPaymentPct: number | null;
  fsaEffective: string | null;
  mortgage30Pct: number | null;
  mortgageWeekOf: string | null;
} | null;

export type LaneTab = { id: TabId; label: string; intro: string };

export type LaneFinancingNote = { fit: string; why: string; watch: string };

export type LaneDefinition = {
  /** Canonical lane id — matches the property-profile grouping, not a regex. */
  id: "residential" | "farm" | "commercial";
  /** Customer-facing lane name used in the summary line + data attribute. */
  consumerLaneLabel: "Residential" | "Farm & agricultural" | "Commercial & business";
  /** Tab the lane opens on. */
  initialTab: TabId;
  /** The lane's own tabs — labels and category intros are lane-owned copy. */
  tabs: LaneTab[];
  /** Lower sorts first in the Finance tab ranking. */
  financingPriority: (programName: string) => number;
  /** Current-rate/quote label for a program, lane-flavored. */
  financingRateLabel: (programName: string, rates: FinancingRateContext) => string;
  /** Fit / why / what-still-controls copy for a program, lane-flavored. */
  financingProgramNote: (programName: string) => LaneFinancingNote;
  /** Why the top-ranked program leads, in this lane's own words. */
  bestFirstPathNote: (programName: string) => string;
  /** Optional lane refinement of fact routing; return null to use the default. */
  categorizeFact?: (label: string) => CategoryTabId | null;
};

export type LaneWorkspaceProps = ChartTableBriefProps & {
  deedEvidence?: OfficialPropertyEvidenceRecord[];
  financingRateContext?: FinancingRateContext;
  propertyRecord?: {
    exactAddress: string | null;
    rawPropertyStyle: string | null;
    propertyType?: string | null;
    price?: number | null;
    county?: string | null;
    town?: string | null;
    state?: string | null;
    parcelRefs?: string[];
    recordBasis?: "matched-approved-source-record" | "matched-jurisdiction-parcel-record" | "matched-governed-listing-and-parcel-record" | "verified-address-only";
    parcelSourceName?: string | null;
    parcelSourceAsOf?: string | null;
    parcelSourceUrl?: string | null;
    landUse?: string | null;
    zoning?: string | null;
    deedReference?: string | null;
    legalDescription?: string | null;
    assessedLandValue?: number | null;
    assessedImprovementValue?: number | null;
    assessedTotalValue?: number | null;
    publicWater?: boolean | null;
    publicSewer?: boolean | null;
    waterfront?: boolean | null;
    resolvedParcelCount?: number;
    offeredParcelCount?: number | null;
    offeredAcreage?: number | null;
    listingSourceName?: string | null;
    listingSourceAsOf?: string | null;
    listingSourceUrl?: string | null;
    listingAgent?: string | null;
    listingBrokerage?: string | null;
    listingPhone?: string | null;
    listingEmail?: string | null;
    bedrooms: number | null;
    bathrooms?: number | null;
    yearBuilt: number | null;
    squareFeet: number | null;
    acreageText: string | null;
    listingId: string | null;
    listingStatus: string | null;
  } | null;
  /** Lane-owned content for a lane-specific tab (the farm lane's Agriculture
      tab). Renders only when the lane's tab list includes that tab. */
  agricultureSlot?: ReactNode;
  /** Report-tab slot for the DRAFT SBA/USDA pro forma download (farm and
      commercial lanes). Rendered inside the Report tab above the licensed
      Financial-module hand-off. */
  proformaSlot?: ReactNode;
  /** True while the property-facts request is in flight — the Summary tab
      says the record is still arriving instead of showing zero counts. */
  factsPending?: boolean;
  /** Property-first program fit (founder premise 2026-08-05): per-program
      standalone-lendability findings computed from THIS property's metrics.
      When present, the Finance tab ranks by fit score (excluded programs
      last) instead of the lane's static fallback order, and renders each
      program's property-standalone line. Keys match financingLanes names. */
  financingFit?: Record<string, { score: number; line: string; excluded?: string }>;
  /** Finance-tab analysis panel (commercial best-use income screen, lender-
      test scorecard) rendered between the best-first box and the cost model. */
  financeAnalysisSlot?: ReactNode;
};

type ChassisProps = LaneWorkspaceProps & { lane: LaneDefinition };

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

/** Default single-assignment fact routing; lanes may refine via categorizeFact. */
function defaultCategoryForFact(label: string): CategoryTabId {
  const value = label.toLowerCase();
  if (/school|education|college|university|district|parochial/.test(value)) return "education";
  if (/electric|utility|water|sewer|septic|well|broadband|internet|gas|fuel|wastewater/.test(value)) return "utilities";
  if (/environment|flood|wetland|hazard|historic|contamin|storm|climate|soil|waterfront exposure/.test(value)) return "environmental";
  if (/acre|parcel|lot|bed|bath|price|tax|assessment|property type|year built|square feet|size|deed|title/.test(value)) return "property";
  return "misc";
}

export function GovernedLaneChassis(props: ChassisProps) {
  const lane = props.lane;
  const theme = CHART_THEMES[props.variant ?? "buyer"];
  void theme;
  const [tab, setTab] = useState<TabId>(lane.initialTab);
  const [ownerFeatureInput, setOwnerFeatureInput] = useState("");
  const [localOwnerAssertions, setLocalOwnerAssertions] = useState<Array<{ label: string; value: string; text: string; provenance: string; tone: "neutral" }>>([]);
  const rawFacts = props.intelligence?.verifiedFacts ?? [];
  const recordFacts = useMemo(() => {
    const record = props.propertyRecord;
    if (!record) return [];
    const source = record.recordBasis === "verified-address-only"
      ? "Source: verified address intake; parcel-level fields require an approved jurisdiction record"
      : record.recordBasis === "matched-jurisdiction-parcel-record"
        // A missing vintage must be STATED, never silently dropped — and it
        // must never be replaced with the date we fetched the record. Sussex
        // County publishes no assessment date at all; printing today's date
        // there made a base-year tax figure look like today's market value
        // (founder-caught 2026-08-06, $629k assessment vs $2.5M contract).
        ? `Source: ${record.parcelSourceName ?? "official jurisdiction parcel record"} · ${record.parcelSourceAsOf ? `source-published data date ${record.parcelSourceAsOf}` : "this source publishes no data date — the figures may be years old"}`
        : "Source: matched property/listing record";
    const place = [record.town, record.county, record.state].filter(Boolean).join(", ");
    const valuation = indicateMarketValue({
      assessedTotalValue: record.assessedTotalValue,
      stateCode: record.state,
      county: record.county,
      knownPriceUsd: record.price,
      knownPriceLabel: record.listingStatus ? `${record.listingStatus} at` : "Asking price",
    });
    return [
      record.exactAddress ? { label: "Verified address", value: record.exactAddress, text: "The entered property address resolved successfully through the public address-verification path.", provenance: source, tone: "neutral" as const } : null,
      place ? { label: "Property location", value: place, text: "Town, county, and state carried into the property record from the verified intake context.", provenance: source, tone: "neutral" as const } : null,
      record.price != null ? { label: "Asking price", value: `$${record.price.toLocaleString("en-US")}`, text: "Current seller asking price carried by the matched governed listing snapshot.", provenance: record.listingSourceName ? `Source: ${record.listingSourceName}${record.listingSourceAsOf ? ` · ${record.listingSourceAsOf}` : ""}` : source, tone: "neutral" as const } : null,
      // Market status is ALWAYS shown — because its absence is itself the
      // most decision-relevant fact a visitor can have. A brief that simply
      // omits it lets someone read a full report on a property that sold
      // last week (founder-caught 2026-08-06).
      record.listingStatus
        ? { label: "Market status", value: record.listingStatus, text: "Current public sale posture carried by the matched listing source.", provenance: record.listingSourceName ? `Source: ${record.listingSourceName}` : source, tone: "neutral" as const }
        : { label: "Market status", value: "Not known — no listing feed covers this address", text: "Furlong does not carry a multiple-listing feed, so this brief cannot tell you whether the property is for sale, under contract, or already sold. A property can be under contract at a price far above or below every figure on this page. Confirm current status with the listing broker, the seller, or the county recorder before relying on anything here.", provenance: "Absence of a governed listing source — stated rather than omitted", tone: "caution" as const },
      record.listingId ? { label: "MLS / listing ID", value: record.listingId, text: "Public listing identifier for the active offering.", provenance: record.listingSourceName ? `Source: ${record.listingSourceName}` : source, tone: "neutral" as const } : null,
      record.offeredParcelCount ? { label: "Sale package", value: `${record.offeredParcelCount} parcels · ${record.offeredAcreage?.toLocaleString("en-US") ?? "acreage pending"} acres offered`, text: record.resolvedParcelCount === record.offeredParcelCount ? "Every parcel in the listing package has been reconciled to an official jurisdiction parcel record." : `The listing offers ${record.offeredParcelCount} parcels. ${record.resolvedParcelCount ?? 0} parcel identities are currently resolved from the official jurisdiction source; the remaining listing parcel identity still requires reconciliation.`, provenance: record.listingSourceName ? `Source: ${record.listingSourceName}; parcel identities: ${record.parcelSourceName ?? "jurisdiction source"}` : source, tone: record.resolvedParcelCount === record.offeredParcelCount ? "neutral" as const : "caution" as const } : null,
      record.parcelRefs?.length ? { label: "Resolved parcel identities", value: record.parcelRefs.join(" · "), text: "Official account, map, grid, parcel, or lot references returned by the jurisdiction parcel source.", provenance: source, tone: "neutral" as const } : null,
      record.acreageText ? { label: "Land area", value: record.acreageText, text: `The matched record reports ${record.acreageText} of land.`, provenance: source, tone: "neutral" as const } : null,
      record.landUse ? { label: "Land use", value: record.landUse, text: "Land-use description published by the official parcel source.", provenance: source, tone: "neutral" as const } : null,
      record.zoning ? { label: "Zoning", value: record.zoning, text: "Zoning code carried by the official parcel source; local zoning records remain controlling.", provenance: source, tone: "neutral" as const } : null,
      record.deedReference ? { label: "Recorded deed reference", value: record.deedReference, text: record.legalDescription || "Deed book and page reference published with the parcel record.", provenance: source, tone: "neutral" as const } : null,
      record.assessedLandValue != null ? { label: "County-assessed land value", value: `$${record.assessedLandValue.toLocaleString("en-US")}`, text: "The land component of the county's estimated value for taxation. It is not a market appraisal and not a seller asking price — a lender's appraiser or the market may conclude differently.", provenance: source, tone: "neutral" as const } : null,
      record.assessedImprovementValue != null ? { label: "County-assessed improvement value", value: `$${record.assessedImprovementValue.toLocaleString("en-US")}`, text: "The building/improvement component of the county's estimated value for taxation — not a market appraisal.", provenance: source, tone: "neutral" as const } : null,
      record.assessedTotalValue != null ? { label: "County-assessed total value", value: `$${record.assessedTotalValue.toLocaleString("en-US")}`, text: `The county's total estimated value FOR TAXATION${record.parcelSourceAsOf ? ` as published by the source on ${record.parcelSourceAsOf}` : ", of a vintage this source does not publish"}. Read it as a tax figure and nothing else. Assessed values routinely sit far below — occasionally far above — what a property actually trades for, because many jurisdictions assess against a frozen base year and none of them re-assess when a property goes under contract. It is not an appraisal, not a market-price opinion, and not Furlong's view of what this property is worth.`, provenance: source, tone: "caution" as const } : null,
      // FURLONG'S OWN INDICATED VALUE (founder direction 2026-08-06: "it must
      // publish that data, that is the entire point of that part of the
      // platform"). The assessed value must never stand as the only dollar
      // figure on the page — left alone it becomes, by default, the number a
      // reader takes away as what the property is worth.
      valuation.status === "indicated"
        ? { label: "Indicated market value (Furlong)", value: `$${valuation.lowUsd!.toLocaleString("en-US")} – $${valuation.highUsd!.toLocaleString("en-US")}`, text: `Midpoint $${valuation.midUsd!.toLocaleString("en-US")}. ${valuation.method} ${valuation.cautions.join(" ")}`, provenance: valuation.sources.map((s) => `Source: ${s}`).join(" · "), tone: "neutral" as const }
        : { label: "Indicated market value (Furlong)", value: "Cannot be produced for this address", text: `${valuation.method} ${valuation.cautions.join(" ")}`, provenance: "Stated limitation — Furlong does not publish a value it cannot source", tone: "caution" as const },
      // The divergence line is the single most decision-relevant output when a
      // real price exists: a buyer paying a real number outranks any model.
      valuation.divergence
        ? { label: "Market price vs. indicated value", value: `${valuation.divergence.knownPriceLabel} $${valuation.divergence.knownPriceUsd.toLocaleString("en-US")} · ${valuation.divergence.multipleOfMid}× the indication`, text: valuation.divergence.verdict, provenance: "Furlong reconciliation of the known market price against the indicated value", tone: "caution" as const }
        : null,
      record.bedrooms != null ? { label: "Bedrooms", value: String(record.bedrooms), text: "Bedroom count reported by the matched property record.", provenance: source, tone: "neutral" as const } : null,
      record.bathrooms != null ? { label: "Bathrooms", value: String(record.bathrooms), text: "Bathroom count reported by the matched listing record.", provenance: record.listingSourceName ? `Source: ${record.listingSourceName}` : source, tone: "neutral" as const } : null,
      record.squareFeet != null ? { label: "Building square feet", value: `${record.squareFeet.toLocaleString("en-US")} sq ft`, text: "Building area reported by the matched property record.", provenance: source, tone: "neutral" as const } : null,
      record.yearBuilt != null ? { label: "Year built", value: String(record.yearBuilt), text: "Construction year reported by the matched property record.", provenance: source, tone: "neutral" as const } : null,
      (record.rawPropertyStyle || record.propertyType) ? { label: "Property type", value: record.rawPropertyStyle || record.propertyType || "Property", text: record.recordBasis === "verified-address-only" ? "Property classification follows the selected discovery lane until a parcel or listing source supplies a more specific official style." : "Property style or land use reported by the matched property record.", provenance: source, tone: "neutral" as const } : null,
      record.listingAgent ? { label: "Listing contact", value: [record.listingAgent, record.listingBrokerage].filter(Boolean).join(" · "), text: [record.listingPhone, record.listingEmail].filter(Boolean).join(" · ") || "Contact details are available from the matched listing source.", provenance: record.listingSourceName ? `Source: ${record.listingSourceName}` : source, tone: "neutral" as const } : null,
    ].filter((fact): fact is NonNullable<typeof fact> => fact !== null);
  }, [props.propertyRecord]);
  // Lane-level market boards belong on the lane landing page, not inside a
  // parcel record. The property workspace contains parcel-specific evidence only.
  const facts = useMemo(() => {
    const filtered = rawFacts.filter((fact) => !/commodity prices|national commodity|corn .*soybeans|livestock prices|regional cash bid/i.test(`${fact.label} ${fact.value}`));
    const labels = new Set(filtered.map((fact) => fact.label.toLowerCase()));
    // Size-family dedupe: a deed/plat-based land fact from the intelligence
    // (e.g. "Land, lots, and tax-parcel profile") outranks the record's
    // GIS-geometry "Land area" — never show both (recorded plat governs).
    const SIZE_FAMILY = /\bsize\b|land area|acreage|land, lots|tax-parcel profile|parcel and conveyance/i;
    const intelligenceHasSize = filtered.some((fact) => SIZE_FAMILY.test(fact.label));
    return [
      ...recordFacts.filter((fact) => !labels.has(fact.label.toLowerCase()) && !(intelligenceHasSize && SIZE_FAMILY.test(fact.label))),
      ...filtered,
    ];
  }, [rawFacts, recordFacts]);
  const rawUnknowns = props.intelligence?.unknowns ?? [];
  // Unknown-record templates are retained in the intelligence model for an
  // authorized diligence workflow, but are not rendered as customer property facts.
  const unknowns = useMemo(() => suppressResolvedUnknowns(facts, rawUnknowns), [facts, rawUnknowns]);
  void unknowns;
  const hasPrice = !/not captured|unknown|enter|not provided|—/i.test(props.priceLabel);
  const ownerAssertions = [...(props.intelligence?.ownerAssertions ?? []), ...localOwnerAssertions];
  const deedEvidence = (props.deedEvidence ?? []).filter((record) => record.domain === "title");

  const categoryForFact = (label: string): CategoryTabId =>
    lane.categorizeFact?.(label) ?? defaultCategoryForFact(label);

  const factsByTab = useMemo(() => {
    const out: Record<string, typeof facts> = { property: [], utilities: [], environmental: [], education: [], misc: [] };
    for (const fact of facts) out[categoryForFact(fact.label)].push(fact);
    return out;

  }, [facts, lane]);

  const introFor = (id: TabId): string => lane.tabs.find((item) => item.id === id)?.intro ?? "";

  const shell = { background: "#FAF8F3", border: "1px solid #E5E0D5", borderRadius: 18, overflow: "hidden" } as const;
  const card = { background: "#fff", border: "1px solid #E5E0D5", borderRadius: 14, padding: "16px 18px" } as const;
  const renderFact = (fact: (typeof facts)[number]) => <article key={`${fact.label}-${fact.value}`} style={card}><span style={{ fontSize: 10, color: "#8A8F9C", fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase" }}>{fact.label}</span><strong style={{ display: "block", color: "#1C2B45", marginTop: 4, lineHeight: 1.4 }}>{fact.value}</strong><details><summary style={{ marginTop: 7, cursor: "pointer", color: "#8F6E1F", fontSize: 11.5 }}>Source and explanation</summary><p style={{ fontSize: 12, color: "#5A6172", lineHeight: 1.55 }}>{fact.text}</p><p style={{ fontSize: 10.5, color: "#8A8F9C" }}>{fact.provenance}</p></details></article>;
  const renderCategory = (id: CategoryTabId, title: string): ReactNode => <><header style={card}><h3 style={{ margin: 0, color: "#1C2B45", fontFamily: "Georgia,serif" }}>{title}</h3><p style={{ margin: "5px 0 0", color: "#5A6172", fontSize: 13 }}>{introFor(id)}</p></header>{factsByTab[id].length > 0 ? <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 10 }}>{factsByTab[id].map(renderFact)}</div> : <div style={card}>No verified information is currently available in this section.</div>}</>;

  return <section aria-label="Property command center" data-testid="property-command-center" data-consumer-lane={lane.consumerLaneLabel} style={shell}>
    <h1 style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0, 0, 0, 0)", whiteSpace: "nowrap", border: 0 }}>
      {props.title}
    </h1>
    <nav aria-label="Property workspace sections" style={{ position: "sticky", top: 0, zIndex: 4, background: "rgba(250,248,243,.97)", borderBottom: "1px solid #E5E0D5", padding: "10px 12px", display: "flex", gap: 7, overflowX: "auto", alignItems: "center" }}>
      <img src="/brand/furlong-emblem.png" alt="Furlong emblem" width={38} height={38} style={{ width: 38, height: 38, objectFit: "contain", flex: "none", marginRight: 4 }} />
      {lane.tabs.map((item) => <button key={item.id} type="button" onClick={() => setTab(item.id)} aria-current={tab === item.id ? "page" : undefined} style={{ border: 0, borderRadius: 9, padding: "9px 12px", whiteSpace: "nowrap", fontWeight: 750, cursor: "pointer", background: tab === item.id ? "#fff" : "transparent", color: tab === item.id ? "#1C2B45" : "#5A6172", boxShadow: tab === item.id ? "0 1px 4px rgba(28,43,69,.12)" : "none" }}>{item.label}</button>)}
    </nav>
    <div style={{ padding: 20, display: "grid", gap: 16 }}>
      {tab === "summary" && (() => {
        // A REAL summary (founder direction 2026-07-29: "why don't we have an
        // actual summary of the property here?") — the most decision-relevant
        // verified facts, in priority order, not a count line.
        const SUMMARY_PRIORITY = [/^size$/i, /^land area$/i, /asking price/i, /appraised total/i, /^property type$/i, /^county$/i, /flood zone/i, /soil survey/i, /^zoning$/i, /^land use$/i, /^sale status$/i, /wetlands/i, /^schools$/i, /broadband/i, /climate normals/i];
        const summaryFacts: typeof facts = [];
        for (const pattern of SUMMARY_PRIORITY) {
          const hit = facts.find((fact) => pattern.test(fact.label) && !summaryFacts.includes(fact));
          if (hit) summaryFacts.push(hit);
          if (summaryFacts.length >= 8) break;
        }
        const totalFacts = facts.length;
        return <>
        <article style={{ ...card, background: "linear-gradient(155deg,#20304E,#16233C)", color: "#fff", border: 0, display: "grid", gap: 9 }}><span style={{ color: "#CBA24A", fontSize: 10.5, fontWeight: 800, letterSpacing: ".16em", textTransform: "uppercase" }}>Property summary</span><h2 style={{ margin: 0, color: "#fff", fontFamily: "Georgia,serif", fontSize: 24 }}>{props.title}</h2><span style={{ color: "#AEB6C6", fontSize: 13 }}>{props.location} · {lane.consumerLaneLabel}</span><p style={{ margin: 0, lineHeight: 1.6, color: "#E6E9EF" }}>{props.headline}</p></article>
        {summaryFacts.length > 0 ? (
          <section style={{ ...card, display: "grid", gap: 10 }}>
            <strong style={{ color: "#1C2B45" }}>The property, in brief</strong>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: "8px 18px" }}>
              {summaryFacts.map((fact) => (
                <div key={fact.label} style={{ display: "grid", gap: 2, borderLeft: "3px solid #E5E0D5", paddingLeft: 10 }}>
                  <span style={{ fontSize: 10, color: "#8A8F9C", fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase" }}>{fact.label}</span>
                  <span style={{ color: "#1C2B45", fontSize: 13.5, fontWeight: 650, lineHeight: 1.45 }}>{fact.value}</span>
                </div>
              ))}
            </div>
            <p style={{ margin: 0, color: "#5A6172", lineHeight: 1.6, fontSize: 12.5 }}>
              {hasPrice ? `Price basis: ${props.priceLabel}. ` : "Price is not yet confirmed. "}
              {totalFacts} verified fact{totalFacts === 1 ? "" : "s"} in all — {factsByTab.property.length} property, {factsByTab.utilities.length} utility, {factsByTab.environmental.length} environmental, {factsByTab.education.length} education, {factsByTab.misc.length} other — each with its source and date in the tabs above.
            </p>
          </section>
        ) : (
          <section style={{ ...card, display: "grid", gap: 9 }}>
            <strong style={{ color: "#1C2B45" }}>The property, in brief</strong>
            <p style={{ margin: 0, color: "#5A6172", lineHeight: 1.6, fontSize: 13 }}>
              {props.factsPending
                ? "Public records for this property are still arriving — flood, parcel, soil, and program facts land here as each source answers. The summary fills in momentarily."
                : "No verified public records resolved for this entry yet. Facts appear here the moment a source answers; each carries its origin and date."}
            </p>
          </section>
        )}
        <section style={{ ...card, borderColor: "#D7B85A", background: "#FFF9E8", display: "grid", gap: 9 }}><strong style={{ color: "#1C2B45" }}>Something Furlong missed?</strong><form onSubmit={(event) => { event.preventDefault(); const value = ownerFeatureInput.trim(); if (!value) return; setLocalOwnerAssertions((current) => [...current, { label: value, value: "Owner reported — pending verification", text: "Customer-supplied property feature pending source verification.", provenance: "Owner assertion added in the property workspace", tone: "neutral" }]); setOwnerFeatureInput(""); }} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><input value={ownerFeatureInput} onChange={(event) => setOwnerFeatureInput(event.target.value)} placeholder="e.g. deeded pier, two parcels" aria-label="Property feature Furlong missed" style={{ flex: "1 1 260px", border: "1px solid #B08A2E", borderRadius: 9, padding: "10px 12px" }} /><button type="submit" style={{ border: 0, borderRadius: 9, padding: "10px 14px", background: "#1C2B45", color: "#fff", fontWeight: 800 }}>Add feature</button></form>{ownerAssertions.length > 0 && <div style={{ display: "grid", gap: 7 }}><strong style={{ color: "#1C2B45", fontSize: 12 }}>Owner-reported property features</strong>{ownerAssertions.map((fact) => <span key={`${fact.label}-${fact.value}`} style={{ color: "#5A6172", fontSize: 12 }}><strong>{fact.label}:</strong> {fact.value}</span>)}</div>}</section>
      </>;
      })()}
      {tab === "property" && renderCategory("property", "Property")}
      {tab === "agriculture" && <><header style={card}><h3 style={{ margin: 0, color: "#1C2B45", fontFamily: "Georgia,serif" }}>{lane.tabs.find((item) => item.id === "agriculture")?.label ?? "Agriculture"}</h3><p style={{ margin: "5px 0 0", color: "#5A6172", fontSize: 13 }}>{introFor("agriculture")}</p></header>{props.agricultureSlot ?? <div style={card}>The growing analysis for this ground is still assembling — soil, county yields, and market signals arrive with the property facts.</div>}</>}
      {tab === "utilities" && renderCategory("utilities", "Utilities")}
      {tab === "environmental" && renderCategory("environmental", "Environmental")}
      {tab === "education" && renderCategory("education", "Education")}
      {tab === "misc" && renderCategory("misc", "Miscellaneous and other")}
      {tab === "finance" && (() => {
        // Property-first ranking (founder premise 2026-08-05): when fit data
        // exists, excluded programs sink to the bottom and the rest order by
        // the property's own standalone-lendability score; the lane's static
        // priority is only the tiebreaker/fallback.
        const fit = props.financingFit ?? {};
        const ranked = [...props.financingLanes].sort((a, b) => {
          const fa = fit[a]; const fb = fit[b];
          const exA = fa?.excluded ? 1 : 0; const exB = fb?.excluded ? 1 : 0;
          if (exA !== exB) return exA - exB;
          const sA = fa?.score ?? null; const sB = fb?.score ?? null;
          if (sA != null || sB != null) {
            if ((sB ?? -0.5) !== (sA ?? -0.5)) return (sB ?? -0.5) - (sA ?? -0.5);
          }
          return lane.financingPriority(a) - lane.financingPriority(b);
        });
        const first = ranked[0] ?? null;
        const firstFit = first ? fit[first] : undefined;
        return <><header style={card}><h3 style={{ margin: 0, color: "#1C2B45", fontFamily: "Georgia,serif" }}>Finance</h3><p style={{ margin: "5px 0 0", color: "#5A6172", fontSize: 13 }}>{introFor("finance")}</p></header>{first && <section style={{ ...card, borderColor: "#B08A2E", background: "#FFF9E8", display: "grid", gap: 7 }}><span style={{ fontSize: 10, fontWeight: 850, letterSpacing: ".12em", textTransform: "uppercase", color: "#8F6E1F" }}>Best first path to test — ranked by this property&apos;s own numbers</span><strong style={{ color: "#1C2B45", fontSize: 17 }}>{first}</strong><span style={{ color: "#8F6E1F", fontWeight: 800 }}>{lane.financingRateLabel(first, props.financingRateContext ?? null)}</span>{firstFit?.line && <span style={{ color: "#3d4655", fontSize: 12.5, lineHeight: 1.55 }}>{firstFit.line}</span>}<span style={{ color: "#5A6172", fontSize: 12 }}>{lane.bestFirstPathNote(first)} This is a screening priority—not an eligibility or approval decision.</span>{props.financingRateContext?.fsaEffective && lane.id === "farm" && <span style={{ color: "#6B7280", fontSize: 10.8 }}>FSA rate effective {props.financingRateContext.fsaEffective}.</span>}</section>}{props.financeAnalysisSlot}{props.costsSlot ?? <div style={card}>Enter or confirm the property price to begin the payment and cash-to-close model.</div>}<section style={card}><h3 style={{ margin: 0, color: "#1C2B45", fontSize: 16 }}>Property financing programs</h3><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: 9, marginTop: 10 }}>{ranked.length ? ranked.map((item, index) => { const note = lane.financingProgramNote(item); const itemFit = fit[item]; const excluded = Boolean(itemFit?.excluded); return <article key={item} style={{ border: `1px solid ${excluded ? "#D9DEE7" : index === 0 ? "#B08A2E" : "#E5E0D5"}`, borderRadius: 10, padding: "12px 13px", background: excluded ? "#F7F8FA" : index === 0 ? "#FBF5E6" : "#fff", display: "grid", gap: 6, opacity: excluded ? 0.75 : 1 }}><strong style={{ color: "#1C2B45" }}>{index + 1}. {item}</strong>{excluded ? <span style={{ color: "#8A93A3", fontSize: 11.5, fontWeight: 800 }}>NOT A FIT FOR THIS PROPERTY — {itemFit?.excluded}</span> : <><span style={{ color: "#8F6E1F", fontSize: 11.5, fontWeight: 800 }}>{lane.financingRateLabel(item, props.financingRateContext ?? null)}</span>{itemFit?.line && <span style={{ color: "#3d4655", fontSize: 11.5, lineHeight: 1.55 }}>{itemFit.line}</span>}<span style={{ color: "#8F6E1F", fontSize: 11.5, fontWeight: 800 }}>{note.fit}</span><span style={{ color: "#5A6172", fontSize: 11.5 }}>{note.why}</span></>}<span style={{ color: "#6B7280", fontSize: 10.8 }}><b>What still controls:</b> {note.watch}</span></article>; }) : <span>No property-relevant program has been produced yet.</span>}</div></section></>;
      })()}
      {tab === "report" && <><header style={card}><h3 style={{ margin: 0, color: "#1C2B45", fontFamily: "Georgia,serif" }}>Report and pro forma</h3><p style={{ margin: "5px 0 0", color: "#5A6172", fontSize: 13 }}>{introFor("report")}</p></header>{props.actionsSlot && <section style={{ ...card, display: "grid", gap: 9, borderColor: "#C8D8EA", background: "#F7FAFD" }}>{props.actionsSlot}</section>}{props.proformaSlot && <section style={{ ...card, borderColor: "#B08A2E", background: "#FFFDF5", display: "grid", gap: 9 }}>{props.proformaSlot}</section>}<section style={{ ...card, borderColor: "#C8D8EA", background: "#F7FAFD", display: "grid", gap: 9 }}><h3 style={{ margin: 0, color: "#1C2B45", fontSize: 16 }}>Personalized pro forma</h3><p style={{ margin: 0, color: "#5A6172", fontSize: 12.5 }}>Continue when you want borrower-specific qualification, document review, and a finalized pro forma from the licensed Financial module.</p><a href="/explore?lane=financing-capital#lender-intake" style={{ justifySelf: "start", borderRadius: 9, padding: "10px 14px", background: "#1C2B45", color: "#fff", fontWeight: 800, textDecoration: "none" }}>Continue to personalized Financial module</a></section>{deedEvidence.length > 0 && <details style={card}><summary style={{ cursor: "pointer", fontWeight: 800, color: "#1C2B45" }}>Restricted deed evidence</summary><p style={{ color: "#5A6172", fontSize: 12 }}>Recorded deed evidence is available inside an authorized financial or lender workspace.</p></details>}</>}
    </div>
  </section>;
}
