/**
 * verify:place-fact-claims — proves the Opportunity Zone place-fact surface
 * renders FACTS, never eligibility.
 *
 * Two checks:
 *   1. CLAIMS POLICY — every rendered string (card copy for designated +
 *      not-designated, plus the page header/footer copy) passes
 *      evaluateContentClaims with ZERO BLOCK findings.
 *   2. BANNED WORDS — a direct grep for eligibility/approval words on the
 *      surface copy ("qualify", "approved", "guaranteed", "eligible", ...).
 *      A place-fact may say a place IS designated; it may NOT say a person
 *      qualifies / is approved / is guaranteed a benefit.
 *
 * The word grep deliberately EXEMPTS the explicit disclaimers (which contain
 * "not eligibility", "not ... guaranteed") — those are the honest framing, not
 * a violation. We only flag AFFIRMATIVE eligibility claims.
 */

import { evaluateContentClaims } from "@/lib/governance/contentClaimsPolicy";
import { OZ_PLACE_FACTS } from "@/lib/place-facts/opportunityZoneSnapshot";
import {
  OZ_BADGE_LABEL,
  OZ_BADGE_DISCLAIMER,
  OZ_BADGE_SOURCE_CITATION,
} from "@/lib/place-facts/opportunityZoneBadge";
import {
  HUBZONE_BADGE_DISCLAIMER,
  HUBZONE_BADGE_SOURCE_CITATION,
  hubzoneBadgeProps,
} from "@/lib/place-facts/hubzoneBadge";
import { HUBZONE_PLACE_FACTS } from "@/lib/place-facts/hubzoneSnapshot";

// Reconstruct the exact user-visible strings the card + page render.
function cardCopy(designated: boolean, rural: boolean): string[] {
  if (designated) {
    return [
      "Designated Opportunity Zone tract",
      `This location is in a census tract designated as a Qualified Opportunity Zone under IRC §1400Z-1${rural ? ", flagged rural by HUD" : ""}. This is a published government designation of the place — it is not eligibility, qualification, or a guaranteed tax benefit for any person.`,
      "Source: HUD GIS / Treasury (IRC §1400Z-1) + U.S. Census geocoder · public domain",
    ];
  }
  return [
    "Not in a designated Opportunity Zone tract",
    "which is not on the designated Qualified Opportunity Zone list (IRC §1400Z-1). This states only what the published government boundary says about the place.",
  ];
}

const PAGE_COPY = [
  "Place-facts — public government reference",
  "Opportunity Zone designations",
  "Whether a location's census tract is a designated Qualified Opportunity Zone under IRC §1400Z-1 — a published government fact about the place. This is not eligibility, qualification, approval, or a guaranteed tax benefit for any person; whether a buyer benefits is a separate question.",
  "Designation data is a dated snapshot resolved through the U.S. Census geocoder and the HUD GIS Opportunity Zones layer (IRC §1400Z-1). Request-time live lookups are pending operator activation review (Module 22/23). Place-facts describe places, not people.",
];

// The PUBLIC property-card badge strings (strictest surface) — imported from the
// real framing module so this test tracks exactly what renders publicly.
const PUBLIC_BADGE_COPY = [
  `${OZ_BADGE_LABEL} · as of 2026-06-09 · subject to change`,
  OZ_BADGE_DISCLAIMER,
  OZ_BADGE_SOURCE_CITATION,
  "What this means",
];

// HUBZone rendered strings — internal card copy (current / expired / not) plus
// the reusable badge framing (current + expired), built from the real modules.
const HUBZONE_COPY: string[] = [
  HUBZONE_BADGE_DISCLAIMER,
  HUBZONE_BADGE_SOURCE_CITATION,
  "This location is in a designated HUBZone. " + HUBZONE_BADGE_DISCLAIMER,
  "This location's HUBZone designation has expired (historical). " + HUBZONE_BADGE_DISCLAIMER,
  // Internal card copy for each snapshot fact (current, expired, not-designated).
  "This location is in McDowell County, WV — a designated Qualified Census Tract HUBZone (effective 2023-07-01). This is a place-fact about the location — it is not eligibility, certification, or a guarantee for any business. HUBZone certification depends on a business meeting SBA criteria.",
  "This location is in El Paso County, CO — a Governor-Designated Census Tract whose HUBZone designation was effective 2022-02-09 and expired 2024-02-09. It is shown as historical / expired — verify current status with SBA. This is a place-fact about the location — not eligibility, certification, or a guarantee for any business.",
  "This location is not in any designated SBA HUBZone per the published designation layer. This states only what the government boundary says about the place.",
];

// Pull the actual badge labels/props for the designated HUBZone facts.
const HUBZONE_BADGE_LABELS = HUBZONE_PLACE_FACTS.filter((f) => f.designated).map((f) => {
  const p = hubzoneBadgeProps({
    hubzoneType: f.hubzoneType ?? "",
    effective: f.effective ?? "",
    expiration: f.expiration,
    isCurrent: !f.expiration || f.expiration >= "2026-06-09",
    area: f.area,
    geoid: f.geoid,
  });
  return p.label;
});

const allStrings = [
  ...PAGE_COPY,
  ...cardCopy(true, false),
  ...cardCopy(true, true),
  ...cardCopy(false, false),
  ...PUBLIC_BADGE_COPY,
  ...HUBZONE_COPY,
  ...HUBZONE_BADGE_LABELS,
];

const fail: string[] = [];

// ── Check 1: content-claims policy (zero BLOCK findings) ──────────────────────
for (const text of allStrings) {
  const result = evaluateContentClaims(text);
  if (result.blockCount > 0) {
    const codes = result.findings
      .filter((f) => f.severity === "BLOCK")
      .map((f) => `${f.code} ("${f.matchedText}")`)
      .join(", ");
    fail.push(`CLAIMS BLOCK in: "${text.slice(0, 70)}…" → ${codes}`);
  }
}

// ── Check 2: affirmative eligibility-word grep ────────────────────────────────
// A place-fact may NOT affirmatively claim a person qualifies / is approved /
// eligible / guaranteed. We flag these words ONLY when not immediately negated
// (the disclaimers "not eligibility", "not ... guaranteed" are the honest frame).
const BANNED = [
  /\byou\s+qualify\b/i,
  /\byou(?:'re| are)\s+(?:approved|eligible)\b/i,
  /\bpre[-\s]?approved\b/i,
  /\bguaranteed\s+(?:tax\s+)?(?:benefit|savings|approval|acceptance)\b/i,
  /\beligible\s+for\s+(?:funding|financing|credit|tax)\b/i,
  /\bqualifies?\s+for\s+(?:funding|financing|credit|a\s+tax)\b/i,
];
function negated(text: string, idx: number): boolean {
  // Match the content-claims policy's negation window (~220 chars): a place-fact
  // disclaimer like "it is NOT eligibility, qualification, or a guaranteed tax
  // benefit" negates the trailing word even across a short list. We require the
  // negation to be in the SAME sentence (no terminal punctuation in between).
  const prefix = text.slice(Math.max(0, idx - 220), idx);
  return /\b(?:not|no|never|isn't|aren't|without|separate)\b[^.!?]*$/i.test(prefix);
}
for (const text of allStrings) {
  for (const re of BANNED) {
    const g = new RegExp(re.source, re.flags.includes("g") ? re.flags : `${re.flags}g`);
    let m: RegExpExecArray | null;
    while ((m = g.exec(text))) {
      if (!negated(text, m.index)) {
        fail.push(`BANNED WORD "${m[0]}" (affirmative) in: "${text.slice(0, 70)}…"`);
      }
    }
  }
}

console.log(
  `verify:place-fact-claims — checked ${allStrings.length} rendered strings across ${OZ_PLACE_FACTS.length} place-facts.`,
);
if (fail.length) {
  console.error(`\n✗  verify:place-fact-claims FAIL — ${fail.length} issue(s):`);
  for (const f of fail) console.error(`    ✗ ${f}`);
  process.exit(1);
}
console.log(
  "\n✓  verify:place-fact-claims PASS — every rendered string clears the content-claims policy (0 BLOCK) and carries no affirmative eligibility/approval/guarantee language. The surface states place-facts, not buyer eligibility.",
);
process.exit(0);
