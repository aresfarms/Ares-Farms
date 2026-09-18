import { randomUUID } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

import { sessionAuthority } from "@/lib/auth/sessionAuthority";
import {
  beginPublicOrderReportArtifactUpload,
  PublicReportArtifactConflictError,
  verifyPublicOrderReportArtifact,
} from "@/lib/billing/publicOrderReportArtifact";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import { readJsonBodyWithLimit } from "@/lib/security/requestGuards";

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SHA256 = /^[a-f0-9]{64}$/;

function response(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
}

function text(value: unknown, max = 500): string | null {
  return typeof value === "string" && value.trim()
    ? value.trim().slice(0, max)
    : null;
}
function operator(req: NextRequest) {
  const authority = sessionAuthority(req);
  return ["governance", "operator"].includes(authority.role) &&
    authority.actorId
    ? authority
    : null;
}

/**
 * Operator-only direct-to-vault upload and verification boundary for the
 * supervised Property Decision Report.
 *
 * Report bytes go from the operator browser to the IAM-private bucket. This
 * route retains order-bound custody, digest, scan, PDF-safety, lineage, and
 * replay evidence without accepting raw PDF bytes in the request body.
 */
export async function POST(req: NextRequest) {
  const authority = operator(req);
  if (!authority?.actorId) {
    return response(
      { ok: false, error: "Verified operator access is required." },
      403,
    );
  }

  const parsed = await readJsonBodyWithLimit<Record<string, unknown>>(req, {
    maxBytes: 16 * 1024,
  });
  if (!parsed.ok) {
    return response({ ok: false, error: parsed.error }, parsed.status);
  }
  const action = text(parsed.body.action, 20)?.toUpperCase();
  const orderId = text(parsed.body.orderId, 100);
  const artifactId = text(parsed.body.artifactId, 100);
  if (
    !orderId ||
    !UUID.test(orderId) ||
    !["BEGIN", "VERIFY"].includes(action ?? "")
  ) {
    return response(
      {
        ok: false,
        error: "A valid order and BEGIN or VERIFY action are required.",
      },
      400,
    );
  }

  const traceId = "public-report-artifact-" + randomUUID();
  const guard = runRuntimeGuard({
    operation: "billing.public-order.report-artifact." + action!.toLowerCase(),
    module: "api.internal.public-orders.report-artifact",
    traceId,
    replayRef: traceId,
    actorId: authority.actorId,
    schemaVersion: "furlong-public-order-v1.0.0",
    governanceVersion: "master-volumes-runtime-v0.1.0",
    classificationLevel: "RESTRICTED",
    metadata: {
      orderId,
      action,
      operatorAuthorityBasis: authority.basis,
      rawBytesAcceptedByRoute: false,
    },
  });
  if (!guard.allowed) {
    return response(
      { ok: false, error: "Report-artifact handling was blocked." },
      403,
    );
  }

  try {
    if (action === "BEGIN") {
      const fileName = text(parsed.body.fileName, 200);
      const mimeType = text(parsed.body.mimeType, 120);
      const byteSize = Number(parsed.body.byteSize);
      const sha256 = text(parsed.body.sha256, 64)?.toLowerCase();
      if (
        !fileName ||
        mimeType !== "application/pdf" ||
        !Number.isSafeInteger(byteSize) ||
        byteSize < 1 ||
        !sha256 ||
        !SHA256.test(sha256)
      ) {
        return response(
          {
            ok: false,
            error:
              "PDF file name, byte size, and lowercase SHA-256 are required.",
          },
          400,
        );
      }
      const begun = await beginPublicOrderReportArtifactUpload({
        orderId,
        operatorActorId: authority.actorId,
        fileName,
        mimeType,
        byteSize,
        sha256,
        originForCors: req.headers.get("origin"),
        traceId,
      });
      if (!begun.uploadUrl) {
        return response(
          {
            ok: false,
            error:
              "Governed report storage is unavailable. No report was released.",
            artifactId: begun.artifact.artifactId,
            traceId,
          },
          503,
        );
      }
      return response({
        ok: true,
        artifact: {
          artifactId: begun.artifact.artifactId,
          status: begun.artifact.status,
          fileName: begun.artifact.fileName,
          byteSize: begun.artifact.byteSize,
          expectedSha256: begun.artifact.expectedSha256,
        },
        uploadUrl: begun.uploadUrl,
        traceId,
      });
    }

    if (!artifactId || !UUID.test(artifactId)) {
      return response(
        {
          ok: false,
          error: "A valid report artifact identifier is required.",
        },
        400,
      );
    }
    const artifact = await verifyPublicOrderReportArtifact({
      orderId,
      artifactId,
      operatorActorId: authority.actorId,
      traceId,
    });
    return response({
      ok: true,
      artifact: {
        artifactId: artifact.artifactId,
        status: artifact.status,
        fileName: artifact.fileName,
        byteSize: artifact.byteSize,
        verifiedSha256: artifact.verifiedSha256,
        verifiedAt: artifact.verifiedAt,
      },
      traceId,
    });
  } catch (error) {
    if (error instanceof PublicReportArtifactConflictError) {
      const unavailable = [
        "REPORT_STORAGE_UNAVAILABLE",
        "REPORT_SCANNER_UNAVAILABLE",
      ].includes(error.code);
      return response(
        {
          ok: false,
          error: error.message,
          code: error.code,
          traceId,
        },
        unavailable ? 503 : 409,
      );
    }
    return response(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "The report artifact could not be processed.",
        traceId,
      },
      422,
    );
  }
}
