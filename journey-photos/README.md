# Journey Photos — Drop Here

Drop your own present-day photos for the America's Journey map in this folder. Your photos are the
cleanest images we can use — Furlong owns them outright, no copyright strings — and they bring the
"now" half of the map to life where the public archives only have old images.

## How to add a photo
1. Take a photo of one of the places on the shot list below (or any stop's location).
2. Name the file: `<stop-id>__<year>__<short-description>.jpg`
   - Example: `barre-granite-1880s__2026__hope-cemetery.jpg`
   - `stop-id` = the id from the list below. `year` = when you took it. `description` = a couple of
     words, no spaces (use dashes).
3. Drop it in this folder. That's it.

The weekly run picks it up (`npm run ingest:journey-pool`), **strips the hidden GPS/location data from
the file for privacy**, credits it "Furlong original photography, &lt;year&gt;," and adds it as the
present-day image for that stop.

## Privacy
- Phone photos carry hidden GPS coordinates (EXIF). Ingestion strips that automatically before anything
  is published — the published copy under `/public/journey/` has no EXIF.
- Raw drops in this folder are **git-ignored** (never committed), so the original-with-GPS never leaves
  your machine. Only the stripped, published copy is committed.
- As a habit, shoot public places only; avoid anything showing your home, vehicle plates, or personal
  details.

## Shot list — stops that most need a present-day photo
Grab whatever's on your route; anything you don't photograph just stays on its archival image. No rush.

| stop-id | Place | Suggested shot |
|---|---|---|
| `mississippi-delta-chinese-1870s` | Mississippi Delta (e.g. Clarksdale, MS) | A Delta main street or storefront today |
| `spindletop-1901` | Beaumont, TX (Spindletop / Gladys City) | The re-created boomtown derrick / museum |
| `barre-granite-1880s` | Barre, VT | Hope Cemetery monuments or the Rock of Ages quarry |
| `basque-boise-1890s` | Boise, ID (the Basque Block) | The Basque Center / Block streetscape |
| `great-migration-1916-1970` | Chicago, IL (Bronzeville) | "Monument to the Great Northern Migration" |
| `wall-street-1653` | New York, NY | Wall Street / NYSE façade |
| `california-delta-1882` | Locke, CA | Locke historic district main street |
| `greenwood-tulsa-1921` | Tulsa, OK (Greenwood) | Greenwood Ave / Greenwood Cultural Center |
| `pa-pithole` | Pleasantville, PA | The Pithole site today (fields / visitor center) |
| `pa-centralia` | Centralia, PA | The abandoned grid / reclaimed streets |
| `de-zwaanendael-lewes` | Lewes, DE | Zwaanendael Museum / old town Lewes |
| `de-twelve-mile-circle` | New Castle, DE | New Castle courthouse / the circle survey marker |
| `de-the-wedge` | DE/PA/MD corner | The Wedge boundary monument |
| `pa-york-capital` | York, PA | The colonial courthouse / town square |

(These are the stops where public archives have no clean recent photo. Known/federal places — national
parks, etc. — are being filled automatically from the Carol Highsmith collection and NPS galleries.)
