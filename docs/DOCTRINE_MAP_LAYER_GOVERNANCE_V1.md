# Doctrine: Map Layer Governance V1

**ID:** MAP_LAYER_GOVERNANCE_V1  
**Version:** 1.0.0  
**Effective:** 2026-06-05  
**Owner:** Platform Governance  
**Volume Reference:** Ares Volume III §Map Asset Governance  
**Companion Doctrine:** AUTHORITATIVE_MAP_ASSET_INGESTION_V1

---

## Governing Principle

The Living Opportunity Map is a discovery layer, not a surveillance tool.

It reveals regions, patterns, history, and opportunity — never the visitor.

Every layer, every story, and every historical context note must be governed by this principle. No layer may surface individual property records, owner names, or visitor-identifying information without an explicit human review gate.

---

## Furlong Discovery Principle

**"The map reveals opportunities, not the visitor."**

This language must be preserved in every public-facing surface that uses map or geographic data. It appears:
- In component JSDoc and comments
- In homepage disclosure text
- In story card privacy notes
- In featured exploration theme definitions

---

## Layer Architecture

The map layer system is designed for independent extension. Adding a new layer does not require modifying the base map rendering code.

### Required Layer Properties

Every layer definition in `src/lib/maps/mapLayerRegistry.ts` must include:

| Field | Requirement |
|-------|------------|
| `id` | One of the approved `MapLayerId` values |
| `label` | Short, plain-language name |
| `description` | What data the layer contains |
| `editorialNote` | How to use/interpret the layer honestly |
| `isAvailable` | `false` until data has been ingested and verified |
| `primarySourceIds` | All sources must be in `mapSourceRegistry.ts` |
| `minimumAuthorityTier` | `tier-1-federal` unless explicitly approved otherwise |
| `supportedPeriods` | Must match periods defined in `historicalLayerRegistry.ts` |
| `homepageVisible` | `true` only if appropriate for visitor discovery |

### Approved Layer IDs

The following layer IDs are canonical. No new layer ID may be added without updating this doctrine.

| ID | Purpose |
|----|---------|
| `modern` | Current Census boundary data |
| `historical` | USGS/BLM historical data (decade-level) |
| `opportunity` | Program eligibility and financing zones |
| `program` | Federal and state program boundaries |
| `agriculture` | Cropland and soil classification |
| `environmental` | Watershed, wetland, and conservation areas |
| `infrastructure` | Transportation, utilities, community facilities |

### Adding a New Layer

To add a new layer:

1. Add the source to `mapSourceRegistry.ts` if not already present
2. Add the layer definition to `mapLayerRegistry.ts` with `isAvailable: false`
3. Write the ingestion script for that layer's data
4. Write the verification logic
5. Set `isAvailable: true` only after successful ingestion and verification
6. Update this doctrine with the new layer ID

---

## Historical Period Governance

### Approved Periods

Only the following period IDs may be used in `FeaturedStory.period` or layer definitions:

| ID | Label | Year Range |
|----|-------|-----------|
| `1860s` | 1860s | 1857–1872 |
| `1900s` | 1900s | 1895–1915 |
| `1950s` | 1950s | 1948–1962 |
| `1980s` | 1980s | 1978–1992 |
| `current` | Current | 2020–present |

Periods between these anchor points may be added when authoritative data exists. Each new period requires:
- Documented source in `mapSourceRegistry.ts`
- Period definition in `historicalLayerRegistry.ts`
- Verification logic in the relevant verify script
- Doctrine update

### Historical Data Ingestion Gate

Historical layer data may not be served to visitors until:
1. Source data is ingested from an approved source in `mapSourceRegistry.ts`
2. Content hash is computed and recorded in metadata
3. Feature count is verified
4. Geometry is validated
5. A replay_ref is generated and recorded
6. `verify:map-assets` (or the equivalent layer-specific verifier) passes

Setting `isAvailable: true` in `historicalLayerRegistry.ts` before these conditions are met is a governance violation.

---

## Featured Exploration Theme Governance

### Approved Themes

All editorial themes must be defined in `src/lib/maps/featuredExplorationRegistry.ts`. Themes not listed there are not approved for homepage or journey use.

### Required Theme Properties

Every theme definition must include:

| Field | Requirement |
|-------|------------|
| `id` | Canonical kebab-case slug |
| `label` | Short, plain-language name |
| `homepageTeaser` | One sentence, discovery-oriented, not marketing |
| `description` | Educational description of what the theme reveals |
| `perspective` | `"modern"`, `"historical"`, or `"evolution"` |
| `relevantLayers` | Layers that support this theme (may include unavailable layers) |
| `relevantPeriods` | Periods relevant to this theme |
| `discoveryPrompt` | What a visitor might explore — advisory only |
| `privacyNote` | Explicit statement that no individual-level data is shown |

### Privacy Note Requirement

Every theme must include a `privacyNote` field that explicitly states the data is regional/pattern-level, not individual-level. This is not optional.

---

## Featured Exploration Story Governance

### Story Types

Stories may have one of three `theme` values:

| Value | Meaning | Visual Treatment |
|-------|---------|-----------------|
| `modern` | Contemporary opportunity context | Blue badge |
| `historical` | Historical context as primary focus | Amber badge |
| `evolution` | Then-to-now comparison | Green badge |

### Historical Context Field

When a story has `historicalContext`, that text must:
- Be sourced from or consistent with publicly available federal data (USGS, BLM, USDA, Census)
- Be clearly labeled as historical/educational context
- Not imply individual-level specificity (no names, no specific addresses)
- Be advisory in posture — "shaped," "influenced," "reveals," not "determines" or "requires"

### Geographical Coordinates

All `latLon` values in featured stories:
- Must be real geographic coordinates within the stated county
- Must use county centroids from Census TIGER as the primary reference
- Must not represent a specific property, address, or individual
- Must be documented as illustrative in the component JSDoc and story data comments

---

## Privacy Requirements — All Layers and Stories

The following are absolutely prohibited at any layer or story level:

1. **Visitor geolocation** — no layer or story may use or request the visitor's location
2. **Individual property records** — no layer may show specific property boundaries keyed to owner data
3. **Personalization language** — no map surface may use "near you," "your area," "based on your location"
4. **Exact addresses** — no coordinate, marker, or label may identify a specific address
5. **Surveillance aesthetics** — no layer may appear designed to track or identify individuals

---

## Source Authority Requirements

All layers must be sourced from sources registered in `mapSourceRegistry.ts`.

Minimum authority requirements by layer type:

| Layer Type | Minimum Tier |
|-----------|-------------|
| Base map (boundaries) | `tier-1-federal` |
| Historical overlays | `tier-1-federal` |
| Program boundaries | `tier-1-federal` |
| Opportunity zones | `tier-1-federal` |
| Environmental data | `tier-1-federal` |
| Agricultural data | `tier-1-federal` |
| Infrastructure data | `tier-1-federal` |
| Cartographic fallback only | `tier-3-public-domain` |

`tier-3-public-domain` sources (Natural Earth) may only be used as fallbacks when `tier-1-federal` sources are unavailable. They may never be the primary source for any layer that is visible in production.

---

## Homepage Simplicity Requirement

The homepage must never present a layer selector or time period chooser directly.

Historical and evolution context is surfaced through curated featured exploration stories — not through UI controls. Visitors discover context through storytelling, not through a GIS tool interface.

The homepage should feel: educational, trustworthy, exploratory, professional, timeless.

It must not feel: surveillance-oriented, gamified, data-heavy, or marketing-driven.

---

## Version History

| Version | Date | Change |
|---------|------|--------|
| 1.0.0 | 2026-06-05 | Initial doctrine — Build 47-A |
