import { NextRequest, NextResponse } from "next/server";
import { lenderSubmissionDenied, lenderSubmissionError, lenderSubmissionRequestContext } from "@/lib/lender-submission/api";
import { authorizeAndPersist } from "@/lib/lender-submission/store";
import { assertSubmissionCaseAccess } from "@/lib/lender-submission/caseAccess";

export async function POST(req: NextRequest, contextParams: { params: Promise<{ id: string }> }) {
  const { id } = await contextParams.params;
  const context = lenderSubmissionRequestContext(req, "lender-submission.dispatch.authorize", ["operator", "admin", "governance"]);
  if (!context.allowed) return lenderSubmissionDenied(context);
  try {
    await assertSubmissionCaseAccess({ caseId: id, actorId: context.actorId, role: context.role });
    const body = await req.json();
    const authorization = await authorizeAndPersist({ ...body, caseId: id, environment: body.environment === "production" ? "production" : "sandbox", actorId: context.actorId, traceId: context.traceId, now: new Date().toISOString() });
    return NextResponse.json({ ok: true, authorization, governance: { traceId: context.traceId, failClosed: true, productionDeliveryBlocked: true } }, { status: authorization.allowed ? 201 : 409 });
  } catch (error) { return lenderSubmissionError(error, context.traceId); }
}
