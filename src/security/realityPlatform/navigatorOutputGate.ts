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

/** Gate any free-text bound for the visitor. */
export function gateOutputText(text: string): OutputGateVerdict {
  const blocks: string[] = [];
  const fw = firewallOutputText(text);
  if (!fw.ok) blocks.push(...fw.violations);
  for (const re of PROMISE_LANGUAGE) if (re.test(text)) blocks.push(`promise/guarantee language (${re})`);
  for (const re of DETERMINATION_LANGUAGE) if (re.test(text)) blocks.push(`official determination / you-qualify language (${re})`);
  if (hasSingleNumberPromise(text)) blocks.push("single-number financial promise (ranges only)");
  for (const re of LISTING_COPY_MARKERS) if (re.test(text)) blocks.push("source-listing proprietary content marker");
  return { ok: blocks.length === 0, blocks };
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
