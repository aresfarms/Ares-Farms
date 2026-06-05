"use client";

import { useEffect, useRef, useState } from "react";

import {
  CURATED_EXPLORATION_STORIES,
  FEATURED_EXPLORATION_ILLUSTRATIVE_NOTE,
  FEATURED_EXPLORATION_LABEL,
  type FeaturedStory,
} from "@/lib/customer-landing/featuredExplorationStories";
import {
  detectSeriesId,
  getFeaturedSeries,
} from "@/lib/customer-landing/featuredSeriesRegistry";

/**
 * Living Opportunity Map — Build 47-C (Animated Discovery Sequence).
 *
 * Sequence per story:
 *   1. Full U.S. national view  (America 250 era overlay + "Full Map Exploration" label)
 *   2. Zoom to featured state   (viewBox interpolated via rAF)
 *   3. State fills map box      (pathway lines animate within state)
 *   4. Zoom back to national    → next story
 *
 * America 250 layer: educational state admission era fills shown during national
 * view only. 2026 semiquincentennial of U.S. independence. Source: public-domain
 * U.S. government records. Reveals history, not visitors.
 *
 * Governance (unchanged from Build 47):
 *   - No fake or hand-drawn U.S. map
 *   - No geolocation, no exact addresses, no visitor identification
 *   - Uses Census TIGER GeoJSON from public/maps/ only
 *   - The map reveals opportunities, not the visitor
 *   - Fallback: professional abstract network, not a fake silhouette
 */

// ── Albers USA projection ─────────────────────────────────────────────────────
// Composite: lower 48 via Albers Equal-Area Conic; Alaska & Hawaii in inset positions.
// TY shifted down 25px vs Build 47 so northern states (WA, MT, ND) are fully visible.

const DEG = Math.PI / 180;

function albersConicEqualArea(
  phiLow: number, phiHigh: number, lambda0: number, phi0: number
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

const lower48Project = albersConicEqualArea(29.5 * DEG, 45.5 * DEG, -96 * DEG, 37.5 * DEG);
const LOWER48_SCALE = 1060;
const LOWER48_TX    = 485;
const LOWER48_TY    = 275; // +25 vs Build 47 for northern border visibility

const alaskaProject = albersConicEqualArea(55 * DEG, 65 * DEG, -154 * DEG, 50 * DEG);
const ALASKA_SCALE  = LOWER48_SCALE * 0.35;
const ALASKA_TX     = 122;
const ALASKA_TY     = 490;

const hawaiiProject = albersConicEqualArea(8 * DEG, 18 * DEG, -157 * DEG, 20.9 * DEG);
const HAWAII_SCALE  = LOWER48_SCALE;
const HAWAII_TX     = 298;
const HAWAII_TY     = 542;

function isAlaska(lon: number, lat: number) { return lat > 50 && lon < -125; }
function isHawaii(lon: number, lat: number) { return lat < 28 && lat > 15 && lon < -140; }

function project(lon: number, lat: number): [number, number] | null {
  const lo = lon * DEG, la = lat * DEG;
  if (isAlaska(lon, lat)) {
    const [px, py] = alaskaProject(lo, la);
    return [px * ALASKA_SCALE + ALASKA_TX, -py * ALASKA_SCALE + ALASKA_TY];
  }
  if (isHawaii(lon, lat)) {
    const [px, py] = hawaiiProject(lo, la);
    return [px * HAWAII_SCALE + HAWAII_TX, -py * HAWAII_SCALE + HAWAII_TY];
  }
  if (lon > -60 || lon < -180 || lat < 20 || lat > 72) return null;
  const [px, py] = lower48Project(lo, la);
  const x = px * LOWER48_SCALE + LOWER48_TX;
  const y = -py * LOWER48_SCALE + LOWER48_TY;
  if (x < -20 || x > 980 || y < -20 || y > 620) return null;
  return [x, y];
}

// ── GeoJSON → SVG path ────────────────────────────────────────────────────────

type Coord = [number, number];
type Ring  = Coord[];

function ringToPath(ring: Ring): string {
  const parts: string[] = [];
  for (let i = 0; i < ring.length; i++) {
    const pt = project(ring[i][0], ring[i][1]);
    if (!pt) continue;
    parts.push(`${i === 0 ? "M" : "L"}${pt[0].toFixed(1)},${pt[1].toFixed(1)}`);
  }
  if (parts.length < 2) return "";
  parts.push("Z");
  return parts.join(" ");
}

type GeoGeometry =
  | { type: "Polygon";      coordinates: Ring[]   }
  | { type: "MultiPolygon"; coordinates: Ring[][] };

function geometryToPath(geom: GeoGeometry): string {
  if (geom.type === "Polygon")
    return geom.coordinates.map(ringToPath).join(" ");
  return geom.coordinates
    .map(poly => poly.map(ringToPath).join(" "))
    .join(" ");
}

type GeoFeature = {
  type: "Feature";
  geometry: GeoGeometry | null;
  properties: Record<string, unknown> | null;
};

type GeoFeatureCollection = {
  type: "FeatureCollection";
  features: GeoFeature[];
};

// ── America 250 — historical admission eras ───────────────────────────────────
// Educational layer for the 2026 semiquincentennial of U.S. independence.
// Colors represent statehood eras — discovery only, not surveillance.
// Source: U.S. government public-domain historical records.

type AdmissionEra = "founding" | "republic" | "expansion" | "modern";

const ADMISSION_ERA: Record<string, AdmissionEra> = {
  Delaware: "founding", Pennsylvania: "founding", "New Jersey": "founding",
  Georgia: "founding", Connecticut: "founding", Massachusetts: "founding",
  Maryland: "founding", "South Carolina": "founding", "New Hampshire": "founding",
  Virginia: "founding", "New York": "founding", "North Carolina": "founding",
  "Rhode Island": "founding", Vermont: "founding",
  Kentucky: "republic", Tennessee: "republic", Ohio: "republic",
  Louisiana: "republic", Indiana: "republic", Mississippi: "republic",
  Illinois: "republic", Alabama: "republic", Maine: "republic",
  Missouri: "republic", Arkansas: "republic", Michigan: "republic",
  Florida: "expansion", Texas: "expansion", Iowa: "expansion",
  Wisconsin: "expansion", California: "expansion", Minnesota: "expansion",
  Oregon: "expansion", Kansas: "expansion", "West Virginia": "expansion",
  Nevada: "expansion", Nebraska: "expansion", Colorado: "expansion",
  "North Dakota": "expansion", "South Dakota": "expansion", Montana: "expansion",
  Washington: "expansion", Idaho: "expansion", Wyoming: "expansion", Utah: "expansion",
  Oklahoma: "modern", "New Mexico": "modern", Arizona: "modern",
  Alaska: "modern", Hawaii: "modern",
};

const ERA_FILL: Record<AdmissionEra, string> = {
  founding:  "rgba(37,99,235,0.09)",
  republic:  "rgba(15,118,110,0.09)",
  expansion: "rgba(146,64,14,0.09)",
  modern:    "rgba(107,114,128,0.09)",
};
const ERA_STROKE: Record<AdmissionEra, string> = {
  founding:  "rgba(37,99,235,0.22)",
  republic:  "rgba(15,118,110,0.22)",
  expansion: "rgba(146,64,14,0.22)",
  modern:    "rgba(107,114,128,0.18)",
};
const ERA_LEGEND: { era: AdmissionEra; label: string; color: string }[] = [
  { era: "founding",  label: "Founding (1787–90)",    color: "rgba(37,99,235,0.7)"   },
  { era: "republic",  label: "Early Republic (~1837)", color: "rgba(15,118,110,0.7)"  },
  { era: "expansion", label: "Expansion (~1896)",      color: "rgba(146,64,14,0.7)"   },
  { era: "modern",    label: "Modern (1907–59)",       color: "rgba(107,114,128,0.7)" },
];

// ── ViewBox animation ─────────────────────────────────────────────────────────

type ViewBox = { x: number; y: number; w: number; h: number };

// National viewBox: 960 × 580 with -20 top offset = shows y −20 → 560
// This ensures Washington/northern states are fully visible.
const NATIONAL_VBOX: ViewBox = { x: 0, y: -20, w: 960, h: 580 };
const NATIONAL_ASPECT = NATIONAL_VBOX.w / NATIONAL_VBOX.h; // ≈ 1.655

function vbStr(vb: ViewBox): string {
  return `${vb.x.toFixed(2)} ${vb.y.toFixed(2)} ${vb.w.toFixed(2)} ${vb.h.toFixed(2)}`;
}

type StateBounds = { minX: number; minY: number; maxX: number; maxY: number };

function computeStateBounds(feature: GeoFeature): StateBounds | null {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const expand = (ring: Ring) => {
    for (const [lon, lat] of ring) {
      const pt = project(lon, lat);
      if (!pt) continue;
      if (pt[0] < minX) minX = pt[0];
      if (pt[1] < minY) minY = pt[1];
      if (pt[0] > maxX) maxX = pt[0];
      if (pt[1] > maxY) maxY = pt[1];
    }
  };
  if (!feature.geometry) return null;
  if (feature.geometry.type === "Polygon")
    feature.geometry.coordinates.forEach(expand);
  else
    feature.geometry.coordinates.forEach(poly => poly.forEach(expand));
  if (minX === Infinity) return null;
  return { minX, minY, maxX, maxY };
}

function buildBoundsMap(states: GeoFeatureCollection): Map<string, StateBounds> {
  const m = new Map<string, StateBounds>();
  for (const f of states.features) {
    const name = String(f.properties?.NAME ?? f.properties?.name ?? "");
    if (!name) continue;
    const b = computeStateBounds(f);
    if (b) m.set(name, b);
  }
  return m;
}

function boundsToViewBox(bounds: StateBounds | null): ViewBox {
  if (!bounds) return NATIONAL_VBOX;
  const bw = bounds.maxX - bounds.minX;
  const bh = bounds.maxY - bounds.minY;
  // Increased padding (0.20 / min 15) gives node labels room to breathe
  const pad = Math.max(Math.min(bw, bh) * 0.20, 15);
  let x = bounds.minX - pad;
  let y = bounds.minY - pad;
  let w = bw + pad * 2;
  let h = bh + pad * 2;
  // Normalize to NATIONAL_ASPECT so the SVG never letterboxes
  const asp = w / h;
  if (asp > NATIONAL_ASPECT) {
    const nh = w / NATIONAL_ASPECT;
    y -= (nh - h) / 2;
    h = nh;
  } else {
    const nw = h * NATIONAL_ASPECT;
    x -= (nw - w) / 2;
    w = nw;
  }
  return { x, y, w, h };
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

// ── Node label positioning ────────────────────────────────────────────────────
// Scales font size with the zoom level so labels appear at a consistent screen
// size regardless of viewBox. Adjusts text anchor and vertical position to keep
// labels inside the viewBox when nodes are near an edge.

function nodeLabelProps(
  px: number,
  py: number,
  labelText: string,
  vb: ViewBox,
): {
  x: number;
  y: number;
  fontSize: number;
  anchor: "start" | "middle" | "end";
  strokeWidth: number;
} {
  // zoom factor relative to national view (< 1 = more zoomed in)
  const scale = vb.w / NATIONAL_VBOX.w;

  // Font size in SVG units — stays visually constant on screen
  const fontSize = Math.max(1.5, 10 * scale);

  // Estimated half-width of the label in SVG units
  const charW   = 5.5 * scale;
  const halfW   = (labelText.length * charW) / 2;
  const above   = 13 * scale; // distance above the dot
  const margin  = 4  * scale;

  // Horizontal: start / middle / end anchor to avoid left/right clipping
  let anchor: "start" | "middle" | "end" = "middle";
  if (px - vb.x < halfW + margin)              anchor = "start";
  else if ((vb.x + vb.w) - px < halfW + margin) anchor = "end";

  // Vertical: flip below dot when near the top edge
  const y = (py - vb.y < above + margin)
    ? py + above + fontSize
    : py - above;

  return { x: px, y, fontSize, anchor, strokeWidth: 3 * scale };
}

function lerpVB(a: ViewBox, b: ViewBox, t: number): ViewBox {
  const e = easeInOut(t);
  return {
    x: a.x + (b.x - a.x) * e,
    y: a.y + (b.y - a.y) * e,
    w: a.w + (b.w - a.w) * e,
    h: a.h + (b.h - a.h) * e,
  };
}

// Animate viewBox from `from` → `to` over `ms` milliseconds.
// Calls `onFrame` on every rAF tick; resolves when done or cancelled.
function animateVB(
  from: ViewBox,
  to: ViewBox,
  ms: number,
  onFrame: (vb: ViewBox) => void,
  cancelled: { current: boolean }
): Promise<void> {
  return new Promise((resolve) => {
    const t0 = performance.now();
    function tick() {
      if (cancelled.current) { resolve(); return; }
      const frac = Math.min((performance.now() - t0) / ms, 1);
      onFrame(lerpVB(from, to, frac));
      if (frac < 1) requestAnimationFrame(tick);
      else resolve();
    }
    requestAnimationFrame(tick);
  });
}

// ── Sequence constants ────────────────────────────────────────────────────────

const SEQ = {
  national:    2200,  // full US + America 250 label
  zoomIn:       750,  // transition to state
  stateFocus:  3500,  // state fills map + pathway animation
  zoomOut:      750,  // return to national
} as const;

type SequencePhase = "national" | "zooming-in" | "state-focus" | "zooming-out";

// ── State cache ───────────────────────────────────────────────────────────────

let cachedStates: GeoFeatureCollection | null = null;
let cachedBoundsMap: Map<string, StateBounds> | null = null;

type MapAssetState =
  | { status: "loading" }
  | { status: "ready"; states: GeoFeatureCollection; boundsMap: Map<string, StateBounds> }
  | { status: "unavailable" };

// ── Main component ────────────────────────────────────────────────────────────

export function LivingOpportunityMap({
  stories = CURATED_EXPLORATION_STORIES,
}: {
  stories?: FeaturedStory[];
}) {
  const [active, setActive]         = useState(0);
  const [phase, setPhase]           = useState<SequencePhase>("national");
  const [viewBox, setViewBox]       = useState<ViewBox>(NATIONAL_VBOX);
  const [reduceMotion, setRM]       = useState(false);
  const [mapAssets, setMapAssets]   = useState<MapAssetState>({ status: "loading" });
  const [seqKey, setSeqKey]         = useState(0); // increment to restart sequence
  const activeRef = useRef(0);
  const pausedRef = useRef(false);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reduced-motion detection
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setRM(mq.matches);
    apply();
    mq.addEventListener?.("change", apply);
    return () => mq.removeEventListener?.("change", apply);
  }, []);

  // Map asset loading
  useEffect(() => {
    if (cachedStates && cachedBoundsMap) {
      setMapAssets({ status: "ready", states: cachedStates, boundsMap: cachedBoundsMap });
      return;
    }
    fetch("/maps/us-states.geojson")
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() as Promise<GeoFeatureCollection>; })
      .then(data => {
        if (data.type !== "FeatureCollection" || !Array.isArray(data.features) || data.features.length < 50)
          throw new Error("Invalid states GeoJSON");
        cachedStates = data;
        cachedBoundsMap = buildBoundsMap(data);
        setMapAssets({ status: "ready", states: data, boundsMap: cachedBoundsMap });
      })
      .catch(() => setMapAssets({ status: "unavailable" }));
  }, []);

  // Animated discovery sequence
  useEffect(() => {
    if (reduceMotion || stories.length < 2 || mapAssets.status !== "ready") return;

    const { boundsMap } = mapAssets;
    const cancelled = { current: false };
    let idx = activeRef.current;

    const wait = (ms: number) =>
      new Promise<void>(r => { const id = setTimeout(r, ms); void id; });

    async function run() {
      let currentVB = NATIONAL_VBOX;
      // Reset to national before starting
      setViewBox(NATIONAL_VBOX);
      currentVB = NATIONAL_VBOX;

      while (!cancelled.current) {
        // Wait out any user-initiated pause
        while (pausedRef.current && !cancelled.current) await wait(200);
        if (cancelled.current) break;

        const story = stories[idx];
        const bounds = boundsMap.get(story.state) ?? null;
        const stateVB = boundsToViewBox(bounds);

        // ─── Phase 1: National view ───────────────────────────────────────
        setPhase("national");
        if (currentVB !== NATIONAL_VBOX) {
          setViewBox(NATIONAL_VBOX);
          currentVB = NATIONAL_VBOX;
        }
        await wait(SEQ.national);
        if (cancelled.current) break;

        // ─── Phase 2: Zoom in ─────────────────────────────────────────────
        setPhase("zooming-in");
        await animateVB(NATIONAL_VBOX, stateVB, SEQ.zoomIn, vb => {
          setViewBox(vb);
          currentVB = vb;
        }, cancelled);
        if (cancelled.current) break;

        // ─── Phase 3: State focus + pathways ─────────────────────────────
        setPhase("state-focus");
        await wait(SEQ.stateFocus);
        if (cancelled.current) break;

        // ─── Phase 4: Zoom out ────────────────────────────────────────────
        setPhase("zooming-out");
        await animateVB(stateVB, NATIONAL_VBOX, SEQ.zoomOut, vb => {
          setViewBox(vb);
          currentVB = vb;
        }, cancelled);
        if (cancelled.current) break;

        // Advance to next story
        idx = (idx + 1) % stories.length;
        activeRef.current = idx;
        setActive(idx);
      }
    }

    run();
    return () => { cancelled.current = true; };
  }, [reduceMotion, stories.length, mapAssets.status, seqKey]); // eslint-disable-line

  const story = stories[active] ?? stories[0];

  function select(index: number) {
    activeRef.current = index;
    setActive(index);
    pausedRef.current = true;
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => {
      pausedRef.current = false;
    }, (SEQ.national + SEQ.zoomIn + SEQ.stateFocus + SEQ.zoomOut) * 1.5);
    // Restart sequence at selected story
    setSeqKey(k => k + 1);
  }

  const showAmerica250 = phase === "national" || phase === "zooming-out";
  const nationalLabelVisible = phase === "national";

  // Series-aware branding
  const seriesId = detectSeriesId(stories);
  const series   = getFeaturedSeries(seriesId);
  const headerLabel = seriesId === "standard"
    ? FEATURED_EXPLORATION_LABEL
    : series.badge;
  const headerNote = seriesId === "standard"
    ? FEATURED_EXPLORATION_ILLUSTRATIVE_NOTE
    : series.tagline;

  return (
    <section
      aria-label={series.label}
      style={{
        border: "1px solid #cdd9ec",
        borderRadius: 16,
        background: "linear-gradient(160deg, #f3f7fd 0%, #e7eef9 100%)",
        color: "#162033",
        padding: 20,
        display: "grid",
        gap: 16,
      }}
    >
      <style>{`
        @keyframes furlong-pulse {
          0%   { transform: scale(1);   opacity: 0.5; }
          70%  { transform: scale(2.4); opacity: 0;   }
          100% { transform: scale(2.4); opacity: 0;   }
        }
        @keyframes furlong-flow {
          to { stroke-dashoffset: -20; }
        }
        .furlong-pulse-ring {
          transform-box: fill-box;
          transform-origin: center;
          animation: furlong-pulse 2.6s ease-out infinite;
        }
        .furlong-flow {
          stroke-dasharray: 4 6;
          animation: furlong-flow 1.8s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .furlong-pulse-ring { animation: none; opacity: 0; }
          .furlong-flow       { animation: none; }
        }
        .fl-story-btn:focus-visible {
          outline: 2px solid #0f766e;
          outline-offset: 2px;
        }
      `}</style>

      {/* Header row — series-aware */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "baseline", justifyContent: "space-between" }}>
        <strong style={{ fontSize: 14, letterSpacing: 0.3, textTransform: "uppercase", color: "#162033" }}>
          {headerLabel}
        </strong>
        <span style={{ fontSize: 14, color: "#5d687a" }}>
          {headerNote}
        </span>
      </div>

      {/* Map — full width */}
      <div style={{ position: "relative", borderRadius: 12, overflow: "hidden",
        border: "1px solid #cdd9ec",
        background: "radial-gradient(circle at 20% 20%, rgba(79,112,180,0.06), transparent 28%), linear-gradient(180deg,#ffffff 0%,#f8fbff 100%)",
      }}>
        {mapAssets.status === "loading" && (
          <div aria-hidden style={{ display: "flex", alignItems: "center", justifyContent: "center",
            minHeight: 240, color: "#9db4d8", fontSize: 13 }}>
            Loading map…
          </div>
        )}
        {mapAssets.status === "unavailable" && (
          <AbstractOpportunityNetwork story={story} reduceMotion={reduceMotion} />
        )}
        {mapAssets.status === "ready" && (
          <RealUsMap
            states={mapAssets.states}
            story={story}
            phase={phase}
            viewBox={viewBox}
            showAmerica250={showAmerica250}
            reduceMotion={reduceMotion}
          />
        )}

        {/* "Full Map Exploration" national label */}
        <div aria-hidden style={{
          position: "absolute", bottom: 14, left: 14,
          background: "rgba(248,251,255,0.93)",
          border: "1px solid #cdd9ec",
          borderRadius: 8,
          padding: "6px 13px",
          fontSize: 12,
          fontWeight: 700,
          color: "#35507a",
          letterSpacing: 0.5,
          textTransform: "uppercase",
          opacity: nationalLabelVisible ? 1 : 0,
          transition: "opacity 0.5s",
          pointerEvents: "none",
          userSelect: "none",
        }}>
          Full Map Exploration
        </div>

        {/* America 250 badge */}
        <div aria-hidden style={{
          position: "absolute", top: 14, left: 14,
          background: "rgba(248,251,255,0.93)",
          border: "1px solid #cdd9ec",
          borderRadius: 8,
          padding: "4px 10px",
          fontSize: 12,
          fontWeight: 700,
          color: "#35507a",
          letterSpacing: 0.5,
          opacity: nationalLabelVisible ? 0.95 : 0,
          transition: "opacity 0.5s",
          pointerEvents: "none",
          userSelect: "none",
        }}>
          America 250 — Admission Eras
        </div>
      </div>

      {/* Story card — below map, full width */}
      <StoryCard story={story} phase={phase} />

      {/* State selector */}
      <div role="group" aria-label="Choose a featured exploration"
        style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {stories.map((s, i) => {
          const isActive = i === active;
          return (
            <button key={`sel-${s.stateAbbr}`} type="button"
              className="fl-story-btn"
              onClick={() => select(i)}
              aria-pressed={isActive}
              style={{
                minHeight: 40, padding: "0 14px", borderRadius: 999,
                border: isActive ? `1px solid ${s.color}` : "1px solid #cdd9ec",
                background: isActive ? "#ffffff" : "transparent",
                color: isActive ? "#162033" : "#5d687a",
                fontWeight: 700, fontSize: 14, cursor: "pointer",
              }}
            >
              {s.state}
            </button>
          );
        })}
      </div>

      <p style={{ margin: 0, fontSize: 14, color: "#5d687a", lineHeight: 1.6 }}>
        Featured explorations are illustrative examples only. No geolocation,
        no exact addresses, and no personalized location tracking are used.
        The map reveals opportunities, not the visitor. We show pathways, not promises.
      </p>
    </section>
  );
}

// ── Real U.S. map ─────────────────────────────────────────────────────────────

function RealUsMap({
  states,
  story,
  phase,
  viewBox,
  showAmerica250,
  reduceMotion,
}: {
  states: GeoFeatureCollection;
  story: FeaturedStory;
  phase: SequencePhase;
  viewBox: ViewBox;
  showAmerica250: boolean;
  reduceMotion: boolean;
}) {
  const markerPoints = story.connectedNodes
    .map(node => {
      const pt = project(node.latLon.lon, node.latLon.lat);
      return pt ? { ...node, svgX: pt[0], svgY: pt[1] } : null;
    })
    .filter(Boolean) as Array<{ type: string; svgX: number; svgY: number }>;

  const polylinePoints = markerPoints
    .map(p => `${p.svgX.toFixed(1)},${p.svgY.toFixed(1)}`)
    .join(" ");

  const america250Opacity = showAmerica250 ? 1 : 0;
  const isStateFocus = phase === "state-focus" || phase === "zooming-in";

  return (
    <svg
      viewBox={vbStr(viewBox)}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={
        phase === "national"
          ? "Full U.S. map — illustrative exploration overview, not based on your location."
          : `U.S. map zoomed to ${story.state} — illustrative ${story.theme} exploration${story.period ? `, ${story.period}` : ""}. Not based on your location.`
      }
      style={{ width: "100%", height: "auto", display: "block" }}
    >
      <defs>
        <filter id="fl-glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="fl-soft" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="8" />
        </filter>
      </defs>

      {/* ── America 250 era fills (national view only) ── */}
      <g style={{ opacity: america250Opacity, transition: "opacity 0.7s" }}>
        {states.features.map((feature, i) => {
          if (!feature.geometry) return null;
          const name = String(feature.properties?.NAME ?? feature.properties?.name ?? "");
          const era = ADMISSION_ERA[name];
          if (!era) return null;
          const d = geometryToPath(feature.geometry);
          if (!d) return null;
          return (
            <path
              key={`era-${i}`}
              d={d}
              fill={ERA_FILL[era]}
              stroke={ERA_STROKE[era]}
              strokeWidth={0.6}
              strokeLinejoin="round"
            />
          );
        })}
      </g>

      {/* ── State outlines ── */}
      {states.features.map((feature, i) => {
        if (!feature.geometry) return null;
        const d = geometryToPath(feature.geometry);
        if (!d) return null;
        const name = String(feature.properties?.NAME ?? feature.properties?.name ?? "");
        const isFeatured = name === story.state;
        return (
          <path
            key={`state-${i}`}
            d={d}
            fill={
              isFeatured
                ? `${story.color}22`
                : showAmerica250 ? "transparent" : "#e8eef8"
            }
            stroke={isFeatured ? story.color : "#c5d3e8"}
            strokeWidth={isFeatured ? 1.5 : 0.5}
            strokeLinejoin="round"
          />
        );
      })}

      {/* ── National soft pathway lines (national view) ── */}
      {!isStateFocus && markerPoints.length >= 2 && (
        <polyline
          points={polylinePoints}
          fill="none"
          stroke={story.color}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.35}
          strokeDasharray="3 8"
        />
      )}

      {/* ── State focus pathway lines ── */}
      {isStateFocus && markerPoints.length >= 2 && !reduceMotion && (
        <polyline
          className="furlong-flow"
          points={polylinePoints}
          fill="none"
          stroke={story.color}
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.9}
        />
      )}
      {isStateFocus && markerPoints.length >= 2 && reduceMotion && (
        <polyline
          points={polylinePoints}
          fill="none"
          stroke={story.color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.6}
        />
      )}

      {/* ── Node markers ── */}
      {isStateFocus && markerPoints.map((pt, idx) => (
        <g key={`node-${story.state}-${pt.type}`}>
          <circle cx={pt.svgX} cy={pt.svgY} r={22}
            fill={story.color} opacity={0.07} filter="url(#fl-soft)" />
          {idx === 1 && (
            <circle className="furlong-pulse-ring"
              cx={pt.svgX} cy={pt.svgY} r={10}
              fill={story.color} opacity={0.25} />
          )}
          <circle cx={pt.svgX} cy={pt.svgY} r={8}
            fill={story.color} opacity={0.18} />
          <circle cx={pt.svgX} cy={pt.svgY} r={5}
            fill={story.color} />
          <circle cx={pt.svgX} cy={pt.svgY} r={2}
            fill="#ffffff" opacity={0.9} />
          {(() => {
            const lp = nodeLabelProps(pt.svgX, pt.svgY, pt.type, viewBox);
            return (
              <text
                x={lp.x} y={lp.y}
                textAnchor={lp.anchor}
                fontSize={lp.fontSize}
                fontWeight={700}
                fill="#1f2a3d"
                paintOrder="stroke"
                stroke="#f8fbff"
                strokeWidth={lp.strokeWidth}
              >
                {pt.type}
              </text>
            );
          })()}
        </g>
      ))}

      {/* ── National view: small markers only ── */}
      {!isStateFocus && markerPoints.map(pt => (
        <circle key={`sm-${story.state}-${pt.type}`}
          cx={pt.svgX} cy={pt.svgY} r={4}
          fill={story.color} opacity={0.7} />
      ))}

      {/* ── America 250 era legend (national view) ── */}
      <g style={{ opacity: america250Opacity, transition: "opacity 0.7s" }}>
        {ERA_LEGEND.map((item, i) => (
          <g key={item.era} transform={`translate(${NATIONAL_VBOX.x + 8}, ${NATIONAL_VBOX.y + 8 + i * 15})`}>
            <rect x={0} y={0} width={10} height={10} rx={2}
              fill={item.color} />
            <text x={14} y={9} fontSize={8} fill="#5d687a">
              {item.label}
            </text>
          </g>
        ))}
      </g>
    </svg>
  );
}

// ── Abstract fallback ─────────────────────────────────────────────────────────

const FALLBACK_HUBS = [
  { x: 140, y: 180 }, { x: 260, y: 110 }, { x: 310, y: 270 },
  { x: 490, y: 155 }, { x: 550, y: 290 }, { x: 720, y: 115 },
  { x: 790, y: 245 }, { x: 890, y: 175 },
] as const;

const FALLBACK_CONNECTIONS: [number, number][] = [
  [0,2],[0,3],[1,3],[2,4],[3,5],[3,6],[4,6],[5,7],[6,7],
];

function AbstractOpportunityNetwork({ story, reduceMotion }: { story: FeaturedStory; reduceMotion: boolean }) {
  void reduceMotion;
  return (
    <div style={{ position: "relative" }}>
      <svg viewBox="0 0 960 580" preserveAspectRatio="xMidYMid meet"
        role="img" aria-label="Opportunity network diagram — map asset temporarily unavailable."
        style={{ width: "100%", height: "auto", display: "block", opacity: 0.55 }}>
        <defs>
          <linearGradient id="fb-fade" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#9db4d8" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#9db4d8" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        {FALLBACK_CONNECTIONS.map(([a, b]) => (
          <line key={`${a}-${b}`}
            x1={FALLBACK_HUBS[a].x} y1={FALLBACK_HUBS[a].y}
            x2={FALLBACK_HUBS[b].x} y2={FALLBACK_HUBS[b].y}
            stroke="url(#fb-fade)" strokeWidth="2" />
        ))}
        {FALLBACK_HUBS.map((h, i) => (
          <circle key={i} cx={h.x} cy={h.y} r={14} fill="#9db4d8" opacity={0.18} />
        ))}
        {FALLBACK_HUBS.map((h, i) => (
          <circle key={`c-${i}`} cx={h.x} cy={h.y} r={6} fill="#9db4d8" opacity={0.5} />
        ))}
      </svg>
      <div style={{ position: "absolute", bottom: 10, left: 0, right: 0, textAlign: "center", pointerEvents: "none" }}>
        <span style={{ display: "inline-block", background: "rgba(248,251,255,0.92)",
          border: "1px solid #cdd9ec", borderRadius: 8, padding: "4px 12px",
          fontSize: 13, color: "#5d687a" }}>
          Opportunity Network — Map asset temporarily unavailable.
        </span>
      </div>
      <div aria-live="polite" style={{ display: "none" }}>{story.state}</div>
    </div>
  );
}

// ── Theme badge ───────────────────────────────────────────────────────────────

const THEME_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  modern:    { bg: "#eef3fb", color: "#35507a", label: "Featured Exploration / Illustrative example" },
  historical:{ bg: "#fef3e2", color: "#8b5e00", label: "Historical Exploration / Educational context" },
  evolution: { bg: "#f0f7f0", color: "#2e6b3a", label: "Then & Now / Illustrative evolution" },
};

// America 250 series badge overrides the theme badge when seriesId === "america-250"
const AMERICA_250_BADGE = {
  bg:    "#eef1f7",
  color: "#2d4270",
  label: "America 250 · Exploration",
};

// ── Story card ────────────────────────────────────────────────────────────────

function StoryCard({ story, phase }: { story: FeaturedStory; phase: SequencePhase }) {
  // America 250 series overrides the theme badge with series-specific branding
  const badge = story.seriesId === "america-250"
    ? AMERICA_250_BADGE
    : (THEME_BADGE[story.theme] ?? THEME_BADGE.modern);

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "minmax(0,1.2fr) minmax(0,1fr)",
      gap: 16,
      alignItems: "start",
    }}>
      {/* Left: story detail */}
      <div style={{ display: "grid", gap: 10 }}>
        <div style={{ display: "inline-flex", alignSelf: "start",
          padding: "5px 12px", borderRadius: 999,
          background: badge.bg, color: badge.color,
          fontSize: 13, fontWeight: 700 }}>
          {badge.label}
        </div>

        <div aria-live="polite" aria-atomic="true" style={{ display: "grid", gap: 6 }}>
          <span style={{ fontSize: 13, color: "#5d687a", fontWeight: 600 }}>Featured region</span>
          <strong style={{ fontSize: 20, lineHeight: 1.3 }}>{story.state} · {story.county}</strong>
          {story.period && (
            <span style={{ fontSize: 14, color: "#5d687a", fontWeight: 600, letterSpacing: 0.2 }}>
              {story.period}
            </span>
          )}
        </div>

        <p style={{ margin: 0, lineHeight: 1.65, color: "#1f2a3d", fontSize: 16 }}>
          {story.story}
        </p>

        {story.historicalContext && (
          <p style={{ margin: 0, lineHeight: 1.65, color: "#5d687a", fontSize: 14,
            fontStyle: "italic", borderLeft: "2px solid #b9c8d9", paddingLeft: 10 }}>
            {story.historicalContext}
          </p>
        )}
      </div>

      {/* Right: pathway + nodes */}
      <div style={{ display: "grid", gap: 10 }}>
        <div style={{ display: "inline-flex", alignSelf: "start",
          padding: "4px 12px", borderRadius: 999,
          background: "#eef3fb", color: "#35507a",
          fontSize: 13, fontWeight: 700 }}>
          {story.opportunity}
        </div>

        <p style={{ margin: 0, fontSize: 15, color: "#3d4f63", lineHeight: 1.65 }}>
          <span style={{ fontWeight: 600 }}>Exploration path:</span> {story.pathway}
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {story.connectedNodes.map((node, index) => (
            <span key={`chip-${story.state}-${node.type}`}
              style={{ fontSize: 14, color: "#3d4f63" }}>
              {node.type}{index < story.connectedNodes.length - 1 ? " →" : ""}
            </span>
          ))}
        </div>

        {/* Phase indicator */}
        <div
          style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 4 }}
          aria-label={`Map sequence: ${phase === "national" ? "full U.S. view" : phase === "zooming-in" ? "zooming to " + story.state : phase === "state-focus" ? story.state + " focus" : "returning to full map"}`}
        >
          {(["national", "zooming-in", "state-focus", "zooming-out"] as SequencePhase[]).map((p) => (
            <div key={p} style={{
              width: 7, height: 7, borderRadius: "50%",
              background: phase === p ? story.color : "#d7deea",
              transition: "background 0.3s",
            }} aria-hidden />
          ))}
          <span style={{ fontSize: 13, color: "#5d687a", fontWeight: 500 }}>
            {phase === "national" ? "Full map" : phase === "zooming-in" ? "Zooming in…" : phase === "state-focus" ? story.stateAbbr : "Returning…"}
          </span>
        </div>
      </div>
    </div>
  );
}
