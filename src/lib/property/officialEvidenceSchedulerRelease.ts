import { randomUUID } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import { runtimeStatePath } from "./runtimeStatePath";
import { evidenceRecomputationActivationStatus } from "./officialEvidenceRecomputationActivation";
import { recomputationActivationFinalized } from "./officialEvidenceRecomputationCeremony";
import { currentFinalCanaryReleasePacket } from "./officialEvidenceFinalCanaryPacket";

export type SchedulerReleaseAction =
  "AUTHORIZE" | "CANARY_PASS" | "CANARY_FAIL" | "REVOKE";
export interface SchedulerReleaseReceipt {
  receiptId: string;
  action: SchedulerReleaseAction;
  actorId: string;
  actorName: string;
  at: string;
  reason: string;
  activationReady: boolean;
  ceremonyFinalized: boolean;
  canaryRunId?: string | null;
  jobCount?: number | null;
}
interface State {
  receipts: SchedulerReleaseReceipt[];
}
const FILE = runtimeStatePath(
  "official-evidence",
  "recomputation-scheduler-release.json",
);
const read = (): State => {
  try {
    return JSON.parse(fs.readFileSync(FILE, "utf8")) as State;
  } catch {
    return { receipts: [] };
  }
};
const write = (state: State) => {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  const tmp = `${FILE}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(state, null, 2) + "\n");
  fs.renameSync(tmp, FILE);
};

export function recordSchedulerRelease(input: {
  action: SchedulerReleaseAction;
  actorId: string;
  actorName: string;
  reason: string;
  canaryRunId?: string | null;
  jobCount?: number | null;
  at?: string;
}): SchedulerReleaseReceipt {
  if (!input.actorId.trim() || !input.actorName.trim() || !input.reason.trim())
    throw new Error(
      "Scheduler release requires an attributed actor and reason.",
    );
  const activationReady = evidenceRecomputationActivationStatus().ready;
  const ceremonyFinalized = recomputationActivationFinalized();
  const finalPacket = currentFinalCanaryReleasePacket();
  if (
    input.action === "AUTHORIZE" &&
    (!activationReady || !ceremonyFinalized || !finalPacket)
  )
    throw new Error(
      "Scheduler release cannot be authorized until technical readiness, the activation ceremony, and the current final canary release packet are complete.",
    );
  if (
    (input.action === "CANARY_PASS" || input.action === "CANARY_FAIL") &&
    !schedulerReleaseAuthorized()
  )
    throw new Error(
      "A canary result requires a current scheduler release authorization.",
    );
  const receipt: SchedulerReleaseReceipt = {
    receiptId: randomUUID(),
    action: input.action,
    actorId: input.actorId,
    actorName: input.actorName,
    at: input.at ?? new Date().toISOString(),
    reason: input.reason,
    activationReady,
    ceremonyFinalized,
    canaryRunId: input.canaryRunId ?? null,
    jobCount: input.jobCount ?? null,
  };
  const state = read();
  write({ receipts: [...state.receipts, receipt] });
  return receipt;
}
export function listSchedulerReleaseReceipts(): SchedulerReleaseReceipt[] {
  return read().receipts;
}
export function schedulerReleaseAuthorized(): boolean {
  const row = [...read().receipts]
    .reverse()
    .find((r) => r.action === "AUTHORIZE" || r.action === "REVOKE");
  return (
    row?.action === "AUTHORIZE" && row.activationReady && row.ceremonyFinalized
  );
}
export function schedulerCanaryPassed(): boolean {
  if (!schedulerReleaseAuthorized()) return false;
  const row = [...read().receipts]
    .reverse()
    .find(
      (r) =>
        r.action === "CANARY_PASS" ||
        r.action === "CANARY_FAIL" ||
        r.action === "REVOKE",
    );
  return (
    row?.action === "CANARY_PASS" &&
    row.activationReady &&
    row.ceremonyFinalized
  );
}
export function schedulerResumePermitted(): boolean {
  return schedulerReleaseAuthorized() && schedulerCanaryPassed();
}
