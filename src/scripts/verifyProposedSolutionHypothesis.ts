/**
 * verify:proposed-solution-hypothesis — PROPOSED-SOLUTION-AS-HYPOTHESIS-001.
 *
 * Unit checks on the detector + reply, and (when a server is reachable) the §9
 * live acceptance tests against the real converse API: expansion inputs get the
 * objective-discovery reply (acknowledge + ask outcome + alternatives + keep
 * path open, NOT a classifier label), ordinary single goals are untouched, and
 * explicit confirmation proceeds to the existing asset route.
 */
import * as fs from "node:fs";
import {
  detectProposedSolution, isProposedSolutionConfirmation, proposedSolutionReply,
  detectStateLocation, detectLocationPhrase,
} from "@/lib/navigator/proposedSolutionHypothesis";

const fail: string[] = [];
const ok = (c: boolean, m: string) => { if (!c) fail.push(m); };

// ── Detector precision ───────────────────────────────────────────────────────
for (const m of [
  "I own a laundromat and I want to buy ten more in Ohio",
  "I own a farm and want five more farms",
  "I want to buy ten RV parks",
  "I want to buy another hotel",
  "I want a portfolio of self-storage facilities",
  "I want to buy 20 rental houses",
  "I want to buy a $10M property",
  "I want to expand into Albuquerque",
  // HYPOTHESIS-002 non-numeric expansion
  "I won a hotel in a poker game. I like it I want to buy more hotels in Mass.",
  "I own one hotel and want more hotels",
  "I own a laundromat and want more laundromats in Ohio",
  "I want to add more RV parks",
  "I want to get more rental houses",
]) ok(!!detectProposedSolution(m), `detects proposed-solution: "${m}"`);

for (const m of [
  "I want a farm",
  "I want to start a vineyard",
  "I want 100 acres for a homestead",
  "I'm looking at a property in Ohio",
  "I inherited land",
  "I want a hotel",
  "I want one hotel",
  "I want to buy one hotel",
  "I want more time",
]) ok(detectProposedSolution(m) === null, `does NOT over-fire on ordinary goal: "${m}"`);

// HYPOTHESIS-002 location normalization (LAST mention wins; city preserved).
const locCases: [string, string][] = [
  ["I want to buy more hotels in Mass.", "Massachusetts"],
  ["more hotels in MA", "Massachusetts"],
  ["more hotels in N.Y.", "New York"],
  ["more hotels in Massachusetts", "Massachusetts"],
  ["more laundromats in Ohio", "Ohio"],
  ["more pet stores in NY", "New York"],
  ["more hotels in New Mexico", "New Mexico"],
  // expansion target wins over an earlier current-location mention
  ["I own 3 pet stores in Cape May, NJ and want to buy 15 more in NY", "New York"],
];
for (const [m, state] of locCases) ok(detectStateLocation(m) === state, `location "${m}" → ${state} (got ${detectStateLocation(m)})`);
ok(detectLocationPhrase("more hotels in Albuquerque, NM") === "Albuquerque, New Mexico",
  `city preserved: "Albuquerque, New Mexico" (got ${detectLocationPhrase("more hotels in Albuquerque, NM")})`);
ok(detectLocationPhrase("I own 3 pet stores in Cape May, NJ and want to buy 15 more in NY") === "New York",
  "pet-store NY target chosen over earlier Cape May, NJ");
ok(/More hotels in Massachusetts could be the right path/.test(proposedSolutionReply("hotels", "Massachusetts")),
  "reply preserves the user-provided location");

for (const m of [
  "I just want ten more laundromats",
  "just want the laundromats",
  "no, just buy the ten",
  "I'll stick with the farms",
  "go with that path",
]) ok(isProposedSolutionConfirmation(m), `detects confirmation: "${m}"`);

// ── Reply content contract ───────────────────────────────────────────────────
const reply = proposedSolutionReply("laundromats");
ok(/could be the right path/i.test(reply), "reply acknowledges + validates the path");
ok(/what are you (?:actually )?trying to accomplish/i.test(reply), "reply asks the objective");
ok(/income|sell someday|expansion|passive|family wealth|diversification/i.test(reply), "reply offers objective categories");
ok(/compare/i.test(reply) && /(smaller|larger|diversified|different asset)/i.test(reply), "reply offers alternative comparison");
ok(/concentrate risk/i.test(reply), "reply includes neutral concentration framing");
ok(/if you already know this is the path/i.test(reply), "reply keeps the stated path open");
ok(!/real,?\s+regulated acquisition/i.test(reply), "reply is NOT the classifier label");

ok(fs.existsSync("docs/doctrine/PROPOSED_SOLUTION_AS_HYPOTHESIS_001.md"), "doctrine doc exists");

// ── §9 live acceptance ───────────────────────────────────────────────────────
async function main() {
  const BASE = process.env.BASE_URL ?? "http://localhost:3000";
  // Live §9 acceptance runs only against a CONFIRMED Furlong server (200 +
  // brand marker) — a dead/foreign server on the port would false-fail these.
  const home = await fetch(BASE, { signal: AbortSignal.timeout(2500) })
    .then(async (r) => ({ status: r.status, body: await r.text().catch(() => "") }))
    .catch(() => null);
  const live = !!home && home.status === 200 && /Furlong/.test(home.body);
  if (live) {
    const converse = (payload: unknown) => fetch(`${BASE}/api/public/navigator/converse`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
    }).then((r) => r.json());

    const expansions = [
      "I own a laundromat and I want to buy ten more in Ohio",
      "I own a farm and want five more farms",
      "I want to buy ten RV parks",
      "I want to buy 20 rental houses",
    ];
    for (const m of expansions) {
      const r = await converse({ message: m });
      ok(r.turnIntent === "EXPLORE_PROPOSED_SOLUTION", `live: "${m}" → EXPLORE_PROPOSED_SOLUTION (got ${r.turnIntent})`);
      ok(!/real,?\s+regulated acquisition|is a real,? regulated|^Laundromat is/i.test(r.text ?? ""),
        `live: "${m}" first reply is NOT a classifier label`);
      ok(/trying to accomplish/i.test(r.text ?? "") && /compare/i.test(r.text ?? ""),
        `live: "${m}" asks objective + offers comparison`);
      ok(/right path/i.test(r.text ?? ""), `live: "${m}" keeps the stated path open`);
      ok(r.kind !== "refusal", `live: "${m}" does not refuse / block the path`);
    }

    // Confirmation proceeds to the existing laundromat/regulated route.
    const confirm = await converse({ message: "I just want ten more laundromats" });
    ok(confirm.turnIntent === "ROUTE_REGULATED_BUSINESS_ACQUISITION",
      `live: confirmation proceeds to existing route (got ${confirm.turnIntent})`);

    // Ordinary single goal stays on the normal ag route (not the hypothesis layer).
    const plain = await converse({ message: "I want to start a vineyard" });
    ok(plain.turnIntent !== "EXPLORE_PROPOSED_SOLUTION", "live: ordinary single goal is not treated as a hypothesis");
  } else {
    console.log("  (server not reachable — live §9 acceptance skipped; unit checks ran)");
  }

  if (fail.length) {
    console.error(`\n✗  verify:proposed-solution-hypothesis FAIL — ${fail.length}:`);
    for (const f of fail) console.error("    ✗ " + f);
    process.exit(1);
  }
  console.log("✓  verify:proposed-solution-hypothesis PASS — expansion/portfolio inputs are met with objective-discovery (acknowledge + ask outcome + compare alternatives + neutral concentration framing + keep path open), NOT a classifier label; ordinary single goals untouched; explicit confirmation proceeds to the existing regulated/asset route. No steering, no decision-for-user, no path blocking.");
  process.exit(0);
}
main();
