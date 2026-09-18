import { randomUUID } from "node:crypto";

import { processPropertyComparisonAnalysisBatch } from "@/lib/intelligence/propertyComparisonAnalysisWorker";
import { finalizePropertyComparison } from "@/lib/intelligence/propertyComparisonStore";
import { processPropertyComparisonVerificationBatch } from "@/lib/intelligence/propertyComparisonVerificationWorker";

const MAX_BATCH = 10;

async function main(): Promise<void> {
  const traceId = "property-comparison-private-job-" + randomUUID();

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
