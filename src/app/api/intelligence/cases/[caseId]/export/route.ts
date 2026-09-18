import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { sessionAuthority } from "@/lib/auth/sessionAuthority";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import { readJsonBodyWithLimit } from "@/lib/security/requestGuards";
import { loadFurlongCase } from "@/lib/intelligence/furlongCaseStore";
import { savedCaseAnswer } from "@/lib/intelligence/furlongCaseAnswer";
import { ANSWER_EXPORT_CONSENT, ANSWER_EXPORT_VERSION, buildAnswerExport, sha256 } from "@/lib/intelligence/furlongAnswerExport";
import { writeAuditEvent } from "@/lib/audit/writeAuditEvent";

export const runtime = "nodejs";
const headers = { "Cache-Control": "private, no-store", Vary: "Cookie", "X-Content-Type-Options": "nosniff" };
const error = (message: string, status: number) => NextResponse.json({ ok: false, error: message }, { status, headers });

/** Vol I CONST-CONSENT-001; Vol III TECH-RBAC-001 / TECH-EXPORT-001.
 * Owner-only personal download; no operator override, recipient grant, raw
 * document export or client-provided answer. Durable canonical audit fail-closed. */
export async function POST(req: NextRequest, context: { params: Promise<{ caseId: string }> }) {
  const authority = sessionAuthority(req);
  if (!authority.actorId) return error("Sign in to download your saved case.", 401);
  const caseId = (await context.params).caseId;
  if (!/^[A-Za-z0-9:_-]{1,160}$/.test(caseId)) return error("Invalid case identifier.", 400);
  const parsed = await readJsonBodyWithLimit<{ consent?: string; expectedRecordVersion?: string }>(req, { maxBytes: 4096 });
  if (!parsed.ok) return error(parsed.error, parsed.status);
  if (parsed.body?.consent !== ANSWER_EXPORT_CONSENT) return error("Confirm the personal-download notice first.", 400);
  const traceId = "answer-export-" + randomUUID();
  const guard = runRuntimeGuard({ operation: "intelligence.case.export", module: "api.intelligence.cases.export",
    traceId, replayRef: traceId, actorId: authority.actorId, schemaVersion: ANSWER_EXPORT_VERSION,
    governanceVersion: "master-volumes-runtime-v0.1.0", classificationLevel: "CONFIDENTIAL", metadata: { caseId, ownerOnly: true, providerDelivery: false } });
  if (!guard.allowed) return error("Case export is currently unavailable.", 403);
  try {
    const record = await loadFurlongCase(caseId);
    if (!record || record.ownerActorId !== authority.actorId) return error("Case not found or access not authorized.", 404);
    const recordVersion = record.replayRef || record.updatedAt.toISOString();
    if (parsed.body.expectedRecordVersion !== recordVersion) return error("This case changed. Refresh it before downloading.", 409);
    const answer = savedCaseAnswer({ ...record, updatedAt: record.updatedAt.toISOString() });
    const exportedAt = new Date().toISOString();
    const packet = await buildAnswerExport(answer, exportedAt, recordVersion);
    const receipt = await writeAuditEvent({
      userId: authority.actorId, actorRef: authority.actorId, eventType: "FURLONG_ANSWER_PERSONAL_EXPORT_PREPARED",
      entityType: "furlong_case", entityId: caseId, target: { type: "furlong_case", id: caseId },
      decision: "OWNER_DOWNLOAD_AUTHORIZED", classification: "CONFIDENTIAL", source: "furlong-answer-export",
      moduleId: "api.intelligence.cases.export", traceId,
      // Preserve exact replay input in the confidential immutable ledger, not stdout.
      payload: { answer, manifest: packet.manifest, manifestHash: packet.manifestHash, packageHash: sha256(packet.bytes) },
      metadata: { replayRef: traceId, schemaVersion: ANSWER_EXPORT_VERSION, recordVersion, exportedAt,
        consentVersion: ANSWER_EXPORT_CONSENT, recipient: "case-owner-personal-download", documentAttachments: 0,
        deliveryConfirmed: false, providerSharingChanged: false, professionalCertification: false },
    });
    if (!receipt.ok || receipt.mode !== "durable-canonical") throw new Error("Export audit unavailable.");
    return new NextResponse(new Uint8Array(packet.bytes), { headers: { ...headers,
      "Content-Type": "application/zip", "Content-Disposition": 'attachment; filename="Furlong-Answer.zip"',
      "X-Furlong-Manifest-SHA256": packet.manifestHash, "X-Furlong-Audit-Id": receipt.auditId } });
  } catch { return error("The download could not be prepared safely. No successful download is confirmed. Please try again.", 503); }
}
