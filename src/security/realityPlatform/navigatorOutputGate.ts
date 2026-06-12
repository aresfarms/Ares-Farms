/**
 * REALITY-SEC-001 §3.5 — Navigator output gate (ISOMORPHIC, pure).
 *
 * EVERY Navigator output passes this final check before rendering. Blocks
 * owner/resident identity, protected-class characterization, source-listing
 * proprietary copy markers, promise/guarantee language, single-number
 * financial promises, official determinations, "you qualify" statements, and
 * uncited/stale evidence. Also asserts the REQUIRED SHAPE on pathway payloads
 * (answer state, basis where numbers appear, ranges not single figures,
 * confidence, obstacles/alternatives, advisory framing).
 */

import { firewallOutputText } from "./propertyPrivacyFirewall";
import type { PathwayAssessment } from "@/lib/navigator/possibilityCheck";

export interface OutputGateVerdict { ok: boolean; blocks: string[] }

const PROMISE_LANGUAGE = [
  /\bguaranteed?\b/i,
  /\byou(?:'ll| will)\s+(?:earn|make|receive|get approved|succeed)\b/i,
  /\bwe promise\b/i,
  /\brisk[- ]free\b/i,
  /\bcertain (?:to|profit|return)\b/i,
];
const DETERMINATION_LANGUAGE = [
  /\byou (?:qualify|are (?:eligible|approved|pre-?approved))\b/i,
  /\bofficial(?:ly)? (?:approved|determined|certified)\b/i,
  /\bthis is legal advice\b/i,
  /\bwe (?:approve|determine|certify)\b/i,
];
/** Bare single-dollar figure NOT part of a range (e.g. "$2,400/mo" alone). */
function hasSingleNumberPromise(text: string): boolean {
  const stripped = text.replace(/\$\s?\d[\d,]*(?:\.\d+)?\s*[–—-]\s*\$?\s?\d[\d,]*(?:\.\d+)?/g, ""); // remove ranges
  return /\$\s?\d[\d,]*(?:\.\d+)?\s*(?:\/|per\s)?\s*(?:mo|month|wk|week|yr|year|hr|hour|acre)\b/i.test(stripped)
    && /\b(?:earn|make|income|revenue|profit|expect)\b/i.test(stripped);
}
/** Markers that source-listing proprietary copy leaked into output. */
const LISTING_COPY_MARKERS = [
  /listing description:/i, /per the listing:/i, /© ?(?:zillow|redfin|crexi|loopnet|realtor)/i,
  /mls ?#?\s*\d/i, /listing photos?\b/i,
];

// ── NO_DECISION_FOR_USER_GATE (Path-and-Options Doctrine, constitutional) ────
// Furlong shows the map; the user chooses the path. Prescriptive buy/sell/rent
// commands, "best/right/wrong decision" framing, and guaranteed-outcome
// language are blocked. ("should you / do you / can this property" QUESTIONS
// are fine — only DIRECTIVES at the user are blocked.)
const NO_DECISION_FOR_USER = [
  /\byou\s+should\s+(?:buy|sell|rent|lease|purchase|acquire|invest|not\s+buy|not\s+sell|avoid|walk\s+away)\b/i,
  /\byou\s+shouldn'?t\s+(?:buy|sell|rent|lease|purchase|invest)\b/i,
  /\b(?:i|we)\s+recommend\s+(?:you\s+)?(?:buy|sell|purchase|do\s+not|don'?t|against)\b/i,
  /\bthis\s+is\s+the\s+(?:best|right|wrong)\s+(?:choice|decision|property|option|move)\b/i,
  /\bthe\s+(?:best|right)\s+(?:choice|decision|move)\s+is\b/i,
  /\b(?:just|definitely)\s+(?:buy|sell|do)\s+(?:it|this)\b/i,
  /\b(?:don'?t|do\s+not)\s+(?:buy|do)\s+(?:it|this)\b/i,
  /\bthis\s+(?:will|is\s+guaranteed\s+to)\s+(?:close|make\s+money|succeed|profit|qualify)\b/i,
  /\byou\s+will\s+(?:definitely\s+)?(?:close|profit|qualify|succeed)\b/i,
];

/** Gate any free-text bound for the visitor. */
export function gateOutputText(text: string): OutputGateVerdict {
  const blocks: string[] = [];
  const fw = firewallOutputText(text);
  if (!fw.ok) blocks.push(...fw.violations);
  for (const re of PROMISE_LANGUAGE) if (re.test(text)) blocks.push(`promise/guarantee language (${re})`);
  for (const re of DETERMINATION_LANGUAGE) if (re.test(text)) blocks.push(`official determination / you-qualify language (${re})`);
  if (hasSingleNumberPromise(text)) blocks.push("single-number financial promise (ranges only)");
  for (const re of LISTING_COPY_MARKERS) if (re.test(text)) blocks.push("source-listing proprietary content marker");
  for (const re of NO_DECISION_FOR_USER) if (re.test(text)) blocks.push(`prescriptive decision-for-user language (${re})`);
  return { ok: blocks.length === 0, blocks };
}

/** True when text makes a decision FOR the user (path-and-options violation). */
export function decidesForUser(text: string): boolean {
  return NO_DECISION_FOR_USER.some((re) => re.test(text));
}

/** Gate the structured pathway payload (required shape). */
export function gatePathwayPayload(pathways: PathwayAssessment[]): OutputGateVerdict {
  const blocks: string[] = [];
  for (const p of pathways) {
    if (!["YES", "NO", "CANT_DETERMINE"].includes(p.answer)) blocks.push(`${p.id}: invalid answer state`);
    if (!p.confidence) blocks.push(`${p.id}: missing confidence`);
    if (p.profitability) {
      if (!(p.profitability.low < p.profitability.high)) blocks.push(`${p.id}: number is not a range`);
      if (!p.profitability.basis) blocks.push(`${p.id}: number without basis`);
      if (!p.profitability.lastVerified) blocks.push(`${p.id}: number without last-verified date`);
      if (!p.profitability.framing) blocks.push(`${p.id}: number without in-line uncertainty framing`);
    }
    if (p.answer === "NO" && !p.reroute) blocks.push(`${p.id}: NO without the honest reroute`);
    if (p.answer === "CANT_DETERMINE" && p.confirmWith.length === 0) blocks.push(`${p.id}: CANT_DETERMINE without who-to-confirm`);
    const text = [p.detail, p.whyShown, p.reroute ?? ""].join(" ");
    const tv = gateOutputText(text);
    if (!tv.ok) blocks.push(...tv.blocks.map((b) => `${p.id}: ${b}`));
  }
  return { ok: blocks.length === 0, blocks };
}
