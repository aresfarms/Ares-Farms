# NAVIGATOR-REFRESH-ERROR-001 — root cause + fix

## Symptom
Refreshing `/navigator` or `/discover` returned **"Internal Server Error"**.

## Investigation
Reproduced and isolated across both server modes:

| Mode | /discover | /navigator | Notes |
|---|---|---|---|
| `next start` (production build) | **HTTP 200** | **HTTP 200** | direct load + 3× refresh, with AND without `NEXTAUTH_SECRET`; valid per-request nonce; no server error |
| `next dev` (after a concurrent `.next` wipe/build) | **HTTP 500** | **HTTP 500** | server log: `ENOENT … .next/dev/server/.../build-manifest.json` |

Ruled OUT as causes (all verified working):
- force-dynamic root layout — renders per request, 200.
- nonce-CSP proxy/header code — nonce present on every refresh, no CSP violation.
- middleware/proxy request handling — public pages fall through cleanly.
- localStorage/session hydration — `loadJourneyIfOptedIn()` is fully crash-safe
  (try/catch → null on corrupt JSON; null on SSR/no-window; null on bad shape).
- route path mismatch — `/navigator` re-exports the `/discover` default surface; both resolve.
- missing env var — public pages do not require `NEXTAUTH_SECRET`; 200 either way.
- server component error — no SSR exception in production.
- redirect/auth wall — public routes are not gated.

## Root cause
A **corrupted `.next/dev` cache**: when `.next` is wiped or a production
`next build` runs **while the dev server is live**, the dev server's manifests
disappear mid-flight and every route 500s with `ENOENT … build-manifest.json`.
This is a tooling/cache failure, not application code — the route SSRs cleanly
on a real production build.

## Fix
1. **Operational:** never run a production `next build` against a live dev
   server. To recover a corrupted dev cache: `npm run dev:clean` (wipes
   `.next` + caches and restarts), or stop the dev server, `rm -rf .next`, and
   restart.
2. **Regression lock:** `npm run verify:navigator-refresh` asserts, on the
   production server, that `/discover` and `/navigator` survive direct load and
   repeated refresh (HTTP 200, nonce-CSP intact, no Internal Server Error,
   Navigator SSR'd), and that the saved-journey load path starts clean on
   corrupt / missing / SSR input without throwing.

## Posture
No doctrine, routing behavior, CSP, or production posture changed. Nonce-CSP was
not weakened or disabled. The saved/anonymous journey behavior is unchanged and
verified crash-safe.
