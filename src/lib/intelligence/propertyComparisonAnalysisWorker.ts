import { PropertyComparisonEconomicEvidenceError, claimVerifiedPropertyComparisonItems, finalizePropertyComparison, recordCompletedPropertyComparisonAnalysis, recordPropertyComparisonEvidenceGap } from "@/lib/intelligence/propertyComparisonStore";
import { buildPropertyComparisonAnalysisReadiness, type PropertyComparisonAnalysisItem, type PropertyComparisonAnalysisReadiness } from "@/lib/intelligence/propertyComparisonAnalysisContext";

export interface PropertyComparisonAnalysisWorkerDependencies {
  claim: typeof claimVerifiedPropertyComparisonItems;
  buildReadiness: (item: PropertyComparisonAnalysisItem) => Promise<PropertyComparisonAnalysisReadiness>;
  recordCompleted: typeof recordCompletedPropertyComparisonAnalysis;
  recordGap: typeof recordPropertyComparisonEvidenceGap;
  finalize: typeof finalizePropertyComparison;
}

const defaultDependencies: PropertyComparisonAnalysisWorkerDependencies = {
  claim: claimVerifiedPropertyComparisonItems,
  buildReadiness: buildPropertyComparisonAnalysisReadiness,
  recordCompleted: recordCompletedPropertyComparisonAnalysis,
  recordGap: recordPropertyComparisonEvidenceGap,
  finalize: finalizePropertyComparison,
};

export async function processPropertyComparisonAnalysisBatch(input: {
  limit?: number;
  traceId: string;
  comparisonId?: string;
}, dependencies: PropertyComparisonAnalysisWorkerDependencies = defaultDependencies) {
  const limit = Math.min(Math.max(Math.trunc(input.limit ?? 5), 1), 10);
  const claimed = await dependencies.claim({
    limit,
    traceId: input.traceId,
    comparisonId: input.comparisonId,
  });
  const results: Array<{
    itemId: string;
    comparisonId: string;
    status: "COMPLETED" | "NEEDS_EVIDENCE";
    missingEvidence: string[];
  }> = [];
  const touchedComparisons = new Set<string>();

  for (const item of claimed) {
    touchedComparisons.add(item.comparisonId);
    try {
      const readiness = await dependencies.buildReadiness(item);
      if (!readiness.evidencePackages) {
        await dependencies.recordGap({
          itemId: item.id,
          comparisonId: item.comparisonId,
          missingEvidence: readiness.missingEvidence,
          analysisSnapshot: { analysisContext: readiness.context },
          traceId: input.traceId,
        });
        results.push({
          itemId: item.id,
          comparisonId: item.comparisonId,
          status: "NEEDS_EVIDENCE",
          missingEvidence: readiness.missingEvidence,
        });
        continue;
      }

      try {
        const recorded = await dependencies.recordCompleted({
          itemId: item.id,
          comparisonId: item.comparisonId,
          evidencePackages: readiness.evidencePackages,
          traceId: input.traceId,
        });
        if (!recorded) {
          throw new Error("Comparison item was not ready for completion.");
        }
        results.push({
          itemId: item.id,
          comparisonId: item.comparisonId,
          status: "COMPLETED",
          missingEvidence: [],
        });
      } catch (error) {
        const missingEvidence = error instanceof PropertyComparisonEconomicEvidenceError
          ? error.missingEvidence
          : ["The governed economic evidence package could not be committed and requires review."];
        await dependencies.recordGap({
          itemId: item.id,
          comparisonId: item.comparisonId,
          missingEvidence,
          analysisSnapshot: { analysisContext: readiness.context },
          traceId: input.traceId,
        });
        results.push({
          itemId: item.id,
          comparisonId: item.comparisonId,
          status: "NEEDS_EVIDENCE",
          missingEvidence,
        });
      }
    } catch {
      const missingEvidence = [
        "The property analysis context could not be assembled from the available governed sources; retry or review the property evidence.",
      ];
      await dependencies.recordGap({
        itemId: item.id,
        comparisonId: item.comparisonId,
        missingEvidence,
        analysisSnapshot: {},
        traceId: input.traceId,
      });
      results.push({
        itemId: item.id,
        comparisonId: item.comparisonId,
        status: "NEEDS_EVIDENCE",
        missingEvidence,
      });
    }
  }

  const finalizations = [];
  for (const comparisonId of touchedComparisons) {
    finalizations.push({
      comparisonId,
      result: await dependencies.finalize({ comparisonId, traceId: input.traceId }),
    });
  }

  return {
    claimed: claimed.length,
    processed: results.length,
    completed: results.filter((item) => item.status === "COMPLETED").length,
    needsEvidence: results.filter((item) => item.status === "NEEDS_EVIDENCE").length,
    results,
    finalizations,
  };
}
