/**
 * AI interview driver — SERVER-ONLY (Tier-1 advisory).
 *
 * Calls Claude (claude-opus-4-8, adaptive thinking, structured output — no
 * prefills) to pick the next interview slot from an ALLOWED set and phrase it
 * warmly, grounded in the transcript + verified facts. EVERY turn is validated
 * against the baked-in guards (no eligibility language, no PII, slot in the
 * allowed set). On a missing key, an API error, or a failed validation, this
 * returns null → the caller uses the DETERMINISTIC floor (conversationEngine).
 * Every attempt is logged to a PII-free, append-only interview ledger.
 *
 * Never imported by client code (uses fs + the Anthropic SDK + the API key).
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { createHash } from "node:crypto";

import type { InterviewState, SlotId } from "./conversationEngine";
import {
  INTERVIEW_MODEL, interviewSystemPrompt, nextQuestionSchema, validateAssistantTurn,
  transcriptText, describeState,
} from "./interviewPolicy";

export type Turn = { role: "assistant" | "user"; text: string };
export interface AiQuestion { slot: SlotId; question: string }

const LEDGER = path.join(process.cwd(), "data", "discovery-interview-ledger.ndjson");

/** Append a PII-free audit record of one interview turn (Tier-1 logging). */
export function logInterviewTurn(rec: {
  source: "ai" | "fallback";
  slot: string;
  ok: boolean;
  reasons?: string[];
  transcriptHash: string;
}): void {
  try {
    fs.mkdirSync(path.dirname(LEDGER), { recursive: true });
    fs.appendFileSync(LEDGER, JSON.stringify({ ts: new Date().toISOString(), ...rec }) + "\n", "utf8");
  } catch {
    /* logging must never break the interview */
  }
}

export function hashTranscript(turns: Turn[]): string {
  return "sha256:" + createHash("sha256").update(turns.map((t) => t.role + ":" + t.text).join("\n")).digest("hex").slice(0, 24);
}

export function aiEnabled(): boolean {
  return typeof process.env.ANTHROPIC_API_KEY === "string" && process.env.ANTHROPIC_API_KEY.length > 0;
}

/**
 * Ask the model for the next question. Returns a validated {slot, question} or
 * null (→ deterministic fallback). Never throws.
 */
export async function aiNextQuestion(
  state: InterviewState,
  turns: Turn[],
  allowedSlots: SlotId[],
  grounding: string,
): Promise<AiQuestion | null> {
  const tHash = hashTranscript(turns);
  if (!aiEnabled() || allowedSlots.length === 0) {
    logInterviewTurn({ source: "fallback", slot: "(none)", ok: true, reasons: ["ai-unavailable"], transcriptHash: tHash });
    return null;
  }
  try {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic();
    const system = interviewSystemPrompt(grounding);
    const userPrompt = [
      `Conversation so far:\n${transcriptText(turns) || "(none yet)"}`,
      `\nAnswers captured: ${describeState(state)}`,
      `\nALLOWED SLOTS for the next question (choose exactly one): ${allowedSlots.join(", ")}`,
      "\nReturn the structured output: { slot, question }. One warm, short question. No eligibility/approval language. No PII. No lists.",
    ].join("\n");

    const res = await client.messages.create({
      model: INTERVIEW_MODEL,
      max_tokens: 1024,
      thinking: { type: "adaptive" },
      system,
      messages: [{ role: "user", content: userPrompt }],
      output_config: { format: { type: "json_schema", schema: nextQuestionSchema(allowedSlots) } },
    } as never);

    const block = (res as { content: Array<{ type: string; text?: string }> }).content.find((b) => b.type === "text");
    const raw = block?.text ?? "";
    let parsed: { slot?: string; question?: string };
    try { parsed = JSON.parse(raw); } catch { parsed = {}; }
    const slot = String(parsed.slot ?? "");
    const question = String(parsed.question ?? "").trim();

    const v = validateAssistantTurn(question, slot, allowedSlots);
    if (!v.ok) {
      logInterviewTurn({ source: "fallback", slot, ok: false, reasons: v.reasons, transcriptHash: tHash });
      return null; // uncertain/unsafe → deterministic floor
    }
    logInterviewTurn({ source: "ai", slot, ok: true, transcriptHash: tHash });
    return { slot: slot as SlotId, question };
  } catch (e) {
    logInterviewTurn({ source: "fallback", slot: "(error)", ok: false, reasons: [(e as Error).message?.slice(0, 80) ?? "error"], transcriptHash: tHash });
    return null; // any API/parse error → deterministic floor
  }
}
