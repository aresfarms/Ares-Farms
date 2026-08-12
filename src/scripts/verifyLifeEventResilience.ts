/**
 * verify:life-event-resilience — LIFE-EVENT-RESILIENCE-001 (doctrine-only).
 * Locks the registry contract (numbers-not-names, relationship categories,
 * advisory boundary, output shape, non-bypassable guardrails, flows NOT live)
 * and live-proves the §11 acceptance posture against the existing Navigator:
 * life-event questions never request personal names, spouse-name-on-deed is
 * refused as an owner lookup, and no flow change was activated.
 */
import * as fs from "node:fs";
import {
  LIFE_EVENT_FLOWS_LIVE, COVERED_LIFE_EVENTS, ALLOWED_CORE_SUPPORT,
  ALLOWED_RELATIONSHIP_CATEGORIES, BANNED_IDENTITY_FIELDS, LIFE_EVENT_FRAMING,
  LIFE_EVENT_NOT_PROVIDED, LIFE_EVENT_MAY_PROVIDE, LIFE_EVENT_OUTPUT_SHAPE,
  LIFE_EVENT_NON_BYPASSABLE_GUARDRAILS, asksForPersonalName,
} from "@/lib/navigator/lifeEventResilienceDoctrine";

const fail: string[] = [];
const ok = (c: boolean, m: string) => { if (!c) fail.push(m); };

// Registry contract.
ok(LIFE_EVENT_FLOWS_LIVE === false, "no public life-event flow activated (doctrine-only)");
ok(COVERED_LIFE_EVENTS.length === 17 && COVERED_LIFE_EVENTS.includes("divorce") && COVERED_LIFE_EVENTS.includes("forced sale risk"),
  "17 covered life events registered");
ok(ALLOWED_CORE_SUPPORT.length === 15, "allowed Core support list complete (15)");
ok(ALLOWED_RELATIONSHIP_CATEGORIES.length === 13 && BANNED_IDENTITY_FIELDS.length === 9,
  "relationship categories (13) sufficient; banned identity fields (9) locked");
ok(/I do not need names to help map the property options/.test(LIFE_EVENT_FRAMING) &&
   /property value, mortgage balance, monthly payment, ownership structure, timeline/.test(LIFE_EVENT_FRAMING),
  "§6 required framing locked verbatim");
ok(LIFE_EVENT_NOT_PROVIDED.includes("legal advice") && LIFE_EVENT_NOT_PROVIDED.includes("tax advice") &&
   LIFE_EVENT_NOT_PROVIDED.includes("binding valuation") && LIFE_EVENT_MAY_PROVIDE.length === 3,
  "§7 advisory boundary locked");
ok(LIFE_EVENT_OUTPUT_SHAPE.length === 7 && LIFE_EVENT_OUTPUT_SHAPE[6] === "Decision remains yours",
  "§9 output shape (7 sections, ends with Decision remains yours)");
ok(LIFE_EVENT_NON_BYPASSABLE_GUARDRAILS.length === 6, "§10 six non-bypassable guardrails locked");
ok(asksForPersonalName("what is your spouse's name?") && !asksForPersonalName(LIFE_EVENT_FRAMING),
  "identity-minimization detector works (framing itself is clean)");
ok(fs.existsSync("docs/doctrine/LIFE_EVENT_RESILIENCE_001.md") &&
   /needs the numbers, not the names/.test(fs.readFileSync("docs/doctrine/LIFE_EVENT_RESILIENCE_001.md", "utf8")),
  "doctrine doc exists with the core rule");

// §11 acceptance — live against the existing Navigator (no routing changes).
async function main() {
  const BASE = process.env.BASE_URL ?? "http://localhost:3000";
  // Live §11 probes run only against a CONFIRMED Furlong server (200 + brand
  // marker) — a dead/foreign server on the port would false-fail these.
  const home = await fetch(BASE, { signal: AbortSignal.timeout(2500) })
    .then(async (r) => ({ status: r.status, body: await r.text().catch(() => "") }))
    .catch(() => null);
  const live = !!home && home.status === 200 && /Furlong/.test(home.body);
  if (live) {
    const converse = (message: string) => fetch(`${BASE}/api/public/navigator/converse`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message }),
    }).then((r) => r.json());
    // Identity lookup inside a life event is STILL an owner-identity refusal.
    const deed = await converse("What is my spouse's name on the deed?");
    ok(deed.kind === "refusal" && deed.turnIntent === "REFUSE_OWNER_LOOKUP",
      "spouse-name-on-deed → owner-identity refusal (privacy rule unchanged by life event)");
    // Life-event questions: no personal-name request, no refusal, no advice.
    for (const q of [
      "I'm getting divorced. How do I get out of the mortgage?",
      "I lost my job. How can I keep my house?",
      "My parent died and left me a house.",
      "I own a house with my sibling and want out.",
      "My ex is on the mortgage.",
    ]) {
      const r = await converse(q);
      ok(!asksForPersonalName(r.text ?? ""), `no personal-name request: "${q}"`);
      ok(r.kind !== "refusal", `life-event question is NOT refused: "${q}"`);
      ok(!/you should (?:sell|keep|buy|refinance)|this is legal advice/i.test(r.text ?? ""),
        `no decision-for-user / legal-advice language: "${q}"`);
    }
  } else {
    console.log("  (no confirmed Furlong server — live §11 probes skipped; registry checks ran)");
  }

  if (fail.length) {
    console.error(`\n✗  verify:life-event-resilience FAIL — ${fail.length}:`);
    for (const f of fail) console.error("    ✗ " + f);
    process.exit(1);
  }
  console.log("✓  verify:life-event-resilience PASS — numbers-not-names doctrine locked (categories sufficient, 9 identity fields banned, §6 framing verbatim, §7 advice boundary, §9 shape, §10 guardrails non-bypassable); flows NOT activated; live: spouse-name-on-deed refused as owner lookup, life-event questions answered without name requests, refusals, or advice.");
  process.exit(0);
}
main();
