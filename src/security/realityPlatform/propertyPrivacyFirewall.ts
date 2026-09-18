/**
 * REALITY-SEC-001 §3.4 — Property privacy firewall (ISOMORPHIC, pure).
 *
 * The OUTPUT-side enforcement of CONST-PROPERTY-PRIVACY-001 (the input-side
 * detectors + intake scrubber already exist). Scans any text bound for the
 * visitor and blocks owner/resident identity, deed/taxpayer names, protected-
 * class characterization, and good/bad/safe/diverse neighborhood proxies.
 * After a refusal, discovery CONTINUES where safe (the route handles the
 * redirect; this module only judges content).
 */

import { REFUSAL_LINE } from "@/lib/navigator/propertyPrivacyDoctrine";

export { REFUSAL_LINE };

export interface FirewallVerdict { ok: boolean; violations: string[] }

/** Owner/resident identity shapes in OUTPUT text (names attached to roles). */
const OUTPUT_IDENTITY = [
  /\b(?:owner|owned by|resident|occupant|taxpayer|deed holder|grantee|landlord)\s*(?:is|:)\s*[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+/,
  /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\s+(?:owns|lives at|resides at|holds title to|pays the taxes on)\b/,
  /\bname on the (?:deed|title)\s*(?:is|:)\s*\S/i,
  /\bwho lives here\b.{0,40}\b(?:is|are)\b/i,
];

/** Protected-class / steering characterization in OUTPUT text. */
const OUTPUT_STEERING = [
  /\b(?:white|black|african.?american|hispanic|latino|asian|jewish|muslim|christian)\s+(?:neighborhood|area|street|community|families|people)\b/i,
  /\bneighborhood\s+is\s+(?:good|bad|nice|decent|rough|sketchy|safe|dangerous|diverse)\b/i,
  /\bthis\s+(?:is|area is)\s+a\s+(?:good|bad|safe|dangerous|diverse|rough)\s+(?:neighborhood|area|part of town)\b/i,
  /\bdemographics?\s+(?:of|in)\s+(?:this|the)\s+(?:area|neighborhood)\s+(?:are|is|:)/i,
  /\bkind of people (?:who )?liv\w+ here\s+(?:are|is|:)/i,
];

export function firewallOutputText(text: string): FirewallVerdict {
  const violations: string[] = [];
  for (const re of OUTPUT_IDENTITY) if (re.test(text)) violations.push("owner/resident identity in output");
  for (const re of OUTPUT_STEERING) if (re.test(text)) violations.push("protected-class/steering characterization in output");
  return { ok: violations.length === 0, violations };
}
