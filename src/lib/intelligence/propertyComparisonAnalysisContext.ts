import type { EnterpriseEconomicEvidencePackage } from "./economicEvidencePackage";
import { REQUIRED_ECONOMIC_EVIDENCE_DOMAINS } from "./economicEvidencePackage";
import { assessStoredEconomicEvidence, storedEconomicPackages, storedCandidateExclusions } from "./storedEconomicEvidence";
import { resolvePropertyFacts, type PropertyFactsSnapshot } from "@/lib/property/propertyFactsService";
import { normalizedListingAddress } from "@/lib/property/listingPriceEvidence";
import { classifyPropertyProfile } from "@/lib/property/propertyProfile";

import type { CandidateExclusionEvidence } from "./candidateExclusionEvidence";

export interface PropertyComparisonAnalysisItem {
  id: string;
  comparisonId: string;
  submittedAddress: string;
  normalizedAddress: string | null;
  propertyId: string | null;
  resultSnapshot: unknown;
}
export interface PropertyComparisonAnalysisContext {
  version: "property-comparison-analysis-context-v1.0.0";
  propertyId: string;
  address: string;
  profileId: ReturnType<typeof classifyPropertyProfile>["id"];
  profileLabel: string;
  propertyType: string | null;
  currentUse: string | null;
  askingPrice: number | null;
  squareFeet: number | null;
  acreageText: string | null;
  zoning: string | null;
  county: string | null;
  state: string | null;
  parcelAccountId: string | null;
  sourceRefs: string[];
}
export interface PropertyComparisonAnalysisReadiness {
  context: PropertyComparisonAnalysisContext;
  evidencePackages: EnterpriseEconomicEvidencePackage[] | null;
  candidateExclusions?: CandidateExclusionEvidence[];
  missingEvidence: string[];
  evidenceCapture?: {
    version: "property-evidence-capture-v1";
    capturedAt: string;
    classification: "CONFIDENTIAL";
    facts: PropertyFactsSnapshot;
    checklist: Array<{ domain: string; status: "captured" | "needed"; action: string }>;
  };
}

const ACTIONS: Record<(typeof REQUIRED_ECONOMIC_EVIDENCE_DOMAINS)[number], string> = {
  "property-identity": "Match the address and every parcel included in the property with official records.",
  "current-and-advertised-use": "Confirm recorded use, actual operating use and the current offering; a property type alone does not establish all three.",
  "acquisition-price": "Obtain a current permitted listing or a supported proposed purchase price; an assessment is not a purchase price.",
  "physical-suitability": "Confirm usable acreage, building condition, utilities and capacity for each candidate use.",
  "legal-use": "Check the local zoning ordinance, overlays, easements and required approvals for each candidate use.",
  environmental: "Resolve parcel-specific environmental limitations and any investigation required for each use.",
  engineering: "Verify access, structures, water, wastewater and code capacity for each use.",
  "market-demand": "Obtain current local demand evidence for the proposed products or services.",
  competition: "Identify relevant competitors, capacity, pricing and comparable operations.",
  revenue: "Support sales volumes and prices with applicable records; regional averages alone are not a property forecast.",
  labor: "Support staffing, wages and owner hours for each use.",
  "employee-benefits": "Support benefit, health insurance and retirement costs without double counting.",
  "operating-costs": "Support all operating costs, maintenance and reserves for each use.",
  insurance: "Obtain coverage and cost evidence applicable to the property and each use.",
  "property-tax": "Establish applicable tax treatment and recurring tax expense; assessed value alone is insufficient.",
  "capital-costs": "Support conversion, equipment, closing costs, working capital and replacement schedules.",
  financing: "Support project loan terms and capital contributions before calculating debt service or DSCR.",
  "grants-incentives": "Document applicable programs and eligibility; do not count unawarded assistance as committed funds.",
  inflation: "Support revenue growth and cost escalation separately over the projection period.",
};

/** Vol III TECH-PROV-001 / III-B replay / V CANON-EXPL-001. Capture the same
 * governed resolver used by the report. Captured facts are research inputs;
 * only reviewed economic packages may authorize comparative conclusions.
 * The worker persists this snapshot with its runtime trace and replay reference.
 */
export async function buildPropertyComparisonAnalysisReadiness(
  item: PropertyComparisonAnalysisItem,
  dependencies = { resolveFacts: resolvePropertyFacts, now: () => new Date() },
): Promise<PropertyComparisonAnalysisReadiness> {
  const address = item.normalizedAddress?.trim() || item.submittedAddress.trim();
  const facts = await dependencies.resolveFacts({ exactAddress: address, propertyId: item.propertyId }, { fresh: true });
  if (!facts.ok || !("verification" in facts) || !facts.verification || !facts.propertyRecord ||
      !("recordBasis" in facts.propertyRecord) ||
      !["verified", "partial"].includes(facts.verification.status) ||
      normalizedListingAddress(facts.verification.normalizedAddress ?? "") !== normalizedListingAddress(address) ||
      facts.verification.restrictions.length ||
      (item.propertyId && facts.propertyId !== item.propertyId)) {
    throw new Error("Property evidence did not resolve to the verified address.");
  }
  const property = facts.propertyRecord;
  const profile = classifyPropertyProfile({ propertyType: property.propertyType ?? property.rawPropertyStyle,
    description: property.description, acreageText: property.acreageText });
  const askingPrice = "priceEvidence" in property && property.priceEvidence?.status === "current-asking-price"
    ? property.priceEvidence.amountUsd : null;
  const context: PropertyComparisonAnalysisContext = {
    version: "property-comparison-analysis-context-v1.0.0",
    propertyId: item.propertyId ?? facts.propertyId ?? `unresolved:${item.id}`, address,
    profileId: profile.id, profileLabel: profile.label,
    propertyType: property.propertyType, currentUse: property.landUse,
    askingPrice, squareFeet: property.squareFeet, acreageText: property.acreageText,
    zoning: property.zoning, county: property.county, state: property.state,
    parcelAccountId: property.parcelRefs[0] ?? null,
    sourceRefs: [...new Set([property.parcelSourceUrl,
      "listingSourceUrl" in property ? property.listingSourceUrl : null].filter((s): s is string => Boolean(s)))],
  };
  const capturedDomains = new Set<string>();
  if (property.recordBasis !== "verified-address-only" && property.parcelRefs.length) capturedDomains.add("property-identity");
  if (property.landUse) capturedDomains.add("current-and-advertised-use");
  if (askingPrice != null) capturedDomains.add("acquisition-price");
  if (property.squareFeet || property.acreageText) capturedDomains.add("physical-suitability");
  if (property.zoning) capturedDomains.add("legal-use");
  const checklist = REQUIRED_ECONOMIC_EVIDENCE_DOMAINS.map(domain => ({ domain,
    status: capturedDomains.has(domain) ? "captured" as const : "needed" as const, action: ACTIONS[domain] }));
  const evidenceCapture = { version: "property-evidence-capture-v1" as const,
    capturedAt: dependencies.now().toISOString(), classification: "CONFIDENTIAL" as const, facts, checklist };
  const packages = storedEconomicPackages(item.resultSnapshot);
  const assessment = packages ? assessStoredEconomicEvidence(item, dependencies.now()) : null;
  return { context, evidenceCapture, evidencePackages: assessment?.ok ? packages : null,
    candidateExclusions: assessment?.ok ? storedCandidateExclusions(item.resultSnapshot)! : [],
    missingEvidence: assessment ? (assessment.ok ? [] : assessment.missingEvidence) : [
      ...checklist.map(item => (item.status === "captured" ? "Evidence found; review still required. " : "Evidence needed. ") + item.action),
      "Complete property-specific evidence packages are needed before the automated report can be offered for payment.",
    ] };
}
