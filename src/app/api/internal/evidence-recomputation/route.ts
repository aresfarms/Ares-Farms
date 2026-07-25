import { NextResponse } from "next/server";
import { approvedRecomputationHandlers } from "@/lib/property/officialEvidenceRecomputationHandlerRegistry";
import { enqueueStaleEvidenceArtifacts, processEvidenceRecomputationQueue } from "@/lib/property/officialEvidenceRecomputationOrchestrator";
import { missingRequiredSecretDetail, readRequiredSecret, secureCompare } from "@/lib/security/requestGuards";

function authorized(request: Request): boolean {
  const configured = readRequiredSecret("EVIDENCE_RECOMPUTATION_CRON_SECRET");
  if (!configured) return false;
  const provided = request.headers.get("x-evidence-recomputation-secret") ?? request.headers.get("x-api-key") ?? request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  return provided.trim().length > 0 && secureCompare(provided.trim(), configured);
}
export async function POST(request: Request) {
  if (!readRequiredSecret("EVIDENCE_RECOMPUTATION_CRON_SECRET")) return NextResponse.json({ ok:false, error:missingRequiredSecretDetail("EVIDENCE_RECOMPUTATION_CRON_SECRET") }, { status:503 });
  if (!authorized(request)) return NextResponse.json({ ok:false, error:"Unauthorized evidence recomputation request." }, { status:401 });
  const body = await request.json().catch(() => ({})) as { propertyId?: string };
  const queued = enqueueStaleEvidenceArtifacts(body.propertyId);
  const jobs = await processEvidenceRecomputationQueue(approvedRecomputationHandlers());
  return NextResponse.json({ ok:true, executedAt:new Date().toISOString(), queued:queued.length, jobs });
}
