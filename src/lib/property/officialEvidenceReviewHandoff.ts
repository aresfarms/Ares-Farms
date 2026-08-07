import { randomUUID } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import { runtimeStatePath } from "./runtimeStatePath";
import { approvalCompletionStatus } from "./officialEvidenceApprovalPacket";
import { evidenceRecomputationActivationStatus } from "./officialEvidenceRecomputationActivation";
import { recomputationActivationFinalized } from "./officialEvidenceRecomputationCeremony";
import {
  schedulerReleaseAuthorized,
  schedulerCanaryPassed,
  schedulerResumePermitted,
} from "./officialEvidenceSchedulerRelease";

export interface ReviewHandoffChecklist {
  packetsReady: boolean;
  batchReplayMatched: boolean;
  fourDecisionsComplete: boolean;
  allApproved: boolean;
  implementationsCurrent: boolean;
  technicalReady: boolean;
  ceremonyFinalized: boolean;
  schedulerReleaseAuthorized: boolean;
  canaryPassed: boolean;
  resumePermitted: boolean;
}
export interface ReviewHandoffReceipt {
  receiptId: string;
  actorId: string;
  actorName: string;
  at: string;
  reason: string;
  checklist: ReviewHandoffChecklist;
  readyForFinalCeremony: boolean;
}
const FILE = runtimeStatePath(
  "official-evidence",
  "recomputation-review-handoff.json",
);
const read = (): ReviewHandoffReceipt[] => {
  try {
    return JSON.parse(fs.readFileSync(FILE, "utf8")) as ReviewHandoffReceipt[];
  } catch {
    return [];
  }
};
const write = (rows: ReviewHandoffReceipt[]) => {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  const tmp = `${FILE}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(rows, null, 2) + "\n");
  fs.renameSync(tmp, FILE);
};

export function currentReviewHandoffChecklist(): ReviewHandoffChecklist {
  const approval = approvalCompletionStatus();
  const activation = evidenceRecomputationActivationStatus();
  return {
    packetsReady: approval.packetId !== null,
    batchReplayMatched:
      approval.items.length === 4 &&
      approval.items.every((item) => item.current),
    fourDecisionsComplete: approval.complete,
    allApproved: approval.allApproved,
    implementationsCurrent: approval.current,
    technicalReady: activation.ready,
    ceremonyFinalized: recomputationActivationFinalized(),
    schedulerReleaseAuthorized: schedulerReleaseAuthorized(),
    canaryPassed: schedulerCanaryPassed(),
    resumePermitted: schedulerResumePermitted(),
  };
}
export function recordReviewHandoff(input: {
  actorId: string;
  actorName: string;
  reason: string;
  at?: string;
}): ReviewHandoffReceipt {
  if (!input.actorId.trim() || !input.actorName.trim() || !input.reason.trim())
    throw new Error("Review handoff requires an attributed actor and reason.");
  const checklist = currentReviewHandoffChecklist();
  const readyForFinalCeremony =
    checklist.packetsReady &&
    checklist.batchReplayMatched &&
    checklist.fourDecisionsComplete &&
    checklist.allApproved &&
    checklist.implementationsCurrent &&
    checklist.technicalReady &&
    !checklist.ceremonyFinalized;
  if (!readyForFinalCeremony)
    throw new Error(
      "Review handoff cannot be recorded until the current approval packet is complete, all four decisions are approvals, and all exact implementations are current and technically ready.",
    );
  const receipt: ReviewHandoffReceipt = {
    receiptId: randomUUID(),
    actorId: input.actorId,
    actorName: input.actorName,
    at: input.at ?? new Date().toISOString(),
    reason: input.reason,
    checklist,
    readyForFinalCeremony,
  };
  write([...read(), receipt]);
  return receipt;
}
export function listReviewHandoffReceipts(): ReviewHandoffReceipt[] {
  return read();
}
