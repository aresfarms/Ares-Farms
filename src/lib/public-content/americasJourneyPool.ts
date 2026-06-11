/**
 * americasJourneyPool — Living Map, Phase 2/3
 *
 * EXTRA pool images for each stop, BEYOND the canonical then (americasJourneyImages.ts)
 * and now (americasJourneyNowImages.ts) images. The living-map pool for a stop is:
 *
 *     pool = [ IMAGES[id], ...EXTRA_IMAGES[id], NOW_IMAGES[id] ]   (renderable only)
 *
 * sorted by true `year`. Each ISO week the card pairs an EARLIER image
 * (pool[pairIndex]) with the LATEST image, so returning visitors see a fresh
 * pair as pools grow — the "revealed over time" promise.
 *
 * Phase 3 (the Smithsonian CC0 + LoC PD ingestion script) appends rights-clean
 * images here. Until then this is empty and every stop behaves exactly like its
 * existing then→now pair (fully backward compatible).
 *
 * RIGHTS DISCIPLINE (identical to the other registries):
 *   - Every entry must be CC0 (Smithsonian) or public domain / no known
 *     restrictions (LoC). Anything ambiguous is dropped, not shipped.
 *   - src must be a downloaded /public/journey/ path — never a hotlink.
 *   - credit + sourceUrl render visibly; year is the image's TRUE date.
 *   - verifyMapPhotos gates these the same way as IMAGES / NOW_IMAGES.
 *
 * "The map reveals opportunities, not the visitor."
 * Public Alpha remains PENDING.
 */

import type { ArchivalImage } from "./americasJourneyStops";
import { GENERATED_POOL } from "./americasJourneyPoolGenerated";

/**
 * Keyed by stop id (matches JourneyStop.id / TourPlace.id). Each value is a
 * chronologically-orderable list of additional rights-clean archival images.
 *
 * Populated by the ingestion pipeline (Phase 3): GENERATED_POOL is written by
 * src/scripts/ingestJourneyPool.ts from the weekly journeyPoolManifest.ts.
 * Hand-curated additions (if ever needed) can be merged in here too.
 */
export const EXTRA_IMAGES: Record<string, ArchivalImage[]> = { ...GENERATED_POOL };
