/**
 * verify:discovery-flow — proves the /discover flow-state resolver routes
 * place/property-facts entrypoints to the PLACE-FIRST card, and never lets the
 * generic persona intake be the default for them.
 *
 * 1. Pure resolver: ?mode / ?topic / path segment / entrypoint / priorState all
 *    resolve correctly; the persona interview is returned ONLY with no signal.
 * 2. Structural: the /discover page wires the resolver and renders PlaceFirstDiscovery.
 * 3. Live SSR (when the dev server is reachable): the place URLs render the
 *    place-first card (and NOT the persona card); bare /discover renders persona.
 *
 * Governance basis: Master Volume VI — Property Discovery separated from general
 * customer/revenue intelligence.
 */

import * as fs from "node:fs";

import { resolveDiscoveryFlow, isPlaceFirstFlow, type DiscoveryFlow } from "@/lib/discovery/discoveryFlow";

const fail: string[] = [];
const ok = (c: boolean, m: string) => { if (!c) fail.push(m); };
const eq = (got: DiscoveryFlow, want: DiscoveryFlow, m: string) => ok(got === want, `${m} — got "${got}", want "${want}"`);

// ── 1. pure resolver ──────────────────────────────────────────────────────────
eq(resolveDiscoveryFlow({ route: "/discover", query: { mode: "place-facts" } }), "place-facts", "?mode=place-facts");
eq(resolveDiscoveryFlow({ route: "/discover", query: { topic: "opportunity-zone" } }), "opportunity-zone", "?topic=opportunity-zone");
eq(resolveDiscoveryFlow({ route: "/discover", query: { mode: "opportunity-zone" } }), "opportunity-zone", "?mode=opportunity-zone");
eq(resolveDiscoveryFlow({ route: "/discover", query: { topic: "oz" } }), "opportunity-zone", "?topic=oz alias");
eq(resolveDiscoveryFlow({ route: "/discover/opportunity-zone", query: {} }), "opportunity-zone", "path /discover/opportunity-zone");
eq(resolveDiscoveryFlow({ route: "/discover/place-facts", query: {} }), "place-facts", "path /discover/place-facts");
eq(resolveDiscoveryFlow({ route: "/discover", query: { mode: "property-discovery" } }), "property-discovery", "?mode=property-discovery");
eq(resolveDiscoveryFlow({ route: "/discover", query: {}, entrypoint: "oz-badge-cta" }), "opportunity-zone", "entrypoint hint (oz badge)");
eq(resolveDiscoveryFlow({ route: "/discover", query: {}, entrypoint: "place-fact-link" }), "place-facts", "entrypoint hint (place-fact)");
eq(resolveDiscoveryFlow({ route: "/discover", query: {}, priorState: { flow: "opportunity-zone" } }), "opportunity-zone", "prior state");
// the ONLY way to get persona: no place/property signal at all, or explicit possibilities
eq(resolveDiscoveryFlow({ route: "/discover", query: {} }), "possibilities-persona", "bare /discover → persona");
eq(resolveDiscoveryFlow({ route: "/discover", query: { mode: "possibilities" } }), "possibilities-persona", "?mode=possibilities");
// explicit query beats a weaker prior-state
eq(resolveDiscoveryFlow({ route: "/discover", query: { mode: "place-facts" }, priorState: { flow: "possibilities-persona" } }), "place-facts", "explicit query beats prior state");

ok(isPlaceFirstFlow("opportunity-zone") && isPlaceFirstFlow("place-facts") && isPlaceFirstFlow("property-discovery"), "place flows are place-first");
ok(!isPlaceFirstFlow("possibilities-persona"), "persona flow is NOT place-first");

// ── 2. structural — the page wires the resolver + renders the place-first card ─
const pageSrc = fs.readFileSync("src/app/(public)/discover/page.tsx", "utf8");
ok(/resolveDiscoveryFlow/.test(pageSrc) && /isPlaceFirstFlow/.test(pageSrc), "page calls the resolver before rendering");
ok(/PlaceFirstDiscovery/.test(pageSrc), "page renders the place-first card for place flows");
ok(fs.existsSync("src/app/(public)/discover/opportunity-zone/page.tsx"), "/discover/opportunity-zone path entrypoint exists");
const ozRoute = fs.readFileSync("src/app/(public)/discover/opportunity-zone/page.tsx", "utf8");
ok(/opportunity-zone/.test(ozRoute), "OZ route resolves the opportunity-zone flow");

// ── 3. live SSR (best-effort; skipped if the dev server isn't up) ─────────────
async function main() {
  const BASE = process.env.BASE_URL ?? "http://localhost:3000";
  const live = await fetch(BASE, { signal: AbortSignal.timeout(2500) }).then(() => true).catch(() => false);
  if (live) {
    const html = async (path: string) => fetch(`${BASE}${path}`).then((r) => r.text()).catch(() => "");
    const placeUrls = ["/discover?mode=place-facts", "/discover?topic=opportunity-zone", "/discover/opportunity-zone"];
    for (const u of placeUrls) {
      const h = await html(u);
      ok(h.includes('data-testid="place-first-discovery"'), `${u} must render the PLACE-FIRST card (SSR)`);
      ok(!h.includes('data-testid="discovery-engine"'), `${u} must NOT render the persona intake as the primary card`);
      ok(/Where is the location\?/.test(h), `${u} must put the location input first`);
    }
    const bare = await html("/discover");
    ok(bare.includes('data-testid="discovery-engine"'), "/discover (no signal) renders the persona interview");
    ok(/place-facts/.test(bare), "/discover persona view still links to the place-facts journey");
  } else {
    console.log("  (dev server not reachable — live SSR checks skipped; pure + structural ran)");
  }

  console.log(`verify:discovery-flow — resolver + structural${live ? " + live SSR" : ""} checked.`);
  if (fail.length) {
    console.error(`\n✗  verify:discovery-flow FAIL — ${fail.length}:`);
    for (const f of fail) console.error(`    ✗ ${f}`);
    process.exit(1);
  }
  console.log("\n✓  verify:discovery-flow PASS — place-facts / opportunity-zone / property-discovery entrypoints resolve to the place-first card (location first); the generic persona intake is the default ONLY with no place/property signal; persona preserved for the general possibilities journey.");
  process.exit(0);
}
main();
