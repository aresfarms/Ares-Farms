# Scraper Expansion Plan — 2026-07-15

## Objective

Expand Furlong's property inventory in a way that strengthens the property-evaluation workflow while preserving the platform's current compliance posture:

- provenance first
- replayable ingest
- public-safe DTO boundaries
- Module 22 live-scraper activation discipline
- Module 23 source legal/licensing discipline
- audit evidence for every source decision

This plan assumes Public Alpha posture remains in force:

- no uncontrolled live fetch promotion
- no silent source activation
- no public source-certainty claims beyond the approved DTO rules
- no legal reliance

## Expansion Principles

Every new source must clear these checkpoints before it can influence a public property surface:

1. Source fit
- The source must add inventory that improves real buyer/operator exploration, not just volume.
- Preference goes to sources that improve rural, commercial, mixed-use, SBA-relevant, USDA-relevant, hospitality, and adaptive-reuse discovery.

2. Rights clarity
- We prefer official government APIs, open-data feeds, or explicit permission-based partner feeds.
- We do not treat public website visibility as permission.
- Photos, broker remarks, floorplans, and branded assets must be treated separately from basic listing facts.

3. Auditability
- Each source needs a registry profile, provenance chain, replay refs, content hashes, classification events, and decision logging.
- Human approval remains required for any move from staged ingest to public rendering.

4. Public DTO safety
- Public surfaces must keep using address-safe/public-safe projections where appropriate.
- Exact-address/detail views stay limited to the governed property surfaces already designed for them.

## Priority Tiers

### Tier 1 — Best next targets

These are the strongest next candidates because they are the most realistic from a compliance and implementation standpoint.

1. More official federal/state/local public inventory feeds
- county surplus property portals
- state land bank inventories
- municipal redevelopment authority inventories
- state auction or surplus real-estate feeds

Why these first:
- strongest rights posture
- strongest provenance posture
- easiest to defend in Module 23 review
- best fit with current government-property framing

2. Permission-based institutional or partner feeds
- bank REO partner exports
- CDFI/community-development partner inventory feeds
- regional economic-development or land-reuse partner inventories

Why next:
- strategically strong for commercial and mixed-use inventory
- can improve SBA/USDA-adjacent evaluation paths
- cleaner than scraping commercial listing sites without rights

3. Structured broker submissions with explicit consent
- broker-uploaded or broker-syndicated feeds with documented permission
- listing-owner affirmations and rights metadata

Why third:
- can materially grow supply
- but requires stronger media-rights, freshness, and accountable-party governance

### Tier 2 — Hold unless rights become explicit

1. Marketplace listing portals without explicit ingestion rights
- broad commercial portals
- broad residential portals
- aggregator sites with unclear redistribution terms

Status:
- treat as research targets only
- no public ingest promotion until permission, retention, republication, and anti-bulk use are clearly approved

2. Image-heavy public listing pages
- especially where third-party broker photography dominates

Status:
- text/data may be separable
- images should default to blocked unless rights are explicit

## Concrete Build Sequence

### Phase A — Source selection packet

For each candidate source, create a source packet with:

- source name
- owner/operator
- source type: government / partner / broker / aggregator
- access method: API / CSV / HTML / manual export / partner feed
- public-display rights posture
- retention posture
- anti-bulk posture
- image-rights posture
- update cadence
- geographic coverage
- inventory type coverage
- expected value to Furlong pathways

Deliverable:
- one review sheet per candidate source before any adapter work

### Phase B — Technical adapter prototype

For sources that survive first review:

- add adapter with explicit user agent/contact
- canonicalize into the existing property record shape
- preserve source URL, fetched-at, content hash, replay ref, connector id, scraper version
- generate public-safe projection plus detail projection
- run source-specific smoke fixtures with frozen local samples before any live runtime usage

Deliverable:
- adapter code
- fixture sample
- generated local dataset
- provenance evidence

### Phase C — Governance and audit wiring

Before public use:

- register source in source governance/runtime structures
- ensure Module 22 and Module 23 review surfaces can see the source
- log review decisions through the existing audit/event posture
- confirm public DTO constraints and claims language
- add any source-specific disclosure text required by rights posture

Deliverable:
- source appears in governance surfaces with blocked-by-default posture
- audit events generated for review decisions

### Phase D — Public-surface integration

Only after the above:

- include the source in explore/property evaluation flows
- attach verified place-facts where possible
- keep property evaluation language advisory-only
- block any public claim that outruns the source's approval posture

Deliverable:
- controlled rollout to property surfaces

## Recommended First Source Wave

### Wave 1

1. Land banks and redevelopment authorities
- best fit for adaptive reuse, rural redevelopment, and community-oriented commercial use

2. County or state surplus real-property inventories
- strong official-source posture
- often overlooked inventory

3. Additional federal or quasi-public auction/property feeds already compatible with the current property model
- easiest to extend from current HUD/USDA/Treasury/GSA patterns

### Wave 2

1. Permission-based bank REO feeds
2. Permission-based partner broker feeds
3. Structured commercial inventory feeds with explicit rights

### Wave 3

1. Higher-friction portal or marketplace integrations
- only if we obtain clean permission and can certify replay, provenance, media rights, and public-display boundaries

## What Must Be True Before Any New Source Goes Live

1. Module 23 review is recorded for:
- ToS
- licensing
- anti-bulk posture
- retention
- republication
- public display
- image/media rights

2. Module 22 review is recorded for:
- adapter readiness
- provenance
- replay
- monitoring
- rollback
- incident posture
- source-specific activation controls

3. Verification passes include:
- `npm run verify:scraper-source-intelligence`
- `npm run smoke:scraper-source-apis`
- `npm run smoke:source-legal-review`
- `npm run smoke:live-scraper-activation`
- `npm run verify:public` when a public surface changes

4. Audit posture is confirmed:
- source decision events recorded
- scraper run events recorded
- provenance/replay data present
- no silent source activation path

## Immediate Next Implementation Recommendation

Build the first source-selection packet set for 6 targets:

1. 2 land-bank or redevelopment sources
2. 2 county/state surplus real-property sources
3. 1 permission-based institutional feed target
4. 1 explicit-risk commercial portal target kept in research-only status

That will let us sort the roadmap into:

- greenlight next
- needs legal review first
- partner-permission path
- do not ingest

## Product Fit Note

The new property-evaluation workspace means new sources should be judged not only on listing volume, but on whether they improve:

- USDA/SBA-style pathway exploration
- commercial adaptive-reuse discovery
- mixed-use and rural business opportunity discovery
- exportable evaluation-report quality
- verified place-fact coverage

If a source adds a lot of listings but weakens those five things, it should not outrank a smaller, cleaner source.

## First 6 Real Source Targets

### 1. Michigan State Land Bank Authority
- Label: `greenlight next`
- Type: state land bank inventory
- Why it belongs:
  - official state-operated property inventory
  - large property volume
  - strong fit for redevelopment, housing, land, and adaptive reuse exploration
- Public entrypoint:
  - `https://www.michigan.gov/leo/bureaus-agencies/landbank`

### 2. Oklahoma Department of Transportation Surplus Right-of-Way and Land for Sale
- Label: `greenlight next`
- Type: state surplus real-property inventory
- Why it belongs:
  - official state source
  - land-focused inventory
  - strong fit for public-sector land and surplus-property discovery
- Public entrypoint:
  - `https://oklahoma.gov/odot/business-center/land-for-sale.html`

### 3. Pennsylvania Commonwealth-Owned Surplus Property (Real Estate)
- Label: `greenlight next`
- Type: state surplus real-estate inventory
- Why it belongs:
  - official state source
  - explicit real-estate disposition process
  - good fit for adaptive reuse and institutional/public property opportunities
- Public entrypoint:
  - `https://www.pa.gov/services/dgs/purchase-commonwealth-owned-surplus-property-real-estate`

### 4. City of Philadelphia / PHDC City-Owned Property Inventory
- Label: `greenlight next`
- Type: city-owned redevelopment inventory
- Why it belongs:
  - large official city-managed inventory
  - strong public-benefit and redevelopment relevance
  - can add urban redevelopment and distressed-property pathways
- Public entrypoint:
  - `https://www.phila.gov/services/property-lots-housing/buy-sell-or-rent-a-property/find-a-city-owned-property/`

### 5. City of St. Louis Available City-Owned Property Search
- Label: `greenlight next`
- Type: city-owned property search
- Why it belongs:
  - official municipal inventory search
  - useful for redevelopment, infill, and public-to-private transition inventory
  - good fit for modular property evaluation workflows
- Public entrypoint:
  - `https://www.stlouis-mo.gov/government/property/city-owned-property-search.cfm`

### 6. Westmoreland County Site Selection Database
- Label: `permission-needed`
- Type: county economic-development property database
- Why it belongs:
  - stronger commercial and development-site fit
  - useful for broader SBA/commercial pathway exploration
  - likely higher rights/partner-review complexity than pure public-domain government listings
- Public entrypoint:
  - `https://www.westmorelandcountypa.gov/577/Site-Selection`

## Hold / Research Source

Use this as the reference example for a source we research but do not prioritize for ingest without explicit approval:

### Research Hold Example — portal-driven commercial marketplace feeds
- Label: `hold`
- Reason:
  - often valuable inventory
  - but highest risk on ToS, anti-bulk, retention, republication, and media-rights review
  - should not outrank cleaner official or permission-based sources
