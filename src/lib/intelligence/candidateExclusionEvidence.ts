import type { ScenarioCandidateRole } from "./scenarioRankingPlan";
import { assessEconomicSourceReferences, type EconomicEvidenceSource } from "./economicEvidencePackage";
import { normalizedListingAddress } from "@/lib/property/listingPriceEvidence";

/** FURLONG-VISION-001 / September 4 amendment; TECH-PROV-001 and
 * CANON-EXPL-001. A reviewed, sourced exclusion closes one decision role;
 * missing data never does. Excluded uses have no invented economic projection.
 */
export const CANDIDATE_EXCLUSION_VERSION = "candidate-exclusion-evidence-v1.0.0" as const;
export const CANDIDATE_ROLES = ["best-single-enterprise", "best-mixed-use", "customer-vision", "best-distinct-alternative"] as const;
const BLOCKING_DOMAINS = ["physical-suitability", "legal-use", "environmental", "engineering", "market-demand"] as const;
export interface CandidateExclusionEvidence {
  version: typeof CANDIDATE_EXCLUSION_VERSION;
  exclusionId: string;
  propertyId: string;
  address: string;
  generatedAt: string;
  classification: "CONFIDENTIAL";
  traceId: string;
  replayRef: string;
  candidateRole: ScenarioCandidateRole;
  screeningScope: string;
  summary: string;
  propertyIdentity: { summary: string; sourceRefs: string[] };
  consideredUses: Array<{
    title: string;
    enterpriseComponents: string[];
    blockingDomain: (typeof BLOCKING_DOMAINS)[number];
    status: "blocked";
    summary: string;
    sourceRefs: string[];
    confidenceScore: number;
  }>;
  sources: EconomicEvidenceSource[];
  review: {
    status: "reviewed" | "verified";
    reviewerRole: string;
    reviewedAt: string;
    allMaterialAlternativesReviewed: true;
    note: string;
  };
}
const record = (value: unknown): Record<string, unknown> | null => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
const text = (value: unknown): value is string => typeof value === "string" && Boolean(value.trim());
const texts = (value: unknown): value is string[] => Array.isArray(value) && value.length > 0 && value.every(text);
export function isCandidateExclusionEvidence(value: unknown): value is CandidateExclusionEvidence {
  const x = record(value), identity = record(x?.propertyIdentity), review = record(x?.review);
  return Boolean(x && x.version === CANDIDATE_EXCLUSION_VERSION && x.classification === "CONFIDENTIAL" &&
    [x.exclusionId, x.propertyId, x.address, x.generatedAt, x.traceId, x.replayRef, x.screeningScope, x.summary].every(text) &&
    CANDIDATE_ROLES.includes(x.candidateRole as ScenarioCandidateRole) &&
    identity && text(identity.summary) && texts(identity.sourceRefs) &&
    Array.isArray(x.sources) && x.sources.length > 0 && x.sources.every(s => Boolean(record(s))) &&
    Array.isArray(x.consideredUses) && x.consideredUses.length > 0 && x.consideredUses.length <= 100 && x.consideredUses.every(value => {
      const use = record(value);
      return Boolean(use && text(use.title) && texts(use.enterpriseComponents) && use.status === "blocked" &&
        BLOCKING_DOMAINS.includes(use.blockingDomain as (typeof BLOCKING_DOMAINS)[number]) && text(use.summary) &&
        texts(use.sourceRefs) && typeof use.confidenceScore === "number" && Number.isFinite(use.confidenceScore));
    }) && review && ["reviewed", "verified"].includes(String(review.status)) && text(review.reviewerRole) &&
    text(review.reviewedAt) && text(review.note) && review.allMaterialAlternativesReviewed === true);
}

export function candidateRoleCoverageProblems(roles: readonly string[]): string[] {
  const third = roles.filter(role => role === "customer-vision" || role === "best-distinct-alternative");
  return roles.length === 3 && new Set(roles).size === 3 && roles.includes("best-single-enterprise") &&
    roles.includes("best-mixed-use") && third.length === 1 ? [] : [
      "The single-enterprise, mixed-use and vision/distinct-alternative roles each require one complete economic package or one supported exclusion.",
    ];
}

export function assessCandidateExclusion(input: unknown, target: {
  propertyId: string; address: string; asOf: string;
}): { complete: boolean; missingEvidence: string[]; sourceRefs: string[] } {
  if (!isCandidateExclusionEvidence(input)) return { complete: false, missingEvidence: ["A structurally valid reviewed candidate exclusion is required."], sourceRefs: [] };
  const missing: string[] = [];
  if (input.propertyId !== target.propertyId || normalizedListingAddress(input.address) !== normalizedListingAddress(target.address)) {
    missing.push("The candidate exclusion does not match the property identity and address.");
  }
  const asOf = Date.parse(target.asOf), generated = Date.parse(input.generatedAt), reviewed = Date.parse(input.review.reviewedAt);
  if (![asOf, generated, reviewed].every(Number.isFinite) || generated > asOf || reviewed > asOf || reviewed > generated) {
    missing.push("Candidate exclusion generation and review dates must be valid and no later than the assessment date.");
  }
  const titles = input.consideredUses.map(use => use.title.trim().toLowerCase());
  if (new Set(titles).size !== titles.length) missing.push("Excluded uses must be distinct within the reviewed scope.");
  for (const use of input.consideredUses) {
    const components = new Set(use.enterpriseComponents.map(c => c.trim().toLowerCase()));
    if (components.size !== use.enterpriseComponents.length ||
        (input.candidateRole === "best-single-enterprise" && components.size !== 1) ||
        (input.candidateRole === "best-mixed-use" && components.size < 2)) missing.push("Excluded use components must match the decision role and be distinct.");
    if (use.confidenceScore < 60 || use.confidenceScore > 100) missing.push("Every excluded use requires evidence confidence from 60 to 100.");
  }
  const refs = [...new Set([...input.propertyIdentity.sourceRefs, ...input.consideredUses.flatMap(use => use.sourceRefs)])];
  const sources = assessEconomicSourceReferences({ sources: input.sources, sourceRefs: refs, asOf: target.asOf });
  missing.push(...sources.missingEvidence);
  if (input.sources.some(source => refs.includes(source.id) && Date.parse(source.capturedAt) > reviewed)) {
    missing.push("Exclusion review must follow capture of all relied-upon sources.");
  }
  return { complete: missing.length === 0, missingEvidence: [...new Set(missing)].sort(), sourceRefs: refs };
}
