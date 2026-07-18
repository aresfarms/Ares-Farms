"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  FurlongNavigator,
  type NavigatorSnapshot,
} from "@/components/navigator/FurlongNavigator";
import { PlaceFirstDiscovery } from "@/components/discovery/PlaceFirstDiscovery";
import { SavedDraftsRail } from "@/components/property/SavedDraftsRail";
import { PropertyImportLaunchpadEmbedded } from "@/components/property/PropertyImportLaunchpad";
import { ChartTableBrief, type SimilarHomeLine } from "@/components/property/ChartTableBrief";
import { OwnershipCostPanel } from "@/components/property/OwnershipCostPanel";
import { PropertyResultCard } from "@/components/property/PropertyResultCard";
import { buildPropertyAnalysisHref } from "@/lib/property/propertyAnalysisHref";
import { CHART_THEMES, type ChartVariant } from "@/lib/property/chartThemes";
import { buildEquityOutlook, buildOwnershipCostModel, buildPriceContext, type OwnershipCostContext } from "@/lib/property/ownershipCostModel";
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
    bedrooms: number | null;
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
  return /(home|house|residential|single family|condo|duplex)/i.test(
    [context.propertyType, context.categoryLabel ?? "", context.description ?? "", context.title].join(" ")
  );
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

  return {
    label: "Too early to rely on",
    explanation:
      "The property may still be interesting, but the intended use and operating thesis are not yet defined tightly enough for a meaningful evaluation.",
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
}) {
  const [navigator, setNavigator] = useState<NavigatorSnapshot | null>(null);
  // Visitor's answer to "what is this property?" — an imported address carries
  // no type, and the wrong default (a working farm read as a home) sends every
  // lane wrong (founder-caught on her own farm, 2026-07-18). Session-only.
  const [profileOverride, setProfileOverride] = useState<PropertyProfileId | null>(null);
  const [facts, setFacts] = useState<PropertyFactsResponse | null>(null);
  const [factsLoading, setFactsLoading] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [pdfBusy, setPdfBusy] = useState<"export" | "print" | "view" | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [manualReviewBusy, setManualReviewBusy] = useState(false);
  const [manualReviewMessage, setManualReviewMessage] = useState<string | null>(null);
  const [manualReviewError, setManualReviewError] = useState<string | null>(null);
  const [manualPriceLabel, setManualPriceLabel] = useState("");
  // Result card is the DEFAULT free-tier view (founder direction 2026-07-17);
  // the complete chart stays one click behind it — depth, not withholding.
  const [chartOpen, setChartOpen] = useState(false);
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
    void (async () => {
      try {
        const res = await fetch("/api/public/property-facts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            propertyId: context.propertyId,
            exactAddress: context.exactAddress,
            location: context.location,
            stateCode: context.stateCode,
            // The visitor's "what is this property?" declaration — the server
            // rebuilds the whole Place Brief in that shape (farm lanes for a
            // farm, never home-mortgage copy on a working farm).
            declaredPropertyType: profileOverride,
          }),
        });
        const data = (await res.json()) as PropertyFactsResponse;
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
  }, [context.propertyId, profileOverride]);

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
                    Open the public source ↗
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
              <FurlongNavigator initialMessage={context.initialMessage} onStateChange={setNavigator} />
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
  const effectivePlaceIntelligence = context.propertyId?.startsWith("imported:")
    ? facts?.placeIntelligence ?? placeIntelligence ?? null
    : placeIntelligence ?? facts?.placeIntelligence ?? null;
  // Canonical property profile (axis 1) — the brief's server classification
  // wins; fall back to classifying the context type for older API payloads.
  // The VISITOR'S declaration wins over any machine classification — the
  // owner knows it's a working farm; the classifier can only read type text.
  const workspaceProfile = profileOverride
    ? profileById(profileOverride)
    : effectivePlaceIntelligence?.profile ??
      classifyPropertyProfile({
        propertyType: analysisContext.propertyType,
        description: analysisContext.description ?? null,
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
            placeFacts: (effectivePlaceIntelligence?.verifiedFacts ?? []).map((fact) => ({
              label: fact.label,
              value: fact.value,
              source: fact.provenance.replace(/^Source:\s*/i, "").split("·")[0].trim(),
            })),
            diligenceCosts: effectivePlaceIntelligence?.diligenceCosts ?? [],
            ownershipCosts:
              listedPrice != null &&
              ownershipContext &&
              chartVariant !== "finance" &&
              profileUsesResidentialLanes(workspaceProfile.id)
                ? formatOwnershipCostsForPdf({
                    listedPrice,
                    ownershipContext,
                    isHome: isResidentialHomeContext(analysisContext),
                    farmShaped: workspaceProfile.id === "farm",
                    farmMode: workspaceProfile.id === "farm",
                  })
                : undefined,
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
        throw new Error(tokenBody?.error || "The report attestation service returned an unexpected error.");
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

  function printDraft() {
    void (async () => {
      setPdfBusy("print");
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write("<title>Preparing FURLONG report</title><body style=\"font-family: Georgia, serif; padding: 24px; color: #162033;\">Preparing your watermarked report…</body>");
        printWindow.document.close();
      }
      try {
        const payload = await requestReportPdf();
        if (!payload) {
          printWindow?.close();
          return;
        }
        const { blob } = payload;
        const url = window.URL.createObjectURL(blob);
        if (printWindow) {
          printWindow.location.href = url;
          window.setTimeout(() => {
            try {
              printWindow.focus();
              printWindow.print();
            } catch {
              // If the browser's PDF viewer controls the print timing, opening the
              // generated file is still a usable fallback for the customer.
            }
          }, 900);
        } else {
          window.open(url, "_blank");
        }
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
  const topProgramPreview = topProgramRanks.slice(0, 2).map(
    (entry, index) => `${index + 1}. ${entry.program.name}`
  );

  // ── Result card content (free tier default view, ≤10 numbered bullets) ────
  const cardGreenFlags = (effectivePlaceIntelligence?.verifiedFacts ?? [])
    .filter((fact) => fact.tone === "positive")
    .slice(0, 4)
    .map((fact) => ({ label: fact.label, value: fact.value }));
  const cardWatchFlags = [
    ...(effectivePlaceIntelligence?.verifiedFacts ?? [])
      .filter((fact) => fact.tone === "caution")
      .map((fact) => ({ label: fact.label, value: fact.value })),
    ...(effectivePlaceIntelligence?.unknowns ?? []).map((unknown) => ({
      label: unknown.label,
      value: `${unknown.pointer} answers it`,
    })),
  ].slice(0, 4);
  const cardModel =
    ownershipContext && listedPrice != null && profileUsesResidentialLanes(workspaceProfile.id)
      ? buildOwnershipCostModel(
          {
            price: listedPrice,
            priceIsAssumption: false,
            isHome: isResidentialHomeContext(analysisContext),
            farmShaped: workspaceProfile.id === "farm",
                    farmMode: workspaceProfile.id === "farm",
          },
          ownershipContext
        )
      : null;
  const cardNumbersLine = cardModel
    ? `All-in monthly on ${cardModel.monthlyTotals[0].program}: $${cardModel.monthlyTotals[0].low.toLocaleString("en-US")}–$${cardModel.monthlyTotals[0].high.toLocaleString("en-US")} · typically works from ≈$${cardModel.purchase.scenarios[0].incomeGuidance.comfortableAnnual.toLocaleString("en-US")}/yr household income · year 1 all-in $${cardModel.horizon.year1.low.toLocaleString("en-US")}–$${cardModel.horizon.year1.high.toLocaleString("en-US")}, then $${cardModel.horizon.years2to5.low.toLocaleString("en-US")}–$${cardModel.horizon.years2to5.high.toLocaleString("en-US")} across years 2–5. Illustrative guidance at the current Freddie Mac average rate — never a quote or approval.`
    : /price on request/i.test(analysisContext.priceLabel ?? "")
      ? "No published price on this listing — open the full chart and enter the price you would offer; the complete cost and income picture fills in on this page only."
      : null;
  const cardOverallRead = [
    report.verdict.explanation,
    answerCard.fitLine ? `Fits if you want: ${answerCard.fitLine}.` : null,
    `Pause if you need: ${answerCard.pauseLine}.`,
  ]
    .filter(Boolean)
    .join(" ");
  // The case, honestly (founder direction 2026-07-17: the report should say
  // WHY someone might buy or walk — argued from verified facts, never a
  // verdict; good-buy-or-pass turns on price and condition, which stay
  // the reader's to establish).
  const cardPriceContext =
    ownershipContext && listedPrice != null ? buildPriceContext(listedPrice, ownershipContext) : null;
  const caseForBits = [
    ...cardGreenFlags.slice(0, 3).map((flag) => `${flag.label.toLowerCase()} — ${flag.value}`),
    cardPriceContext && cardPriceContext.ratio <= 1.0
      ? `priced at about ${Math.round(cardPriceContext.ratio * 100)}% of the county's typical home value`
      : null,
    ownershipContext?.taxContext && ownershipContext.taxContext.effectiveRatePct < 1.0
      ? `county property taxes run light (~${ownershipContext.taxContext.effectiveRatePct}% of value per year)`
      : null,
    (analysisContext.sourceId ?? "") === "hud" && workspaceProfile.id === "residential"
      ? "as a live-in buyer you bid in the HUD owner-occupant window, before any investor is allowed"
      : null,
  ].filter((bit): bit is string => Boolean(bit));
  const caseAgainstBits = [
    "condition is unknown until an inspection — this is an as-is sale",
    ...cardWatchFlags
      .filter((flag) => !/condition/i.test(flag.label))
      .slice(0, 2)
      .map((flag) => `${flag.label.toLowerCase()} still needs an answer (${flag.value.replace(/ answers it$/, "")})`),
    cardModel
      ? `carrying it comfortably typically takes household income around $${cardModel.purchase.scenarios[0].incomeGuidance.comfortableAnnual.toLocaleString("en-US")}/yr`
      : null,
    cardPriceContext && cardPriceContext.ratio > 1.15
      ? `priced above the county's typical home value — the appraisal will test it`
      : null,
  ].filter((bit): bit is string => Boolean(bit));
  const cardCaseFor = caseForBits.length > 0 ? `The case for: ${caseForBits.join("; ")}.` : null;
  const cardCaseAgainst = `The case against — or still open: ${caseAgainstBits.join("; ")}.`;
  const cardDecisionLine =
    "Good buy or pass? That turns on the two things nobody can verify from a distance — the negotiated price and what the inspection finds. This chart arms that decision; it never makes it. If this one doesn't fit, the nearby alternatives on the chart are the honest next look, and any listing from anywhere can be pasted in for the same treatment.";
  const cardTierLine =
    "The full chart below is free and complete. Paid tiers add the why — lender-ready packaging, county records pulls, and your personalized file.";

  const chartActionsSlot = (
    <div style={{ display: "grid", gap: 8, justifyItems: "start" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
        {context.listingUrl && (
          <Link href={context.listingUrl} style={{ color: "#185FA5", textDecoration: "underline", fontWeight: 700 }}>
            Open the source listing ↗
          </Link>
        )}
        {/* Streamlined to three distinct actions (founder direction
            2026-07-17): one PDF button (view/download/print were three routes
            to the same watermarked PDF), the zero-PII device draft, and the
            governed Furlong account path. */}
        <button type="button" onClick={exportDraft} style={actionButtonPrimary} disabled={pdfBusy !== null}>
          {pdfBusy !== null ? "Preparing PDF..." : "Download the PDF"}
        </button>
        <button type="button" onClick={saveDraft} style={actionButtonSecondary}>
          Save draft on this device
        </button>
        {/* The PLATFORM save is the existing governed borrower pathway —
            onboarding collects identity under the established consent and
            data-rights framework; no parallel PII store is created here
            (public-alpha posture: piiPermitted stays a founder/counsel
            flag). Device save stays the zero-PII default. */}
        <Link
          href={`/onboarding?from=${encodeURIComponent(chartHref)}`}
          style={{ ...actionButtonSecondary, textDecoration: "none", display: "inline-flex", alignItems: "center" }}
        >
          Save with Furlong →
        </Link>
        {savedAt && (
          <span style={{ fontSize: 12, color: "#7a8aa0" }}>
            Saved {new Date(savedAt).toLocaleString()}
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
    <section style={{ display: "grid", gap: 22 }}>
      {!deepView && (
        <PropertyResultCard
          theme={CHART_THEMES[chartVariant]}
          title={context.title}
          location={context.location}
          priceLabel={analysisContext.priceLabel}
          profileLabel={workspaceProfile.label}
          verdictLine={answerCard.headline}
          greenFlags={cardGreenFlags}
          watchFlags={cardWatchFlags}
          numbersLine={cardNumbersLine}
          overallRead={cardOverallRead}
          caseFor={cardCaseFor}
          caseAgainst={cardCaseAgainst}
          decisionLine={cardDecisionLine}
          tierLine={cardTierLine}
          chartOpen={chartOpen}
          onToggleChart={() => setChartOpen((current) => !current)}
          actionsSlot={chartActionsSlot}
        />
      )}
      {/* "What is this property?" — imported addresses carry no type, and the
          wrong guess mis-lanes everything (a working farm shown FHA/USDA-rural
          home loans it can never get — founder-caught on her own farm,
          2026-07-18). The owner's answer reshapes the whole analysis. */}
      {context.propertyId?.startsWith("imported:") && (
        <section
          aria-label="What is this property?"
          style={{
            display: "grid",
            gap: 10,
            border: "1px solid #d7deea",
            background: "#ffffff",
            borderRadius: 14,
            padding: "14px 18px",
            margin: "0 0 14px",
          }}
        >
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: 8 }}>
            <strong style={{ fontSize: 14.5, color: "#101a2b" }}>What is this property?</strong>
            <span style={{ fontSize: 12.5, color: "#4d596d" }}>
              An address alone can&apos;t tell us — and the financing lanes, costs, and questions all follow
              your answer. A working farm is not underwritten like a home.
            </span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {allProfiles().map((profile) => {
              const active = workspaceProfile.id === profile.id;
              return (
                <button
                  key={profile.id}
                  type="button"
                  onClick={() => setProfileOverride(profile.id)}
                  aria-pressed={active}
                  style={{
                    padding: "7px 14px",
                    borderRadius: 999,
                    border: active ? "1px solid #0f766e" : "1px solid #d7deea",
                    background: active ? "#0f766e" : "#ffffff",
                    color: active ? "#ffffff" : "#3b475a",
                    fontSize: 13,
                    fontWeight: active ? 700 : 500,
                    cursor: "pointer",
                  }}
                >
                  {profile.label}
                </button>
              );
            })}
          </div>
          {profileOverride && (
            <span style={{ fontSize: 12, color: "#0f766e" }}>
              Read as: {workspaceProfile.label}. The chart below follows this shape.
            </span>
          )}
        </section>
      )}

      {!deepView && chartOpen && (
      <ChartTableBrief
        variant={chartVariant}
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
              listedPrice={listedPrice}
              isHome={isResidentialHomeContext(analysisContext)}
              farmShaped={workspaceProfile.id === "farm"}
              farmMode={workspaceProfile.id === "farm"}
              profileId={workspaceProfile.id}
            />
          ) : null
        }
        similarHomes={similarHomes}
        actionsSlot={chartActionsSlot}
      />
      )}
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
        {context.propertyId?.startsWith("imported:") && verification && (
          <section
            style={{
              display: "grid",
              gap: 12,
              border: `1px solid ${verificationPalette.border}`,
              borderRadius: 18,
              background: verificationPalette.background,
              padding: "16px 18px",
            }}
          >
            <div style={{ display: "grid", gap: 4 }}>
              <span style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: 0.08, textTransform: "uppercase", color: verificationPalette.label }}>
                Verification rail
              </span>
              <strong style={{ fontSize: 18, color: "#162033" }}>
                {verificationStatusCopy(verification.status)}
              </strong>
              <span style={{ fontSize: 12.5, color: verificationPalette.text, lineHeight: 1.6 }}>
                {verification.normalizedAddress
                  ? `Address checked: ${verification.normalizedAddress}`
                  : "No normalized imported address is available yet."}
              </span>
            </div>
            <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
              <div style={factCard}>
                <strong style={{ fontSize: 13.5, color: "#162033" }}>Imported address posture</strong>
                <span style={{ fontSize: 12.5, color: "#3b475a", lineHeight: 1.55 }}>
                  {verification.parsedAddress
                    ? `${verification.parsedAddress.street} · ${verification.parsedAddress.city}, ${verification.parsedAddress.state}${verification.parsedAddress.zip ? ` ${verification.parsedAddress.zip}` : ""}`
                    : "Address could not be parsed into a reliable verification shape yet."}
                </span>
              </div>
              <div style={factCard}>
                <strong style={{ fontSize: 13.5, color: "#162033" }}>Verification outcome</strong>
                <span style={{ fontSize: 12.5, color: "#3b475a", lineHeight: 1.55 }}>
                  {verification.status === "verified"
                    ? "At least one live public place-fact source attached a positive result to this imported address."
                    : verification.status === "partial"
                      ? "Live public place-fact checks ran, but no positive designation or condition was confirmed yet."
                      : verification.status === "blocked"
                        ? "The portal stopped this import because the input crossed a restricted public-surface boundary."
                        : "The portal could not get this imported address into a strong enough verification shape yet."}
                </span>
              </div>
              <div style={factCard}>
                <strong style={{ fontSize: 13.5, color: "#162033" }}>
                  {sourceVerification.title}
                </strong>
                <span style={{ fontSize: 12.5, color: "#3b475a", lineHeight: 1.55 }}>
                  {sourceVerification.detail}
                </span>
                <span style={{ fontSize: 11.5, color: "#6b7280", lineHeight: 1.5 }}>
                  {context.sourceVerificationStatus === "matched-approved-source-record"
                    ? `Approved source record: ${context.matchedSourceRecordId ?? "matched internally"}`
                    : "Current live checks here cover Furlong-approved public-source verification, not unrestricted live scraping of outside listing sites like Crexi or Realtor."}
                </span>
                {sourceCandidateNote ? (
                  <span style={{ fontSize: 11.5, color: "#6b7280", lineHeight: 1.5 }}>
                    {sourceCandidateNote}
                  </span>
                ) : null}
              </div>
              <div style={factCard}>
                <strong style={{ fontSize: 13.5, color: "#162033" }}>Verified source checks</strong>
                <div style={{ display: "grid", gap: 8 }}>
                  {verificationSourceChecks.map((check) => (
                    <div
                      key={check.label}
                      style={{
                        display: "grid",
                        gap: 3,
                        borderRadius: 12,
                        padding: "10px 11px",
                        border: `1px solid ${check.hit ? "#bfe4db" : check.active ? "#d7deea" : "#ead8aa"}`,
                        background: check.hit ? "#f2fbf8" : check.active ? "#f7fbff" : "#fffaf0",
                      }}
                    >
                      <span style={{ fontSize: 11.5, fontWeight: 800, color: check.hit ? "#0f6e56" : check.active ? "#4d596d" : "#854F0B" }}>
                        {check.label}: {check.hit ? "Verified" : check.active ? "Checked" : "Offline"}
                      </span>
                      <span style={{ fontSize: 12, color: "#3b475a", lineHeight: 1.45 }}>
                        {check.detail}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={factCard}>
                <strong style={{ fontSize: 13.5, color: "#162033" }}>What this changes</strong>
                <div style={{ display: "grid", gap: 6 }}>
                  {verificationDealSignals.length > 0 ? (
                    verificationDealSignals.slice(0, 4).map((line) => (
                      <span key={line} style={{ fontSize: 12.5, color: "#3b475a", lineHeight: 1.55 }}>
                        {line}
                      </span>
                    ))
                  ) : (
                    <span style={{ fontSize: 12.5, color: "#3b475a", lineHeight: 1.55 }}>
                      No positive place-based designation was confirmed yet, so this imported property should still be treated as an unproven opportunity rather than a source-backed fit.
                    </span>
                  )}
                </div>
              </div>
              <div style={factCard}>
                <strong style={{ fontSize: 13.5, color: "#162033" }}>Warnings and boundaries</strong>
                <div style={{ display: "grid", gap: 6 }}>
                  {verificationWarnings.length > 0 ? (
                    verificationWarnings.slice(0, 4).map((line) => (
                      <span key={line} style={{ fontSize: 12.5, color: "#3b475a", lineHeight: 1.55 }}>
                        {line}
                      </span>
                    ))
                  ) : (
                    <span style={{ fontSize: 12.5, color: "#3b475a", lineHeight: 1.55 }}>
                      No restricted-input or live-source warning was raised from this imported address check.
                    </span>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Deeper analysis: a DEDICATED PAGE in the same tab (?view=deep) so the
          in-session draft (sessionStorage, per-tab by privacy design) rides
          along; browser Back returns to the chart. Not a new window: separate
          windows would silently drop the visitor's draft answers. */}
      {deepView ? (
        <section style={{ display: "grid", gap: 16 }}>
          <a
            href={chartHref}
            style={{ fontSize: 13.5, fontWeight: 700, color: "#0f766e", textDecoration: "underline", textUnderlineOffset: 2, justifySelf: "start" }}
          >
            ← Back to the property chart
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
                  <FurlongNavigator initialMessage={context.initialMessage} onStateChange={setNavigator} />
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
