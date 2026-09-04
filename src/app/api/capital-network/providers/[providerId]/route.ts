import { NextRequest, NextResponse } from "next/server";

import { evaluateAccess } from "@/lib/auth/accessControl";
import { effectiveRole } from "@/lib/auth/sessionAuthority";
import { reviewCapitalProvider } from "@/lib/financing/capitalNetworkStore";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import { recordCapitalNetworkEvidence } from "@/lib/financing/capitalNetworkGovernance";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ providerId: string }> },
) {
  const { providerId } = await context.params;
  const traceId = `capital-network-provider-review-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const actorId = req.headers.get("x-ares-authenticated-email")?.trim().toLowerCase() || null;
  const access = evaluateAccess({
    role: effectiveRole(req),
    allowedRoles: ["admin", "governance"],
    operation: "capital-network.provider.review",
    module: "api.capital-network.providers",
    traceId,
    actorId,
  });
  const guard = runRuntimeGuard({
    operation: "capital-network.provider.review",
    module: "api.capital-network.providers",
    traceId,
    schemaVersion: "capital-network-provider-v1.0.0",
    governanceVersion: "capital-network-v1.0.0",
    classificationLevel: "CONFIDENTIAL",
    replayRef: traceId,
    actorId,
  });
  if (!access.allowed || !guard.allowed) {
    return NextResponse.json({ ok: false, error: "Governance authority is required to change provider activation state.", governance: { traceId } }, { status: 403 });
  }
  try {
    const body = await req.json();
    const action = String(body.action ?? "UPDATE_GATES").toUpperCase() as "START_DUE_DILIGENCE" | "UPDATE_GATES" | "CERTIFY" | "SUSPEND" | "RETIRE";
    if (!["START_DUE_DILIGENCE", "UPDATE_GATES", "CERTIFY", "SUSPEND", "RETIRE"].includes(action)) throw new Error("Unsupported provider review action.");
    const result = await reviewCapitalProvider(providerId, action, body.patch ?? {}, actorId ?? "governance", traceId);
    const governanceEvidence = await recordCapitalNetworkEvidence({
      traceId,
      operation: "capital-network.provider.review",
      actorId,
      eventType: "CAPITAL_NETWORK_PROVIDER_REVIEWED",
      message: `Capital Network provider review action ${action} was recorded.`,
      targetId: providerId,
      metadata: { action, status: result.provider.status, blockers: result.blockers },
    });
    return NextResponse.json({ ok: true, ...result, governance: { traceId, humanReviewRequired: true, evidence: governanceEvidence.evidence } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const safe = /not found|blocked|unsupported/i.test(message)
      ? message
      : "Provider review could not be completed.";
    return NextResponse.json({ ok: false, error: safe, governance: { traceId } }, { status: 400 });
  }
}
