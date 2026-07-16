import { NextRequest, NextResponse } from "next/server";

import { appendAuditEvent } from "@/lib/property/auditLedger";
import {
  readClamAvSignatureStatus,
  readClamAvVersion,
  scanWithLocalClamAv,
} from "@/lib/security/clamavLocalScanner";

type UploadScanRequest = {
  base64?: string;
  mediaType?: string;
  fileName?: string | null;
  sha256?: string | null;
};

function createTraceId(): string {
  return `public-upload-security-scan-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function scanToken(): string | null {
  return process.env.PROPERTY_UPLOAD_SCAN_TOKEN?.trim() || null;
}

function tokenAllowed(request: NextRequest): boolean {
  const configured = scanToken();
  if (!configured) {
    return true;
  }

  const authorization = request.headers.get("authorization")?.trim() || "";
  return authorization === `Bearer ${configured}`;
}

export async function POST(req: NextRequest) {
  const traceId = createTraceId();

  if (!tokenAllowed(req)) {
    appendAuditEvent({
      actorId: "internal-anonymous",
      actorName: "internal-anonymous",
      domain: "public-upload-security-scan",
      subject: "upload-security-scan",
      decision: "UPLOAD_SECURITY_SCAN_DENIED",
      reason: "Upload security scan request was denied because the scan token was missing or invalid.",
      detail: { traceId },
    });

    return NextResponse.json(
      {
        verdict: "error",
        provider: process.env.PROPERTY_UPLOAD_SCAN_PROVIDER?.trim() || "clamav-local",
        detail: "Unauthorized upload security scan request.",
      },
      { status: 401 }
    );
  }

  const body = (await req.json().catch(() => ({}))) as UploadScanRequest;
  const base64 = body.base64?.trim();
  const mediaType = body.mediaType?.trim();

  if (!base64 || !mediaType) {
    return NextResponse.json(
      {
        verdict: "error",
        provider: process.env.PROPERTY_UPLOAD_SCAN_PROVIDER?.trim() || "clamav-local",
        detail: "Upload security scan request is missing required file content.",
      },
      { status: 400 }
    );
  }

  try {
    const result = await scanWithLocalClamAv({
      bytes: Uint8Array.from(Buffer.from(base64, "base64")),
      mediaType,
      fileName: body.fileName ?? null,
    });

    appendAuditEvent({
      actorId: "internal-anonymous",
      actorName: "internal-anonymous",
      domain: "public-upload-security-scan",
      subject: body.sha256 ?? "upload-security-scan",
      decision:
        result.verdict === "clean"
          ? "UPLOAD_SECURITY_SCAN_CLEARED"
          : result.verdict === "malicious"
            ? "UPLOAD_SECURITY_SCAN_BLOCKED"
            : "UPLOAD_SECURITY_SCAN_UNAVAILABLE",
      reason: "Upload security scan completed through the local ClamAV scanning runtime.",
      detail: {
        traceId,
        mediaType,
        fileName: body.fileName ?? null,
        sha256: body.sha256 ?? null,
        provider: result.provider,
        verdict: result.verdict,
        detail: result.detail,
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    const signatures = await readClamAvSignatureStatus().catch(() => null);
    const version = await readClamAvVersion().catch(() => null);
    const detail = error instanceof Error ? error.message : "Local upload malware scanning failed unexpectedly.";

    appendAuditEvent({
      actorId: "internal-anonymous",
      actorName: "internal-anonymous",
      domain: "public-upload-security-scan",
      subject: body.sha256 ?? "upload-security-scan",
      decision: "UPLOAD_SECURITY_SCAN_UNAVAILABLE",
      reason: "Upload security scan could not complete because the local ClamAV runtime was unavailable.",
      detail: {
        traceId,
        mediaType: mediaType ?? null,
        fileName: body.fileName ?? null,
        sha256: body.sha256 ?? null,
        provider: process.env.PROPERTY_UPLOAD_SCAN_PROVIDER?.trim() || "clamav-local",
        detail,
        signatures,
        version,
      },
    });

    return NextResponse.json(
      {
        verdict: "error",
        provider: process.env.PROPERTY_UPLOAD_SCAN_PROVIDER?.trim() || "clamav-local",
        detail,
      },
      { status: 503 }
    );
  }
}
