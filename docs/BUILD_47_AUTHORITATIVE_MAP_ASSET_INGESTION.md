# Build 47 — Authoritative Map Asset Ingestion

**Date:** 2026-06-05  
**Branch:** build-44-b-logo-brand  
**Status:** Complete — awaiting Public Alpha gate

---

## What This Build Does

Replaces the abstract opportunity network visual (Build 45) with a real, authoritative U.S. geographic map rendered from locally cached GeoJSON assets sourced from the U.S. Census Bureau.

The Living Opportunity Map now renders actual state boundary polygons using the Albers USA composite projection. Featured exploration markers are placed at real geographic coordinates within each featured county. No fake map silhouette may ship under any circumstances.

---

## Why This Was Needed

The Build 45 implementation used an abstract decorative network because no authoritative map asset existed. That placeholder was acceptable as a temporary measure. Build 47 resolves the gap permanently by:

1. Establishing a governed asset ingestion pipeline from U.S. Census Bureau TIGER Web Services
2. Implementing a full Albers USA projection natively in the component (no new dependencies)
3. Writing a verifier that enforces the "no fake map" rule as a deployment gate
4. Creating a fallback visual that is clearly labeled as non-geographic

---

## Files Created or Modified

### New — Library

| File | Purpose |
|------|---------|
| `src/lib/maps/mapSourceRegistry.ts` | Canonical registry of approved geographic data sources, authority tiers, and asset specifications |
| `src/lib/maps/mapAssetIngestionRuntime.ts` | Runtime guard, SHA-256 hash, replay ref, and GeoJSON assertion utilities |

### New — Scripts

| File | npm Script | Purpose |
|------|-----------|---------|
| `src/scripts/ingestMapAssets.ts` | `ingest:map-assets` | Downloads state and county GeoJSON from Census TIGER, writes to `public/maps/`, computes hashes |
| `src/scripts/verifyMapAssets.ts` | `verify:map-assets` | Validates all map assets against governance requirements; fails deployment if any check fails |
| `src/scripts/mapAssetSmokeTest.ts` | `smoke:map-assets` | 33 smoke tests for the verification logic |

### New — Assets (generated, not committed)

| File | Contents |
|------|---------|
| `public/maps/us-states.geojson` | 56 state/territory features from Census TIGER |
| `public/maps/us-counties.geojson` | 5 featured county features from Census TIGER |
| `public/maps/us-map-metadata.json` | Provenance, content hashes, authority, license, replay_ref |

### Modified — Component

| File | Change |
|------|--------|
| `src/components/customer/LivingOpportunityMap.tsx` | Full rewrite — removed abstract network, added Albers USA projection and real GeoJSON rendering |

### Modified — Data

| File | Change |
|------|--------|
| `src/lib/customer-landing/featuredExplorationStories.ts` | Added `latLon` to `FeaturedStory` and `ExplorationNode` types; added real county centroid coordinates to all 5 stories |

### Modified — Configuration

| File | Change |
|------|--------|
| `package.json` | Added `ingest:map-assets`, `verify:map-assets`, `smoke:map-assets` scripts |

### New — Docs

| File | Purpose |
|------|---------|
| `docs/BUILD_47_AUTHORITATIVE_MAP_ASSET_INGESTION.md` | This file |
| `docs/DOCTRINE_AUTHORITATIVE_MAP_ASSET_INGESTION_V1.md` | Governing doctrine for map asset ingestion |

---

## How to Run (Instructions for Operator)

You are an environmental engineer, not a software engineer. Here are plain-language steps.

### Step 1 — Download the map data

Run this command in the terminal from the project folder:

```bash
npm run ingest:map-assets
```

**What it does:** Downloads real U.S. state and county boundary data directly from the U.S. Census Bureau. Saves it to `public/maps/`. Takes about 5–15 seconds.

**Successful output looks like:**
```
=== Ingestion complete ===
Run `npm run verify:map-assets` to confirm assets are valid.
```

**If it fails:** You will see an error message with HTTP status (e.g., "HTTP 503"). The Census server may be temporarily unavailable. Wait a few minutes and try again.

### Step 2 — Verify the assets

```bash
npm run verify:map-assets
```

**Successful output ends with:**
```
=== PASS: All map asset verification checks passed ===
```

**If it fails:** The error message tells you exactly what is wrong. Re-run `npm run ingest:map-assets` and then `npm run verify:map-assets` again.

### Step 3 — Run smoke tests (optional, confirms the verifier itself works)

```bash
npm run smoke:map-assets
```

**Successful output ends with:**
```
✓ SMOKE TESTS PASSED — all 33 assertions verified.
```

### Step 4 — Build the application

```bash
npm run build
```

**Successful output includes:**
```
✓ Compiled successfully
```

---

## Verified Results (2026-06-05)

| Check | Result |
|-------|--------|
| `smoke:map-assets` | ✓ 33/33 passed |
| `verify:map-assets` | ✓ All checks passed |
| `npx tsc --noEmit` | ✓ Clean |
| `npm run build` | ✓ Compiled successfully |
| States ingested | 56 (50 states + DC + territories) |
| Counties ingested | 5 (one per featured exploration) |
| Source authority | tier-1-federal (Census Bureau, public domain) |
| replay_ref | MAP_ASSET_INGESTION_2026-06-05T16-57-16 |

---

## Map Rendering Notes

### Projection

The component implements the Albers USA composite projection natively (no external library). The lower 48 states use Albers Equal-Area Conic (standard for U.S. thematic maps). Alaska and Hawaii are placed in conventional inset positions.

### Geographic Coordinates

Featured exploration markers use real county centroid coordinates from Census TIGER data. These are illustrative positions — they identify a region, not a specific property, address, or person.

| Story | State | County | Lat/Lon |
|-------|-------|--------|---------|
| Property & Land | Tennessee | Maury County | 35.617°N, 87.101°W |
| Farms & Agriculture | Iowa | Story County | 42.034°N, 93.457°W |
| Small Business | Pennsylvania | Lancaster County | 40.038°N, 76.251°W |
| Environmental | Missouri | Boone County | 38.970°N, 92.324°W |
| Housing | North Carolina | Catawba County | 35.661°N, 81.175°W |

### Fallback

If map assets are not available at page load time, the component renders an abstract opportunity network visual labeled "Opportunity Network — Map asset temporarily unavailable." This is distinct from a fake U.S. map and is acceptable as a degraded state.

---

## Public Alpha Status

Public Alpha remains **PENDING**. This build completes the map surface correction required before Alpha but does not itself authorize Alpha launch.

---

## Governing Doctrine

See `docs/DOCTRINE_AUTHORITATIVE_MAP_ASSET_INGESTION_V1.md` for the full doctrine governing this system.
