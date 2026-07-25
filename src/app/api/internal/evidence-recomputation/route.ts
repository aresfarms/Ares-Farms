import { NextResponse } from "next/server";
import { approvedRecomputationHandlers } from "@/lib/property/officialEvidenceRecomputationHandlerRegistry";
import { ensureProductionRecomputationBindings } from "@/lib/property/officialEvidenceProductionRecomputationHandlers";
import { evidenceRecomputationActivationStatus } from "@/lib/property/officialEvidenceRecomputationActivation";
import { recomputationActivationFinalized } from "@/lib/property/officialEvidenceRecomputationCeremony";
import { enqueueStaleEvidenceArtifacts, processEvidenceRecomputationQueue } from "@/lib/property/officialEvidenceRecomputationOrchestrator";
import { missingRequiredSecretDetail, readRequiredSecret, secureCompare } from "@/lib/security/requestGuards";

function oidcSchedulerAuthorized(request: Request): boolean {
  return process.env.EVIDENCE_RECOMPUTATION_ALLOW_OIDC_SCHEDULER === "true" && request.headers.get("x-cloudscheduler") === "true";
}
function authorized(request: Request): boolean {
  if (oidcSchedulerAuthorized(request)) return true;
  const configured = readRequiredSecret("EVIDENCE_RECOMPUTATION_CRON_SECRET");
  if (!configured) return false;
  const provided = request.headers.get("x-evidence-recomputation-secret") ?? request.headers.get("x-api-key") ?? request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  return provided.trim().length > 0 && secureCompare(provided.trim(), configured);
}
export async function POST(request: Request) {
  if (!oidcSchedulerAuthorized(request) && !readRequiredSecret("EVIDENCE_RECOMPUTATION_CRON_SECRET")) return NextResponse.json({ ok:false, error:missingRequiredSecretDetail("EVIDENCE_RECOMPUTATION_CRON_SECRET") }, { status:503 });
  if (!authorized(request)) return NextResponse.json({ ok:false, error:"Unauthorized evidence recomputation request." }, { status:401 });
  let handlers = approvedRecomputationHandlers();
  if (Object.keys(handlers).length === 0) {
    ensureProductionRecomputationBindings();
    handlers = approvedRecomputationHandlers();
  }
  if (process.env.EVIDENCE_RECOMPUTATION_REQUIRE_FULL_APPROVAL !== "false") {
    const activation = evidenceRecomputationActivationStatus();
    if (!activation.ready || !recomputationActivationFinalized()) return NextResponse.json({ ok:false, error:"Evidence recomputation is not fully approved and finalized for activation.", activation, finalized:recomputationActivationFinalized() }, { status:409 });
  }
  const body = await request.json().catch(() => ({})) as { propertyId?: string };
  const queued = enqueueStaleEvidenceArtifacts(body.propertyId);
  const jobs = await processEvidenceRecomputationQueue(handlers);
  return NextResponse.json({ ok:true, executedAt:new Date().toISOString(), queued:queued.length, jobs });
}
