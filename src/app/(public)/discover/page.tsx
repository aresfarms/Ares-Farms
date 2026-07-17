import type { Metadata } from "next";

import { Disclosures } from "@/components/public/Disclosures";
import { PropertyEvaluationWorkspace } from "@/components/property/PropertyEvaluationWorkspace";
import { PropertyPlaceIntelligence } from "@/components/property/PropertyPlaceIntelligence";
import { buildPropertyBriefIntelligence } from "@/lib/property/propertyBriefIntelligence";
import type { ChartVariant } from "@/lib/property/chartThemes";
import { resolveDiscoveryFlow, isPlaceFirstFlow } from "@/lib/discovery/discoveryFlow";

/**
 * /discover — the discovery front door. The journey is chosen UP FRONT by the
 * flow-state resolver (resolveDiscoveryFlow) BEFORE anything renders:
 *   - place-facts / opportunity-zone / property-discovery → ADDRESS-FIRST
 *     analysis workspace (location verification folded into analysis);
 *   - possibilities-persona (default) → the conversational persona interview.
 *
 * The generic persona intake is NEVER the default when the route/query/entrypoint
 * signals place/property facts. Browse is preserved. Public Alpha PENDING.
 *
 * Governance basis: Master Volume VI separates Property Discovery & Canonical
 * Property Governance from general customer/revenue intelligence.
 */

export const metadata: Metadata = {
  title: "What are your possibilities? | Furlong",
  description:
    "Start with a place or with what you're trying to accomplish. Verified place-facts up front; " +
    "possibilities mapped from your interests. Anonymous, no account, nothing sold.",
};

type SP = Record<string, string | string[] | undefined>;

function one(v: string | string[] | undefined): string | null {
  if (Array.isArray(v)) return v[0] ?? null;
  return v ?? null;
}

function propertyAnalysisContext(query: SP) {
  if (one(query.entry) !== "property-brief") return null;

  const title = one(query.title);
  const location = one(query.location);
  const propertyType = one(query.propertyType);
  const sourceLabel = one(query.sourceLabel);
  const priceLabel = one(query.priceLabel);
  const vintage = one(query.vintage);
  const exactAddress = one(query.exactAddress);
  const description = one(query.description);
  const listingUrl = one(query.listingUrl);
  const propertyId = one(query.propertyId);
  const sourceId = one(query.sourceId);
  const currentLabel = one(query.currentLabel);
  const categoryLabel = one(query.categoryLabel);
  const importScreeningStatus = one(query.importScreeningStatus) as "normal" | "reroute" | null;
  const importScreeningCategory = one(query.importScreeningCategory) as "standard-property" | "special-asset" | "restricted-asset" | null;
  const importScreeningSummary = one(query.importScreeningSummary);
  const salePosture = one(query.salePosture) as "listing-source-present" | "official-disposition-source" | "unverified-public-claim" | "not-for-sale-likely" | null;
  const manualReviewRequired = one(query.manualReviewRequired) === "true";
  const manualReviewSummary = one(query.manualReviewSummary);
  const sourceVerificationStatus = one(query.sourceVerificationStatus) as
    | "matched-approved-source-record"
    | "verified-address-only"
    | null;
  const matchedSourceRecordId = one(query.matchedSourceRecordId);
  const listingSourceCandidate = one(query.listingSourceCandidate);
  const listingSourceCandidateStatus = one(query.listingSourceCandidateStatus) as
    | "allowlisted-marketplace-source-detected"
    | "allowlisted-address-only"
    | "generic-quarantined"
    | null;
  const listingSourceGovernanceStatus = one(query.listingSourceGovernanceStatus) as
    | "live-fetch-blocked-by-governance"
    | "not-in-governed-source-stack"
    | null;
  const listingSourceMatchStatus = one(query.listingSourceMatchStatus) as
    | "approved-source-match-established"
    | "approved-source-match-not-yet-established"
    | null;
  const importScreeningReasons = (one(query.importScreeningReasons) ?? "")
    .split("||")
    .map((line) => line.trim())
    .filter(Boolean);
  const stateCode = one(query.state);
  const county = one(query.county);
  const town = one(query.town);
  const pathwayList = (one(query.pathways) ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (!title || !location || !propertyType || !sourceLabel || !priceLabel) return null;

  const initialMessage = importScreeningStatus === "reroute"
    ? `I want a high-level public-disposition review through Furlong.\n` +
      `Asset: ${title}.\n` +
      `Type: ${propertyType}.\n` +
      `Location: ${location}${exactAddress ? ` · ${exactAddress}` : ""}.\n` +
      `Source: ${sourceLabel}.\n` +
      `Sale posture: ${salePosture ?? "unknown"}.\n` +
      `${importScreeningCategory ? `Screening category: ${importScreeningCategory}.\n` : ""}` +
      `${importScreeningSummary ? `Screening summary: ${importScreeningSummary}.\n` : ""}` +
      `${manualReviewRequired ? `Manual review required: yes.\n` : ""}` +
      `${manualReviewSummary ? `Manual review summary: ${manualReviewSummary}.\n` : ""}` +
      `${importScreeningReasons.length > 0 ? `Screening reasons: ${importScreeningReasons.join(" ")}\n` : ""}` +
      `${description ? `Import context: ${description}.\n` : ""}` +
      `Please keep this in restricted special-asset posture: high-level feasibility, lawful reuse, governance boundaries, diligence, and public-disposition reality only.`
    : `I want to evaluate a specific property through Furlong.\n` +
      `Property: ${title}.\n` +
      `Type: ${propertyType}.\n` +
      `Location: ${location}${exactAddress ? ` · ${exactAddress}` : ""}.\n` +
      `Source: ${sourceLabel}.\n` +
      `Price: ${priceLabel}.\n` +
      `${categoryLabel ? `Category: ${categoryLabel}.\n` : ""}` +
      `${pathwayList.length > 0 ? `Priority pathways to test: ${pathwayList.join(", ")}.\n` : ""}` +
      `${description ? `Listing context: ${description}.\n` : ""}` +
      `Please evaluate how this property could work under the relevant USDA, SBA, or other applicable Furlong pathways using the governed criteria already built into the platform. Ask me one focused question at a time and build toward an advisory report.`;

  return {
    propertyId,
    title,
    location,
    propertyType,
    sourceLabel,
    sourceId,
    priceLabel,
    vintage,
    exactAddress,
    description,
    listingUrl,
    currentLabel,
    categoryLabel,
    pathwayList,
    importScreeningStatus,
    importScreeningCategory,
    importScreeningSummary,
    importScreeningReasons,
    salePosture,
    manualReviewRequired,
    manualReviewSummary,
    sourceVerificationStatus,
    matchedSourceRecordId,
    listingSourceCandidate,
    listingSourceCandidateStatus,
    listingSourceGovernanceStatus,
    listingSourceMatchStatus,
    stateCode,
    county,
    town,
    initialMessage,
  };
}

function addressFirstAnalysisContext(flow: ReturnType<typeof resolveDiscoveryFlow>) {
  if (!isPlaceFirstFlow(flow)) return null;

  const label =
    flow === "opportunity-zone"
      ? "Opportunity Zone analysis"
      : flow === "property-discovery"
        ? "Property discovery analysis"
        : "Place-facts analysis";

  return {
    propertyId: "imported:place-facts",
    title: label,
    location: "Bring in a verified address to begin analysis.",
    propertyType: "place-led property",
    sourceLabel: "Furlong verified address intake",
    sourceId: null,
    priceLabel: "Price not yet verified",
    vintage: null,
    exactAddress: null,
    description: "Address-first analysis shell for verified place-fact intake.",
    listingUrl: null,
    currentLabel: "Address-first analysis",
    categoryLabel: null,
    pathwayList: [],
    importScreeningStatus: "normal" as const,
    importScreeningCategory: "standard-property" as const,
    importScreeningSummary: null,
    importScreeningReasons: [],
    salePosture: null,
    manualReviewRequired: false,
    manualReviewSummary: null,
    sourceVerificationStatus: "verified-address-only" as const,
    matchedSourceRecordId: null,
    listingSourceCandidate: null,
    listingSourceCandidateStatus: null,
    listingSourceGovernanceStatus: null,
    listingSourceMatchStatus: null,
    stateCode: null,
    county: null,
    town: null,
    initialMessage:
      "Start with the verified address, confirm the place-based facts, and then carry that directly into the property analysis workspace.",
  };
}

/** Render the journey chosen by the resolver. Exported for the path entrypoints. */
export function DiscoverSurface({ route, query }: { route: string; query: SP }) {
  const flow = resolveDiscoveryFlow({ route, query });
  const propertyContext = propertyAnalysisContext(query);
  const addressFirstContext = addressFirstAnalysisContext(flow);
  const defaultPropertyContext = addressFirstAnalysisContext("property-discovery");
  const tierPreviewMode = process.env.FURLONG_TIER_PREVIEW_MODE !== "off";

  if (isPlaceFirstFlow(flow)) {
    return (
      <main style={{ display: "grid", gap: 28, padding: "40px 20px", maxWidth: 980, margin: "0 auto" }}>
        <PropertyEvaluationWorkspace
          context={addressFirstContext!}
          tierPreviewMode={tierPreviewMode}
          addressFirstFlow={flow}
        />
        <Disclosures />
      </main>
    );
  }

  // Free Place Brief intelligence (spec 2026-07-15): computed ONCE server-side
  // from frozen snapshots, then fed to BOTH the report engine (the report's
  // place-facts section — including explicit negatives with provenance) and
  // the standalone Place Intelligence cards below the workspace.
  // Chart Table audience lens: explicit ?lens= wins; commercial-shaped
  // property types default to the commercial chart; homes stay buyer.
  const lensParam = one(query.lens);
  const chartVariant: ChartVariant =
    lensParam === "environmental" || lensParam === "finance" || lensParam === "commercial" || lensParam === "buyer"
      ? lensParam
      : propertyContext && !/home|residential|house/i.test(propertyContext.propertyType)
        ? "commercial"
        : "buyer";
  // Imported/manual addresses have no canonical id, so the property-keyed
  // snapshot builder can only return an EMPTY brief with snapshot negatives —
  // which would then shadow the geocode-based brief the property-facts API
  // builds from the live checks (bug found 2026-07-16: rich verification,
  // empty chart). Skip it; the workspace falls back to the API's brief.
  const briefIntelligence = propertyContext && !propertyContext.propertyId?.startsWith("imported:")
    ? buildPropertyBriefIntelligence({
        propertyId: propertyContext.propertyId,
        sourceId: propertyContext.sourceId,
        propertyType: propertyContext.propertyType,
        priceLabel: propertyContext.priceLabel,
        county: propertyContext.county,
        town: propertyContext.town,
        stateCode: propertyContext.stateCode,
        pathwayList: propertyContext.pathwayList,
      })
    : null;

  return (
    <main style={{ display: "grid", gap: 28, padding: "40px 20px", maxWidth: 980, margin: "0 auto" }}>
      {propertyContext ? (
        <>
          {/* The Chart Table renders the full Place Brief (chart concept,
              founder-selected 2026-07-16) — no separate intelligence section. */}
          <PropertyEvaluationWorkspace
            context={propertyContext}
            tierPreviewMode={tierPreviewMode}
            placeIntelligence={briefIntelligence}
            chartVariant={chartVariant}
          />
        </>
      ) : (
        <PropertyEvaluationWorkspace
          context={defaultPropertyContext!}
          tierPreviewMode={tierPreviewMode}
          addressFirstFlow="property-discovery"
        />
      )}

      <Disclosures />
    </main>
  );
}

export default async function DiscoverPage({ searchParams }: { searchParams?: Promise<SP> }) {
  const query = searchParams ? await searchParams : {};
  return <DiscoverSurface route="/discover" query={query} />;
}
