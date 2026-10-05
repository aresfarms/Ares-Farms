import { propertyPreparationSourceSnapshot, type PropertyPreparationSourceSnapshot } from "./propertyPreparationSourceSnapshot";
import { assessCandidateExclusion } from "./candidateExclusionEvidence";
import { assessStoredEconomicEvidence, storedEconomicPackages, storedCandidateExclusions, supportedReportChoices } from "./storedEconomicEvidence";

export type PropertyReportPreparation = {
  version: "property-report-preparation-v1";
  checkedAt: string;
  evidenceReady: boolean;
  missingEvidence: string[];
  choices: Array<{ id: string; title: string }>;
  outcome: "supported-uses" | "no-supported-use" | "needs-evidence";
  exclusions: string[];
  sourceSnapshot: PropertyPreparationSourceSnapshot | null;
};

/** A readiness read is not permission to charge. Checkout re-resolves facts and
 * verifies the immutable PDF before it creates a payment session.
 */
export function propertyReportPreparation(item: {
  id: string; status: string; propertyId: string | null;
  submittedAddress: string; normalizedAddress: string | null; resultSnapshot: unknown;
}, asOf = new Date()): PropertyReportPreparation {
  const snapshot = item.resultSnapshot && typeof item.resultSnapshot === "object"
    ? item.resultSnapshot as Record<string, unknown> : {};
  const gaps = Array.isArray(snapshot.missingEvidence)
    ? snapshot.missingEvidence.filter((s): s is string => typeof s === "string") : [];
  const assessment = item.status === "COMPLETED" ? assessStoredEconomicEvidence(item, asOf) : null;
  const evidenceReady = Boolean(assessment?.ok);
  const choices = evidenceReady ? supportedReportChoices(storedEconomicPackages(item.resultSnapshot)!) : [];
  // Known, independently supported adverse findings remain free even when a
  // different decision role is incomplete or a competing budget has expired.
  const currentExclusions = item.propertyId && Number.isFinite(asOf.getTime())
    ? (storedCandidateExclusions(item.resultSnapshot) ?? []).filter(exclusion =>
      assessCandidateExclusion(exclusion, { propertyId: item.propertyId!,
        address: item.normalizedAddress || item.submittedAddress, asOf: asOf.toISOString() }).complete)
    : [];
  return {
    version: "property-report-preparation-v1", checkedAt: asOf.toISOString(), evidenceReady,
    missingEvidence: assessment && !assessment.ok ? assessment.missingEvidence :
      evidenceReady ? [] : gaps.length ? gaps : ["Property verification and source-supported analysis must finish before a report can be prepared."],
    choices,
    sourceSnapshot: propertyPreparationSourceSnapshot(item, asOf),
    outcome: !evidenceReady ? "needs-evidence" : choices.length ? "supported-uses" : "no-supported-use",
    exclusions: [
      ...currentExclusions.map(e => `${e.screeningScope}: ${e.summary}`),
      ...(evidenceReady ? storedEconomicPackages(item.resultSnapshot)!.filter(p => Object.values(p.constraints).some(c => c.status === "blocked"))
        .flatMap(p => Object.values(p.constraints).filter(c => c.status === "blocked").map(c => `${p.candidate.title}: ${c.summary}`)) : []),
    ],
  };
}
