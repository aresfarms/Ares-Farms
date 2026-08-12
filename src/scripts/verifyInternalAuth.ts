/**
 * verify:internal-auth — Build 57 (security launch blocker)
 *
 * Proves, against the RUNNING app, that every internal/operator/portal surface
 * rejects ANONYMOUS (logged-out) requests server-side. Complements
 * verify:public-no-internal-leak: the leak gate proves public pages don't expose
 * internal routes; this gate proves those internal routes aren't anonymously
 * reachable. Hiding the door is not locking it — this is the lock.
 *
 * For each internal PAGE: an unauthenticated request must redirect to sign-in
 * (3xx → /api/auth/signin) or 404 — NEVER 200 with the console, and never any
 * body carrying the internal console markers.
 *
 * For each internal API: an unauthenticated request must be rejected (401/403)
 * or fail closed with the perimeter's governed missing-secret 503 — never 200
 * with data. (Middleware runs before the handler, so a GET suffices even for
 * POST-only routes.)
 *
 * Sanity (so the lock didn't also brick the public site): public pages still
 * load (200, not redirected to sign-in) and the genuinely-public APIs are not
 * blocked.
 *
 * Requires the dev server. Override target with BASE_URL (default :3000).
 * Exit 0 only if every assertion holds.
 */

const BASE = (process.env.BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");

// Markers that only appear on the rendered internal operator console.
const CONSOLE_MARKERS = [
  "Furlong Governed Platform",
  "Master Volume runtime active",
];

// Representative internal PAGE per protected namespace (covers the full
// requirement list: operator consoles, source-*/production-* families, portals).
const INTERNAL_PAGES = [
  "/internal",
  "/internal/data-rights",
  "/internal/source-review",
  "/internal/place-facts",
  "/internal/listing-review",
  "/governance",
  "/operator-queue",
  "/operator-demo",
  "/applications",
  "/documents",
  "/reviews",
  "/rules",
  "/decisions",
  "/notices",
  "/audit-replay",
  "/connectors",
  "/partners",
  "/billing",
  "/reports",
  "/promotion",
  "/case-command",
  "/evidence-packets",
  "/exception-remediation",
  "/module-readiness",
  "/environmental-compliance",
  "/source-ingestion",
  "/production-final-authority",
  "/dashboard",
  "/lender/dashboard",
  "/lender-desk",
  "/sponsor/dashboard",
  "/portal/borrower",
];

// Representative internal API per namespace. Middleware blocks before the
// handler, so GET works regardless of the handler's supported methods.
const INTERNAL_APIS = [
  "/api/governance/live-action-readiness",
  "/api/billing/admin",
  "/api/decisions",
  "/api/reviews",
  "/api/rules",
  "/api/reports",
  "/api/partners",
  "/api/connectors",
  "/api/notices",
  "/api/queues",
  "/api/documents",
  "/api/applications",
  "/api/ledger",
  "/api/audit",
  "/api/entitlements",
  "/api/lender/deal-desk",
];

// Public pages must still render (must NOT be redirected to sign-in).
const PUBLIC_PAGES = ["/", "/about", "/trust", "/compass", "/explore", "/accessibility"];

// Genuinely-public APIs must NOT be auth-blocked (allowlisted in apiSecurityPolicy).
const PUBLIC_APIS = [
  "/api/auth/providers",
  "/api/readiness",
  "/api/financing/pathways",
  "/api/accessibility-feedback",
];

type Failure = { route: string; detail: string };

async function get(path: string): Promise<{ status: number; location: string | null; body: string }> {
  const res = await fetch(`${BASE}${path}`, {
    redirect: "manual",
    headers: { Accept: "text/html,application/json" },
  });
  let body = "";
  try { body = await res.text(); } catch { body = ""; }
  return { status: res.status, location: res.headers.get("location"), body };
}

/**
 * A redirect counts ONLY if it lands on a real sign-in wall.
 *
 * This used to accept `/api/auth/signin` alone — NextAuth's built-in page. The
 * app now redirects to its OWN `/sign-in`, so the check went red on routes that
 * were correctly protected: `/environmental-compliance` returns
 * 307 -> /sign-in?callbackUrl=... and was reported as a failure (sweep finding
 * S-4, 2026-08-11).
 *
 * A FALSE RED IS NOT HARMLESS. A gate that fails on healthy code trains
 * everyone to skip past it, and the next failure — a real one — gets skipped
 * too. Widened to the custom page, and NOT further: the status must still be
 * 3xx and the destination must still be a sign-in wall, so a redirect to the
 * console or to "/" still fails.
 */
const SIGN_IN_DESTINATIONS = [/\/api\/auth\/signin/, /^\/sign-in(\?|$)/, /:\/\/[^/]+\/sign-in(\?|$)/];

function isSignInRedirect(status: number, location: string | null): boolean {
  if (status < 300 || status >= 400 || !location) return false;
  return SIGN_IN_DESTINATIONS.some((pattern) => pattern.test(location));
}

async function main(): Promise<void> {
  const failures: Failure[] = [];

  // ── Confirm the target is THIS app before asserting ─────────────────────────
  // A security gate must never false-PASS against a stale/foreign server that
  // merely answers on the port, nor false-FAIL when nothing is running. Require
  // the public home page to return 200 AND carry the Furlong brand marker
  // (rendered by the public layout — independent of the auth assertions below).
  // If the app can't be positively confirmed we SKIP cleanly: an explicit skip
  // is safe (never a false pass), a misleading pass/fail is not.
  let home: { status: number; body: string };
  try {
    const r = await fetch(`${BASE}/`, { redirect: "manual", headers: { Accept: "text/html" } });
    home = { status: r.status, body: await r.text().catch(() => "") };
  } catch {
    console.log(`verify:internal-auth SKIP — no server reachable at ${BASE}. Start it (\`npm run dev\`) and re-run, or set BASE_URL. (auth assertions NOT run)`);
    process.exit(0);
  }
  if (!(home.status === 200 && /Furlong/.test(home.body))) {
    console.log(`verify:internal-auth SKIP — a server answered at ${BASE} but it is not confirmed as this Furlong build (home status ${home.status}); refusing to assert against a foreign/stale server. Point BASE_URL at this checkout's dev server. (auth assertions NOT run)`);
    process.exit(0);
  }

  // ── Internal PAGES must redirect-to-signin or 404, never serve the console ──
  for (const route of INTERNAL_PAGES) {
    const { status, location, body } = await get(route);
    const redirected = isSignInRedirect(status, location);
    const notFound = status === 404;
    const leakedMarker = CONSOLE_MARKERS.find((m) => body.includes(m));
    if (!redirected && !notFound) {
      failures.push({
        route,
        detail: `expected sign-in redirect or 404, got ${status}` +
          (location ? ` → ${location}` : "") +
          (leakedMarker ? ` AND body leaked console marker "${leakedMarker}"` : ""),
      });
    } else if (leakedMarker) {
      failures.push({ route, detail: `served console marker "${leakedMarker}" anonymously (status ${status})` });
    }
  }

  // ── Internal APIs must reject (401/403), never serve data ───────────────────
  for (const route of INTERNAL_APIS) {
    const { status, location, body } = await get(route);
    let governedMissingSecret = false;
    if (status === 503) {
      try {
        const parsed = JSON.parse(body) as {
          ok?: unknown;
          governance?: { policy?: unknown; missingSecret?: unknown };
        };
        governedMissingSecret =
          parsed.ok === false &&
          parsed.governance?.policy === "session-required" &&
          parsed.governance?.missingSecret === true;
      } catch {
        governedMissingSecret = false;
      }
    }
    const rejected =
      status === 401 ||
      status === 403 ||
      governedMissingSecret ||
      isSignInRedirect(status, location);
    if (!rejected) {
      failures.push({
        route,
        detail: `expected 401/403 or governed missing-secret 503 for anonymous request, got ${status}`,
      });
    }
  }

  // ── Public pages must still load (not redirected to sign-in) ────────────────
  for (const route of PUBLIC_PAGES) {
    const { status, location } = await get(route);
    if (isSignInRedirect(status, location)) {
      failures.push({ route, detail: `PUBLIC page was redirected to sign-in (status ${status}) — auth gate is over-broad` });
    } else if (status >= 500) {
      failures.push({ route, detail: `PUBLIC page errored (status ${status})` });
    }
  }

  // ── Public APIs must NOT be auth-blocked ────────────────────────────────────
  for (const route of PUBLIC_APIS) {
    const { status, location } = await get(route);
    if (status === 401 || status === 403 || isSignInRedirect(status, location)) {
      failures.push({ route, detail: `PUBLIC API was blocked (status ${status}) — must stay in the public allowlist` });
    }
  }

  // ── Report ──────────────────────────────────────────────────────────────────
  const checked = INTERNAL_PAGES.length + INTERNAL_APIS.length + PUBLIC_PAGES.length + PUBLIC_APIS.length;
  console.log(`verify:internal-auth — ${checked} routes checked against ${BASE}`);
  console.log(`  internal pages: ${INTERNAL_PAGES.length} · internal APIs: ${INTERNAL_APIS.length} · public pages: ${PUBLIC_PAGES.length} · public APIs: ${PUBLIC_APIS.length}`);

  if (failures.length > 0) {
    console.error(`\n✗  verify:internal-auth FAIL — ${failures.length} route(s) not correctly gated:`);
    for (const f of failures) console.error(`    ✗ ${f.route} — ${f.detail}`);
    process.exit(1);
  }

  console.log("\n✓  verify:internal-auth PASS — every internal page/API rejects anonymous access; public surfaces unaffected.");
  process.exit(0);
}

main().catch((e) => {
  console.error("verify:internal-auth FAIL — unexpected error:", e);
  process.exit(1);
});
