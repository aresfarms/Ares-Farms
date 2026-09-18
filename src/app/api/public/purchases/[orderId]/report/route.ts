import { randomUUID } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

import { sessionAuthority } from "@/lib/auth/sessionAuthority";
import {
  publicOrderReportArtifactForCustomer,
  readPublicOrderReportArtifact,
  recordPublicOrderReportDownload,
} from "@/lib/billing/publicOrderReportArtifact";
import { loadPublicOrder } from "@/lib/billing/publicOrderStore";
import { fetchObjectStream } from "@/lib/documents/gcsResumableUpload";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function bearer(req: NextRequest): string | null {
  const value = req.headers.get("authorization")?.trim() ?? "";
  return value.toLowerCase().startsWith("bearer ")
    ? value.slice(7).trim() || null
    : null;
}

function json(body: Record<string, unknown>, status: number) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "private, no-store",
      Vary: "Cookie, Authorization",
    },
  });
}
/**
 * Order-bound report delivery. The recovery token or owning session grants
 * access to one fulfilled order only; the private object URI is never exposed.
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ orderId: string }> },
) {
  const orderId = (await context.params).orderId.trim();
  if (!UUID.test(orderId)) {
    return json(
      { ok: false, error: "A valid order identifier is required." },
      400,
    );
  }

  const authority = sessionAuthority(req);
  const accessToken = bearer(req);
  const traceId = "public-report-download-" + randomUUID();
  const guard = runRuntimeGuard({
    operation: "billing.public-order.report-download",
    module: "api.public.purchases.report",
    traceId,
    replayRef: traceId,
    actorId: authority.actorId,
    schemaVersion: "furlong-public-order-v1.0.0",
    governanceVersion: "master-volumes-runtime-v0.1.0",
    classificationLevel: "CONFIDENTIAL",
    metadata: {
      orderId,
      recoveryTokenPresented: Boolean(accessToken),
      privateObjectReferenceDisclosed: false,
    },
  });
  if (!guard.allowed) {
    return json(
      { ok: false, error: "Report access is temporarily unavailable." },
      403,
    );
  }

  const bundle = await loadPublicOrder({
    orderId,
    buyerActorId: authority.actorId,
    accessToken,
  });
  if (!bundle) {
    return json(
      { ok: false, error: "Order not found or access not authorized." },
      404,
    );
  }

  const customerArtifact = publicOrderReportArtifactForCustomer(
    bundle.order.metadata,
  );
  const artifact = readPublicOrderReportArtifact(bundle.order.metadata);
  if (
    bundle.order.status !== "FULFILLED" ||
    bundle.order.amountPaidCents !== bundle.order.amountTotalCents ||
    bundle.order.amountRefundedCents !== 0 ||
    bundle.order.disputedAt ||
    !customerArtifact ||
    !artifact
  ) {
    return json(
      {
        ok: false,
        error: "The verified report is not available for this order.",
      },
      409,
    );
  }
  const object = await fetchObjectStream(artifact.objectKey);
  if (!object) {
    return json(
      {
        ok: false,
        error: "Secure report storage is temporarily unavailable.",
      },
      503,
    );
  }

  try {
    await recordPublicOrderReportDownload({
      orderId: bundle.order.id,
      artifactId: artifact.artifactId,
      actorId: authority.actorId,
      traceId,
    });
  } catch {
    return json(
      {
        ok: false,
        error: "Report access changed before delivery could begin.",
      },
      409,
    );
  }

  const fileName = customerArtifact.fileName.replace(/[^\w.\- ]+/g, "_");
  return new NextResponse(object.stream, {
    headers: {
      "Content-Type": "application/pdf",
      ...(object.contentLength
        ? { "Content-Length": object.contentLength }
        : {}),
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
      Vary: "Cookie, Authorization",
      "X-Artifact-Sha256": customerArtifact.sha256,
      "X-Trace-Id": traceId,
    },
  });
}
