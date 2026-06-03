import { DecisionInputSchema } from "./input.schema";
import { DecisionResponseSchema } from "./response.schema";
import { runPipeline } from "@/lib/pipeline/orchestrator";

export async function POST_DECISION(rawInput: unknown) {
  // 1. STRICT INPUT VALIDATION
  const input = DecisionInputSchema.parse(rawInput);

  // 2. PIPELINE EXECUTION
  const result = await runPipeline(input);

  // 3. STRICT OUTPUT VALIDATION (THIS IS THE KEY FIX)
  return DecisionResponseSchema.parse({
    decision: result.decision.decision,
    compositeScore: result.decision.compositeScore,
    breakdown: result.decision.breakdown,
    metadata: result.decision.metadata,
  });
}
