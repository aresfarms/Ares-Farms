import { NextRequest, NextResponse } from "next/server";
import { lenderSubmissionDenied, lenderSubmissionError, lenderSubmissionRequestContext } from "@/lib/lender-submission/api";
import { revokeConsent } from "@/lib/lender-submission/store";
import { assertSubmissionCaseAccess } from "@/lib/lender-submission/caseAccess";

export async function POST(req: NextRequest, contextParams: { params: Promise<{ id: string; consent: string }> }) {
  const { id, consent } = await contextParams.params;
  const context = lenderSubmissionRequestContext(req, "lender-submission.consent.revoke", ["borrower", "operator", "admin", "governance"]);
  if (!context.allowed) return lenderSubmissionDenied(context);
  try {
    await assertSubmissionCaseAccess({ caseId: id, actorId: context.actorId, role: context.role });
    const record = await revokeConsent(id, consent);
    return NextResponse.json({ ok: true, consent: record, governance: { traceId: context.traceId, dispatchInvalidated: true } });
  } catch (error) { return lenderSubmissionError(error, context.traceId); }
}
