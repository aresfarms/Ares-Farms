import { NextRequest, NextResponse } from "next/server";

import { persistGovernanceEvidence } from "@/lib/governance/evidenceStore";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import { getServiceRequestStatus } from "@/lib/serviceRequests/serviceRequestStore";
import { mintCustomerDownloadToken } from "@/lib/documents/customerDownloadToken";

/**
 * Service Request Status API (customer status portal)
 *
 * A minimum-disclosure, customer-facing status lookup: it requires BOTH the
 * reference id AND the email used on the request, and returns status only —
 * never contact PII, property, or scope. POST-only so the email never appears
 * in a URL or query string (privacy).
 *
 * Master Volume Governance:
 * - Vol II (Section 1071 firewall / minimum disclosure): status only; a bare
 *   reference id reveals nothing without the matching email.
 * - Vol III-B (GOV-RUNTIME-001): runtime guard + observability + persisted
 *   evidence on every lookup. RESTRICTED.
 * - Vol V (CANON-CLASS-001): RESTRICTED read; no PII returned.
 */

function createTraceId(): string {
  return `service-request-status-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

export async function POST(req: NextRequest) {
  const traceId = createTraceId();

  try {
    const body = (await req.json()) as {
      serviceRequestId?: string;
      email?: string;
    };

    const runtimeGuard = runRuntimeGuard({
      operation: "customer.service-request.status-lookup",
      module: "api.service-requests.status",
      traceId,
      schemaVersion: "service-request-status-v0.1.0",
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "RESTRICTED",
      replayRef: traceId,
      actorId: null,
      metadata: { route: "/api/service-requests/status" },
    });

    if (!runtimeGuard.allowed) {
      const observability = createObservabilityEvent({
        eventType: "SERVICE_REQUEST_STATUS_RUNTIME_BLOCKED",
        domain: "runtime",
        severity: "WARN",
        message: "Service request status lookup blocked by runtime guard.",
        traceId,
        replayRef: traceId,
        module: "api.service-requests.status",
        metadata: { route: "/api/service-requests/status" },
      });
      await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: { route: "/api/service-requests/status", runtimeBlocked: true },
      });
      return NextResponse.json(
        { ok: false, error: "Status lookup unavailable." },
        { status: 403 }
      );
    }

    const status = await getServiceRequestStatus(
      body.serviceRequestId ?? "",
      body.email ?? ""
    );

    // Lender-provided documents: the successful ref+email lookup IS the
    // customer's authentication, so mint short-lived single-document
    // download tokens here (2h; the customer re-runs the lookup for fresh
    // ones). Tokens can only reach lender-provided documents on this deal.
    const lenderDocuments =
      status.found && status.serviceRequestId && status.lenderDocuments?.length
        ? status.lenderDocuments.map((doc) => ({
            fileName: doc.fileName,
            receivedAt: doc.receivedAt,
            downloadPath: `/api/public/document-download?token=${encodeURIComponent(
              mintCustomerDownloadToken({
                documentId: doc.id,
                dealRef: status.serviceRequestId as string,
              }).token
            )}`,
          }))
        : undefined;

    const observability = createObservabilityEvent({
      eventType: "SERVICE_REQUEST_STATUS_LOOKUP",
      domain: "operations",
      severity: "INFO",
      message: "Customer service-request status lookup.",
      traceId,
      replayRef: traceId,
      module: "api.service-requests.status",
      metadata: {
        route: "/api/service-requests/status",
        found: status.found,
        // Never log the email or reference-linked PII.
      },
    });

    await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      observability,
      metadata: { route: "/api/service-requests/status", found: status.found },
    });

    return NextResponse.json({
      ok: true,
      status: { ...status, lenderDocuments },
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Status lookup failed. Please try again." },
      { status: 500 }
    );
  }
}
