# Data Refresh Calendar

What refreshes itself, what needs a hand-run, and on what cadence. Established
with the Tier-1 intelligence activation (2026-07-28). A quarterly scheduled
reminder ("data-refresh-calendar") fires on the 1st of Jan/Apr/Jul/Oct.

## Automatic — the daily source-refresh job (9:00 UTC), no hands

| Data | Mechanism |
|---|---|
| HUD / Treasury / GSA listings | live re-pull, `data/property-live/*` overlay |
| OZ + HUBZone place-facts for new properties | `placeFactRefresh` overlay |
| Capital rates (prime / 5-yr / SOFR) | keyless FRED, `capital-rates-live.json` |
| Grain + livestock prices (NASS) | `commodity-prices-live.json` — needs `nass_api_key_enabled=true` (ON since 2026-07-28) |
| Drought (USDM) + corn/soy crop conditions (NASS) | `weekly-ag-live.json` — ON since 2026-07-28 |

## Quarterly hand-run (the reminder covers these)

Run from the repo root; each rewrites its committed snapshot; commit + deploy after.

| Snapshot | Command | Notes |
|---|---|---|
| County cash rents | `npm run ingest:nass-cash-rents` | NASS annual survey (new data ~Sep) |
| County yields | `npm run ingest:nass-county-yields` | NASS annual (new data ~spring) |
| Farmland values | `npm run ingest:nass-farmland` | NASS annual (~Aug) |
| Input costs | `npm run ingest:nass-input-costs` | NASS Prices Paid, monthly |
| Grain bids | `npm run ingest:ams-grain-bids` | AMS MARS; weekly data, quarterly floor until MARS joins the job |
| FSA loan rates | `npm run ingest:fsa-rates` | FSA posts monthly |
| Mortgage rates (PMMS) | `npm run ingest:pmms-rates` | weekly data, quarterly floor |
| FHFA HPI | `npm run ingest:fhfa-hpi` | quarterly release |
| County tax context + tenure | `npm run ingest:census-tax-rates` / `ingest:census-tenure` | ACS annual (Dec) |
| HUD FMR | `npm run ingest:hud-fmr` | annual (Oct) |
| County broadband | `npm run ingest:fcc-broadband` | FCC BDC semiannual |
| Electricity | `npm run ingest:eia-electricity` | EIA annual |
| Hazard risk (FEMA NRI) | `npm run ingest:fema-nri` | occasional releases |
| Schools / colleges | `npm run ingest:nces-schools` / `ingest:nces-private-schools` / `ingest:ipeds-colleges` | annual releases |
| Property place-fact layers (soil, amenities, airports, military, geo, tenure, food access) | `npm run ingest:property-*` | as sources update; at minimum annually |

## Known gaps / follow-ups

- Grain bids in the daily job need a MARS_API_KEY mount (terraform, same pattern
  as NASS) + a bids overlay — queued.
- NREL key unverifiable from the dev laptop (network); it is unwired anyway —
  verify when first integrated.
- USDA resale listing feed is a 2022-vintage dataset (2014–2018 listings) —
  vintage is displayed honestly; nothing to refresh until USDA republishes.
