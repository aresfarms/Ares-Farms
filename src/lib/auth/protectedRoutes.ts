/**
 * Protected route registry — the single source of truth for which surfaces are
 * internal/operator/portal and therefore require an authenticated session.
 *
 * Consumed by:
 *   - src/middleware.ts                         (server-side enforcement)
 *   - src/components/platform/PlatformChrome.tsx (operator-chrome visibility)
 *   - src/scripts/verifyInternalAuth.ts          (the gate that proves it)
 *
 * Edge-safe: pure constants + string helpers, no node / runtime imports, so it
 * can be imported by Edge middleware.
 *
 * SECURITY (Build 57 — launch blocker). Hiding the door (the nav-leak fix) is
 * not locking it. Every prefix here must reject anonymous access server-side.
 *
 * Polarity is an ALLOWLIST of INTERNAL prefixes: an unknown route is treated as
 * public and is NOT auth-gated, so a new public page is never accidentally
 * locked. The inverse failure mode — a new INTERNAL surface left un-gated — is
 * caught by verify:internal-auth, which must list each internal route and prove
 * it rejects anonymous requests.
 */

/**
 * Operator / governance / financial console prefixes. These render the internal
 * operator chrome (PlatformChrome) AND require an authenticated session.
 * "-" suffixed prefixes (e.g. "/source-", "/production-") match by startsWith,
 * covering every dated source-* / production-* console family.
 */
export const INTERNAL_CHROME_PREFIXES = [
  "/internal", "/governance", "/operator-queue", "/operator-demo",
  "/applications", "/documents", "/reviews", "/rules", "/decisions",
  "/notices", "/audit-replay", "/connectors", "/partners", "/billing",
  "/reports", "/promotion", "/case-command", "/evidence-packets",
  "/exception-remediation", "/module-readiness", "/lender",
  "/sponsor",
  "/portfolio", "/customer-revenue", "/dashboard", "/build-preservation",
  "/doctrine-gap-ledger", "/controlled-promotion-activation",
  "/live-scraper-activation", "/release-candidate-freeze",
  "/deployment-environment-readiness", "/environmental-compliance",
  "/named-tester-acceptance", "/launch-authorization",
  "/source-", "/production-", "/security/mfa",
] as const;

/**
 * PAGE prefixes that require an authenticated session. This is the operator
 * console set PLUS the borrower / lender / sponsor portals. Portals carry their
 * own chrome (not the operator chrome), so they are auth-gated here but are not
 * part of INTERNAL_CHROME_PREFIXES. Role-aware gating (operator vs lender vs
 * sponsor vs borrower) is a deliberate second pass — step one is "no anonymous
 * access to any internal/portal surface".
 */
export const PROTECTED_PAGE_PREFIXES = [
  ...INTERNAL_CHROME_PREFIXES,
  "/security/mfa",
  "/security/password-setup",
  "/portal",
  // The Lender Deal Desk is auth-gated but does NOT wear the internal
  // operator chrome — the licensed lender gets a clean working surface,
  // not the 76-console engine room (founder test 2026-08-05).
  "/lender-desk",
] as const;

function matchesPrefix(pathname: string, prefixes: readonly string[]): boolean {
  return prefixes.some(
    (p) =>
      pathname === p ||
      pathname.startsWith(`${p}/`) ||
      (p.endsWith("-") && pathname.startsWith(p)),
  );
}

/** True if `pathname` is an operator/governance console that shows the internal chrome. */
export function isInternalChromeRoute(pathname: string): boolean {
  return matchesPrefix(pathname, INTERNAL_CHROME_PREFIXES);
}

/** True if `pathname` is an internal/operator/portal page that requires a session. */
export function isProtectedPage(pathname: string): boolean {
  return matchesPrefix(pathname, PROTECTED_PAGE_PREFIXES);
}
