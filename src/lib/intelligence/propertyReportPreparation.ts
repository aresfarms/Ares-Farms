import { assessStoredEconomicEvidence, storedEconomicPackages, supportedReportChoices } from "./storedEconomicEvidence";

export type PropertyReportPreparation = {
  version: "property-report-preparation-v1";
  checkedAt: string;
  evidenceReady: boolean;
  missingEvidence: string[];
  choices: Array<{ id: string; title: string }>;
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
  return {
    version: "property-report-preparation-v1", checkedAt: asOf.toISOString(), evidenceReady,
    missingEvidence: assessment && !assessment.ok ? assessment.missingEvidence :
      evidenceReady ? [] : gaps.length ? gaps : ["Property verification and source-supported analysis must finish before a report can be prepared."],
    choices: evidenceReady ? supportedReportChoices(storedEconomicPackages(item.resultSnapshot)!) : [],
  };
}
