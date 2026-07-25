import { randomUUID } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import { runtimeStatePath } from "./runtimeStatePath";
import { listBatchReplayReceipts } from "./officialEvidenceBatchReplayVerification";
import {
  decideGovernedRecomputationHandler,
  latestGovernedRecomputationHandler,
} from "./officialEvidenceRecomputationHandlerRegistry";
import type { DownstreamArtifactKind } from "./officialEvidenceDownstreamInvalidation";

const KINDS: DownstreamArtifactKind[] = [
  "tax-scenario",
  "top-three",
  "qualification-result",
  "property-report",
];
export interface ApprovalPacketItem {
  kind: DownstreamArtifactKind;
  handlerId: string;
  implementationHash: string;
  attestationId: string;
  artifactId: string;
}
export interface ApprovalPacket {
  packetId: string;
  batchReceiptId: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  reason: string;
  items: ApprovalPacketItem[];
}
export interface ApprovalPacketDecision {
  decisionId: string;
  packetId: string;
  kind: DownstreamArtifactKind;
  decision: "APPROVE" | "SUSPEND";
  actorId: string;
  actorName: string;
  at: string;
  reason: string;
  handlerId: string;
  implementationHash: string;
  attestationId: string;
}
interface State {
  packets: ApprovalPacket[];
  decisions: ApprovalPacketDecision[];
}
const FILE = runtimeStatePath(
  "official-evidence",
  "recomputation-approval-packets.json",
);
const read = (): State => {
  try {
    return JSON.parse(fs.readFileSync(FILE, "utf8")) as State;
  } catch {
    return { packets: [], decisions: [] };
  }
};
const write = (state: State) => {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  const tmp = `${FILE}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(state, null, 2) + "\n");
  fs.renameSync(tmp, FILE);
};

export function createApprovalPacket(input: {
  actorId: string;
  actorName: string;
  reason: string;
  at?: string;
}): ApprovalPacket {
  if (!input.actorId.trim() || !input.actorName.trim() || !input.reason.trim())
    throw new Error("Approval packet requires an attributed actor and reason.");
  const batch = [...listBatchReplayReceipts()]
    .reverse()
    .find((r) => r.allMatched);
  if (!batch)
    throw new Error(
      "A successful four-builder batch replay receipt is required.",
    );
  const items: ApprovalPacketItem[] = KINDS.map((kind) => {
    const result = batch.results.find((r) => r.kind === kind);
    const registration = latestGovernedRecomputationHandler(kind);
    if (!result || !result.matched || !registration)
      throw new Error(`Current approval evidence is incomplete for ${kind}.`);
    return {
      kind,
      handlerId: registration.handlerId,
      implementationHash: registration.implementationHash,
      attestationId: result.attestationId,
      artifactId: result.artifactId,
    };
  });
  const state = read();
  const existing = state.packets.find(
    (p) =>
      p.batchReceiptId === batch.receiptId &&
      JSON.stringify(p.items) === JSON.stringify(items),
  );
  if (existing) return existing;
  const packet: ApprovalPacket = {
    packetId: randomUUID(),
    batchReceiptId: batch.receiptId,
    createdBy: input.actorId,
    createdByName: input.actorName,
    createdAt: input.at ?? new Date().toISOString(),
    reason: input.reason,
    items,
  };
  write({ packets: [...state.packets, packet], decisions: state.decisions });
  return packet;
}
export function decideApprovalPacketItem(input: {
  packetId: string;
  kind: DownstreamArtifactKind;
  decision: "APPROVE" | "SUSPEND";
  actorId: string;
  actorName: string;
  reason: string;
  at?: string;
}): ApprovalPacketDecision {
  if (!input.reason.trim())
    throw new Error("Each approval decision requires its own reason.");
  const state = read();
  const packet = state.packets.find((p) => p.packetId === input.packetId);
  if (!packet) throw new Error("Approval packet not found.");
  const item = packet.items.find((i) => i.kind === input.kind);
  if (!item) throw new Error("Approval packet item not found.");
  const current = latestGovernedRecomputationHandler(input.kind);
  if (
    !current ||
    current.handlerId !== item.handlerId ||
    current.implementationHash !== item.implementationHash
  )
    throw new Error(
      "Handler changed after packet creation; create a new approval packet.",
    );
  decideGovernedRecomputationHandler({
    kind: input.kind,
    decision: input.decision,
    reviewerId: input.actorId,
    reviewerName: input.actorName,
    reason: input.reason,
    at: input.at,
  });
  const row: ApprovalPacketDecision = {
    decisionId: randomUUID(),
    packetId: packet.packetId,
    kind: input.kind,
    decision: input.decision,
    actorId: input.actorId,
    actorName: input.actorName,
    at: input.at ?? new Date().toISOString(),
    reason: input.reason,
    handlerId: item.handlerId,
    implementationHash: item.implementationHash,
    attestationId: item.attestationId,
  };
  write({ packets: state.packets, decisions: [...state.decisions, row] });
  return row;
}
export function listApprovalPackets(): ApprovalPacket[] {
  return read().packets;
}
export function listApprovalPacketDecisions(): ApprovalPacketDecision[] {
  return read().decisions;
}
