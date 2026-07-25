import { randomUUID } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import { runtimeStatePath } from "./runtimeStatePath";

export interface SchedulerResumeEvidence {
  project: string;
  region: string;
  job: string;
  canaryRunId: string;
  finalPacketId: string;
  resumedAt: string;
  schedulerState: string;
}
export interface PostResumeWatchdogReceipt {
  receiptId: string;
  executionId: string;
  at: string;
  resumeEvidence: SchedulerResumeEvidence;
  withinGuardWindow: boolean;
  jobCount: number;
  failedJobIds: string[];
  blockedJobIds: string[];
  action: "OBSERVED" | "PAUSE_REQUIRED" | "PAUSED" | "PAUSE_FAILED";
  pauseError: string | null;
}
const RECEIPTS = runtimeStatePath(
  "official-evidence",
  "post-resume-watchdog.json",
);
const RESUME_DIR = runtimeStatePath(
  "official-evidence",
  "scheduler-resume-evidence",
);
const readReceipts = (): PostResumeWatchdogReceipt[] => {
  try {
    return JSON.parse(
      fs.readFileSync(RECEIPTS, "utf8"),
    ) as PostResumeWatchdogReceipt[];
  } catch {
    return [];
  }
};
const writeReceipts = (rows: PostResumeWatchdogReceipt[]) => {
  fs.mkdirSync(path.dirname(RECEIPTS), { recursive: true });
  const tmp = `${RECEIPTS}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(rows, null, 2) + "\n");
  fs.renameSync(tmp, RECEIPTS);
};
export function latestSchedulerResumeEvidence(): SchedulerResumeEvidence | null {
  try {
    const files = fs.readdirSync(RESUME_DIR).filter((x) => x.endsWith(".json"));
    const rows = files.map(
      (name) =>
        JSON.parse(
          fs.readFileSync(path.join(RESUME_DIR, name), "utf8"),
        ) as SchedulerResumeEvidence,
    );
    return (
      rows.sort(
        (a, b) => Date.parse(b.resumedAt) - Date.parse(a.resumedAt),
      )[0] ?? null
    );
  } catch {
    return null;
  }
}
export async function recordPostResumeExecution(input: {
  executionId?: string;
  at?: string;
  jobs: Array<{ id?: string; jobId?: string; status?: string }>;
  pauseScheduler?: (evidence: SchedulerResumeEvidence) => Promise<void>;
}): Promise<PostResumeWatchdogReceipt | null> {
  const evidence = latestSchedulerResumeEvidence();
  if (!evidence) return null;
  const at = input.at ?? new Date().toISOString();
  const withinGuardWindow =
    Date.parse(at) - Date.parse(evidence.resumedAt) <= 60 * 60 * 1000;
  const failedJobIds = input.jobs
    .filter((j) => j.status === "failed")
    .map((j) => String(j.jobId ?? j.id ?? "unknown"));
  const blockedJobIds = input.jobs
    .filter((j) => j.status === "blocked")
    .map((j) => String(j.jobId ?? j.id ?? "unknown"));
  let action: PostResumeWatchdogReceipt["action"] = "OBSERVED";
  let pauseError: string | null = null;
  if (withinGuardWindow && (failedJobIds.length || blockedJobIds.length)) {
    action = "PAUSE_REQUIRED";
    try {
      if (!input.pauseScheduler)
        throw new Error("No scheduler pause executor is configured.");
      await input.pauseScheduler(evidence);
      action = "PAUSED";
    } catch (error) {
      action = "PAUSE_FAILED";
      pauseError = error instanceof Error ? error.message : String(error);
    }
  }
  const row: PostResumeWatchdogReceipt = {
    receiptId: randomUUID(),
    executionId: input.executionId ?? randomUUID(),
    at,
    resumeEvidence: evidence,
    withinGuardWindow,
    jobCount: input.jobs.length,
    failedJobIds,
    blockedJobIds,
    action,
    pauseError,
  };
  writeReceipts([...readReceipts(), row]);
  return row;
}
export function listPostResumeWatchdogReceipts(): PostResumeWatchdogReceipt[] {
  return readReceipts();
}
export function latestPostResumeRollbackAt(): string | null {
  const latest = [...readReceipts()]
    .reverse()
    .find(
      (row) =>
        row.action === "PAUSED" ||
        row.action === "PAUSE_FAILED" ||
        row.action === "PAUSE_REQUIRED",
    );
  return latest?.at ?? null;
}
export function postResumeRollbackRequired(after?: string | null): boolean {
  const rollbackAt = latestPostResumeRollbackAt();
  return Boolean(
    rollbackAt && (!after || Date.parse(rollbackAt) >= Date.parse(after)),
  );
}
