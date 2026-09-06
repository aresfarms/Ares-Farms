import { NextRequest, NextResponse } from "next/server";
import { lenderSubmissionDenied, lenderSubmissionError, lenderSubmissionRequestContext } from "@/lib/lender-submission/api";
import { getDeliveryStatus } from "@/lib/lender-submission/store";
import { assertSubmissionCaseAccess } from "@/lib/lender-submission/caseAccess";

export async function GET(req: NextRequest, contextParams: { params: Promise<{ id: string }> }) {
  const { id } = await contextParams.params;
  const context = lenderSubmissionRequestContext(req, "lender-submission.delivery.read", ["borrower", "lender", "operator", "admin", "governance"]);
  if (!context.allowed) return lenderSubmissionDenied(context);
  try {
    await assertSubmissionCaseAccess({ caseId: id, actorId: context.actorId, role: context.role, allowConsentedProvider: true });
    return NextResponse.json({ ok: true, delivery: await getDeliveryStatus(id), governance: { traceId: context.traceId } });
  }
  catch (error) { return lenderSubmissionError(error, context.traceId); }
}
