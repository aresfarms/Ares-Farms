import { NextRequest, NextResponse } from "next/server";
import { evaluateAccess, type AccessRole } from "@/lib/auth/accessControl";
import { effectiveRole } from "@/lib/auth/sessionAuthority";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";

const ROLES: AccessRole[] = ["borrower", "lender", "operator", "admin", "governance"];

export function lenderSubmissionRequestContext(req: NextRequest, operation: string, allowedRoles: AccessRole[] = ROLES) {
  const traceId = `lender-submission-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const actorId = req.headers.get("x-ares-authenticated-user-id") ?? req.headers.get("x-ares-authenticated-email");
  const runtime = runRuntimeGuard({ operation, module: "lender-submission", traceId, schemaVersion: "lender-submission-v1", governanceVersion: "CANON-LENDER-SUBMISSION-001", classificationLevel: "RESTRICTED", replayRef: traceId, actorId, metadata: { route: req.nextUrl.pathname } });
  const access = evaluateAccess({ role: effectiveRole(req), allowedRoles, operation, module: "lender-submission", traceId, actorId });
  return { traceId, actorId: actorId ?? "authenticated-actor", allowed: runtime.allowed && access.allowed, runtime, access };
}

export function lenderSubmissionDenied(context: ReturnType<typeof lenderSubmissionRequestContext>) {
  return NextResponse.json({ ok: false, error: "Authorized lender-submission access is required.", governance: { traceId: context.traceId, runtime: context.runtime, access: context.access } }, { status: 403 });
}

export function lenderSubmissionError(error: unknown, traceId: string) {
  const message = error instanceof Error ? error.message : "Lender submission request failed.";
  const status = /not found/i.test(message) ? 404 : 400;
  return NextResponse.json({ ok: false, error: message, governance: { traceId, productionDeliveryBlocked: true } }, { status });
}
