import { randomUUID } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import { runtimeStatePath } from "./runtimeStatePath";
import { approvalCompletionStatus } from "./officialEvidenceApprovalPacket";
import { evidenceRecomputationActivationStatus } from "./officialEvidenceRecomputationActivation";
import { listReviewHandoffReceipts } from "./officialEvidenceReviewHandoff";
import {
  listRecomputationActivationReceipts,
  recomputationActivationFinalized,
} from "./officialEvidenceRecomputationCeremony";

export interface FinalCanaryReleasePacket {
  packetId: string;
  actorId: string;
  actorName: string;
  at: string;
  reason: string;
  approvalPacketId: string;
  handoffReceiptId: string;
  ceremonyReceiptId: string;
  handlerHashes: Record<string, string | null>;
  ready: boolean;
}
const FILE = runtimeStatePath(
  "official-evidence",
  "final-canary-release-packets.json",
);
const read = (): FinalCanaryReleasePacket[] => {
  try {
    return JSON.parse(
      fs.readFileSync(FILE, "utf8"),
    ) as FinalCanaryReleasePacket[];
  } catch {
    return [];
  }
};
const write = (rows: FinalCanaryReleasePacket[]) => {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  const tmp = `${FILE}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(rows, null, 2) + "\n");
  fs.renameSync(tmp, FILE);
};

export function createFinalCanaryReleasePacket(input: {
  actorId: string;
  actorName: string;
  reason: string;
  at?: string;
}): FinalCanaryReleasePacket {
  if (!input.actorId.trim() || !input.actorName.trim() || !input.reason.trim())
    throw new Error(
      "Final canary release packet requires an attributed actor and reason.",
    );
  const approval = approvalCompletionStatus();
  const activation = evidenceRecomputationActivationStatus();
  const handoff =
    [...listReviewHandoffReceipts()]
      .reverse()
      .find((r) => r.readyForFinalCeremony) ?? null;
  const ceremony =
    [...listRecomputationActivationReceipts()]
      .reverse()
      .find((r) => r.action === "FINALIZE") ?? null;
  const ready = Boolean(
    approval.packetId &&
    approval.complete &&
    approval.allApproved &&
    approval.current &&
    activation.ready &&
    handoff &&
    ceremony &&
    recomputationActivationFinalized() &&
    ceremony.at >= handoff.at,
  );
  if (!ready || !handoff || !ceremony || !approval.packetId)
    throw new Error(
      "Final canary release packet requires a current completed approval packet, a prior ready handoff receipt, and a later finalized activation ceremony.",
    );
  const rows = read();
  const existing = rows.find(
    (r) =>
      r.approvalPacketId === approval.packetId &&
      r.handoffReceiptId === handoff.receiptId &&
      r.ceremonyReceiptId === ceremony.receiptId,
  );
  if (existing) return existing;
  const packet: FinalCanaryReleasePacket = {
    packetId: randomUUID(),
    actorId: input.actorId,
    actorName: input.actorName,
    at: input.at ?? new Date().toISOString(),
    reason: input.reason,
    approvalPacketId: approval.packetId,
    handoffReceiptId: handoff.receiptId,
    ceremonyReceiptId: ceremony.receiptId,
    handlerHashes: Object.fromEntries(
      activation.details.map((x) => [x.kind, x.implementationHash]),
    ),
    ready,
  };
  write([...rows, packet]);
  return packet;
}
export function listFinalCanaryReleasePackets(): FinalCanaryReleasePacket[] {
  return read();
}
export function currentFinalCanaryReleasePacket(): FinalCanaryReleasePacket | null {
  const p = read().at(-1) ?? null;
  if (!p) return null;
  const approval = approvalCompletionStatus();
  const activation = evidenceRecomputationActivationStatus();
  return p.ready &&
    p.approvalPacketId === approval.packetId &&
    approval.complete &&
    approval.allApproved &&
    approval.current &&
    activation.ready &&
    recomputationActivationFinalized()
    ? p
    : null;
}
