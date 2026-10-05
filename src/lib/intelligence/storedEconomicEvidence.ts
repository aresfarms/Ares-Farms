import { isEnterpriseEconomicEvidencePackage, type EnterpriseEconomicEvidencePackage } from "./economicEvidencePackage";
import { isCandidateExclusionEvidence, type CandidateExclusionEvidence } from "./candidateExclusionEvidence";
import { compilePropertyComparisonEconomicAnalysis } from "./propertyComparisonEconomicAnalysis";

/** Vol III TECH-PROV-001 / Vol V CANON-EXPL-001. Read server-owned snapshots,
 * including the persisted { package, assessment } form. A saved assessment is
 * never authority for current freshness; compile again with the requested date.
 */
export function storedEconomicPackages(snapshot: unknown): EnterpriseEconomicEvidencePackage[] | null {
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) return null;
  const entries = (snapshot as Record<string, unknown>).economicEvidencePackages;
  if (!Array.isArray(entries) || entries.length > 3) return null;
  const packages = entries.map(entry => {
    if (isEnterpriseEconomicEvidencePackage(entry)) return entry;
    return entry && typeof entry === "object" ? (entry as Record<string, unknown>).package : null;
  });
  return packages.every(isEnterpriseEconomicEvidencePackage) ? packages : null;
}

export function storedCandidateExclusions(snapshot: unknown): CandidateExclusionEvidence[] | null {
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) return null;
  const entries = (snapshot as Record<string, unknown>).candidateExclusions;
  if (entries === undefined) return []; // Legacy three-package snapshots remain readable.
  return Array.isArray(entries) && entries.length <= 3 && entries.every(isCandidateExclusionEvidence) ? entries : null;
}

export function assessStoredEconomicEvidence(item: {
  id: string; propertyId: string | null; submittedAddress: string;
  normalizedAddress: string | null; resultSnapshot: unknown;
}, asOf: Date) {
  const packages = storedEconomicPackages(item.resultSnapshot);
  const exclusions = storedCandidateExclusions(item.resultSnapshot);
  if (!packages || !exclusions || !item.propertyId || !Number.isFinite(asOf.getTime())) return null;
  return compilePropertyComparisonEconomicAnalysis({
    comparisonItemId: item.id, propertyId: item.propertyId,
    address: item.normalizedAddress || item.submittedAddress,
    packages, exclusions, asOf: asOf.toISOString(),
  });
}

/** Candidate IDs are selectors, not customer-authored claims. Selecting any
 * supported candidate expresses preference without inventing a fourth use or
 * changing its evaluated role. Blocked candidates remain visible in the report.
 */
export function supportedReportChoices(packages: EnterpriseEconomicEvidencePackage[]) {
  return packages.filter(p => Object.values(p.constraints).every(c => c.status === "clear" || c.status === "conditioned"))
    .map(p => ({ id: p.candidate.id, title: p.candidate.title }));
}
