import { randomUUID } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import { runtimeStatePath } from "./runtimeStatePath";
import { ensureProductionRecomputationBindings } from "./officialEvidenceProductionRecomputationHandlers";
import { evidenceRecomputationActivationStatus } from "./officialEvidenceRecomputationActivation";

export type CeremonyAction = "INITIALIZE" | "FINALIZE" | "REVOKE";
export interface RecomputationActivationReceipt {
  receiptId: string; action: CeremonyAction; actorId: string; actorName: string; at: string; reason: string;
  readyAtDecision: boolean; handlerHashes: Record<string, string | null>;
}
interface State { receipts: RecomputationActivationReceipt[]; }
const FILE = runtimeStatePath("official-evidence", "recomputation-activation-ceremony.json");
const read = (): State => { try { return JSON.parse(fs.readFileSync(FILE, "utf8")) as State; } catch { return { receipts: [] }; } };
const write = (state: State) => { fs.mkdirSync(path.dirname(FILE), { recursive: true }); const tmp = `${FILE}.${process.pid}.${Date.now()}.tmp`; fs.writeFileSync(tmp, JSON.stringify(state, null, 2) + "\n"); fs.renameSync(tmp, FILE); };

export function recordRecomputationActivationCeremony(input: { action: CeremonyAction; actorId: string; actorName: string; reason: string; at?: string }): RecomputationActivationReceipt {
  if (!input.actorId.trim() || !input.actorName.trim() || !input.reason.trim()) throw new Error("Activation ceremony requires an attributed actor and reason.");
  ensureProductionRecomputationBindings();
  const activation = evidenceRecomputationActivationStatus();
  if (input.action === "FINALIZE" && !activation.ready) throw new Error("Activation cannot be finalized until all four exact handlers are approved, replay-matched, and runtime-bound.");
  const receipt: RecomputationActivationReceipt = {
    receiptId: randomUUID(), action: input.action, actorId: input.actorId, actorName: input.actorName, at: input.at ?? new Date().toISOString(), reason: input.reason,
    readyAtDecision: activation.ready, handlerHashes: Object.fromEntries(activation.details.map((item) => [item.kind, item.implementationHash])),
  };
  const state = read(); write({ receipts: [...state.receipts, receipt] }); return receipt;
}
export function listRecomputationActivationReceipts(): RecomputationActivationReceipt[] { return read().receipts; }
export function recomputationActivationFinalized(): boolean {
  const receipts = read().receipts;
  const latestFinal = [...receipts].reverse().find((receipt) => receipt.action === "FINALIZE" || receipt.action === "REVOKE");
  return latestFinal?.action === "FINALIZE" && latestFinal.readyAtDecision;
}
