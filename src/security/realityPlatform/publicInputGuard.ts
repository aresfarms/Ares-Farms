/**
 * REALITY-SEC-001 §3.1 — Public input guard (ISOMORPHIC, pure).
 *
 * Every Navigator public input passes through guardPublicInput() BEFORE any
 * interpretation or model context assembly. Composes the existing doctrine
 * detectors (ownership/steering/injection) with payload, script, URL-safety,
 * and abuse-repetition checks, and returns ONE of the six decision states.
 * Fail-closed: anything script-like or oversized never reaches the engine.
 */

import { classifyRefusal } from "@/lib/navigator/propertyPrivacyDoctrine";
import { looksLikeInjectionOrOffTopic, looksLikePII } from "@/lib/discovery/interviewPolicy";
import { sandboxUrl } from "./urlIngestionSandbox";

export type InputDecision =
  | "ALLOW"
  | "ALLOW_WITH_SCRUB"
  | "REFUSE_AND_REDIRECT"
  | "QUARANTINE"
  | "RATE_LIMIT"
  | "ESCALATE_SECURITY";

export interface InputGuardVerdict {
  decision: InputDecision;
  reasons: string[];
  /** Which sub-detector fired (telemetry key; never the raw content). */
  signals: string[];
}

export const MAX_INPUT_CHARS = 4000;

const SCRIPT_PATTERNS = [
  /<script\b/i, /<\/script>/i, /javascript:/i, /on(?:load|error|click)\s*=/i,
  /\beval\s*\(/i, /document\.cookie/i, /<iframe\b/i, /data:text\/html/i,
];
const PROMPT_EXTRACTION = [
  /(?:reveal|print|show|repeat|dump).{0,30}(?:system\s*prompt|instructions|rules)/i,
  /what (?:are|were) your (?:instructions|rules|prompt)/i,
];
const INJECTION_HARD = [
  /ignore (?:all|any|previous|prior|your) (?:instructions?|rules?|prompts?)/i,
  /you are now|pretend to be|act as (?:an?|the)\b/i,
  /\bjailbreak\b|\bdeveloper mode\b|\bDAN\b/,
];

export interface AbuseCounters {
  /** Refusals already issued this session (round-tripped, anonymous). */
  refusals: number;
  /** Guard rejections this session. */
  rejections: number;
}

export function guardPublicInput(raw: string, counters: AbuseCounters = { refusals: 0, rejections: 0 }): InputGuardVerdict {
  const reasons: string[] = [];
  const signals: string[] = [];
  const text = raw ?? "";

  // 1 — oversized payloads: blocked before anything else.
  if (text.length > MAX_INPUT_CHARS) {
    return { decision: "QUARANTINE", reasons: [`payload exceeds ${MAX_INPUT_CHARS} chars`], signals: ["oversized-payload"] };
  }
  // 2 — executable/script content: quarantined.
  if (SCRIPT_PATTERNS.some((re) => re.test(text))) {
    return { decision: "QUARANTINE", reasons: ["executable/script content"], signals: ["script-content"] };
  }
  // 3 — repeated abuse: rate limit, then escalate.
  if (counters.refusals + counters.rejections >= 12) {
    return { decision: "ESCALATE_SECURITY", reasons: ["sustained abusive session"], signals: ["abuse-escalation"] };
  }
  if (counters.refusals + counters.rejections >= 6) {
    return { decision: "RATE_LIMIT", reasons: ["repeated refusal-triggering behavior"], signals: ["abuse-rate-limit"] };
  }
  // 4 — system-prompt extraction + hard injection: refuse and redirect.
  if (PROMPT_EXTRACTION.some((re) => re.test(text))) {
    return { decision: "REFUSE_AND_REDIRECT", reasons: ["system-prompt extraction attempt"], signals: ["prompt-extraction"] };
  }
  if (INJECTION_HARD.some((re) => re.test(text)) || looksLikeInjectionOrOffTopic(text)) {
    return { decision: "REFUSE_AND_REDIRECT", reasons: ["prompt injection attempt"], signals: ["prompt-injection"] };
  }
  // 5 — ownership / steering probes: refuse and redirect (G-1/G-2).
  const refusal = classifyRefusal(text);
  if (refusal) {
    return { decision: "REFUSE_AND_REDIRECT", reasons: [`${refusal} probe`], signals: [`${refusal}-probe`] };
  }
  // 6 — pasted URLs: sandbox-verdict the URL portion; unsafe → quarantine.
  const urlMatch = text.match(/https?:\/\/\S+/i);
  if (urlMatch) {
    const sb = sandboxUrl(urlMatch[0]);
    if (sb.verdict === "BLOCKED") return { decision: "QUARANTINE", reasons: sb.reasons, signals: ["unsafe-url"] };
    if (sb.verdict === "QUARANTINED") { reasons.push(...sb.reasons); signals.push("url-quarantined"); }
  }
  // 7 — volunteered PII: allowed but scrubbed (never echoed/stored).
  if (looksLikePII(text)) {
    return { decision: "ALLOW_WITH_SCRUB", reasons: ["volunteered PII — scrubbed, never echoed"], signals: ["pii-scrub"] };
  }
  return { decision: signals.length ? "ALLOW_WITH_SCRUB" : "ALLOW", reasons, signals };
}
