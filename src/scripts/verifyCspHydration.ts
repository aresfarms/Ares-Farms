/**
 * verify:csp-hydration — proves the CSP's EFFECT, not just header presence
 * (GCP/nonce-CSP readiness, 2026-06-12). Run against a PRODUCTION-LIKE server
 * (`npm run build && npm run start`); it FAILS by design against a dev server
 * unless CSP_HYDRATION_ALLOW_DEV=1 (smoke only).
 *
 * Asserts, against the live responses:
 *  - CSP header exists on pages;
 *  - production script-src contains NO 'unsafe-inline';
 *  - a nonce exists, with 'strict-dynamic';
 *  - the nonce is cryptographically fresh PER REQUEST (two requests differ);
 *  - EVERY inline <script> in the HTML carries the matching nonce attribute —
 *    the mechanical proof that Next's hydration/bootstrap scripts are allowed
 *    to execute under the strict policy (no dead handlers from blocked
 *    scripts);
 *  - the Navigator surface is present in the HTML (input/send markers);
 *  - object-src 'none', base-uri 'self', frame-ancestors 'none' retained.
 *
 * The companion eyes-on step (required by the runbook): drive the rendered
 * browser against the same production server — kickoff renders, send works,
 * console shows zero CSP violations.
 */
const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const ALLOW_DEV = process.env.CSP_HYDRATION_ALLOW_DEV === "1";
// STAGING-DEPLOY P2.4: the staging service is IAM-private — every request needs
// a Cloud Run identity token. Optional; local verification is unchanged.
// Usage: VERIFY_BEARER_TOKEN=$(gcloud auth print-identity-token) BASE_URL=... npm run verify:csp-hydration
const BEARER = process.env.VERIFY_BEARER_TOKEN;

const fail: string[] = [];
const ok = (c: boolean, m: string) => { if (!c) fail.push(m); };

function extractDirective(csp: string, name: string): string | null {
  const m = csp.split(";").map((s) => s.trim()).find((s) => s.startsWith(name + " ") || s === name);
  return m ?? null;
}

async function fetchPage(path: string): Promise<{ csp: string; html: string }> {
  const r = await fetch(`${BASE}${path}`, {
    signal: AbortSignal.timeout(15000),
    headers: BEARER ? { Authorization: `Bearer ${BEARER}` } : undefined,
  });
  return { csp: r.headers.get("content-security-policy") ?? "", html: await r.text() };
}

async function main() {
  const a = await fetchPage("/navigator");
  ok(!!a.csp, "CSP header present on /navigator");
  const scriptSrc = extractDirective(a.csp, "script-src") ?? "";
  const isNonceMode = /'nonce-[A-Za-z0-9+/=]+'/.test(scriptSrc);

  if (!isNonceMode && !ALLOW_DEV) {
    fail.push("server is NOT in nonce-CSP mode — run against a production build (npm run build && npm run start); dev override: CSP_HYDRATION_ALLOW_DEV=1");
  }

  if (isNonceMode) {
    ok(!/'unsafe-inline'/.test(scriptSrc), "PRODUCTION script-src contains NO 'unsafe-inline'");
    ok(/'strict-dynamic'/.test(scriptSrc), "script-src carries 'strict-dynamic'");
    const nonce = scriptSrc.match(/'nonce-([A-Za-z0-9+/=]+)'/)![1];
    ok(nonce.length >= 16, "nonce is non-trivial length (crypto-random)");

    // Per-request freshness: a second request must carry a DIFFERENT nonce.
    const b = await fetchPage("/navigator");
    const nonce2 = (extractDirective(b.csp, "script-src") ?? "").match(/'nonce-([A-Za-z0-9+/=]+)'/)?.[1];
    ok(!!nonce2 && nonce2 !== nonce, "nonce is fresh per request (two requests differ)");

    // EVERY inline <script> must carry the matching nonce — blocked inline
    // scripts are exactly how hydration silently dies.
    const inlineScripts = [...a.html.matchAll(/<script\b([^>]*)>/g)]
      .map((m) => m[1])
      .filter((attrs) => !/\bsrc=/.test(attrs));
    ok(inlineScripts.length > 0, "page has inline scripts (Next bootstrap present — something to protect)");
    const untagged = inlineScripts.filter((attrs) => !attrs.includes(`nonce="${nonce}"`) && !attrs.includes(`nonce=${nonce}`));
    ok(untagged.length === 0, `ALL inline scripts carry the request nonce (untagged: ${untagged.length}) — hydration permitted under strict CSP`);

    // External scripts under strict-dynamic must also be nonced or propagated;
    // Next tags its <script src> chunks too — verify at least the markers.
    ok(/object-src 'none'/.test(a.csp) && /base-uri 'self'/.test(a.csp) && /frame-ancestors 'none'/.test(a.csp),
      "object-src 'none' + base-uri 'self' + frame-ancestors 'none' retained");
  }

  // Navigator surface present in HTML (the thing hydration must bring alive).
  ok(/data-testid="navigator-input"|furlong-navigator/.test(a.html), "Navigator surface present in served HTML");

  if (fail.length) {
    console.error(`\n✗  verify:csp-hydration FAIL — ${fail.length}:`);
    for (const f of fail) console.error("    ✗ " + f);
    process.exit(1);
  }
  console.log(`✓  verify:csp-hydration PASS — ${isNonceMode ? "PRODUCTION nonce mode: no 'unsafe-inline' in script-src, 'strict-dynamic' on, per-request fresh nonce, ALL inline scripts nonce-tagged (hydration permitted under the strict policy)" : "dev mode (override)"}; Navigator surface served. Companion eyes-on rendered check required per runbook.`);
  process.exit(0);
}
main();

export {};
