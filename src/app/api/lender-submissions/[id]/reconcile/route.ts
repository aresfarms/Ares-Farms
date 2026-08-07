import { NextRequest, NextResponse } from "next/server";
import { lenderSubmissionDenied, lenderSubmissionError, lenderSubmissionRequestContext } from "@/lib/lender-submission/api";
import { reconcileDelivery } from "@/lib/lender-submission/store";

export async function POST(req: NextRequest, contextParams: { params: Promise<{ id: string }> }) {
  const { id } = await contextParams.params;
  const context = lenderSubmissionRequestContext(req, "lender-submission.delivery.reconcile", ["lender", "operator", "admin", "governance"]);
  if (!context.allowed) return lenderSubmissionDenied(context);
  try {
    const body = await req.json();
    const outbox = await reconcileDelivery({ caseId: id, outboxId: body.outboxId, resolution: body.resolution, actorId: context.actorId, traceId: context.traceId });
    return NextResponse.json({ ok: true, outbox, governance: { traceId: context.traceId, humanReconciled: true, automaticResend: false } });
  } catch (error) { return lenderSubmissionError(error, context.traceId); }
}
