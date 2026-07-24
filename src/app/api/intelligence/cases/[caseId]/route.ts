import { NextRequest, NextResponse } from "next/server";

import { evaluateAccess } from "@/lib/auth/accessControl";
import { composeIntelligenceCaseWorkspace } from "@/lib/intelligence/intelligenceCaseWorkspaceRuntime";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";

export async function GET(req: NextRequest, context: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await context.params;
  const role = req.nextUrl.searchParams.get("role") ?? "borrower";
  const actorId = req.nextUrl.searchParams.get("userId");
  const traceId = `intelligence-case-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const runtimeGuard = runRuntimeGuard({
    operation: "intelligence.case.read",
    module: "api.intelligence.cases",
    traceId,
    schemaVersion: "intelligence-workspace-v1",
    governanceVersion: "master-volumes-runtime-v0.1.0",
    classificationLevel: "CONFIDENTIAL",
    replayRef: traceId,
    actorId,
    metadata: { route: "/api/intelligence/cases/[caseId]", caseId },
  });
  const access = evaluateAccess({
    role,
    allowedRoles: ["borrower", "lender", "sponsor", "governance", "admin", "auditor"],
    operation: "intelligence.case.read",
    module: "api.intelligence.cases",
    traceId,
    actorId,
  });
  if (!runtimeGuard.allowed || !access.allowed) {
    return NextResponse.json({ ok: false, error: "Authorized case access is required.", governance: { traceId, runtimeGuard, access } }, { status: 403 });
  }

  const split = (value: string | null) => value?.split(",").map((item) => item.trim()).filter(Boolean) ?? [];
  const workspace = composeIntelligenceCaseWorkspace({
    caseId,
    actorId,
    displayName: req.nextUrl.searchParams.get("name"),
    goal: req.nextUrl.searchParams.get("goal"),
    state: req.nextUrl.searchParams.get("state"),
    customerTypes: split(req.nextUrl.searchParams.get("customerTypes")),
    intendedUses: split(req.nextUrl.searchParams.get("intendedUses")),
  });
  return NextResponse.json({ ok: true, workspace, governance: { traceId, runtimeGuard, access } });
}
