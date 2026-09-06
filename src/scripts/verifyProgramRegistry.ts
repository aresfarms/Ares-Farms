/**
 * verify:program-registry — registry validation + locked-language honesty +
 * engine behavior + ledger event, AND writes the reviewable catalog deliverable
 * (docs/program-registry-catalog-<date>.md) for the owner/reviewer queue to mark
 * free/paid. Free-vs-paywall is decided AFTER that review — this gate FAILS if
 * any entry ships with paywall_candidate already set.
 */

import * as fs from "node:fs";
import * as path from "node:path";

import { PROGRAM_REGISTRY, validateProgramRegistry } from "@/lib/capital-graph/programRegistry";
import {
  verifyPropertyPrograms,
  readVerificationLedger,
  PERSON_SIDE_CAVEAT,
} from "@/lib/capital-graph/programVerification";
import { evaluateContentClaims } from "@/lib/governance/contentClaimsPolicy";

const fail: string[] = [];
const ok = (c: boolean, m: string) => { if (!c) fail.push(m); };

// ── 1. Registry validation ────────────────────────────────────────────────────
for (const e of validateProgramRegistry()) fail.push(`REGISTRY: ${e}`);

// ── 2. Engine behavior: positive → verified; absent/uncertain/expired → omitted ─
const now = new Date("2026-06-10T12:00:00Z");
const pos = verifyPropertyPrograms(
  { propertyId: "verify-pos", ozTractId: "34013010000", ozAsOf: "2026-06-10",
    hubzone: { hubzoneType: "Qualified Census Tract", geoid: "54047954503", effective: "2023-07-01", expiration: null, isCurrent: true },
    hubzoneAsOf: "2026-06-10" }, now);
ok(pos.some((m) => m.program_id === "fed-oz"), "positive OZ determination must verify");
ok(pos.some((m) => m.program_id === "fed-hubzone"), "current HUBZone determination must verify");

const none = verifyPropertyPrograms({ propertyId: "verify-none" }, now);
ok(none.length === 0, "no determinations → ZERO verified matches (omitted, never conditional)");

const uncertain = verifyPropertyPrograms({ propertyId: "verify-uncertain", ozTractId: "not-a-tract" }, now);
ok(uncertain.length === 0, "uncertain/garbage determination → omitted");

const expired = verifyPropertyPrograms(
  { propertyId: "verify-expired",
    hubzone: { hubzoneType: "Governor-Designated Census Tract", geoid: "08041003910", effective: "2022-02-09", expiration: "2024-02-09", isCurrent: false } }, now);
ok(expired.length === 0, "EXPIRED HUBZone designation must NOT verify");

// ── 3. Locked language honesty: claims policy + banned person-eligibility words ─
const rendered = pos.flatMap((m) => [m.verifiedStatement, m.basis, m.personSideCaveat]);
for (const text of rendered) {
  const r = evaluateContentClaims(text);
  if (r.blockCount > 0) fail.push(`CLAIMS BLOCK: "${text.slice(0, 60)}…" → ${r.findings.filter(f=>f.severity==="BLOCK").map(f=>f.code).join(",")}`);
}
const banned = [/\byou\s+qualify\b/i, /\byou(?:'re| are)\s+(?:eligible|approved)\b/i, /\bguaranteed\b/i, /\bpre-?approved\b/i];
for (const text of rendered) {
  for (const re of banned) {
    const m = re.exec(text);
    if (m && !/\b(?:not|whether|depends)\b/i.test(text.slice(Math.max(0, (m.index ?? 0) - 60), m.index))) {
      fail.push(`BANNED: "${m[0]}" in "${text.slice(0, 70)}…"`);
    }
  }
}
ok(pos.every((m) => m.personSideCaveat === PERSON_SIDE_CAVEAT), "person-side caveat must accompany every verified match");
ok(rendered.some((t) => t.includes("Verified against current program rules (as of")), "locked-standard opening must render verbatim");

// ── 4. Ledger: each run appended an event ─────────────────────────────────────
const events = readVerificationLedger(10) as Array<{ propertyId?: string }>;
ok(events.some((e) => e.propertyId === "verify-pos"), "verification run must write an audit-ledger event");

// ── 5. Catalog deliverable (the "see everything" output) ──────────────────────
const date = "2026-06-10";
const lines: string[] = [
  `# Program Registry Catalog — ${date}`,
  ``,
  `Reviewable inventory for the owner/reviewer queue. Mark each program FREE or PAID in the`,
  `"Free/Paid (decide)" column — \`paywall_candidate\` stays null in code until that`,
  `review lands. "Property-verifiable" = every property-side criterion machine-checkable`,
  `against a wired, cited dataset → can render a VERIFIED match (locked language).`,
  ``,
  `| # | Program | Level | Tranche | Administering body | Property-verifiable? | Status | Dataset wired? | Free/Paid (decide) |`,
  `|---|---------|-------|---------|--------------------|---------------------|--------|----------------|--------------------|`,
];
PROGRAM_REGISTRY.forEach((e, i) => {
  const wired = e.property_side_criteria.some((c) => c.verifiable);
  lines.push(
    `| ${i + 1} | ${e.name} | ${e.level} | ${e.tranche} | ${e.administering_body} | ${e.status === "property-verifiable" ? "YES" : e.property_side_criteria.length ? "partial/not yet" : "no (person-only)"} | ${e.status} | ${wired ? "yes" : "no"} | _____ |`,
  );
});
lines.push(
  ``,
  `## Research pending (honest gaps)`,
  `- **Tranche B (state):** 50-state research NOT yet performed — one template row stands in.`,
  `- **Tranche C (grants/philanthropic):** research NOT yet performed — mostly person-only.`,
  `- Cataloged federal programs (USDA-rural, NMTC, FEMA, historic) need their datasets WIRED before promotion to property-verifiable.`,
  ``,
  `Locked language (renders verbatim on every verified match):`,
  `> "Verified against current program rules (as of [date]): this property meets the property/location criteria for [X]. ${PERSON_SIDE_CAVEAT}"`,
);
const outPath = path.join(process.cwd(), "docs", `program-registry-catalog-${date}.md`);
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, lines.join("\n") + "\n", "utf8");

// ── Report ────────────────────────────────────────────────────────────────────
console.log(`verify:program-registry — ${PROGRAM_REGISTRY.length} programs cataloged · ${PROGRAM_REGISTRY.filter((e)=>e.status==="property-verifiable").length} property-verifiable (wired) · catalog → ${path.relative(process.cwd(), outPath)}`);
console.log(`  sample verified statement: ${pos[0]?.verifiedStatement}`);
if (fail.length) {
  console.error(`\n✗  FAIL — ${fail.length} issue(s):`);
  for (const f of fail) console.error(`    ✗ ${f}`);
  process.exit(1);
}
console.log("\n✓  verify:program-registry PASS — registry valid; engine renders only positive verified determinations (none/uncertain/expired omitted); locked language verbatim with person-side caveat; ledger event per run; paywall undecided on every entry.");
process.exit(0);
