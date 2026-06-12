# MERGE NOTE — Reality Security blockers fold-in (DO NOT LOSE AT INTEGRATION)

**Date:** 2026-06-11 · **Applies when:** `build-security-cyber-resilience` and
`build-discovery-engine` are reconciled.

The five REALITY-* production blockers (REALITY-INPUT-001, REALITY-CONTEXT-001,
REALITY-URL-001, REALITY-PRIVACY-001, REALITY-OUTPUT-001) live as a SELF-CONTAINED
gate in `src/security/realityPlatform/realitySecurityDoctrine.ts` because the
cyber-resilience dashboard (`securityResilienceDashboard.ts`) exists only on the
other branch. **At branch integration:**

1. Fold `realitySecurityBlockers()` into the resilience dashboard's blocker set —
   the `{id, open}` contract matches its shape exactly; the fold-in is mechanical.
2. `productionReady()` on the combined dashboard must require BOTH blocker sets
   (cyber-resilience SEC-* AND REALITY-*) plus the human-review attestation.
3. **The self-contained blocker contract must NOT disappear** — keep
   `realitySecurityDoctrine.ts` as the source of truth for the REALITY-* states
   and have the dashboard read from it, so neither branch's gate weakens.
4. `verify:reality-security` and `verify:cyber-resilience` must both still PASS
   after the fold-in, and the combined dashboard must show all ten blockers.

**Standing constraints (reviewer decision 2026-06-11):**
- `CANDIDATE_SOURCES_LIVE` stays **false** and **REALITY-URL-001 stays OPEN** until
  a real licensed/live fetch path exists and is human-reviewed.
- `LIVE_FETCH_ACTIVATION_REVIEW_REQUIRED=true` — no live URL fetcher may be enabled
  until robots/rate-limit compliance, source quarantine, no-credential forwarding,
  no proprietary listing storage, SSRF protection, AND rendered output review are
  all verified (conditions enumerated in `realitySecurityDoctrine.ts`).

No merge or production enablement yet. Human review remains required.
