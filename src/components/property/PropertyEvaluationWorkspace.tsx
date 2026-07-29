"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  FurlongNavigator,
  type NavigatorSnapshot,
} from "@/components/navigator/FurlongNavigator";
import { PlaceFirstDiscovery } from "@/components/discovery/PlaceFirstDiscovery";
import { SavedDraftsRail } from "@/components/property/SavedDraftsRail";
import { BoundEditionReserve } from "@/components/property/BoundEditionReserve";
import { PropertyImportLaunchpadEmbedded } from "@/components/property/PropertyImportLaunchpad";
import type { SimilarHomeLine } from "@/components/property/ChartTableBrief";
import { FarmLaneWorkspace } from "@/components/property/lanes/FarmLaneWorkspace";
import { FarmAgricultureTab } from "@/components/property/lanes/FarmAgricultureTab";
import { ReportRecordToken } from "@/components/property/ReportRecordToken";
import { CommercialLaneWorkspace } from "@/components/property/lanes/CommercialLaneWorkspace";
import { ResidentialLaneWorkspace } from "@/components/property/lanes/ResidentialLaneWorkspace";
import { OwnershipCostPanel } from "@/components/property/OwnershipCostPanel";
import { buildPreliminaryCapitalPlan } from "@/lib/intelligence/preliminaryCapitalPlan";
import { buildCollateralEquityPlan } from "@/lib/intelligence/collateralEquityPlan";
import { buildMarketComparablePlan } from "@/lib/intelligence/marketComparablePlan";
import { buildScenarioRankingPlan } from "@/lib/intelligence/scenarioRankingPlan";
import { buildTransactionTimelinePlan } from "@/lib/intelligence/transactionTimelinePlan";
import { buildFinancialCapacityPlan } from "@/lib/intelligence/financialCapacityPlan";
import { buildExecutableScenarioRankingPlan } from "@/lib/intelligence/executableScenarioRankingPlan";
import { buildDecisionSynthesisPlan } from "@/lib/intelligence/decisionSynthesisPlan";
import { buildRecommendationEvidenceLedger } from "@/lib/intelligence/recommendationEvidenceLedger";
import { buildHumanDecisionAssignmentPlan } from "@/lib/intelligence/humanDecisionAssignmentPlan";
import { buildDecisionResolutionPlan } from "@/lib/intelligence/decisionResolutionPlan";
import { buildRecommendationFinalityPlan } from "@/lib/intelligence/recommendationFinalityPlan";
import { buildRecommendationReleaseRecord, type RecommendationReleaseRecord } from "@/lib/intelligence/recommendationReleaseRecord";
import { buildRecommendationReleaseChangeControl } from "@/lib/intelligence/recommendationReleaseChangeControl";
import { buildRecommendationReleaseHistory, type RecommendationReleaseAuditEntry, type RecommendationReleaseHistory } from "@/lib/intelligence/recommendationReleaseHistory";
import { buildPropertyAnalysisHref } from "@/lib/property/propertyAnalysisHref";
import { optimizeAgriculturalOpportunities } from "@/lib/property/agriculturalOpportunityOptimizer";
import { CHART_THEMES, type ChartVariant } from "@/lib/property/chartThemes";
import { buildEquityOutlook, buildOwnershipCostModel, buildPostSaleTaxScenario, buildPriceContext, type OwnershipCostContext } from "@/lib/property/ownershipCostModel";
import { buildRealEstateCompensationTransparency, emptyRealEstateCompensationInput } from "@/lib/property/realEstateCompensationTransparency";
import { buildInfrastructureRiskFromEvidence, ingestPropertyEvidence, ingestStructuredPropertyEvidence, mergeWithDefaultPropertyEvidence, structuredTaxRecord } from "@/lib/property/propertyEvidenceIngestion";
import { buildPropertyEvidenceManifest } from "@/lib/property/propertyEvidenceManifest";
import type { ExtendedPropertyRiskEvidence } from "@/lib/property/propertyRiskEvidence";
import type { OfficialPropertyEvidenceRecord } from "@/lib/property/propertyEvidenceIngestion";
import {
  allProfiles,
  classifyPropertyProfile,
  profileById,
  profileUsesResidentialLanes,
  type PropertyProfileId,
} from "@/lib/property/propertyProfile";
import type { DiscoveryFlow } from "@/lib/discovery/discoveryFlow";
import type { PropertyBriefIntelligence } from "@/lib/property/propertyBriefIntelligence";
import { reportTierIdentity, type ReportTierIdentity } from "@/lib/reports/reportTierIdentity";
import { evaluateFinancingPathways } from "@/lib/financing/pathwayEngine";
import {
  programsForAsset,
  type FinancingProgram,
} from "@/lib/navigator/financing/financingNodeContract";
import type { AssetClass } from "@/lib/navigator/universalIntentClassifier";
import {
  loadPropertyEvaluationDraft,
  savePropertyEvaluationDraft,
} from "@/lib/property/propertyEvaluationDraft";
import { consumePropertyFactsPrefetch } from "@/lib/property/propertyFactsPrefetch";
import { assessBorrowerReadiness } from "@/lib/readiness/readinessAssessment";
import {
  buildReportBranding,
  formatExplorationPath,
} from "@/lib/reports/reportBranding";
import { reportPolicy } from "@/lib/reports/reportPolicy";

type PropertyContext = {
  propertyId: string | null;
  title: string;
  location: string;
  propertyType: string;
  sourceLabel: string;
  sourceId: string | null;
  priceLabel: string;
  vintage: string | null;
  exactAddress: string | null;
  description: string | null;
  listingUrl: string | null;
  currentLabel: string | null;
  categoryLabel: string | null;
  pathwayList: string[];
  importScreeningStatus: "normal" | "reroute" | null;
  importScreeningCategory: "standard-property" | "special-asset" | "restricted-asset" | null;
  importScreeningSummary: string | null;
  importScreeningReasons: string[];
  salePosture: "listing-source-present" | "official-disposition-source" | "unverified-public-claim" | "not-for-sale-likely" | null;
  manualReviewRequired: boolean;
  manualReviewSummary: string | null;
  sourceVerificationStatus: "matched-approved-source-record" | "verified-address-only" | null;
  matchedSourceRecordId: string | null;
  listingSourceCandidate: string | null;
  listingSourceCandidateStatus:
    | "allowlisted-marketplace-source-detected"
    | "allowlisted-address-only"
    | "generic-quarantined"
    | null;
  listingSourceGovernanceStatus:
    | "live-fetch-blocked-by-governance"
    | "not-in-governed-source-stack"
    | null;
  listingSourceMatchStatus:
    | "approved-source-match-established"
    | "approved-source-match-not-yet-established"
    | null;
  stateCode: string | null;
  county: string | null;
  town: string | null;
  initialMessage: string;
};

type PropertyFactsResponse = {
  ok: boolean;
  propertyRecord?: {
    exactAddress: string | null;
    zip: string | null;
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
  verifiedPrograms?: Array<{
    program_id: string;
    name: string;
    administering_body: string;
    verifiedStatement: string;
    basis: string;
    whyItMatters?: string;
    personSideCaveat: string;
    source_citation: string;
    asOf: string;
  }>;
  placeFacts?: {
    opportunityZone?: { tractId: string; rural: boolean; asOf: string } | null;
    hubzone?: {
      hubzoneType: string;
      geoid: string;
      effective: string;
      expiration: string | null;
      isCurrent: boolean;
      asOf: string;
    } | null;
    flood?: { floodZone: string; asOf: string } | null;
    historic?: { historicName: string | null; asOf: string } | null;
    nmtc?: { tractId: string; asOf: string } | null;
  };
  verification?: {
    status: "verified" | "partial" | "blocked" | "unverifiable";
    normalizedAddress: string | null;
    parsedAddress: {
      street: string;
      city: string;
      state: string;
      zip: string;
    } | null;
    restrictions: string[];
    warnings: string[];
    liveChecks: {
      opportunityZoneActivated: boolean;
      nmtcActivated: boolean;
      hubzoneActivated: boolean;
      floodActivated: boolean;
      historicActivated: boolean;
    };
  };
  /** Living-here Place Brief for manually typed addresses (geocode-derived). */
  placeIntelligence?: PropertyBriefIntelligence | null;
  propertyEvidenceRecords?: OfficialPropertyEvidenceRecord[];
};

type SpecialBuildingReviewResponse = {
  ok: boolean;
  queueItemId?: string;
  traceId?: string;
  message?: string;
  error?: string;
};

type DraftAnswers = {
  reportTier: "free" | "paid" | "environmental";
  possibility: string;
  usePlan: string;
  capitalPlan: string;
  timing: string;
  requestedAmount: string;
  operatorExperience: string;
  revenueModel: string;
  renovationScope: string;
  ownershipPosture: string;
  documents: string[];
};

type ReportTier = DraftAnswers["reportTier"];

type TierAccessState = {
  unlocked: boolean;
  badge: string;
  detail: string;
};

type TierAccessMap = Record<ReportTier, TierAccessState>;

const REPORT_TIER_OPTIONS: Array<{
  id: ReportTier;
  label: string;
  shortLabel: string;
  description: string;
}> = [
  {
    id: "free",
    label: reportPolicy.free.name,
    shortLabel: "Free tier",
    description: reportPolicy.free.description,
  },
  {
    id: "paid",
    label: reportPolicy.paid.name,
    shortLabel: "Institution tier",
    description: reportPolicy.paid.description,
  },
  {
    id: "environmental",
    label: reportPolicy.environmental.name,
    shortLabel: "Environmental tier",
    description: reportPolicy.environmental.description,
  },
];

const DOCUMENT_OPTIONS = [
  "Business plan",
  "Property financials",
  "Tax returns",
  "Purchase estimate",
  "Operating budget",
  "Entity documents",
];

function tierMeta(tier: ReportTier) {
  return REPORT_TIER_OPTIONS.find((option) => option.id === tier) ?? REPORT_TIER_OPTIONS[0];
}

function buildTierAccessMap(previewMode: boolean): TierAccessMap {
  return {
    free: {
      unlocked: true,
      badge: "Included",
      detail: "Baseline readiness stays visible and exportable.",
    },
    paid: previewMode
      ? {
          unlocked: true,
          badge: "Testing unlock",
          detail: "Institutional coordination content is visible during testing and can be re-locked later by flipping one flag.",
        }
      : {
          unlocked: false,
          badge: "Locked",
          detail: "Institutional coordination content is framework-ready but hidden until the premium access switch is turned on.",
        },
    environmental: previewMode
      ? {
          unlocked: true,
          badge: "Testing unlock",
          detail: "Environmental readiness content is visible during testing and can be re-locked later by flipping one flag.",
        }
      : {
          unlocked: false,
          badge: "Locked",
          detail: "Environmental documentation readiness is framework-ready but hidden until the premium access switch is turned on.",
        },
  };
}

function lowerList(values: string[]): string[] {
  return values.map((value) => value.toLowerCase());
}

function inferredFarmTypes(propertyType: string, categoryLabel: string | null, possibility: string): string[] {
  const joined = `${propertyType} ${categoryLabel ?? ""} ${possibility}`.toLowerCase();
  if (/(farm|land|ranch|acre)/.test(joined)) return ["farm operation"];
  if (/(hospitality|inn|tourism|retreat)/.test(joined)) return ["agritourism"];
  if (/(business|commercial|retail)/.test(joined)) return ["rural business"];
  return ["mixed-use property"];
}

function inferredGoals(pathways: string[], possibility: string, usePlan: string): string[] {
  const joined = `${possibility} ${usePlan}`.toLowerCase();
  const goals = new Set<string>();
  if (pathways.some((pathway) => /usda/i.test(pathway)) || /(farm|ag|crop|livestock|rural)/.test(joined)) {
    goals.add("land acquisition");
    goals.add("production support");
  }
  if (pathways.some((pathway) => /sba/i.test(pathway)) || /(business|commercial|hospitality|operations)/.test(joined)) {
    goals.add("business expansion");
    goals.add("site improvement");
  }
  if (/(tourism|retreat|event|lodging)/.test(joined)) goals.add("marketing support");
  if (goals.size === 0) goals.add("site improvement");
  return Array.from(goals);
}

function requestedAmountFrom(value: string): number | null {
  const digits = value.replace(/[^0-9.]/g, "");
  const amount = Number(digits);
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

function latestGuideQuestion(turns: NavigatorSnapshot["turns"]): string | null {
  for (let index = turns.length - 1; index >= 0; index -= 1) {
    const turn = turns[index];
    if (turn.role === "guide") return turn.text;
  }
  return null;
}

function firstUserAnswer(turns: NavigatorSnapshot["turns"]): string | null {
  for (const turn of turns) {
    if (turn.role === "you") return turn.text;
  }
  return null;
}

function userTurns(turns: NavigatorSnapshot["turns"]): string[] {
  return turns.filter((turn) => turn.role === "you").map((turn) => turn.text.trim()).filter(Boolean);
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function sentence(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

function cleanPhrase(value: string): string {
  return value.trim().replace(/[.!?]+$/g, "");
}

function valueOrPlaceholder(value: string, placeholder: string): string {
  return value.trim() ? cleanPhrase(value) : placeholder;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function compactLocation(context: PropertyContext): string {
  return `${context.location}${context.exactAddress ? ` · ${context.exactAddress}` : ""}`;
}

function propertySpecificSummary(context: PropertyContext, facts: PropertyFactsResponse | null): string[] {
  const record = facts?.propertyRecord;
  const lines: string[] = [];
  if (record?.exactAddress) {
    lines.push(`Known address: ${record.exactAddress}${record.zip ? ` ${record.zip}` : ""}.`);
  }
  if (record?.rawPropertyStyle) {
    lines.push(`Recorded property style: ${record.rawPropertyStyle}.`);
  }
  // Size ALWAYS gets its own line (founder direction 2026-07-18: a property
  // analysis that never says how big the property is fails the reader) —
  // the recorded figure when the source states one, the honest free lookup
  // when it doesn't.
  const sizeBits = [
    record?.acreageText ? record.acreageText : null,
    record?.squareFeet ? `${record.squareFeet.toLocaleString("en-US")} sq ft building` : null,
  ].filter(Boolean);
  lines.push(
    sizeBits.length > 0
      ? `Size: ${sizeBits.join(" · ")}.`
      : "Size: not stated by the source — the county parcel/GIS viewer shows the exact lot dimensions and acreage free (see the size entry under Honest Unknowns)."
  );
  const detailBits = [
    record?.bedrooms ? `${record.bedrooms} bedroom${record.bedrooms === 1 ? "" : "s"}` : null,
    record?.yearBuilt ? `built ${record.yearBuilt}` : null,
  ].filter(Boolean);
  if (detailBits.length > 0) {
    lines.push(`Recorded physical details: ${detailBits.join(" · ")}.`);
  }
  if (record?.listingId) {
    lines.push(`Listing reference: ${record.listingId} — use this number to find the listing on the source site.`);
  }
  return lines;
}

/**
 * The Answer card (redesign memo §3.1 + founder refinements 2026-07-16): the
 * first screen answers "what is this, what's unusual about buying it, can I
 * orient fast" in plain language. Everything here is INTERPRETATION and is
 * labeled "Plain-language read" — verified facts live in the chips and the
 * trust section, never mixed in. Readiness phrases replace scores: no false
 * precision, just what the file has and hasn't captured.
 */
function buildAnswerCard(args: {
  context: PropertyContext;
  restrictionsPresent: boolean;
}): { headline: string; readiness: string[]; fitLine: string | null; pauseLine: string } {
  const isHome = /home|residential|house/i.test(args.context.propertyType ?? "");
  const sourceId = (args.context.sourceId ?? "").toLowerCase();
  const priceOnRequest = /price on request/i.test(args.context.priceLabel ?? "");
  const isGovSale = sourceId === "hud" || sourceId === "usda" || sourceId === "gsa";
  const imported = Boolean(args.context.propertyId?.startsWith("imported:"));

  const headline =
    sourceId === "hud" && isHome
      ? "An ordinary home purchase with one unusual advantage: as a live-in buyer, you get to bid before any investor is allowed to."
      : sourceId === "usda"
        ? "A government resale bought through USDA's own process — sold as-is, with the current price on USDA's listing page."
        : sourceId === "gsa"
          ? "Federal surplus sold by auction — the auction page carries the price, the deposit rules, and the timeline."
          : imported
            ? "A property you brought in yourself — here is what could be verified about it so far, and what couldn't."
            : "A first look built from what can be verified about this property and its place — nothing more implied.";

  const readiness: string[] = [];
  readiness.push(args.restrictionsPresent ? "Needs review before anything else" : "Looks reviewable");
  if (priceOnRequest) readiness.push("Price not captured here");
  if (isGovSale) readiness.push("Needs inspection detail");
  if (sourceId === "hud" && isHome) readiness.push("HUD owner-occupant timing matters");

  const fitBits = [
    sourceId === "hud" && isHome ? "the HUD owner-occupant bid window" : null,
    args.context.location ? `the ${args.context.location} setting` : null,
    "place facts that come with sources",
  ].filter((bit): bit is string => Boolean(bit));
  const pauseBits = [
    priceOnRequest ? "a confirmed price" : null,
    isGovSale ? "inspection results and a repair estimate" : "inspection results",
    "a lender-ready package today",
  ].filter((bit): bit is string => Boolean(bit));

  return {
    headline,
    readiness,
    fitLine: fitBits.length > 0 ? fitBits.join(", ") : null,
    pauseLine: pauseBits.join(", "),
  };
}

function verificationTone(status: NonNullable<PropertyFactsResponse["verification"]>["status"] | undefined) {
  switch (status) {
    case "verified":
      return {
        border: "#bfe4db",
        background: "#f2fbf8",
        label: "#0f6e56",
        text: "#12344d",
      };
    case "blocked":
      return {
        border: "#f1b7b7",
        background: "#fff5f5",
        label: "#a12626",
        text: "#5e2222",
      };
    case "unverifiable":
      return {
        border: "#ead8aa",
        background: "#fffaf0",
        label: "#854F0B",
        text: "#5f470c",
      };
    default:
      return {
        border: "#d7deea",
        background: "#f7fbff",
        label: "#4d596d",
        text: "#3b475a",
      };
  }
}

function verificationStatusCopy(status: NonNullable<PropertyFactsResponse["verification"]>["status"] | undefined): string {
  switch (status) {
    case "verified":
      return "Imported address verified against live public place-fact sources.";
    case "blocked":
      return "Imported address flow blocked because the input triggered a restricted-intent rule.";
    case "unverifiable":
      return "Imported address could not be normalized well enough for live source verification.";
    case "partial":
      return "Imported address was checked, but no positive place-fact match has been confirmed yet.";
    default:
      return "Imported address verification has not completed yet.";
  }
}

function sourceVerificationCopy(context: PropertyContext): {
  title: string;
  detail: string;
} {
  if (context.sourceVerificationStatus === "matched-approved-source-record") {
    return {
      title: "Matched approved source record",
      detail:
        "Furlong verified the address and matched it to an approved source-backed property record in the platform. The visible property details are now anchored to that approved record rather than the visitor's pasted listing text.",
    };
  }

  return {
    title: "No approved source match yet — continuing with verified address only",
    detail:
      "Furlong verified the address posture through live public place-fact checks, but did not match this property to an approved source-backed record in the platform. Imported listing details should still be treated as intake material, not independently confirmed listing facts.",
  };
}

function sourceCandidateCopy(context: PropertyContext): string | null {
  if (!context.listingSourceCandidate) return null;

  const lines: string[] = [];

  if (
    context.listingSourceCandidateStatus ===
    "allowlisted-marketplace-source-detected"
  ) {
    lines.push(
      `${context.listingSourceCandidate} was recognized as an allowlisted marketplace source candidate.`
    );
  } else if (context.listingSourceCandidateStatus === "allowlisted-address-only") {
    lines.push(
      `${context.listingSourceCandidate} was recognized as an allowlisted source candidate for address extraction only.`
    );
  } else {
    lines.push(
      `${context.listingSourceCandidate} was treated as a quarantined outside source candidate.`
    );
  }

  if (context.listingSourceGovernanceStatus === "live-fetch-blocked-by-governance") {
    lines.push(
      "Live third-party listing fetch remains blocked until connector certification, legal review, and promotion approval."
    );
  } else if (
    context.listingSourceGovernanceStatus === "not-in-governed-source-stack"
  ) {
    lines.push(
      "This source is not yet in Furlong's governed source stack, so the portal stayed in address-only posture."
    );
  }

  if (
    context.listingSourceMatchStatus ===
    "approved-source-match-not-yet-established"
  ) {
    lines.push(
      "Approved source match not yet established."
    );
  }

  if (
    context.listingSourceMatchStatus === "approved-source-match-established"
  ) {
    lines.push("Approved source match established.");
  }

  if (lines.length === 0) {
    return null;
  }

  if (
    context.listingSourceCandidateStatus === "generic-quarantined" &&
    lines.length === 1
  ) {
    return `${context.listingSourceCandidate} was treated as a quarantined source candidate. The portal used address extraction only and did not trust or ingest the page content itself.`;
  }

  return lines.join(" ");
}

function propertyIntentText(context: PropertyContext, answers: DraftAnswers): string {
  return [
    context.propertyType,
    context.categoryLabel ?? "",
    context.currentLabel ?? "",
    answers.possibility,
    answers.usePlan,
    answers.revenueModel,
  ]
    .join(" ")
    .toLowerCase();
}

function propertyUseClass(context: PropertyContext, answers: DraftAnswers): "farm" | "hospitality" | "business" | "mixed" {
  const joined = propertyIntentText(context, answers);
  if (/(inn|lodging|guesthouse|retreat|tourism|hospitality|event|wedding|stay)/.test(joined)) {
    return "hospitality";
  }
  if (/(business|retail|commercial|office|industrial)/.test(joined)) {
    return "business";
  }
  if (/(farm|agri|crop|livestock|pasture|ranch|orchard|greenhouse)/.test(joined)) {
    return "farm";
  }
  return "mixed";
}

function immediateDealLabel(context: PropertyContext): string {
  const joined = [
    context.propertyType,
    context.categoryLabel ?? "",
    context.description ?? "",
    context.title,
  ].join(" ").toLowerCase();
  if (/(inn|hotel|motel|lodging|retreat|guesthouse|hospitality|event venue|wedding)/.test(joined)) {
    return "Hospitality acquisition";
  }
  if (/(farm|ranch|orchard|acre|pasture|agri|homestead|crop|livestock)/.test(joined)) {
    return "Working farm";
  }
  if (/(historic|vacant|warehouse|adaptive reuse|redevelop|conversion|main street|mixed-use)/.test(joined)) {
    return "Redevelopment opportunity";
  }
  if (/(commercial|retail|office|industrial|warehouse|business)/.test(joined)) {
    return "Rural business";
  }
  return "Property opportunity";
}

type PropertyFirstProgramRank = {
  program: FinancingProgram;
  score: number;
  rationale: string;
  caution: string;
};

type BudgetExpectations = {
  acquisition: string;
  softCosts: string;
  buildout: string;
};

function parsePriceSignal(priceLabel: string): number | null {
  const matches = priceLabel.match(/[\d,]+/g);
  if (!matches || matches.length === 0) return null;
  const value = Number(matches.join("").replace(/,/g, ""));
  return Number.isFinite(value) && value > 0 ? value : null;
}

function deriveAssetClassFromContext(context: PropertyContext): AssetClass {
  const joined = [
    context.propertyType,
    context.categoryLabel ?? "",
    context.description ?? "",
    context.title,
    context.sourceLabel,
  ].join(" ").toLowerCase();
  if (/(farm|ranch|orchard|agri|acre|pasture|livestock|crop|homestead)/.test(joined)) return "agricultural";
  if (/(inn|hotel|motel|retreat|hospitality|event venue|lodge)/.test(joined)) return "specialty";
  if (/(commercial|retail|office|industrial|warehouse|business|mixed-use)/.test(joined)) return "commercial";
  if (/(clinic|medical|hospital|nursing)/.test(joined)) return "institutional";
  if (/(home|house|residential|condo|duplex|single family)/.test(joined)) return "residential";
  return "unknown";
}

function isResidentialHomeContext(context: PropertyContext): boolean {
  const text = [context.propertyType, context.categoryLabel ?? "", context.description ?? "", context.title].join(" ");
  if (/(farm|ranch|agric|crop|pasture|livestock|orchard|vineyard|poultry|dairy|tillable|irrigat|acre)/i.test(text)) return false;
  return /(home|house|residential|single family|condo|duplex)/i.test(text);
}

function buildBudgetExpectations(context: PropertyContext): BudgetExpectations {
  const price = parsePriceSignal(context.priceLabel);
  if (price === null) {
    return {
      acquisition: "The price lives on the source listing and can change as bid periods reset — check it there before you run numbers.",
      softCosts: "Plan on real out-of-pocket costs before closing: inspection, appraisal, title work, and insurance quotes. Typical ranges are itemized in the cost guide below.",
      buildout: "Repair and improvement costs can't be estimated until someone walks the property — budget a contingency and get contractor numbers after the inspection.",
    };
  }

  const diligenceLow = Math.round(price * 0.015);
  const diligenceHigh = Math.round(price * 0.05);
  const reserveLow = Math.round(price * 0.05);
  const reserveHigh = Math.round(price * 0.2);

  return {
    acquisition: `The visible asking posture points to an acquisition basis around ${context.priceLabel}.`,
    softCosts: `A reasonable first-pass diligence reserve is likely around $${diligenceLow.toLocaleString()}-$${diligenceHigh.toLocaleString()} before closing.`,
    buildout: `A rough improvement / contingency reserve may need to start around $${reserveLow.toLocaleString()}-$${reserveHigh.toLocaleString()} until actual condition and scope are verified.`,
  };
}

function buildPropertyFirstProgramRanking(args: {
  context: PropertyContext;
  assetClass: AssetClass;
  verifiedPrograms: NonNullable<PropertyFactsResponse["verifiedPrograms"]>;
  facts: PropertyFactsResponse | null;
}): PropertyFirstProgramRank[] {
  if (isResidentialHomeContext(args.context)) {
    return [
      {
        program: {
          id: "fha-context",
          name: "FHA owner-occupant context",
          family: "Other",
          fitsAsset: ["residential"],
          citation: "HUD Home Store / FHA disposition context",
        },
        score: 74,
        rationale: "This is a HUD home listing, and if you plan to live in it, an FHA-style owner-occupant loan is the most common way homes like this are bought. A lender confirms what fits your situation.",
        caution: "This is not an eligibility or approval signal, and the file is still thin because the source record does not publish an asking price or condition here.",
      },
      {
        program: {
          id: "conventional-home",
          name: "Conventional residential mortgage context",
          family: "Other",
          fitsAsset: ["residential"],
          citation: "General residential mortgage market context",
        },
        score: 66,
        rationale: "If the appraisal, condition, and borrower-side profile cooperate, a standard residential acquisition path is more plausible than business or redevelopment financing.",
        caution: "This weakens quickly if hidden condition issues, occupancy restrictions, or borrower-side weakness appear later in diligence.",
      },
    ];
  }

  const programs = programsForAsset(args.assetClass);
  const joined = [
    args.context.propertyType,
    args.context.categoryLabel ?? "",
    args.context.description ?? "",
    args.context.title,
    args.context.pathwayList.join(" "),
  ].join(" ").toLowerCase();
  const oz = Boolean(args.facts?.placeFacts?.opportunityZone);
  const hubzone = Boolean(args.facts?.placeFacts?.hubzone?.isCurrent);
  const ruralHint =
    /(rural|farm|acre|pasture|usda|agri)/.test(joined) ||
    args.verifiedPrograms.some((program) => /USDA/i.test(program.administering_body));
  const hospitalityHint = /(inn|hotel|motel|retreat|lodge|hospitality|event)/.test(joined);
  const redevelopmentHint = /(redevelop|conversion|adaptive reuse|historic|mixed-use|warehouse|vacant)/.test(joined);

  return programs
    .map((program) => {
      let score = 55;
      const name = program.name.toLowerCase();

      if (args.assetClass === "agricultural" && /fsa|farm credit|reap|b&i/.test(name)) score += 18;
      if (args.assetClass === "commercial" && /sba 504|sba 7\(a\)|sba express/.test(name)) score += 18;
      if (args.assetClass === "specialty" && hospitalityHint && /sba 504|sba 7\(a\)|b&i|reap/.test(name)) score += 16;
      if (ruralHint && /usda|farm credit/.test(name)) score += 12;
      if (redevelopmentHint && /sba 504|b&i/.test(name)) score += 10;
      if (oz && /sba 504|sba 7\(a\)|b&i/.test(name)) score += 6;
      if (hubzone && /sba/.test(name)) score += 8;
      if (args.context.pathwayList.some((pathway) => name.includes(pathway.toLowerCase()))) score += 6;

      const rationale =
        /sba 504/.test(name) ? "Most plausible when the property will be occupied by a real operating business and improvements are part of the story."
        : /sba 7\(a\)/.test(name) ? "Usually strongest when acquisition and operating business needs have to be financed together."
        : /sba express/.test(name) ? "More plausible as a smaller, faster business-purpose lane than as a heavy real-estate solution."
        : /b&i/.test(name) ? "Becomes more credible when the property is rural and tied to a business or operating-use thesis."
        : /fsa/.test(name) ? "Most plausible if the property is genuinely agricultural rather than simply rural."
        : /farm credit/.test(name) ? "Often strongest where the land or operation is clearly agricultural and operator-led."
        : /reap/.test(name) ? "More of an improvement / energy-adjacent lane than a primary acquisition solution."
        : "Program fit depends on the final operating and ownership structure.";

      const caution =
        /sba/.test(name) ? "Weakens quickly if the property cannot support a credible owner-user or operating-business story."
        : /fsa|farm credit/.test(name) ? "Weakens quickly if the use is mostly hospitality or non-farm commercial."
        : /reap/.test(name) ? "Should not be mistaken for a full capital-stack answer."
        : "Needs rule and document review before reliance.";

      return { program, score: Math.max(0, Math.min(100, score)), rationale, caution };
    })
    .sort((a, b) => b.score - a.score);
}

function buildQuestionsYouWouldNormallyAsk(args: {
  context: PropertyContext;
  answers: DraftAnswers;
  facts: PropertyFactsResponse | null;
  topProgramRanks: PropertyFirstProgramRank[];
}) {
  const useClass = propertyUseClass(args.context, args.answers);
  const dealLabel = immediateDealLabel(args.context);
  const out: string[] = [];

  if (useClass === "hospitality" || /hospitality/i.test(dealLabel)) {
    out.push("Is this really a hospitality asset, or is it just a beautiful property with a weak lodging or event business case?");
    out.push("What occupancy, ADR, event volume, or seasonal demand would have to be true for this property to carry its acquisition and improvement costs?");
    out.push("What is most likely to break the hospitality thesis first: access, staffing, local demand, liquor/event restrictions, or renovation scope?");
  } else if (useClass === "farm") {
    out.push("Is this truly a working farm opportunity, or mostly rural land with a weaker operating case?");
    out.push("What exact agricultural use fits this site best: crop, livestock, orchard, greenhouse, agritourism, or a mixed operation?");
    out.push("What breaks the farm thesis first: acreage, soils, water, utilities, access, improvements, or operator capability?");
  } else if (/redevelopment/i.test(dealLabel)) {
    out.push("Is this actually a redevelopment opportunity with enough margin, or a romantic project that gets too expensive too quickly?");
    out.push("What would have to be true on zoning, code, utilities, and condition for the reuse concept to survive first-pass diligence?");
    out.push("Does the historic or conversion story create real value, or mostly extra approvals, cost, and delay?");
  } else if (useClass === "business") {
    out.push("Is there a credible owner-user or operating-business case here, or is the property stronger as ordinary real estate than as a business-backed acquisition?");
    out.push("What business model fits this site best given traffic, layout, town size, access, and likely operating demand?");
    out.push("What kills the business case first: demand, buildout, staffing, working capital, or mismatch between property and use?");
  } else {
    out.push("What is the highest-probability use case this property can actually support before branding or optimism gets involved?");
    out.push("What is most likely to break the deal first: zoning, condition, utilities, staffing, capital structure, or local demand?");
  }

  out.push("Is the likely financing story owner-user business occupancy, farm operation, redevelopment, or something weaker than that?");
  out.push("How much diligence reserve should be assumed before the asking price is treated like the real cost of the deal?");
  if (args.facts?.placeFacts?.flood) {
    out.push("How much does the visible flood posture change insurance, financing, or usable-site assumptions?");
  }
  if (args.facts?.placeFacts?.historic) {
    out.push("Does the historic posture create upside through identity, or cost through approvals and construction constraints?");
  }
  if (args.topProgramRanks[0]) {
    out.push(`If ${args.topProgramRanks[0].program.name} is the lead lane, what exact facts would strengthen it or knock it out?`);
  }
  return out.slice(0, 6);
}

function buildPropertyEconomicsLines(args: {
  context: PropertyContext;
  budgetExpectations: BudgetExpectations;
  topProgramRanks: PropertyFirstProgramRank[];
}): string[] {
  const out = [
    args.budgetExpectations.acquisition,
    args.budgetExpectations.softCosts,
    args.budgetExpectations.buildout,
  ];
  if (args.topProgramRanks[0]) {
    out.push(
      `${args.topProgramRanks[0].program.name} currently looks like the lead financing lane because ${cleanPhrase(args.topProgramRanks[0].rationale).toLowerCase()}.`
    );
  }
  if (args.topProgramRanks[1]) {
    out.push(
      `${args.topProgramRanks[1].program.name} is the usual backup if the first option doesn't fit.`
    );
  }
  return out.slice(0, 5);
}

function buildImmediateSuitability(args: {
  context: PropertyContext;
  topPathways: Array<{ label: string; fitScore: number; fitReasons: string[]; missingItems: string[] }>;
  verifiedPrograms: NonNullable<PropertyFactsResponse["verifiedPrograms"]>;
  facts: PropertyFactsResponse | null;
}) {
  if (isResidentialHomeContext(args.context)) {
    const record = args.facts?.propertyRecord;
    return {
      dealLabel: "Single-family home acquisition",
      signals: [
        `${args.context.sourceLabel} is carrying this as a current single-family home listing${record?.exactAddress ? ` at ${record.exactAddress}${record.zip ? ` ${record.zip}` : ""}` : ""}.`,
        "The clean first-pass read here is plain residential acquisition context, not a tourism, farm, or business thesis.",
        args.facts?.placeFacts?.opportunityZone
          ? `Opportunity Zone is positively confirmed for tract ${args.facts.placeFacts.opportunityZone.tractId}.`
          : "No positive Opportunity Zone designation is confirmed from the current property-side record.",
        args.facts?.placeFacts?.flood
          ? `Flood posture is visible and material: FEMA zone ${args.facts.placeFacts.flood.floodZone}.`
          : "No Special Flood Hazard Area flag is confirmed from the current property-side record.",
      ],
      constraints: [
        "The source does not publish a firm asking price here, so acquisition basis is still unconfirmed.",
        record?.bedrooms || record?.squareFeet || record?.yearBuilt
          ? `Recorded physical detail is partial: ${[
              record?.bedrooms ? `${record.bedrooms} bedroom${record.bedrooms === 1 ? "" : "s"}` : null,
              record?.squareFeet ? `${record.squareFeet.toLocaleString("en-US")} sq ft` : null,
              record?.yearBuilt ? `built ${record.yearBuilt}` : null,
            ].filter(Boolean).join(" · ")}.`
          : "The record is still thin on bedrooms, square footage, year built, and condition, so this remains an initial screen rather than a decision-grade valuation.",
        args.facts?.placeFacts?.historic
          ? "Historic context is positively confirmed and could affect scope, approvals, or rehab framing."
          : "No historic district or National Register flag is confirmed from the current property-side record.",
      ],
    };
  }

  const best = args.topPathways[0];
  const secondary = args.topPathways.slice(1, 3);
  const signals: string[] = [];
  const constraints: string[] = [];

  if (best) {
    signals.push(`${best.label} is the strongest immediate lane at fit score ${best.fitScore}.`);
    if (best.fitReasons[0]) signals.push(best.fitReasons[0]);
    if (best.missingItems.length > 0) {
      constraints.push(`This lane still depends on ${best.missingItems.slice(0, 3).join(", ")}.`);
    }
  }
  for (const pathway of secondary) {
    signals.push(`${pathway.label} also remains plausible if the use case and file support it.`);
  }
  if (args.verifiedPrograms.length > 0) {
    constraints.unshift(`${args.verifiedPrograms.length} verified property-side criteria signal(s) already attach to the property, which strengthens suitability.`);
  }
  if (args.facts?.placeFacts?.flood) {
    constraints.push(`Flood posture is already visible and may affect insurance, financing, or site-use assumptions.`);
  }
  if (args.facts?.placeFacts?.historic) {
    constraints.push(`Historic context could help the story or complicate redevelopment, depending on the actual scope.`);
  }
  if (!best) {
    signals.push("The property still needs more structured facts before a strong lead lane can be stated.");
  }
  if (constraints.length === 0) {
    constraints.push("The property can be screened immediately, but execution still depends on zoning, capital structure, and human review.");
  }

  return {
    dealLabel: immediateDealLabel(args.context),
    signals: signals.slice(0, 4),
    constraints: constraints.slice(0, 4),
  };
}

function contextualMissingItem(item: string, context: PropertyContext, answers: DraftAnswers): string {
  const useClass = propertyUseClass(context, answers);
  switch (item) {
    case "borrower onboarding intake":
      return "operator or borrower profile";
    case "farm stage":
      return "project stage";
    case "farm location":
      return context.exactAddress ? "site-specific property details" : "site-specific location details";
    case "farm type":
      return useClass === "hospitality"
        ? "property use classification"
        : useClass === "business"
          ? "business/property classification"
          : "property or operating type";
    case "borrower goal":
      return "project goal";
    case "service interest":
      return "desired support path";
    case "acreage":
      return "site size or acreage";
    default:
      return item;
  }
}

function contextualMissingItems(items: string[], context: PropertyContext, answers: DraftAnswers): string[] {
  return unique(items.map((item) => contextualMissingItem(item, context, answers)));
}

function rankPropertyPathways(args: {
  context: PropertyContext;
  answers: DraftAnswers;
  pathways: Array<{
    id: string;
    label: string;
    fitScore: number;
    status: string;
    missingItems: string[];
    fitReasons: string[];
  }>;
}) {
  const joined = propertyIntentText(args.context, args.answers);
  const requestedPrograms = args.context.pathwayList.join(" ").toLowerCase();
  const hospitalityLike = /(hospitality|inn|hotel|motel|lodge|retreat|event venue|wedding|tourism)/.test(joined);
  const farmLike = /(farm|crop|orchard|livestock|agri|greenhouse|pasture|ranch)/.test(joined);
  const businessLike = /(commercial|business|retail|office|mixed-use|redevelopment|investment)/.test(joined);

  return [...args.pathways]
    .map((pathway) => {
      let adjustment = 0;
      const label = pathway.label.toLowerCase();

      if (hospitalityLike) {
        if (/rural tourism/.test(label)) adjustment += 18;
        if (/sba|business|b&i/.test(label)) adjustment += 16;
        if (/energy efficiency/.test(label)) adjustment += 10;
        if (/specialty crop|fsa|farm credit|farm ownership|farm operating/.test(label)) adjustment -= 40;
      }

      if (farmLike) {
        if (/specialty crop/.test(label)) adjustment += 16;
      }

      if (businessLike) {
        if (/sba|business|b&i/.test(label)) adjustment += 14;
        if (/energy efficiency/.test(label)) adjustment += 8;
        if (/specialty crop|fsa|farm credit/.test(label)) adjustment -= 18;
      }

      if (requestedPrograms && label.includes("fha")) {
        adjustment += 6;
      }

      return {
        ...pathway,
        fitScore: Math.max(0, Math.min(100, pathway.fitScore + adjustment)),
      };
    })
    .sort((a, b) => b.fitScore - a.fitScore);
}

/**
 * Format the ownership-cost model for the PDF (founder direction 2026-07-17).
 * LISTED prices only — the signed artifact stays deterministic; a price the
 * visitor typed stays on the page it was typed on.
 */
function formatOwnershipCostsForPdf(args: {
  listedPrice: number;
  ownershipContext: OwnershipCostContext;
  isHome: boolean;
  farmShaped: boolean;
  farmMode?: boolean;
}):
  | {
      priceLine: string;
      scenarios: Array<{ program: string; downPayment: string; monthly: string }>;
      closingLine: string;
      monthlyLines: Array<{ label: string; range: string; note: string }>;
      totalsLines: string[];
      horizonLines: Array<{ label: string; value: string }>;
      equityIntro?: string;
      equityRows?: Array<{ label: string; value: string }>;
      equityDisclaimers?: string[];
      disclaimers: string[];
    }
  | undefined {
  const model = buildOwnershipCostModel(
    {
      price: args.listedPrice,
      priceIsAssumption: false,
      isHome: args.isHome,
      farmShaped: args.farmShaped,
      farmMode: args.farmMode,
    },
    args.ownershipContext
  );
  if (!model) return undefined;
  const dollars = (n: number) => `$${n.toLocaleString("en-US")}`;
  const priceContext = buildPriceContext(args.listedPrice, args.ownershipContext);
  return {
    priceLine:
      `Figured at the listed price of ${dollars(args.listedPrice)}. These are the numbers that decide whether ownership stays comfortable — worth knowing before the offer, not after.` +
      (priceContext ? ` ${priceContext.text}` : ""),
    scenarios: model.purchase.scenarios.map((s) => ({
      program: s.program,
      downPayment: s.downPayment === 0 ? "$0 (0%)" : `${dollars(s.downPayment)} (${s.downPaymentPct}%)`,
      monthly:
        `${dollars(s.monthlyPrincipalInterest)} P&I` +
        (s.monthlyMortgageInsurance > 0 ? ` + ${dollars(s.monthlyMortgageInsurance)} mortgage ins.` : ", no mortgage ins.") +
        `  ·  Income that works: ≈${dollars(s.incomeGuidance.comfortableAnnual)}/yr (sometimes from ${dollars(s.incomeGuidance.stretchAnnual)})` +
        (s.program.startsWith("USDA") ? "; county income caps apply" : ""),
    })),
    closingLine:
      `Income guidance sizes each lane's full house payment (with taxes and insurance) against that program's customary housing ratio — lenders qualify on the whole picture, never income alone. ` +
      `Closing costs add roughly ${dollars(model.purchase.closingLow)}–${dollars(model.purchase.closingHigh)} on top of the down payment. ${model.purchase.closingNote}`,
    monthlyLines: model.monthly.map((line) => ({
      label: line.label,
      range: `${dollars(line.low)}–${dollars(line.high)}/mo`,
      note: `${line.note} [${line.provenance}]`,
    })),
    totalsLines: model.monthlyTotals.map(
      (total) => `All-in monthly on ${total.program}: ${dollars(total.low)}–${dollars(total.high)}`
    ),
    horizonLines: (
      [
        ["Year 1 — buying in", model.horizon.year1],
        ["Years 2–5", model.horizon.years2to5],
        ["Years 6–10", model.horizon.years6to10],
        ["Years 11–30", model.horizon.years11to30],
      ] as const
    ).map(([label, band]) => ({
      label,
      value: `${dollars(band.low)}–${dollars(band.high)} — ${band.note}`,
    })),
    ...((): {
      equityIntro?: string;
      equityRows?: Array<{ label: string; value: string }>;
      equityDisclaimers?: string[];
    } => {
      const outlook = buildEquityOutlook(args.listedPrice, args.ownershipContext);
      if (!outlook) return {};
      return {
        equityIntro: outlook.intro,
        equityRows: outlook.rows.map((row) => ({
          label: `Year ${row.year}`,
          value:
            `Still owed ${row.loanBalance > 0 ? dollars(row.loanBalance) : "$0 (paid off)"}  ·  ` +
            `flat ${dollars(row.flat.value)} (eq. ${dollars(row.flat.equity)})  ·  ` +
            `slower ${dollars(row.slower.value)} (eq. ${dollars(row.slower.equity)})  ·  ` +
            `steady ${dollars(row.steady.value)} (eq. ${dollars(row.steady.equity)})`,
        })),
        equityDisclaimers: outlook.disclaimers,
      };
    })(),
    disclaimers: model.disclaimers,
  };
}

function reportVerdict(args: {
  context: PropertyContext;
  answers: DraftAnswers;
  readinessPercent: number;
  topPathways: Array<{ fitScore: number }>;
  verifiedProgramsCount: number;
}): { label: string; explanation: string } {
  if (isResidentialHomeContext(args.context) && !args.answers.usePlan.trim()) {
    return {
      label: "A regular house for sale — one real possibility",
      explanation:
        `This is a house listed for sale through ${args.context.sourceLabel}. Buying it works the same way as buying any house: make an offer, get an inspection, line up a loan, close. This profile pulls together what we could verify about the place — flood risk, schools, what it costs to buy and own — so you can decide whether it deserves an offer.`,
    };
  }

  const hasConcept = args.answers.possibility.trim().length > 0 && args.answers.usePlan.trim().length > 0;
  const detailScore = [
    args.answers.capitalPlan,
    args.answers.requestedAmount,
    args.answers.operatorExperience,
    args.answers.revenueModel,
    args.answers.renovationScope,
    args.answers.ownershipPosture,
  ].filter((value) => value.trim().length > 0).length + args.answers.documents.length;
  const avgFit = args.topPathways.length > 0
    ? Math.round(args.topPathways.reduce((sum, pathway) => sum + pathway.fitScore, 0) / args.topPathways.length)
    : 0;

  if (hasConcept && detailScore >= 7 && args.readinessPercent >= 40 && avgFit >= 65) {
    return {
      label: "Taking shape — review comes next",
      explanation:
        args.verifiedProgramsCount > 0
          ? "The concept, operating posture, and document base are becoming credible, and some property-side facts are already verified, but human review and a few decisive confirmations still separate this from a truly decision-grade file."
          : "The concept, operating posture, and document base are becoming credible, but human review and a few decisive confirmations still separate this from a truly decision-grade file.",
    };
  }

  if (hasConcept && args.readinessPercent >= 65 && avgFit >= 60) {
    return {
      label: "Promising, with homework left",
      explanation:
        args.verifiedProgramsCount > 0
          ? "The property has a credible use case, meaningful pathway alignment, and at least some property-side criteria already verified, but the file still needs human review and missing confirmations."
          : "The property has a credible use case and meaningful pathway alignment, but the file still needs stronger property-side evidence and missing confirmations before it becomes decision-grade.",
    };
  }

  if (hasConcept) {
    return {
      label: "A real idea that needs more detail",
      explanation:
        "There is a real concept here, but the capital plan, operating model, or support file is still too thin to produce a strong customer-facing advisory report without more specificity.",
    };
  }

  // No operating thesis yet (an address-first place brief). This is NOT a
  // failing grade on the property (founder direction 2026-07-20: "we already
  // know what it is — stop reprimanding"). State what IS established — the
  // verified statutory place-facts — and frame the operating thesis as the one
  // open variable, which is the visitor's to set, not a deficiency.
  const signals = args.verifiedProgramsCount;
  return {
    label: "Place established · operating thesis open",
    explanation:
      signals > 0
        ? `The statutory place-facts for this tract are verified and logged below — ${signals} sourced signal${signals === 1 ? "" : "s"} attached. What is still open is the operating thesis: how the ground would be used. That is yours to set, and it shapes which financing lanes and questions apply — not whether these place-facts hold.`
        : "The verified place-facts for this tract are logged below. What is still open is the operating thesis: how the ground would be used. Naming it — home, working farm, or commercial — sharpens the financing lanes and the questions that follow.",
  };
}

/**
 * Facts-doctrine rework (founder task 2026-07-16): strengths derive from the
 * VERIFIED place facts (positive-tone lines, with their sources) plus the
 * customer's own inputs — labeled as the customer's inputs, never dressed as
 * findings. No padding: an empty file falls through to the section's honest
 * "too thin to state signals" fallback.
 */
function buildStrengths(args: {
  context: PropertyContext;
  answers: DraftAnswers;
  verifiedPrograms: NonNullable<PropertyFactsResponse["verifiedPrograms"]>;
  topPathways: Array<{ label: string; fitScore: number }>;
  placeIntelligence: PropertyBriefIntelligence | null;
}): string[] {
  const out: string[] = [];

  // 1. Verified positive place facts — the strongest signals, with cites.
  for (const fact of (args.placeIntelligence?.verifiedFacts ?? []).filter((f) => f.tone === "positive").slice(0, 3)) {
    out.push(`${fact.label}: ${fact.value} (${fact.provenance.replace(/^Source:\s*/i, "").split("·")[0].trim()}).`);
  }
  if (args.verifiedPrograms.length > 0) {
    out.push(`${args.verifiedPrograms.length} property-side program signal(s) verified against government sources — support, never an approval basis.`);
  }

  // 2. The customer's own inputs — labeled as theirs.
  if (args.answers.usePlan.trim()) {
    out.push(`Your stated plan: ${sentence(args.answers.usePlan)}`);
  }
  if (args.answers.operatorExperience.trim()) {
    out.push(`Your stated experience: ${sentence(args.answers.operatorExperience)}`);
  }

  // 3. Engine-derived lane, in plain language.
  if (args.topPathways[0]) {
    out.push(`${args.topPathways[0].label} currently reads as the strongest financing lane to test first.`);
  }
  return out.slice(0, 5);
}

function buildRisks(args: {
  answers: DraftAnswers;
  readinessMissing: string[];
  verifiedPrograms: NonNullable<PropertyFactsResponse["verifiedPrograms"]>;
  placeIntelligence: PropertyBriefIntelligence | null;
}): string[] {
  // Verified caution-tone place facts lead (flood hazard, elevated natural-
  // hazard ratings…) — real, sourced risks before file-thinness ones.
  const out = (args.placeIntelligence?.verifiedFacts ?? [])
    .filter((f) => f.tone === "caution")
    .slice(0, 2)
    .map((f) => `${f.label}: ${f.value} (${f.provenance.replace(/^Source:\s*/i, "").split("·")[0].trim()}).`);
  // One honest flag, not a litany (founder feedback 2026-07-17).
  if (args.readinessMissing.length > 0) {
    out.push(`To complete your file, Furlong still needs: ${args.readinessMissing.join("; ")}.`);
  }
  if (!args.answers.capitalPlan.trim()) {
    out.push("The capital plan is still vague, so renovation, equipment, working capital, and timing risk are not decision-grade yet.");
  }
  if (!args.answers.revenueModel.trim()) {
    out.push("The revenue model is still too thin, so the report cannot yet test whether the concept actually supports the capital need.");
  }
  if (!args.answers.ownershipPosture.trim()) {
    out.push("The ownership or entity posture is still undefined, which creates avoidable ambiguity around borrowing structure and execution readiness.");
  }
  if (!args.answers.usePlan.trim()) {
    out.push("The use case is not operationally defined enough yet to test staffing, occupancy, production, or revenue assumptions.");
  }
  if (args.verifiedPrograms.length === 0) {
    out.push("No verified property-side program criteria have surfaced yet, so the report should avoid leaning on incentives as a lead story.");
  }
  return unique(out).slice(0, 5);
}

function buildKeyQuestions(args: {
  context: PropertyContext;
  answers: DraftAnswers;
  topProgramRanks: PropertyFirstProgramRank[];
  navigator: NavigatorSnapshot | null;
}): string[] {
  const out: string[] = [];
  const useClass = propertyUseClass(args.context, args.answers);
  const dealLabel = immediateDealLabel(args.context);

  if (!args.answers.usePlan.trim()) {
    if (useClass === "hospitality" || /hospitality/i.test(dealLabel)) {
      out.push("Is the real play here lodging, events, retreat programming, food and beverage, or some narrower hospitality use?");
    } else if (useClass === "farm") {
      out.push("What exact farm or land-based operation would this property support on day one?");
    } else if (/redevelopment/i.test(dealLabel)) {
      out.push("What is the first realistic reuse concept that survives code, utilities, and renovation reality?");
    } else if (useClass === "business") {
      out.push("What operating business would actually occupy and justify this property?");
    } else {
      out.push("What is the actual operating model for this property once acquired?");
    }
  }
  if (!args.answers.capitalPlan.trim()) {
    if (/redevelopment/i.test(dealLabel)) {
      out.push("How much of the capital stack is really acquisition versus hard rehab, code work, utilities, and contingency?");
    } else {
      out.push("What specifically needs to be financed: acquisition, renovation, equipment, working capital, or all of the above?");
    }
  }
  if (!args.answers.requestedAmount.trim()) out.push("What is the realistic capital requirement range?");
  if (!args.answers.operatorExperience.trim()) out.push("Who will actually operate this property, and what relevant experience do they already have?");
  if (!args.answers.revenueModel.trim()) {
    if (useClass === "hospitality") {
      out.push("What occupancy, nightly rate, event frequency, or ancillary revenue streams would make this hospitality concept real?");
    } else if (useClass === "farm") {
      out.push("What production, contracts, crop mix, herd logic, or agritourism revenue would actually support this farm concept?");
    } else if (useClass === "business") {
      out.push("What customer demand and operating margin would actually support this business use?");
    } else {
      out.push("How will this property make money or sustain itself operationally?");
    }
  }
  if (!args.answers.renovationScope.trim()) {
    if (/redevelopment/i.test(dealLabel)) {
      out.push("How much hidden condition risk is likely sitting behind the romantic redevelopment story?");
    } else {
      out.push("What level of renovation, code work, or site improvement is really required?");
    }
  }
  if (!args.answers.ownershipPosture.trim()) out.push("Who is intended to own or borrow for this property: an individual, a new entity, or an existing operating company?");
  if (args.answers.documents.length < 2) out.push("Which support documents already exist and which must still be assembled?");
  if (args.topProgramRanks[0]) {
    out.push(`What fact would most strengthen ${args.topProgramRanks[0].program.name}, and what fact would knock it out immediately?`);
  }
  const guideQuestion = latestGuideQuestion(args.navigator?.turns ?? []);
  if (guideQuestion) out.push(guideQuestion);
  return unique(out).slice(0, 6);
}

function buildNextMoves(args: {
  answers: DraftAnswers;
  readinessMissing: string[];
  topPathways: Array<{ label: string }>;
  verifiedPrograms: NonNullable<PropertyFactsResponse["verifiedPrograms"]>;
}): string[] {
  const out: string[] = [];
  if (args.answers.usePlan.trim()) {
    out.push("Turn the use concept into a one-page operating brief with intended users, revenue logic, and who will run it.");
  } else {
    out.push("Define the specific use case before doing anything else; the report is weak until the property has a clear operating thesis.");
  }
  if (args.answers.capitalPlan.trim()) {
    out.push("Break the capital plan into acquisition, improvements, equipment, and working capital so financing lanes can be tested more realistically.");
  } else {
    out.push("Build a first-pass capital stack estimate instead of a generic funding ask.");
  }
  if (!args.answers.revenueModel.trim()) {
    out.push("Translate the concept into an actual revenue model with pricing, volume, occupancy, production, or contract assumptions.");
  }
  if (!args.answers.ownershipPosture.trim()) {
    out.push("Decide whether this should sit with an existing entity, a new acquisition entity, or a different ownership structure before the report goes any further.");
  }
  if (args.readinessMissing.length > 0) {
    out.push(`Close the highest-friction gaps first: ${args.readinessMissing.slice(0, 3).join(", ")}.`);
  }
  if (args.topPathways[0]) {
    out.push(`Pressure-test ${args.topPathways[0].label} first, then compare it against the next-best lane rather than assuming one route is automatically best.`);
  }
  if (args.verifiedPrograms.length > 0) {
    out.push("Use the verified place-side criteria as support, but do not let incentives drive the whole strategy unless the business case works without them.");
  }
  return unique(out).slice(0, 5);
}

function buildIncludedSections(tier: ReportTier): string[] {
  const policy = reportPolicy[tier];
  return [...policy.includes];
}

function buildExplainabilityNotes(args: {
  context: PropertyContext;
  answers: DraftAnswers;
  verifiedPrograms: NonNullable<PropertyFactsResponse["verifiedPrograms"]>;
  topPathways: Array<{ label: string; fitReasons: string[]; missingItems: string[] }>;
}): string[] {
  const primaryPathway = args.topPathways[0];
  const lines = [
    "This report combines property details, your stated use concept, the current document set, and Furlong's pathway and readiness checks.",
    isResidentialHomeContext(args.context) && !args.answers.usePlan.trim()
      ? "Because no specialty use concept has been entered yet, the report defaults to ordinary residential acquisition context instead of stretching for a business, farm, or tourism thesis."
      : primaryPathway
      ? `${primaryPathway.label} is currently the lead lane because ${primaryPathway.fitReasons[0] ?? "it currently ranks strongest against this property's facts"}.`
      : "No pathway lead can be stated yet because the current draft is still too thin.",
    args.verifiedPrograms.length > 0
      ? `${args.verifiedPrograms.length} property-side criteria signal(s) were verified from snapshot-backed place facts and used only as support, not as an approval basis.`
      : "No verified property-side criteria were available, so the report relies more heavily on intake answers and clearly marks that limit.",
    args.answers.documents.length > 0
      ? `The report recognizes ${args.answers.documents.length} marked document category or categories in hand, which affects readiness posture and missing-item guidance.`
      : "No support documents were marked in hand, so the readiness posture stays conservative.",
    args.context.propertyId?.startsWith("imported:")
      ? "This asset entered through user import, so listing facts remain intake material until independently confirmed."
      : "This asset originated from a property record already inside the governed discovery flow.",
  ];

  return unique(lines);
}

function buildCustomerRightsSummary(): string[] {
  return [
    "REQUEST_EXPLANATION: ask why you are seeing this report and what inputs or rules shaped it.",
    "REQUEST_EXPORT: keep a watermarked advisory export in a usable format.",
    "REQUEST_DELETION: request deletion of your live-system data subject to required audit preservation.",
    "REQUEST_HUMAN_REVIEW: pause and route the file to a named human reviewer before it goes further.",
    "REQUEST_HOLD_ON_ESCALATION: stop movement from exploration into a deeper stage until you release it.",
  ];
}

function buildHumanReviewBoundary(args: {
  tier: { id: ReportTier; label: string };
  answers: DraftAnswers;
  readinessMissing: string[];
}): string[] {
  const lines = [
    "This export is advisory only and cannot be used as an approval, eligibility decision, underwriting determination, financing commitment, permit filing, legal opinion, or regulatory record.",
    args.tier.id === "free"
      ? "The baseline report is meant for exploration and self-organization, not decision-grade reliance."
      : `${args.tier.label} still requires named human review before anyone treats it as decision-grade.`,
    args.answers.reportTier === "environmental"
      ? "Environmental observations remain planning support only until an independent licensed professional reviews the file."
      : "Program and pathway signals remain planning support only until human review confirms missing facts and constraints.",
  ];

  if (args.readinessMissing.length > 0) {
    lines.push(`The file still has unresolved readiness gaps: ${args.readinessMissing.slice(0, 3).join(", ")}.`);
  }

  return lines;
}

type ReportModel = {
  branding: ReturnType<typeof buildReportBranding>;
  tier: { id: ReportTier; label: string; shortLabel: string; description: string };
  verdict: { label: string; explanation: string };
  executiveSummary: string;
  propertySummary: string[];
  conceptSummary: string[];
  strengths: string[];
  risks: string[];
  pathwayAnalysis: string[];
  propertyVerificationSummary: string[];
  verifiedCriteria: string[];
  readinessSectionNotes: string[];
  keyQuestions: string[];
  nextMoves: string[];
  interviewSignals: string[];
  explainabilityNotes: string[];
  /** Free Place Brief (spec 2026-07-15): sale-mechanics paragraphs for the source. */
  buyingProcess: string[];
  /** Free Place Brief: honest unknowns with the official way to find out. */
  honestUnknowns: string[];
  /** Free Place Brief: prose financing-pathways line (replaces chips). */
  financingProse: string | null;
  /** Tier look/feel + free-tier upgrade teaser (single source: reportTierIdentity). */
  tierIdentity: ReportTierIdentity;
  exportHtml: string;
  exportText: string;
};

type PreviewSection = {
  title: string;
  lines: string[];
  emptyFallback?: string;
};

function buildReportModel(args: {
  context: PropertyContext;
  answers: DraftAnswers;
  navigator: NavigatorSnapshot | null;
  facts: PropertyFactsResponse | null;
  placeIntelligence: PropertyBriefIntelligence | null;
  verifiedPrograms: NonNullable<PropertyFactsResponse["verifiedPrograms"]>;
  topProgramRanks: PropertyFirstProgramRank[];
  budgetExpectations: BudgetExpectations;
  defaultQuestions: string[];
  immediateSuitability: ReturnType<typeof buildImmediateSuitability>;
  readinessResult: ReturnType<typeof assessBorrowerReadiness>;
  topPathways: Array<{
    id: string;
    label: string;
    fitScore: number;
    status: string;
    missingItems: string[];
    fitReasons: string[];
  }>;
}): ReportModel {
  const tier = tierMeta(args.answers.reportTier);
  const tierIdentity = reportTierIdentity(tier.id);
  const branding = buildReportBranding({
    explorationPath: ["Property & Land", "Property Analysis", "Readiness"],
  });
  const verdict = reportVerdict({
    context: args.context,
    answers: args.answers,
    readinessPercent: args.readinessResult.overallReadinessPercent,
    topPathways: args.topPathways,
    verifiedProgramsCount: args.verifiedPrograms.length,
  });
  const strengths = buildStrengths({
    context: args.context,
    answers: args.answers,
    verifiedPrograms: args.verifiedPrograms,
    topPathways: args.topPathways,
    placeIntelligence: args.placeIntelligence,
  });
  const risks = buildRisks({
    answers: args.answers,
    readinessMissing: contextualMissingItems(args.readinessResult.missingItems, args.context, args.answers),
    verifiedPrograms: args.verifiedPrograms,
    placeIntelligence: args.placeIntelligence,
  });
  const keyQuestions = buildKeyQuestions({
    context: args.context,
    answers: args.answers,
    topProgramRanks: args.topProgramRanks,
    navigator: args.navigator,
  });
  const platformQuestions = unique([...args.defaultQuestions, ...keyQuestions]).slice(0, 6);
  const nextMoves = buildNextMoves({
    answers: args.answers,
    readinessMissing: contextualMissingItems(args.readinessResult.missingItems, args.context, args.answers),
    topPathways: args.topPathways,
    verifiedPrograms: args.verifiedPrograms,
  });
  const explainabilityNotes = buildExplainabilityNotes({
    context: args.context,
    answers: args.answers,
    verifiedPrograms: args.verifiedPrograms,
    topPathways: args.topPathways,
  });

  const propertySpecificLines = propertySpecificSummary(args.context, args.facts);
  const propertySummary = [
    `Asset: ${args.context.title}`,
    `Location: ${compactLocation(args.context)}`,
    `Asking posture: ${args.context.priceLabel}`,
    `Immediate deal type: ${args.immediateSuitability.dealLabel}`,
    `Asset type: ${args.context.propertyType}`,
    `Source: ${args.context.sourceLabel}${args.context.vintage ? ` · ${args.context.vintage}` : ""}`,
    ...propertySpecificLines,
  ];

  const conceptSummary = buildPropertyEconomicsLines({
    context: args.context,
    budgetExpectations: args.budgetExpectations,
    topProgramRanks: args.topProgramRanks,
  });

  const pathwayAnalysis = args.topProgramRanks.map((entry, index) =>
    `${index + 1}. ${entry.program.name}. ${entry.rationale} ${entry.caution}`
  );

  const propertyVerificationSummary = (() => {
    const verification = args.facts?.verification;
    const checks = verification?.liveChecks;
    const lines: string[] = [];

    if (args.facts?.placeFacts?.opportunityZone) {
      lines.push(`Opportunity Zone confirmed: tract ${args.facts.placeFacts.opportunityZone.tractId}.`);
    } else if (checks?.opportunityZoneActivated) {
      lines.push("Opportunity Zone was checked live and no positive tract designation was confirmed.");
    }

    if (args.facts?.placeFacts?.nmtc) {
      lines.push(`NMTC low-income community confirmed: tract ${args.facts.placeFacts.nmtc.tractId} is qualified in the current snapshot.`);
    } else if (checks?.nmtcActivated) {
      lines.push("NMTC low-income community status was checked live and no positive tract qualification was confirmed.");
    }

    if (args.facts?.placeFacts?.hubzone) {
      lines.push(`HUBZone confirmed: ${args.facts.placeFacts.hubzone.hubzoneType} designation for GEOID ${args.facts.placeFacts.hubzone.geoid}.`);
    } else if (checks?.hubzoneActivated) {
      lines.push("HUBZone was checked live and no current positive designation was confirmed.");
    }

    if (args.facts?.placeFacts?.flood) {
      lines.push(`FEMA flood posture confirmed: Special Flood Hazard Area, Zone ${args.facts.placeFacts.flood.floodZone}.`);
    } else if (checks?.floodActivated) {
      lines.push("FEMA flood posture was checked live and no Special Flood Hazard Area match was confirmed.");
    }

    if (args.facts?.placeFacts?.historic) {
      lines.push(
        args.facts.placeFacts.historic.historicName
          ? `Historic context confirmed: National Register area — ${args.facts.placeFacts.historic.historicName}.`
          : "Historic context confirmed: National Register listed area."
      );
    } else if (checks?.historicActivated) {
      lines.push("Historic context was checked live and no National Register area match was confirmed.");
    }

    if (verification?.warnings?.length) {
      lines.push(...verification.warnings.map((warning) => `Verification caution: ${warning}`));
    }

    // Snapshot-backed place intelligence (spec 2026-07-15 unification): the
    // frozen-snapshot facts — including explicit NEGATIVES with provenance —
    // fill the report even when no live checks ran, so this section never
    // renders empty for a canonical inventory property. Keyword dedupe keeps
    // live-confirmed lines authoritative without double-reporting a topic.
    if (args.placeIntelligence?.verifiedFacts.length) {
      const topicKeyword: Record<string, RegExp> = {
        "Flood zone": /flood/i,
        "Historic status": /historic/i,
        "Opportunity Zone": /opportunity zone/i,
        HUBZone: /hubzone/i,
        "New Markets Tax Credit area": /nmtc|new markets/i,
      };
      const existing = lines.join(" ");
      for (const fact of args.placeIntelligence.verifiedFacts) {
        const keyword = topicKeyword[fact.label];
        if (keyword && keyword.test(existing)) continue;
        lines.push(`${fact.label}: ${fact.text} [${fact.provenance}]`);
      }
    }

    if (lines.length === 0) {
      lines.push("No live place-fact verification details were available when this report was assembled.");
    }

    return lines;
  })();

  const verifiedCriteria = args.verifiedPrograms.length > 0
    ? args.verifiedPrograms.map((program) =>
        `${program.name}: ${program.verifiedStatement} Basis: ${program.basis}` +
        (program.whyItMatters ? ` ${program.whyItMatters}` : "")
      )
    : ["No verified property-side program criteria surfaced from the current snapshot set yet."];

  const readinessSectionNotes = args.readinessResult.sections.map((section) => {
    const missing = section.missingItems.length > 0
      ? ` Missing: ${contextualMissingItems(section.missingItems, args.context, args.answers).join(", ")}.`
      : "";
    return `${section.label} — ${section.readinessPercent}% (${section.status}). ${section.reviewSignals[0] ?? "Review-bound."}${missing}`;
  });

  const interviewSignals = userTurns(args.navigator?.turns ?? []).slice(-4);
  // The verdict label + explanation render immediately beside this summary,
  // so the summary must not restate them (redesign Phase 1: each thing said
  // once). Scores are internal ranking signals, never customer copy.
  const executiveSummary = [
    args.topProgramRanks[0]
      ? `${args.topProgramRanks[0].program.name.replace(/ context$/i, "")} is usually the first financing lane checked for a property like this — it is not the only one. The financing section lists every lane that could fit, most likely first. Which lane you qualify for comes down to credit, income, and whether you will live here; already owning a home does not by itself rule these out — most programs simply ask that this one become your primary residence. A lender confirms the fit in one conversation.`
      : "",
    args.immediateSuitability.constraints[0] ? `First thing to pin down: ${cleanPhrase(args.immediateSuitability.constraints[0]).toLowerCase()}.` : "",
  ].filter(Boolean).join(" ");

  // Free Place Brief content folded into the report (spec 2026-07-15): the
  // exported report IS the full free brief — mechanics, honest unknowns, and
  // the prose pathways line travel with it.
  const buyingProcess = args.placeIntelligence?.mechanics?.paragraphs ?? [];
  const honestUnknowns = (args.placeIntelligence?.unknowns ?? []).map(
    (unknown) => `${unknown.label}: ${unknown.howToFind}`
  );
  const financingProse = args.placeIntelligence?.pathwaysProse ?? null;
  // Farm-lane questions answered FOR THIS PROPERTY (null on non-farm profiles).
  const farmAnswers = args.placeIntelligence?.farmEnterpriseAnswers ?? [];
  const farmAnswerText = farmAnswers.map(
    (a) => `${a.propertyAnswer}${a.confirm ? ` (${a.confirm})` : ""}`
  );
  // Highest-and-best-use ranking for a farm/land parcel.
  const bestUse = args.placeIntelligence?.farmBestUse ?? null;
  const bestUseLines = bestUse
    ? [
        ...bestUse.options.map((o) => `[${o.tier.toUpperCase()}] ${o.name} — ${o.grossPerAcre} — ${o.why}`),
        // One-crop-vs-diversify verdict travels with the ranking in BOTH
        // export paths (founder request 2026-07-28).
        `[${bestUse.portfolioAdvice.verdict === "diversify" ? "DIVERSIFY" : "ONE ANCHOR SYSTEM"}] ${bestUse.portfolioAdvice.title}`,
        ...bestUse.portfolioAdvice.reasons.map((reason) => `• ${reason}`),
      ]
    : [];
  // Residential / commercial burning-questions answered FOR THIS PROPERTY
  // (null on the other profiles). Each renders as "Question — answer (Confirm: …)".
  const laneAnswerText = (answers: { question: string; answer: string; confirm: string | null }[]) =>
    answers.map((a) => `${a.question} — ${a.answer}${a.confirm ? ` (Confirm: ${a.confirm})` : ""}`);
  const residentialAnswerText = laneAnswerText(args.placeIntelligence?.residentialAnswers ?? []);
  const commercialAnswerText = laneAnswerText(args.placeIntelligence?.commercialAnswers ?? []);
  // Utilities, public-safety (link-out only), and planned-construction diligence.
  const localServices = args.placeIntelligence?.localServices ?? null;
  const localServicesLines = localServices
    ? [...localServices.utilities, ...localServices.publicSafety, ...localServices.plannedConstruction].map(
        (s) => `${s.category}: ${s.detail}${s.url ? ` (${s.urlLabel ?? "source"}: ${s.url})` : ""}`
      )
    : [];

  const teaserLines = tierIdentity.nextTierTeaser
    ? [
        ``,
        `## ${tierIdentity.nextTierTeaser.heading}`,
        `- ${tierIdentity.nextTierTeaser.intro}`,
        ...tierIdentity.nextTierTeaser.items.map((item) => `- ${item.name} — ${item.adds}`),
        `- ${tierIdentity.nextTierTeaser.closing}`,
      ]
    : [];

  const exportLines = [
    `# ${tierIdentity.displayName}`,
    `${tierIdentity.tagline}`,
    ``,
    `Tier: ${tier.label} (${tier.shortLabel})`,
    `Generated: ${branding.generatedDate}`,
    `Path: ${formatExplorationPath(branding.explorationPath)}`,
    `Advisory disclosure: ${branding.advisoryDisclosure}`,
    `Data rights: ${branding.dataRightsDisclosure}`,
    ``,
    `## Executive summary`,
    executiveSummary,
    ``,
    `## Verdict`,
    `- ${verdict.label}`,
    `- ${verdict.explanation}`,
    ``,
    `## Property snapshot`,
    ...propertySummary.map((line) => `- ${line}`),
    ``,
    `## Expected cost posture and capital frame`,
    ...conceptSummary.map((line) => `- ${line}`),
    ``,
    `## What supports the deal thesis`,
    ...(strengths.length > 0
      ? strengths
      : ["No meaningful supporting signals can be stated yet because the file is still too thin."]
    ).map((line) => `- ${line}`),
    ``,
    `## What could break the deal`,
    ...risks.map((line) => `- ${line}`),
    ``,
    `## Ranked financing lanes`,
    ...pathwayAnalysis.map((line) => `- ${line}`),
    ``,
    `## Property verification summary`,
    ...propertyVerificationSummary.map((line) => `- ${line}`),
    ``,
    `## Property-side criteria and external flags`,
    ...verifiedCriteria.map((line) => `- ${line}`),
    ``,
    ...(buyingProcess.length > 0
      ? [`## How this purchase actually works`, ...buyingProcess.map((line) => `- ${line}`), ``]
      : []),
    ...(financingProse
      ? [`## How people typically pay for a property like this`, `- ${financingProse}`, ``]
      : []),
    ...(bestUse
      ? [`## Best use for this parcel — ranked by the numbers`, `- ${bestUse.headline}`, ...bestUseLines.map((l) => `- ${l}`), ``]
      : []),
    ...(farmAnswerText.length > 0
      ? [`## Your farm questions — answered for this property`, ...farmAnswerText.map((l) => `- ${l}`), ``]
      : []),
    ...(residentialAnswerText.length > 0
      ? [`## Your questions — answered for this home`, ...residentialAnswerText.map((l) => `- ${l}`), ``]
      : []),
    ...(commercialAnswerText.length > 0
      ? [`## Your questions — answered for this property`, ...commercialAnswerText.map((l) => `- ${l}`), ``]
      : []),
    ...(localServicesLines.length > 0
      ? [`## Utilities, services & diligence links`, ...localServicesLines.map((l) => `- ${l}`), ``]
      : []),
    ...(honestUnknowns.length > 0
      ? [`## Honest unknowns — and how you'd find out`, ...honestUnknowns.map((line) => `- ${line}`), ``]
      : []),
    `## Basis and limits of this analysis`,
    ...explainabilityNotes.map((line) => `- ${line}`),
    ``,
    `## Optional deeper intake posture`,
    ...readinessSectionNotes.map((line) => `- ${line}`),
    ``,
    `## Questions the platform should already be asking`,
    ...platformQuestions.map((line) => `- ${line}`),
    ``,
    `## Diligence priorities before commitment`,
    ...nextMoves.map((line) => `- ${line}`),
    ``,
    `## Guided interview signals`,
    ...(interviewSignals.length > 0 ? interviewSignals.map((line) => `- ${line}`) : ["- No meaningful guided interview content captured yet."]),
    ...teaserLines,
    ``,
    `## Disclosure`,
    `- Advisory only.`,
    `- No approval, preapproval, eligibility determination, underwriting decision, or legal/regulatory reliance is authorized.`,
    `- Human review is still required before any customer or operator treats this as decision-grade.`,
    `- Borrowers pay nothing for baseline readiness support and export rights remain available.`,
  ];

  const htmlList = (lines: string[]) => lines.map((line) => `<li>${escapeHtml(line)}</li>`).join("");
  const section = (title: string, body: string) =>
    `<section class="report-section"><h2>${escapeHtml(title)}</h2>${body}</section>`;
  const decisionOnly = tier.id === "paid" || tier.id === "environmental"
    ? section("Optional deeper intake posture", `<ul>${htmlList(readinessSectionNotes)}</ul>`)
    : "";
  const strategyAndUp = tier.id !== "free"
    ? [
        section("Ranked financing lanes", `<ul>${htmlList(pathwayAnalysis)}</ul>`),
        section("Questions the platform should already be asking", `<ul>${htmlList(platformQuestions)}</ul>`),
      ].join("")
    : "";
  const placeBriefSections = [
    buyingProcess.length > 0
      ? section("How this purchase actually works", `<ul>${htmlList(buyingProcess)}</ul>`)
      : "",
    financingProse
      ? section("How people typically pay for a property like this", `<p>${escapeHtml(financingProse)}</p>`)
      : "",
    bestUse
      ? section("Best use for this parcel — ranked by the numbers", `<p>${escapeHtml(bestUse.headline)}</p><ul>${htmlList(bestUseLines)}</ul>`)
      : "",
    farmAnswerText.length > 0
      ? section("Your farm questions — answered for this property", `<ul>${htmlList(farmAnswerText)}</ul>`)
      : "",
    residentialAnswerText.length > 0
      ? section("Your questions — answered for this home", `<ul>${htmlList(residentialAnswerText)}</ul>`)
      : "",
    commercialAnswerText.length > 0
      ? section("Your questions — answered for this property", `<ul>${htmlList(commercialAnswerText)}</ul>`)
      : "",
    localServicesLines.length > 0
      ? section(
          "Utilities, services & diligence links",
          `<ul>${(localServices
            ? [...localServices.utilities, ...localServices.publicSafety, ...localServices.plannedConstruction]
            : []
          )
            .map(
              (s) =>
                `<li><strong>${escapeHtml(s.category)}:</strong> ${escapeHtml(s.detail)}${
                  s.url
                    ? ` <a href="${escapeHtml(s.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(
                        s.urlLabel ?? "source"
                      )} ↗</a>`
                    : ""
                }</li>`
            )
            .join("")}</ul>`
        )
      : "",
    honestUnknowns.length > 0
      ? section("Honest unknowns — and how you'd find out", `<ul>${htmlList(honestUnknowns)}</ul>`)
      : "",
  ].join("");
  const teaserSectionHtml = tierIdentity.nextTierTeaser
    ? section(
        tierIdentity.nextTierTeaser.heading,
        `<p>${escapeHtml(tierIdentity.nextTierTeaser.intro)}</p><ul>${htmlList(
          tierIdentity.nextTierTeaser.items.map((item) => `${item.name} — ${item.adds}`)
        )}</ul><p>${escapeHtml(tierIdentity.nextTierTeaser.closing)}</p>`
      )
    : "";
  const exportHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(branding.reportTitle)} - ${escapeHtml(args.context.title)}</title>
    <style>
      @page { margin: 0.65in; }
      body { margin: 0; font-family: Georgia, "Times New Roman", serif; color: #162033; background: #f7f8fb; }
      .report-shell { position: relative; max-width: 900px; margin: 0 auto; padding: 44px 44px 60px; background: #fff; overflow: hidden; }
      .report-shell::before { content: ""; position: absolute; inset: 0; background-image: url("${branding.compassWatermarkPath}"); background-repeat: no-repeat; background-position: center 180px; background-size: 520px; opacity: 0.08; pointer-events: none; }
      .report-shell::after { content: ""; position: absolute; right: 34px; top: 26px; width: 110px; height: 110px; background-image: url("${branding.emblemPath}"); background-repeat: no-repeat; background-size: contain; opacity: 0.12; pointer-events: none; }
      .report-content { position: relative; z-index: 1; display: grid; gap: 18px; }
      .brand-row { display: flex; justify-content: space-between; gap: 18px; align-items: flex-start; border-bottom: 1px solid #d7deea; padding-bottom: 18px; }
      .brand-row img.logo { width: 170px; height: auto; display: block; }
      .tier-chip { display: inline-flex; align-items: center; gap: 8px; border-radius: 999px; padding: 7px 12px; background: ${tierIdentity.accentSoft}; color: ${tierIdentity.ink}; font-size: 12px; font-weight: 700; border: 1px solid ${tierIdentity.accent}; }
      h1 { margin: 0; font-size: 34px; line-height: 1.08; color: ${tierIdentity.ink}; }
      h2 { margin: 0 0 8px; font-size: 17px; color: ${tierIdentity.accent}; letter-spacing: 0.03em; text-transform: uppercase; }
      .cover-badge { font-size: 11px; font-weight: 800; letter-spacing: 0.22em; color: ${tierIdentity.accent}; }
      .tagline { margin: 2px 0 0; font-size: 13px; color: #66758a; }
      .brand-row { border-bottom: ${tierIdentity.ruleStyle === "thick" ? `4px solid ${tierIdentity.accent}` : tierIdentity.ruleStyle === "double" ? `3px double ${tierIdentity.accent}` : `1px solid ${tierIdentity.accent}`} !important; }
      p, li { font-size: 14px; line-height: 1.62; }
      ul { margin: 0; padding-left: 20px; }
      .summary-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
      .card, .report-section { border: 1px solid #d7deea; border-radius: 16px; background: rgba(255,255,255,0.92); padding: 16px 18px; }
      .disclosure, .footer { color: #5d687a; }
      .footer { display: flex; justify-content: space-between; gap: 12px; align-items: center; font-size: 12px; border-top: 1px solid #d7deea; padding-top: 12px; }
      @media print { body { background: #fff; } .report-shell { max-width: none; margin: 0; } }
    </style>
  </head>
  <body>
    <article class="report-shell">
      <div class="report-content">
        <header class="brand-row">
          <div style="display:grid;gap:10px;">
            <img class="logo" src="${branding.logoPath}" alt="Furlong" />
            <span class="tier-chip">${tier.shortLabel} · ${tier.label}</span>
            <div><span class="cover-badge">${escapeHtml(tierIdentity.coverBadge)}</span><h1>${escapeHtml(tierIdentity.displayName)}</h1><p class="tagline">${escapeHtml(tierIdentity.tagline)}</p><p>${escapeHtml(args.context.title)}<br/>${escapeHtml(compactLocation(args.context))}</p></div>
          </div>
          <div style="display:grid;gap:8px;text-align:right;max-width:280px;">
            <p><strong>Generated:</strong> ${escapeHtml(branding.generatedDate)}</p>
            <p><strong>Path:</strong> ${escapeHtml(formatExplorationPath(branding.explorationPath))}</p>
            <p>${escapeHtml(tier.description)}</p>
          </div>
        </header>
        <section class="card"><h2>Executive summary</h2><p>${escapeHtml(executiveSummary)}</p></section>
        <section class="summary-grid">
          <div class="card"><h2>Verdict</h2><p><strong>${escapeHtml(verdict.label)}</strong><br/>${escapeHtml(verdict.explanation)}</p></div>
          <div class="card"><h2>Property snapshot</h2><ul>${htmlList(propertySummary)}</ul></div>
        </section>
        ${section("Expected cost posture and capital frame", `<ul>${htmlList(conceptSummary)}</ul>`)}
        ${section("What supports the deal thesis", `<ul>${htmlList(strengths.length > 0 ? strengths : ["No meaningful supporting signals can be stated yet because the file is still too thin."])}</ul>`)}
        ${section("What could break the deal", `<ul>${htmlList(risks)}</ul>`)}
        ${strategyAndUp}
        ${section("Property verification summary", `<ul>${htmlList(propertyVerificationSummary)}</ul>`)}
        ${section(
          tier.id === "environmental" ? "Environmental and site-side criteria" : "Property-side criteria and external flags",
          `<ul>${htmlList(verifiedCriteria)}</ul>`
        )}
        ${placeBriefSections}
        ${section("Basis and limits of this analysis", `<ul>${htmlList(explainabilityNotes)}</ul>`)}
        ${decisionOnly}
        ${section("Diligence priorities before commitment", `<ul>${htmlList(nextMoves)}</ul>`)}
        ${teaserSectionHtml}
        <section class="card disclosure"><h2>Disclosure</h2><p>${escapeHtml(branding.advisoryDisclosure)}</p><p>${escapeHtml(branding.dataRightsDisclosure)}</p><p>No approval, preapproval, eligibility determination, underwriting decision, or legal/regulatory reliance is authorized. Human review is still required before this becomes decision-grade. Borrowers pay nothing for baseline readiness support.</p><p>${escapeHtml(tierIdentity.footerLine)}</p></section>
        <footer class="footer"><span>${escapeHtml(branding.footerText)}</span><span>Watermarked FURLONG advisory export</span></footer>
      </div>
    </article>
  </body>
</html>`;

  return {
    branding,
    tier,
    verdict,
    executiveSummary,
    propertySummary,
    conceptSummary,
    strengths,
    risks,
    pathwayAnalysis,
    propertyVerificationSummary,
    verifiedCriteria,
    readinessSectionNotes,
    keyQuestions: platformQuestions,
    nextMoves,
    interviewSignals,
    explainabilityNotes,
    buyingProcess,
    honestUnknowns,
    financingProse,
    tierIdentity,
    exportHtml,
    exportText: exportLines.join("\n"),
  };
}

export function PropertyEvaluationWorkspace({
  context,
  tierPreviewMode,
  addressFirstFlow,
  placeIntelligence = null,
  chartVariant = "buyer",
  deepView = false,
  ownershipContext = null,
  listedPrice = null,
  similarHomes = [],
  startingLens = null,
  navigatorCaseContext = null,
}: {
  context: PropertyContext;
  tierPreviewMode: boolean;
  addressFirstFlow?: DiscoveryFlow | null;
  /** Server-computed snapshot place facts (spec 2026-07-15) — feeds the report's place-facts section. */
  placeIntelligence?: PropertyBriefIntelligence | null;
  /** Chart Table audience lens (buyer | environmental | finance | commercial). */
  chartVariant?: ChartVariant;
  /** Render the deeper-analysis workspace as the page (same-tab ?view=deep). */
  deepView?: boolean;
  /** Server-resolved snapshot slice for the ownership-cost model (founder
      direction 2026-07-17) — rates, county tax medians, state electricity. */
  ownershipContext?: OwnershipCostContext | null;
  /** Listed price from the canonical source record (server-resolved — the
      priceLabel param may carry only a band). Null → panel asks the visitor. */
  listedPrice?: number | null;
  /** Server-selected alternatives from the tracked government inventory. */
  similarHomes?: SimilarHomeLine[];
  /** Compass lane that opened this case. It guides the first view but never limits whole-property analysis. */
  startingLens?: string | null;
  /** Existing anonymous intelligence case context used only to preserve and enrich the same case. */
  navigatorCaseContext?: {
    caseId: string;
    displayName?: string | null;
    goal?: string | null;
    state?: string | null;
    customerTypes?: string[];
    intendedUses?: string[];
  } | null;
}) {
  const [navigator, setNavigator] = useState<NavigatorSnapshot | null>(null);
  // Visitor's answer to "what is this property?" — an imported address carries
  // no type, and the wrong default (a working farm read as a home) sends every
  // lane wrong (founder-caught on her own farm, 2026-07-18). Session-only.
  const [profileOverride, setProfileOverride] = useState<PropertyProfileId | null>(null);
  const [facts, setFacts] = useState<PropertyFactsResponse | null>(null);
  const [factsLoading, setFactsLoading] = useState(false);
  const effectiveListedPrice = facts?.propertyRecord?.price ?? listedPrice;
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [pdfBusy, setPdfBusy] = useState<"export" | "view" | null>(null);
  const [proformaBusy, setProformaBusy] = useState(false);
  const [proformaError, setProformaError] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [manualReviewBusy, setManualReviewBusy] = useState(false);
  const [manualReviewMessage, setManualReviewMessage] = useState<string | null>(null);
  const [manualReviewError, setManualReviewError] = useState<string | null>(null);
  const [manualPriceLabel, setManualPriceLabel] = useState("");
  const [persistedReleaseRows, setPersistedReleaseRows] = useState<Array<{
    releaseId: string;
    releasePayload: RecommendationReleaseRecord;
    historyPayload: RecommendationReleaseHistory;
    createdAt?: string | null;
  }>>([]);
  const [releaseHistoryLoading, setReleaseHistoryLoading] = useState(false);
  const [releaseHistoryError, setReleaseHistoryError] = useState<string | null>(null);
  const [releaseRecordBusy, setReleaseRecordBusy] = useState(false);
  const [releaseRecordMessage, setReleaseRecordMessage] = useState<string | null>(null);
  const [escalationAcknowledgeBusy, setEscalationAcknowledgeBusy] = useState(false);
  const [escalationAcknowledgeMessage, setEscalationAcknowledgeMessage] = useState<string | null>(null);
  const [pendingReleaseReviews, setPendingReleaseReviews] = useState<Array<{
    releaseId: string;
    attestationCycleId: string;
    currentActorAlreadyAttested: boolean;
    canCountersign: boolean;
    firstAttestedAt: string;
    expiresAt: string;
    freshnessState: "active" | "expired";
    urgencyState: "normal" | "due-soon" | "critical" | "expired";
    remainingSeconds: number;
    escalationRequired: boolean;
    escalationAcknowledged: boolean;
    acknowledgedByCurrentActor: boolean;
  }>>([]);
  // The report opens with its FULL chart already expanded (founder direction
  // 2026-07-20, superseding the earlier "one click behind": a report that doesn't
  // visibly open reads as broken). The summary card still leads; the complete
  // chart renders right below it — collapsible, but open by default.
  const [answers, setAnswers] = useState<DraftAnswers>({
    reportTier: "free",
    possibility: "",
    usePlan: "",
    capitalPlan: "",
    timing: "",
    requestedAmount: "",
    operatorExperience: "",
    revenueModel: "",
    renovationScope: "",
    ownershipPosture: "",
    documents: [],
  });
  const tierAccess = buildTierAccessMap(tierPreviewMode);
  const effectivePriceLabel = manualPriceLabel.trim() || context.priceLabel;
  const analysisContext: PropertyContext = {
    ...context,
    priceLabel: effectivePriceLabel,
  };
  const releaseSubjectType = "property-evaluation";
  const releaseSubjectKey = context.propertyId?.trim()
    || context.exactAddress?.trim()
    || [context.title, context.location].filter(Boolean).join(" · ").trim();

  useEffect(() => {
    if (!releaseSubjectKey) {
      setPersistedReleaseRows([]);
      return;
    }
    let canceled = false;
    const controller = new AbortController();
    setReleaseHistoryLoading(true);
    setReleaseHistoryError(null);
    void (async () => {
      try {
        const query = new URLSearchParams({
          subjectType: releaseSubjectType,
          subjectKey: releaseSubjectKey,
        });
        const response = await fetch(`/api/recommendation-releases?${query.toString()}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        const payload = await response.json() as {
          ok?: boolean;
          rows?: Array<{
            releaseId: string;
            releasePayload: RecommendationReleaseRecord;
            historyPayload: RecommendationReleaseHistory;
            createdAt?: string | null;
          }>;
          error?: string;
        };
        if (!response.ok || !payload.ok) throw new Error(payload.error || "Release history lookup failed.");
        if (!canceled) setPersistedReleaseRows(payload.rows ?? []);
      } catch (error) {
        if (!canceled && error instanceof Error && error.name !== "AbortError") {
          setReleaseHistoryError(error.message);
          setPersistedReleaseRows([]);
        }
      } finally {
        if (!canceled) setReleaseHistoryLoading(false);
      }
    })();
    return () => {
      canceled = true;
      controller.abort();
    };
  }, [releaseSubjectKey]);

  useEffect(() => {
    if (!releaseSubjectKey) {
      setPendingReleaseReviews([]);
      return;
    }
    let canceled = false;
    const query = new URLSearchParams({ subjectType: releaseSubjectType, subjectKey: releaseSubjectKey });
    const refreshPendingReviews = () => {
      void fetch(`/api/recommendation-releases/pending?${query.toString()}`, { cache: "no-store" })
        .then(async (response) => {
          if (response.status === 401 || response.status === 403) return { ok: false, rows: [] };
          return response.json() as Promise<{ ok?: boolean; rows?: Array<{ releaseId: string; attestationCycleId: string; currentActorAlreadyAttested: boolean; canCountersign: boolean; firstAttestedAt: string; expiresAt: string; freshnessState: "active" | "expired"; urgencyState: "normal" | "due-soon" | "critical" | "expired"; remainingSeconds: number; escalationRequired: boolean; escalationAcknowledged: boolean; acknowledgedByCurrentActor: boolean }> }>;
        })
        .then((payload) => {
          if (!canceled) setPendingReleaseReviews(payload.rows ?? []);
        })
        .catch(() => {
          if (!canceled) setPendingReleaseReviews([]);
        });
    };
    refreshPendingReviews();
    const refreshTimer = window.setInterval(refreshPendingReviews, 60_000);
    return () => { canceled = true; window.clearInterval(refreshTimer); };
  }, [releaseSubjectKey]);

  useEffect(() => {
    if (!context.propertyId) return;
    const saved = loadPropertyEvaluationDraft(context.propertyId);
    if (saved) {
      setAnswers((current) => ({ ...current, ...saved.answers }));
      setSavedAt(saved.updatedAt);
    }
  }, [context.propertyId]);

  useEffect(() => {
    if (!context.propertyId) {
      setFacts(null);
      return;
    }
    let canceled = false;
    setFactsLoading(true);
    // Cap the facts load so the workspace never spins forever if a live source
    // is slow/unreachable (founder-caught 2026-07-18).
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);
    const requestBody = {
      propertyId: context.propertyId,
      exactAddress: context.exactAddress,
      location: context.location,
      stateCode: context.stateCode,
      town: context.town,
      county: context.county,
      startingLens: startingLens ?? null,
      // The visitor's "what is this property?" declaration — the server
      // rebuilds the whole Place Brief in that shape (farm lanes for a
      // farm, never home-mortgage copy on a working farm).
      declaredPropertyType: profileOverride,
    };
    void (async () => {
      try {
        // The address-check surface fires this same request the moment the
        // address verifies (Tier 3b prefetch), so the answers are usually
        // already on their way — or here — when the workspace mounts.
        const prefetched = consumePropertyFactsPrefetch(requestBody);
        const data = prefetched
          ? ((await prefetched) as PropertyFactsResponse)
          : ((await (await fetch("/api/public/property-facts", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              signal: controller.signal,
              body: JSON.stringify(requestBody),
            })).json()) as PropertyFactsResponse);
        if (!canceled) setFacts(data);
      } catch {
        // Aborted or failed — leave facts null; the workspace renders from the
        // context it already has rather than hanging on the spinner.
        if (!canceled) setFacts(null);
      } finally {
        clearTimeout(timeout);
        if (!canceled) setFactsLoading(false);
      }
    })();
    return () => {
      canceled = true;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [context.propertyId, context.exactAddress, context.location, context.stateCode, context.town, context.county, profileOverride, startingLens]);

  async function submitSpecialBuildingReview() {
    setManualReviewBusy(true);
    setManualReviewError(null);
    setManualReviewMessage(null);
    try {
      const res = await fetch("/api/public/special-building-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: context.propertyId,
          title: context.title,
          location: context.location,
          exactAddress: context.exactAddress,
          propertyType: context.propertyType,
          sourceLabel: context.sourceLabel,
          currentLabel: context.currentLabel,
          listingUrl: context.listingUrl,
          salePosture: context.salePosture,
          importScreeningStatus: context.importScreeningStatus,
          importScreeningCategory: context.importScreeningCategory,
          importScreeningSummary: context.importScreeningSummary,
          importScreeningReasons: context.importScreeningReasons,
          manualReviewRequired: context.manualReviewRequired,
          manualReviewSummary: context.manualReviewSummary,
        }),
      });
      const data = (await res.json()) as SpecialBuildingReviewResponse;
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "The special building review could not be queued.");
      }
      setManualReviewMessage(data.message || "Special building review was submitted for manual handling.");
    } catch (error) {
      setManualReviewError(error instanceof Error ? error.message : "The special building review could not be queued.");
    } finally {
      setManualReviewBusy(false);
    }
  }

  if (addressFirstFlow && !context.exactAddress) {
    return (
      <section style={{ display: "grid", gap: 22 }}>
        <section
          aria-label="Address-first analysis workspace"
          style={{
            display: "grid",
            gap: 0,
            border: "1px solid #d7deea",
            borderRadius: 22,
            background: "linear-gradient(135deg, #f8fafc, #ffffff 58%, #f7fbff)",
            overflow: "hidden",
          }}
        >
          <div style={{ display: "grid", gap: 18, padding: "22px 24px 24px" }}>
            <div style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: 0.08, textTransform: "uppercase", color: "#0f766e" }}>
                Property-first analysis
              </span>
              <strong style={{ fontSize: 26, color: "#101a2b", lineHeight: 1.08 }}>
                Start with the property. Furlong will build the first-pass analysis from there.
              </strong>
              {startingLens && (
                <span style={{ fontSize: 13.5, color: "#4d596d", lineHeight: 1.6 }}>
                  You entered through <strong>{startingLens.replace(/-/g, " ")}</strong>. We will use that as the starting lens, then test the property across every plausible use, market, cost, environmental, and financing pathway.
                </span>
              )}
            </div>
            <SavedDraftsRail />
            <PlaceFirstDiscovery flow={addressFirstFlow} embedded />
            {/* ONE front door (founder feedback 2026-07-16): the address form
                above is how a property comes in; paste/upload is the same task,
                so it lives here folded, not as a second open form. */}
            <details style={{ ...detailsStyle, background: "#ffffff", padding: "12px 16px" }}>
              <summary style={{ ...summaryStyle, fontSize: 13.5 }}>
                Have a listing link or a screenshot instead? Paste or upload it
              </summary>
              <div style={{ paddingTop: 12 }}>
                <PropertyImportLaunchpadEmbedded />
              </div>
            </details>
          </div>
        </section>
      </section>
    );
  }

  if (context.importScreeningStatus === "reroute") {
    return (
      <section style={{ display: "grid", gap: 22 }}>
        <section
          aria-label="Selected property evaluation workspace"
          style={{
            display: "grid",
            gap: 0,
            border: "1px solid #d7deea",
            borderRadius: 22,
            background: "linear-gradient(135deg, #f8fafc, #ffffff 58%, #f7fbff)",
            overflow: "hidden",
          }}
        >
          <div style={{ padding: "14px 24px", borderBottom: "1px solid #e5ebf3" }}>
            <details style={{ ...detailsStyle, background: "transparent", border: "none", padding: 0 }}>
              <summary style={{ ...summaryStyle, fontSize: 13.5 }}>
                Evaluating a different property? Paste a link or upload a listing
              </summary>
              <div style={{ paddingTop: 12 }}>
                <PropertyImportLaunchpadEmbedded />
              </div>
            </details>
          </div>
          <div style={{ display: "grid", gap: 18, padding: "22px 24px 24px" }}>
            <div style={{ display: "grid", gap: 8 }}>
              <span style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: 0.08, textTransform: "uppercase", color: "#854F0B" }}>
                {context.importScreeningCategory === "restricted-asset" ? "Restricted asset routing" : "Special asset routing"}
              </span>
              <strong style={{ fontSize: 30, color: "#101a2b", lineHeight: 1.04 }}>
                {context.title}
              </strong>
              <span style={{ fontSize: 14.5, color: "#4d596d", lineHeight: 1.6 }}>
                {context.location}
                {context.exactAddress ? ` · ${context.exactAddress}` : ""}
              </span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              <span style={pillGold}>{context.propertyType}</span>
              <span style={pillGray}>{context.salePosture ?? "sale posture unknown"}</span>
              {context.currentLabel && <span style={pillBlue}>{context.currentLabel}</span>}
              {context.manualReviewRequired && <span style={pillGold}>Manual review required</span>}
            </div>
            <section style={{ ...panelStyle, background: "#fffaf0", borderColor: "#ead8aa" }}>
              <div style={{ display: "grid", gap: 5 }}>
                <strong style={{ fontSize: 20, color: "#162033" }}>
                  {context.importScreeningSummary ?? "This import was routed out of the ordinary property-analysis flow."}
                </strong>
                <span style={{ fontSize: 13.5, color: "#5d687a", lineHeight: 1.65 }}>
                  This page is intentionally not treating this asset like a normal for-sale listing. Furlong should stay in a high-level public-disposition and governance posture here until a verified ordinary listing or official disposition source says otherwise.
                </span>
                {context.manualReviewSummary && (
                  <span style={{ fontSize: 13.5, color: "#854F0B", lineHeight: 1.65 }}>
                    {context.manualReviewSummary}
                  </span>
                )}
              </div>
              <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
                <div style={factCard}>
                  <strong style={{ fontSize: 13.5, color: "#162033" }}>Why it was rerouted</strong>
                  <div style={{ display: "grid", gap: 6 }}>
                    {context.importScreeningReasons.length > 0 ? context.importScreeningReasons.map((line) => (
                      <span key={line} style={{ fontSize: 12.5, color: "#3b475a", lineHeight: 1.55 }}>{line}</span>
                    )) : (
                      <span style={{ fontSize: 12.5, color: "#3b475a", lineHeight: 1.55 }}>
                        The import triggered special-asset posture and needs high-level feasibility review rather than ordinary listing analysis.
                      </span>
                    )}
                  </div>
                </div>
                <div style={factCard}>
                  <strong style={{ fontSize: 13.5, color: "#162033" }}>What Furlong can do here</strong>
                  <div style={{ display: "grid", gap: 6 }}>
                    {[
                      "Assess whether there is a real public-disposition or redevelopment path at all.",
                      "Frame lawful reuse, governance boundaries, environmental diligence, and site constraints.",
                      "Keep out ownership, operator, active-status, access, and vulnerability analysis.",
                    ].map((line) => (
                      <span key={line} style={{ fontSize: 12.5, color: "#3b475a", lineHeight: 1.55 }}>{line}</span>
                    ))}
                  </div>
                </div>
                <div style={factCard}>
                  <strong style={{ fontSize: 13.5, color: "#162033" }}>What needs to happen next</strong>
                  <div style={{ display: "grid", gap: 6 }}>
                    {[
                      context.listingUrl
                        ? "Review the public source and confirm whether it is an actual official disposition or redevelopment path."
                        : "Bring in an official public auction, surplus, redevelopment, or authorized listing source before treating this as a live opportunity.",
                      context.manualReviewRequired
                        ? "After sale posture is verified, route this through manual Furlong review rather than automated analysis."
                        : "Only after that should the platform decide whether ordinary property analysis is appropriate.",
                    ].map((line) => (
                      <span key={line} style={{ fontSize: 12.5, color: "#3b475a", lineHeight: 1.55 }}>{line}</span>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
                {context.listingUrl && (
                  <Link href={context.listingUrl} style={{ color: "#185FA5", textDecoration: "underline", fontWeight: 700 }}>
                    See the current price on the official listing ↗
                  </Link>
                )}
                {context.manualReviewRequired && (
                  <button type="button" onClick={() => void submitSpecialBuildingReview()} disabled={manualReviewBusy} style={actionButtonPrimary}>
                    {manualReviewBusy ? "Submitting manual review..." : "Submit Special Building Manual Review"}
                  </button>
                )}
              </div>
              {(manualReviewMessage || manualReviewError) && (
                <div style={{ display: "grid", gap: 6 }}>
                  {manualReviewMessage && (
                    <span style={{ fontSize: 12.5, color: "#0f6e56", lineHeight: 1.55 }}>
                      {manualReviewMessage}
                    </span>
                  )}
                  {manualReviewError && (
                    <span style={{ fontSize: 12.5, color: "#a12626", lineHeight: 1.55 }}>
                      {manualReviewError}
                    </span>
                  )}
                </div>
              )}
            </section>
            <section style={panelStyle}>
              <div style={{ display: "grid", gap: 5 }}>
                <strong style={{ fontSize: 18, color: "#162033" }}>Restricted special-asset interview</strong>
                <span style={{ fontSize: 13, color: "#5d687a", lineHeight: 1.55 }}>
                  This stays in high-level feasibility and public-disposition posture only.
                </span>
              </div>
              <FurlongNavigator initialMessage={context.initialMessage} existingCase={navigatorCaseContext} onStateChange={setNavigator} />
            </section>
          </div>
        </section>
      </section>
    );
  }

  const financingResult = evaluateFinancingPathways({
    location: {
      country: "US",
      state: analysisContext.stateCode,
      county: analysisContext.county,
    },
    farmTypes: inferredFarmTypes(analysisContext.propertyType, analysisContext.categoryLabel, answers.possibility),
    goals: inferredGoals(context.pathwayList, answers.possibility, answers.usePlan),
    requestedAmount: requestedAmountFrom(answers.requestedAmount),
    requestedPrograms: analysisContext.pathwayList,
    documents: lowerList(answers.documents),
    metadata: {
      purpose: [answers.capitalPlan, answers.usePlan, answers.revenueModel].filter(Boolean).join(" · ") || null,
      timing: answers.timing || null,
      propertyType: analysisContext.propertyType,
      propertyId: analysisContext.propertyId,
    },
  });

  const readinessResult = assessBorrowerReadiness({
    financing: {
      location: {
        country: "US",
        state: analysisContext.stateCode,
        county: analysisContext.county,
      },
      farmTypes: inferredFarmTypes(analysisContext.propertyType, analysisContext.categoryLabel, answers.possibility),
      goals: inferredGoals(analysisContext.pathwayList, answers.possibility, answers.usePlan),
      requestedAmount: requestedAmountFrom(answers.requestedAmount),
      requestedPrograms: analysisContext.pathwayList,
      documents: lowerList(answers.documents),
      metadata: {
        purpose: [answers.capitalPlan, answers.usePlan, answers.revenueModel].filter(Boolean).join(" · ") || null,
        timing: answers.timing || null,
        propertyType: analysisContext.propertyType,
        propertyId: analysisContext.propertyId,
      },
    },
    documents: {
      requestedCount: DOCUMENT_OPTIONS.length,
      receivedCount: answers.documents.length,
      pendingReviewCount: answers.documents.length > 0 ? 1 : 0,
    },
    discovery: {
      interestsSelected: [
        answers.possibility,
        answers.usePlan,
        answers.capitalPlan,
        answers.operatorExperience,
        answers.revenueModel,
        answers.renovationScope,
        answers.ownershipPosture,
      ].filter((value) => value.trim().length > 0).length,
      advisoryViews: userTurns(navigator?.turns ?? []).length,
    },
    dataRights: {
      portabilityRequested: false,
      accessRequestSubmitted: false,
    },
  });

  const topPathways = rankPropertyPathways({
    context: analysisContext,
    answers,
    pathways: financingResult.pathways,
  }).slice(0, 3);
  const verifiedPrograms = facts?.verifiedPrograms ?? [];
  const verification = facts?.verification;
  const verificationPalette = verificationTone(verification?.status);
  const verificationSourceChecks = verification
    ? [
        {
          label: "Opportunity Zone",
          active: verification.liveChecks.opportunityZoneActivated,
          hit: Boolean(facts?.placeFacts?.opportunityZone),
          detail: facts?.placeFacts?.opportunityZone
            ? `Tract ${facts.placeFacts.opportunityZone.tractId}`
            : verification.liveChecks.opportunityZoneActivated
              ? "Checked against live OZ source"
              : "Live source offline",
        },
        {
          label: "NMTC",
          active: verification.liveChecks.nmtcActivated,
          hit: Boolean(facts?.placeFacts?.nmtc),
          detail: facts?.placeFacts?.nmtc
            ? `Tract ${facts.placeFacts.nmtc.tractId}`
            : verification.liveChecks.nmtcActivated
              ? "Checked against live NMTC tract source"
              : "Live source offline",
        },
        {
          label: "HUBZone",
          active: verification.liveChecks.hubzoneActivated,
          hit: Boolean(facts?.placeFacts?.hubzone),
          detail: facts?.placeFacts?.hubzone
            ? `${facts.placeFacts.hubzone.hubzoneType} · ${facts.placeFacts.hubzone.geoid}`
            : verification.liveChecks.hubzoneActivated
              ? "Checked against live SBA source"
              : "Live source offline",
        },
        {
          label: "Flood",
          active: verification.liveChecks.floodActivated,
          hit: Boolean(facts?.placeFacts?.flood),
          detail: facts?.placeFacts?.flood
            ? `FEMA zone ${facts.placeFacts.flood.floodZone}`
            : verification.liveChecks.floodActivated
              ? "Checked against live FEMA source"
              : "Live source offline",
        },
        {
          label: "Historic",
          active: verification.liveChecks.historicActivated,
          hit: Boolean(facts?.placeFacts?.historic),
          detail: facts?.placeFacts?.historic
            ? facts.placeFacts.historic.historicName
              ? facts.placeFacts.historic.historicName
              : "National Register area"
            : verification.liveChecks.historicActivated
              ? "Checked against live NPS source"
              : "Live source offline",
        },
      ]
    : [];
  const verificationDealSignals = verification
    ? [
        verifiedPrograms.length > 0
          ? `${verifiedPrograms.length} property-side designation or program signal(s) were independently verified and can be used to strengthen the property memo.`
          : verification.status === "partial"
            ? "The portal completed public-source checks, but no positive designation or place-based program support was confirmed yet."
            : null,
        facts?.placeFacts?.flood
          ? `Flood exposure is not theoretical here: FEMA returned Zone ${facts.placeFacts.flood.floodZone}, which should directly affect insurance, resilience scope, and lender diligence.`
          : null,
        facts?.placeFacts?.historic
          ? `Historic context is live on this address, which can support rehabilitation-oriented pathways but also raises design, timing, and review discipline.`
          : null,
        facts?.placeFacts?.hubzone
          ? "HUBZone status was recovered from a live SBA source, which improves the usefulness of this address for small-business contracting and related planning."
          : null,
        facts?.placeFacts?.nmtc
          ? "NMTC tract qualification was confirmed from the live CDFI tract source, which strengthens redevelopment and community-investment positioning."
          : null,
        facts?.placeFacts?.opportunityZone
          ? "Opportunity Zone status was confirmed from a live tract lookup, so that designation can be treated as real rather than speculative."
          : null,
      ].filter((line): line is string => Boolean(line))
    : [];
  const verificationWarnings = verification
    ? [...verification.restrictions, ...verification.warnings]
    : [];
  const sourceVerification = sourceVerificationCopy(context);
  const sourceCandidateNote = sourceCandidateCopy(context);
  const immediateSuitability = buildImmediateSuitability({
    context: analysisContext,
    topPathways,
    verifiedPrograms,
    facts,
  });
  const assetClass = deriveAssetClassFromContext(analysisContext);
  const budgetExpectations = buildBudgetExpectations(analysisContext);
  const topProgramRanks = buildPropertyFirstProgramRanking({
    context: analysisContext,
    assetClass,
    verifiedPrograms,
    facts,
  }).slice(0, 4);
  const defaultQuestions = buildQuestionsYouWouldNormallyAsk({
    context: analysisContext,
    answers,
    facts,
    topProgramRanks,
  });
  // Map-selected properties receive the Place Brief as a server prop; manually
  // typed addresses get it back from the property-facts API (geocode-derived).
  // For imported ids the API brief is authoritative — a property-keyed server
  // brief can only be empty/negative for an address with no canonical record.
  const basePlaceIntelligence = context.propertyId?.startsWith("imported:")
    ? facts?.placeIntelligence ?? placeIntelligence ?? null
    : placeIntelligence ?? facts?.placeIntelligence ?? null;
  // Acreage is a foundational property fact for every lane, not merely a farm
  // classifier input. The property-facts API already carries acreageText; promote
  // it into the customer-visible evidence whenever the source brief omitted it.
  const effectivePlaceIntelligence = (() => {
    if (!basePlaceIntelligence || !facts?.propertyRecord?.acreageText) return basePlaceIntelligence;
    const alreadyVisible = basePlaceIntelligence.verifiedFacts.some((fact) =>
      /size|acreage|land area|parcel and conveyance profile/i.test(fact.label)
    );
    if (alreadyVisible) return basePlaceIntelligence;
    return {
      ...basePlaceIntelligence,
      verifiedFacts: [
        {
          label: "Land area",
          value: facts.propertyRecord.acreageText,
          text: `The matched property record reports ${facts.propertyRecord.acreageText} of land. Acreage affects value, usable layout, setbacks, operating capacity, and the financial model regardless of whether the property is residential, agricultural, or commercial.`,
          provenance: "Source: matched canonical property record; county parcel geometry and recorded plat remain controlling",
          tone: "neutral" as const,
        },
        ...basePlaceIntelligence.verifiedFacts,
      ],
    };
  })();
  // Canonical property profile (axis 1) — the brief's server classification
  // wins; fall back to classifying the context type for older API payloads.
  // The VISITOR'S declaration wins over any machine classification — the
  // owner knows it's a working farm; the classifier can only read type text.
  const importedProperty = context.propertyId?.startsWith("imported:") === true;
  const genericImportedType = /^(?:place|property|imported|unknown|not specified|place-led property)$/i.test((analysisContext.propertyType ?? "").trim());
  const automaticTypeEvidenceAvailable = !importedProperty || Boolean(
    facts?.propertyRecord?.rawPropertyStyle ||
    facts?.propertyRecord?.acreageText ||
    (analysisContext.propertyType && !genericImportedType)
  );
  const propertyClassificationAvailable = automaticTypeEvidenceAvailable || profileOverride !== null;
  const explicitImportedProfile = importedProperty && analysisContext.propertyType && !genericImportedType
    ? classifyPropertyProfile({
        propertyType: analysisContext.propertyType,
        description: analysisContext.description ?? null,
        acreageText: facts?.propertyRecord?.acreageText ?? null,
      })
    : null;
  const workspaceProfile = profileOverride
    ? profileById(profileOverride)
    : explicitImportedProfile ?? effectivePlaceIntelligence?.profile ??
      classifyPropertyProfile({
        propertyType: analysisContext.propertyType,
        description: analysisContext.description ?? null,
        acreageText: facts?.propertyRecord?.acreageText ?? null,
      });
  const answerCard = buildAnswerCard({
    context: analysisContext,
    restrictionsPresent: (facts?.verification?.restrictions?.length ?? 0) > 0,
  });
  const answerChips = effectivePlaceIntelligence?.chips ?? [];
  const baseHref = buildPropertyAnalysisHref({
    propertyId: context.propertyId ?? "",
    title: context.title,
    location: context.location,
    propertyType: context.propertyType,
    priceLabel: context.priceLabel,
    vintage: context.vintage ?? "",
    sourceLabel: context.sourceLabel,
    pathways: context.pathwayList,
    town: context.town,
    county: context.county,
    state: context.stateCode,
    sourceId: context.sourceId,
    exactAddress: context.exactAddress,
    listingUrl: context.listingUrl,
    currentLabel: context.currentLabel,
  });
  const deepHref = `${baseHref}&view=deep`;
  const chartHref = baseHref;
  const report = buildReportModel({
    context: analysisContext,
    answers,
    navigator,
    facts,
    placeIntelligence: effectivePlaceIntelligence,
    topProgramRanks,
    budgetExpectations,
    defaultQuestions,
    immediateSuitability,
    readinessResult,
    topPathways,
    verifiedPrograms,
  });
  const selectedTierAccess = tierAccess[answers.reportTier];
  const selectedTierUnlocked = selectedTierAccess.unlocked;
  const previewSections: PreviewSection[] = [
    {
      title: "Property snapshot",
      lines: report.propertySummary,
    },
    {
      title: "Expected cost posture and capital frame",
      lines: report.conceptSummary,
    },
    {
      title: "What supports the deal thesis",
      lines: report.strengths,
      emptyFallback:
        "No meaningful supporting signals can be stated yet because the file is still too thin.",
    },
    {
      title: "What could break the deal",
      lines: report.risks,
    },
    {
      title: "Ranked financing lanes",
      lines: answers.reportTier === "free" ? report.pathwayAnalysis.slice(0, 1) : report.pathwayAnalysis,
    },
    {
      title: "Property verification summary",
      lines: report.propertyVerificationSummary,
    },
    ...(answers.reportTier === "free"
      ? []
      : [
          {
            title: "Questions the platform should already be asking",
            lines: report.keyQuestions,
          },
        ]),
    ...((answers.reportTier === "paid" || answers.reportTier === "environmental")
      ? [
          {
            title: "Optional deeper intake posture",
            lines: report.readinessSectionNotes,
          },
        ]
      : []),
    {
      title: answers.reportTier === "environmental"
        ? "Environmental and site-side criteria"
        : "Property-side criteria and external flags",
      lines: report.verifiedCriteria,
    },
    ...(report.buyingProcess.length > 0
      ? [
          {
            title: "How this purchase actually works",
            lines: report.buyingProcess,
          },
        ]
      : []),
    ...(report.financingProse
      ? [
          {
            title: "How people typically pay for a property like this",
            lines: [report.financingProse],
          },
        ]
      : []),
    ...(report.honestUnknowns.length > 0
      ? [
          {
            title: "Honest unknowns — and how you'd find out",
            lines: report.honestUnknowns,
          },
        ]
      : []),
    {
      title: "Basis and limits of this analysis",
      lines: report.explainabilityNotes,
    },
    {
      title: "Diligence priorities before commitment",
      lines: report.nextMoves,
    },
    // FREE TIER: the honest upgrade preview — named sections, substance-first,
    // no prices (tier economics founder-gated). The reason to come back.
    ...(report.tierIdentity.nextTierTeaser
      ? [
          {
            title: report.tierIdentity.nextTierTeaser.heading,
            lines: [
              report.tierIdentity.nextTierTeaser.intro,
              ...report.tierIdentity.nextTierTeaser.items.map(
                (item) => `${item.name} — ${item.adds}`
              ),
              report.tierIdentity.nextTierTeaser.closing,
            ],
          },
        ]
      : []),
  ];
  const visiblePreviewSections = selectedTierUnlocked
    ? previewSections
    : [
        {
          title: "Tier access",
          lines: [
            `${report.tier.label} is not unlocked in this preview.`,
            selectedTierAccess.detail,
            `The free brief stays fully visible and exportable either way.`,
          ],
        },
      ];
  const headlinePreviewSections = visiblePreviewSections.slice(0, 3);

  function updateAnswer<K extends keyof DraftAnswers>(key: K, value: DraftAnswers[K]) {
    setAnswers((current) => ({ ...current, [key]: value }));
  }

  function toggleDocument(value: string) {
    setAnswers((current) => ({
      ...current,
      documents: current.documents.includes(value)
        ? current.documents.filter((item) => item !== value)
        : [...current.documents, value],
    }));
  }

  function saveDraft() {
    if (!context.propertyId) return;
    const updatedAt = new Date().toISOString();
    savePropertyEvaluationDraft({
      propertyId: context.propertyId,
      updatedAt,
      // Enough to list + resume this draft weeks later — the analysis URL
      // carries only property context, never the visitor's answers.
      resume: { title: context.title, location: context.location, href: baseHref },
      answers,
    });
    setSavedAt(updatedAt);
  }

  // AUTOSAVE (founder direction 2026-07-29): the on-device draft saves itself
  // a moment after any answer changes — the "Save draft" button is gone and
  // nothing the visitor typed is ever lost. Device-only, zero PII, same
  // storage as before.
  useEffect(() => {
    if (!context.propertyId) return;
    const timer = window.setTimeout(saveDraft, 1_200);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers, context.propertyId]);

  async function requestReportPdf() {
    if (!selectedTierUnlocked) {
      setPdfError(`${report.tier.label} is not unlocked on this screen yet.`);
      return null;
    }
    setPdfError(null);
    const fileStem = `${context.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "property-evaluation"}-${report.tier.id}`;
    try {
      // The PDF route requires a short-lived attestation minted from the
      // IDENTICAL report payload (digest + context key must match), so build
      // the payload once, mint, then export.
      const reportPayload = {
            branding: report.branding,
            tier: report.tier,
            context: {
              propertyId: context.propertyId ?? null,
              title: analysisContext.title,
              location: analysisContext.location,
              exactAddress: analysisContext.exactAddress,
              priceLabel: analysisContext.priceLabel,
              propertyType: analysisContext.propertyType,
              sourceLabel: analysisContext.sourceLabel,
              currentLabel: analysisContext.currentLabel,
              importScreeningStatus: analysisContext.importScreeningStatus,
              importScreeningCategory: analysisContext.importScreeningCategory,
              salePosture: analysisContext.salePosture,
              manualReviewRequired: analysisContext.manualReviewRequired,
            },
            verdict: report.verdict,
            executiveSummary: report.executiveSummary,
            propertySummary: report.propertySummary,
            conceptSummary: report.conceptSummary,
            strengths: report.strengths,
            risks: report.risks,
            pathwayAnalysis: report.pathwayAnalysis,
            propertyVerificationSummary: report.propertyVerificationSummary,
            verifiedCriteria: report.verifiedCriteria,
            readinessSectionNotes: report.readinessSectionNotes,
            keyQuestions: report.keyQuestions,
            nextMoves: report.nextMoves,
            includedSections: buildIncludedSections(answers.reportTier),
            explainabilityNotes: report.explainabilityNotes,
            buyingProcess: report.buyingProcess,
            honestUnknowns: report.honestUnknowns,
            financingProse: report.financingProse,
            // Lane burning-questions answered for THIS property — the signed
            // PDF carries the same answers the web report shows (Tier 3).
            laneAnswers: (() => {
              const fmt = (answers: { question: string; answer: string; confirm: string | null }[]) =>
                answers.map((a) => `${a.question} — ${a.answer}${a.confirm ? ` (Confirm: ${a.confirm})` : ""}`);
              const farm = (effectivePlaceIntelligence?.farmEnterpriseAnswers ?? []).map(
                (a) => `${a.propertyAnswer}${a.confirm ? ` (${a.confirm})` : ""}`
              );
              if (farm.length > 0) return { title: "Your Farm Questions — Answered for This Property", lines: farm };
              const residential = fmt(effectivePlaceIntelligence?.residentialAnswers ?? []);
              if (residential.length > 0) return { title: "Your Questions — Answered for This Home", lines: residential };
              const commercial = fmt(effectivePlaceIntelligence?.commercialAnswers ?? []);
              if (commercial.length > 0) return { title: "Your Questions — Answered for This Property", lines: commercial };
              return null;
            })(),
            placeFacts: (effectivePlaceIntelligence?.verifiedFacts ?? [])
              // Education facts stay in the farm report too (founder 2026-07-29:
              // the Education tab promises them on every lane); the farm PDF
              // still drops the residential-flavored context lines below.
              .filter((fact) => workspaceProfile.id !== "farm" || !/broadband|airport|flight path|rental context|hud|daily-life|crime/i.test(fact.label))
              .map((fact) => ({
                label: fact.label,
                value: fact.value,
                source: fact.provenance.replace(/^Source:\s*/i, "").split("·")[0].trim(),
              })),
            diligenceCosts: effectivePlaceIntelligence?.diligenceCosts ?? [],
            ownershipCosts:
              effectiveListedPrice != null &&
              ownershipContext &&
              chartVariant !== "finance" &&
              profileUsesResidentialLanes(workspaceProfile.id) &&
              workspaceProfile.id !== "farm"
                ? formatOwnershipCostsForPdf({
                    listedPrice: effectiveListedPrice,
                    ownershipContext,
                    isHome: isResidentialHomeContext(analysisContext),
                    farmShaped: false,
                    farmMode: false,
                  })
                : undefined,
            agriculturalProForma: (() => {
              if (workspaceProfile.id !== "farm" || effectiveListedPrice == null || !ownershipContext) return undefined;
              const acreage = facts?.propertyRecord?.offeredAcreage ?? (Number.parseFloat(facts?.propertyRecord?.acreageText ?? "") || null);
              if (!acreage) return undefined;
              const rate = ownershipContext.fsa?.ownershipDirectPct ?? ownershipContext.rates.rate30;
              const annualDebtService = effectiveListedPrice * 0.8 * (rate / 100) / (1 - Math.pow(1 + rate / 100, -40));
              const model = optimizeAgriculturalOpportunities({ acres: acreage, purchasePrice: effectiveListedPrice, debtService: annualDebtService, waterScore: 70, laborCapacity: 55, capitalCapacity: 55, marketAccess: 60, gridEvidence: false, solarZoningEvidence: false });
              const dollars = (value: number) => `$${Math.round(value).toLocaleString("en-US")}`;
              return {
                scopeLine: `${acreage.toLocaleString("en-US", { maximumFractionDigits: 2 })} acres screened at ${dollars(effectiveListedPrice)} across agricultural, livestock, specialty-crop, controlled-environment, renewable-energy, storage, leasing, and diversified-use candidates. Rankings are assumptions until site and operator evidence is attached.`,
                acreageRows: model.ranked.slice(0, 8).map((item, index) => ({ label: `${index + 1}. ${item.label}`, value: `${item.fit.toFixed(0)}/100 fit · ${item.usedAcres.toFixed(1)} acres modeled · ${item.eligible ? dollars(item.noi) + " annual NOI" : "blocked pending feasibility evidence"}` })),
                operatingRows: model.diversified.length ? model.diversified.map((item) => ({ label: `${Math.round(item.portfolioShare * 100)}% ${item.label}`, value: `${dollars(item.noi * item.portfolioShare)} weighted annual NOI` })) : [{ label: "Diversified portfolio", value: "No feasible portfolio until constraints are resolved" }],
                debtRows: [
                  { label: "Illustrative annual debt service", value: dollars(annualDebtService) },
                  { label: "Highest-ranked diversified NOI", value: dollars(model.portfolioNoi) },
                  { label: "Diversified DSCR", value: `${model.portfolioDscr?.toFixed(2) ?? "—"}x against a 1.25x screening threshold` },
                  { label: "Energy-use treatment", value: "Solar, agrivoltaics, and battery storage receive no credited revenue until zoning and grid/interconnection evidence is present." },
                ],
                assumptions: [model.warning, "Opportunity economics are editable screening assumptions, not appraisals, bids, contracts, or eligibility findings.", "The selected best use can be singular or diversified; the optimizer does not privilege commodity crops."],
                readiness: [
                  "NRCS soils, capability classes, drainage, wetlands, and productive-acre delineation",
                  "FSA acreage/base history, APH, conservation obligations, and crop-insurance records",
                  "Water supply, irrigation capacity, nutrient-management and waste-handling constraints",
                  "Labor, operator skill, equipment, buildings, working capital, and market/offtake capacity",
                  "Zoning and permits for livestock, poultry, greenhouse, agritourism, solar, agrivoltaics, or battery storage",
                  "Utility territory, substation distance, hosting capacity, interconnection queue, and offtake terms",
                  "Enterprise-specific budgets, contracts, price scenarios, and downside sensitivities",
                ],
              };
            })(),
            compensationTransparency: buildRealEstateCompensationTransparency({
              ...emptyRealEstateCompensationInput(),
              jurisdiction: analysisContext.location || null,
            }),
            similarHomes: similarHomes.length
              ? similarHomes.map((home) => ({
                  title: home.title,
                  detail:
                    `${home.priceLabel}` +
                    (home.comparison === "lower" ? " (less than this one)" : home.comparison === "higher" ? " (more than this one)" : home.comparison === "similar" ? " (about the same)" : "") +
                    ` · ${home.location}` +
                    (home.distanceMiles != null ? ` · ~${home.distanceMiles} mi away` : "") +
                    ` · ${home.sourceLabel}${home.isCurrent ? "" : ` · ${home.vintage}`}` +
                    ((home.signals?.length ?? 0) > 0 ? ` · ${home.signals?.join(" · ")}` : ""),
                }))
              : undefined,
            customerRights: buildCustomerRightsSummary(),
            humanReviewBoundary: buildHumanReviewBoundary({
              tier: { id: answers.reportTier, label: report.tier.label },
              answers,
              readinessMissing: contextualMissingItems(readinessResult.missingItems, analysisContext, answers),
            }),
      };

      const tokenRes = await fetch("/api/public/property-report-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ report: reportPayload }),
      });
      const tokenBody = (await tokenRes.json().catch(() => null)) as
        | { ok?: boolean; token?: string; error?: string }
        | null;
      if (!tokenRes.ok || !tokenBody?.ok || !tokenBody.token) {
        throw new Error(
          tokenBody?.error ||
            `The report attestation service returned HTTP ${tokenRes.status}${tokenRes.statusText ? ` (${tokenRes.statusText})` : ""} — try again in a moment; if it persists, this exact message is what to report.`
        );
      }

      const res = await fetch("/api/public/property-report-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: `${fileStem}.pdf`,
          report: reportPayload,
          token: tokenBody.token,
        }),
      });
      if (!res.ok) {
        const failureText = await res.text();
        throw new Error(failureText || "The report service returned an unexpected error.");
      }
      const blob = await res.blob();
      return { blob, fileStem };
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : "The report could not be prepared right now.";
      setPdfError(message);
      return null;
    }
  }

  function viewPdfTab() {
    // SECURITY: the window is opened SYNCHRONOUSLY on the click (popup-blocker
    // safe), its opener is severed (no reverse-tabnabbing), and the PDF loads
    // from an ephemeral same-origin blob URL — no server-stored file, nothing
    // enumerable, revoked after handoff. The attestation flow is unchanged.
    const viewer = window.open("about:blank", "_blank");
    if (viewer) viewer.opener = null;
    void (async () => {
      setPdfBusy("view");
      try {
        const payload = await requestReportPdf();
        if (!payload) {
          viewer?.close();
          return;
        }
        const url = window.URL.createObjectURL(payload.blob);
        if (viewer) {
          viewer.location = url;
        } else {
          // Popup blocked: fall back to download.
          const anchor = document.createElement("a");
          anchor.href = url;
          anchor.download = `${payload.fileStem}.pdf`;
          anchor.click();
        }
        window.setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
      } finally {
        setPdfBusy(null);
      }
    })();
  }

  function exportDraft() {
    void (async () => {
      setPdfBusy("export");
      try {
        const payload = await requestReportPdf();
        if (!payload) return;
        const { blob, fileStem } = payload;
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `${fileStem}.pdf`;
        anchor.style.display = "none";
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        window.setTimeout(() => window.URL.revokeObjectURL(url), 30_000);
      } finally {
        setPdfBusy(null);
      }
    })();
  }


  const propertyRecord = facts?.propertyRecord ?? null;
  // Label/value rows, not sentences — the panel scans (redesign round 2).
  const topKnownFacts: { label: string; value: string }[] = [
    {
      label: "Address",
      value: propertyRecord?.exactAddress
        ? `${propertyRecord.exactAddress}${propertyRecord.zip ? ` ${propertyRecord.zip}` : ""}`
        : analysisContext.exactAddress ?? analysisContext.location,
    },
    {
      label: "Style",
      value: propertyRecord?.rawPropertyStyle ?? analysisContext.propertyType,
    },
    {
      label: "Listed through",
      value: `${analysisContext.sourceLabel}${propertyRecord?.listingId ? ` · #${propertyRecord.listingId}` : ""}`,
    },
    {
      label: "Price",
      value:
        analysisContext.priceLabel && !/price on request/i.test(analysisContext.priceLabel)
          ? analysisContext.priceLabel
          : "On the source listing — changes as bid periods reset",
    },
  ];
  const verifiedProgramPreview = topProgramRanks.slice(0, 4).map(
    (entry, index) => `${index + 1}. ${entry.program.name}`
  );
  const preliminaryPropertyPathways = workspaceProfile.id === "residential"
    ? [
        "FHA purchase financing",
        "FHA 203(k) renovation financing",
        "VA purchase or renovation financing — borrower eligibility required",
        "Conventional purchase or renovation financing",
        "Construction-to-permanent financing — if rehabilitation is impractical",
        "Seller financing — seller carries a negotiated note",
        "Private asset-based bridge financing (hard money) — short-term, higher-cost, exit-dependent",
      ]
    : workspaceProfile.id === "farm"
      ? [
          "USDA FSA farm ownership financing",
          "USDA Rural Development housing financing — if owner-occupied residential use fits",
          "Farm Credit or agricultural real-estate financing",
          "Conventional farm or mixed-use financing",
          "Seller financing — seller carries a negotiated note on land, improvements, or included assets",
          "Private agricultural or asset-based bridge financing (hard money) — short-term, higher-cost, exit-dependent",
        ]
      : [
          "Conventional bank or credit-union commercial real-estate financing",
          "SBA 504 financing — owner-occupied fixed assets and eligible improvements",
          "SBA 7(a) financing — real estate, business acquisition, working capital, and equipment when eligible",
          "USDA Business & Industry financing — rural eligible business-purpose projects",
          "Commercial bridge or value-add financing — acquisition plus renovation or lease-up",
          "Seller financing — seller carries a negotiated note on real estate, business value, or included assets",
          "Private asset-based bridge financing (hard money) — short-term, higher-cost, exit-dependent",
          "Equipment financing — when machinery, fixtures, or other eligible fixed assets convey",
        ];
  // Property-type compatibility controls this public list. Borrower-ranked
  // results may refine order later, but must never replace the correct lane.
  const topProgramPreview = preliminaryPropertyPathways;
  const preliminaryCapitalPlan = buildPreliminaryCapitalPlan({
    profileId: workspaceProfile.id,
    listedPrice: effectiveListedPrice ?? parsePriceSignal(analysisContext.priceLabel),
    requestedAmount: parsePriceSignal(answers.requestedAmount),
    pathwayNames: topProgramRanks.map((entry) => entry.program.name),
  });
  const collateralPlan = buildCollateralEquityPlan({
    authorized: false,
  });
  const marketComparablePlan = buildMarketComparablePlan({
    profileId: workspaceProfile.id,
    comparables: similarHomes,
  });
  const rankingPrice = effectiveListedPrice ?? parsePriceSignal(analysisContext.priceLabel);
  const officialTaxRecord = structuredTaxRecord(facts?.propertyEvidenceRecords ?? []);
  const rankingTax = ownershipContext && rankingPrice
    ? buildPostSaleTaxScenario({
        price: rankingPrice,
        sellerCurrentAnnualTax: officialTaxRecord?.currentAnnualTax ?? undefined,
        currentTaxTransfersUnchanged: officialTaxRecord?.transferContinuityVerified === true,
      }, ownershipContext)
    : null;
  const structuredRiskEvidence = ingestStructuredPropertyEvidence(facts?.propertyEvidenceRecords ?? []);
  const textRiskEvidence = ingestPropertyEvidence({
    facts: effectivePlaceIntelligence?.verifiedFacts ?? [],
    unknowns: effectivePlaceIntelligence?.unknowns ?? [],
    profileId: workspaceProfile.id,
    location: analysisContext.location,
  });
  const structuredKinds = new Set(structuredRiskEvidence.map((item) => item.kind));
  const ingestedRiskEvidence = [...structuredRiskEvidence, ...textRiskEvidence.filter((item) => !structuredKinds.has(item.kind))];
  const reportRiskEvidence: ExtendedPropertyRiskEvidence[] = mergeWithDefaultPropertyEvidence({
    ingested: ingestedRiskEvidence,
    location: analysisContext.location,
  });
  const propertyEvidenceManifest = rankingTax
    ? buildPropertyEvidenceManifest({ tax: rankingTax, evidence: reportRiskEvidence })
    : null;
  void propertyEvidenceManifest;
  const propertyInfrastructureRisk = buildInfrastructureRiskFromEvidence(reportRiskEvidence);
  const scenarioRankingPlan = buildScenarioRankingPlan({
    profileId: workspaceProfile.id,
    marketPlan: marketComparablePlan,
    capitalPlan: preliminaryCapitalPlan,
    pathwayCount: topProgramRanks.length,
    taxImpact: rankingTax && rankingPrice
      ? {
          stabilizedAnnual: rankingTax.stabilizedAnnual,
          adverseAnnual: rankingTax.adverseAnnual,
          acquisitionPrice: rankingPrice,
        }
      : null,
    infrastructureRisk: propertyInfrastructureRisk,
  });
  const transactionTimelinePlan = buildTransactionTimelinePlan({
    profileId: workspaceProfile.id,
  });
  const financialCapacityPlan = buildFinancialCapacityPlan({
    authorization: "not-requested",
  });
  const executableScenarioRankingPlan = buildExecutableScenarioRankingPlan({
    propertyRanking: scenarioRankingPlan,
    financialCapacity: financialCapacityPlan,
    timeline: transactionTimelinePlan,
    collateral: collateralPlan,
  });
  useEffect(() => {
    const propertyId = analysisContext.propertyId;
    if (!propertyId || propertyId.startsWith("imported:")) return;
    const topThreeInput = { profileId: workspaceProfile.id, marketPlan: marketComparablePlan, capitalPlan: preliminaryCapitalPlan, pathwayCount: topProgramRanks.length, taxImpact: rankingTax && rankingPrice ? { stabilizedAnnual: rankingTax.stabilizedAnnual, adverseAnnual: rankingTax.adverseAnnual, acquisitionPrice: rankingPrice } : null, infrastructureRisk: propertyInfrastructureRisk };
    const captures = [
      { kind: "top-three" as const, artifactId: `top-three:${propertyId}`, replayInput: topThreeInput, replayOutput: scenarioRankingPlan },
      ...(rankingTax ? [{ kind: "tax-scenario" as const, artifactId: `tax-scenario:${propertyId}`, replayInput: { price: rankingPrice, sellerCurrentAnnualTax: officialTaxRecord?.currentAnnualTax ?? null, currentTaxTransfersUnchanged: officialTaxRecord?.transferContinuityVerified === true, ownershipContext }, replayOutput: rankingTax }] : []),
    ];
    for (const capture of captures) {
      void fetch("/api/property/evidence-lineage/capture", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...capture, propertyId }),
      });
    }
  }, [analysisContext.propertyId, rankingTax?.stabilizedAnnual, rankingTax?.adverseAnnual, scenarioRankingPlan.status]);
  const decisionSynthesisPlan = buildDecisionSynthesisPlan({
    propertyRanking: scenarioRankingPlan,
    executableRanking: executableScenarioRankingPlan,
    financialCapacity: financialCapacityPlan,
    timeline: transactionTimelinePlan,
    market: marketComparablePlan,
    capital: preliminaryCapitalPlan,
  });
  const recommendationEvidenceLedger = buildRecommendationEvidenceLedger({
    decision: decisionSynthesisPlan,
    verifiedFacts: effectivePlaceIntelligence?.verifiedFacts ?? [],
    unknowns: effectivePlaceIntelligence?.unknowns ?? [],
    financialCapacity: financialCapacityPlan,
    timeline: transactionTimelinePlan,
    market: marketComparablePlan,
    capital: preliminaryCapitalPlan,
  });

  const humanDecisionAssignmentPlan = buildHumanDecisionAssignmentPlan({
    decision: decisionSynthesisPlan,
    ledger: recommendationEvidenceLedger,
  });
  const decisionResolutionPlan = buildDecisionResolutionPlan({
    decision: decisionSynthesisPlan,
    assignments: humanDecisionAssignmentPlan,
  });
  const recommendationFinalityPlan = buildRecommendationFinalityPlan({
    decision: decisionSynthesisPlan,
    ledger: recommendationEvidenceLedger,
    assignments: humanDecisionAssignmentPlan,
    resolutions: decisionResolutionPlan,
  });
  const recommendationReleaseRecord = buildRecommendationReleaseRecord({
    decision: decisionSynthesisPlan,
    ledger: recommendationEvidenceLedger,
    resolutions: decisionResolutionPlan,
    finality: recommendationFinalityPlan,
  });
  const pendingReleaseReview = pendingReleaseReviews.find((row) => row.releaseId === recommendationReleaseRecord.releaseId) ?? null;
  const latestPersistedRecommendationRelease = persistedReleaseRows[0]?.releasePayload ?? null;
  const persistedAuditEntries = persistedReleaseRows
    .slice()
    .reverse()
    .map((row) => row.historyPayload?.entries?.at(-1))
    .filter((entry): entry is RecommendationReleaseAuditEntry => Boolean(entry));
  const recommendationReleaseChangeControl = buildRecommendationReleaseChangeControl({
    current: recommendationReleaseRecord,
    previous: latestPersistedRecommendationRelease,
  });
  const recommendationReleaseHistory = buildRecommendationReleaseHistory({
    current: recommendationReleaseRecord,
    changeControl: recommendationReleaseChangeControl,
    priorEntries: persistedAuditEntries,
  });
  const acknowledgeCriticalEscalation = async () => {
    if (!pendingReleaseReview?.escalationRequired || !pendingReleaseReview.attestationCycleId || pendingReleaseReview.attestationCycleId === "pending-refresh") return;
    setEscalationAcknowledgeBusy(true);
    setEscalationAcknowledgeMessage(null);
    try {
      const response = await fetch("/api/recommendation-releases/pending", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          releaseId: pendingReleaseReview.releaseId,
          attestationCycleId: pendingReleaseReview.attestationCycleId,
          traceId: `release-escalation-ack:${pendingReleaseReview.releaseId}:${Date.now()}`,
        }),
      });
      const payload = await response.json() as { ok?: boolean; error?: string };
      if (!response.ok || !payload.ok) throw new Error(payload.error || "Escalation acknowledgement failed.");
      setPendingReleaseReviews((current) => current.map((row) => row.releaseId === pendingReleaseReview.releaseId
        ? { ...row, escalationAcknowledged: true, acknowledgedByCurrentActor: true }
        : row));
      setEscalationAcknowledgeMessage("Your immutable escalation acknowledgement is recorded. This does not count as countersignature or release approval.");
    } catch (error) {
      setEscalationAcknowledgeMessage(error instanceof Error ? error.message : "Escalation acknowledgement failed.");
    } finally {
      setEscalationAcknowledgeBusy(false);
    }
  };

  const recordGovernedRecommendationRelease = async () => {
    if (!releaseSubjectKey || releaseRecordBusy) return;
    setReleaseRecordBusy(true);
    setReleaseRecordMessage(null);
    setReleaseHistoryError(null);
    try {
      const response = await fetch("/api/recommendation-releases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectType: releaseSubjectType,
          subjectKey: releaseSubjectKey,
          traceId: `workspace-release-${Date.now()}`,
          release: recommendationReleaseRecord,
          decisionContext: {
            propertyId: context.propertyId ?? null,
            title: context.title,
            location: context.location,
            profileId: workspaceProfile.id,
            releaseState: recommendationReleaseRecord.releaseState,
            finality: recommendationReleaseRecord.finality,
            priorReleaseId: latestPersistedRecommendationRelease?.releaseId ?? null,
          },
        }),
      });
      const payload = await response.json() as {
        ok?: boolean;
        row?: {
          releaseId: string;
          releasePayload: RecommendationReleaseRecord;
          historyPayload: RecommendationReleaseHistory;
          createdAt?: string | null;
        };
        pendingCountersignature?: boolean;
        attestationCount?: number;
        attestationExpiresAt?: string | null;
        staleCycleRestarted?: boolean;
        error?: string;
      };
      if (!response.ok || !payload.ok) throw new Error(payload.error || "Release persistence failed.");
      if (payload.pendingCountersignature) {
        setPendingReleaseReviews((current) => [
          {
            releaseId: recommendationReleaseRecord.releaseId,
            attestationCycleId: "pending-refresh",
            currentActorAlreadyAttested: true,
            canCountersign: false,
            firstAttestedAt: new Date().toISOString(),
            expiresAt: payload.attestationExpiresAt ?? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            freshnessState: "active",
            urgencyState: "normal",
            remainingSeconds: 24 * 60 * 60,
            escalationRequired: false,
            escalationAcknowledged: false,
            acknowledgedByCurrentActor: false,
          },
          ...current.filter((row) => row.releaseId !== recommendationReleaseRecord.releaseId),
        ]);
        setReleaseRecordMessage(payload.staleCycleRestarted
          ? "The prior countersignature cycle had expired. Your attestation started a fresh 24-hour independent review cycle."
          : "Your authorized attestation is recorded. A different authorized reviewer must countersign before this recommendation becomes an immutable release.");
        return;
      }
      if (!payload.row) throw new Error("Release persistence completed without a release record.");
      setPendingReleaseReviews((current) => current.filter((row) => row.releaseId !== recommendationReleaseRecord.releaseId));
      setPersistedReleaseRows((current) => [
        payload.row!,
        ...current.filter((row) => row.releaseId !== payload.row!.releaseId),
      ]);
      setReleaseRecordMessage(
        recommendationReleaseRecord.releaseState === "withheld"
          ? "The governed withheld-release event was recorded without implying approval."
          : "The governed recommendation release was recorded as an immutable lineage entry."
      );
    } catch (error) {
      setReleaseHistoryError(error instanceof Error ? error.message : "Release persistence failed.");
    } finally {
      setReleaseRecordBusy(false);
    }
  };


  // DRAFT SBA/USDA pro forma (founder direction 2026-07-29): the real lender
  // package structure, built from property-side data; borrower-side gate
  // items intentionally stay open so the document is watermarked DRAFT with
  // the underwriting checklist. Zero PII leaves the page.
  function downloadDraftProforma() {
    void (async () => {
      setProformaBusy(true);
      setProformaError(null);
      try {
        const acreage = facts?.propertyRecord?.offeredAcreage ?? (Number.parseFloat(facts?.propertyRecord?.acreageText ?? "") || null);
        const fsaRatePct = ownershipContext?.fsa?.ownershipDirectPct ?? ownershipContext?.rates.rate30 ?? null;
        const isFarmLaneDoc = workspaceProfile.id === "farm" || workspaceProfile.id === "land";
        let revenueUnits: Array<{ unitName: string; unitDescription: string; conservativeAnnualNoi: number; stabilizedAnnualNoi: number; methodology: string }> = [];
        if (isFarmLaneDoc && effectiveListedPrice != null && acreage && fsaRatePct != null) {
          const annualDebtService = effectiveListedPrice * 0.8 * (fsaRatePct / 100) / (1 - Math.pow(1 + fsaRatePct / 100, -40));
          const model = optimizeAgriculturalOpportunities({ acres: acreage, purchasePrice: effectiveListedPrice, debtService: annualDebtService, waterScore: 70, laborCapacity: 55, capitalCapacity: 55, marketAccess: 60, gridEvidence: false, solarZoningEvidence: false });
          revenueUnits = model.diversified.slice(0, 6).map((item) => ({
            unitName: item.label,
            unitDescription: `${Math.round(item.portfolioShare * 100)}% of the diversified screening portfolio on ~${acreage.toLocaleString("en-US", { maximumFractionDigits: 1 })} acres`,
            conservativeAnnualNoi: Math.round(item.noi * item.portfolioShare * 0.75),
            stabilizedAnnualNoi: Math.round(item.noi * item.portfolioShare),
            methodology: "Screening optimizer over county economics and stated capacity assumptions — editable assumptions, not appraisals, bids, or contracts.",
          }));
        }
        const res = await fetch("/api/public/property-proforma-pdf", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            propertyTitle: analysisContext.title,
            exactAddress: context.exactAddress,
            county: context.county,
            state: context.stateCode,
            lane: isFarmLaneDoc ? "B" : "A",
            acquisitionPrice: effectiveListedPrice,
            acreage,
            fsaRatePct,
            revenueUnits,
          }),
        });
        if (!res.ok) {
          const failureText = await res.text();
          throw new Error(failureText.slice(0, 200) || `The pro forma service returned HTTP ${res.status}.`);
        }
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = "furlong-draft-proforma.pdf";
        anchor.click();
        window.setTimeout(() => window.URL.revokeObjectURL(url), 30_000);
      } catch (error) {
        setProformaError(error instanceof Error ? error.message : "The pro forma service is unavailable right now.");
      } finally {
        setProformaBusy(false);
      }
    })();
  }

  const chartActionsSlot = (
    <div style={{ display: "grid", gap: 8, justifyItems: "start" }}>
      {/* THREE actions only (founder direction 2026-07-29: five buttons doing
          the same thing → view/print, download, opt-in permanent record).
          Print merged into View — the PDF viewer's own print button covers it.
          The on-device draft save is now AUTOMATIC (no button; see the
          autosave effect), so nothing the visitor typed is ever lost. */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
        {context.listingUrl && (
          <Link href={context.listingUrl} style={{ color: "#185FA5", textDecoration: "underline", fontWeight: 700 }}>
            See the current price on the official listing ↗
          </Link>
        )}
        <button type="button" onClick={viewPdfTab} style={actionButtonPrimary} disabled={pdfBusy !== null}>
          {pdfBusy === "view" ? "Preparing PDF..." : "View & print PDF"}
        </button>
        <button type="button" onClick={exportDraft} style={actionButtonSecondary} disabled={pdfBusy !== null}>
          {pdfBusy === "export" ? "Preparing PDF..." : "Download PDF"}
        </button>
        {/* ANONYMIZED permanent record (founder direction 2026-07-29): the
            visitor mints an anonymous token — no account, no identity, no
            onboarding. Entering the token next time repopulates their saved
            records, including this report (resumeHref). The automatic device
            draft stays the zero-PII default. */}
        <ReportRecordToken
          record={{
            id: context.propertyId ?? analysisContext.title,
            town: context.town ?? "",
            county: context.county ?? "",
            state: context.stateCode ?? "",
            propertyType: analysisContext.propertyType,
            priceLabel: analysisContext.priceLabel,
            exactAddress: context.exactAddress,
            zip: null,
            sourceId: "furlong-report",
            sourceCitation: "Furlong report record",
            isCurrent: true,
            vintageStamp: report.branding.generatedDate,
            listingUrl: context.listingUrl ?? "",
            pathways: [],
            resumeHref: chartHref,
          }}
        />
        {savedAt && (
          <span style={{ fontSize: 12, color: "#7a8aa0" }}>
            Draft saved automatically on this device · {new Date(savedAt).toLocaleString()}
          </span>
        )}
      </div>
      {pdfError && (
        <p style={{ margin: 0, fontSize: 12.5, color: "#a12626", lineHeight: 1.6, maxWidth: 860 }}>
          PDF generation hit an issue: {pdfError}
        </p>
      )}
    </div>
  );

  return (
    <section className="furlong-report-print" data-print="report" style={{ display: "grid", gap: 22 }}>
      {/* Immaculate print / "Download as a document" styling (founder direction
          2026-07-20): a browser Print (Ctrl+P) of the live ledger must NOT come
          out a navy web-page screenshot with buttons. This strips the whole page
          down to the ledger alone, forces crisp monochrome on white, drops every
          interactive control, and keeps each section whole across page breaks —
          so it lands like an underwriting brief on a dining table or a truck
          dashboard, not a webpage. (The "Download the PDF" button is a separately
          generated document already; this covers the Ctrl+P path.) */}
      <style>{`
        @media print {
          /* Reveal only the ledger — hide nav, footer, shelves, everything else. */
          body * { visibility: hidden !important; }
          .furlong-report-print, .furlong-report-print * { visibility: visible !important; }
          .furlong-report-print {
            position: absolute !important; left: 0; top: 0; width: 100%;
            margin: 0 !important; padding: 0 !important; gap: 12px !important;
          }
          /* Monochrome, ink-frugal, crisp white backing. */
          .furlong-report-print, .furlong-report-print * {
            background: #fff !important; color: #111 !important;
            box-shadow: none !important; text-shadow: none !important;
          }
          .furlong-report-print a { color: #111 !important; text-decoration: none !important; }
          /* Soften every inline border to a hairline rule. */
          .furlong-report-print [style*="border"] { border-color: #cfcfcf !important; }
          /* The navy masthead prints as a black-rule letterhead. */
          .furlong-report-print .nl-doc { border: none !important; }
          .furlong-report-print .nl-doc > div:first-child { border-bottom: 2px solid #111 !important; }
          /* No interactive chrome belongs on paper. */
          .furlong-report-print button,
          .furlong-report-print [data-testid="saved-drafts-rail"],
          .furlong-report-print .no-print { display: none !important; }
          /* Keep sections/cards whole across page breaks. */
          .furlong-report-print section,
          .furlong-report-print article,
          .furlong-report-print .card,
          .furlong-report-print .report-section { break-inside: avoid; page-break-inside: avoid; }
          .furlong-report-print img { filter: grayscale(100%); }
          /* A ledger printed mid-load must announce itself as incomplete. */
          .furlong-report-print .furlong-print-only {
            display: block !important;
            font-weight: 800 !important;
            border: 2px solid #111 !important;
            padding: 6px 10px !important;
          }
          @page { margin: 0.6in; }
        }
      `}</style>
      {/* Ship's Ledger masthead (founder direction 2026-07-20): the report opens
          like an official, stamped land ledger — emblem seal, THE LAND LEDGER
          nameplate, the parcel, and a "DATA VERIFIED" stamp. Furlong = 220 yards
          of ground: a parcel measured, sourced, and logged. */}
      {!deepView && (
        <div className="nl-doc" style={{ position: "relative", overflow: "hidden", borderRadius: 16, border: "1px solid #d7deea", boxShadow: "0 6px 22px rgba(16,26,43,0.08)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", padding: "20px 24px", background: "linear-gradient(180deg,#10233b,#14293f)", borderBottom: "3px solid #b8862f" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={report.branding.emblemPath} alt="Furlong seal" width={58} height={58} style={{ width: 58, height: 58, borderRadius: "50%", flexShrink: 0, boxShadow: "0 0 0 2px rgba(201,168,76,0.45)" }} />
            <div style={{ display: "grid", gap: 3, flex: "1 1 240px", fontFamily: "Georgia, 'Times New Roman', serif" }}>
              <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", color: "#d4b06a" }}>Furlong · The Land Ledger</span>
              <strong style={{ fontSize: "clamp(20px,3.4vw,27px)", lineHeight: 1.12, color: "#f4f7fa", fontWeight: 700 }}>{context.title}</strong>
              {context.location && <span style={{ fontSize: 13.5, color: "#b9cbd9" }}>{context.location}</span>}
            </div>
            <div aria-label={`Data verified ${report.branding.generatedDate}`} style={{ transform: "rotate(-4deg)", border: "2px solid #c9a84c", borderRadius: 8, padding: "7px 12px", textAlign: "center", flexShrink: 0, background: "rgba(201,168,76,0.06)" }}>
              <span style={{ display: "block", fontSize: 9.5, fontWeight: 800, letterSpacing: "0.14em", color: "#d4b06a" }}>DATA VERIFIED</span>
              <span style={{ display: "block", fontSize: 14, fontWeight: 800, fontFamily: "Georgia, serif", letterSpacing: "0.03em", color: "#eec07a" }}>{report.branding.generatedDate}</span>
            </div>
          </div>
          <div style={{ padding: "7px 24px", background: "#faf6ec", borderTop: "1px solid #e9ddc4" }}>
            <span style={{ fontSize: 11, color: "#96742f", fontStyle: "italic", fontFamily: "Georgia, serif" }}>
              A furlong — 220 yards of ground — measured, sourced, and logged. Every figure below carries its origin and date.
            </span>
          </div>
        </div>
      )}
      {/* STILL GATHERING (founder-caught 2026-07-21): the ledger used to render
          complete — masthead, verdict, Sovereignty, Bound Register — while the
          place-facts fetch was still in flight, so an early print produced a
          hollow document that LOOKED finished (16 verified facts and 12 open
          items were simply not back yet). A report must never look done while
          it is empty. This band says so on screen, and prints as an explicit
          INCOMPLETE stamp so a premature copy can never pass as the real one. */}
      {!deepView && factsLoading && (
        <div
          data-facts-loading="true"
          role="status"
          aria-live="polite"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
            border: "1px solid #e2d7bd",
            borderLeft: "4px solid #b8862f",
            background: "#faf6ec",
            borderRadius: 12,
            padding: "12px 16px",
          }}
        >
          <span aria-hidden style={{ fontSize: 15 }}>⏳</span>
          <span style={{ fontSize: 13, color: "#4d596d", lineHeight: 1.55 }}>
            <strong style={{ color: "#101a2b" }}>Still gathering this tract&apos;s public records.</strong>{" "}
            Flood, tax, program, county and utility facts are still coming in — the ledger below is not
            complete yet. Give it a moment before you print, save, or judge it.
          </span>
          <span className="furlong-print-only" style={{ display: "none" }}>
            INCOMPLETE COPY — the record was still loading when this was printed. Reprint once the ledger
            has finished gathering.
          </span>
        </div>
      )}

      {/* Property Type Stamp (Chaptered Blueprint, founder direction 2026-07-20):
          the property type is front-loaded — right under the header, before the
          verdict — because the financing lanes, costs, and questions all follow
          it (a working farm is not underwritten like a home; founder-caught on
          her own farm, 2026-07-18). Imported addresses carry no type, so this is
          an active picker; a typed listing shows it as a confirming stamp you can
          still correct. */}
      {!deepView && (() => {
        const imported = importedProperty;
        return (
          <section
            aria-label="Property type on file"
            style={{
              display: "grid",
              gap: 9,
              border: "1px solid #e2d7bd",
              borderLeft: "4px solid #b8862f",
              background: "#faf6ec",
              borderRadius: 12,
              padding: "12px 16px",
            }}
          >
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: "4px 10px" }}>
              <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: "#96742f", fontFamily: "Georgia, serif" }}>
                Property type
              </span>
              <span style={{ fontSize: 12.5, color: "#4d596d" }}>
                {imported ? (
                  <>An address alone can&apos;t tell us — pick the type. The financing lanes, costs, and questions all follow your answer.</>
                ) : (
                  <>Read as a <strong style={{ color: "#101a2b" }}>{workspaceProfile.label}</strong>. The lanes, costs, and questions below all follow this — not right? Set the true type.</>
                )}
              </span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {allProfiles().map((profile) => {
                const active = propertyClassificationAvailable && workspaceProfile.id === profile.id;
                return (
                  <button
                    key={profile.id}
                    type="button"
                    onClick={() => setProfileOverride(profile.id)}
                    aria-pressed={active}
                    style={{
                      padding: "6px 13px",
                      borderRadius: 999,
                      border: active ? "1px solid #0f766e" : "1px solid #d7deea",
                      background: active ? "#0f766e" : "#ffffff",
                      color: active ? "#ffffff" : "#3b475a",
                      fontSize: 12.5,
                      fontWeight: active ? 700 : 500,
                      cursor: "pointer",
                    }}
                  >
                    {active ? "✓ " : ""}{profile.label}
                  </button>
                );
              })}
            </div>
            {profileOverride && (
              <span style={{ fontSize: 12, color: "#0f766e" }}>
                Read as: {workspaceProfile.label}. Everything below follows this shape.
              </span>
            )}
          </section>
        );
      })()}
      {!deepView && importedProperty && (!propertyClassificationAvailable || !rankingPrice) && (
        <section aria-label="Complete property basics" style={{ display: "grid", gap: 7, border: "1px solid #d7deea", borderRadius: 12, background: "#fbfcfe", padding: "14px 16px" }}>
          <strong style={{ color: "#162033", fontSize: 15 }}>Complete the property basics before Furlong recommends a course</strong>
          <span style={{ color: "#526074", fontSize: 12.5, lineHeight: 1.55 }}>
            {propertyClassificationAvailable
              ? "Furlong classified the property from the available parcel and listing evidence. Enter the asking price or your intended offer before any financial recommendation is generated. The type control above is only for correcting a source record that does not reflect the property’s actual use."
              : "Furlong is still resolving the parcel acreage, land-use, and structure record for this address. It will not default the property to residential or generate type-specific analysis until that evidence is available."}
          </span>
        </section>
      )}
      {/* (The imported-only "What is this property?" picker is now the
          front-loaded Property Type Stamp above — shown for every property.) */}

      {/* Lane selection is canonical-profile-driven (propertyProfile.ts), not a
          regex: farm + land → FarmLaneWorkspace; residential → ResidentialLaneWorkspace;
          commercial, hospitality, mobile-home-park → CommercialLaneWorkspace.
          Each lane owns its tabs/questions/panels; GovernedLaneChassis keeps the
          compliance substrate single-source. The type-correction picker above
          remounts the lane while all entered state stays in this parent. */}
      {!deepView && propertyClassificationAvailable && (() => {
        const LaneWorkspace =
          workspaceProfile.id === "farm" || workspaceProfile.id === "land"
            ? FarmLaneWorkspace
            : workspaceProfile.id === "residential"
              ? ResidentialLaneWorkspace
              : CommercialLaneWorkspace;
        return (
      <LaneWorkspace
        variant={chartVariant}
        propertyId={context.propertyId ?? context.title}
        title={context.title}
        location={`${context.location}${context.exactAddress ? ` · ${context.exactAddress}` : ""}`}
        sourceLabel={analysisContext.sourceLabel}
        propertyType={analysisContext.propertyType}
        priceLabel={analysisContext.priceLabel}
        fileNo={facts?.propertyRecord?.listingId ?? null}
        tierLabel={report.tier.label}
        headline={answerCard.headline}
        readiness={answerCard.readiness}
        fitLine={answerCard.fitLine}
        pauseLine={answerCard.pauseLine}
        intelligence={effectivePlaceIntelligence}
        propertyRecord={facts?.propertyRecord ?? null}
        financingRateContext={ownershipContext ? {
          fsaOwnershipDirectPct: ownershipContext.fsa?.ownershipDirectPct ?? null,
          fsaDownPaymentPct: ownershipContext.fsa?.downPaymentPct ?? null,
          fsaEffective: ownershipContext.fsa?.effective ?? null,
          mortgage30Pct: ownershipContext.rates.rate30 ?? null,
          mortgageWeekOf: ownershipContext.rates.weekOf ?? null,
        } : null}
        deedEvidence={facts?.propertyEvidenceRecords ?? []}
        financingLanes={topProgramPreview}
        costsSlot={
          // The finance lens carries no products/terms/rates (counsel gate);
          // the home-mortgage lane table only fits residential/farm profiles
          // (canonical classifier — commercial/hospitality/MHP/land get their
          // own profile questions instead).
          ownershipContext &&
          chartVariant !== "finance" &&
          profileUsesResidentialLanes(workspaceProfile.id) ? (
            <OwnershipCostPanel
              theme={CHART_THEMES[chartVariant]}
              context={ownershipContext}
              listedPrice={effectiveListedPrice}
              isHome={isResidentialHomeContext(analysisContext)}
              farmShaped={workspaceProfile.id === "farm"}
              farmMode={workspaceProfile.id === "farm"}
              farmAcreage={facts?.propertyRecord?.offeredAcreage ?? (Number.parseFloat(facts?.propertyRecord?.acreageText ?? "") || null)}
              profileId={workspaceProfile.id}
            />
          ) : null
        }
        similarHomes={similarHomes}
        actionsSlot={chartActionsSlot}
        agricultureSlot={
          workspaceProfile.id === "farm" || workspaceProfile.id === "land" ? (
            <FarmAgricultureTab bestUse={effectivePlaceIntelligence?.farmBestUse ?? null} />
          ) : undefined
        }
        proformaSlot={
          workspaceProfile.id !== "residential" ? (
            <div style={{ display: "grid", gap: 8 }}>
              <h3 style={{ margin: 0, color: "#1C2B45", fontSize: 16 }}>DRAFT pro forma — SBA/USDA structure</h3>
              <p style={{ margin: 0, color: "#5A6172", fontSize: 12.5, lineHeight: 1.6 }}>
                The real lender-package document: Sources &amp; Uses, collateral schedule, revenue segments,
                debt-service assumptions, two-case DSCR, and the ten-year model — built from this property&apos;s
                verified record and screening assumptions. It carries a DRAFT banner and the generation-gate
                checklist of everything underwriting still requires (entity documents, guarantor PFS, balance
                sheet, registers). {rankingPrice == null ? "Enter the asking price or your intended offer above to populate the finance math." : ""}
              </p>
              <button
                type="button"
                data-testid="draft-proforma"
                onClick={downloadDraftProforma}
                disabled={proformaBusy}
                style={{ justifySelf: "start", borderRadius: 9, padding: "10px 14px", border: "1px solid #8F6E1F", background: "#8F6E1F", color: "#fff", fontWeight: 800, cursor: "pointer" }}
              >
                {proformaBusy ? "Building DRAFT pro forma..." : "Download DRAFT pro forma (PDF)"}
              </button>
              {proformaError && <span style={{ fontSize: 12, color: "#a12626" }}>{proformaError}</span>}
            </div>
          ) : undefined
        }
      />
        );
      })()}
      {/* Imported-address verification status stays visible below the chart. */}
      <div style={{ display: "grid", gap: 16 }}>
	        {context.propertyId?.startsWith("imported:") && (
	          <div style={{ display: "grid", gap: 6 }}>
            <p style={{ margin: 0, fontSize: 12.5, color: "#854F0B", lineHeight: 1.6, maxWidth: 840 }}>
              This property was brought in by the visitor rather than from a verified internal inventory record, so the report should treat the imported listing details as intake material until the property facts are independently confirmed.
            </p>
            {facts?.verification?.restrictions?.map((line) => (
              <p key={line} style={{ margin: 0, fontSize: 12.5, color: "#a12626", lineHeight: 1.6, maxWidth: 840 }}>
                {line}
              </p>
            ))}
            {facts?.verification?.warnings?.slice(0, 2).map((line) => (
              <p key={line} style={{ margin: 0, fontSize: 12.5, color: "#7a5a10", lineHeight: 1.6, maxWidth: 840 }}>
                {line}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* Deeper analysis: a DEDICATED PAGE in the same tab (?view=deep) so the
          in-session draft (sessionStorage, per-tab by privacy design) rides
          along; browser Back returns to the property brief. Not a new window: separate
          windows would silently drop the visitor's draft answers. */}
      {deepView ? (
        <section style={{ display: "grid", gap: 16 }}>
          <a
            href={chartHref}
            style={{ fontSize: 13.5, fontWeight: 700, color: "#0f766e", textDecoration: "underline", textUnderlineOffset: 2, justifySelf: "start" }}
          >
            ← Back to the property brief
          </a>
        <div style={{ paddingTop: 16 }}>
      <div style={{ display: "grid", gap: 20, gridTemplateColumns: "minmax(0, 1.18fr) minmax(340px, 0.92fr)", alignItems: "start" }}>
        <div style={{ display: "grid", gap: 22 }}>
          <section style={panelStyle}>
            <div style={{ display: "grid", gap: 5 }}>
              <strong style={{ fontSize: 18, color: "#162033" }}>Immediate property memo</strong>
              <span style={{ fontSize: 13, color: "#5d687a", lineHeight: 1.55 }}>
                This should read like a first-pass deal memo before any interview starts: where the property fits, what it may cost, what could break it, and which financing lanes look strongest.
              </span>
            </div>
            <div style={{ display: "grid", gap: 12 }}>
              <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
                <div style={miniCard}>
                  <span style={miniLabel}>Lead lane</span>
                  <strong style={{ fontSize: 18, color: "#162033" }}>
                    {topProgramRanks[0]?.program.name ?? "Still classifying"}
                  </strong>
                  <span style={miniText}>
                    {topProgramRanks[0]
                      ? topProgramRanks[0].rationale
                      : "The asset class still needs to be sharpened before a strong lead lane can be stated."}
                  </span>
                </div>
                <div style={miniCard}>
                  <span style={miniLabel}>Watch this first</span>
                  <strong style={{ fontSize: 18, color: "#162033" }}>
                    {immediateSuitability.constraints[0] ? "One open question" : "No single blocker yet"}
                  </strong>
                  <span style={miniText}>{immediateSuitability.constraints[0] ?? "Execution still depends on rule checks, condition, and capital structure."}</span>
                </div>
                <div style={miniCard}>
                  <span style={miniLabel}>Cost posture</span>
                  <strong style={{ fontSize: 18, color: "#162033" }}>
                    First-pass basis
                  </strong>
                  <span style={miniText}>{budgetExpectations.acquisition}</span>
                </div>
              </div>
              <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
                <label style={fieldBlock}>
                  <span style={fieldLabel}>Property price / asking basis</span>
                  <input
                    value={manualPriceLabel}
                    onChange={(event) => setManualPriceLabel(event.target.value)}
                    placeholder={context.priceLabel}
                    style={inputStyle}
                  />
                  <span style={{ fontSize: 12, color: "#7a8aa0", lineHeight: 1.5 }}>
                    Change this here if the listing price is wrong, missing, or you want to test a different acquisition basis.
                  </span>
                </label>
                <label style={fieldBlock}>
                  <span style={fieldLabel}>Likely use for this property</span>
                  <input
                    value={answers.possibility}
                    onChange={(event) => updateAnswer("possibility", event.target.value)}
                    placeholder="Ex: boutique inn, farm stay, mixed-use rural business"
                    style={inputStyle}
                  />
                  <span style={{ fontSize: 12, color: "#7a8aa0", lineHeight: 1.5 }}>
                    One short use hypothesis is enough to materially improve the first-pass analysis.
                  </span>
                </label>
                <label style={fieldBlock}>
                  <span style={fieldLabel}>Likely capital need</span>
                  <input
                    value={answers.requestedAmount}
                    onChange={(event) => updateAnswer("requestedAmount", event.target.value)}
                    placeholder="$750,000"
                    style={inputStyle}
                  />
                  <span style={{ fontSize: 12, color: "#7a8aa0", lineHeight: 1.5 }}>
                    Use this only if you already have a rough target; otherwise the page should still work without it.
                  </span>
                </label>
              </div>
              <div style={{ display: "grid", gap: 8 }}>
                <strong style={{ fontSize: 14, color: "#162033" }}>Current guided questions</strong>
                <div style={{ display: "grid", gap: 8 }}>
                  {report.keyQuestions.slice(0, 4).map((line) => (
                    <div key={line} style={factCard}>
                      <span style={{ fontSize: 12.8, color: "#3b475a", lineHeight: 1.55 }}>{line}</span>
                    </div>
                  ))}
                </div>
              </div>
              <details style={detailsStyle}>
                <summary style={summaryStyle}>Optional deeper intake and report tier controls</summary>
                <div style={{ display: "grid", gap: 14, paddingTop: 14 }}>
                  <div style={{ display: "grid", gap: 8 }}>
                    <span style={fieldLabel}>Report structure / tier</span>
                    <div style={{ display: "grid", gap: 10 }}>
                      {REPORT_TIER_OPTIONS.map((option) => {
                        const active = answers.reportTier === option.id;
                        const access = tierAccess[option.id];
                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => updateAnswer("reportTier", option.id)}
                            style={{
                              borderRadius: 14,
                              border: active ? "1.5px solid #0f766e" : "1px solid #d7deea",
                              background: active ? "#edf9f5" : "#fff",
                              padding: "14px 16px",
                              textAlign: "left",
                              cursor: "pointer",
                              display: "grid",
                              gap: 4,
                            }}
                          >
                            <strong style={{ fontSize: 14, color: "#162033" }}>{option.shortLabel} · {option.label}</strong>
                            <span style={{ fontSize: 11.5, fontWeight: 800, color: access.unlocked ? "#0f766e" : "#854F0B", textTransform: "uppercase", letterSpacing: 0.04 }}>
                              {access.badge}
                            </span>
                            <span style={{ fontSize: 12.5, color: "#5d687a", lineHeight: 1.55 }}>{option.description}</span>
                            <span style={{ fontSize: 12, color: "#7a8aa0", lineHeight: 1.5 }}>{access.detail}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <label style={fieldBlock}>
                    <span style={fieldLabel}>1. What are your possibilities for this property?</span>
                    <textarea value={answers.possibility} onChange={(event) => updateAnswer("possibility", event.target.value)} placeholder="Ex: boutique inn, event venue, mixed-use rural business, working farm, workforce housing..." style={textareaStyle} rows={3} />
                  </label>
                  <label style={fieldBlock}>
                    <span style={fieldLabel}>2. How would this actually be used or operated?</span>
                    <textarea value={answers.usePlan} onChange={(event) => updateAnswer("usePlan", event.target.value)} placeholder="Describe occupancy, operations, customer use, production, staffing, or who would run it." style={textareaStyle} rows={3} />
                  </label>
                  <label style={fieldBlock}>
                    <span style={fieldLabel}>3. What capital would likely be needed?</span>
                    <textarea value={answers.capitalPlan} onChange={(event) => updateAnswer("capitalPlan", event.target.value)} placeholder="Purchase, renovation, equipment, working capital, site improvements, contingencies..." style={textareaStyle} rows={3} />
                  </label>
                  <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
                    <label style={fieldBlock}>
                      <span style={fieldLabel}>Target capital need</span>
                      <input value={answers.requestedAmount} onChange={(event) => updateAnswer("requestedAmount", event.target.value)} placeholder="$750,000" style={inputStyle} />
                    </label>
                    <label style={fieldBlock}>
                      <span style={fieldLabel}>Timing / urgency</span>
                      <input value={answers.timing} onChange={(event) => updateAnswer("timing", event.target.value)} placeholder="Ex: under contract, 90-day close, exploratory only" style={inputStyle} />
                    </label>
                  </div>
                  <label style={fieldBlock}>
                    <span style={fieldLabel}>4. What relevant operator experience already exists?</span>
                    <textarea value={answers.operatorExperience} onChange={(event) => updateAnswer("operatorExperience", event.target.value)} placeholder="Describe who would run this, what they have done before, and where execution strength or gaps exist." style={textareaStyle} rows={3} />
                  </label>
                  <label style={fieldBlock}>
                    <span style={fieldLabel}>5. How would this property make money or sustain itself?</span>
                    <textarea value={answers.revenueModel} onChange={(event) => updateAnswer("revenueModel", event.target.value)} placeholder="Explain the revenue model, occupancy logic, production output, contracts, memberships, rents, ticketing, or any other operating economics." style={textareaStyle} rows={3} />
                  </label>
                  <label style={fieldBlock}>
                    <span style={fieldLabel}>6. What renovation or site work is really required?</span>
                    <textarea value={answers.renovationScope} onChange={(event) => updateAnswer("renovationScope", event.target.value)} placeholder="Describe cosmetic refresh, major rehab, code work, ADA, utilities, environmental cleanup, kitchens, barns, roads, drainage, or vertical construction." style={textareaStyle} rows={3} />
                  </label>
                  <label style={fieldBlock}>
                    <span style={fieldLabel}>7. What is the intended ownership or entity posture?</span>
                    <textarea value={answers.ownershipPosture} onChange={(event) => updateAnswer("ownershipPosture", event.target.value)} placeholder="Ex: personal acquisition, existing operating company, new LLC, nonprofit sponsor, family office holdco, JV, or still undecided." style={textareaStyle} rows={3} />
                  </label>
                  <div style={{ display: "grid", gap: 8 }}>
                    <span style={fieldLabel}>8. Which documents do you already have?</span>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {DOCUMENT_OPTIONS.map((option) => {
                        const active = answers.documents.includes(option);
                        return (
                          <button
                            key={option}
                            type="button"
                            onClick={() => toggleDocument(option)}
                            style={{
                              borderRadius: 999,
                              padding: "8px 12px",
                              border: active ? "1px solid #0f766e" : "1px solid #d7deea",
                              background: active ? "#e8f6f2" : "#fff",
                              color: active ? "#0f766e" : "#4d596d",
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            {option}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </details>
            </div>
          </section>

          <section style={panelStyle}>
            <div style={{ display: "grid", gap: 5 }}>
              <strong style={{ fontSize: 18, color: "#162033" }}>Ranked USDA / SBA financing read</strong>
              <span style={{ fontSize: 13, color: "#5d687a", lineHeight: 1.55 }}>
                This is still governed planning support, not an approval. The difference is that the page should tell you the most likely financing order first instead of making “missing answers” the headline.
              </span>
            </div>
            {selectedTierUnlocked ? (
              <>
                <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
                  <div style={miniCard}>
                    <span style={miniLabel}>Lead program</span>
                    <strong style={{ fontSize: 28, color: "#162033" }}>
                      {topProgramRanks[0]?.program.name ?? "TBD"}
                    </strong>
                    <span style={miniText}>{topProgramRanks[0] ? "Ranked first from the current property facts." : "Still classifying from the current record."}</span>
                  </div>
                  <div style={miniCard}>
                    <span style={miniLabel}>Verified property-side signals</span>
                    <strong style={{ fontSize: 18, color: "#162033" }}>
                      {verifiedPrograms.length}
                    </strong>
                    <span style={miniText}>Snapshot-backed criteria already attached to the property itself.</span>
                  </div>
                  <div style={miniCard}>
                    <span style={miniLabel}>Optional deeper intake readiness</span>
                    <strong style={{ fontSize: 18, color: "#162033" }}>
                      {readinessResult.overallReadinessPercent}%
                    </strong>
                    <span style={miniText}>Useful for later tightening, but no longer the first thing the customer should see.</span>
                  </div>
                </div>

                <div style={{ display: "grid", gap: 10 }}>
                  {topProgramRanks.map((entry, index) => (
                    <div key={entry.program.id} style={{ border: "1px solid #e6ebf2", borderRadius: 12, padding: "14px 16px", display: "grid", gap: 5 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                        <strong style={{ fontSize: 14.5, color: "#162033" }}>{index + 1}. {entry.program.name}</strong>
                        <span style={{ fontSize: 12, fontWeight: 800, color: "#0f766e" }}>
                          {index === 0 ? "Strongest current lane" : `Lane ${index + 1}`}
                        </span>
                      </div>
                      <span style={{ fontSize: 12.5, color: "#5d687a", lineHeight: 1.55 }}>
                        {entry.rationale}
                      </span>
                      <span style={{ fontSize: 11.5, color: "#7a8aa0", lineHeight: 1.5 }}>
                        Watch-out: {entry.caution}
                      </span>
                    </div>
                  ))}
                </div>

                <details style={detailsStyle}>
                  <summary style={summaryStyle}>Optional deeper intake gaps and human confirmation points</summary>
                  <div style={{ display: "grid", gap: 8, paddingTop: 14 }}>
                    <strong style={{ fontSize: 14, color: "#162033" }}>What still needs human confirmation</strong>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {contextualMissingItems(financingResult.readiness.missingItems, context, answers).map((item) => (
                        <span key={item} style={pillGray}>{item}</span>
                      ))}
                      {financingResult.readiness.missingItems.length === 0 && (
                        <span style={pillGray}>Core intake fields are currently filled.</span>
                      )}
                    </div>
                  </div>
                </details>
              </>
            ) : (
              <div style={{ ...miniCard, background: "#fbfcfe" }}>
                <span style={miniLabel}>Premium layer locked</span>
                <strong style={{ fontSize: 18, color: "#162033" }}>{report.tier.label}</strong>
                <span style={miniText}>{selectedTierAccess.detail}</span>
                <span style={miniText}>
                  The underlying framework is already wired, so turning this live later is a switch instead of a rebuild.
                </span>
              </div>
            )}
          </section>

          <section style={panelStyle}>
            <div style={{ display: "grid", gap: 5 }}>
              <strong style={{ fontSize: 18, color: "#162033" }}>Guided AI interview</strong>
              <span style={{ fontSize: 13, color: "#5d687a", lineHeight: 1.55 }}>
                The interview should still be available when you want to pressure-test the property beyond the first-pass memo.
              </span>
            </div>
            {selectedTierUnlocked ? (
              <details style={detailsStyle}>
                <summary style={summaryStyle}>Open guided follow-up questions and live analysis</summary>
                <div style={{ paddingTop: 14 }}>
                  <FurlongNavigator initialMessage={context.initialMessage} existingCase={navigatorCaseContext} onStateChange={setNavigator} />
                </div>
              </details>
            ) : (
              <div style={{ ...miniCard, background: "#fbfcfe" }}>
                <span style={miniLabel}>Interview access</span>
                <strong style={{ fontSize: 18, color: "#162033" }}>Hidden on this tier state</strong>
                <span style={miniText}>
                  The deeper guided interview stays out of the main screen until this tier is unlocked.
                </span>
              </div>
            )}
          </section>
        </div>

        <aside style={{ display: "grid", gap: 18, alignContent: "start", position: "sticky", top: 20 }}>
          <section style={panelStyle}>
            <div style={{ display: "grid", gap: 5 }}>
              <strong style={{ fontSize: 18, color: "#162033" }}>Verified property-side criteria</strong>
              <span style={{ fontSize: 13, color: "#5d687a", lineHeight: 1.55 }}>
                Snapshot-backed place facts and programs tied to the property itself, not to a borrower claim.
              </span>
            </div>
            {factsLoading ? (
              <span style={{ fontSize: 13, color: "#7a8aa0" }}>Checking property-side criteria…</span>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {verifiedPrograms.map((program) => (
                  <div key={program.program_id} style={{ border: "1px solid #b9e3d4", background: "#f4fbf8", borderRadius: 12, padding: "12px 14px", display: "grid", gap: 4 }}>
                    <strong style={{ fontSize: 13.5, color: "#0f6e56" }}>{program.name}</strong>
                    <span style={{ fontSize: 12.5, color: "#3b475a", lineHeight: 1.55 }}>{program.verifiedStatement}</span>
                    {program.whyItMatters && (
                      <span style={{ fontSize: 12.5, color: "#0f6e56", lineHeight: 1.55 }}>{program.whyItMatters}</span>
                    )}
                    <span style={{ fontSize: 11.5, color: "#5d687a" }}>{program.basis}</span>
                  </div>
                ))}
                {verifiedPrograms.length === 0 && (
                  <span style={{ fontSize: 12.5, color: "#7a8aa0", lineHeight: 1.55 }}>
                    {context.propertyId?.startsWith("imported:")
                      ? "No internal snapshot-backed property facts are attached yet because this property was imported by the visitor and still needs independent confirmation."
                      : "No verified federal property-side program criteria surfaced from the current snapshot set for this listing yet."}
                  </span>
                )}
                {facts?.placeFacts?.flood && (
                  <div style={factCard}>
                    <strong style={{ fontSize: 13.5, color: "#162033" }}>FEMA flood posture</strong>
                    <span style={{ fontSize: 12.5, color: "#3b475a" }}>
                      Special Flood Hazard Area, Zone {facts.placeFacts.flood.floodZone}.
                    </span>
                  </div>
                )}
                {facts?.placeFacts?.historic && (
                  <div style={factCard}>
                    <strong style={{ fontSize: 13.5, color: "#162033" }}>Historic context</strong>
                    <span style={{ fontSize: 12.5, color: "#3b475a" }}>
                      National Register area{facts.placeFacts.historic.historicName ? ` — ${facts.placeFacts.historic.historicName}` : ""}.
                    </span>
                  </div>
                )}
                {facts?.placeFacts?.nmtc && (
                  <div style={factCard}>
                    <strong style={{ fontSize: 13.5, color: "#162033" }}>NMTC tract</strong>
                    <span style={{ fontSize: 12.5, color: "#3b475a" }}>
                      Tract {facts.placeFacts.nmtc.tractId} is NMTC-qualified in the current snapshot.
                    </span>
                  </div>
                )}
              </div>
            )}
          </section>

          <section style={panelStyle}>
            <div style={{ display: "grid", gap: 5 }}>
              <strong style={{ fontSize: 18, color: "#162033" }}>Draft evaluation report</strong>
              <span style={{ fontSize: 13, color: "#5d687a", lineHeight: 1.55 }}>
                Saveable, exportable, watermarked, and updated live from your property notes plus the guided conversation. This should read like a useful advisory brief, not a scratchpad.
              </span>
            </div>
            <div style={{ display: "grid", gap: 12 }}>
              <div style={{ ...reportSection, position: "relative", overflow: "hidden", background: "linear-gradient(135deg, #fbfcfe, #ffffff)", borderRadius: 16, padding: "16px 18px" }}>
                <div
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    inset: 0,
                    backgroundImage: `url(${report.branding.compassWatermarkPath})`,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "center",
                    backgroundSize: "260px",
                    opacity: 0.08,
                    pointerEvents: "none",
                  }}
                />
                <div
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    right: 12,
                    top: 10,
                    width: 64,
                    height: 64,
                    backgroundImage: `url(${report.branding.emblemPath})`,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "center",
                    backgroundSize: "contain",
                    opacity: 0.16,
                    pointerEvents: "none",
                  }}
                />
                <div style={{ position: "relative", zIndex: 1, display: "grid", gap: 6 }}>
                  <span style={miniLabel}>Report tier</span>
                  <strong style={{ fontSize: 18, color: "#162033" }}>
                    {report.tier.shortLabel} · {report.tier.label}
                  </strong>
                  <span style={miniText}>{report.tier.description}</span>
                </div>
              </div>
              <div style={{ ...reportSection, borderRadius: 16, padding: "16px 18px" }}>
                <span style={miniLabel}>Verdict</span>
                <strong style={{ fontSize: 18, color: "#162033", lineHeight: 1.35 }}>
                  {report.verdict.label}
                </strong>
                <span style={miniText}>{report.verdict.explanation}</span>
              </div>
              <div style={{ ...reportSection, borderRadius: 16, padding: "16px 18px" }}>
                <span style={miniLabel}>Executive summary</span>
                <span style={{ fontSize: 13, color: "#3b475a", lineHeight: 1.65 }}>
                  {report.executiveSummary}
                </span>
              </div>
              {visiblePreviewSections.map((section) => {
                const sectionLines = section.lines.length > 0 ? section.lines : section.emptyFallback ? [section.emptyFallback] : [];
                return (
                  <div key={section.title} style={{ ...reportSection, borderRadius: 16, padding: "16px 18px" }}>
                    <span style={miniLabel}>{section.title}</span>
                    <div style={{ display: "grid", gap: 6 }}>
                      {sectionLines.map((line) => (
                        <span key={line} style={{ fontSize: 13, color: "#3b475a", lineHeight: 1.6 }}>{line}</span>
                      ))}
                    </div>
                    {section.title === "Diligence priorities before commitment" && (
                      <span style={{ fontSize: 12, color: "#7a8aa0", lineHeight: 1.55 }}>
                        {report.branding.advisoryDisclosure}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </aside>
      </div>
        </div>
        </section>
      ) : null}
      {/* The separate "deeper analysis workspace" link was removed (founder
          direction 2026-07-17): the chart already carries the full analysis
          — facts, costs, financing, and open items — and the watermarked PDF
          is the formal document. A middle report page was redundant. */}

      {/* The Furlong Sovereignty Guarantee (Chaptered Blueprint, founder
          direction 2026-07-20): the "why we lay it all out" manifesto, elevated
          from footer marginalia to a stamped guarantee just before the bridge.
          It is a guarantee of OUR OWN CONDUCT — things we fully control — not a
          promise about any outcome, which keeps "Guarantee" honest. */}
      {!deepView && (
        <section
          aria-label="The Furlong Sovereignty Guarantee"
          style={{
            position: "relative",
            overflow: "hidden",
            display: "grid",
            gap: 10,
            border: "1px solid #b8862f",
            borderRadius: 14,
            background: "linear-gradient(180deg,#10233b,#14293f)",
            color: "#eef3f8",
            padding: "18px 20px",
            fontFamily: "Georgia, 'Times New Roman', serif",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span aria-hidden style={{ fontSize: 15, color: "#d4b06a" }}>❧</span>
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase", color: "#d4b06a" }}>
              The Furlong Sovereignty Guarantee
            </span>
          </div>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: "#eef3f8" }}>
            We lay out every figure with its source and date because this is your ground, not ours to
            gate. That is a guarantee about how <em>we</em> conduct ourselves — the part we fully control:
          </p>
          <ul style={{ margin: 0, paddingLeft: 20, display: "grid", gap: 5, fontSize: 13, lineHeight: 1.55, color: "#dce8f2" }}>
            <li><strong style={{ color: "#f4f7fa" }}>No capture.</strong> No account, no login, no personal data required to read this.</li>
            <li><strong style={{ color: "#f4f7fa" }}>No sale.</strong> We never sell, broker, or hand your information to a third party.</li>
            <li><strong style={{ color: "#f4f7fa" }}>No cut of your deal.</strong> Furlong facilitates introductions; it never decides your deal and takes no piece of your transaction.</li>
            <li><strong style={{ color: "#f4f7fa" }}>Sources, always.</strong> Every figure carries its origin and date — you can check our work.</li>
          </ul>
          <p style={{ margin: 0, fontSize: 12, lineHeight: 1.55, color: "#b9cbd9" }}>
            The one exception, stated plainly: if <em>you</em> choose to join a waitlist or the Guild, we
            ask for your name and email — only to reach you, and we tell you exactly why right where you
            enter it. Reading and analyzing stay anonymous, always.
          </p>
        </section>
      )}

      {/* Tailored community bridge (founder direction 2026-07-20): the report's
          verified results connect to the exact licensed person who solves that
          exact problem — routed to Furlong's OWN disclosed people (the licensed
          lending desk + the Guild's licensed PE), never generic third parties.
          The logical next step, not a generic "contact us". */}
      {!deepView && (() => {
        const pf = facts?.placeFacts;
        const rows: { finding: string; step: string; href: string; accent: string }[] = [];
        if (pf?.flood) rows.push({ finding: `This site maps to FEMA flood zone ${pf.flood.floodZone}`, step: "Review the boundary + a Phase I with the Guild's licensed PE", href: "/explore?lane=environmental-compliance", accent: "#0f6e56" });
        if (pf?.opportunityZone?.rural) rows.push({ finding: "USDA-rural eligible ground", step: "Line up the USDA loan with the licensed lending desk", href: "/explore?lane=financing-capital", accent: "#534AB7" });
        if (pf?.opportunityZone || pf?.nmtc) rows.push({ finding: pf?.opportunityZone && pf?.nmtc ? "Opportunity Zone + NMTC tract" : pf?.opportunityZone ? "Opportunity Zone tract" : "NMTC low-income community tract", step: "Map the capital-gains / community-lending structure with the licensed desk", href: "/explore?lane=financing-capital", accent: "#534AB7" });
        if (rows.length === 0) rows.push({ finding: "Your verified results, above", step: "Bring the whole picture to the licensed lending desk", href: "/explore?lane=financing-capital", accent: "#534AB7" });
        return (
          <section aria-label="Your next step from these results" style={{ display: "grid", gap: 12, border: "1px solid #e9ddc4", borderLeft: "3px solid #c9a84c", background: "#faf6ec", borderRadius: 14, padding: "16px 20px" }}>
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "#96742f", fontFamily: "Georgia, serif" }}>
              From these results — your logical next step
            </span>
            <div style={{ display: "grid", gap: 10 }}>
              {rows.map((r) => (
                <div key={r.finding} style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px 12px", padding: "10px 12px", background: "#ffffff", border: "1px solid #e4e9f0", borderRadius: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#162033", flex: "1 1 200px" }}>{r.finding}</span>
                  <span aria-hidden style={{ color: "#96742f", fontWeight: 800 }}>→</span>
                  <a href={r.href} style={{ fontSize: 13, fontWeight: 800, color: r.accent, textDecoration: "none", flex: "1 1 240px" }}>{r.step} →</a>
                </div>
              ))}
            </div>
            <span style={{ fontSize: 11.5, color: "#7c6f57", lineHeight: 1.55, fontFamily: "Georgia, serif", fontStyle: "italic" }}>
              These route to Furlong&apos;s own disclosed people — the licensed lending desk and the Guild&apos;s licensed PE. Furlong facilitates the introduction; it never decides your deal, and takes no cut of your transaction.
            </span>
          </section>
        );
      })()}

      {/* Bound-edition reservation (ALPHA "mock the desire", founder direction
          2026-07-20): a physical bound edition of this ledger is a future Guild
          benefit; this only measures who wants one. Waitlist signal — no
          payment, no shipping, no PII on the anonymous surface. */}
      {!deepView && (
        <BoundEditionReserve
          propertyId={context.propertyId ?? context.title}
          title={context.title}
          location={context.location}
          propertyType={workspaceProfile.label}
          lane={chartVariant}
        />
      )}

      {/* Switch-property moved from the page top to a quiet, collapsed rail at
          the end (redesign Phase 1): the visitor came to evaluate THIS
          property — leaving it is the last offer, not the first. */}
      <details style={{ ...detailsStyle, background: "#ffffff", padding: "14px 18px" }}>
        <summary style={{ ...summaryStyle, fontSize: 14 }}>
          Evaluating a different property? Paste a link or upload a listing
        </summary>
        <div style={{ paddingTop: 14 }}>
          <PropertyImportLaunchpadEmbedded />
        </div>
      </details>
    </section>
  );
}

const panelStyle = {
  display: "grid",
  gap: 16,
  border: "1px solid #d7deea",
  borderRadius: 16,
  background: "#fff",
  padding: "20px 22px",
} as const;

// Redesign label discipline: interpretation is visually distinct from fact.
const inferredBadge: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 800,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: "#5d687a",
  background: "#eef2f6",
  border: "1px solid #d7deea",
  borderRadius: 999,
  padding: "2px 8px",
};

const verifiedBadgeSmall: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 800,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: "#0f766e",
  background: "#e4efed",
  border: "1px solid #bfe4db",
  borderRadius: 999,
  padding: "2px 8px",
};

// Readiness phrases replace numeric scores (founder refinement #3).
const readinessPill: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: "#3b475a",
  background: "#f4f7fa",
  border: "1px solid #d7deea",
  borderRadius: 999,
  padding: "4px 11px",
};

const pillBlue = {
  fontSize: 12,
  fontWeight: 700,
  borderRadius: 999,
  padding: "6px 10px",
  color: "#12344d",
  background: "#eef4fb",
  border: "1px solid #d7deea",
} as const;

const pillGold = {
  fontSize: 12,
  fontWeight: 700,
  borderRadius: 999,
  padding: "6px 10px",
  color: "#854F0B",
  background: "#fbf5e6",
  border: "1px solid #ead8aa",
} as const;

const pillGray = {
  fontSize: 12,
  fontWeight: 700,
  borderRadius: 999,
  padding: "6px 10px",
  color: "#4d596d",
  background: "#f4f7fb",
  border: "1px solid #d7deea",
} as const;

const actionButtonPrimary = {
  borderRadius: 999,
  border: "none",
  background: "#0f766e",
  color: "#fff",
  fontWeight: 800,
  padding: "10px 16px",
  cursor: "pointer",
} as const;

const actionButtonSecondary = {
  borderRadius: 999,
  border: "1px solid #d7deea",
  background: "#fff",
  color: "#12344d",
  fontWeight: 700,
  padding: "10px 16px",
  cursor: "pointer",
} as const;

const fieldBlock = {
  display: "grid",
  gap: 8,
} as const;

const fieldLabel = {
  fontSize: 13,
  fontWeight: 800,
  color: "#162033",
} as const;

const textareaStyle = {
  fontSize: 13.5,
  lineHeight: 1.6,
  borderRadius: 12,
  border: "1.5px solid #cbd5e1",
  padding: "12px 14px",
  resize: "vertical" as const,
  minHeight: 88,
} as const;

const inputStyle = {
  fontSize: 13.5,
  borderRadius: 12,
  border: "1.5px solid #cbd5e1",
  padding: "11px 13px",
} as const;

const miniCard = {
  display: "grid",
  gap: 6,
  border: "1px solid #e6ebf2",
  borderRadius: 14,
  background: "#fbfcfe",
  padding: "14px 16px",
} as const;

const miniLabel = {
  fontSize: 11.5,
  fontWeight: 800,
  letterSpacing: 0.08,
  textTransform: "uppercase" as const,
  color: "#7a8aa0",
} as const;

const miniText = {
  fontSize: 12.5,
  color: "#5d687a",
  lineHeight: 1.55,
} as const;

const factCard = {
  display: "grid",
  gap: 4,
  border: "1px solid #e6ebf2",
  borderRadius: 12,
  padding: "12px 14px",
  background: "#fbfcfe",
} as const;

const detailsStyle = {
  border: "1px solid #d7deea",
  borderRadius: 14,
  padding: "12px 14px",
  background: "#fcfdff",
} as const;

const summaryStyle = {
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 800,
  color: "#162033",
  listStyle: "none",
} as const;

const reportSection = {
  display: "grid",
  gap: 6,
  border: "1px solid #e6ebf2",
  borderRadius: 12,
  padding: "14px 16px",
  background: "#fbfcfe",
} as const;
