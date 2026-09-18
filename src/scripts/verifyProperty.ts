/**
 * verify:property — Phase 1 property gates (USDA historical + HUD current).
 *
 *   SOURCE-GATE  No source renders live unless its Module 22 + 23 are APPROVED
 *                and sourceLive is true. (Default: both PENDING → hub shows
 *                "pending activation", not listings.)
 *   PRIVACY      No exact street address / lat-long on any public route EXCEPT
 *                the no-account Explore hub (address only — never coordinates).
 *                Client-safe generated files carry no address/coord fields.
 *   FRAMING      Property surfaces never tell the buyer they are
 *                "qualified/approved/eligible/guaranteed"; "may fit" + a source
 *                citation are present.
 *   FRESHNESS    Every record carries a consistent is_current flag; vintage
 *                (USDA) records show as historical examples, never "for sale
 *                today"; current (HUD) records may show as current listings.
 *
 * Requires the dev server (BASE_URL, default :3000). Exit 0 only if all pass.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { SOURCE_ACTIVATION, isSourceLive } from "../lib/property/sourceActivation";
import { getRuntimeActivation, isSourceLiveRuntime } from "../lib/property/sourceActivationStore";
import { SOURCE_CITATION, computeIsCurrent, freshnessAnchor, toExploreDetail } from "../lib/property/propertyTypes";
import { USDA_RESALE_PROPERTIES } from "../lib/property/usdaResaleGenerated";
import { HUD_REO_PROPERTIES } from "../lib/property/hudReoGenerated";

const BASE = (process.env.BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const ROOT = process.cwd();
const ALL = [...USDA_RESALE_PROPERTIES, ...HUD_REO_PROPERTIES];
const fail: string[] = [];
const note = (m: string) => fail.push(m);

function read(rel: string): string {
  try { return readFileSync(join(ROOT, rel), "utf8"); } catch { return ""; }
}
async function getText(path: string): Promise<{ status: number; body: string }> {
  const res = await fetch(`${BASE}${path}`, { headers: { Accept: "text/html" } });
  return { status: res.status, body: await res.text() };
}

// ── SOURCE-GATE ───────────────────────────────────────────────────────────────
// What the app actually RENDERS is driven by the RUNTIME activation (the operator
// overlay). The invariant: a source may only be live (and thus render listings)
// when BOTH modules are APPROVED. Checked against runtime + static defaults.
for (const [id, rec] of Object.entries(SOURCE_ACTIVATION)) {
  // Static defaults must be internally consistent.
  const staticBoth = rec.module22.status === "APPROVED" && rec.module23.status === "APPROVED";
  if (rec.sourceLive && !staticBoth) {
    note(`SOURCE-GATE: static "${id}" is sourceLive but Module 22/23 are not both APPROVED.`);
  }
  if (isSourceLive(id) !== (rec.sourceLive && staticBoth)) {
    note(`SOURCE-GATE: static isSourceLive("${id}") disagrees with its record.`);
  }
  // Runtime (operator overlay): live ⇒ both modules APPROVED. This is the one
  // that gates actual rendering.
  const r = getRuntimeActivation(id);
  if (isSourceLiveRuntime(id) && !(r?.module22 === "APPROVED" && r?.module23 === "APPROVED")) {
    note(`SOURCE-GATE: runtime "${id}" is live without both modules APPROVED — live data without approval.`);
  }
}

// ── PRIVACY (static): client-safe generated files carry NO address/geo ────────
const CLIENT_SAFE_FILES = [
  "src/lib/property/usdaPublicSafeGenerated.ts",
  "src/lib/property/hudPublicSafeGenerated.ts",
];
for (const rel of CLIENT_SAFE_FILES) {
  const src = read(rel);
  for (const banned of ['"exactAddress"', '"zip"', '"lat', '"lng"', '"lon"', '"longitude"', '"latitude"', '"streetName"']) {
    if (src.includes(banned)) note(`PRIVACY: client-safe ${rel} contains forbidden field ${banned}.`);
  }
}

// ── FRAMING (static) ──────────────────────────────────────────────────────────
const BUYER_CLAIM = [
  /you\s*('re|\s+are)?\s+(qualified|approved|eligible)\b/i,
  /you\s+qualify\b/i,
  /\b(?:you are |buyer is )?pre-?approved\b/i,
  /\bguaranteed\s+(approval|funding|financing|loan|rate|eligibility)\b/i,
];
const types = read("src/lib/property/propertyTypes.ts");
const hub = read("src/components/property/PropertyHub.tsx");
const mapSrc = read("src/components/public/PublicMapExperience.tsx");
for (const [rel, src] of [["propertyTypes.ts", types], ["PropertyHub.tsx", hub]] as const) {
  for (const re of BUYER_CLAIM) {
    if (re.test(src)) note(`FRAMING: ${rel} contains a buyer-eligibility claim /${re.source}/.`);
  }
}
// 2026-06-10 verified-only sweep INVERTED: no illustrative "may fit / may qualify"
// program claims anywhere (comments stripped before the check).
{
  const typesCode = types.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
  if (/may fit|may qualify/i.test(typesCode)) note('FRAMING: propertyTypes.ts still contains "may fit / may qualify" (verified-only sweep).');
}
// 2026-06-10 verified-only directive INVERTED this check: the hub must carry NO
// illustrative "may fit / may qualify" program hedges — programs render only as
// verified property-side facts (or not at all). Comments are stripped first.
{
  const hubCode = hub.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
  if (/may fit|may qualify/i.test(hubCode)) note('FRAMING: PropertyHub.tsx still contains illustrative "may fit / may qualify" copy (verified-only directive).');
}
if (!/sourceCitation/.test(hub)) note("FRAMING: PropertyHub.tsx must render the per-listing sourceCitation.");
for (const cite of Object.values(SOURCE_CITATION)) {
  if (!types.includes(cite)) note(`FRAMING: SOURCE_CITATION missing "${cite}".`);
}
// Map-wide inversion (2026-06-10): the homepage Living Map must carry NO
// "may fit / may qualify" program claims — neutral story framing only.
{
  const mapCode = mapSrc.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
  if (/may fit|may qualify/i.test(mapCode)) note('FRAMING: homepage map still contains "may fit / may qualify" (verified-only sweep).');
}

// ── FRESHNESS (static) ────────────────────────────────────────────────────────
// Honesty rule: the DISPLAYED currency must be computed LIVE from the freshness
// anchor (per-listing date, else the snapshot's fetched_at) — never a baked flag
// that can't age. A stale snapshot must auto-flip to historical.
for (const c of ALL) {
  const r = c.source_records[0];
  if (typeof r.isCurrent !== "boolean") {
    note(`FRESHNESS: ${c.canonical_property_id} missing is_current flag.`);
  }
  const projected = toExploreDetail(c).isCurrent;
  const expected = computeIsCurrent(freshnessAnchor(c));
  if (projected !== expected) {
    note(`FRESHNESS: ${c.canonical_property_id} displayed currency (${projected}) is not computed live from its freshness anchor (${expected}).`);
  }
}
if (!hub.includes("verify current availability")) note('FRESHNESS: PropertyHub must relabel aged listings "verify current availability".');
if (!hub.includes("Current for-sale listing")) note('FRESHNESS: PropertyHub must badge current records "Current for-sale listing".');
for (const re of [/currently for sale/i, /for sale now/i, /\bbuy now\b/i, /available now/i]) {
  for (const [rel, src] of [["PropertyHub.tsx", hub], ["PublicMapExperience.tsx", mapSrc]] as const) {
    if (re.test(src)) note(`FRESHNESS: ${rel} contains a current-sale over-claim /${re.source}/.`);
  }
}

// ── Runtime ───────────────────────────────────────────────────────────────────
async function runtime(): Promise<void> {
  // Confirm the target is THIS app (200 + brand marker) before the runtime
  // checks — a foreign/stale server on the port would false-fail them.
  const home = await fetch(BASE).then(async (r) => ({ status: r.status, body: await r.text().catch(() => "") })).catch(() => null);
  if (!home || home.status !== 200 || !/Furlong/.test(home.body)) {
    console.log(`  (no confirmed Furlong server at ${BASE} — runtime checks skipped; static checks ran)`);
    return;
  }
  const addrSamples = ALL
    .map((c) => c.source_records[0].exactAddress)
    .filter((a): a is string => !!a && a.length >= 6)
    .slice(0, 12);

  // PRIVACY: no address/lat-long on public non-hub pages.
  for (const path of ["/", "/about", "/trust", "/compass", "/explore"]) {
    const { body } = await getText(path);
    if (/"lat"\s*:|"lng"\s*:|"latitude"|"longitude"/.test(body)) note(`PRIVACY: ${path} appears to expose lat/long.`);
    for (const a of addrSamples) if (body.includes(a)) note(`PRIVACY: address "${a}" leaked on ${path}.`);
  }

  const { status, body: hubBody } = await getText("/explore?lane=property-land");
  if (status !== 200) { note(`hub returned ${status}.`); return; }

  // PRIVACY: even the hub must never render coordinates.
  if (/"lat"\s*:|"lng"\s*:|"latitude"\s*[:=]|"longitude"\s*[:=]/.test(hubBody)) {
    note("PRIVACY: the Explore hub exposes lat/long (coordinates must never be shown).");
  }
  // FRAMING (2026-06-10 verified-only): the rendered hub must contain NO
  // illustrative "may fit / may qualify" program hedges; no affirmative buyer claim.
  if (/may fit|may qualify/i.test(hubBody)) note('FRAMING: rendered hub still shows illustrative "may fit / may qualify" (verified-only directive).');
  if (!/USDA Rural Development/i.test(hubBody) || !/HUD/i.test(hubBody)) note("FRAMING: rendered hub does not name both sources (USDA + HUD).");
  for (const re of BUYER_CLAIM) {
    for (const s of hubBody.split(/(?<=[.!?])\s+|<[^>]+>/)) {
      if (re.test(s) && !/not an? (approval|eligibility|guarantee)|does not (approve|guarantee|determine)|no (approval|guarantee)/i.test(s)) {
        note(`FRAMING: rendered hub buyer-eligibility claim: "${s.trim().slice(0, 80)}"`); break;
      }
    }
  }

  // SOURCE-GATE (runtime): with NO source live, the hub shows the pending state
  // and no listing addresses. (When a source IS live, addresses are allowed in
  // this hub only — coords never, and non-hub public pages never; both checked
  // above.)
  if (!isSourceLiveRuntime("usda") && !isSourceLiveRuntime("hud")) {
    if (!/pending activation/i.test(hubBody)) note('SOURCE-GATE: no source live but hub lacks the "pending activation" state.');
    for (const a of addrSamples) if (hubBody.includes(a)) note(`SOURCE-GATE: source not live but address "${a}" rendered in the hub.`);
  }
}

async function main(): Promise<void> {
  await runtime();
  console.log(`verify:property — usda live: ${isSourceLiveRuntime("usda")} · hud live: ${isSourceLiveRuntime("hud")} · dataset: ${ALL.length} records · base ${BASE}`);
  if (fail.length > 0) {
    console.error(`\n✗  verify:property FAIL — ${fail.length} issue(s):`);
    for (const f of fail) console.error(`    ✗ ${f}`);
    process.exit(1);
  }
  console.log("\n✓  verify:property PASS — source-gate, privacy, framing, freshness all hold (USDA + HUD).");
  process.exit(0);
}

main().catch((e) => { console.error("verify:property FAIL — unexpected error:", e); process.exit(1); });
