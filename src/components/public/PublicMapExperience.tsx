"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  buildWeeklyJourney,
  TOUR,
  isCapstone,
  type Capstone,
  type TourPlace,
  type TourState as TourStateType,
} from "@/lib/public-content/americasJourneyTour";

import { IMAGES }       from "@/lib/public-content/americasJourneyImages";
import { NOW_IMAGES }   from "@/lib/public-content/americasJourneyNowImages";
import { EXTRA_IMAGES } from "@/lib/public-content/americasJourneyPool";
import type { ArchivalImage } from "@/lib/public-content/americasJourneyStops";
import { buildPropertyAnalysisHref } from "@/lib/property/propertyAnalysisHref";
import {
  publicSafeForState,
  type LiveSources,
  type PublicSafeInventoryByState,
} from "@/lib/property/propertyPublicSafe";
import { SOURCE_PORTAL, type PublicSafeProperty } from "@/lib/property/propertyTypes";
import {
  getActiveHoliday,
  getHolidayById,
  holidayPool,
  type ActiveHoliday,
} from "@/lib/public-content/holidayCalendar";

/**
 * PublicMapExperience — Build 54
 *
 * Hidden-gem tour experience for the Furlong homepage.
 * Walks through JOURNEY (all TourPlaces across seeded states, then the Capstone).
 *
 * Build 54 scope:
 *   - Delaware and Pennsylvania seeded (6 places + Capstone = 7 beats).
 *   - Albers USA projection (self-contained, no CDN dependency).
 *   - GeoJSON fetched from /maps/us-states.geojson (same local file as Build 53).
 *   - framer-motion AnimatePresence dissolve for then→now image pairs.
 *   - react-simple-maps NOT used: requires React ^18.x peer, incompatible with
 *     the project's React 19.2.4 dependency.
 *   - Auto-advance: PER_PHASE_MS per phase, user-triggered only.
 *   - prefers-reduced-motion: no auto-advance, step-through only.
 *   - Popup card appears ON the map, anchored above the marker — not in a panel
 *     below the map. ResizeObserver maps SVG coordinates to CSS px.
 *   - Navigation wraps: Prev from stop 0 → capstone; Next from capstone → stop 0.
 *   - Capstone: full-screen overlay, links to /explore, "↺ Start over" button.
 *
 * Do NOT use in this component:
 *   - Browser speech synthesis / Web Speech API
 *   - Giant filled state blobs
 *   - Hardcoded place data — always import from americasJourneyTour.ts
 *   - react-simple-maps (React 19 peer dep incompatible as of 2026-06-06)
 *   - Then/now panels BELOW the map — everything is in the on-map popup card
 *   - place.then.src / place.now.src (always null; use IMAGES[id] / NOW_IMAGES[id])
 *
 * Governance:
 *   "The map reveals opportunities, not the visitor."
 *   "We show pathways, not promises."
 *   Public Alpha remains PENDING.
 *   Do not expose modern addresses, living-person details, or exact birthdates.
 */

// ── Albers USA projection ─────────────────────────────────────────────────────
// Composite projection (lower 48 + AK/HI insets) matching LivingOpportunityMap.

const DEG = Math.PI / 180;

function albersConicEqualArea(
  phiLow: number,
  phiHigh: number,
  lambda0: number,
  phi0: number
) {
  const n = (Math.sin(phiLow) + Math.sin(phiHigh)) / 2;
  const C = Math.cos(phiLow) ** 2 + 2 * n * Math.sin(phiLow);
  const rho0 = Math.sqrt(C - 2 * n * Math.sin(phi0)) / n;
  return (lambda: number, phi: number): [number, number] => {
    const rho = Math.sqrt(C - 2 * n * Math.sin(phi)) / n;
    const theta = n * (lambda - lambda0);
    return [rho * Math.sin(theta), rho0 - rho * Math.cos(theta)];
  };
}

const lower48 = albersConicEqualArea(29.5 * DEG, 45.5 * DEG, -96 * DEG, 37.5 * DEG);
const alaska  = albersConicEqualArea(55 * DEG,   65 * DEG,  -154 * DEG, 50 * DEG);
const hawaii  = albersConicEqualArea(8 * DEG,    18 * DEG,  -157 * DEG, 20.9 * DEG);

const L48_SC = 1060, L48_TX = 485, L48_TY = 275;
const AK_SC  = L48_SC * 0.35, AK_TX = 122, AK_TY = 490;
const HI_SC  = L48_SC,        HI_TX = 298, HI_TY = 542;

function project(lon: number, lat: number): [number, number] | null {
  const lo = lon * DEG, la = lat * DEG;
  if (lat > 50 && lon < -125) {
    const [px, py] = alaska(lo, la);
    return [px * AK_SC + AK_TX, -py * AK_SC + AK_TY];
  }
  if (lat < 28 && lat > 15 && lon < -140) {
    const [px, py] = hawaii(lo, la);
    return [px * HI_SC + HI_TX, -py * HI_SC + HI_TY];
  }
  if (lon > -60 || lon < -180 || lat < 20 || lat > 72) return null;
  const [px, py] = lower48(lo, la);
  const x = px * L48_SC + L48_TX;
  const y = -py * L48_SC + L48_TY;
  if (x < -20 || x > 980 || y < -20 || y > 620) return null;
  return [x, y];
}

// ── GeoJSON types ─────────────────────────────────────────────────────────────

type Coord = [number, number];
type Ring = Coord[];
type GeoGeometry =
  | { type: "Polygon"; coordinates: Ring[] }
  | { type: "MultiPolygon"; coordinates: Ring[][] };
type GeoFeature = {
  type: "Feature";
  geometry: GeoGeometry | null;
  properties: Record<string, unknown> | null;
};
type GeoFC = { type: "FeatureCollection"; features: GeoFeature[] };

function ringToPath(ring: Ring): string {
  const parts: string[] = [];
  for (let i = 0; i < ring.length; i++) {
    const pt = project(ring[i][0], ring[i][1]);
    if (!pt) continue;
    parts.push(`${i === 0 ? "M" : "L"}${pt[0].toFixed(1)},${pt[1].toFixed(1)}`);
  }
  if (parts.length < 2) return "";
  return parts.join(" ") + "Z";
}

function geomToPath(geom: GeoGeometry): string {
  if (geom.type === "Polygon")
    return geom.coordinates.map(ringToPath).join(" ");
  return geom.coordinates
    .map((poly) => poly.map(ringToPath).join(" "))
    .join(" ");
}

// ── GeoJSON cache ─────────────────────────────────────────────────────────────

let _statesCache: GeoFC | null = null;

type MapStatus = "loading" | "ready" | "unavailable";

// ── Constants ─────────────────────────────────────────────────────────────────

/** Brand gold for tour accent elements. */
const GOLD = "#b8862f";

/**
 * Ms each phase (then / now) is shown during auto-advance.
 * 5500 ms ≈ comfortable time to read the caption and take in the photo.
 * ~11s per stop total (then ~5.5s + now ~5.5s) — the 10–12s target.
 * This is the single source of truth for phase timing: the auto-advance
 * ticker (startTick) reads PER_PHASE_MS directly. Tune here only.
 */
const PER_PHASE_MS = 5_500;

/** Width of the on-map popup card in CSS px. */
const POPUP_W = 240;

/** Estimated card height with an image (label + image + credit + headline). */
const POPUP_H_IMG  = 230;
/** Estimated card height for text-only stops (no image downloaded yet). */
const POPUP_H_TEXT = 100;
/** Gap in px between the marker dot and the nearest card edge. */
const CARD_GAP     = 14;
/** Minimum distance in px the card must stay from the container edge. */
const CARD_MARGIN  = 12;

// ── Living-map pool helpers (Phase 2: weekly pair rotation) ──────────────────

/** ISO 8601 week number (1–53). Deterministic — same for everyone in a week. */
function isoWeek(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = (date.getUTCDay() + 6) % 7;          // Mon=0 … Sun=6
  date.setUTCDate(date.getUTCDate() - dayNum + 3);    // nearest Thursday
  const firstThursday = date.getTime();
  date.setUTCMonth(0, 1);
  if (date.getUTCDay() !== 4) {
    date.setUTCMonth(0, 1 + ((4 - date.getUTCDay()) + 7) % 7);
  }
  return 1 + Math.round((firstThursday - date.getTime()) / 604_800_000);
}

function stableStopSeed(input: string): number {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 33 + input.charCodeAt(index)) >>> 0;
  }
  return hash;
}

/** Parse a true-year value to a sortable number. Strings use their first 4-digit
 *  run ("c. 1870s" → 1870); "Present day" / undefined sort last. */
function yearValue(year: number | string | undefined): number {
  if (typeof year === "number") return year;
  if (typeof year === "string") {
    const m = year.match(/\d{4}/);
    if (m) return Number(m[0]);
  }
  return Number.POSITIVE_INFINITY; // "Present day" / unknown → latest
}

/** Is this image eligible to render? src downloaded and not an unconfirmed hold. */
function renderable(img: ArchivalImage & { needsConfirmation?: boolean }): boolean {
  return img.src != null && img.needsConfirmation !== true;
}

/**
 * The chronologically-sorted, renderable pool for a stop:
 *   [ then, ...extra, now ]  → filtered → sorted by true year.
 * With only then+now it is a 2-image pool (backward compatible).
 */
function buildPool(stopId: string): ArchivalImage[] {
  const candidates: (ArchivalImage | null | undefined)[] = [
    IMAGES[stopId],
    ...(EXTRA_IMAGES[stopId] ?? []),
    NOW_IMAGES[stopId],
  ];
  return candidates
    .filter((img): img is ArchivalImage => !!img && renderable(img))
    .sort((a, b) => yearValue(a.year) - yearValue(b.year));
}

/**
 * Every JOURNEY index that can render ALL THREE phases — a renderable
 * earlier+later image PAIR (Old → New) AND a live address-stripped property for
 * the stop's state (Possible). These are the "complete" featured stops.
 */
function completeIndices(
  journey: (TourPlace | Capstone)[],
  live: LiveSources,
  inventory: PublicSafeInventoryByState,
): number[] {
  const out: number[] = [];
  for (let idx = 0; idx < journey.length; idx++) {
    const b = journey[idx];
    if (isCapstone(b)) continue;
    const p = b as TourPlace;
    if (buildPool(p.id).length < 2) continue; // needs an Old/New pair
    const ts = TOUR.find((s) => s.places.some((pp) => pp.id === p.id));
    if (ts?.abbr && publicSafeForState(ts.abbr, live, inventory, idx)) out.push(idx); // has Possible
  }
  return out;
}

/**
 * The FEATURED opening stop for a given ISO week — rotates through the complete
 * stops so the map is a living rotation, not a fixed loop. Week N opens on the
 * Nth complete stop (mod count). weekSeed is computed server-side and passed in
 * (no hydration drift). Falls back to the first JOURNEY stop if none qualify
 * (e.g. no source live → no Possible anywhere → then → now only, as before).
 */
function featuredIndexForWeek(
  journey: (TourPlace | Capstone)[],
  live: LiveSources,
  inventory: PublicSafeInventoryByState,
  weekSeed: number,
): number {
  const complete = completeIndices(journey, live, inventory);
  if (complete.length === 0) return 0;
  const k = ((Math.trunc(weekSeed) % complete.length) + complete.length) % complete.length;
  return complete[k];
}

function sourceLabelFor(sourceId: PublicSafeProperty["sourceId"]): string {
  if (sourceId === "hud") return "HUD Home Store";
  if (sourceId === "treasury") return "U.S. Treasury auctions";
  if (sourceId === "gsa-realestate") return "GSA realestatesales.gov";
  return "USDA resales portal";
}

function pathwaysForProperty(property: PublicSafeProperty): string[] {
  const type = property.propertyType.toLowerCase();
  if (property.sourceId === "usda") return ["USDA"];
  if (property.sourceId === "hud") return ["Conventional", "FHA context"];
  if (/commercial|business|hospitality/.test(type)) return ["SBA", "Conventional"];
  if (/land|farm|ranch/.test(type)) return ["USDA", "Conventional"];
  return ["Conventional"];
}

/**
 * A clean, copyright-safe TYPE-BASED visual for the "Possible" card — a simple
 * line icon (home / farm / land / generic) on a soft gradient panel. We never
 * render a HUD/USDA listing photo here: those are often broker-shot and can
 * carry third-party copyright (the same trap as USDA listing photos).
 */
function PossibleVisual({ propertyType }: { propertyType: string }) {
  const t = (propertyType || "").toLowerCase();
  const kind = /farm|ranch|agric/.test(t) ? "farm" : /land|lot|vacant/.test(t) ? "land" : /home|house|multi|resid/.test(t) ? "home" : "generic";
  const common = {
    width: 40, height: 40, viewBox: "0 0 24 24", fill: "none",
    stroke: "#bfe9d3", strokeWidth: 1.6, strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const, "aria-hidden": true,
  };
  const icon =
    kind === "home" ? (<svg {...common}><path d="M4 11l8-7 8 7" /><path d="M6 10v10h12V10" /><path d="M10 20v-6h4v6" /></svg>)
    : kind === "farm" ? (<svg {...common}><path d="M3 21V10l6-4 6 4v11" /><path d="M3 21h18" /><path d="M15 21v-6h6v6" /><path d="M7 13h4" /></svg>)
    : kind === "land" ? (<svg {...common}><path d="M3 18h18" /><path d="M3 18l5-7 4 4 3-5 6 8" /><circle cx="7" cy="7" r="1.6" /></svg>)
    : (<svg {...common}><path d="M12 21s-6-5.686-6-10a6 6 0 1 1 12 0c0 4.314-6 10-6 10z" /><circle cx="12" cy="11" r="2.2" /></svg>);
  return (
    <div
      role="img"
      aria-label={`${kind === "generic" ? "property" : kind} — illustrative`}
      style={{
        height: 110, display: "flex", alignItems: "center", justifyContent: "center",
        background: "linear-gradient(155deg, #11392c 0%, #0e2a3a 100%)",
        borderBottom: "1px solid rgba(91,209,160,0.25)",
      }}
    >
      {icon}
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function PublicMapExperience({
  liveSources = {},
  weekSeed = 0,
  mapInventoryByState = {},
}: {
  liveSources?: LiveSources;
  weekSeed?: number;
  mapInventoryByState?: PublicSafeInventoryByState;
}) {
  // ── Tour state ──────────────────────────────────────────────────────────────
  /**
   * The FEATURED JOURNEY for this ISO week — a different set + order of stops
   * each week, drawn deterministically from the full pool (no per-visitor state).
   * Computed from weekSeed (a prop), so SSR and the client first render agree.
   */
  const journey = useMemo(() => buildWeeklyJourney(weekSeed), [weekSeed]);
  /**
   * The stop the homepage opens on: the FEATURED stop for this week — a complete
   * stop (Old → New → Possible) within this week's journey. Computed from
   * journey + liveSources + weekSeed (all derived from props), so SSR and the
   * client first render agree — no hydration drift.
   */
  const initialIndex = featuredIndexForWeek(journey, liveSources, mapInventoryByState, weekSeed);
  /** Whether the visitor has explicitly clicked "Begin the tour." */
  const [started, setStarted] = useState(false);
  /** Current index into the weekly journey. */
  const [i, setI] = useState(initialIndex);
  /** Current phase within a place beat: historic → present-day → (Possible). */
  const [phase, setPhase] = useState<"then" | "now" | "possible">("then");
  /**
   * True while the auto-advance interval is running.
   * Drives the Pause/Play button display.
   */
  const [playing, setPlaying] = useState(false);

  // ── Map state ───────────────────────────────────────────────────────────────
  const [mapStatus, setMapStatus] = useState<MapStatus>("loading");
  const [states, setStates] = useState<GeoFC | null>(null);
  const [reduceMotion, setRM] = useState(false);
  /**
   * Current ISO week. Initialized to 0 (→ pairIndex 0) and set to the real week
   * after mount, so SSR and first client render agree (no hydration drift). With
   * 2-image pools this never changes the pair; once pools grow it rotates which
   * earlier image is paired with the latest each week.
   */
  const [weekNum, setWeekNum] = useState(0);
  /**
   * Holiday takeover (Phase 4). Resolved client-side after mount (so SSR/CSR
   * agree). Null unless today is within a holiday window AND that holiday has a
   * sourced pool. Dev/testing overrides: ?holiday=<id> forces one; ?holidayDate=
   * YYYY-MM-DD simulates the clock.
   */
  const [activeHoliday, setActiveHoliday] = useState<ActiveHoliday | null>(null);
  /** Earlier/later toggle for the holiday card's own dissolve. */
  const [holidayPhase, setHolidayPhase] = useState<"then" | "now">("then");

  // ── Refs (stale-closure avoidance) ──────────────────────────────────────────
  // The interval callback captures a snapshot of the closure at creation time.
  // Reading from refs instead ensures we always see the latest values.
  const iRef    = useRef(initialIndex);
  const phaseRef = useRef<"then" | "now" | "possible">("then");
  const tickRef  = useRef<ReturnType<typeof setInterval> | null>(null);

  // Refs for measuring SVG render position relative to the map container.
  // Used to convert SVG coordinate space → CSS px for the on-map popup card.
  const svgRef          = useRef<SVGSVGElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Ref mirrors for hover-pause (avoids stale closures in event handlers)
  const playingRef  = useRef(false);
  const hoveringRef = useRef(false);
  const reduceMotionRef = useRef(false);

  // ── Popup card height measurement ──────────────────────────────────────────
  // The popup card's actual rendered height varies with text wrap and image
  // presence. We measure the real height via a ResizeObserver so that
  // popupPos can clamp accurately (no more clipping from under-estimated height).
  // Initialized to 310 — a generous default so the first frame never clips.
  const cardRef        = useRef<HTMLDivElement>(null);
  const [measuredCardH, setMeasuredCardH] = useState<number>(310);

  // Keep refs in sync with state
  useEffect(() => { iRef.current     = i;       }, [i]);
  useEffect(() => { phaseRef.current  = phase;   }, [phase]);
  useEffect(() => { playingRef.current = playing; }, [playing]);
  useEffect(() => { reduceMotionRef.current = reduceMotion; }, [reduceMotion]);

  // ── SVG measurement ─────────────────────────────────────────────────────────
  // Resolves the actual rendered position and scale of the SVG element within
  // the map container, so the popup card can be anchored at the marker's CSS px.
  const [svgMeasure, setSvgMeasure] = useState<{
    scale:           number;  // px per SVG unit (SVG viewBox width = 960)
    offsetX:         number;  // SVG left edge relative to container left
    offsetY:         number;  // SVG top edge relative to container top
    containerWidth:  number;  // map container width in px (for x-clamping)
    containerHeight: number;  // map container height in px (for y-clamping)
  } | null>(null);

  useEffect(() => {
    if (mapStatus !== "ready") return;
    const measure = () => {
      const svg  = svgRef.current;
      const cont = mapContainerRef.current;
      if (!svg || !cont) return;
      const sr = svg.getBoundingClientRect();
      const cr = cont.getBoundingClientRect();
      setSvgMeasure({
        scale:           sr.width / 960,   // 960 = SVG viewBox width
        offsetX:         sr.left - cr.left,
        offsetY:         sr.top  - cr.top,
        containerWidth:  cr.width,
        containerHeight: cr.height,
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (mapContainerRef.current) ro.observe(mapContainerRef.current);
    return () => ro.disconnect();
  }, [mapStatus]);

  // ── Measure popup card height ───────────────────────────────────────────
  // Runs whenever the stop (i) or phase changes — i.e. whenever the card
  // content changes and the height might differ. ResizeObserver handles any
  // subsequent reflowing (text wrap, image load) within the same phase.
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    // Snapshot immediately for the frame after the card mounts.
    const h = card.getBoundingClientRect().height;
    if (h > 0) setMeasuredCardH(h);
    const ro = new ResizeObserver((entries) => {
      const rh = entries[0]?.contentRect.height;
      if (rh && rh > 0) setMeasuredCardH(rh);
    });
    ro.observe(card);
    return () => ro.disconnect();
  }, [i, phase]);

  // ── ISO week (client-only, avoids hydration date drift) ──────────────────────
  useEffect(() => { setWeekNum(isoWeek(new Date())); }, []);

  // ── Active holiday (client-only; supports dev overrides) ─────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const forceId = params.get("holiday");
    if (forceId) {
      const h = getHolidayById(forceId);
      const pool = holidayPool(forceId);
      if (h && pool.length > 0) { setActiveHoliday({ holiday: h, pool }); return; }
    }
    const forceDate = params.get("holidayDate");
    const today = forceDate ? new Date(`${forceDate}T12:00:00Z`) : new Date();
    setActiveHoliday(getActiveHoliday(today));
  }, []);

  // ── Holiday card dissolve (its own timer, independent of the tour ticker) ────
  useEffect(() => {
    if (!activeHoliday || reduceMotion || activeHoliday.pool.length < 2) return;
    const id = setInterval(
      () => setHolidayPhase((p) => (p === "then" ? "now" : "then")),
      PER_PHASE_MS,
    );
    return () => clearInterval(id);
  }, [activeHoliday, reduceMotion]);

  // ── prefers-reduced-motion ──────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq    = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setRM(mq.matches);
    apply();
    mq.addEventListener?.("change", apply);
    return () => mq.removeEventListener?.("change", apply);
  }, []);

  // ── GeoJSON loading ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (_statesCache) {
      setStates(_statesCache);
      setMapStatus("ready");
      return;
    }
    fetch("/maps/us-states.geojson")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<GeoFC>;
      })
      .then((data) => {
        if (
          data.type !== "FeatureCollection" ||
          !Array.isArray(data.features) ||
          data.features.length < 50
        )
          throw new Error("Invalid GeoJSON");
        _statesCache = data;
        setStates(data);
        setMapStatus("ready");
      })
      .catch(() => setMapStatus("unavailable"));
  }, []);

  // ── "Possible" card resolution (Phase 1 property source: USDA RD) ─────────────
  // The public-safe USDA property for a stop's state — address-stripped, bands
  // only. Returns null unless the USDA source is live (Module 22/23 APPROVED), so
  // while the source is pending the map behaves exactly as before (then → now).
function possibleForIndex(idx: number): PublicSafeProperty | null {
    const b = journey[idx];
    if (!b || isCapstone(b)) return null;
    const p = b as TourPlace;
    const ts = TOUR.find((s) => s.places.some((pp) => pp.id === p.id));
    return ts?.abbr
      ? publicSafeForState(
          ts.abbr,
          liveSources,
          mapInventoryByState,
          weekSeed + idx + stableStopSeed(p.id)
        )
      : null;
  }

  // ── Dissolve + advance ticker ────────────────────────────────────────────────
  // Cycle per stop: historic → present-day → (Possible, if the stop's state has a
  // live property) → advance. The earlier↔later DISSOLVE runs always; advancing
  // BETWEEN stops happens only when the tour is playing.
  function startTick() {
    if (tickRef.current) clearInterval(tickRef.current);
    if (reduceMotionRef.current) return; // reduced motion: no dissolve, no advance
    tickRef.current = setInterval(() => {
      if (isCapstone(journey[iRef.current])) return; // capstone has no image pair
      const advance = () => {
        if (playingRef.current) {
          const nextI = iRef.current + 1;
          iRef.current = nextI;
          setI(nextI);
        }
      };
      if (phaseRef.current === "then") {
        phaseRef.current = "now";
        setPhase("now");
      } else if (phaseRef.current === "now") {
        if (possibleForIndex(iRef.current)) {
          phaseRef.current = "possible";
          setPhase("possible");
        } else {
          phaseRef.current = "then";
          setPhase("then");
          advance();
        }
      } else {
        // "possible" → back to historic, advancing to the next stop if playing.
        phaseRef.current = "then";
        setPhase("then");
        advance();
      }
    }, PER_PHASE_MS);
  }

  function stopTick() {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }

  // Start the always-on dissolve on mount; restart when reduced-motion changes.
  // (The ticker only ADVANCES between stops while playing; it always dissolves.)
  useEffect(() => {
    if (reduceMotion) { stopTick(); return; }
    startTick();
    return () => stopTick();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduceMotion]);

  // ── Navigation ───────────────────────────────────────────────────────────────
  /**
   * Navigate to any stop index, wrapping circularly. Stops auto-ADVANCE (tour
   * play) but the per-card dissolve keeps running so the new card shows its pair.
   */
  function goTo(n: number) {
    setPlaying(false);
    const next       = ((n % journey.length) + journey.length) % journey.length;
    iRef.current     = next;
    phaseRef.current = "then";
    setI(next);
    setPhase("then");
    startTick(); // restart so the new card's dissolve timing is fresh
  }

  // "Begin the journey" — the visitor's choice always wins. This is enabled from
  // first paint and is NEVER disabled while the map loads or plays its (purely
  // cosmetic, interruptible) intro. Clicking it snaps to the complete state and
  // starts the journey at the first stop immediately — no forced wait. Waiting
  // also works: nothing auto-starts (autoplayOnLoad stays false); only Begin
  // (or Play) sets `playing`.
  function handleBeginTour() {
    setStarted(true);
    // Snap to the first COMPLETE stop (all three phases), even if the intro/load
    // animation has not finished — a vivid Old→New→Possible card appears right away.
    iRef.current     = initialIndex;
    phaseRef.current = "then";
    setI(initialIndex);
    setPhase("then");
    if (!reduceMotion) {
      setPlaying(true);
    }
    startTick();
  }

  // Pause/Play toggle auto-ADVANCE between stops. The card dissolve keeps running
  // either way (you can always see a stop's earlier/later pair).
  function handlePause() { setPlaying(false); }
  function handlePlay()  {
    if (isCapstone(journey[i])) return;
    setPlaying(true);
    if (!tickRef.current) startTick();
  }
  function handlePrev() { goTo(i - 1); }
  function handleNext() { goTo(i + 1); }

  /** Hover over the map → pause everything (dissolve + advance) while inspecting. */
  function handleMapMouseEnter() {
    hoveringRef.current = true;
    stopTick();
  }
  /** Cursor leaves the map → resume the dissolve (and advance if playing). */
  function handleMapMouseLeave() {
    hoveringRef.current = false;
    if (!reduceMotion && !isCapstone(journey[iRef.current])) {
      startTick();
    }
  }

  // ── Derived values ──────────────────────────────────────────────────────────
  const beat  = journey[i];
  const place: TourPlace | null = isCapstone(beat) ? null : (beat as TourPlace);
  const cap: Capstone | null    = isCapstone(beat) ? (beat as Capstone) : null;

  /** The full TourState entry for the current place (for state-name GeoJSON match). */
  const tourState: TourStateType | null = place
    ? (TOUR.find((s) => s.places.some((p) => p.id === place.id)) ?? null)
    : null;
  const primaryState = tourState?.state ?? "";

  /** SVG marker position for the current place. */
  const markerPt = place ? project(place.coords[0], place.coords[1]) : null;

  /**
   * Live registry lookups — read from IMAGES / NOW_IMAGES, never from
   * place.then.src / place.now.src (those fields stay null in the tour data;
   * src is only populated in the image registries).
   */
  /**
   * Living-map pool (Phase 2): the renderable, chronologically-sorted images for
   * this stop. The card pairs an EARLIER image with the LATEST image; which
   * earlier image rotates by ISO week:
   *     pairIndex = weekNum % max(1, pool.length - 1)
   * With a 2-image (then→now) pool this is always [pool[0], pool[1]] — identical
   * to the previous behavior. As pools grow (Phase 3) the earlier image cycles
   * weekly while the latest stays the "now".
   */
  const pool = place ? buildPool(place.id) : [];
  /** A stop with 2+ images has a pair to dissolve between; 1 image shows alone. */
  const hasPair     = pool.length >= 2;
  const pairIndex   = hasPair ? (weekNum % (pool.length - 1)) : 0;
  const earlierImg: ArchivalImage | null = pool.length > 0 ? pool[pairIndex] : null;
  const laterImg:   ArchivalImage | null = pool.length > 0 ? pool[pool.length - 1] : null;

  /**
   * The address-stripped "Possible" property for this stop's state (USDA RD).
   * Null unless the USDA source is live (Module 22/23 APPROVED) — so by default
   * the map shows only then → now and no "Possible" card appears.
   */
  const possibleProp = place ? possibleForIndex(i) : null;
  const hasPossible  = !!possibleProp;
  const possibleAnalyzeHref = possibleProp
    ? buildPropertyAnalysisHref({
        propertyId: possibleProp.id,
        title: `${possibleProp.propertyType[0]?.toUpperCase() ?? ""}${possibleProp.propertyType.slice(1)} in ${possibleProp.town}`,
        location: `${possibleProp.town}${possibleProp.county && possibleProp.county !== "Unknown" ? `, ${possibleProp.county} County` : ""}, ${possibleProp.state}`,
        propertyType: possibleProp.propertyType,
        priceLabel: possibleProp.priceBand,
        vintage: possibleProp.vintageStamp,
        sourceLabel: sourceLabelFor(possibleProp.sourceId),
        pathways: pathwaysForProperty(possibleProp),
        town: possibleProp.town,
        county: possibleProp.county,
        state: possibleProp.state,
        sourceId: possibleProp.sourceId,
        description: possibleProp.whyMayFit,
        currentLabel: possibleProp.isCurrent ? "Current government listing" : `${possibleProp.vintageStamp} · historical example`,
      })
    : null;
  const cardNavigateHref = possibleAnalyzeHref;
  const propertyGatewayActive = Boolean(possibleProp && possibleAnalyzeHref);

  function handlePossibleCardNavigation(eventTarget: EventTarget | null) {
    if (!possibleAnalyzeHref) return;
    if (eventTarget instanceof HTMLElement && eventTarget.closest("a")) {
      return;
    }
    window.location.href = possibleAnalyzeHref;
  }

  /**
   * Effective phase for rendering. The "possible" phase only renders when a live
   * property exists; single-image stops render the one image; pair stops follow
   * the dissolve ticker.
   */
  const effPhase: "then" | "now" | "possible" =
    phase === "possible" && hasPossible ? "possible" : hasPair ? phase : "then";

  /**
   * Image shown in the on-map popup for the current phase: earlier on "then",
   * later on "now". Null on "possible" (a property card renders) or for stops
   * with no renderable image (text-only popup).
   */
  const popupImg =
    effPhase === "possible" ? null : effPhase === "then" ? earlierImg : laterImg;
  const gatewayImg =
    propertyGatewayActive
      ? (popupImg ?? laterImg ?? earlierImg)
      : null;

  /** The displayed image's REAL year — the card leads with this, not a static label. */
  const displayedYear =
    popupImg?.year ?? (effPhase === "then" ? (place?.era ?? "") : "Present day");

  /**
   * CSS position for the on-map popup card, always fully within the container.
   *
   * Strategy (preference: ABOVE marker, like Oklahoma/Greenwood):
   *   1. Convert SVG marker coords → CSS px via svgMeasure.
   *   2. Clamp x within the container (existing behaviour, still correct).
   *   3. Prefer placing the card ABOVE the marker (transform floats it up).
   *      "Fits above" means the card top edge ≥ CARD_MARGIN from container top.
   *   4. If no room above, place BELOW the marker.
   *      "Fits below" means the card bottom edge ≤ containerHeight − CARD_MARGIN.
   *   5. Edge case (card taller than available space on both sides): place above
   *      and shift the marker anchor down so the card top lands at CARD_MARGIN.
   *
   * viewBox minY = −20 → add 20 when converting SVG y to CSS top.
   */
  const popupPos = (markerPt && svgMeasure) ? (() => {
    const { scale, offsetX, offsetY, containerWidth, containerHeight } = svgMeasure;

    const rawLeft = offsetX + markerPt[0] * scale;
    const rawTop  = offsetY + (markerPt[1] + 20) * scale;

    // ── X: clamp so card never clips horizontally ──────────────────────────
    const left = Math.max(
      POPUP_W / 2 + 6,
      Math.min(rawLeft, containerWidth - POPUP_W / 2 - 6)
    );

    // ── Y: choose placement, then derive the anchor top ───────────────────
    // Uses measuredCardH (real rendered height, updated by ResizeObserver) so
    // the card never clips from under-estimation.
    //
    // "Above" means the card occupies [rawTop − measuredCardH − CARD_GAP, rawTop − CARD_GAP].
    // "Below" means the card occupies [rawTop + CARD_GAP, rawTop + CARD_GAP + measuredCardH].

    const cardH = measuredCardH;
    const roomAbove = rawTop - cardH - CARD_GAP; // card top if placed above
    const roomBelow = containerHeight - (rawTop + CARD_GAP + cardH); // space below card

    if (roomAbove >= CARD_MARGIN) {
      // Preferred: card fits cleanly above the marker.
      return { left, top: rawTop, placement: "above" as const };
    }

    if (roomBelow >= -CARD_MARGIN) {
      // Fallback: card fits below (or only slightly clips — acceptable).
      return { left, top: rawTop, placement: "below" as const };
    }

    // Edge case: card taller than available space on either side.
    // Force "above" but push the anchor down so the card top lands at CARD_MARGIN.
    const clampedTop = CARD_MARGIN + cardH + CARD_GAP;
    return { left, top: clampedTop, placement: "above" as const };
  })() : null;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <section
      aria-label="America's Journey — hidden gem tour"
      style={{
        border:       "1px solid #cdd9ec",
        borderRadius: 14,
        background:   "linear-gradient(160deg, #f3f7fd 0%, #e7eef9 100%)",
        color:        "#162033",
        padding:      14,
        display:      "grid",
        gap:          0,
      }}
    >
      <style>{`
        /* ── Pulse ring ─────────────────────────── */
        @keyframes tour-pulse {
          0%   { transform: scale(1);   opacity: 0.55; }
          70%  { transform: scale(2.6); opacity: 0;    }
          100% { transform: scale(2.6); opacity: 0;    }
        }
        .tour-pulse-ring {
          transform-box: fill-box;
          transform-origin: center;
          animation: tour-pulse 2.8s ease-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .tour-pulse-ring { animation: none; opacity: 0; }
        }

        /* ── Buttons ────────────────────────────── */
        .tour-nav-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 36px;
          padding: 0 14px;
          border-radius: 999px;
          border: 1px solid #cdd9ec;
          background: #ffffff;
          color: #162033;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
          transition: border-color 0.12s, color 0.12s;
        }
        .tour-nav-btn:hover { border-color: #0f766e; color: #0f766e; }
        .tour-nav-btn:focus-visible { outline: 2px solid #0f766e; outline-offset: 2px; }

        /* ── Progress dots (clickable jump controls) ── */
        .tour-dot {
          padding: 6px 3px;          /* large tap target around the small bar */
          margin: 0;
          border: none;
          background: transparent;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          font-family: inherit;
          line-height: 0;
        }
        .tour-dot > span {
          height: 6px;
          border-radius: 999px;
          transition: width 0.25s, background 0.25s;
          display: inline-block;
        }
        .tour-dot:focus-visible { outline: 2px solid #0f766e; outline-offset: 2px; border-radius: 999px; }

        .tour-begin-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          min-height: 38px;
          padding: 0 18px;
          border-radius: 999px;
          border: 1.5px solid #b8862f;
          background: transparent;
          color: #7a5a1e;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
          transition: background 0.14s;
          letter-spacing: 0.01em;
        }
        .tour-begin-btn:hover { background: rgba(184,134,47,0.10); }
        .tour-begin-btn:focus-visible { outline: 2px solid #b8862f; outline-offset: 2px; }

        .tour-play-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          min-height: 36px;
          padding: 0 14px;
          border-radius: 999px;
          border: 1.5px solid #b8862f;
          background: transparent;
          color: #7a5a1e;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
          transition: background 0.12s;
        }
        .tour-play-btn:hover { background: rgba(184,134,47,0.10); }
        .tour-play-btn:focus-visible { outline: 2px solid #b8862f; outline-offset: 2px; }

        .tour-restart-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          min-height: 40px;
          padding: 0 20px;
          border-radius: 999px;
          border: 1.5px solid rgba(201,168,76,0.5);
          background: transparent;
          color: #c9a84c;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
          transition: background 0.14s, border-color 0.14s;
          letter-spacing: 0.01em;
        }
        .tour-restart-btn:hover {
          background: rgba(201,168,76,0.12);
          border-color: #c9a84c;
        }
        .tour-restart-btn:focus-visible { outline: 2px solid #c9a84c; outline-offset: 2px; }

        /* ── Image cross-fade (then → now) ──────── */
        @keyframes tour-img-fade {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .tour-popup-img {
          animation: tour-img-fade 0.4s ease;
        }
        @media (prefers-reduced-motion: reduce) {
          .tour-popup-img { animation: none; }
        }

        /* ── On-map popup card ──────────────────── */
        .tour-popup-card {
          position: absolute;
          z-index: 10;
          width: 240px;
          background: rgba(14, 20, 36, 0.93);
          border: 1px solid rgba(184,134,47,0.35);
          border-radius: 10px;
          overflow: hidden;
          pointer-events: auto;
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          box-shadow: 0 6px 24px rgba(0,0,0,0.35);
        }
        .tour-popup-label {
          padding: 6px 10px 0;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.10em;
          text-transform: uppercase;
        }
        .tour-popup-headline {
          padding: 4px 10px 8px;
          font-size: 12px;
          font-weight: 700;
          color: #e8effa;
          line-height: 1.4;
        }
        .tour-popup-credit {
          padding: 4px 10px 8px;
          font-size: 10px;
          color: #7a9bc0;
          line-height: 1.4;
        }
        .tour-popup-credit a {
          color: #5bb8ad;
          text-decoration: underline;
        }
        .tour-popup-cta-row {
          display: grid;
          gap: 8px;
          margin-top: 2px;
        }
        .tour-popup-cta {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 34px;
          border-radius: 999px;
          text-decoration: none;
          font-size: 11.5px;
          font-weight: 800;
          padding: 0 12px;
        }
        .tour-popup-cta-primary {
          background: #0f766e;
          color: #ffffff;
        }
        .tour-popup-cta-secondary {
          border: 1px solid rgba(91, 209, 160, 0.45);
          color: #5bd1a0;
          background: rgba(18, 33, 58, 0.55);
        }
      `}</style>

      {/* ── Series label ─────────────────────────────────────────────────────── */}
      <div
        style={{
          display:        "flex",
          flexWrap:       "wrap",
          gap:            "6px 12px",
          alignItems:     "baseline",
          justifyContent: "space-between",
          marginBottom:   10,
        }}
      >
        <strong style={{ fontSize: 13, letterSpacing: 0.5, textTransform: "uppercase", color: "#162033" }}>
          America's Journey · Hidden Gem Tour
        </strong>
        <span style={{ fontSize: 13, color: "#5d687a" }}>
          Illustrative — we show pathways, not promises.
        </span>
      </div>

      {/* ── Holiday takeover (Phase 4) ────────────────────────────────────────
          When today falls within a holiday window with a sourced pool, the map
          leads with that holiday's themed earlier→later pair. Remembrance
          holidays use a quieter, non-celebratory treatment. */}
      {activeHoliday && (() => {
        const pool       = activeHoliday.pool;
        const earlier    = pool[0];
        const later      = pool[pool.length - 1];
        const hImg       = (pool.length > 1 && holidayPhase === "now") ? later : earlier;
        const remembrance = activeHoliday.holiday.tone === "remembrance";
        const accent     = remembrance ? "#5d687a" : "#b8862f";
        const bg         = remembrance
          ? "linear-gradient(160deg, #f4f6f9 0%, #eceff4 100%)"
          : "linear-gradient(160deg, #fbf6ec 0%, #f6ecd6 100%)";
        return (
          <section
            aria-label={`Holiday feature: ${activeHoliday.holiday.name}`}
            style={{
              border:       `1px solid ${remembrance ? "#d2d9e3" : "#e4cf9f"}`,
              borderLeft:   `4px solid ${accent}`,
              borderRadius: 12,
              background:   bg,
              padding:      14,
              marginBottom: 12,
              display:      "grid",
              gap:          10,
            }}
          >
            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 10px", alignItems: "baseline", justifyContent: "space-between" }}>
              <strong style={{ fontSize: 12, letterSpacing: 0.6, textTransform: "uppercase", color: accent }}>
                {remembrance ? "In remembrance · " : "Holiday feature · "}{activeHoliday.holiday.name}
              </strong>
              <span style={{ fontSize: 12, color: "#5d687a" }}>
                {hImg.year} {pool.length > 1 ? (holidayPhase === "then" ? "· then" : "· today") : ""}
              </span>
            </div>

            <figure style={{ margin: 0, borderRadius: 8, overflow: "hidden" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                key={hImg.src!}
                className="tour-popup-img"
                src={hImg.src!}
                alt={hImg.alt}
                loading="lazy"
                style={{ width: "100%", height: 200, objectFit: "cover", display: "block" }}
              />
            </figure>

            <p style={{ margin: 0, fontSize: 11, color: "#5d687a", lineHeight: 1.45 }}>
              {hImg.credit}{" · "}
              <a href={hImg.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: remembrance ? "#3b475a" : "#7a5a1e", textDecoration: "underline" }}>
                Source ↗
              </a>
            </p>
          </section>
        );
      })()}

      {/* ══════════════════════════════════════════════════════════════════════
          MAP CARD
          Contains: SVG map + on-map popup card.
          The popup is absolutely positioned within the map container div,
          anchored at the projected marker pixel coordinate.
          Capstone: full-screen overlay replaces map content.
          NOTHING renders in a panel below this card.
          ══════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          position:     "relative",
          borderRadius: 12,
          // overflow must be "visible" so the on-map popup card can extend
          // above/below the map area without clipping. The inner SVG and
          // capstone overlay are self-contained — they do not overflow their
          // own bounds, so removing the hidden clip here is safe.
          overflow:     "visible",
          border:       "1px solid #cdd9ec",
          background:   "linear-gradient(180deg, #f8fbff 0%, #edf2fb 100%)",
        }}
      >

        {/* ── Capstone overlay — replaces map content entirely ─────────────── */}
        {cap && (
          <div
            role="region"
            aria-label="Tour capstone — your story"
            style={{
              position:       "relative",
              minHeight:      460,
              display:        "flex",
              flexDirection:  "column",
              alignItems:     "center",
              justifyContent: "center",
              background:     "linear-gradient(160deg, #0e1424 0%, #162033 100%)",
              padding:        "48px 32px",
              textAlign:      "center",
              gap:            20,
            }}
          >
            {/* Decorative compass rose */}
            <span aria-hidden="true" style={{ fontSize: 40, opacity: 0.25, color: GOLD }}>✦</span>

            <h2 style={{
              margin:        0,
              fontSize:      "clamp(28px, 5vw, 44px)",
              fontWeight:    800,
              color:         GOLD,
              letterSpacing: "-0.02em",
              lineHeight:    1.1,
            }}>
              {cap.headline}
            </h2>

            <p style={{
              margin:     0,
              fontSize:   "clamp(15px, 2vw, 18px)",
              color:      "#c8d8f0",
              maxWidth:   560,
              lineHeight: 1.65,
            }}>
              {cap.prompt}
            </p>

            {/* Primary CTA */}
            <a
              href={cap.href}
              style={{
                display:        "inline-flex",
                alignItems:     "center",
                justifyContent: "center",
                minHeight:      52,
                padding:        "0 28px",
                borderRadius:   999,
                background:     "#0f766e",
                color:          "#ffffff",
                fontWeight:     800,
                fontSize:       16,
                textDecoration: "none",
                letterSpacing:  "0.01em",
                transition:     "background 0.15s",
              }}
            >
              {cap.cta}
            </a>

            {/* Secondary: restart the journey */}
            <button
              type="button"
              className="tour-restart-btn"
              onClick={() => goTo(0)}
              aria-label="Start the journey over from the first stop"
            >
              ↺ Start the journey over
            </button>
          </div>
        )}

        {/* ── Map container — SVG + on-map popup card ──────────────────────── */}
        {!cap && (
          <div
            ref={mapContainerRef}
            onMouseEnter={handleMapMouseEnter}
            onMouseLeave={handleMapMouseLeave}
            style={{
              height:         480,   // extra height vs. old 460 to give popup room near top
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
              position:       "relative",
            }}
          >
            {mapStatus === "loading" && (
              <p aria-live="polite" style={{ margin: 0, fontSize: 13, color: "#9db4d8" }}>
                Loading map…
              </p>
            )}
            {mapStatus === "unavailable" && (
              <p
                aria-live="polite"
                style={{ margin: 0, fontSize: 13, color: "#9db4d8", padding: "0 24px", textAlign: "center" }}
              >
                Map unavailable — a connection is required.
              </p>
            )}

            {mapStatus === "ready" && states && (
              <svg
                ref={svgRef}
                viewBox="0 -20 960 580"
                preserveAspectRatio="xMidYMid meet"
                aria-label={
                  place
                    ? `Full U.S. map — ${place.name}, ${tourState?.state ?? ""}, ${place.era}. Illustrative exploration; not based on your location.`
                    : "Full U.S. map. Illustrative exploration."
                }
                style={{ width: "auto", height: "100%", maxHeight: 480, display: "block" }}
              >
                <defs>
                  <filter id="tour-glow" x="-80%" y="-80%" width="260%" height="260%">
                    <feGaussianBlur stdDeviation="5" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  <radialGradient id="tour-vignette" cx="50%" cy="50%" r="70%">
                    <stop offset="0%"   stopColor="transparent" />
                    <stop offset="100%" stopColor="rgba(14,20,36,0.06)" />
                  </radialGradient>
                </defs>

                {/* State fills */}
                {states.features.map((feature, fi) => {
                  if (!feature.geometry) return null;
                  const d = geomToPath(feature.geometry);
                  if (!d) return null;
                  const name = String(
                    feature.properties?.NAME ?? feature.properties?.name ?? ""
                  );
                  const isFeatured =
                    primaryState.length > 0 && name === primaryState;
                  return (
                    <path
                      key={`state-${fi}`}
                      d={d}
                      fill={isFeatured ? `${GOLD}18` : "#edf2fb"}
                      stroke={isFeatured ? GOLD : "#c5d3e8"}
                      strokeWidth={isFeatured ? 1.8 : 0.5}
                      strokeLinejoin="round"
                    />
                  );
                })}

                {/* Vignette overlay */}
                <rect x="-20" y="-20" width="1000" height="640" fill="url(#tour-vignette)" />

                {/* Marker */}
                {markerPt && (
                  <g filter="url(#tour-glow)">
                    {playing && !reduceMotion && (
                      <circle
                        className="tour-pulse-ring"
                        cx={markerPt[0]}
                        cy={markerPt[1]}
                        r={10}
                        fill={GOLD}
                        opacity={0.30}
                      />
                    )}
                    <circle cx={markerPt[0]} cy={markerPt[1]} r={8} fill={GOLD} opacity={0.16} />
                    <circle cx={markerPt[0]} cy={markerPt[1]} r={5} fill={GOLD} opacity={0.88} />
                    <circle cx={markerPt[0]} cy={markerPt[1]} r={2.2} fill="#ffffff" opacity={0.90} />
                  </g>
                )}
              </svg>
            )}

            {/* ── On-map popup card ───────────────────────────────────────────
                Absolutely positioned within the map container.
                Anchored at the SVG marker's CSS pixel position (via svgMeasure).
                Contains: phase label, image (cross-fading then→now), credit,
                          headline / place name.
                Stops without a downloaded image show text-only (no broken img).
                NOTHING renders below this container — this card IS the panel.
            */}
            {place && popupPos && (
              <div
                ref={cardRef}
                aria-live="polite"
                aria-atomic="true"
                className="tour-popup-card"
                role={cardNavigateHref ? "link" : undefined}
                tabIndex={cardNavigateHref ? 0 : undefined}
                onClick={cardNavigateHref ? (event) => handlePossibleCardNavigation(event.target) : undefined}
                onKeyDown={cardNavigateHref ? (event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    handlePossibleCardNavigation(event.target);
                  }
                } : undefined}
                style={{
                  left:      popupPos.left,
                  top:       popupPos.top,
                  transform: popupPos.placement === "above"
                    ? `translate(-50%, calc(-100% - ${CARD_GAP}px))`  // floats above marker
                    : `translate(-50%, ${CARD_GAP + 4}px)`,           // drops below (north states)
                  cursor: cardNavigateHref ? "pointer" : "default",
                }}
              >
                {propertyGatewayActive && possibleProp ? (
                  /* ── "Possible" card (Old → New → Possible) ──────────────────
                     Public-safe government property for this state: county/town
                     + bands only — NO exact address, NO lat/long. Framing is
                     NEUTRAL (2026-06-10 verified-only sweep): a factual source
                     description + provider routing — never an illustrative
                     program claim, never qualified/approved/eligible/guaranteed.
                     Citation required. */
                  <>
                    <p className="tour-popup-label" style={{ color: "#5bd1a0" }}>
                      PROPERTY PATHWAY
                      {" · "}
                      {effPhase === "then" ? "OLD" : effPhase === "now" ? "NEW" : "POSSIBLE"}
                      {" · "}
                      {gatewayImg?.year ?? displayedYear}
                      {" — "}
                      <span style={{ fontWeight: 500, textTransform: "none", letterSpacing: 0 }}>
                        {possibleProp.state}
                      </span>
                    </p>
                    <figure style={{ margin: 0 }}>
                      {gatewayImg ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={gatewayImg.src!}
                          className="tour-popup-img"
                          src={gatewayImg.src!}
                          alt={gatewayImg.alt}
                          loading="lazy"
                          style={{ width: "100%", height: 110, objectFit: "cover", display: "block" }}
                        />
                      ) : (
                        <PossibleVisual propertyType={possibleProp.propertyType} />
                      )}
                    </figure>
                    <div style={{ padding: "8px 10px 10px", display: "grid", gap: 6 }}>
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#e8effa" }}>
                        {possibleProp.town}
                        {possibleProp.county && possibleProp.county !== "Unknown"
                          ? `, ${possibleProp.county} County`
                          : ""}
                        , {possibleProp.state}
                      </p>
                      <p style={{ margin: 0, fontSize: 11, color: "#9fb6d4", lineHeight: 1.45 }}>
                        {[possibleProp.propertyType, possibleProp.acreageBand, possibleProp.priceBand]
                          .filter((s) => s && !/not specified/i.test(s))
                          .join(" · ")}
                      </p>
                      <p style={{ margin: 0, fontSize: 11, color: "#cfe3d8", lineHeight: 1.5 }}>
                        {possibleProp.isCurrent
                          ? "This stop now behaves like a direct property entry. Start the Furlong analysis or jump to the live source immediately."
                          : "This stop routes into a property-first Furlong analysis flow, with the source doorway preserved separately."}
                      </p>
                      <div className="tour-popup-cta-row">
                        <a
                          href={possibleAnalyzeHref}
                          className="tour-popup-cta tour-popup-cta-primary"
                        >
                          Analyze through Furlong
                        </a>
                        <a
                          href={SOURCE_PORTAL[possibleProp.sourceId].url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="tour-popup-cta tour-popup-cta-secondary"
                        >
                          Go to source website ↗
                        </a>
                      </div>
                      <p style={{ margin: 0, fontSize: 11, color: "#e8effa", lineHeight: 1.5 }}>
                        {effPhase === "then" ? place.headline : effPhase === "now" ? place.surprise : possibleProp.whyMayFit}
                      </p>
                      <p className="tour-popup-credit" style={{ padding: 0 }}>
                        {possibleProp.sourceCitation} · {possibleProp.vintageStamp}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Phase label: an explicit Old/New tag (per the three-slot
                        Old → New → Possible spec) followed by the displayed image's
                        REAL year (which changes as the card dissolves earlier↔later)
                        — never a misleading static era. */}
                    <p
                      className="tour-popup-label"
                      style={{ color: hasPair && effPhase === "now" ? "#5bb8ad" : "#b8862f" }}
                    >
                      {hasPair && effPhase === "now" ? "New" : "Old"}
                      {" · "}
                      {String(displayedYear)}
                      {" — "}
                      <span style={{ fontWeight: 500, textTransform: "none", letterSpacing: 0 }}>
                        {tourState?.abbr ?? ""}
                      </span>
                    </p>

                    {/* Image: fades in when the displayed image changes. */}
                    {popupImg && (
                      <figure style={{ margin: 0 }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          key={popupImg.src!}
                          className="tour-popup-img"
                          src={popupImg.src!}
                          alt={popupImg.alt}
                          loading="lazy"
                          style={{ width: "100%", height: 110, objectFit: "cover", display: "block" }}
                        />
                      </figure>
                    )}

                    {/* Credit — shown only when an image is displayed. */}
                    {popupImg && (
                      <p className="tour-popup-credit">
                        {popupImg.credit}
                        {popupImg.sourceUrl ? (
                          <>
                            {" · "}
                            <a href={popupImg.sourceUrl} target="_blank" rel="noopener noreferrer">
                              Source ↗
                            </a>
                          </>
                        ) : null}
                      </p>
                    )}

                    {/* Phase-specific text:
                        THEN → place.headline (the ≤9-word era hook)
                        NOW  → place.surprise (the present-day reveal) */}
                    <p className="tour-popup-headline">
                      {phase === "then" ? place.headline : place.surprise}
                    </p>
                    {cardNavigateHref && (
                      <p
                        style={{
                          margin: "0 10px 10px",
                          fontSize: 11.5,
                          fontWeight: 800,
                          color: "#ffffff",
                          lineHeight: 1.45,
                        }}
                      >
                        Open this stop's property analysis with Furlong →
                      </p>
                    )}
                  </>
                )}
              </div>
            )}

          </div>
          // ── End of map container ─────────────────────────────────────────
        )}

      </div>
      {/* ── End of map card ──────────────────────────────────────────────────── */}

      {/* ── Progress indicator — clickable jump controls ───────────────────────
          Each dot is a real button: click dot N to jump straight to stop N.
          Keyboard-focusable, labelled, with a visible active state. */}
      {!cap && (
        <div
          role="group"
          aria-label="Jump to a stop"
          style={{ marginTop: 8, display: "flex", gap: 2, justifyContent: "center", flexWrap: "wrap" }}
        >
          {journey.map((beat, idx) => {
            const isActive = idx === i;
            const isCap    = isCapstone(beat);
            return (
              <button
                key={idx}
                type="button"
                className="tour-dot"
                onClick={() => goTo(idx)}
                aria-label={`Go to stop ${idx + 1}${isCap ? " — your story" : ""}`}
                aria-current={isActive ? "true" : undefined}
                title={`Stop ${idx + 1}`}
              >
                <span
                  style={{
                    width:      isActive ? 18 : 6,
                    background: isActive ? GOLD : (isCap ? "#c9a84c44" : "#cdd9ec"),
                  }}
                />
              </button>
            );
          })}
        </div>
      )}

      {/* ── Navigation controls ───────────────────────────────────────────────── */}
      <div
        style={{
          marginTop:      12,
          display:        "flex",
          flexWrap:       "wrap",
          gap:            8,
          alignItems:     "center",
          justifyContent: "space-between",
        }}
      >
        {/* Start / Prev / Next / End — always enabled; Prev/Next wrap circularly,
            Start jumps to the first stop and End jumps to the capstone (last stop). */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <button
            type="button"
            className="tour-nav-btn"
            onClick={() => goTo(0)}
            aria-label="Jump to the first stop"
          >
            ⇤ Start
          </button>
          <button
            type="button"
            className="tour-nav-btn"
            onClick={handlePrev}
            aria-label="Previous place"
          >
            ← Prev
          </button>
          <button
            type="button"
            className="tour-nav-btn"
            onClick={handleNext}
            aria-label="Next place"
          >
            Next →
          </button>
          <button
            type="button"
            className="tour-nav-btn"
            onClick={() => goTo(journey.length - 1)}
            aria-label="Jump to the last stop"
          >
            End ⇥
          </button>
        </div>

        {/* Begin / Pause / Play */}
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {!started && (
            <button
              type="button"
              className="tour-begin-btn"
              onClick={handleBeginTour}
              aria-label="Begin the tour — enables auto-advance"
            >
              <span aria-hidden="true">✦</span>
              Begin the tour
            </button>
          )}

          {started && !cap && !reduceMotion && (
            playing ? (
              <button
                type="button"
                className="tour-play-btn"
                onClick={handlePause}
                aria-label="Pause auto-advance"
              >
                ⏸ Pause
              </button>
            ) : (
              <button
                type="button"
                className="tour-play-btn"
                onClick={handlePlay}
                aria-label="Resume auto-advance"
              >
                ▶ Play
              </button>
            )
          )}
        </div>

        {/* Beat counter */}
        <span style={{ fontSize: 12, color: "#5d687a" }}>
          {i + 1} / {journey.length}
        </span>
      </div>

      <div style={{ marginTop: 18, display: "flex", justifyContent: "center" }}>
        <a
          href="/explore"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "12px 18px",
            borderRadius: 999,
            background: "linear-gradient(135deg, rgba(184,134,47,0.14), rgba(91,184,173,0.14))",
            border: "1px solid rgba(184,134,47,0.35)",
            color: "#12344d",
            fontSize: 14,
            fontWeight: 800,
            letterSpacing: "0.01em",
            textDecoration: "none",
          }}
        >
          <span>What are your possibilities?</span>
          <span aria-hidden="true">→</span>
        </a>
      </div>

      {/* ── Privacy and advisory footnote ──────────────────────────────────────── */}
      <p style={{ margin: "12px 0 0", fontSize: 13, color: "#5d687a", lineHeight: 1.6 }}>
        Built for exploration, not surveillance. No tracking, no exact addresses, and no visitor
        identification. Furlong maps the bigger picture, not you. We show pathways, not promises.
      </p>
    </section>
  );
}
