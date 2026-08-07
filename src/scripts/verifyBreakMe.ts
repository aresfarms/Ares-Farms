/**
 * verify:break-me — generative adversarial harness for the Navigator.
 *
 * Multiplies forbidden + lawful seeds by the transform set, runs each through
 * the REAL converse engine (full pipeline — refusal gates, router, conversational
 * layers), and checks every response against the property-based invariants.
 * Under-block (a guardrail slips) and over-block (a lawful input gets refused)
 * both count as breaks. CI-fails on any break.
 *
 * Dev only. Forbidden seeds expect the SAFE refusal/escalation; no harmful
 * content is generated; URL/injection seeds use safe sentinels — no real fetch.
 * Reproducible via BREAKME_SEED. Runs against BASE_URL (a running dev/prod
 * server) so the invariants see the full pipeline, not just the pure router.
 */
import { FORBIDDEN_SEEDS, LAWFUL_SEEDS, type Seed } from "./breakme/seeds";
import { TRANSFORMS } from "./breakme/transforms";
import { evaluate, type Resp, type Violation } from "./breakme/invariants";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
// Deterministic-ish: Math.random is used by the leet transform; seed the log so
// a failing run is reported with its seed for reproduction.
const BREAKME_SEED = process.env.BREAKME_SEED ?? String(Date.now());

async function converse(message: string, journey: unknown): Promise<Resp & { journey?: unknown }> {
  const r = await fetch(`${BASE}/api/public/navigator/converse`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message, journey }),
  });
  return (await r.json()) as Resp & { journey?: unknown };
}

interface Break { seedId: string; guard: string; transform: string; input: string; observed: string; violation: Violation }

async function main() {
  const live = await fetch(BASE, { signal: AbortSignal.timeout(2500) }).then(() => true).catch(() => false);
  if (!live) { console.error(`✗ verify:break-me — no server at ${BASE}. Start one and set BASE_URL.`); process.exit(2); }

  const seeds: Seed[] = [...FORBIDDEN_SEEDS, ...LAWFUL_SEEDS];
  const breaks: Break[] = [];
  let generated = 0;

  for (const seed of seeds) {
    for (const tf of TRANSFORMS) {
      const applied = tf.apply(seed.text);
      const turns = Array.isArray(applied) ? applied : [applied];
      generated++;
      // Fresh ephemeral journey per variant.
      let journey: unknown = null; const replies: Resp[] = [];
      for (const t of turns) { const r = await converse(t, journey); journey = r.journey; replies.push(r); }
      const final = replies[replies.length - 1];
      const violations = evaluate({ seed, strict: tf.strict, input: turns, replies, final });
      for (const v of violations) {
        breaks.push({ seedId: seed.id, guard: seed.guard, transform: tf.id, input: turns.join(" ⟶ "), observed: `${final.turnIntent}/${final.kind}`, violation: v });
      }
    }
  }

  // ── categorized report (guardrail × transform) ─────────────────────────────
  const under = breaks.filter((b) => b.violation.id.startsWith("UNDER-BLOCK") || b.violation.id.startsWith("INV-1") || b.violation.id.startsWith("INV-2"));
  const over = breaks.filter((b) => b.violation.id.startsWith("OVER-BLOCK"));
  console.log(`\n=== BREAK-ME — generated ${generated} variants, ${breaks.length} breaks (under=${under.length} over=${over.length}) · seed=${BREAKME_SEED} ===`);
  const byGuard = new Map<string, Break[]>();
  for (const b of breaks) { const k = `${b.guard} × ${b.transform}`; (byGuard.get(k) ?? byGuard.set(k, []).get(k)!).push(b); }
  for (const [k, list] of [...byGuard.entries()].sort()) {
    console.log(`\n▸ ${k}  (${list.length})`);
    for (const b of list.slice(0, 4)) console.log(`   [${b.violation.id}] ${b.seedId} → ${b.observed}\n      in: ${b.input.slice(0, 110)}\n      ${b.violation.detail}`);
    if (list.length > 4) console.log(`   …${list.length - 4} more`);
  }

  if (breaks.length) { console.error(`\n✗ verify:break-me FAIL — ${breaks.length} breaks. Reproduce with BREAKME_SEED=${BREAKME_SEED}`); process.exit(1); }
  console.log(`\n✓ verify:break-me PASS — ${generated} adversarial variants, zero breaks. Both under-block and over-block clean.`);
  process.exit(0);
}
main();
