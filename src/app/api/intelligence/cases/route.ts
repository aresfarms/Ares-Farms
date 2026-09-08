import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { sessionAuthority } from "@/lib/auth/sessionAuthority";
import { listOwnedFurlongCases } from "@/lib/intelligence/furlongCaseStore";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
/** CONST-CONSENT-001 / TECH-RBAC-001: even privileged users list only their
 * own cases here. No caller-supplied owner, role or tenant filter. */
export async function GET(req: NextRequest) {
  const authority = sessionAuthority(req);
  if (!authority.actorId) return NextResponse.json({ ok: false, error: "Sign in to view your saved cases." }, { status: 401 });
  const traceId = "furlong-case-list-" + randomUUID();
  const guard = runRuntimeGuard({
    operation: "intelligence.case.read", module: "api.intelligence.cases",
    traceId, replayRef: traceId, actorId: authority.actorId,
    schemaVersion: "furlong-case-v1", governanceVersion: "master-volumes-runtime-v0.1.0",
    classificationLevel: "CONFIDENTIAL", metadata: { ownerScoped: true },
  });
  if (!guard.allowed) return NextResponse.json({ ok: false, error: "Saved-case access is unavailable." }, { status: 403 });
  try {
    const cases = await listOwnedFurlongCases(authority.actorId);
    return NextResponse.json({ ok: true, cases, traceId }, { headers: { "Cache-Control": "private, no-store", Vary: "Cookie" } });
  } catch {
    return NextResponse.json({ ok: false, error: "Saved cases are temporarily unavailable. Please try again." }, { status: 503, headers: { "Cache-Control": "private, no-store" } });
  }
}
