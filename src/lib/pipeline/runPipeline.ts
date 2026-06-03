import { runPipeline as orchestratorRunPipeline } from "@/lib/boundaries/pipeline/orchestrator";

/**
 * Canonical API entrypoint for pipeline execution.
 * This is a thin wrapper over the boundary-isolated orchestrator.
 */
export async function runPipeline(input: any) {
  return await orchestratorRunPipeline(input);
}
