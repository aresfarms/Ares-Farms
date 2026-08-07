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

/**
 * PREMIUM — the reserved "Compass to Capital" gold, used ONLY for the paid
 * community / upgrade cue, never for ordinary lane content. Gold reads as
 * prestige, value, and achievement; keeping it exclusive to belonging moments
 * teaches visitors — on every lane — what joining the community looks like.
 * Gold sits on a navy ground (never as small text on white, where it fails
 * contrast); the button uses dark ink on gold for a high-contrast premium feel.
 */
export const PREMIUM = {
  gold: "#b8862f",       // brand gold — accents, borders, kickers on navy
  goldBright: "#e0a94a", // brighter gold for a headline pop on navy
  ink: "#12233d",        // navy ground the gold sits on
  inkSoft: "#1b3050",    // lighter navy for inner panels
  onGold: "#12233d",     // dark ink for text on a solid-gold button
  paper: "#faf3e6",      // soft gold tint for light-mode chips
} as const;

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
  // RESIDENTIAL → BLUE. Blue signals trust, stability, and dependability — the
  // reassurance behind the biggest trust decision most people make; it is also
  // the most broadly preferred color across demographics, which is why banks
  // and insurers lead with it. Navy tiles stay (same blue family).
  residential: {
    accent: "#1c5aa0",
    tileBg: "#0f2036",
    tileLabel: "#8fb0cf",
    tileValue: "#eaf1fa",
  },
  // COMMERCIAL → TEAL. Teal reads as clarity, competence, and level-headed
  // enterprise — a working, get-it-done color that sits between the residential
  // blue and any green, so the three property lanes stay distinct at a glance.
  commercial: {
    accent: "#0f766e",
    tileBg: "#0f2430",
    tileLabel: "#7fa8b8",
    tileValue: "#eaf3f7",
  },
} as const satisfies Record<string, LaneTheme>;

/**
 * Per-lane accent by compass slug — the full set, so EVERY module wears its own
 * separate-but-cohesive color (founder direction 2026-07-18). Two variants each:
 * `onLight` for content that sits on white (the property lanes' browse box,
 * tiles, chart), `onDark` for the dark navy stage the deferred lanes render on.
 * Hue choices are psychology-matched and spread around the wheel so no two
 * lanes read the same at a glance. GOLD is intentionally absent — it belongs to
 * the community cue alone; giving the deferred lanes their own colors also frees
 * gold from being their default chart accent.
 */
export interface LaneAccentPair {
  onLight: string;
  onDark: string;
}

export const LANE_ACCENT_MAP: Record<string, LaneAccentPair> = {
  // Property lanes (onLight matches LANE_THEMES above; onDark unused today).
  "property-land": { onLight: "#1c5aa0", onDark: "#7fb0e0" }, // blue — trust
  "farms-agriculture": { onLight: "#2f6d12", onDark: "#8fd0a2" }, // green — growth
  "small-business-growth": { onLight: "#0f766e", onDark: "#7fc4b8" }, // teal — enterprise
  // Deferred lanes (rendered on the dark stage → onDark is what shows).
  "environmental-compliance": { onLight: "#127a4f", onDark: "#6fd0a0" }, // emerald — nature/renewal
  "financing-capital": { onLight: "#534AB7", onDark: "#a99cf0" }, // purple — wealth/ambition
  "housing-development": { onLight: "#a5441d", onDark: "#f0a17c" }, // rust/coral — warm editorial (newsletters)
  "programs-incentives": { onLight: "#a8324f", onDark: "#ec8aa6" }, // raspberry — opportunity (grants)
  "not-sure": { onLight: "#475569", onDark: "#9fb6da" }, // slate — official/precise (taxes/regs)
};

/** Resolve a lane's accent for a light or dark surface; teal fallback. */
export function accentForLane(slug: string, on: "light" | "dark" = "light"): string {
  const pair = LANE_ACCENT_MAP[slug];
  if (!pair) return on === "dark" ? "#7fc4b8" : "#0f766e";
  return on === "dark" ? pair.onDark : pair.onLight;
}
