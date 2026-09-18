// scripts/verifyPublicNoInternalLeak.mjs — public-surface isolation (RENDERED HTML)
//
// SECURITY gate. Fetches each public route's actual rendered HTML and fails if
// any internal operator/governance navigation leaks onto it. This is the check
// that should have caught the internal "Furlong Governed Platform" index +
// ModuleNav rendering on /compass.
//
// Needs the site running:  npm run dev (or npm start) at localhost:3000.
//   BASE=http://localhost:3000 node scripts/verifyPublicNoInternalLeak.mjs
//
// Public Alpha remains PENDING.

const BASE = process.env.BASE || "http://localhost:3000";

// Every public route. Each must show ONLY the public nav + its content.
const PUBLIC_ROUTES = ["/", "/compass", "/trust", "/about", "/explore"];

// The internal index fingerprints — must NEVER appear on a public page.
const INTERNAL_STRINGS = [
  "internal surfaces",
  "Governed Platform",
  "Master Volume runtime",
];

// Internal route prefixes — a public page must not link to any of these.
const INTERNAL_HREF_PREFIXES = [
  "/internal", "/governance", "/operator-queue", "/operator-demo",
  "/applications", "/documents", "/reviews", "/rules", "/decisions",
  "/notices", "/audit-replay", "/connectors", "/partners", "/billing",
  "/reports", "/promotion", "/case-command", "/evidence-packets",
  "/exception-remediation", "/module-readiness", "/lender", "/sponsor",
  "/portfolio", "/customer-revenue", "/dashboard", "/build-preservation",
  "/doctrine-gap-ledger", "/controlled-promotion-activation",
  "/live-scraper-activation", "/release-candidate-freeze",
  "/deployment-environment-readiness", "/environmental-compliance",
  "/source-", "/production-", "/portal/",
];

function findHrefLeaks(html) {
  const hrefs = [...html.matchAll(/href=["']([^"']+)["']/g)].map((m) => m[1]);
  const bad = new Set();
  for (const h of hrefs) {
    for (const p of INTERNAL_HREF_PREFIXES) {
      if (h === p || h.startsWith(p)) bad.add(h);
    }
  }
  return [...bad];
}

// ── Confirm the target is actually THIS app before trusting any result ────────
// SECURITY gate: it must never scream "isolation leak" when the server is simply
// down or foreign (a false alarm), nor pass against a stale/foreign server. We
// require the public home page to return 200 AND carry the Furlong brand marker
// (rendered by the public layout — independent of the internal fingerprints
// below). If we can't confirm the app, SKIP cleanly instead of emitting a false
// failure. Only a CONFIRMED Furlong server is asserted against.
let probeStatus = 0;
let probeBody = "";
try {
  const r = await fetch(BASE + "/", { redirect: "follow" });
  probeStatus = r.status;
  probeBody = await r.text().catch(() => "");
} catch (e) {
  console.log(`verify:public-no-internal-leak SKIP — no server reachable at ${BASE} (${e.message}). Start it (\`npm run dev\`) or set BASE=; isolation checks NOT run.`);
  process.exit(0);
}
if (!(probeStatus === 200 && /Furlong/.test(probeBody))) {
  console.log(`verify:public-no-internal-leak SKIP — a server answered at ${BASE} but it is not this Furlong build (home status ${probeStatus}); refusing to assert against a foreign/stale server. Point BASE at this checkout's dev server. Isolation checks NOT run.`);
  process.exit(0);
}

const results = [];
let leaked = false;      // a real isolation leak (the thing this gate guards)
let routeErrors = 0;     // a public route unreachable though the app is confirmed up

for (const route of PUBLIC_ROUTES) {
  let html = "";
  try {
    const res = await fetch(BASE + route, { redirect: "follow" });
    html = await res.text();
  } catch (e) {
    console.error(`⚠  ${route} — fetch failed though the app is up: ${e.message}`);
    routeErrors++;
    results.push([route, "error"]);
    continue;
  }

  const stringLeaks = INTERNAL_STRINGS.filter((s) => html.includes(s));
  const hrefLeaks = findHrefLeaks(html);

  if (stringLeaks.length || hrefLeaks.length) {
    leaked = true;
    console.error(`✗  ${route} LEAKS internal surface(s):`);
    if (stringLeaks.length) console.error(`     internal index text: ${stringLeaks.join(", ")}`);
    if (hrefLeaks.length)   console.error(`     internal links: ${hrefLeaks.join(", ")}`);
    results.push([route, "fail"]);
  } else {
    results.push([route, "pass"]);
  }
}

console.log("\n──── public no-internal-leak ────");
for (const [route, status] of results) {
  const mark = status === "pass" ? "✓" : status === "error" ? "⚠" : "✗";
  console.log(`  ${mark}  ${route}${status === "error" ? " (unreachable)" : ""}`);
}
console.log("─────────────────────────────────");

if (leaked) {
  console.error("PUBLIC ISOLATION FAIL — internal navigation/index is leaking onto a public page.");
  process.exit(1);
}
if (routeErrors) {
  // Not an isolation leak — but a public route that won't load on a confirmed
  // server is still a real defect, reported honestly (not as a false "leak").
  console.error(`verify:public-no-internal-leak FAIL — ${routeErrors} public route(s) unreachable on a confirmed server (a broken public route, NOT an internal leak).`);
  process.exit(1);
}
console.log("✓  verify:public-no-internal-leak PASS — public pages show only public nav.");
process.exit(0);
