import { NextRequest, NextResponse } from "next/server";

import { evaluateAccess } from "@/lib/auth/accessControl";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";

import { releaseGovernanceEvidenceIntegritySummary } from "@/lib/governance/releaseGovernanceEvidenceStore";

export async function GET(req: NextRequest) {
  const traceId = `release-evidence-integrity-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const role = req.nextUrl.searchParams.get("role") ?? "user";
  const actorId = req.nextUrl.searchParams.get("userId");
  const runtimeGuard = runRuntimeGuard({
    operation: "release-evidence-integrity.read",
    module: "api.governance.release-evidence-integrity",
    traceId,
    schemaVersion: "release-evidence-integrity-v0.1.0",
    governanceVersion: "master-volumes-runtime-v0.1.0",
    classificationLevel: "CONFIDENTIAL",
    replayRef: traceId,
    actorId,
    metadata: { route: "/api/governance/release-evidence-integrity" },
  });
  const access = evaluateAccess({
    role,
    allowedRoles: ["auditor", "admin", "governance"],
    operation: "release-evidence-integrity.read",
    module: "api.governance.release-evidence-integrity",
    traceId,
    actorId,
  });
  if (!runtimeGuard.allowed || !access.allowed) {
    return NextResponse.json({ ok: false, error: "Governance authority is required.", governance: { traceId, runtimeGuard, access } }, { status: 403 });
  }

  const forceRefresh = req.nextUrl.searchParams.get("refresh") === "true";
  const integrity = releaseGovernanceEvidenceIntegritySummary({ forceRefresh });
  const integrityFindings = Object.entries(integrity.rejectedByReason)
    .filter(([, count]) => count > 0)
    .map(([reason, count]) => ({
      id: `release-evidence-integrity-${reason.toLowerCase()}`,
      eventType: reason,
      status: "REJECTED_EVIDENCE",
      classification: "CONFIDENTIAL",
      count,
    }));
  if (integrity.sharedGenerationStatus !== "HEALTHY") {
    integrityFindings.push({
      id: `release-evidence-integrity-cache-generation-${integrity.sharedGenerationStatus.toLowerCase()}`,
      eventType: `CACHE_GENERATION_${integrity.sharedGenerationStatus}`,
      status: "REJECTED_EVIDENCE",
      classification: "CONFIDENTIAL",
      count: 1,
    });
  }

  return NextResponse.json({
    ok: integrity.rejectedRecords === 0 && integrity.sharedGenerationStatus === "HEALTHY",
    count: integrity.rejectedRecords,
    integrityFindings,
    integrity,
    productionBlocked: true,
    disclosure: "Counts and coarse rejection reasons only; record contents and identifiers are not exposed.",
    governance: { traceId, runtimeGuard, access, forceRefresh },
  });
}
