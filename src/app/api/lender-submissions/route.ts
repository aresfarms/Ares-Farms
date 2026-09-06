import { NextRequest, NextResponse } from "next/server";
import { lenderSubmissionDenied, lenderSubmissionError, lenderSubmissionRequestContext } from "@/lib/lender-submission/api";
import { createSubmissionCase } from "@/lib/lender-submission/store";

export async function POST(req: NextRequest) {
  const context = lenderSubmissionRequestContext(req, "lender-submission.create");
  if (!context.allowed) return lenderSubmissionDenied(context);
  try {
    const body = await req.json() as { applicationId?: string; customerId?: string; providerId?: string; serviceRequestId?: string };
    const record = await createSubmissionCase({
      applicationId: body.applicationId ?? "",
      customerId: body.customerId ?? "",
      providerId: body.providerId ?? null,
      serviceRequestId: body.serviceRequestId ?? null,
      actorId: context.actorId,
      traceId: context.traceId,
    });
    return NextResponse.json({ ok: true, case: record, governance: { traceId: context.traceId, liveDelivery: "BLOCKED" } }, { status: 201 });
  } catch (error) { return lenderSubmissionError(error, context.traceId); }
}
