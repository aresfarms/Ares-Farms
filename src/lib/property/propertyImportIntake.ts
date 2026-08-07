import { createHash } from "node:crypto";

import {
  looksLikeListingUrl,
  resolveListingInput,
  type ListingSource,
} from "@/lib/navigator/listingIntake";
import { sanitizeIngestText } from "@/lib/security/ingestSanitizer";

import { buildPropertyAnalysisHref } from "./propertyAnalysisHref";
import { isHealthcareRestrictedCategory, matchRestrictedAsset } from "./restrictedAssetRegistry";

type ImportMode = "paste" | "image";

export type ImportedPropertyContext = {
  propertyId: string;
  title: string;
  location: string;
  propertyType: string;
  sourceLabel: string;
  priceLabel: string;
  vintage: string;
  exactAddress: string | null;
  description: string | null;
  listingUrl: string | null;
  currentLabel: string;
  pathwayList: string[];
  stateCode: string | null;
  county: string | null;
  town: string | null;
  warnings: string[];
  importScreeningStatus: "normal" | "reroute";
  importScreeningCategory: "standard-property" | "special-asset" | "restricted-asset";
  importScreeningSummary: string | null;
  importScreeningReasons: string[];
  salePosture: "listing-source-present" | "official-disposition-source" | "unverified-public-claim" | "not-for-sale-likely";
  manualReviewRequired: boolean;
  manualReviewSummary: string | null;
};

export type ImportedPropertyBlock = {
  blocked: true;
  error: string;
  warnings: string[];
  reasons: string[];
};

type ImportedPropertyScreeningResult = {
  importScreeningStatus: "normal" | "reroute";
  importScreeningCategory: "standard-property" | "special-asset" | "restricted-asset";
  importScreeningSummary: string | null;
  importScreeningReasons: string[];
  salePosture: "listing-source-present" | "official-disposition-source" | "unverified-public-claim" | "not-for-sale-likely";
  manualReviewRequired: boolean;
  manualReviewSummary: string | null;
  warnings: string[];
};

export type ImportedPropertyInput = {
  mode: ImportMode;
  rawInput?: string | null;
  notes?: string | null;
  extractedTitle?: string | null;
  extractedAddress?: string | null;
  extractedLocation?: string | null;
  extractedPropertyType?: string | null;
  extractedPriceLabel?: string | null;
  extractedDescription?: string | null;
  extractedListingUrl?: string | null;
  extractedState?: string | null;
  extractedTown?: string | null;
  extractedCounty?: string | null;
  source?: ListingSource | "image-upload";
};

function normalizedUrl(text: string | null | undefined): string | null {
  if (!text) return null;
  const trimmed = text.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
    return url.toString();
  } catch {
    return null;
  }
}

function keywordScore(text: string, patterns: RegExp[]): number {
  return patterns.reduce((score, pattern) => score + (pattern.test(text) ? 1 : 0), 0);
}

function propertyTypeFrom(text: string): string {
  const value = text.toLowerCase();
  const hospitalityScore = keywordScore(value, [
    /\bhotel\b/, /\binn\b/, /\bmotel\b/, /\blodge\b/, /\bretreat\b/, /\bhospitality\b/,
    /\bevent venue\b/, /\bwedding venue\b/, /\bguest house\b/, /\bboutique stay\b/,
  ]);
  const redevelopmentScore = keywordScore(value, [
    /\bredevelopment\b/, /\badaptive reuse\b/, /\bconversion\b/, /\breposition\b/,
    /\bhistoric\b/, /\binvestment property\b/, /\brestore\b/,
  ]);
  const commercialScore = keywordScore(value, [
    /\bcommercial\b/, /\bretail\b/, /\boffice\b/, /\bwarehouse\b/, /\bindustrial\b/,
    /\bmixed[- ]use\b/, /\bbusiness\b/, /\binvestment\b/,
  ]);
  const farmScore = keywordScore(value, [
    /\bfarm\b/, /\branch\b/, /\bpasture\b/, /\bagric/i, /\bbarn\b/, /\bequine\b/,
    /\borchard\b/, /\blivestock\b/, /\bcrop\b/, /\bhomestead\b/,
  ]);
  const landScore = keywordScore(value, [/\bland\b/, /\blot\b/, /\bparcel\b/, /\bvacant\b/]);
  const residentialScore = keywordScore(value, [
    /\bhouse\b/, /\bhome\b/, /\bresidential\b/, /\bsingle family\b/, /\bmulti family\b/, /\bduplex\b/,
  ]);

  if (hospitalityScore > 0 && hospitalityScore >= Math.max(farmScore, commercialScore)) return "Hospitality property";
  if (redevelopmentScore > 0 && redevelopmentScore >= Math.max(farmScore, hospitalityScore - 1)) return "Redevelopment opportunity";
  if (commercialScore > 0 && commercialScore >= farmScore) return "Commercial property";
  if (farmScore > 0) return "Farm or ranch property";
  if (landScore > 0) return "Land";
  if (/(house|home|residential|single family|multi family|duplex)/.test(value)) return "Residential property";
  return "Property candidate";
}

function normalizeRecoveredPrice(candidate: string | null | undefined): string | null {
  if (!candidate) return null;
  const compact = candidate.replace(/\s+/g, " ").trim();
  if (!compact) return null;

  const exact = compact.match(/\$\s*[\d,.]+(?:\s?(?:million|billion|k|m))?/i);
  if (exact) return exact[0].replace(/\s+/g, "");

  const contextual = compact.match(/\b(?:list price|asking|offered at|priced at|for sale[:\s]*)\s*\$?\s*([\d,.]+(?:\.\d+)?)(?:\s?(million|billion|k|m))?/i);
  if (!contextual) return null;
  const [, amount, suffix] = contextual;
  return `$${amount}${suffix ? suffix : ""}`;
}

function priceLabelFrom(text: string): string {
  const compact = text.replace(/\s+/g, " ");
  return normalizeRecoveredPrice(compact) ?? "Price not yet verified";
}

function pathwaysFrom(propertyType: string, text: string): string[] {
  const joined = `${propertyType} ${text}`.toLowerCase();
  const pathways = new Set<string>();

  if (/(farm|ranch|agric|orchard|livestock|crop|equine|homestead)/.test(joined)) pathways.add("USDA");
  if (/(commercial|business|retail|office|hospitality|warehouse|mixed-use|redevelopment|investment)/.test(joined)) pathways.add("SBA");
  if (/(residential|home|house|multi family)/.test(joined)) pathways.add("Conventional");
  if (/land/.test(joined) && !pathways.has("USDA")) pathways.add("Conventional");
  if (pathways.size === 0) pathways.add("Conventional");

  return Array.from(pathways);
}

function sourceLabelFrom(source: ImportedPropertyInput["source"], mode: ImportMode): string {
  if (source === "crexi") return "Imported from Crexi";
  if (source === "zillow") return "Imported from Zillow";
  if (source === "redfin") return "Imported from Redfin";
  if (source === "loopnet") return "Imported from LoopNet";
  if (source === "other-url") return "Imported from an external listing";
  if (source === "image-upload" || mode === "image") return "Imported from a visitor upload";
  return "Imported by the visitor";
}

function compactTitle(address: string | null, extractedTitle: string | null, propertyType: string): string {
  if (extractedTitle) return sanitizeIngestText(extractedTitle, 120);
  if (!address) return `Imported ${propertyType.toLowerCase()}`;
  const bits = address.split(",").map((bit) => bit.trim()).filter(Boolean);
  return sanitizeIngestText(bits[0] ? `${bits[0]}` : address, 120);
}

function locationFrom(input: {
  address: string | null;
  extractedLocation: string | null;
  extractedTown: string | null;
  extractedCounty: string | null;
  stateCode: string | null;
}): { location: string; town: string | null; county: string | null } {
  const town = input.extractedTown ? sanitizeIngestText(input.extractedTown, 80) : null;
  const county = input.extractedCounty ? sanitizeIngestText(input.extractedCounty, 80) : null;
  if (input.extractedLocation) {
    return {
      location: sanitizeIngestText(input.extractedLocation, 140),
      town,
      county,
    };
  }
  if (town && input.stateCode) {
    return {
      location: `${town}${county ? `, ${county} County` : ""}, ${input.stateCode}`,
      town,
      county,
    };
  }
  if (input.address) {
    return {
      location: sanitizeIngestText(input.address, 140),
      town,
      county,
    };
  }
  return {
    location: input.stateCode ? `Imported property · ${input.stateCode}` : "Imported property",
    town,
    county,
  };
}

function normalizedAddressComparable(value: string | null | undefined): string | null {
  if (!value) return null;
  const normalized = value
    .toLowerCase()
    .replace(/\b(street)\b/g, "st")
    .replace(/\b(avenue)\b/g, "ave")
    .replace(/\b(road)\b/g, "rd")
    .replace(/\b(lane)\b/g, "ln")
    .replace(/\b(drive)\b/g, "dr")
    .replace(/\b(boulevard)\b/g, "blvd")
    .replace(/\b(court)\b/g, "ct")
    .replace(/\b(place)\b/g, "pl")
    .replace(/\b(highway)\b/g, "hwy")
    .replace(/[^a-z0-9]/g, "");
  return normalized || null;
}

function addressesConflict(primary: string | null, secondary: string | null): boolean {
  const a = normalizedAddressComparable(primary);
  const b = normalizedAddressComparable(secondary);
  if (!a || !b) return false;
  if (a === b) return false;
  return !a.includes(b) && !b.includes(a);
}

const OFFICIAL_DISPOSITION_URL_RE =
  /\b(?:gsaauctions\.gov|realestatesales\.gov|govdeals\.com|publicsurplus\.com|sam\.gov|auction\.state\.|surplus\.)\b/i;
const OFFICIAL_DISPOSITION_TEXT_RE =
  /\b(?:public\s+auction|auction\s+notice|government\s+surplus|surplus\s+listing|redevelopment\s+(?:rfp|rfq|opportunity|notice)|disposition\s+notice|official\s+listing|solicitation)\b/i;
const SPECIAL_ASSET_RE =
  /\b(?:airport|airstrip|school|university|college|church|cathedral|museum|historic\s+site|landmark|stadium|arena|civic\s+center|convention\s+center)\b/i;
const GOVERNMENT_ADDRESS_RE =
  /\b(?:washington,\s*dc\s*20500|washington,\s*dc\s*20515|washington,\s*dc\s*20510|washington,\s*dc\s*20220)\b/i;

function assessImportedPropertyScreening(args: {
  rawInput: string;
  notes: string;
  title: string;
  propertyType: string;
  exactAddress: string | null;
  listingUrl: string | null;
  description: string | null;
  inferredAddress: string | null;
  noteAddress: string | null;
}): ImportedPropertyBlock | ImportedPropertyScreeningResult {
  const corpus = [
    args.rawInput,
    args.notes,
    args.title,
    args.propertyType,
    args.exactAddress ?? "",
    args.description ?? "",
  ].join(" ");
  const warnings: string[] = [];
  const reasons: string[] = [];
  const officialDisposition = OFFICIAL_DISPOSITION_TEXT_RE.test(corpus) || OFFICIAL_DISPOSITION_URL_RE.test(args.listingUrl ?? "");
  const restrictedMatch = matchRestrictedAsset(corpus);
  const restrictedAsset = Boolean(restrictedMatch) || GOVERNMENT_ADDRESS_RE.test(args.exactAddress ?? "");
  const healthcareRestricted = isHealthcareRestrictedCategory(restrictedMatch);
  const specialAsset = !restrictedAsset && SPECIAL_ASSET_RE.test(corpus);
  const listingUrlPresent = Boolean(args.listingUrl);
  const addressMismatch =
    addressesConflict(args.exactAddress, args.inferredAddress) ||
    addressesConflict(args.exactAddress, args.noteAddress);

  if (addressMismatch) {
    return {
      blocked: true,
      error: "The imported property appears to contain conflicting address details. Please correct the address or paste the actual source listing before analysis.",
      warnings: ["Conflicting address signals were detected across the imported material."],
      reasons: [
        `Recovered address: ${args.exactAddress ?? "none"}.`,
        `Conflicting intake text: ${args.inferredAddress ?? "none"}.`,
        `Conflicting note address: ${args.noteAddress ?? "none"}.`,
      ],
    };
  }

  if (healthcareRestricted) {
    return {
      blocked: true,
      error: "Healthcare and medical-care facilities are restricted under Furlong's intake protocols and cannot be analyzed through the public property flow.",
      warnings: ["Healthcare or medical-care asset detected in the imported material."],
      reasons: [
        "The input matched a hospital, clinic, medical center, or other healthcare-care facility pattern.",
        "Those addresses are restricted from ordinary public intake under current platform protocols.",
      ],
    };
  }

  if (restrictedAsset && !officialDisposition) {
    return {
      blocked: true,
      error: "This looks like a government, landmark, or other restricted asset without a verified public sale or disposition source, so Furlong cannot treat it as a normal property candidate.",
      warnings: ["Restricted or government asset detected without an official public disposition source."],
      reasons: [
        `The input matched a ${restrictedMatch?.label ?? "restricted asset"} pattern.`,
        "No official public auction, surplus, or redevelopment disposition source was recovered from the import.",
      ],
    };
  }

  if (specialAsset && !listingUrlPresent && !officialDisposition) {
    warnings.push("This appears to be a special institutional asset, but no verified sale or disposition source was recovered yet.");
  }

  if (restrictedAsset && officialDisposition) {
    reasons.push(`The asset appears restricted or highly sensitive (${restrictedMatch?.label ?? "restricted asset"}), but an official public disposition signal was present.`);
    return {
      importScreeningStatus: "reroute",
      importScreeningCategory: "restricted-asset",
      importScreeningSummary: "Restricted asset routed into manual public-disposition review only.",
      importScreeningReasons: reasons,
      salePosture: "official-disposition-source",
      manualReviewRequired: true,
      manualReviewSummary: "This asset can only move forward through manual Furlong review after the team verifies that it is genuinely marketed and for sale through an appropriate public disposition path.",
      warnings,
    };
  }

  if (specialAsset) {
    if (officialDisposition) reasons.push("An official public disposition signal was recovered for this special asset.");
    else if (listingUrlPresent) reasons.push("A public source link was recovered, but the asset still needs special-asset posture rather than ordinary listing treatment.");
    else reasons.push("No verified sale posture was recovered, so this asset should stay in special-asset review rather than ordinary listing analysis.");
    return {
      importScreeningStatus: "reroute",
      importScreeningCategory: "special-asset",
      importScreeningSummary: "Special asset routed into high-level feasibility review instead of standard property analysis.",
      importScreeningReasons: reasons,
      salePosture: officialDisposition
        ? "official-disposition-source"
        : listingUrlPresent
          ? "unverified-public-claim"
          : "not-for-sale-likely",
      manualReviewRequired: officialDisposition,
      manualReviewSummary: officialDisposition
        ? "This special building should be handled through manual Furlong review after the sale posture is verified."
        : null,
      warnings,
    };
  }

  if (!listingUrlPresent && /\b(?:white\s+house|capitol|pentagon)\b/i.test(corpus)) {
    return {
      blocked: true,
      error: "This import does not appear to be a real for-sale property candidate.",
      warnings: ["No public listing source was recovered and the input resembles a landmark or restricted address."],
      reasons: [
        "The import matches a landmark or restricted property pattern.",
        "No listing URL or official disposition source was provided.",
      ],
    };
  }

  return {
    importScreeningStatus: "normal",
    importScreeningCategory: "standard-property",
    importScreeningSummary: null,
    importScreeningReasons: [],
    salePosture: listingUrlPresent ? "listing-source-present" : "unverified-public-claim",
    manualReviewRequired: false,
    manualReviewSummary: null,
    warnings,
  };
}

export function buildImportedPropertyContext(input: ImportedPropertyInput): ImportedPropertyContext | ImportedPropertyBlock {
  const rawInput = sanitizeIngestText(input.rawInput, 1000);
  const notes = sanitizeIngestText(input.notes, 1000);
  const extractedDescription = sanitizeIngestText(input.extractedDescription, 1000);
  const inferred = resolveListingInput(rawInput) ?? resolveListingInput(input.extractedAddress ?? "");
  const listingUrl = normalizedUrl(input.extractedListingUrl) ?? (looksLikeListingUrl(rawInput) ? normalizedUrl(rawInput) : null);
  const exactAddress = sanitizeIngestText(input.extractedAddress, 180) || inferred?.addressText || null;
  const classificationText = [
    exactAddress,
    notes,
    extractedDescription,
    sanitizeIngestText(input.extractedTitle, 120),
    sanitizeIngestText(input.extractedPropertyType, 80),
  ].filter(Boolean).join(" ");
  const propertyType = sanitizeIngestText(input.extractedPropertyType, 80) || propertyTypeFrom(classificationText);
  const source = input.source
    ?? (input.mode === "image" ? "image-upload" : inferred?.source ?? "plain-address");
  const stateCode = sanitizeIngestText(input.extractedState, 12).toUpperCase() || inferred?.state || null;
  const locationInfo = locationFrom({
    address: exactAddress,
    extractedLocation: input.extractedLocation ?? null,
    extractedTown: input.extractedTown ?? null,
    extractedCounty: input.extractedCounty ?? null,
    stateCode,
  });
  const title = compactTitle(exactAddress, input.extractedTitle ?? null, propertyType);
  const description = sanitizeIngestText([notes, extractedDescription].filter(Boolean).join(" "), 280) || null;
  const extractedPrice = normalizeRecoveredPrice(sanitizeIngestText(input.extractedPriceLabel, 80));
  const recoveredPriceCorpus = [
    rawInput,
    notes,
    extractedDescription,
    sanitizeIngestText(input.extractedTitle, 120),
  ]
    .filter(Boolean)
    .join(" ");
  const priceLabel = extractedPrice ?? priceLabelFrom(recoveredPriceCorpus);
  const pathwayList = pathwaysFrom(propertyType, classificationText);
  const warnings: string[] = [];

  if (!exactAddress) warnings.push("No exact property address was confirmed from the imported material.");
  if (priceLabel === "Price not yet verified") warnings.push("The import did not recover a reliable asking price yet.");
  if (!listingUrl && source !== "image-upload") warnings.push("No direct source URL was preserved from the imported input.");

  const screening = assessImportedPropertyScreening({
    rawInput,
    notes,
    title,
    propertyType,
    exactAddress,
    listingUrl,
    description,
    inferredAddress: inferred?.addressText ?? null,
    noteAddress: resolveListingInput(notes)?.addressText ?? null,
  });
  if ("blocked" in screening) {
    return {
      blocked: true,
      error: screening.error,
      warnings: [...warnings, ...screening.warnings],
      reasons: screening.reasons,
    };
  }

  const propertyId = `imported:${createHash("sha1")
    .update([title, exactAddress ?? "", locationInfo.location, propertyType, listingUrl ?? "", source].join("|"))
    .digest("hex")
    .slice(0, 14)}`;

  return {
    propertyId,
    title,
    location: locationInfo.location,
    propertyType,
    sourceLabel: sourceLabelFrom(source, input.mode),
    priceLabel,
    vintage: "Imported now",
    exactAddress,
    description,
    listingUrl,
    currentLabel: screening.importScreeningStatus === "reroute"
      ? screening.importScreeningCategory === "restricted-asset"
        ? "Restricted asset review only"
        : "Special asset review only"
      : input.mode === "image"
        ? "Visitor-uploaded property candidate"
        : "Visitor-imported property candidate",
    pathwayList,
    stateCode,
    county: locationInfo.county,
    town: locationInfo.town,
    warnings: [...warnings, ...screening.warnings],
    importScreeningStatus: screening.importScreeningStatus,
    importScreeningCategory: screening.importScreeningCategory,
    importScreeningSummary: screening.importScreeningSummary,
    importScreeningReasons: screening.importScreeningReasons,
    salePosture: screening.salePosture,
    manualReviewRequired: screening.manualReviewRequired,
    manualReviewSummary: screening.manualReviewSummary,
  };
}

export function buildImportedPropertyAnalysisHref(input: ImportedPropertyInput): string {
  const context = buildImportedPropertyContext(input);
  if ("blocked" in context) return "/discover";
  return buildPropertyAnalysisHref({
    propertyId: context.propertyId,
    title: context.title,
    location: context.location,
    propertyType: context.propertyType,
    priceLabel: context.priceLabel,
    vintage: context.vintage,
    sourceLabel: context.sourceLabel,
    pathways: context.pathwayList,
    town: context.town,
    county: context.county,
    state: context.stateCode,
    listingUrl: context.listingUrl,
    exactAddress: context.exactAddress,
    description: context.description,
    currentLabel: context.currentLabel,
    importScreeningStatus: context.importScreeningStatus,
    importScreeningCategory: context.importScreeningCategory,
    importScreeningSummary: context.importScreeningSummary,
    importScreeningReasons: context.importScreeningReasons,
    salePosture: context.salePosture,
    manualReviewRequired: context.manualReviewRequired,
    manualReviewSummary: context.manualReviewSummary,
  });
}
