# Merge review — build-44-b-logo-brand → main (2026-06-11)

**Reviewer note (disclosed):** builder and verifier are the same agent session
(Claude Code), per Caitlin's merge instruction of 2026-06-10/11. Every claim
below is backed by a rendered-DOM or deterministic-execution proof produced
during the session, not gate output alone.

## Scope of this merge (chunked commits, one reviewable unit each)
1. Place-fact adapters + core (Census geocoder leaf; OZ, HUBZone, FEMA/NPS
   adapters; place-facts lib incl. Module 22/23 activation records; internal
   place-facts page).
2. Property place-fact snapshots + ingests + reads (OZ 755 checked / 52
   designated; HUBZone 232; FEMA-SFHA 38 + National Register 17 across 681
   resolvable; NMTC 292; coverage invariant liveTotal == withAddress +
   withoutAddress holds at 755/755/0).
3. Source freshness (Treasury/GSA in the daily LIVE_FETCHERS; auction-date
   render-time expiry; image-rights Module 23 records PENDING/NOT_CLEARED).
4. Program registry + verification engine (14 programs cataloged; 4
   property-verifiable wired: OZ, HUBZone, NMTC, historic; locked language
   verbatim; verification ledger; paywall_candidate null on every entry —
   validator enforces).
5. Listing engine (broker + bank/REO; owner/FSBO refused at type level; counsel
   gate EMPTY by default — nothing renders anywhere; license render gate;
   weekly freshness; operator listing-review console).
6. Consent substrate (PII-free core ledger; affirmative/unbundled; stop/delete;
   ships dark pending counsel).
7. Public surfaces (counts map + guided intake dual entry; verified-only sweep —
   zero "may fit / may qualify" in the entire built output; B10/B11 fixes:
   current-vs-historical reconciliation + type-carrying drill-down).
8. Verify gates + config (11-gate suite; inverted may-fit guards; Railway cron
   doc for run:source-refresh daily + run:listing-freshness weekly).
9. Pre-session Build-52 WIP assets (carried on the branch before this session;
   committed separately so they are reviewable in isolation).

## Merge-critical items confirmed before merge (rendered/deterministic proof)
- **Fix 3 / July-1 cliff:** hud-151-839616 (Redesignated, expires 2026-06-30)
  reads current=true @2026-06-29 and current=false @2026-07-01 at render time.
  MERGED BEFORE JULY 1.
- **Living-Map may-fit sweep:** homepage DOM + full built output carry zero
  "may fit / may qualify"; verifyProperty fails on reintroduction (3 inverted
  guard clauses).
- **Coverage/overlay:** placeFactCoverage() = {liveTotal:755, liveWithAddress:755,
  liveWithoutAddress:0, checked:755, missing:0}; place-fact refresh writes an
  append-only ledger event per run.

## Exclusions
- **Monetization layer: NOT IN THIS MERGE because it was never built** (shelved
  until the Stuart session ~June 17–18 + counsel; recorded in session memory;
  registry validator blocks any paywall_candidate value).
- Runtime state (data/*) is git-ignored — no overlays/ledgers/approvals are
  committed; every approval remains a runtime human action.

## Outstanding (unchanged by this merge)
Counsel gates (listing go-live per state, consent wiring, photo rights);
USDA-rural dataset (no official machine source exists — probed and documented);
Tranche B/C research; tier economics. **Public Alpha remains PENDING** — merging
to main is integration, not launch.

## Gate evidence at merge time
verify: property · place-fact-claims · program-registry ·
public-surface-conformance · single-nav · internal-auth · module-separability ·
listing-engine · listing-follow-ons · listing-intake-gate · consent-model — ALL
PASS on the pre-merge tree; re-run on merged main (see commit history).
tsc --noEmit clean; production build exit 0.
