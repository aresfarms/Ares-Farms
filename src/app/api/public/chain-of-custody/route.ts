import { NextRequest, NextResponse } from "next/server";

import { buildChainOfCustody, renderChainOfCustodyPdf } from "@/lib/documents/chainOfCustody";
import { verifyCustomerDownloadToken } from "@/lib/documents/customerDownloadToken";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";

/**
 * Chain of Custody report (customer copy) — token-gated.
 *
 * The customer's status lookup (reference + matching email) mints the token,
 * so possession proves the same thing a document download proves. The report
 * names documents and actions; it never reproduces document contents.
 *
 * Master Volume Governance: Vol II controlled disclosure; Vol V evidence.
 */

export async function GET(req: NextRequest) {
  const traceId = `custody-report-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const claims = verifyCustomerDownloadToken(req.nextUrl.searchParams.get("token") ?? "");
  if (!claims) {
    return NextResponse.json(
      { ok: false, error: "This link is invalid or has expired — refresh your status page for a fresh one." },
      { status: 401 }
    );
  }
  const report = await buildChainOfCustody(claims.dealRef);
  if (!report) {
    return NextResponse.json({ ok: false, error: "No record found for this request." }, { status: 404 });
  }
  createObservabilityEvent({
    eventType: "CHAIN_OF_CUSTODY_ISSUED",
    domain: "security",
    severity: "INFO",
    message: "A chain-of-custody report was issued to the customer.",
    traceId,
    replayRef: traceId,
    actorId: `customer-via-status-link:${claims.dealRef}`,
    module: "api.public.chain-of-custody",
    metadata: { dealRef: claims.dealRef, documentCount: report.documents.length },
  });
  const pdf = await renderChainOfCustodyPdf(report);
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="chain-of-custody-${claims.dealRef}.pdf"`,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "no-store",
      "X-Trace-Id": traceId,
    },
  });
}
