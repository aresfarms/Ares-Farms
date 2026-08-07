import { NextRequest, NextResponse } from "next/server";
import { lenderSubmissionRequestContext } from "@/lib/lender-submission/api";

export async function POST(req: NextRequest, contextParams: { params: Promise<{ adapter: string }> }) {
  const { adapter } = await contextParams.params;
  const context = lenderSubmissionRequestContext(req, "lender-submission.webhook.receive");
  return NextResponse.json({ ok: false, error: adapter === "sandbox-v1" ? "Sandbox delivery records receipts synchronously; unsolicited webhooks are rejected." : "Live delivery adapters are not promoted.", governance: { traceId: context.traceId, productionDeliveryBlocked: true, webhookAccepted: false } }, { status: 409 });
}
