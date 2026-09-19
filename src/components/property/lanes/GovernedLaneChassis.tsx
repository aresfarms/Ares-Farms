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
import { FurlongAnswerCard } from "@/components/property/FurlongAnswerCard";
import { PropertyComparison } from "@/components/property/PropertyComparison";
import { ProgressiveIntelligencePanel } from "@/components/property/ProgressiveIntelligencePanel";
import { propertyFurlongAnswer } from "@/lib/property/furlongAnswer";
import type { ChartTableBriefProps } from "@/components/property/ChartTableBrief";
import { CHART_THEMES } from "@/lib/property/chartThemes";
import type { OfficialPropertyEvidenceRecord } from "@/lib/property/propertyEvidenceIngestion";
import type { ProgramFit, FinancingCalculation } from "@/lib/property/financingProgramFit";
import type { MarketValueIndication } from "@/lib/property/marketValueIndication";

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
    assessmentAsOf?: string | null;
    parcelSourceUrl?: string | null;
    landUse?: string | null;
    zoning?: string | null;
    deedReference?: string | null;
    legalDescription?: string | null;
    assessedLandValue?: number | null;
    assessedImprovementValue?: number | null;
    assessedTotalValue?: number | null;
    propertyValueScreen?: MarketValueIndication | null;
    priceEvidence?: { status: string; reason: string; observedAt: string | null } | null;
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
  financingFit?: Record<string, ProgramFit>;
  /** Finance-tab analysis panel (commercial best-use income screen, lender-
      test scorecard) rendered between the best-first box and the cost model. */
  financeAnalysisSlot?: ReactNode;
};

type ChassisProps = LaneWorkspaceProps & { lane: LaneDefinition };

function FinancingCalculationDetails({ calculation: c }: { calculation: FinancingCalculation }) {
  const money = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
  return <div data-testid="financing-calculation-inputs" style={{ display: "grid", gap: 9, fontSize: 13, lineHeight: 1.6 }}>
    <strong>{c.dscr.toFixed(2)}× loan-payment coverage (DSCR)</strong>
    <span>{money(c.annualNoi)} annual net operating income ÷ {money(c.annualDebtService)} annual loan payments = {c.dscr.toFixed(2)}×.</span>
    <span>Net operating income means revenue minus operating expenses, before loan payments. The {c.comparisonTarget.toFixed(2)}× comparison target is illustrative—not an FSA requirement or loan approval.</span>
    <details>
      <summary style={{ cursor: "pointer", fontWeight: 800 }}>Show exactly where these numbers come from</summary>
      <dl style={{ display: "grid", gap: 9, marginBottom: 0 }}>
        <div><dt>Transaction price: {money(c.purchasePrice)}</dt><dd style={{ margin: 0 }}>{c.priceBasis}</dd></div>
        <div><dt>Loan amount: {money(c.loanAmount)}</dt><dd style={{ margin: 0 }}>{c.loanBasis}</dd></div>
        <div><dt>Annual net operating income: {money(c.annualNoi)}</dt><dd style={{ margin: 0 }}>{c.incomeBasis}</dd></div>
        <div><dt>Rate and payment assumptions: {c.ratePct.toFixed(2)}%, {c.termYears} years, monthly payments</dt><dd style={{ margin: 0 }}>{c.rateBasis}. Source effective date: {c.rateAsOf ?? "not supplied — currentness unverified"}. Term and payment frequency are assumptions until confirmed by the lender.</dd></div>
        <div><dt>Loan payments: {money(c.monthlyPayment)} per month × 12 = {money(c.annualDebtService)} per year</dt><dd style={{ margin: 0 }}>Fully amortizing principal and interest only. Monthly payment = loan × monthly rate ÷ [1 − (1 + monthly rate) raised to minus the number of payments]. At 0% interest, divide the loan by the number of payments. Calculations use unrounded amounts.</dd></div>
      </dl>
    </details>
    <span>Other loans, fees, taxes, insurance, household costs and cash needed at closing still require reconciliation. This is a comparison scenario, not a financing commitment.</span>
  </div>;
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
  const furlongAnswer = useMemo(() => propertyFurlongAnswer(props), [props]);
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
    const valuation = record.propertyValueScreen ?? null;
    return [
      record.exactAddress ? { label: "Verified address", value: record.exactAddress, text: "The entered property address resolved successfully through the public address-verification path.", provenance: source, tone: "neutral" as const } : null,
      place ? { label: "Property location", value: place, text: "Town, county, and state carried into the property record from the verified intake context.", provenance: source, tone: "neutral" as const } : null,
      record.price != null ? { label: "Asking price", value: `$${record.price.toLocaleString("en-US")}`, text: "Current seller asking price carried by the matched governed listing snapshot.", provenance: record.listingSourceName ? `Source: ${record.listingSourceName}${record.listingSourceAsOf ? ` · ${record.listingSourceAsOf}` : ""}` : source, tone: "neutral" as const } : null,
      record.priceEvidence?.status === "price-pending" ? { label: "Current asking price", value: "Price evidence pending", text: record.priceEvidence.reason + " Supply a current listing link, asking-price confirmation, verified contract or intended offer. No assessment is substituted.", provenance: record.priceEvidence.observedAt ? "Last source observation: " + record.priceEvidence.observedAt : "Current price not established", tone: "caution" as const } : null,
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
      record.zoning ? { label: "Zoning", value: record.zoning, text: /\d/.test(record.zoning) ? "Zoning code carried by the official parcel source; local zoning records remain controlling." : `“${record.zoning}” is the parcel source's generalized zoning classification, not this parcel's specific local district. A class like this maps to a whole family of districts — residential land, for example, can be R-1, R-2, or a rural/agricultural district, each with different permitted uses, setbacks, and density. Treat it as a category, not the answer: confirm the exact district with the county zoning office. Local zoning records remain controlling.`, provenance: source, tone: /\d/.test(record.zoning) ? "neutral" as const : "caution" as const } : null,
      record.deedReference ? { label: "Recorded deed reference", value: record.deedReference, text: record.legalDescription || "Deed book and page reference published with the parcel record.", provenance: source, tone: "neutral" as const } : null,
      record.assessedLandValue != null ? { label: "County-assessed land value", value: `$${record.assessedLandValue.toLocaleString("en-US")}`, text: "The land component of the county's estimated value for taxation. It is not a market appraisal and not a seller asking price — a lender's appraiser or the market may conclude differently.", provenance: source, tone: "neutral" as const } : null,
      record.assessedImprovementValue != null ? { label: "County-assessed improvement value", value: `$${record.assessedImprovementValue.toLocaleString("en-US")}`, text: "The building/improvement component of the county's estimated value for taxation — not a market appraisal.", provenance: source, tone: "neutral" as const } : null,
      record.assessedTotalValue != null ? { label: "County-assessed total value", value: `$${record.assessedTotalValue.toLocaleString("en-US")}`, text: `The county's total estimated value FOR TAXATION${record.parcelSourceAsOf ? ` as published by the source on ${record.parcelSourceAsOf}` : ", of a vintage this source does not publish"}. Read it as a tax figure and nothing else. Assessed values routinely sit far below — occasionally far above — what a property actually trades for, because many jurisdictions assess against a frozen base year and assessment timing differs from a negotiated transaction. It is not an appraisal, not a market-price opinion, and not Furlong's view of what this property is worth.`, provenance: source, tone: "caution" as const } : null,
      // FURLONG'S OWN INDICATED VALUE (founder direction 2026-08-06: "it must
      // publish that data, that is the entire point of that part of the
      // platform"). The assessed value must never stand as the only dollar
      // figure on the page — left alone it becomes, by default, the number a
      // reader takes away as what the property is worth.
      valuation
        ? valuation.status === "indicated"
          ? { label: "Furlong Value Screen", value: `$${valuation.lowUsd!.toLocaleString("en-US")} – $${valuation.highUsd!.toLocaleString("en-US")}`, text: `Midpoint $${valuation.midUsd!.toLocaleString("en-US")} · ${valuation.profileId} · ${valuation.confidence}. ${valuation.method} ${valuation.cautions.join(" ")}`, provenance: valuation.sources.map((sourceLine) => `Source: ${sourceLine}`).join(" · "), tone: "neutral" as const }
          : { label: "Furlong Value Screen", value: "Comparable evidence pending", text: `${valuation.method}${valuation.requiredInputs.length ? ` Needed next: ${valuation.requiredInputs.join("; ")}.` : ""} ${valuation.cautions.join(" ")}`, provenance: valuation.sources.length ? valuation.sources.map((sourceLine) => `Source: ${sourceLine}`).join(" · ") : "Stated limitation — Furlong does not publish a value when the valuation method lacks the evidence it requires", tone: "caution" as const }
        : null,
      // Divergence is evidence to reconcile. A closed/contract transaction is
      // stronger than an asking price; an asking price remains a seller signal.
      valuation?.divergence
        ? { label: "Known price vs. Furlong screen", value: `${valuation.divergence.knownPriceLabel} $${valuation.divergence.knownPriceUsd.toLocaleString("en-US")} · ${valuation.divergence.multipleOfMid}× the indication`, text: valuation.divergence.verdict, provenance: "Furlong reconciliation of known price evidence against the method-specific screening indication", tone: "caution" as const }
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
  const hasPrice = (props.propertyRecord?.price ?? 0) > 0 || /\$\s*[1-9][\d,]*(?:\.\d+)?/.test(props.priceLabel) && !/assess|estimate|starting bid|minimum bid|benchmark/i.test(props.priceLabel);
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
  const primaryTabIds: TabId[] = lane.id === "farm"
    ? ["summary", "property", "agriculture", "finance", "environmental", "report"]
    : ["summary", "property", "finance", "environmental", "report"];
  const primaryTabs = lane.tabs.filter((item) => primaryTabIds.includes(item.id));
  const secondaryTabs = lane.tabs.filter((item) => !primaryTabIds.includes(item.id));

  const shell = { background: "#FAF8F3", border: "1px solid #E5E0D5", borderRadius: 18, overflow: "hidden" } as const;
  const card = { background: "#fff", border: "1px solid #E5E0D5", borderRadius: 14, padding: "16px 18px" } as const;
  const renderFact = (fact: (typeof facts)[number]) => <article key={`${fact.label}-${fact.value}`} style={card}><span style={{ fontSize: 10, color: "#8A8F9C", fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase" }}>{fact.label}</span><strong style={{ display: "block", color: "#1C2B45", marginTop: 4, lineHeight: 1.4 }}>{fact.value}</strong><details><summary style={{ marginTop: 7, cursor: "pointer", color: "#8F6E1F", fontSize: 11.5 }}>Source and explanation</summary><p style={{ fontSize: 12, color: "#5A6172", lineHeight: 1.55 }}>{fact.text}</p><p style={{ fontSize: 10.5, color: "#8A8F9C" }}>{fact.provenance}</p></details></article>;
  const renderCategory = (id: CategoryTabId, title: string): ReactNode => <><header style={card}><h3 style={{ margin: 0, color: "#1C2B45", fontFamily: "Georgia,serif" }}>{title}</h3><p style={{ margin: "5px 0 0", color: "#5A6172", fontSize: 13 }}>{introFor(id)}</p></header>{factsByTab[id].length > 0 ? <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 10 }}>{factsByTab[id].map(renderFact)}</div> : <div style={card}>No verified information is currently available in this section.</div>}</>;

  return <section aria-label="Property command center" data-testid="property-command-center" data-consumer-lane={lane.consumerLaneLabel} style={shell}>
    <h1 style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0, 0, 0, 0)", whiteSpace: "nowrap", border: 0 }}>
      {props.title}
    </h1>
    <nav aria-label="Property workspace sections" style={{ position: "sticky", top: 0, zIndex: 4, background: "rgba(250,248,243,.97)", borderBottom: "1px solid #E5E0D5", padding: "10px 12px", display: "flex", gap: 7, overflowX: "auto", alignItems: "center" }}>
      <img src="/brand/furlong-portal-emblem.jpg" alt="Furlong emblem" width={38} height={38} style={{ width: 38, height: 38, objectFit: "contain", flex: "none", marginRight: 4 }} />
      {primaryTabs.map((item) => <button key={item.id} type="button" onClick={() => setTab(item.id)} aria-current={tab === item.id ? "page" : undefined} style={{ border: 0, borderRadius: 9, padding: "9px 12px", whiteSpace: "nowrap", fontWeight: 750, cursor: "pointer", background: tab === item.id ? "#fff" : "transparent", color: tab === item.id ? "#1C2B45" : "#5A6172", boxShadow: tab === item.id ? "0 1px 4px rgba(28,43,69,.12)" : "none" }}>{item.id === "summary" ? "Answer" : item.label}</button>)}
      {secondaryTabs.length > 0 && (
        <select
          aria-label="More property facts"
          value={secondaryTabs.some((item) => item.id === tab) ? tab : ""}
          onChange={(event) => {
            if (event.target.value) setTab(event.target.value as TabId);
          }}
          style={{ flex: "none", border: "1px solid #D7DEE8", borderRadius: 9, padding: "8px 10px", background: "#fff", color: "#1C2B45", fontWeight: 750 }}
        >
          <option value="">More facts</option>
          {secondaryTabs.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
        </select>
      )}
    </nav>
    <div style={{ padding: 20, display: "grid", gap: 16 }}>
      {tab === "summary" && (() => {
        const SUMMARY_PRIORITY = [/^land area$/i, /^size$/i, /asking price/i, /property estimate/i, /^property type$/i, /^zoning$/i, /^land use$/i, /flood zone/i];
        const summaryFacts: typeof facts = [];
        for (const pattern of SUMMARY_PRIORITY) {
          const hit = facts.find((fact) => pattern.test(fact.label) && !summaryFacts.includes(fact));
          if (hit) summaryFacts.push(hit);
          if (summaryFacts.length >= 4) break;
        }
        const rankedPrograms = [...props.financingLanes].sort((a, b) => {
          const fit = props.financingFit ?? {};
          const aFit = fit[a];
          const bFit = fit[b];
          if (Boolean(aFit?.excluded) !== Boolean(bFit?.excluded)) return aFit?.excluded ? 1 : -1;
          if ((bFit?.score ?? -0.5) !== (aFit?.score ?? -0.5)) return (bFit?.score ?? -0.5) - (aFit?.score ?? -0.5);
          return lane.financingPriority(a) - lane.financingPriority(b);
        });
        const leadProgram = rankedPrograms.find((name) => !props.financingFit?.[name]?.excluded && props.financingFit?.[name]?.calculation) ?? null;
        const leadCalculation = leadProgram ? props.financingFit?.[leadProgram]?.calculation : undefined;
        const farmScreen = props.intelligence?.farmBestUse ?? null;
        const currentUse = props.propertyRecord?.landUse ?? props.propertyRecord?.rawPropertyStyle ?? props.propertyType;
        const answer = lane.id === "farm"
          ? `The record identifies ${currentUse || "a farm or land property"}. ${farmScreen?.headline ?? "Agricultural suitability and profitability remain evidence-pending."}`
          : lane.id === "residential"
            ? `The available classification is residential. That classification does not establish the best use or rule out other uses; legal, physical, market and economic evidence must be evaluated.`
            : `The property should be evaluated first as ${currentUse || "commercial real estate"}. The strongest business use remains provisional until permitted use, demand, building condition, operating income, and acquisition price are verified.`;
        const status = props.factsPending
          ? "Still gathering evidence"
          : lane.id === "farm" && farmScreen?.evidenceStatus === "supported-screen"
            ? "Agricultural screen supported"
            : lane.id === "farm" && farmScreen?.evidenceStatus === "screening"
              ? "Agricultural evidence pending"
              : "Preliminary — key evidence remains";
        const materialRisk = factsByTab.environmental.find((fact) => fact.tone === "caution") ?? null;
        const environmentalIndication = materialRisk
          ? `${materialRisk.label}: ${materialRisk.value}`
          : factsByTab.environmental.length > 0
            ? "Only the listed source checks have been completed; missing checks and parcel-wide environmental conditions remain unresolved"
            : "Environmental screen not yet resolved";
        const nextNeeded = !hasPrice
          ? "Enter the asking price or intended offer. Without it, Furlong cannot compare returns, debt service, cash to close, or transaction economics."
          : lane.id === "farm" && farmScreen?.missingCriticalInputs.length
            ? `The agricultural comparison needs ${farmScreen.missingCriticalInputs.join(" and ")} before it is dependable.`
            : props.pauseLine || "Confirm condition, legal use, market demand, and the operating assumptions before relying on the result.";
        const totalFacts = facts.length;
        return <>
          <FurlongAnswerCard answer={furlongAnswer} allowSave />
          <ProgressiveIntelligencePanel
            answer={furlongAnswer}
            discoveredFacts={facts.length}
            unresolvedCount={unknowns.length}
            ownerAssertionsCount={ownerAssertions.length}
            onOpenEvidence={() => setTab("property")}
            onOpenFinance={() => setTab("finance")}
            onOpenReport={() => setTab("report")}
          />
          <PropertyComparison answer={furlongAnswer} />
          <details><summary style={{ cursor: "pointer", padding: 12 }}>Detailed property and financing screen</summary>
          <article data-testid="customer-decision-summary" style={{ background: "linear-gradient(145deg,#10243B,#173A43)", color: "#fff", borderRadius: 16, padding: "clamp(20px,4vw,30px)", display: "grid", gap: 18, boxShadow: "0 12px 30px rgba(16,36,59,.16)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14, flexWrap: "wrap" }}>
              <div style={{ display: "grid", gap: 6, maxWidth: 760 }}>
                <span style={{ color: "#D7B85A", fontSize: 11, fontWeight: 850, letterSpacing: ".16em", textTransform: "uppercase" }}>Detailed supporting screen</span>
                <h2 style={{ margin: 0, color: "#fff", fontFamily: "Georgia,serif", fontSize: "clamp(23px,4vw,34px)", lineHeight: 1.12 }}>What does the current record support?</h2>
              </div>
              <span style={{ border: "1px solid rgba(215,184,90,.55)", borderRadius: 999, padding: "7px 11px", color: "#F3D98D", background: "rgba(215,184,90,.08)", fontSize: 12, fontWeight: 750 }}>{status}</span>
            </div>
            <p style={{ margin: 0, color: "#F3F6F8", fontSize: 17, lineHeight: 1.65, maxWidth: 900 }}>{answer}</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 12 }}>
              <div style={{ border: "1px solid rgba(255,255,255,.16)", borderRadius: 12, padding: 14, background: "rgba(255,255,255,.045)" }}>
                <span style={{ display: "block", color: "#AFC7CD", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".1em" }}>What it is</span>
                <strong style={{ display: "block", marginTop: 6, color: "#fff", fontSize: 18, lineHeight: 1.4 }}>{currentUse || lane.consumerLaneLabel}</strong>
                {lane.id === "farm" && farmScreen && <span style={{ display: "block", marginTop: 7, color: "#C9D9DD", fontSize: 12.5, lineHeight: 1.5 }}>{farmScreen.evidenceStatus === "supported-screen" ? `Supported agricultural leader: ${farmScreen.options[0]?.name ?? "not yet established"}.` : "Agricultural enterprise ranking and profitability remain evidence-pending; no leading use is established."} Property-wide use remains a preliminary comparison until legal and physical feasibility is confirmed.</span>}
              </div>
              <div style={{ border: "1px solid rgba(255,255,255,.16)", borderRadius: 12, padding: 14, background: "rgba(255,255,255,.045)" }}>
                <span style={{ display: "block", color: "#AFC7CD", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".1em" }}>Environmental indication</span>
                <strong style={{ display: "block", marginTop: 6, color: "#fff", lineHeight: 1.45 }}>{environmentalIndication}</strong>
              </div>
              <div style={{ gridColumn: "1 / -1", border: "1px solid rgba(215,184,90,.55)", borderRadius: 12, padding: "16px 18px", background: "rgba(215,184,90,.08)", display: "grid", gap: 11 }}>
                <span style={{ color: "#F3D98D", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".1em" }}>Can this property cover loan payments?</span>
                <strong style={{ color: "#fff", fontSize: 18, lineHeight: 1.4 }}>{leadCalculation ? "Illustrative payment comparison" : "We cannot calculate loan coverage yet"}</strong>
                {leadCalculation ? <>
                  <span>{leadProgram}</span>
                  <FinancingCalculationDetails calculation={leadCalculation} />
                </> : <div data-testid="financing-evidence-pending" style={{ color: "#C9D9DD", fontSize: 13, lineHeight: 1.65 }}>
                  <p style={{ margin: "0 0 8px" }}>No loan program is being recommended. We need:</p>
                  <ul style={{ margin: 0, paddingLeft: 20 }}>
                    <li>A purchase price or intended offer{hasPrice ? " — supplied; its source and terms still need review" : " — not available"}.</li>
                    <li>Annual revenue and itemized operating costs supported by records or a documented property-specific budget.</li>
                    <li>The loan amount, interest rate, repayment term, payment schedule and any other debt.</li>
                  </ul>
                  <p style={{ margin: "8px 0 0" }}>The tax assessment is not the purchase price. Acreage and generic crop budgets do not establish this farm’s income. See Finance for loan options and their requirements.</p>
                </div>}

              </div>
            </div>
          </article>
          </details>
          <section style={{ ...card, borderColor: "#D7B85A", background: "#FFF9E8", display: "grid", gap: 8 }}>
            <span style={{ color: "#8F6E1F", fontSize: 10.5, fontWeight: 850, letterSpacing: ".12em", textTransform: "uppercase" }}>What Furlong needs next</span>
            <strong style={{ color: "#1C2B45", fontSize: 16, lineHeight: 1.5 }}>{nextNeeded}</strong>
          </section>
          {summaryFacts.length > 0 ? (
            <section style={{ ...card, display: "grid", gap: 11 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline", flexWrap: "wrap" }}>
                <strong style={{ color: "#1C2B45" }}>The four facts that matter first</strong>
                <span style={{ color: "#6B7280", fontSize: 11.5 }}>{totalFacts} sourced facts available in the detailed sections</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: "9px 16px" }}>
                {summaryFacts.map((fact) => (
                  <div key={fact.label} style={{ display: "grid", gap: 3, borderLeft: "3px solid #D7B85A", paddingLeft: 10 }}>
                    <span style={{ fontSize: 10, color: "#7B8190", fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase" }}>{fact.label}</span>
                    <span style={{ color: "#1C2B45", fontSize: 13.5, fontWeight: 700, lineHeight: 1.45 }}>{fact.value}</span>
                  </div>
                ))}
              </div>
            </section>
          ) : (
            <section style={{ ...card, display: "grid", gap: 8 }}><strong style={{ color: "#1C2B45" }}>Verified facts are still arriving</strong><p style={{ margin: 0, color: "#5A6172", lineHeight: 1.6, fontSize: 13 }}>{props.factsPending ? "Furlong is checking parcel, flood, soil, program, and utility sources now." : "No governed public record resolved for this entry yet, so the answer remains intentionally limited."}</p></section>
          )}
          <section style={{ ...card, display: "grid", gap: 10 }}>
            <strong style={{ color: "#1C2B45" }}>Why use Furlong for this decision?</strong>
            <p style={{ margin: 0, color: "#5A6172", lineHeight: 1.65, fontSize: 13.5 }}>Most property sites show a listing, a valuation, or a loan product in isolation. Furlong tests the property, plausible uses, financing fit, and material environmental constraints together—and shows the source and date behind each conclusion.</p>
            <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
              <button type="button" onClick={() => setTab("property")} style={{ border: "1px solid #C9D4E1", borderRadius: 9, padding: "9px 12px", background: "#fff", color: "#1C2B45", fontWeight: 750, cursor: "pointer" }}>Review property evidence</button>
              <button type="button" onClick={() => setTab("finance")} style={{ border: 0, borderRadius: 9, padding: "9px 12px", background: "#1C2B45", color: "#fff", fontWeight: 800, cursor: "pointer" }}>See financing analysis</button>
            </div>
          </section>
          <details style={{ ...card, background: "#FFFDF7" }}>
            <summary style={{ cursor: "pointer", fontWeight: 800, color: "#1C2B45" }}>Something Furlong missed? Correct or add a property fact</summary>
            <form onSubmit={(event) => { event.preventDefault(); const value = ownerFeatureInput.trim(); if (!value) return; setLocalOwnerAssertions((current) => [...current, { label: value, value: "Owner reported — pending verification", text: "Customer-supplied property feature pending source verification.", provenance: "Owner assertion added in the property workspace", tone: "neutral" }]); setOwnerFeatureInput(""); }} style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}><input value={ownerFeatureInput} onChange={(event) => setOwnerFeatureInput(event.target.value)} placeholder="e.g. deeded pier, two parcels" aria-label="Property feature Furlong missed" style={{ flex: "1 1 260px", border: "1px solid #B08A2E", borderRadius: 9, padding: "10px 12px" }} /><button type="submit" style={{ border: 0, borderRadius: 9, padding: "10px 14px", background: "#1C2B45", color: "#fff", fontWeight: 800 }}>Add feature</button></form>
            {ownerAssertions.length > 0 && <div style={{ display: "grid", gap: 7, marginTop: 10 }}><strong style={{ color: "#1C2B45", fontSize: 12 }}>Owner-reported property features</strong>{ownerAssertions.map((fact) => <span key={`${fact.label}-${fact.value}`} style={{ color: "#5A6172", fontSize: 12 }}><strong>{fact.label}:</strong> {fact.value}</span>)}</div>}
          </details>
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
        const first = ranked.find((name) => !fit[name]?.excluded && fit[name]?.calculation) ?? null;
        const firstFit = first ? fit[first] : undefined;
        return <><header style={card}><h3 style={{ margin: 0, color: "#1C2B45", fontFamily: "Georgia,serif" }}>Finance</h3><p style={{ margin: "5px 0 0", color: "#5A6172", fontSize: 13 }}>{introFor("finance")}</p></header>{first && <section style={{ ...card, borderColor: "#B08A2E", background: "#FFF9E8", display: "grid", gap: 7 }}><span style={{ fontSize: 10, fontWeight: 850, letterSpacing: ".12em", textTransform: "uppercase", color: "#8F6E1F" }}>Illustrative loan-payment comparison — not a program recommendation</span><strong style={{ color: "#1C2B45", fontSize: 17 }}>{first}</strong><span style={{ color: "#8F6E1F", fontWeight: 800 }}>{lane.financingRateLabel(first, props.financingRateContext ?? null)}</span>{firstFit?.calculation && <FinancingCalculationDetails calculation={firstFit.calculation} />}<span style={{ color: "#5A6172", fontSize: 12 }}>This compares the supplied financial scenario only. Program eligibility and borrower underwriting have not been established.</span>{props.financingRateContext?.fsaEffective && lane.id === "farm" && <span style={{ color: "#6B7280", fontSize: 10.8 }}>FSA rate effective {props.financingRateContext.fsaEffective}.</span>}</section>}{!first && <section data-testid="finance-no-recommendation" style={card}><strong>No financing recommendation or loan-coverage result yet.</strong><p>We need a transaction price, supported revenue and operating costs, and the proposed loan terms. The options below are a reference list, not a ranking or approval.</p></section>}{props.financeAnalysisSlot}{props.costsSlot ?? <div style={card}>Enter or confirm the property price to begin the payment and cash-to-close model.</div>}<section style={card}><h3 style={{ margin: 0, color: "#1C2B45", fontSize: 16 }}>Loan options to investigate—not approvals</h3><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: 9, marginTop: 10 }}>{ranked.length ? ranked.map((item) => { const note = lane.financingProgramNote(item); const itemFit = fit[item]; const excluded = Boolean(itemFit?.excluded); return <article key={item} style={{ border: `1px solid ${excluded ? "#D9DEE7" : item === first ? "#B08A2E" : "#E5E0D5"}`, borderRadius: 10, padding: "12px 13px", background: excluded ? "#F7F8FA" : item === first ? "#FBF5E6" : "#fff", display: "grid", gap: 6, opacity: excluded ? 0.75 : 1 }}><strong style={{ color: "#1C2B45" }}>{item}</strong>{excluded ? <span style={{ color: "#8A93A3", fontSize: 11.5, fontWeight: 800 }}>REQUIREMENT NOT MET OR NOT CONFIRMED — {itemFit?.excluded}</span> : <><span style={{ color: "#8F6E1F", fontSize: 11.5, fontWeight: 800 }}>{lane.financingRateLabel(item, props.financingRateContext ?? null)}</span>{itemFit?.line && <span style={{ color: "#3d4655", fontSize: 11.5, lineHeight: 1.55 }}>{itemFit.line}</span>}<span style={{ color: "#8F6E1F", fontSize: 11.5, fontWeight: 800 }}>{note.fit}</span><span style={{ color: "#5A6172", fontSize: 11.5 }}>{note.why}</span></>}<span style={{ color: "#6B7280", fontSize: 10.8 }}><b>What still controls:</b> {note.watch}</span></article>; }) : <span>No property-relevant program has been produced yet.</span>}</div></section></>;
      })()}
      {tab === "report" && <><header style={card}><h3 style={{ margin: 0, color: "#1C2B45", fontFamily: "Georgia,serif" }}>Report and pro forma</h3><p style={{ margin: "5px 0 0", color: "#5A6172", fontSize: 13 }}>{introFor("report")}</p></header>{props.actionsSlot && <section style={{ ...card, display: "grid", gap: 9, borderColor: "#C8D8EA", background: "#F7FAFD" }}>{props.actionsSlot}</section>}{props.proformaSlot && <section style={{ ...card, borderColor: "#B08A2E", background: "#FFFDF5", display: "grid", gap: 9 }}>{props.proformaSlot}</section>}<section style={{ ...card, borderColor: "#C8D8EA", background: "#F7FAFD", display: "grid", gap: 9 }}><h3 style={{ margin: 0, color: "#1C2B45", fontSize: 16 }}>Personalized pro forma</h3><p style={{ margin: 0, color: "#5A6172", fontSize: 12.5 }}>Continue when you want borrower-specific qualification, document review, and a finalized pro forma from the licensed Financial module.</p><a href="/explore?lane=financing-capital#lender-intake" style={{ justifySelf: "start", borderRadius: 9, padding: "10px 14px", background: "#1C2B45", color: "#fff", fontWeight: 800, textDecoration: "none" }}>Continue to personalized Financial module</a></section>{deedEvidence.length > 0 && <details style={card}><summary style={{ cursor: "pointer", fontWeight: 800, color: "#1C2B45" }}>Restricted deed evidence</summary><p style={{ color: "#5A6172", fontSize: 12 }}>Recorded deed evidence is available inside an authorized financial or lender workspace.</p></details>}</>}
    </div>
  </section>;
}
