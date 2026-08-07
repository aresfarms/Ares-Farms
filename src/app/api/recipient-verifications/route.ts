import { NextRequest, NextResponse } from "next/server";
import { lenderSubmissionDenied, lenderSubmissionError, lenderSubmissionRequestContext } from "@/lib/lender-submission/api";
import { persistRecipientVerification } from "@/lib/lender-submission/store";

export async function POST(req: NextRequest) {
  const context = lenderSubmissionRequestContext(req, "lender-submission.recipient.verify", ["lender", "operator", "admin", "governance"]);
  if (!context.allowed) return lenderSubmissionDenied(context);
  try {
    const body = await req.json();
    const recipient = await persistRecipientVerification({ ...body, actorId: context.actorId, traceId: context.traceId });
    return NextResponse.json({ ok: true, recipient, governance: { traceId: context.traceId, rawDestinationStored: false } }, { status: 201 });
  } catch (error) { return lenderSubmissionError(error, context.traceId); }
}
