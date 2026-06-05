# Build 47-A — Historical & Modern Opportunity Map System

**Date:** 2026-06-05  
**Branch:** build-44-b-logo-brand  
**Extends:** Build 47 (Authoritative Map Asset System)  
**Status:** Complete — awaiting Public Alpha gate

---

## What This Build Does

Extends the Living Opportunity Map from a modern geographic display into a discovery layer that reveals historical context, agricultural heritage, infrastructure evolution, and conservation history — alongside modern opportunity paths.

The map becomes part of the Furlong discovery experience, not merely a background graphic.

---

## New Architecture

### Source Authority Registry (extended)

`src/lib/maps/mapSourceRegistry.ts` now includes **11 sources** across 5 federal agencies:

| Source ID | Agency | Data Types | Historical? |
|-----------|--------|-----------|-------------|
| `census_tiger_rest` | U.S. Census Bureau | State/county boundaries | No |
| `census_cartographic` | U.S. Census Bureau | Cartographic boundaries | No |
| `usgs_national_map` | USGS | Terrain, hydro, transport | No |
| `usgs_htmc` | USGS | Historical topographic maps (1882–2006) | **Yes** |
| `usgs_gnis` | USGS | Geographic names | **Yes** |
| `usda_nrcs` | USDA | Soils, conservation programs | **Yes** |
| `usda_fsa` | USDA | Aerial imagery, cropland data | **Yes** |
| `blm_glro` | BLM | Land patents, original surveys (1780s+) | **Yes** |
| `blm_national_surface` | BLM | Public land boundaries | No |
| `noaa_climate` | NOAA | Climate, flood, drought history | **Yes** |
| `noaa_coast` | NOAA | Coastal change, wetlands | **Yes** |
| `nps_boundaries` | NPS | Protected lands with designation dates | **Yes** |
| `natural_earth` | N/A (public domain) | Cartographic fallback | No |

Every source includes: authority tier, update frequency, public domain status, data types, historical capability, and licensing notes.

### Map Layer Registry

`src/lib/maps/mapLayerRegistry.ts` defines 7 independent overlay layers:

| Layer | Status | Sources |
|-------|--------|---------|
| `modern` | **Available** | Census TIGER |
| `historical` | Architecture ready — data not yet ingested | USGS HTMC, BLM GLO |
| `opportunity` | Architecture ready | USDA, BLM, Census |
| `program` | Architecture ready | USDA, NPS |
| `agriculture` | Architecture ready | USDA NRCS, FSA |
| `environmental` | Architecture ready | NOAA, USGS |
| `infrastructure` | Architecture ready | USGS, Census |

Adding a new layer does not require rebuilding the base map. Each layer has a governing source list and `isAvailable` flag. The homepage only shows `homepageVisible: true` layers that are also `isAvailable: true`.

### Historical Period Registry

`src/lib/maps/historicalLayerRegistry.ts` defines 5 historical periods:

| Period | Year Range | Data Available | Primary Sources |
|--------|-----------|---------------|----------------|
| 1860s | 1857–1872 | No (architecture ready) | USGS HTMC, BLM GLO |
| 1900s | 1895–1915 | No (architecture ready) | USGS HTMC, GNIS, BLM |
| 1950s | 1948–1962 | No (architecture ready) | USGS HTMC, NOAA, USDA |
| 1980s | 1978–1992 | No (architecture ready) | USGS HTMC, USDA FSA, NOAA |
| Current | 2020–2026 | **Yes** | Census TIGER |

### Featured Exploration Registry

`src/lib/maps/featuredExplorationRegistry.ts` defines 7 editorial themes:

| Theme | Perspective | Relevant Layers |
|-------|------------|-----------------|
| Historic Agriculture | Evolution | modern, agriculture, historical |
| Historic Rail Corridors | Evolution | modern, infrastructure, historical |
| Land Stewardship Evolution | Evolution | modern, environmental, program, historical |
| Water Resource History | Evolution | modern, environmental, historical |
| Community Growth Patterns | Evolution | modern, infrastructure, historical |
| Conservation Success Stories | Historical | modern, environmental, program |
| Regional Industry Evolution | Evolution | modern, infrastructure, agriculture, historical |

Each theme includes: editorial description, discovery prompt, relevant time periods, and a privacy note confirming no individual-level data is surfaced.

---

## New Featured Stories (Historical)

Three educational discovery stories added alongside the 5 existing modern stories:

### Illinois — McLean County
**Theme:** Evolution | **Period:** 1870s → Today  
**Story:** Historic Rail Corridors  
The Illinois Central and Chicago & Alton railroads made Bloomington-Normal a Midwest hub in the 1870s. Those infrastructure decisions shaped where agriculture markets, logistics operations, and businesses concentrated — patterns still visible today.

### Kansas — Harvey County
**Theme:** Evolution | **Period:** 1874 → Today  
**Story:** Agricultural Transformation  
Mennonite settlers brought Turkey Red wheat to Harvey County in 1874, transforming the central plains into a global grain producer. That agricultural heritage shapes today's land values, program eligibility, and conservation obligations.

### Oregon — Linn County
**Theme:** Evolution | **Period:** 1950s → Today  
**Story:** Conservation History  
Oregon's post-WWII timber boom transformed Linn County. By the 1990s, federal land policy changes created new stewardship obligations and conservation program opportunities that landowners continue navigating today.

---

## Homepage User Experience

The homepage remains simple. Visitors see 8 rotating featured explorations — modern and historical/evolution — without a layer selector or time period chooser.

Historical stories surface as educational context in the story card:
- A color-coded badge ("Then & Now / Illustrative evolution" in green, "Historical Exploration" in amber)
- A time period label (e.g., "1870s → Today")
- An italic historical context note explaining the regional history

The map area always shows the modern U.S. base map (Census GeoJSON). Historical context is editorial — it lives in the story card, not in a separate map tile.

Visitors feel: **"There is always something interesting to discover."**

---

## Files Created or Modified

### New

| File | Purpose |
|------|---------|
| `src/lib/maps/mapLayerRegistry.ts` | All 7 layer definitions |
| `src/lib/maps/historicalLayerRegistry.ts` | 5 historical periods |
| `src/lib/maps/featuredExplorationRegistry.ts` | 7 editorial themes |

### Modified

| File | Change |
|------|--------|
| `src/lib/maps/mapSourceRegistry.ts` | Expanded from 3 to 13 sources; 3 new county queries |
| `src/lib/customer-landing/featuredExplorationStories.ts` | Added `theme`, `themeId`, `period`, `historicalContext` to type; added 3 historical stories |
| `src/components/customer/LivingOpportunityMap.tsx` | Historical theme badges, period display, historical context note |
| `src/scripts/verifyMapAssets.ts` | Added IL, KS, OR to expected states list |

---

## Verification Results (2026-06-05)

| Check | Result |
|-------|--------|
| `smoke:map-assets` | ✓ 33/33 |
| `verify:map-assets` | ✓ All checks passed |
| `verify:customer-journey` | ✓ |
| `verify:disclosures` | ✓ |
| `verify:no-personal-docs` | ✓ |
| `npx tsc --noEmit` | ✓ Clean |
| `npm run build` | ✓ Compiled |
| Counties ingested | 8 (5 modern + 3 historical) |
| replay_ref | MAP_ASSET_INGESTION_2026-06-05T17-08-10 |

---

## Privacy Posture

All 7 featured exploration themes include an explicit privacy note confirming no individual-level data is surfaced. Every story shows regions and patterns — not property records, owner names, or individual identification.

"The map reveals opportunities, not the visitor."

---

## Public Alpha Status

Public Alpha remains **PENDING**. Build 47-A does not authorize Alpha launch.

---

## Governing Doctrine

See `docs/DOCTRINE_MAP_LAYER_GOVERNANCE_V1.md` for the full doctrine governing the layer system.
