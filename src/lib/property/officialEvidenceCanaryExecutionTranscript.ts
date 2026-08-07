import { createHash, randomUUID } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import { runtimeStatePath } from "./runtimeStatePath";
import { currentFinalCanaryReleasePacket } from "./officialEvidenceFinalCanaryPacket";
import { currentSchedulerReleaseAuthorization } from "./officialEvidenceSchedulerRelease";

export type CanaryTranscriptStatus = "STARTED" | "PASSED" | "FAILED";
export interface CanaryExecutionTranscript {
  transcriptId: string;
  canaryRunId: string;
  finalPacketId: string;
  authorizationReceiptId: string;
  startedAt: string;
  completedAt: string | null;
  durationMs: number | null;
  status: CanaryTranscriptStatus;
  authMode: "OIDC_SCHEDULER";
  queuedCount: number | null;
  jobCount: number | null;
  failedJobIds: string[];
  blockedJobIds: string[];
  jobResultHash: string | null;
}
const FILE = runtimeStatePath(
  "official-evidence",
  "canary-execution-transcripts.json",
);
const read = (): CanaryExecutionTranscript[] => {
  try {
    return JSON.parse(
      fs.readFileSync(FILE, "utf8"),
    ) as CanaryExecutionTranscript[];
  } catch {
    return [];
  }
};
const write = (rows: CanaryExecutionTranscript[]) => {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  const tmp = `${FILE}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(rows, null, 2) + "\n");
  fs.renameSync(tmp, FILE);
};
const hash = (value: unknown) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");

export function beginCanaryExecution(input: {
  canaryRunId?: string;
  at?: string;
}): CanaryExecutionTranscript {
  const packet = currentFinalCanaryReleasePacket();
  const authorization = currentSchedulerReleaseAuthorization();
  if (!packet || !authorization)
    throw new Error(
      "Canary execution requires a current final packet and scheduler authorization.",
    );
  const row: CanaryExecutionTranscript = {
    transcriptId: randomUUID(),
    canaryRunId: input.canaryRunId ?? randomUUID(),
    finalPacketId: packet.packetId,
    authorizationReceiptId: authorization.receiptId,
    startedAt: input.at ?? new Date().toISOString(),
    completedAt: null,
    durationMs: null,
    status: "STARTED",
    authMode: "OIDC_SCHEDULER",
    queuedCount: null,
    jobCount: null,
    failedJobIds: [],
    blockedJobIds: [],
    jobResultHash: null,
  };
  write([...read(), row]);
  return row;
}
export function completeCanaryExecution(input: {
  canaryRunId: string;
  queuedCount: number;
  jobs: Array<{ id?: string; jobId?: string; status?: string }>;
  at?: string;
}): CanaryExecutionTranscript {
  const rows = read();
  const index = rows.findIndex(
    (r) => r.canaryRunId === input.canaryRunId && r.status === "STARTED",
  );
  if (index < 0) throw new Error("Canary start transcript not found.");
  const started = rows[index];
  const completedAt = input.at ?? new Date().toISOString();
  const failedJobIds = input.jobs
    .filter((j) => j.status === "failed")
    .map((j) => String(j.jobId ?? j.id ?? "unknown"));
  const blockedJobIds = input.jobs
    .filter((j) => j.status === "blocked")
    .map((j) => String(j.jobId ?? j.id ?? "unknown"));
  const row: CanaryExecutionTranscript = {
    ...started,
    completedAt,
    durationMs: Math.max(
      0,
      Date.parse(completedAt) - Date.parse(started.startedAt),
    ),
    status: failedJobIds.length || blockedJobIds.length ? "FAILED" : "PASSED",
    queuedCount: input.queuedCount,
    jobCount: input.jobs.length,
    failedJobIds,
    blockedJobIds,
    jobResultHash: hash(input.jobs),
  };
  rows[index] = row;
  write(rows);
  return row;
}
export function failCanaryExecution(input: {
  canaryRunId: string;
  reason: string;
  at?: string;
}): CanaryExecutionTranscript {
  return completeCanaryExecution({
    canaryRunId: input.canaryRunId,
    queuedCount: 0,
    jobs: [{ id: `exception:${hash(input.reason)}`, status: "failed" }],
    at: input.at,
  });
}
export function listCanaryExecutionTranscripts(): CanaryExecutionTranscript[] {
  return read();
}
export function currentPassedCanaryTranscript(): CanaryExecutionTranscript | null {
  const packet = currentFinalCanaryReleasePacket();
  const authorization = currentSchedulerReleaseAuthorization();
  const row = [...read()].reverse().find((r) => r.status === "PASSED") ?? null;
  return row &&
    packet &&
    authorization &&
    row.finalPacketId === packet.packetId &&
    row.authorizationReceiptId === authorization.receiptId
    ? row
    : null;
}
