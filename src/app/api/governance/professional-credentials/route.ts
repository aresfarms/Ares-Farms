import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";

import { serviceRequests } from "@/db/schema";
import { db } from "@/lib/db";
import { sessionAuthority } from "@/lib/auth/sessionAuthority";
import { verifyInstitutionalCredential, type CredentialVerificationMethod } from "@/lib/governance/institutionalCredentialVerification";
import { persistGovernanceEvidence } from "@/lib/governance/evidenceStore";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";

function reviewerAllowed(role: string) {
  return role === "governance" || role === "operator" || role === "admin";
}

export async function GET(req: NextRequest) {
  const authority = sessionAuthority(req);
  if (!reviewerAllowed(authority.role)) return NextResponse.json({ ok: false, error: "Credential-review authority required." }, { status: 403 });
  const rows = await db.select().from(serviceRequests)
    .where(and(eq(serviceRequests.requestType, "professional_credential_verification_request"), eq(serviceRequests.status, "AUTOMATION_EXCEPTION")))
    .orderBy(desc(serviceRequests.createdAt)).limit(100);
  return NextResponse.json({ ok: true, requests: rows.map((row) => ({
    requestId: row.serviceRequestId, status: row.status, fullLegalName: row.contactName,
    email: row.contactEmail, role: row.serviceCode, requestPayload: row.requestPayload,
    metadata: row.metadata, createdAt: row.createdAt,
  })) });
}
export async function POST(req: NextRequest) {
  const authority = sessionAuthority(req);
  if (!reviewerAllowed(authority.role)) return NextResponse.json({ ok: false, error: "Credential-review authority required." }, { status: 403 });
  const traceId = `professional-credential-review-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const body = await req.json().catch(() => null) as Record<string, unknown> | null;
  const requestId = typeof body?.requestId === "string" ? body.requestId.trim() : "";
  const officialSourceRef = typeof body?.officialSourceRef === "string" ? body.officialSourceRef.trim().slice(0, 1000) : "";
  const officialSourcePayload = typeof body?.officialSourcePayload === "string" ? body.officialSourcePayload.slice(0, 20000) : "";
  const standing = typeof body?.standing === "string" ? body.standing.trim().slice(0, 180) : "";
  const expiresAt = typeof body?.expiresAt === "string" ? body.expiresAt.trim() : "";
  const method = typeof body?.method === "string" ? body.method as CredentialVerificationMethod : "OFFICIAL_DIRECTORY_MANUAL";
  const decision = body?.decision === "VERIFIED" ? "VERIFIED" : body?.decision === "REJECTED" ? "REJECTED" : "";
  const reason = typeof body?.reason === "string" ? body.reason.trim().slice(0, 1000) : "";
  if (!requestId || !decision || !reason) return NextResponse.json({ ok: false, error: "requestId, decision, and reason are required." }, { status: 400 });
  const rows = await db.select().from(serviceRequests).where(eq(serviceRequests.serviceRequestId, requestId)).limit(1);
  const request = rows[0];
  if (!request || request.requestType !== "professional_credential_verification_request") {
    return NextResponse.json({ ok: false, error: "Credential request not found." }, { status: 404 });
  }
  const payload = (request.requestPayload ?? {}) as Record<string, unknown>;
  const role = String(payload.role ?? request.serviceCode ?? "");
  const email = request.contactEmail?.toLowerCase() ?? "";
  const fullLegalName = request.contactName ?? "";
  if (decision === "VERIFIED") {
    if (!officialSourceRef || !officialSourcePayload || !standing || !expiresAt) {
      return NextResponse.json({ ok: false, error: "Verified decisions require official source, source snapshot, standing, and expiry." }, { status: 400 });
    }
    const receipt = verifyInstitutionalCredential({
      principalId: email, principalEmail: email, fullLegalName,
      role: role as "lender" | "attorney" | "auditor" | "sponsor",
      credentialType: String(payload.credentialType ?? "professional credential"),
      credentialIdentifier: String(payload.credentialIdentifier ?? ""),
      jurisdictionOrIssuer: String(payload.jurisdictionOrIssuer ?? ""),
      officialSourceRef, officialSourcePayload, method, standing,
      agencyOrFirm: String(payload.organization ?? "") || null,
      independenceAttested: role === "auditor" ? body?.independenceAttested === true : null,
      verifiedBy: authority.actorId ?? "credential-reviewer", expiresAt, reason,
    });
    await db.update(serviceRequests).set({
      status: "VERIFIED", reviewedAt: new Date(), updatedAt: new Date(),
      responsePayload: { decision: "VERIFIED", standing, officialSourceRef, method, reason },
      metadata: {
        ...((request.metadata as Record<string, unknown>) ?? {}),
        professionalRole: role, credentialVerificationId: receipt.verificationId,
        credentialExpiresAt: receipt.expiresAt, credentialStanding: receipt.standing,
        officialSourceSnapshotHash: receipt.officialSourceSnapshotHash,
        verifiedBy: receipt.verifiedBy, verifiedAt: receipt.verifiedAt,
      },
    }).where(eq(serviceRequests.serviceRequestId, requestId));
  } else {
    await db.update(serviceRequests).set({
      status: "REJECTED", reviewedAt: new Date(), updatedAt: new Date(),
      responsePayload: { decision: "REJECTED", reason },
      metadata: { ...((request.metadata as Record<string, unknown>) ?? {}), professionalRole: role, rejectedBy: authority.actorId, rejectedAt: new Date().toISOString() },
    }).where(eq(serviceRequests.serviceRequestId, requestId));
  }
  const observability = createObservabilityEvent({
    eventType: `PROFESSIONAL_CREDENTIAL_${decision}`,
    domain: "security", severity: decision === "VERIFIED" ? "INFO" : "WARN",
    message: `Professional credential review completed: ${decision}.`,
    traceId, replayRef: traceId, actorId: authority.actorId,
    module: "api.governance.professional-credentials",
    metadata: { requestId, professionalEmail: email, role, decision },
  });
  await persistGovernanceEvidence({
    traceId, replayRef: traceId, observability,
    metadata: { route: "/api/governance/professional-credentials", requestId, role, decision },
  });
  return NextResponse.json({ ok: true, requestId, status: decision });
}
