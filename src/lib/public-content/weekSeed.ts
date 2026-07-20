/**
 * isoWeekSeed — deterministic ISO-8601 week number (1–53) for a date.
 *
 * Shared by the server (homepage computes it and passes it to the map as a prop)
 * and any client code, so SSR and the client first render agree on the same week
 * → no hydration drift. Drives the Living-Map FEATURED-STOP rotation: the stop
 * the map opens on advances each week, so the map is not a fixed loop.
 *
 * Edge-safe: pure function, no I/O.
 */
export function isoWeekSeed(d: Date = new Date()): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = (date.getUTCDay() + 6) % 7; // Mon=0 … Sun=6
  date.setUTCDate(date.getUTCDate() - dayNum + 3); // nearest Thursday
  const firstThursday = date.getTime();
  date.setUTCMonth(0, 1);
  if (date.getUTCDay() !== 4) {
    date.setUTCMonth(0, 1 + ((4 - date.getUTCDay()) + 7) % 7);
  }
  return 1 + Math.round((firstThursday - date.getTime()) / 604_800_000);
}

/**
 * visitRotationSeed — a seed that ADVANCES EACH VISIT, for the live-listings
 * shelf (founder direction 2026-07-19: the shelf should cycle through the full
 * inventory across residential/farm/commercial, not show the same listings every
 * time — unlike the map's narrative tour, which stays on a weekly featured stop).
 *
 * Pages are rendered per-request (force-dynamic), so this is computed once on the
 * server and passed to the shelf as a prop → SSR and hydration still agree within
 * a single render, but a fresh slice shows on the next load. The rotate() offset
 * is `seed % inventoryLength`, so successive visits walk across the whole feed.
 * Per-second granularity → each reload shows a fresh slice, still stable within a
 * single server render (computed once, passed as a prop → no hydration drift).
 */
export function visitRotationSeed(d: Date = new Date()): number {
  return Math.floor(d.getTime() / 1000);
}

/**
 * dayRotationSeed — a seed that ADVANCES ONCE PER DAY (UTC), for the live-listings
 * shelf (founder direction 2026-07-20: the shelf should rotate daily — a fresh
 * slice each day, stable within the day — rather than reshuffling on every reload).
 *
 * Day-of-epoch granularity, so `seed % inventoryLength` walks the whole feed one
 * step per day. Computed once on the server per request and passed as a prop → SSR
 * and hydration agree. Pure, edge-safe.
 */
export function dayRotationSeed(d: Date = new Date()): number {
  return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86_400_000);
}
