# VEDP Activation Packet — Module 22/23 Founder Decision

Prepared 2026-07-28. The wiring is DONE and PROVEN DARK: 1,712 for-sale
Virginia records flow through the canonical pipeline but appear on **zero
public surfaces** until you approve both modules on **/source-legal-review**
(the same screen where you approved HUD/Treasury/GSA on 7/19).

## What approval turns on

- ~1,712 Virginia commercial buildings + development sites join the inventory
  (~3× today's listing count), on the map counts, explore hub, and analysis
  entry — each carrying "Source: VEDP — Virginia Economic Development
  Partnership (vedp.org)".
- Honesty postures already coded: no prices in the feed → "Price on request"
  (never invented); no per-listing URLs → link-out to VEDP's official Site
  Selection portal (verified live); lease-only records excluded; VEDP-specific
  "how these actually sell" mechanics copy (directory, not auction; terms come
  from the owner/locality).

## Module 23 — the legal decision (the real one)

**VEDP is a STATE source, not federal public domain.** Its open-data portal
carries disclaimer-style terms, and the ingest was performed against the
official ArcGIS open-data REST service (the HTML portal is NOT scraped).
The outstanding item recorded at ingest: **an explicit reuse confirmation from
VEDP.**

Recommended before approving, one of:
1. **Email VEDP** (info@vedp.org or your economic-development contact) asking
   to confirm redisplay of their available-properties open data with
   attribution — the partner-not-compete posture also makes this a warm
   business-development touch, not just legal cover; or
2. **Counsel review** of the portal terms concluding they suffice without a
   confirmation.

The Module 23 entry on the review screen restates this so the approval record
carries the reasoning.

## Module 22 — activation facts

Ingest method: official ArcGIS REST JSON (no scraping, no auth); snapshot
committed 2026-07-18; `liveFetchAllowed` stays **false** (refresh = re-run
`npm run ingest:vedp-properties`, or wire a live fetcher later under its own
review).

## How to approve (when ready)

1. Sign in and open **/source-legal-review** on staging.
2. Find "VEDP — Virginia Economic Development Partnership".
3. Approve Module 23 (paste your reasoning — e.g. the reuse-confirmation email
   date), approve Module 22, set the source live.
4. Effect is immediate (runtime activation overlay) — no deploy needed.
