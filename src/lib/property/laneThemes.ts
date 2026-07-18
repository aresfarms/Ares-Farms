/**
 * laneThemes — per-lane color identity within the Furlong palette (founder
 * direction 2026-07-18: each group gets its own color scheme so it's
 * differentiated but still the same product; use color psychology to drive
 * return visits and paid-community pull).
 *
 * THE SYSTEM: the STRUCTURE never changes lane to lane (header → number tiles →
 * table → supporting line). Only the ACCENT shifts, chosen by the feeling each
 * lane should evoke. Each lane's color also matches the emblem it already
 * carries on the compass rose, so the color is a consistent wayfinding cue —
 * a visitor learns "green = my farm world" and finds it instantly on return.
 *
 * Why color at all: a widely-cited marketing study (Singh, 2006, "Impact of
 * color on marketing") found people make up to ~90% of a snap judgment about a
 * product from color alone, and research on color-brand fit (Labrecque &
 * Milne) shows the RIGHT color for the context matters more than any single
 * favorite hue. So we match hue to job, not to taste.
 *
 * GOLD is deliberately NOT a lane color. Furlong's "Compass to Capital" gold is
 * reserved as the cross-lane PREMIUM / paid-community cue — gold reads as
 * prestige, value, and achievement, so using it consistently for upgrade
 * moments (never for ordinary content) teaches visitors what belonging to the
 * paid community looks like, everywhere.
 */

export interface LaneTheme {
  /** Kickers, links, table figures, chips, affordances. Must pass AA on white. */
  accent: string;
  /** Number-tile background (the headline stat tiles). */
  tileBg: string;
  /** Tile label + subtext, muted on tileBg. */
  tileLabel: string;
  /** Tile big number, near-white on tileBg. */
  tileValue: string;
}

export const LANE_THEMES = {
  // FARMS / AG / LAND → GREEN. Green is the single most agriculture- and
  // growth-associated color (nature, crops, "money", "go"); it also lowers
  // visual stress on a data-dense page. Matches the green farm emblem.
  farm: {
    accent: "#2f6d12",
    tileBg: "#16351d",
    tileLabel: "#93b89a",
    tileValue: "#eaf5ea",
  },
  // RESIDENTIAL → BLUE / TEAL. Blue tones signal trust, stability, and
  // dependability — the reassurance behind a home purchase; blue is also the
  // most broadly preferred color across demographics, which is why banks and
  // insurers lead with it. (Current default; kept as this lane's identity.)
  residential: {
    accent: "#0f766e",
    tileBg: "#0f2430",
    tileLabel: "#7fa8b8",
    tileValue: "#eaf3f7",
  },
} as const satisfies Record<string, LaneTheme>;
