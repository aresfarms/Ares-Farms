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

## Module 23 — the legal read (CHECKED 2026-07-28: approval is clean)

Founder challenged the reuse-confirmation requirement; verified against VEDP's
own published policy the same day:

- **VEDP's copyright policy grants visitors fair-use permission** ("Permission
  is granted to website visitors to make fair use of the contents" —
  vedp.org/privacy-policy).
- **What Furlong ingested is structured facts** (addresses, acreage, zoning,
  sale status) from the official open-data ArcGIS API — facts are not
  copyrightable (Feist v. Rural Telephone), and the US has no database right.
- **The display posture is the safe pattern**: attribution on every listing,
  no prices invented, link-out to VEDP's own Site Selection portal — traffic
  flows TO VEDP, furthering their statutory marketing mission.

Verdict: the reuse-confirmation email is OPTIONAL goodwill (a warm
partner-development touch someday), **not a prerequisite**. Counsel backstop =
Stuart's scheduled pre-launch review (#34). Approve whenever ready.

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

## FOUNDER DECISION — 2026-07-29: STAYS OFF

Caitlin's call: leave VEDP dark. Reason: unresolved comfort on whether the
listings can legally be redisplayed, notwithstanding the fair-use read above.
Do NOT activate, do NOT re-pitch activation. The wiring stays as-is (PENDING,
zero public surfaces) so that IF counsel (Stuart pre-launch review, #34)
clears it later, activation remains a single founder click on
/source-legal-review — no rebuild needed. Until then this source is treated
as OFF for launch planning.
