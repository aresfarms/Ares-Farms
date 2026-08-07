import fs from "node:fs";
import os from "node:os";
import path from "node:path";
function ok(v: unknown, m: string): asserts v {
  if (!v) throw new Error(m);
}
async function main() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "furlong-watchdog-"));
  process.env.FURLONG_RUNTIME_STATE_DIR = root;
  const resumeDir = path.join(
    root,
    "official-evidence",
    "scheduler-resume-evidence",
  );
  fs.mkdirSync(resumeDir, { recursive: true });
  fs.writeFileSync(
    path.join(resumeDir, "run-1.json"),
    JSON.stringify({
      project: "test-project",
      region: "us-central1",
      job: "test-job",
      canaryRunId: "run-1",
      finalPacketId: "packet-1",
      resumedAt: "2026-07-25T22:00:00Z",
      schedulerState: "ENABLED",
    }),
  );
  const watchdog =
    await import("@/lib/property/officialEvidencePostResumeWatchdog");
  let paused = 0;
  const healthy = await watchdog.recordPostResumeExecution({
    executionId: "healthy",
    at: "2026-07-25T22:15:00Z",
    jobs: [{ id: "j1", status: "completed" }],
    pauseScheduler: async () => {
      paused += 1;
    },
  });
  ok(
    healthy?.action === "OBSERVED",
    "Healthy first-hour run must only be observed.",
  );
  const failed = await watchdog.recordPostResumeExecution({
    executionId: "failed",
    at: "2026-07-25T22:30:00Z",
    jobs: [{ id: "j2", status: "failed" }],
    pauseScheduler: async () => {
      paused += 1;
    },
  });
  ok(
    failed?.action === "PAUSED",
    "Failed first-hour run must pause scheduler.",
  );
  ok(paused === 1, "Pause executor must run exactly once for the failed run.");
  ok(
    watchdog.postResumeRollbackRequired(),
    "Rollback must be required after a guarded failure.",
  );
  ok(
    !watchdog.postResumeRollbackRequired("2026-07-25T22:31:00Z"),
    "A later human authorization must clear the old rollback block.",
  );
  const late = await watchdog.recordPostResumeExecution({
    executionId: "late",
    at: "2026-07-25T23:30:00Z",
    jobs: [{ id: "j3", status: "failed" }],
    pauseScheduler: async () => {
      paused += 1;
    },
  });
  ok(
    late?.action === "OBSERVED" && paused === 1,
    "Failures outside the first-hour guard must not invoke automatic pause.",
  );
  console.log(
    JSON.stringify(
      {
        ok: true,
        rule: "OFFICIAL-EVIDENCE-POST-RESUME-WATCHDOG-001",
        actions: watchdog.listPostResumeWatchdogReceipts().map((x) => x.action),
        paused,
      },
      null,
      2,
    ),
  );
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
