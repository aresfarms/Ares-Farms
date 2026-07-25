import { NextResponse } from "next/server";
import { approvedRecomputationHandlers } from "@/lib/property/officialEvidenceRecomputationHandlerRegistry";
import { ensureProductionRecomputationBindings } from "@/lib/property/officialEvidenceProductionRecomputationHandlers";
import { evidenceRecomputationActivationStatus } from "@/lib/property/officialEvidenceRecomputationActivation";
import { recomputationActivationFinalized } from "@/lib/property/officialEvidenceRecomputationCeremony";
import {
  enqueueStaleEvidenceArtifacts,
  processEvidenceRecomputationQueue,
} from "@/lib/property/officialEvidenceRecomputationOrchestrator";
import {
  recordSchedulerRelease,
  schedulerReleaseAuthorized,
} from "@/lib/property/officialEvidenceSchedulerRelease";
import {
  beginCanaryExecution,
  completeCanaryExecution,
  failCanaryExecution,
} from "@/lib/property/officialEvidenceCanaryExecutionTranscript";
import { recordPostResumeExecution } from "@/lib/property/officialEvidencePostResumeWatchdog";
import { pauseEvidenceRecomputationScheduler } from "@/lib/property/officialEvidenceSchedulerPause";
import { openSteadyStateIncident } from "@/lib/property/officialEvidenceSteadyStateIncident";
import {
  assignIncidentSla,
  evaluateIncidentSlaBreaches,
} from "@/lib/property/officialEvidenceIncidentSla";
import {
  missingRequiredSecretDetail,
  readRequiredSecret,
  secureCompare,
} from "@/lib/security/requestGuards";

function oidcSchedulerAuthorized(request: Request): boolean {
  return (
    process.env.EVIDENCE_RECOMPUTATION_ALLOW_OIDC_SCHEDULER === "true" &&
    request.headers.get("x-cloudscheduler") === "true"
  );
}
function authorized(request: Request): boolean {
  if (oidcSchedulerAuthorized(request)) return true;
  const configured = readRequiredSecret("EVIDENCE_RECOMPUTATION_CRON_SECRET");
  if (!configured) return false;
  const provided =
    request.headers.get("x-evidence-recomputation-secret") ??
    request.headers.get("x-api-key") ??
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    "";
  return (
    provided.trim().length > 0 && secureCompare(provided.trim(), configured)
  );
}
export async function POST(request: Request) {
  if (
    !oidcSchedulerAuthorized(request) &&
    !readRequiredSecret("EVIDENCE_RECOMPUTATION_CRON_SECRET")
  )
    return NextResponse.json(
      {
        ok: false,
        error: missingRequiredSecretDetail(
          "EVIDENCE_RECOMPUTATION_CRON_SECRET",
        ),
      },
      { status: 503 },
    );
  if (!authorized(request))
    return NextResponse.json(
      { ok: false, error: "Unauthorized evidence recomputation request." },
      { status: 401 },
    );
  let handlers = approvedRecomputationHandlers();
  if (Object.keys(handlers).length === 0) {
    ensureProductionRecomputationBindings();
    handlers = approvedRecomputationHandlers();
  }
  if (process.env.EVIDENCE_RECOMPUTATION_REQUIRE_FULL_APPROVAL !== "false") {
    const activation = evidenceRecomputationActivationStatus();
    if (!activation.ready || !recomputationActivationFinalized())
      return NextResponse.json(
        {
          ok: false,
          error:
            "Evidence recomputation is not fully approved and finalized for activation.",
          activation,
          finalized: recomputationActivationFinalized(),
        },
        { status: 409 },
      );
  }
  const body = (await request.json().catch(() => ({}))) as {
    propertyId?: string;
    canary?: boolean;
  };
  if (body.canary && !schedulerReleaseAuthorized())
    return NextResponse.json(
      { ok: false, error: "Scheduler canary is not authorized." },
      { status: 409 },
    );
  const canaryTranscript = body.canary ? beginCanaryExecution({}) : null;
  try {
    const queued = enqueueStaleEvidenceArtifacts(body.propertyId);
    const jobs = await processEvidenceRecomputationQueue(handlers);
    const watchdogReceipt = body.canary
      ? null
      : await recordPostResumeExecution({
          jobs,
          pauseScheduler: pauseEvidenceRecomputationScheduler,
        });
    const steadyStateIncident =
      watchdogReceipt && !watchdogReceipt.withinGuardWindow
        ? openSteadyStateIncident({
            executionId: watchdogReceipt.executionId,
            finalPacketId: watchdogReceipt.resumeEvidence.finalPacketId,
            failedJobIds: watchdogReceipt.failedJobIds,
            blockedJobIds: watchdogReceipt.blockedJobIds,
            at: watchdogReceipt.at,
          })
        : null;
    const incidentSla = steadyStateIncident
      ? assignIncidentSla(steadyStateIncident)
      : null;
    const incidentSlaBreaches = evaluateIncidentSlaBreaches();
    let completedTranscript = null;
    if (body.canary && canaryTranscript) {
      completedTranscript = completeCanaryExecution({
        canaryRunId: canaryTranscript.canaryRunId,
        queuedCount: queued.length,
        jobs,
      });
      recordSchedulerRelease({
        action:
          completedTranscript.status === "PASSED"
            ? "CANARY_PASS"
            : "CANARY_FAIL",
        actorId: "system:scheduler-canary",
        actorName: "scheduler-canary",
        reason:
          completedTranscript.status === "PASSED"
            ? "Canary completed without failed or blocked recomputation jobs."
            : `Canary failed or blocked for ${completedTranscript.failedJobIds.length + completedTranscript.blockedJobIds.length} job(s).`,
        canaryRunId: completedTranscript.canaryRunId,
        jobCount: jobs.length,
      });
    }
    return NextResponse.json({
      ok: true,
      executedAt: new Date().toISOString(),
      queued: queued.length,
      jobs,
      canary: Boolean(body.canary),
      canaryTranscript: completedTranscript,
      postResumeWatchdog: watchdogReceipt,
      steadyStateIncident,
      incidentSla,
      incidentSlaBreaches,
    });
  } catch (error) {
    if (body.canary && canaryTranscript) {
      const failed = failCanaryExecution({
        canaryRunId: canaryTranscript.canaryRunId,
        reason: error instanceof Error ? error.message : String(error),
      });
      recordSchedulerRelease({
        action: "CANARY_FAIL",
        actorId: "system:scheduler-canary",
        actorName: "scheduler-canary",
        reason: "Canary execution raised an exception.",
        canaryRunId: failed.canaryRunId,
        jobCount: 0,
      });
    }
    throw error;
  }
}
