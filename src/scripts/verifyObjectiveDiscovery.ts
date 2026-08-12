/**
 * verify:objective-discovery — OBJECTIVE-DISCOVERY-001.
 *
 * Unit checks on objective detection + replies, and (when a server is reachable)
 * the live 2-turn acceptance flows: after the hypothesis layer asks the
 * objective, a broad answer ("I just want to be rich", "passive income", "quit
 * my job", "rich rich rich") is interpreted AS an objective — continuing
 * objective discovery — never a generic constraints/HOA prompt. Confirmation
 * still proceeds to the existing asset route.
 */
import { detectObjectivePending, objectiveDiscoveryReply } from "@/lib/navigator/proposedSolutionHypothesis";

const fail: string[] = [];
const ok = (c: boolean, m: string) => { if (!c) fail.push(m); };

// ── Detection ────────────────────────────────────────────────────────────────
const cases: [string, string][] = [
  ["I just want to be rich", "wealth"],
  ["Not sure I just want to be rich rich rich", "wealth"],
  ["I want to make more money", "wealth"],
  ["I want passive income", "passive_income"],
  ["I want cash flow", "passive_income"],
  ["I want to quit my job", "job_replacement"],
  ["I want to retire", "retirement"],
  ["I want to build something to sell", "exit_sale"],
  ["I want scale", "scale_enterprise"],
  ["I want less work", "time_freedom"],
  ["I want stability", "stability"],
  ["I don't know, I just want more money", "wealth"],
  ["not sure", "wealth"], // vague-unsure stays in objective discovery
];
for (const [msg, cat] of cases) ok(detectObjectivePending(msg) === cat, `objective "${msg}" → ${cat} (got ${detectObjectivePending(msg)})`);

// Reply content — wealth tailored; never a constraints prompt.
const wealth = objectiveDiscoveryReply("wealth", "pet stores");
ok(/wealth-building is a real goal/i.test(wealth), "wealth reply acknowledges the goal");
ok(/what "rich" means/i.test(wealth), "wealth reply asks what 'rich' means");
ok(/cash flow|net worth|sell someday|passive ownership|financial independence/i.test(wealth), "wealth reply lists objective dimensions");
ok(/pet stores/i.test(wealth), "reply references the proposed asset");
const passive = objectiveDiscoveryReply("passive_income", "RV parks");
ok(/passive income is a real goal/i.test(passive) && /compare RV parks/i.test(passive), "passive reply compares the asset with income paths");
const job = objectiveDiscoveryReply("job_replacement", "rental houses");
ok(/monthly income/i.test(job) && /runway/i.test(job) && /risk tolerance/i.test(job) && /management/i.test(job),
  "job-replacement reply asks income/runway/risk/management");
for (const r of [wealth, passive, job]) {
  ok(!/boxes you in|HOA/i.test(r), "objective reply is NOT the generic constraints prompt");
}

// ── Live 2-turn acceptance ───────────────────────────────────────────────────
async function main() {
  const BASE = process.env.BASE_URL ?? "http://localhost:3000";
  // Live acceptance runs only against a CONFIRMED Furlong server (200 + brand
  // marker) — a dead/foreign server on the port would false-fail these.
  const home = await fetch(BASE, { signal: AbortSignal.timeout(2500) })
    .then(async (r) => ({ status: r.status, body: await r.text().catch(() => "") }))
    .catch(() => null);
  const live = !!home && home.status === 200 && /Furlong/.test(home.body);
  if (live) {
    const converse = (payload: unknown) => fetch(`${BASE}/api/public/navigator/converse`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
    }).then((r) => r.json());

    const flows: { turn1: string; turn2: string; label: string }[] = [
      { label: "laundromat→rich", turn1: "I own a laundromat and want to buy ten more in Ohio", turn2: "I just want to be rich" },
      { label: "petstore→rich rich rich", turn1: "I own 3 pet stores and want 15 more in NY", turn2: "Not sure I just want to be rich rich rich" },
      { label: "rvpark→passive", turn1: "I want to buy ten RV parks", turn2: "I want passive income" },
      { label: "rentals→quit job", turn1: "I want to buy 20 rental houses", turn2: "I want to quit my job" },
    ];
    for (const f of flows) {
      const t1 = await converse({ message: f.turn1 });
      ok(t1.turnIntent === "EXPLORE_PROPOSED_SOLUTION", `${f.label}: turn1 asks objective (got ${t1.turnIntent})`);
      const t2 = await converse({ message: f.turn2, journey: t1.journey });
      ok(t2.turnIntent === "CLARIFY_OBJECTIVE", `${f.label}: turn2 → CLARIFY_OBJECTIVE (got ${t2.turnIntent})`);
      ok(!/boxes you in|HOA|Tell me a bit more of the story/i.test(t2.text ?? ""),
        `${f.label}: turn2 is NOT a generic constraints/story prompt`);
    }

    // Confirmation path still proceeds to the existing regulated route.
    const c1 = await converse({ message: "I own a laundromat and want to buy ten more in Ohio" });
    const c2 = await converse({ message: "I just want ten more laundromats", journey: c1.journey });
    ok(c2.turnIntent === "ROUTE_REGULATED_BUSINESS_ACQUISITION", `confirmation proceeds to existing route (got ${c2.turnIntent})`);
  } else {
    console.log("  (server not reachable — live acceptance skipped; unit checks ran)");
  }

  if (fail.length) {
    console.error(`\n✗  verify:objective-discovery FAIL — ${fail.length}:`);
    for (const f of fail) console.error("    ✗ " + f);
    process.exit(1);
  }
  console.log("✓  verify:objective-discovery PASS — after the hypothesis layer asks the objective, a broad answer (wealth / passive income / job replacement / 'rich rich rich' / vague) is interpreted AS an objective and continues objective discovery — never a generic constraints/HOA/story prompt; confirmation still proceeds to the existing regulated/asset route.");
  process.exit(0);
}
main();
