import { NextRequest, NextResponse } from "next/server";
import { lenderSubmissionDenied, lenderSubmissionRequestContext } from "@/lib/lender-submission/api";

export async function POST(req: NextRequest) {
  const context = lenderSubmissionRequestContext(req, "lender-submission.production.promote", ["admin", "governance"]);
  if (!context.allowed) return lenderSubmissionDenied(context);
  return NextResponse.json({ ok: false, error: "Production lender delivery remains blocked pending separate human review, adapter certification, credential provisioning, and controlled promotion approval.", governance: { traceId: context.traceId, promotionApplied: false, productionDeliveryBlocked: true } }, { status: 409 });
}
