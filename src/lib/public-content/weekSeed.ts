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
