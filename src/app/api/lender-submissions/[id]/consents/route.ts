import { NextRequest, NextResponse } from "next/server";
import { lenderSubmissionDenied, lenderSubmissionError, lenderSubmissionRequestContext } from "@/lib/lender-submission/api";
import { persistConsent } from "@/lib/lender-submission/store";

export async function POST(req: NextRequest, contextParams: { params: Promise<{ id: string }> }) {
  const { id } = await contextParams.params;
  const context = lenderSubmissionRequestContext(req, "lender-submission.consent");
  if (!context.allowed) return lenderSubmissionDenied(context);
  try {
    const body = await req.json();
    const consent = await persistConsent({ ...body, caseId: id, accepted: body.accepted === true, actorId: context.actorId, traceId: context.traceId });
    return NextResponse.json({ ok: true, consent, governance: { traceId: context.traceId, exactPackageBinding: true } }, { status: 201 });
  } catch (error) { return lenderSubmissionError(error, context.traceId); }
}
