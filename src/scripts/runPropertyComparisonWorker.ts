import { randomUUID } from "node:crypto";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";

import { processPropertyComparisonAnalysisBatch } from "@/lib/intelligence/propertyComparisonAnalysisWorker";
import { finalizePropertyComparison } from "@/lib/intelligence/propertyComparisonStore";
import { processPropertyComparisonVerificationBatch } from "@/lib/intelligence/propertyComparisonVerificationWorker";

// Full evidence collection includes bounded public-source lookups. Keep each
// scheduled run small enough for the existing five-minute job budget.
const MAX_BATCH = 3;

async function main(): Promise<void> {
  const traceId = "property-comparison-private-job-" + randomUUID();

  const guard = runRuntimeGuard({
    operation: "property.comparison.process", module: "property-comparison-private-job",
    traceId, replayRef: traceId, actorId: "system:property-comparison-worker",
    schemaVersion: "property-evidence-capture-v1", governanceVersion: "master-volumes-runtime-v0.1.0",
    classificationLevel: "CONFIDENTIAL", metadata: { boundedLimitPerStage: MAX_BATCH },
  });
  if (!guard.allowed) throw new Error("Governed property evidence collection is unavailable.");

  const verification = await processPropertyComparisonVerificationBatch({
    limit: MAX_BATCH,
    traceId,
  });
  const analysis = await processPropertyComparisonAnalysisBatch({
    limit: MAX_BATCH,
    traceId,
  });

  const touched = new Set<string>();
  for (const item of verification.results) touched.add(item.comparisonId);
  for (const item of analysis.results) touched.add(item.comparisonId);

  const finalizations = [];
  for (const comparisonId of touched) {
    finalizations.push({
      comparisonId,
      result: await finalizePropertyComparison({ comparisonId, traceId }),
    });
  }

  console.log(JSON.stringify({
    ok: true,
    traceId,
    boundedLimitPerStage: MAX_BATCH,
    verification,
    analysis,
    finalizations,
  }, null, 2));
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
