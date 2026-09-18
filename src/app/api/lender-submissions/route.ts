import { NextRequest, NextResponse } from "next/server";
import { lenderSubmissionDenied, lenderSubmissionError, lenderSubmissionRequestContext } from "@/lib/lender-submission/api";
import { createSubmissionCase } from "@/lib/lender-submission/store";
import { assertBorrowerCustomerBinding } from "@/lib/lender-submission/caseAccess";

export async function POST(req: NextRequest) {
  const context = lenderSubmissionRequestContext(req, "lender-submission.create", ["borrower", "operator", "admin", "governance"]);
  if (!context.allowed) return lenderSubmissionDenied(context);
  try {
    const body = await req.json() as { applicationId?: string; customerId?: string; providerId?: string; serviceRequestId?: string };
    const customerId = assertBorrowerCustomerBinding({
      actorId: context.actorId,
      role: context.role,
      requestedCustomerId: body.customerId ?? "",
    });
    const record = await createSubmissionCase({
      applicationId: body.applicationId ?? "",
      customerId,
      providerId: body.providerId ?? null,
      serviceRequestId: body.serviceRequestId ?? null,
      actorId: context.actorId,
      traceId: context.traceId,
    });
    return NextResponse.json({ ok: true, case: record, governance: { traceId: context.traceId, liveDelivery: "BLOCKED" } }, { status: 201 });
  } catch (error) { return lenderSubmissionError(error, context.traceId); }
}
