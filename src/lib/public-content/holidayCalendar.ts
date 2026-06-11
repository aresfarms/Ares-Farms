/**
 * holidayCalendar — Living Map, Phase 4 (Holiday engine)
 *
 * A holiday calendar that sits ABOVE the weekly stop rotation. When today falls
 * within a holiday's window AND that holiday has a sourced, rights-clean image
 * pool, the map leads with that holiday's themed earlier→later pair instead of
 * the usual featured stop.
 *
 * Date resolver — three deterministic kinds plus a year-spanning range:
 *   - fixed        (MM-DD): Independence Day, Veterans Day, Halloween, Christmas,
 *                   New Year's Day.
 *   - nth-weekday: Labor Day (1st Mon Sep), Thanksgiving (4th Thu Nov),
 *                   MLK Day (3rd Mon Jan), Memorial Day (last Mon May),
 *                   Grandparents Day (2nd Sun Sep).
 *   - variable     (lunisolar / computed): Easter, Hanukkah (1st night),
 *                   Lunar New Year — from a REVIEWED table, not guessed. The
 *                   table must be verified and extended annually.
 *   - range        : Kwanzaa (Dec 26 – Jan 1, spans the year boundary).
 *
 * A holiday only takes over when its pool is non-empty — so unmined holidays
 * simply fall through to the normal rotation. Pools are sourced exactly like the
 * stop pools (CC0 / public domain) via holidayPoolManifest.ts + the ingest.
 *
 * Tone: 'remembrance' holidays use a quieter visual treatment (no celebratory
 * styling) and dignified, non-combat imagery.
 *
 * "The map reveals opportunities, not the visitor."
 * Public Alpha remains PENDING.
 */

import type { ArchivalImage } from "./americasJourneyStops";
import { GENERATED_HOLIDAY_POOL } from "./americasJourneyPoolGenerated";

export type HolidayTone = "celebration" | "remembrance";

export type HolidayDate =
  | { kind: "fixed"; month: number; day: number }
  /** weekday: 0=Sun … 6=Sat. n: 1..4 for the nth, or -1 for the last in the month. */
  | { kind: "nth-weekday"; month: number; weekday: number; n: number }
  /** Year-spanning inclusive range (e.g. Kwanzaa Dec 26 → Jan 1). */
  | { kind: "range"; startMonth: number; startDay: number; endMonth: number; endDay: number }
  /** Reviewed lunisolar/computed dates, keyed by year → "MM-DD". VERIFY ANNUALLY. */
  | { kind: "variable"; dates: Record<number, string> };

export interface Holiday {
  id: string;
  /** Accurate display name. */
  name: string;
  date: HolidayDate;
  /** Radius in days around the date the takeover is shown (default 1 → ±1 day).
   *  Ignored for `range` holidays, which use their explicit span. */
  windowDays?: number;
  /** Search topic for the mining step (holidayPoolManifest growth). */
  theme: string;
  tone: HolidayTone;
}

// ── Holiday table (spec §5; names corrected; Memorial Day = remembrance) ───────
//
// VARIABLE-DATE TABLES BELOW ARE REVIEWED FOR 2026–2028 AND MUST BE VERIFIED
// AND EXTENDED EACH YEAR. A wrong holiday date on a trust brand is worse than
// omitting it — if a year is missing from the table, that holiday simply does
// not activate that year.

export const HOLIDAYS: Holiday[] = [
  { id: "new-years", name: "New Year's Day", tone: "celebration",
    date: { kind: "fixed", month: 1, day: 1 }, theme: "new year's eve celebration" },
  { id: "mlk-day", name: "Martin Luther King Jr. Day", tone: "remembrance",
    date: { kind: "nth-weekday", month: 1, weekday: 1, n: 3 }, theme: "civil rights march day of service" },
  { id: "lunar-new-year", name: "Lunar New Year", tone: "celebration",
    date: { kind: "variable", dates: { 2026: "02-17", 2027: "02-06", 2028: "01-26" } }, windowDays: 2,
    theme: "chinatown lunar new year celebration" },
  { id: "easter", name: "Easter", tone: "celebration",
    date: { kind: "variable", dates: { 2026: "04-05", 2027: "03-28", 2028: "04-16" } },
    theme: "easter celebration" },
  { id: "memorial-day", name: "Memorial Day", tone: "remembrance",
    date: { kind: "nth-weekday", month: 5, weekday: 1, n: -1 }, theme: "decoration day memorial observance cemetery" },
  { id: "independence-day", name: "Independence Day", tone: "celebration",
    date: { kind: "fixed", month: 7, day: 4 }, windowDays: 2, theme: "fourth of july parade fireworks" },
  { id: "labor-day", name: "Labor Day", tone: "celebration",
    date: { kind: "nth-weekday", month: 9, weekday: 1, n: 1 }, theme: "american workers labor workforce" },
  { id: "grandparents-day", name: "Grandparents Day", tone: "celebration",
    date: { kind: "nth-weekday", month: 9, weekday: 0, n: 2 }, theme: "multigenerational family" },
  { id: "halloween", name: "Halloween", tone: "celebration",
    date: { kind: "fixed", month: 10, day: 31 }, theme: "vintage halloween costumes" },
  { id: "veterans-day", name: "Veterans Day", tone: "remembrance",
    date: { kind: "fixed", month: 11, day: 11 }, theme: "veterans honored service" },
  { id: "thanksgiving", name: "Thanksgiving", tone: "celebration",
    date: { kind: "nth-weekday", month: 11, weekday: 4, n: 4 }, windowDays: 2, theme: "harvest thanksgiving family table" },
  { id: "hanukkah", name: "Hanukkah", tone: "celebration",
    date: { kind: "variable", dates: { 2026: "12-04", 2027: "12-24", 2028: "12-12" } }, windowDays: 4,
    theme: "menorah lighting hanukkah" },
  { id: "christmas", name: "Christmas", tone: "celebration",
    date: { kind: "fixed", month: 12, day: 25 }, windowDays: 2, theme: "vintage christmas" },
  { id: "kwanzaa", name: "Kwanzaa", tone: "celebration",
    date: { kind: "range", startMonth: 12, startDay: 26, endMonth: 1, endDay: 1 }, theme: "kwanzaa kinara celebration" },
];

// ── Date math (UTC day granularity) ───────────────────────────────────────────

function dayIndex(d: Date): number {
  return Math.floor(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) / 86_400_000);
}

/** Date of the nth (or last, n=-1) `weekday` in `month`/`year`. */
function nthWeekday(year: number, month: number, weekday: number, n: number): Date {
  if (n === -1) {
    const last = new Date(Date.UTC(year, month, 0)); // last day of month
    const back = (last.getUTCDay() - weekday + 7) % 7;
    return new Date(Date.UTC(year, month - 1, last.getUTCDate() - back));
  }
  const first = new Date(Date.UTC(year, month - 1, 1));
  const forward = (weekday - first.getUTCDay() + 7) % 7;
  return new Date(Date.UTC(year, month - 1, 1 + forward + (n - 1) * 7));
}

interface Window { start: number; end: number; } // inclusive day indices

/** Active window(s) for a holiday near `year` (checks year-1..year+1 for boundaries). */
function windowsFor(h: Holiday, year: number): Window[] {
  const radius = h.windowDays ?? 1;
  const out: Window[] = [];
  for (const y of [year - 1, year, year + 1]) {
    if (h.date.kind === "fixed") {
      const c = dayIndex(new Date(Date.UTC(y, h.date.month - 1, h.date.day)));
      out.push({ start: c - radius, end: c + radius });
    } else if (h.date.kind === "nth-weekday") {
      const c = dayIndex(nthWeekday(y, h.date.month, h.date.weekday, h.date.n));
      out.push({ start: c - radius, end: c + radius });
    } else if (h.date.kind === "variable") {
      const mmdd = h.date.dates[y];
      if (mmdd) {
        const [mm, dd] = mmdd.split("-").map(Number);
        const c = dayIndex(new Date(Date.UTC(y, mm - 1, dd)));
        out.push({ start: c - radius, end: c + radius });
      }
    } else {
      // range — end may roll into the next year
      const start = dayIndex(new Date(Date.UTC(y, h.date.startMonth - 1, h.date.startDay)));
      const endYear = h.date.endMonth < h.date.startMonth ? y + 1 : y;
      const end = dayIndex(new Date(Date.UTC(endYear, h.date.endMonth - 1, h.date.endDay)));
      out.push({ start, end });
    }
  }
  return out;
}

// ── Pool access ───────────────────────────────────────────────────────────────

/** Renderable, chronologically-sorted pool for a holiday (may be empty). */
export function holidayPool(id: string): ArchivalImage[] {
  const list = GENERATED_HOLIDAY_POOL[id] ?? [];
  return [...list].filter((img) => img.src != null);
}

export function getHolidayById(id: string): Holiday | null {
  return HOLIDAYS.find((h) => h.id === id) ?? null;
}

export interface ActiveHoliday { holiday: Holiday; pool: ArchivalImage[]; }

/**
 * The holiday to feature for `today`, or null. A holiday qualifies only if today
 * is within its window AND it has a non-empty sourced pool. If several qualify,
 * the one whose window centre is nearest today wins.
 */
export function getActiveHoliday(today: Date = new Date()): ActiveHoliday | null {
  const t = dayIndex(today);
  let best: { holiday: Holiday; pool: ArchivalImage[]; distance: number } | null = null;

  for (const h of HOLIDAYS) {
    const pool = holidayPool(h.id);
    if (pool.length === 0) continue; // unmined → no takeover
    for (const w of windowsFor(h, today.getUTCFullYear())) {
      if (t >= w.start && t <= w.end) {
        const distance = Math.abs(t - Math.round((w.start + w.end) / 2));
        if (!best || distance < best.distance) best = { holiday: h, pool, distance };
      }
    }
  }
  return best ? { holiday: best.holiday, pool: best.pool } : null;
}
