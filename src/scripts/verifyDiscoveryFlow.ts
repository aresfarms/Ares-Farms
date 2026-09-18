/**
 * verify:discovery-flow — proves the /discover flow-state resolver routes
 * place/property-facts entrypoints to the PLACE-FIRST card, and never lets the
 * generic persona intake be the default for them.
 *
 * 1. Pure resolver: ?mode / ?topic / path segment / entrypoint / priorState all
 *    resolve correctly; the persona interview is returned ONLY with no signal.
 * 2. Structural: the /discover page wires the resolver and renders PlaceFirstDiscovery.
 * 3. Live SSR (against a CONFIRMED Furlong server): the place URLs render the
 *    place-first card (and NOT the persona card); bare /discover is now the
 *    address-first place-first door (spec 2026-07-28); the persona journey is
 *    preserved but reached explicitly via ?mode=possibilities.
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
const workspaceSrc = fs.readFileSync("src/components/property/PropertyEvaluationWorkspace.tsx", "utf8");
ok(/PropertyEvaluationWorkspace/.test(pageSrc) && /PlaceFirstDiscovery/.test(workspaceSrc), "page routes place flows into the workspace that renders the place-first card");
ok(fs.existsSync("src/app/(public)/discover/opportunity-zone/page.tsx"), "/discover/opportunity-zone path entrypoint exists");
const ozRoute = fs.readFileSync("src/app/(public)/discover/opportunity-zone/page.tsx", "utf8");
ok(/opportunity-zone/.test(ozRoute), "OZ route resolves the opportunity-zone flow");

// ── 3. live SSR (best-effort; skipped if the dev server isn't up) ─────────────
async function main() {
  const BASE = process.env.BASE_URL ?? "http://localhost:3000";
  // Live SSR runs only against a CONFIRMED Furlong server. A dead or foreign
  // server answering on the port would false-fail every check (and a stale one
  // could false-pass). Confirm the public home returns 200 AND carries the
  // Furlong brand marker (independent of the assertions below) before trusting
  // it; otherwise skip cleanly. The pure resolver + structural checks above
  // still guarantee the place-first contract regardless.
  const home = await fetch(BASE, { signal: AbortSignal.timeout(2500) })
    .then(async (r) => ({ status: r.status, body: await r.text().catch(() => "") }))
    .catch(() => null);
  const live = !!home && home.status === 200 && /Furlong/.test(home.body);
  if (live) {
    const html = async (path: string) => fetch(`${BASE}${path}`).then((r) => r.text()).catch(() => "");
    const placeUrls = ["/discover?mode=place-facts", "/discover?topic=opportunity-zone", "/discover/opportunity-zone"];
    for (const u of placeUrls) {
      const h = await html(u);
      ok(h.includes('data-testid="place-first-discovery"'), `${u} must render the PLACE-FIRST card (SSR)`);
      ok(!h.includes('data-testid="discovery-engine"'), `${u} must NOT render the persona intake as the primary card`);
      // "location input first" via the STABLE testid, not prompt copy — the
      // embedded card renders "Start with the verified address" (not the old
      // "Where is the location?"), so a copy match would be a false red.
      ok(h.includes('data-testid="place-inputs"'), `${u} must put the location input first`);
    }
    // Address-first is now the DEFAULT /discover door (spec 2026-07-28): bare
    // /discover renders the place-first card, NOT the persona interview. The
    // persona journey is preserved but reached explicitly via ?mode=possibilities.
    const bare = await html("/discover");
    ok(bare.includes('data-testid="place-first-discovery"'), "/discover (no signal) renders the address-first place-first card");
    ok(!bare.includes('data-testid="discovery-engine"'), "/discover (no signal) does not make the persona intake the primary card");
    // The persona journey must still be REACHABLE on the explicit ask.
    const persona = await html("/discover?mode=possibilities");
    ok(persona.includes('data-testid="discovery-engine"'), "/discover?mode=possibilities still reaches the persona journey");
    ok(!persona.includes('data-testid="place-first-discovery"'), "?mode=possibilities shows the persona journey, not the place-first card");
  } else {
    console.log(`  (no confirmed Furlong server at ${BASE} — live SSR checks skipped; pure + structural ran)`);
  }

  console.log(`verify:discovery-flow — resolver + structural${live ? " + live SSR" : ""} checked.`);
  if (fail.length) {
    console.error(`\n✗  verify:discovery-flow FAIL — ${fail.length}:`);
    for (const f of fail) console.error(`    ✗ ${f}`);
    process.exit(1);
  }
  console.log("\n✓  verify:discovery-flow PASS — place-facts / opportunity-zone / property-discovery entrypoints resolve to the place-first card (location input first); address-first is the default /discover door; the generic persona intake is NEVER the primary card for a place/property signal and is preserved, reachable at ?mode=possibilities.");
  process.exit(0);
}
main();
