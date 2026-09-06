import { NextRequest, NextResponse } from "next/server";
import { lenderSubmissionDenied, lenderSubmissionError, lenderSubmissionRequestContext } from "@/lib/lender-submission/api";
import { transitionSubmissionCase } from "@/lib/lender-submission/store";
import { assertSubmissionCaseAccess } from "@/lib/lender-submission/caseAccess";

export async function POST(req: NextRequest, contextParams: { params: Promise<{ id: string }> }) {
  const { id } = await contextParams.params;
  const context = lenderSubmissionRequestContext(req, "lender-submission.review", ["borrower", "operator", "admin", "governance"]);
  if (!context.allowed) return lenderSubmissionDenied(context);
  try {
    await assertSubmissionCaseAccess({ caseId: id, actorId: context.actorId, role: context.role });
    const body = await req.json() as { decision?: "approve" | "changes_requested" };
    const record = await transitionSubmissionCase(id, body.decision === "approve" ? "AWAITING_CUSTOMER_CONSENT" : "CHANGES_REQUESTED");
    return NextResponse.json({ ok: true, case: record, governance: { traceId: context.traceId, humanReviewRequired: true } });
  } catch (error) { return lenderSubmissionError(error, context.traceId); }
}
