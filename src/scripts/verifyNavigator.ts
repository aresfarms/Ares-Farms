/**
 * verify:navigator — Furlong Navigator + CONST-PROPERTY-PRIVACY-001 gates
 * (spec 2026-06-11 §7 + §10, addendum §10). Pure/structural always; live SSR +
 * conversation probes when the dev server is reachable.
 */

import * as fs from "node:fs";

import {
  isOwnershipProbe, isSteeringProbe, isHopaDesignationAsk, classifyRefusal, REFUSAL_LINE, PROPERTY_PRIVACY_CONTROLS,
} from "@/lib/navigator/propertyPrivacyDoctrine";
import { scrubPropertyRecord, assertNoBannedFields } from "@/lib/navigator/intakeScrubber";
import { resolveListingInput } from "@/lib/navigator/listingIntake";
import { assessPathways, discoveryGraphChain, EMPTY_CONTEXT } from "@/lib/navigator/possibilityCheck";
import { interpretMessage, detectPropertyIntent, FRESH_JOURNEY, GUIDED_DISCOVERY_OPENER } from "@/lib/navigator/narrativeInterpreter";
import { FURLONG_NAVIGATOR_MANIFEST } from "@/lib/navigator/furlongNavigatorManifest";
import { deriveDecisionSummary, PATHWAYS_NOT_PROMISES } from "@/lib/navigator/decisionFramework";

const fail: string[] = [];
const ok = (c: boolean, m: string) => { if (!c) fail.push(m); };

// ── G-1: ownership probes — 12+ phrasings must ALL be caught ─────────────────
const OWNERSHIP_PROBES = [
  "who owns 123 Main St?",
  "who is the owner of this property",
  "what's the owner's name",
  "who lives at this address",
  "who resides there",
  "whose name is on the deed",
  "who's on the title",
  "who pays the property taxes on this place",
  "who is registered at this address",
  "who holds title to the parcel",
  "can you do an owner lookup",
  "find out the owner for me",
  "whose house is this",
  "how do I contact the owner directly",
  "tell me who bought this last year",
];
for (const p of OWNERSHIP_PROBES) ok(isOwnershipProbe(p), `ownership probe must be caught: "${p}"`);
// legitimate pursue/buy asks must NOT be refused (don't overreach)
for (const p of ["how do I buy this property", "how do I pursue this listing", "who is the listing broker"])
  ok(!isOwnershipProbe(p), `legitimate ask must NOT trip ownership refusal: "${p}"`);

// ── G-2: steering probes — explicit + proxy, 10+ phrasings ───────────────────
const STEERING_PROBES = [
  "is this a good neighborhood?",
  "is the area safe?",
  "how safe is this street",
  "what's the crime rate around here",
  "what kind of people live there",
  "is it diverse?",
  "what's the racial makeup of the neighborhood",
  "demographics of the area please",
  "is this a white neighborhood",
  "are there a lot of immigrants in this area",
  "is that a rough part of town",
  "what's the diversity of the area like",
];
for (const p of STEERING_PROBES) ok(isSteeringProbe(p), `steering probe must be caught: "${p}"`);
// HOPA designation asks must pass (designation in, profiling out)
for (const p of ["is this a 55+ community?", "is it age-restricted senior housing", "does HOPA apply here"]) {
  ok(isHopaDesignationAsk(p), `HOPA designation ask recognized: "${p}"`);
  ok(!isSteeringProbe(p), `HOPA ask must NOT be refused: "${p}"`);
}
ok(!isSteeringProbe("what can I do with this property"), "core possibility ask never refused");
// one consistent line; never hints the data exists
ok(/not something Furlong can answer here/.test(REFUSAL_LINE) && /what this property can do/.test(REFUSAL_LINE), "the locked refusal line is intact");
ok(!/we (?:have|hold|keep|know)/i.test(REFUSAL_LINE) && !/database|record/i.test(REFUSAL_LINE), "refusal must not hint the data exists");
ok(classifyRefusal("who owns this") === "ownership" && classifyRefusal("is it safe") === "steering", "classifier routes both kinds");
ok(PROPERTY_PRIVACY_CONTROLS.length === 9, "doctrine lists its 9 mandatory controls");

// ── Architectural lock: intake scrubber (data layer, not UI) ─────────────────
const dirty = {
  parcel: "12-345-678",
  address: "123 Main St",
  owner_name: "SHOULD BE GONE",
  ownerMailingAddress: "GONE",
  taxpayer_id: "GONE",
  assessor: { deed_holder: "GONE", grantee: "GONE", land_value: 50000 },
  area: { race_pct_white: 0.5, ethnicity_distribution: {}, religion_majority: "GONE", sex_ratio: 1, familial_status_pct: 0.3, disability_pct: 0.1, median_income: 52000 },
  senior_community_55_plus: true,
};
const { scrubbed, report } = scrubPropertyRecord(dirty);
ok(report.removedOwnerFields.length >= 4, `owner fields stripped at intake (got ${report.removedOwnerFields.length})`);
ok(report.removedDemographicFields.length >= 5, `demographic fields stripped at intake (got ${report.removedDemographicFields.length})`);
ok(assertNoBannedFields(scrubbed).ok, "post-scrub record has NO banned fields (data layer)");
ok(!assertNoBannedFields(dirty).ok, "pre-scrub record would FAIL the data-layer check (the lock is load-bearing)");
ok((scrubbed as Record<string, unknown>).senior_community_55_plus === true, "HOPA 55+ designation SURVIVES the scrub (designation in, profiling out)");
ok(JSON.stringify(scrubbed).includes("52000") && !JSON.stringify(scrubbed).includes("GONE"), "economic fields kept; identity values gone");

// ── G-4: listing-link input — parsed, never fetched ──────────────────────────
const z = resolveListingInput("https://www.zillow.com/homedetails/123-Main-St-Beckley-WV-25801/12345_zpid/");
ok(!!z && z.source === "zillow" && /123 Main St Beckley WV/i.test(z.addressText) && z.state === "WV" && z.parcelId === null, `zillow URL → address text (got ${JSON.stringify(z)})`);
const c = resolveListingInput("https://www.crexi.com/properties/2400-Industrial-Ave-Toledo-OH");
ok(!!c && c.source === "crexi" && /Industrial Ave Toledo OH/i.test(c!.addressText), "crexi URL → address text");
ok(resolveListingInput("456 Oak Street, Austin TX")?.source === "plain-address", "plain address accepted");
ok(resolveListingInput("hello there") === null, "non-address text → null (conversation asks)");
const intakeSrc = fs.readFileSync("src/lib/navigator/listingIntake.ts", "utf8");
ok(!/\bfetch\s*\(|axios|http\.get|XMLHttpRequest/.test(intakeSrc.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "")), "listing intake makes NO network call (lawful seam — never scrapes the source)");

// ── Three-answer engine + confidence + why-shown + matrix ────────────────────
const farm = assessPathways({ ...EMPTY_CONTEXT, propertyKind: "farm", acreage: 120, inHoa: false });
const cropRent = farm.find((p) => p.id === "cropland-rent")!;
ok(cropRent.answer === "YES" && cropRent.confirmWith.length > 0, "farm: cropland rental is a YES with confirm-with");
ok(farm.find((p) => p.id === "sell-vs-hold")?.answer === "CANT_DETERMINE", "sell-vs-hold honestly CAN'T-DETERMINE until prediction layer verified");

const resNoPool = assessPathways({ ...EMPTY_CONTEXT, propertyKind: "residential", hasPool: false, inHoa: false });
const pool = resNoPool.find((p) => p.id === "pool-rental")!;
ok(pool.answer === "NO" && !!pool.reroute && pool.reroute.length > 10, "no pool → NO with the honest reroute");

const hoaUnknown = assessPathways({ ...EMPTY_CONTEXT, propertyKind: "residential", hasPool: true });
const hoaPool = hoaUnknown.find((p) => p.id === "pool-rental")!;
ok(hoaPool.answer === "CANT_DETERMINE" && /HOA/.test(hoaPool.detail) && hoaPool.confirmWith.some((x) => /HOA/.test(x)), "unknown HOA → CAN'T-DETERMINE with confirm-with-HOA");

const tiny = assessPathways({ ...EMPTY_CONTEXT, propertyKind: "residential", acreage: 0.2, inHoa: false });
ok(tiny.find((p) => p.id === "micro-campground")?.answer === "NO", "0.2 acres → micro-campground NO");

for (const p of [...farm, ...resNoPool]) {
  ok(["high", "medium", "low", "cant-determine"].includes(p.confidence), `${p.id}: confidence present`);
  ok(/We (?:showed|checked) this because/.test(p.whyShown), `${p.id}: why-shown is evidence-linked ("We showed this because…")`);
  ok(!!p.effort && !!p.risk && !!p.timeToStart && !!p.evidenceStrength, `${p.id}: effort/risk/time/evidence matrix present`);
  if (p.profitability) {
    ok(p.profitability.low < p.profitability.high && !!p.profitability.basis && !!p.profitability.lastVerified && !!p.profitability.framing,
      `${p.id}: any number is a RANGE with basis + last-verified + in-line framing`);
  } else {
    ok(!!p.profitabilityNote && /pending|confirm/i.test(p.profitabilityNote), `${p.id}: no fabricated band — honest market-pending note`);
  }
}

// ── Discovery graph — at least one connected chain ────────────────────────────
const chain = discoveryGraphChain("pool-rental");
ok(chain.length >= 5 && chain[0] === "pool-rental", `discovery graph chain connects ≥5 pathways (got ${chain.join(" → ")})`);

// ── Narrative interpreter — own words, no enum ───────────────────────────────
let j = interpretMessage(FRESH_JOURNEY, "I'm a third-generation farmer with about 120 acres in West Virginia");
ok(j.context.propertyKind === "farm" && j.context.acreage === 120, "free text → farm + 120 acres extracted");
j = interpretMessage(j, "honestly I don't know what's possible, guide me");
ok(j.entryMode === "open-discovery" || j.entryMode === "own-asset", "entry mode detected from their words");
const j2 = interpretMessage(FRESH_JOURNEY, "I live at 123 Main St, Beckley WV — what can I do with it?");
ok(j2.property !== null && j2.entryMode === "own-asset", "address in free text → Assets node entry (mode 2)");

// ── Guided Property Discovery routing (loop fix 2026-06-11) ──────────────────
// "no property / help me find one" must engage guided discovery — NEVER bounce
// back to the asset prompt. Discovery requires no address to begin.
for (const [msg, want] of [
  ["no specific property can you help me find one?", "WANTS_PROPERTY_DISCOVERY"],
  ["I don't own anything yet", "NO_PROPERTY_YET"],
  ["I want a property that can make money", "WANTS_PROPERTY_DISCOVERY"],
  ["help me find a property", "WANTS_PROPERTY_DISCOVERY"],
  ["I don't have a property yet", "NO_PROPERTY_YET"],
  ["show me what might fit", "WANTS_PROPERTY_DISCOVERY"],
  ["no idea", "NO_PROPERTY_YET"],
] as const) {
  ok(detectPropertyIntent(msg, null) === want, `intent("${msg}") = ${want} (got ${detectPropertyIntent(msg, null)})`);
}
{
  let gj = interpretMessage(FRESH_JOURNEY, "I'm hoping to build some income");
  gj = interpretMessage(gj, "no specific property can you help me find one?");
  ok(gj.guidedDiscovery === true && gj.intent === "WANTS_PROPERTY_DISCOVERY", "no-property ask engages guided discovery");
  ok(["assets", "constraints", "pathways"].includes(gj.node), "guided discovery satisfies the assets node without an address");
  // interest answer narrows kind + reaches pathways
  gj = interpretMessage(gj, "farming income mostly");
  ok(gj.context.propertyKind === "farm", "guided-discovery interest answer narrows the property kind");
  ok(gj.node === "pathways" || gj.node === "constraints", `arc keeps advancing in guided discovery (at ${gj.node})`);
  ok(/without using demographics or neighborhood profiling/.test(GUIDED_DISCOVERY_OPENER), "guided-discovery opener states the non-demographic rule");
}

// ── SESSION PRIVACY — ephemeral by default (critical fix 2026-06-11) ─────────
import("@/lib/navigator/navigatorSessionPrivacy").then((SP) => {
  // protected-class disclosures detected + redacted from any stored copy
  for (const t of ["I am a gay man looking for my utopia", "my religion matters to me here", "I'm disabled and need ground floor"])
    ok(SP.containsProtectedClassDisclosure(t), `protected-class disclosure detected: "${t}"`);
  ok(!SP.containsProtectedClassDisclosure("I'm a farmer with 120 acres"), "ordinary input not flagged");
  const red = SP.redactForStorage([
    { role: "you", text: "I am a gay man looking for my utopia" },
    { role: "you", text: "I want farm income" },
    { role: "guide", text: "Tell me more" },
  ]);
  ok(red[0].text === SP.REDACTED_PLACEHOLDER && red[1].text === "I want farm income",
    "stored copies redact protected-class disclosures, keep ordinary text");
  ok(/private detail not saved/.test(SP.REDACTED_PLACEHOLDER), "redaction placeholder is honest");
  ok(/Continue this anonymous journey on this device\?/.test(SP.OPT_IN_PROMPT), "the explicit opt-in prompt is spec-locked");
}).catch((e) => { fail.push("privacy module import failed: " + e); });

// Structural: the privacy module is the ONLY browser-storage writer; no auto-
// resume; old key purged; Start Over + opt-in gate + save-journey controls exist.
{
  const navSrc = fs.readFileSync("src/components/navigator/FurlongNavigator.tsx", "utf8");
  ok(!/sessionStorage\.setItem|localStorage\.setItem/.test(navSrc), "component writes NO browser storage directly (privacy module only)");
  ok(!/Welcome back/.test(navSrc), "auto-resume 'Welcome back' REMOVED");
  ok(/loadJourneyIfOptedIn/.test(navSrc) && /saveJourneyIfOptedIn/.test(navSrc), "persistence goes through the opt-in-gated privacy module");
  ok(/data-testid="start-over"/.test(navSrc), "Start Over / Clear journey control present");
  ok(/data-testid="continuity-opt-in"/.test(navSrc) && /data-testid="resume-gate"/.test(navSrc), "explicit continuity opt-in + resume gate present");
  ok(/data-testid="save-journey"/.test(navSrc) && /Continue without saving|stays anonymous/.test(navSrc), "Save this journey control + anonymous-default copy present");
  const spSrc = fs.readFileSync("src/lib/navigator/navigatorSessionPrivacy.ts", "utf8");
  ok(/if \(!isContinuityOptedIn\(\)\) return/.test(spSrc), "privacy module: default path writes NOTHING");
  ok(/LEGACY_KEY/.test(spSrc) && /furlong-navigator-journey-v1/.test(spSrc), "legacy v1 key actively purged");
  const sjSrc = fs.readFileSync("src/lib/navigator/savedJourneyContract.ts", "utf8");
  ok(/SAVED_JOURNEYS_LIVE = false/.test(sjSrc) && /ONLY after consent/.test(sjSrc), "saved-journey accounts contract gated OFF; consent-first attach rule stated");
  ok(/PERSISTENT_JOURNEY_STORAGE_REQUIRES_AUTH = true/.test(sjSrc), "durable-storage gate: PERSISTENT_JOURNEY_STORAGE_REQUIRES_AUTH=true");
  ok(!/localStorage\.setItem\(\s*(JOURNEY_KEY|OPT_IN_KEY)/.test(spSrc) && /window\.sessionStorage/.test(spSrc), "opt-in continuity stays in sessionStorage (no durable journey writes)");
}

// ── Naming + CTA + no-chip structural gates ───────────────────────────────────
ok(FURLONG_NAVIGATOR_MANIFEST.name === "Furlong Navigator", "manifest names the Navigator");
const pubFiles = [
  "src/app/(public)/page.tsx",
  "src/app/(public)/discover/page.tsx",
  "src/components/navigator/FurlongNavigator.tsx",
];
for (const f of pubFiles) ok(!/AI questionnaire/i.test(fs.readFileSync(f, "utf8")), `${f}: public copy never says "AI questionnaire"`);

const home = fs.readFileSync("src/app/(public)/page.tsx", "utf8");
// Hero CTA restructure Option A (2026-06-11): labels explain themselves.
ok(/cta-navigator/.test(home) && /Talk to Furlong Navigator/.test(home) && home.includes('href="/navigator"'),
  "hero primary CTA = Talk to Furlong Navigator → /navigator");
ok(/Tell us what you're looking for and we'll help uncover pathways/.test(home), "primary CTA carries its supporting line");
ok(/cta-explore-map/.test(home) && /Explore America's Possibilities/.test(home) && home.includes('href="#americas-possibilities"'),
  "hero secondary CTA = Explore America's Possibilities → map section anchor");
ok(/Browse the map, hidden-gem stories, and pathway examples/.test(home), "secondary CTA carries its supporting line");
ok(home.includes('id="americas-possibilities"'), "the map section carries the scroll-target anchor");
ok(!/cta-start-journey|cta-possibilities-map|home-discovery-cta/.test(home), "old CTA labels/testids removed");
// Hero copy revision + new-visitor understanding (property NOT required).
const heroCopy = fs.readFileSync("src/lib/public-content/publicCopyRegistry.ts", "utf8");
ok(/Discover possibilities you didn't know existed\./.test(heroCopy), "headline revised");
ok(/start with nothing at all/.test(heroCopy), "supporting copy says a property is NOT required");
ok(/Anonymous\. No account required\. We don't sell your information\./.test(heroCopy), "trust line revised");
ok(fs.existsSync("src/app/(public)/navigator/page.tsx"), "/navigator route exists");

// ── Navigator Decision Framework (addendum 2026-06-11) ────────────────────────
ok(FURLONG_NAVIGATOR_MANIFEST.decisionFramework.length === 4
  && /realistically achievable/.test(FURLONG_NAVIGATOR_MANIFEST.decisionFramework[0]),
  "manifest carries the four canonical decision questions");
{
  const farmD = deriveDecisionSummary(assessPathways({ ...EMPTY_CONTEXT, propertyKind: "farm", acreage: 120, inHoa: false }));
  ok(farmD.achievable.length >= 1 && /cropland/i.test(farmD.achievable[0].pathway), "Achievable derived from YES pathways");
  ok(farmD.obstacles.length >= 1 && farmD.obstacles.every((o) => !!o.obstacle), "Obstacles derived from NO/CANT_DETERMINE");
  ok(farmD.alternatives.length >= 1, "Alternatives derived from reroutes + graph neighbors");
  ok(/highest relative likelihood|strongest relative footing|enough verified evidence/.test(farmD.probability.assessment),
    "Probability is a plain-language RELATIVE assessment");
  ok(farmD.probability.advisory.includes(PATHWAYS_NOT_PROMISES) && /advisory only/i.test(farmD.probability.advisory),
    "Probability is explicitly advisory — pathways, not promises");
  ok(!/guaranteed|you will succeed|we promise/i.test(JSON.stringify(farmD)), "decision summary contains no guarantee language");
  const noYes = deriveDecisionSummary(assessPathways({ ...EMPTY_CONTEXT, propertyKind: "residential" }));
  ok(noYes.achievable.length === 0 && noYes.probability.assessment.length > 0, "no YES pathways → honest 'nothing confirmable yet' probability read");
}
const mapSrc = fs.readFileSync("src/components/public/PublicMapExperience.tsx", "utf8");
ok(!/under-map-explore-cta/.test(mapSrc), "duplicate under-map CTA removed (nothing after the tour controls)");

const nav = fs.readFileSync("src/components/navigator/FurlongNavigator.tsx", "utf8");
ok(!/aria-pressed/.test(nav), "Navigator has NO chip grid (no aria-pressed option buttons)");
const navFetches = [...nav.matchAll(/fetch\(\s*["'`]([^"'`]+)["'`]/g)].map((m) => m[1]);
ok(navFetches.every((u) => u.startsWith("/api/public/navigator/converse")), "Navigator talks only to its own converse API");
ok(!/sessionStorage\.setItem|localStorage\.setItem/.test(nav), "component never writes browser storage directly (ephemeral default; privacy module is the only writer)");
ok(!/email|firstName|lastName|phone/i.test(nav.replace(/\/\*[\s\S]*?\*\//g, "")), "Navigator captures no identity fields");

// ── Live SSR + conversation probes (when the server is up) ───────────────────
async function main() {
  const BASE = process.env.BASE_URL ?? "http://localhost:3000";
  const live = await fetch(BASE, { signal: AbortSignal.timeout(2500) }).then(() => true).catch(() => false);
  if (live) {
    const homeHtml = await fetch(`${BASE}/`).then((r) => r.text());
    // Count the rendered DOM attribute form only — the RSC flight payload
    // repeats the string JSON-escaped, which is not a rendered element.
    ok((homeHtml.match(/data-testid="cta-navigator"/g) ?? []).length === 1 &&
       (homeHtml.match(/data-testid="cta-explore-map"/g) ?? []).length === 1,
      "SSR: hero renders exactly the two CTAs");
    ok(/Discover possibilities you didn't know existed\./.test(homeHtml), "SSR: revised headline renders");
    const navHtml = await fetch(`${BASE}/navigator`).then((r) => r.text());
    ok(navHtml.includes('data-testid="furlong-navigator"'), "SSR: /navigator renders Furlong Navigator");
    ok(!/under-map-explore-cta/.test(homeHtml), "SSR: no CTA after the tour controls");
    const disc = await fetch(`${BASE}/discover`).then((r) => r.text());
    ok(disc.includes('data-testid="furlong-navigator"'), "SSR: /discover renders Furlong Navigator");
    ok(!disc.includes('data-testid="discovery-engine"'), "SSR: the chip interview is no longer the entry flow");

    const converse = (payload: unknown) => fetch(`${BASE}/api/public/navigator/converse`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
    }).then((r) => r.json());
    const kick = await converse({});
    ok(kick.kind === "question" && /who are you/i.test(kick.text), "live: opens with the one open question");
    for (const p of OWNERSHIP_PROBES.slice(0, 10)) {
      const r = await converse({ message: p, journey: kick.journey });
      ok(r.kind === "refusal" && r.text.startsWith(REFUSAL_LINE), `live: ownership probe refused with the locked line: "${p}"`);
      ok(!/[A-Z][a-z]+ [A-Z][a-z]+ owns/.test(r.text), "live: no owner name ever rendered");
    }
    for (const p of STEERING_PROBES.slice(0, 10)) {
      const r = await converse({ message: p, journey: kick.journey });
      ok(r.kind === "refusal" && r.text.startsWith(REFUSAL_LINE), `live: steering probe refused: "${p}"`);
    }
    // SESSION PRIVACY live: the converse API is stateless — journey state is
    // round-tripped, never stored server-side; replay/interview ledgers hold
    // hashes only (checked here so a regression would fail loudly).
    {
      const led = fs.existsSync("data/discovery-interview-ledger.ndjson")
        ? fs.readFileSync("data/discovery-interview-ledger.ndjson", "utf8") : "";
      ok(!/gay man|utopia|123 Main/.test(led), "interview ledger holds NO raw conversation text");
      const rep = fs.existsSync("data/reality-security-replay.ndjson")
        ? fs.readFileSync("data/reality-security-replay.ndjson", "utf8") : "";
      ok(!/gay man|utopia|looking for/.test(rep), "replay ledger holds NO raw conversation text (hashes only)");
    }

    // GUIDED PROPERTY DISCOVERY — rendered-conversation reproduction of the
    // screenshot failure (loop fix 2026-06-11):
    {
      const k = await converse({});
      let gjj = k.journey;
      let r = await converse({ message: "I'm hoping to invest in something", journey: gjj }); gjj = r.journey;
      r = await converse({ message: "no specific property can you help me find one?", journey: gjj }); gjj = r.journey;
      ok(/We can start without a property/.test(r.text), "live: no-property ask routes to Guided Property Discovery");
      ok(!/What do you have to work with/.test(r.text), "live: the asset prompt does NOT repeat (the loop is fixed)");
      // after that, "no idea" must not loop back to the asset prompt either
      r = await converse({ message: "no idea", journey: gjj }); gjj = r.journey;
      ok(!/What do you have to work with/.test(r.text), 'live: "no idea" after discovery does not loop');
      // steering + discovery in one message → refusal THEN non-demographic discovery redirect
      const sr = await converse({ message: "find me something in a white neighborhood", journey: k.journey });
      ok(sr.kind === "refusal" && sr.text.startsWith(REFUSAL_LINE), "live: steering+discovery ask is refused first");
      ok(/We can start without a property/.test(sr.text) && /without using demographics/.test(sr.text),
        "live: after the refusal, the remaining intent routes to NON-DEMOGRAPHIC guided discovery");
      // anti-repeat: no guide prompt may appear more than twice in a session
      let aj = (await converse({})).journey;
      const texts: string[] = [];
      for (const m of ["hello", "hmm", "ok", "sure", "fine"]) {
        const rr = await converse({ message: m, journey: aj }); aj = rr.journey;
        if (rr.kind === "question" || rr.kind === "refusal") texts.push(rr.text);
      }
      const maxRepeat = Math.max(...texts.map((t) => texts.filter((x) => x === t).length));
      ok(maxRepeat <= 2, `live: no prompt repeats more than once in a session (max occurrences ${maxRepeat})`);
    }

    // walk to pathways: farmer → story → address → constraint
    let jj = kick.journey;
    for (const m of ["I'm a farmer with 120 acres", "trying to figure out what the land could earn", "the farm is at 123 Main St, Beckley WV", "no HOA, money is tight"]) {
      const r = await converse({ message: m, journey: jj });
      jj = r.journey;
      if (r.kind === "pathways") {
        ok(Array.isArray(r.pathways) && r.pathways.length > 0, "live: pathways returned");
        ok(r.pathways.every((p: { confidence?: string; whyShown?: string }) => !!p.confidence && !!p.whyShown), "live: every pathway carries confidence + why-shown");
        ok(Array.isArray(r.graphChain) && r.graphChain.length >= 2, "live: discovery graph chain present");
        ok(/property qualifies ≠ you qualify/.test(r.programsSeam), "live: the locked programs seam renders");
      }
    }
    ok(jj.node === "pathways" || jj.node === "constraints", `live: arc advanced (at ${jj.node})`);
  } else {
    console.log("  (dev server not reachable — live probes skipped; pure + structural ran)");
  }

  console.log(`verify:navigator — ${OWNERSHIP_PROBES.length} ownership + ${STEERING_PROBES.length} steering probes · scrubber · listing intake · three-answer engine · graph${live ? " · LIVE conversation" : ""}.`);
  if (fail.length) {
    console.error(`\n✗  verify:navigator FAIL — ${fail.length}:`);
    for (const f of fail.slice(0, 40)) console.error(`    ✗ ${f}`);
    process.exit(1);
  }
  console.log("\n✓  verify:navigator PASS — ownership + steering refusals hold across paraphrase (HOPA designation passes); owner/demographic fields stripped at the DATA layer; listing links parsed, never fetched; three honest answers with confidence/why-shown/effort-risk and no fabricated number (ranges-with-basis contract enforced); discovery graph chains; hero has exactly two CTAs with no duplicate after the tour; the Navigator is one conversation with one free-text box — no chip grid.");
  process.exit(0);
}
main();
