import { runApplyEdge } from "@/lib/edge/applyContract";
import { writeLedgerEvent } from "@/lib/ledger/writeEvent";

export async function applySystem(input: any) {
  const result = runApplyEdge(input);

  await writeLedgerEvent({
    type: "PIPELINE_RUN",
    userId: result.userId,
    decision: result.decision.decision,
    compositeScore: result.decision.compositeScore,
    riskScore: result.risk.riskScore,
  });

  return result;
}
