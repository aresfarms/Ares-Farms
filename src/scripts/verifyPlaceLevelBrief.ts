/**
 * verify:place-brief — the fabrication guard for the interest-first
 * ("I want to live in Athens, GA") journey.
 *
 * A place is not a parcel. This gate proves that a place-level brief:
 *   1. NEVER asserts a tract/parcel-level designation (Opportunity Zone, NMTC,
 *      flood zone, historic) area-wide — the exact fabrication that would let
 *      "Athens, GA is in an Opportunity Zone" reach a visitor;
 *   2. DOES carry the county/area facts that are legitimately true area-wide;
 *   3. names every deferred parcel item with a plain reason;
 *   4. never states person-eligibility (interests, not qualifications).
 */

import { buildPlaceLevelBrief, isAreaLevelFact, type PlaceInterest } from "@/lib/property/placeLevelBrief";
import type { BriefFactLine } from "@/lib/property/propertyBriefIntelligence";

const fact = (label: string, value: string, tone: BriefFactLine["tone"] = "neutral"): BriefFactLine => ({
  label,
  value,
  text: `${label}: ${value}`,
  provenance: "Source: test fixture · as of 2026-07-20",
  tone,
});

const failures: string[] = [];
const check = (ok: boolean, msg: string) => {
  if (!ok) failures.push(msg);
};

// A city-centroid geocode realistically returns BOTH kinds of fact. The brief
// must keep the parcel-level ones out of the area-wide assertions.
const facts: BriefFactLine[] = [
  fact("County", "Clarke County, GA"),
  fact("Fair market rent", "$1,240 for a 2-bedroom"),
  fact("Higher education", "Major public university in the county"),
  fact("Electric and utility rates", "12.4 cents/kWh state average"),
  // Parcel/tract-level — MUST NOT be asserted for a whole city:
  fact("Opportunity Zone", "Designated QOZ tract", "positive"),
  fact("NMTC", "Qualified low-income community tract", "positive"),
  fact("Flood zone", "Zone X — outside hazard area", "positive"),
  fact("Historic status", "National Register district"),
];

const interests: PlaceInterest[] = [
  { tag: "live-here", said: "I want to live in Athens" },
  { tag: "cost-of-living", said: "somewhere affordable" },
  { tag: "farm-land", said: "maybe a little land" },
];

const brief = buildPlaceLevelBrief({ placeName: "Athens, GA", facts, interests });

// 1. No parcel-level designation may appear in the area-wide facts.
const FORBIDDEN_AREA_WIDE = ["opportunity zone", "nmtc", "flood zone", "historic status"];
for (const forbidden of FORBIDDEN_AREA_WIDE) {
  check(
    !brief.areaFacts.some((f) => f.label.toLowerCase() === forbidden),
    `FABRICATION: "${forbidden}" was asserted area-wide for a whole place — it is tract/parcel-level.`
  );
  check(
    brief.needsAnAddress.some((n) => n.label.toLowerCase() === forbidden),
    `"${forbidden}" must be deferred to "name an address", with a reason.`
  );
}

// 2. Genuine county/area facts must survive.
for (const expected of ["County", "Fair market rent", "Higher education"]) {
  check(
    brief.areaFacts.some((f) => f.label === expected),
    `Area-level fact "${expected}" should be carried for a place brief.`
  );
}
check(isAreaLevelFact("County"), "County must classify as area-level.");
check(!isAreaLevelFact("Flood zone"), "Flood zone must NOT classify as area-level.");

// 3. Every deferred item carries a plain-language reason.
for (const item of brief.needsAnAddress) {
  check(Boolean(item.why && item.why.trim().length > 12), `Deferred item "${item.label}" needs a real reason.`);
}
check(brief.needsAnAddress.length > 0, "A place brief must always defer some parcel-level items.");

// 4. Interests, not qualifications — no eligibility language anywhere.
const BANNED = [
  "you qualify", "you are eligible", "pre-qualified", "prequalified",
  "approved", "guaranteed", "you should buy", "we recommend you",
  "best fit for you", "right for you",
];
const corpus = [
  brief.overall,
  ...brief.openQuestions,
  ...brief.fitReads.map((r) => `${r.lead} ${r.gap ?? ""}`),
  ...brief.needsAnAddress.map((n) => n.why),
  ...brief.byLane.map((l) => l.whatsHere),
].join(" \n ").toLowerCase();
for (const phrase of BANNED) {
  check(!corpus.includes(phrase), `Person-eligibility / recommendation language leaked: "${phrase}".`);
}

// 5. A fit read with no supporting fact must say so rather than invent one.
const empty = buildPlaceLevelBrief({
  placeName: "Nowhere, ZZ",
  facts: [],
  interests: [{ tag: "schools-family", said: "good schools" }],
});
check(empty.fitReads[0]?.gap !== null, "With no facts, a fit read must expose the gap, not fabricate a read.");
check(empty.areaFacts.length === 0, "No facts in → no area facts asserted.");

console.log("\n━━━ verify:place-brief ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log(`  place: ${brief.placeName}`);
console.log(`  area-level facts carried: ${brief.areaFacts.length} (${brief.areaFacts.map((f) => f.label).join(", ")})`);
console.log(`  deferred to an address:   ${brief.needsAnAddress.length} (${brief.needsAnAddress.map((n) => n.label).join(", ")})`);
console.log(`  lanes surfaced:           ${brief.byLane.length}`);

if (failures.length > 0) {
  console.error("\n✗ verify:place-brief FAIL");
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log("✓ verify:place-brief PASS — no parcel-level fact asserted area-wide; no eligibility language.\n");
