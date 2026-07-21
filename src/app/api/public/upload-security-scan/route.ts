import { canonicalLandRegisterAuthority } from "@/lib/platform/authorities/landRegister";
import { NextRequest, NextResponse } from "next/server";

import {
  readClamAvSignatureStatus,
  readClamAvVersion,
  scanWithLocalClamAv,
} from "@/lib/security/clamavLocalScanner";
import {
  missingRequiredSecretDetail,
  readJsonBodyWithLimit,
  readRequiredSecret,
  requireBearerToken,
} from "@/lib/security/requestGuards";

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
  return readRequiredSecret("PROPERTY_UPLOAD_SCAN_TOKEN");
}

function tokenAllowed(request: NextRequest): boolean {
  const configured = scanToken();
  if (!configured) {
    return false;
  }
  return requireBearerToken(request.headers.get("authorization"), configured);
}

export async function POST(req: NextRequest) {
  const traceId = createTraceId();
  const configuredToken = scanToken();

  if (!configuredToken) {
    canonicalLandRegisterAuthority.append({
      actorId: "internal-anonymous",
      actorName: "internal-anonymous",
      domain: "public-upload-security-scan",
      subject: "upload-security-scan",
      decision: "UPLOAD_SECURITY_SCAN_UNAVAILABLE",
      reason: missingRequiredSecretDetail("PROPERTY_UPLOAD_SCAN_TOKEN"),
      detail: { traceId },
    });

    return NextResponse.json(
      {
        verdict: "error",
        provider: process.env.PROPERTY_UPLOAD_SCAN_PROVIDER?.trim() || "clamav-local",
        detail: missingRequiredSecretDetail("PROPERTY_UPLOAD_SCAN_TOKEN"),
      },
      { status: 503 }
    );
  }

  if (!tokenAllowed(req)) {
    canonicalLandRegisterAuthority.append({
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

  const parsed = await readJsonBodyWithLimit<UploadScanRequest>(req, {
    maxBytes: 18 * 1024 * 1024,
  });
  if (!parsed.ok) {
    return NextResponse.json(
      {
        verdict: "error",
        provider: process.env.PROPERTY_UPLOAD_SCAN_PROVIDER?.trim() || "clamav-local",
        detail: parsed.error,
      },
      { status: parsed.status }
    );
  }

  const body = parsed.body;
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

    canonicalLandRegisterAuthority.append({
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

    canonicalLandRegisterAuthority.append({
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
