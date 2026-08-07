import { NextRequest, NextResponse } from "next/server";
import { lenderSubmissionDenied, lenderSubmissionError, lenderSubmissionRequestContext } from "@/lib/lender-submission/api";
import { dispatchSandbox, retrySandboxDelivery } from "@/lib/lender-submission/store";

export async function POST(req: NextRequest, contextParams: { params: Promise<{ id: string }> }) {
  const { id } = await contextParams.params;
  const context = lenderSubmissionRequestContext(req, "lender-submission.sandbox.dispatch", ["lender", "operator", "admin", "governance"]);
  if (!context.allowed) return lenderSubmissionDenied(context);
  try {
    const body = await req.json();
    const action = body.retry === true ? retrySandboxDelivery : dispatchSandbox;
    const result = await action({ caseId: id, authorizationId: body.authorizationId, idempotencyKey: body.idempotencyKey, simulate: body.simulate, actorId: context.actorId, traceId: context.traceId });
    return NextResponse.json({ ok: true, delivery: result, governance: { traceId: context.traceId, adapter: "sandbox-v1", externalNetworkCall: false } }, { status: result.idempotentReplay ? 200 : 201 });
  } catch (error) { return lenderSubmissionError(error, context.traceId); }
}
