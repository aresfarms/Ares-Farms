import { randomUUID } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

import {
  sessionAuthority,
  type SessionAuthority,
} from "@/lib/auth/sessionAuthority";
import { readPublicOrderReportArtifact } from "@/lib/billing/publicOrderReportArtifact";
import {
  listPublicOrdersForFulfillment,
  PublicOrderConflictError,
  transitionPublicOrderFulfillment,
  type PublicOrderFulfillmentAction,
} from "@/lib/billing/publicOrderStore";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import { readJsonBodyWithLimit } from "@/lib/security/requestGuards";

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ACTIONS = new Set<PublicOrderFulfillmentAction>([
  "START",
  "COMPLETE",
  "HOLD",
]);

function response(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
}
function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function operationalContext(value: unknown) {
  const metadata = record(value);
  const refund = record(metadata.customerRefund);
  const fulfillment = record(metadata.fulfillment);
  return {
    customerRefundPresent: Object.keys(refund).length > 0,
    refundProviderStatus: text(refund.providerStatus, 80),
    refundFailure: text(refund.lastSubmissionFailure, 240),
    holdReason: text(fulfillment.reason, 500),
  };
}

function text(value: unknown, max = 500): string | null {
  return typeof value === "string" && value.trim()
    ? value.trim().slice(0, max)
    : null;
}

function reportArtifactContext(value: unknown) {
  const artifact = readPublicOrderReportArtifact(value);
  return artifact
    ? {
        artifactId: artifact.artifactId,
        status: artifact.status,
        fileName: artifact.fileName,
        byteSize: artifact.byteSize,
        expectedSha256: artifact.expectedSha256,
        verifiedSha256: artifact.verifiedSha256,
        verifiedAt: artifact.verifiedAt,
      }
    : null;
}

function evidenceRefs(value: unknown): string[] | null {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > 100) return null;
  const refs = value
    .map((entry) => text(entry, 500))
    .filter((entry): entry is string => Boolean(entry));
  return refs.length === value.length ? Array.from(new Set(refs)) : null;
}

function operator(
  req: NextRequest,
): (SessionAuthority & { actorId: string }) | null {
  const authority = sessionAuthority(req);
  return ["governance", "operator"].includes(authority.role) &&
    authority.actorId
    ? { ...authority, actorId: authority.actorId }
    : null;
}

/**
 * Auditable operator boundary for starting, holding, and completing work.
 * Master Volume traceability: Vol I CONST-CONSENT-001, Vol III
 * TECH-LEDGER-001 / TECH-UX-001, Vol III-B, and Vol V CANON-TREASURY-001.
 */
export async function GET(req: NextRequest) {
  const authority = operator(req);
  if (!authority) {
    return response(
      { ok: false, error: "Verified operator access is required." },
      403,
    );
  }

  const traceId = "public-order-fulfillment-list-" + randomUUID();
  const guard = runRuntimeGuard({
    operation: "billing.public-order.fulfillment.list",
    module: "api.internal.public-orders.fulfillment",
    traceId,
    replayRef: traceId,
    actorId: authority.actorId,
    schemaVersion: "furlong-public-order-v1.0.0",
    governanceVersion: "master-volumes-runtime-v0.1.0",
    classificationLevel: "CONFIDENTIAL",
    metadata: { operatorAuthorityBasis: authority.basis },
  });
  if (!guard.allowed) {
    return response(
      { ok: false, error: "Fulfillment queue access was blocked." },
      403,
    );
  }

  const orders = await listPublicOrdersForFulfillment({});
  return response({
    ok: true,
    orders: orders.map((order) => ({
      id: order.id,
      productCode: order.productCode,
      targetType: order.targetType,
      targetRef: order.targetRef,
      fulfillmentMode: order.fulfillmentMode,
      status: order.status,
      amountTotalCents: order.amountTotalCents,
      currency: order.currency,
      paidAt: order.paidAt,
      fulfillmentStartedAt: order.fulfillmentStartedAt,
      fulfilledAt: order.fulfilledAt,
      updatedAt: order.updatedAt,
      reportArtifact: reportArtifactContext(order.metadata),
      operations: operationalContext(order.metadata),
    })),
    traceId,
  });
}

export async function POST(req: NextRequest) {
  const authority = operator(req);
  if (!authority) {
    return response(
      { ok: false, error: "Verified operator access is required." },
      403,
    );
  }

  const parsed = await readJsonBodyWithLimit<Record<string, unknown>>(req, {
    maxBytes: 64 * 1024,
  });
  if (!parsed.ok) {
    return response({ ok: false, error: parsed.error }, parsed.status);
  }

  const orderId = text(parsed.body.orderId, 100);
  const rawAction = text(parsed.body.action, 20)?.toUpperCase();
  const action =
    rawAction && ACTIONS.has(rawAction as PublicOrderFulfillmentAction)
      ? (rawAction as PublicOrderFulfillmentAction)
      : null;
  const idempotencyKey = text(
    req.headers.get("idempotency-key") ?? parsed.body.idempotencyKey,
    200,
  );
  const reportRef = text(parsed.body.reportRef, 500);
  const reason = text(parsed.body.reason, 1_000);
  const refs = evidenceRefs(parsed.body.evidenceRefs);

  if (
    !orderId ||
    !UUID.test(orderId) ||
    !action ||
    !idempotencyKey ||
    refs === null
  ) {
    return response(
      {
        ok: false,
        error:
          "orderId, START/HOLD/COMPLETE action, and an idempotency key are required.",
      },
      400,
    );
  }
  if (action === "COMPLETE" && (!reportRef || refs.length === 0)) {
    return response(
      {
        ok: false,
        error:
          "Completion requires a report reference and evidence references.",
      },
      400,
    );
  }
  if (action === "HOLD" && !reason) {
    return response({ ok: false, error: "A hold reason is required." }, 400);
  }

  const traceId = "public-order-fulfillment-" + randomUUID();
  const guard = runRuntimeGuard({
    operation: "billing.public-order.fulfillment." + action.toLowerCase(),
    module: "api.internal.public-orders.fulfillment",
    traceId,
    replayRef: traceId,
    actorId: authority.actorId,
    schemaVersion: "furlong-public-order-v1.0.0",
    governanceVersion: "master-volumes-runtime-v0.1.0",
    classificationLevel: "CONFIDENTIAL",
    metadata: {
      orderId,
      action,
      operatorAuthorityBasis: authority.basis,
      evidenceRefCount: refs.length,
    },
  });
  if (!guard.allowed) {
    return response(
      { ok: false, error: "The fulfillment action was blocked." },
      403,
    );
  }

  try {
    const result = await transitionPublicOrderFulfillment({
      orderId,
      action,
      operatorActorId: authority.actorId,
      reportRef,
      evidenceRefs: refs,
      reason,
      idempotencyKey,
      traceId,
    });
    return response({
      ok: true,
      duplicate: result.duplicate,
      order: {
        id: result.order.id,
        status: result.order.status,
        fulfillmentStartedAt: result.order.fulfillmentStartedAt,
        fulfilledAt: result.order.fulfilledAt,
      },
      eventId: result.eventId,
      traceId,
    });
  } catch (error) {
    if (error instanceof PublicOrderConflictError) {
      return response({ ok: false, error: error.message, traceId }, 409);
    }
    return response(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "The fulfillment action could not be recorded.",
        traceId,
      },
      422,
    );
  }
}
