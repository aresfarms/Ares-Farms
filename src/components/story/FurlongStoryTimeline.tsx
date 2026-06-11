"use client";

/**
 * FurlongStoryTimeline — Build 56 (round 5)
 *
 * The /about founding-story map. This is the Furlong FOUNDING-THREAD storyline —
 * NOT the homepage "Hidden Gem Tour". It renders its own milestones:
 *
 *   Amber Thread   — Historical Journey A: Virginia → Lower Chesapeake/Delmarva → Sussex Co., DE
 *   Sapphire Thread — Historical Journey B: Great Plains (Nebraska · Colorado) → Boston · NYC
 *   Modern Convergence — the founding of Furlong (where the threads meet)
 *   plus the framing milestone: 2026 — America 250
 *
 * It reuses the homepage map's INTERACTION (not its data): as the path advances
 * between milestones, a narrative card pops up ON the map, anchored at the
 * milestone's point, clamped so it never clips the edges, with a comfortable
 * dwell, reduced-motion support, and Prev/Next/Begin controls. Most milestones
 * are text-only cards — that is intended; the point is the narrative on the path.
 *
 * Privacy posture (unchanged): no living-person identifiers, no exact modern
 * locations, no founder names. Threads are illustrative; coordinates are
 * region-level approximations only.
 *
 * Public Alpha remains PENDING.
 * "The map reveals opportunities, not the visitor."
 */

import { useEffect, useRef, useState } from "react";

// ── Albers USA projection (fixed full-US view; matches the homepage map) ──────

const DEG = Math.PI / 180;

function albersConicEqualArea(phiLow: number, phiHigh: number, lambda0: number, phi0: number) {
  const n = (Math.sin(phiLow) + Math.sin(phiHigh)) / 2;
  const C = Math.cos(phiLow) ** 2 + 2 * n * Math.sin(phiLow);
  const r0 = Math.sqrt(C - 2 * n * Math.sin(phi0)) / n;
  return (lambda: number, phi: number): [number, number] => {
    const rho = Math.sqrt(C - 2 * n * Math.sin(phi)) / n;
    const theta = n * (lambda - lambda0);
    return [rho * Math.sin(theta), r0 - rho * Math.cos(theta)];
  };
}

const lower48 = albersConicEqualArea(29.5 * DEG, 45.5 * DEG, -96 * DEG, 37.5 * DEG);
const SCALE = 1060, TX = 485, TY = 275;

function project(lon: number, lat: number): [number, number] | null {
  if (lon > -60 || lon < -180 || lat < 20 || lat > 72) return null;
  const [px, py] = lower48(lon * DEG, lat * DEG);
  const x = px * SCALE + TX;
  const y = -py * SCALE + TY;
  if (x < -20 || x > 980 || y < -20 || y > 620) return null;
  return [x, y];
}

// ── GeoJSON → SVG path ────────────────────────────────────────────────────────

type Coord = [number, number];
type Ring = Coord[];
type GeoGeom =
  | { type: "Polygon"; coordinates: Ring[] }
  | { type: "MultiPolygon"; coordinates: Ring[][] };
type GeoFeature = { type: "Feature"; geometry: GeoGeom | null; properties: Record<string, unknown> | null };

function ringToPath(ring: Ring): string {
  const parts: string[] = [];
  for (let i = 0; i < ring.length; i++) {
    const pt = project(ring[i][0], ring[i][1]);
    if (!pt) continue;
    parts.push(`${i === 0 ? "M" : "L"}${pt[0].toFixed(1)},${pt[1].toFixed(1)}`);
  }
  if (parts.length < 2) return "";
  return parts.join(" ") + " Z";
}

function geomToPath(geom: GeoGeom): string {
  if (geom.type === "Polygon") return geom.coordinates.map(ringToPath).join(" ");
  return geom.coordinates.map((p) => p.map(ringToPath).join(" ")).join(" ");
}

function stateName(f: GeoFeature): string {
  return (f.properties?.NAME ?? f.properties?.name ?? "") as string;
}

function ptsToPath(pts: [number, number][]): string {
  if (pts.length < 2) return "";
  return pts.map((pt, i) => `${i === 0 ? "M" : "L"}${pt[0].toFixed(1)},${pt[1].toFixed(1)}`).join(" ");
}

// ── Thread routes (illustrative region-level anchors; U.S. Census TIGER PD) ────

const AMBER_ANCHORS: [number, number][] = [
  [-79.0, 34.3], [-77.0, 37.3], [-76.0, 38.2], [-75.6, 38.7],
];
const SAPPHIRE_ANCHORS: [number, number][] = [
  [-96.7, 40.8], [-104.9, 39.7], [-71.06, 42.36], [-74.01, 40.71],
];
const CONVERGENCE_ANCHOR: [number, number] = [-74.5, 40.1];

const AMBER_SVG = AMBER_ANCHORS.map(([lo, la]) => project(lo, la)).filter((p): p is [number, number] => !!p);
const SAPPHIRE_SVG = SAPPHIRE_ANCHORS.map(([lo, la]) => project(lo, la)).filter((p): p is [number, number] => !!p);
const CONVERGENCE_SVG = project(CONVERGENCE_ANCHOR[0], CONVERGENCE_ANCHOR[1]);

// ── Milestones (the founding-thread set) ──────────────────────────────────────

type StoryThread = "national" | "amber" | "sapphire" | "convergence";

type Milestone = {
  id: string;
  thread: StoryThread;
  label: string;
  region: string;
  era: string;
  body: string;
  coords: [number, number];          // marker + card anchor
  amberHighlight?: ReadonlySet<string>;
  sapphireHighlight?: ReadonlySet<string>;
  amberCount: number;                // amber anchors drawn so far (0–4)
  sapphireCount: number;             // sapphire anchors drawn so far (0–4)
};

const MILESTONES: Milestone[] = [
  {
    id: "m0-america250", thread: "national",
    label: "America 250 Living History", region: "United States of America",
    era: "2026 — Semiquincentennial",
    body: "In 2026, America marks 250 years of independence. Across the country, families and communities are reconnecting with the threads of history that shaped the land they live on — and the values they carry forward. The Furlong story is one of those threads.",
    coords: [-98.0, 39.5], amberCount: 0, sapphireCount: 0,
  },
  {
    id: "m1-amber-virginia", thread: "amber",
    label: "Amber Thread — Historical Journey A: Virginia", region: "Tidal River Region · Virginia",
    era: "Late 17th Century",
    body: "Historical Journey A begins along Virginia's tidal rivers and creek-cut inland counties. Farming families built lives from demanding land — the ties between people, fields, and waterways ran deep. This is where the Amber Thread starts.",
    coords: [-77.0, 37.3], amberHighlight: new Set(["Virginia", "North Carolina"]),
    amberCount: 2, sapphireCount: 0,
  },
  {
    id: "m2-amber-chesapeake", thread: "amber",
    label: "Amber Thread — Historical Journey A: Chesapeake", region: "Lower Chesapeake Bay · Delmarva Peninsula",
    era: "Late 17th Century",
    body: "The Amber Thread moves north — across estuaries, around headlands, up the bay. Each crossing required reading the land, calculating risk, and trusting what could be cultivated from difficult terrain. The journey follows the water.",
    coords: [-76.0, 38.2], amberHighlight: new Set(["Virginia", "Maryland", "Delaware"]),
    amberCount: 3, sapphireCount: 0,
  },
  {
    id: "m3-amber-delaware", thread: "amber",
    label: "Amber Thread — Historical Journey A: Delaware", region: "Sussex County · Southern Delaware",
    era: "18th Century",
    body: "Across generations, the Amber Thread took root in the First State. Families established themselves in southern Delaware — building agricultural identities that persisted long after the original settlers were gone. The land held the memory of those choices.",
    coords: [-75.6, 38.7], amberHighlight: new Set(["Delaware"]),
    amberCount: 4, sapphireCount: 0,
  },
  {
    id: "m4-sapphire-west", thread: "sapphire",
    label: "Sapphire Thread — Historical Journey B: Great Plains", region: "Nebraska · Colorado",
    era: "19th Century",
    body: "Historical Journey B begins in the open homestead territories of Nebraska and Colorado. Families carved lives from the plains and foothills — building farms, institutions, and community ties in young towns. The Sapphire Thread is rooted in land, just as the Amber Thread is.",
    coords: [-96.7, 40.8], amberHighlight: new Set(["Delaware"]),
    sapphireHighlight: new Set(["Nebraska", "Colorado"]), amberCount: 4, sapphireCount: 2,
  },
  {
    id: "m5-sapphire-east", thread: "sapphire",
    label: "Sapphire Thread — Historical Journey B: Northeast", region: "Boston, Massachusetts · New York City",
    era: "Early 20th Century",
    body: "The Sapphire Thread moved eastward — through Boston's educational and institutional corridors and into New York City's commercial networks. Skills built on open land found new application in the city. The journey followed opportunity, always carrying the values forged in the west.",
    coords: [-74.01, 40.71], amberHighlight: new Set(["Delaware"]),
    sapphireHighlight: new Set(["Massachusetts", "New York"]), amberCount: 4, sapphireCount: 4,
  },
  {
    id: "m6-convergence", thread: "convergence",
    label: "Modern Convergence — The founding of Furlong", region: "The founding of Furlong",
    era: "Present Day",
    body: "Two separate journeys — different geographies, different eras, different challenges — converged in a shared belief: that people make better decisions when they can see the pathways before them. Historical Journey A and Historical Journey B met. That convergence became Furlong.",
    coords: CONVERGENCE_ANCHOR,
    amberHighlight: new Set(["Virginia", "Maryland", "Delaware", "New Jersey", "New York"]),
    amberCount: 4, sapphireCount: 4,
  },
];

const THREAD_COLOR: Record<StoryThread, string> = {
  national: "#456077", amber: "#c9a84c", sapphire: "#3b82f6", convergence: "#c9a84c",
};

// ── Constants ─────────────────────────────────────────────────────────────────

/** Dwell per milestone. Text-only cards read quickly, so this is snappier than
 *  the image-carrying homepage tour (which dwells ~11s/stop). */
const DWELL_MS = 7_000;
const POPUP_W = 264;
const CARD_GAP = 14;
const CARD_MARGIN = 12;
const GOLD = "#b8862f";

type MapStatus = "loading" | "ready" | "unavailable";
let _geoCache: GeoFeature[] | null = null;

// ── Component ─────────────────────────────────────────────────────────────────

export function FurlongStoryTimeline() {
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [mapStatus, setMapStatus] = useState<MapStatus>("loading");
  const [features, setFeatures] = useState<GeoFeature[]>([]);
  const [reduceMotion, setRM] = useState(false);
  const [measuredCardH, setMeasuredCardH] = useState(150);

  const activeRef = useRef(0);
  const playingRef = useRef(false);
  const reduceMotionRef = useRef(false);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => { activeRef.current = active; }, [active]);
  useEffect(() => { playingRef.current = playing; }, [playing]);
  useEffect(() => { reduceMotionRef.current = reduceMotion; }, [reduceMotion]);

  const [svgMeasure, setSvgMeasure] = useState<{
    scale: number; offsetX: number; offsetY: number; containerWidth: number; containerHeight: number;
  } | null>(null);

  // ── prefers-reduced-motion ──────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setRM(mq.matches);
    apply();
    mq.addEventListener?.("change", apply);
    return () => mq.removeEventListener?.("change", apply);
  }, []);

  // ── GeoJSON ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (_geoCache) { setFeatures(_geoCache); setMapStatus("ready"); return; }
    fetch("/maps/us-states.geojson")
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d: { type: string; features: GeoFeature[] }) => {
        if (d.type !== "FeatureCollection" || !Array.isArray(d.features)) throw new Error();
        _geoCache = d.features; setFeatures(d.features); setMapStatus("ready");
      })
      .catch(() => setMapStatus("unavailable"));
  }, []);

  // ── SVG measurement (SVG px → CSS px for the on-map card) ────────────────────
  useEffect(() => {
    if (mapStatus !== "ready") return;
    const measure = () => {
      const svg = svgRef.current, cont = mapContainerRef.current;
      if (!svg || !cont) return;
      const sr = svg.getBoundingClientRect(), cr = cont.getBoundingClientRect();
      setSvgMeasure({
        scale: sr.width / 960, offsetX: sr.left - cr.left, offsetY: sr.top - cr.top,
        containerWidth: cr.width, containerHeight: cr.height,
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (mapContainerRef.current) ro.observe(mapContainerRef.current);
    return () => ro.disconnect();
  }, [mapStatus]);

  // ── Measure card height (for clamping) ───────────────────────────────────────
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    const h = card.getBoundingClientRect().height;
    if (h > 0) setMeasuredCardH(h);
    const ro = new ResizeObserver((e) => {
      const rh = e[0]?.contentRect.height;
      if (rh && rh > 0) setMeasuredCardH(rh);
    });
    ro.observe(card);
    return () => ro.disconnect();
  }, [active]);

  // ── Auto-advance ticker (advances milestones; stops at the last) ─────────────
  function startTick() {
    if (tickRef.current) clearInterval(tickRef.current);
    if (reduceMotionRef.current) return;
    tickRef.current = setInterval(() => {
      if (!playingRef.current) return;
      const next = activeRef.current + 1;
      if (next >= MILESTONES.length) {           // reached convergence — stop
        setPlaying(false);
        if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
        return;
      }
      activeRef.current = next;
      setActive(next);
    }, DWELL_MS);
  }
  function stopTick() {
    if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
  }

  // Auto-play on mount (unless reduced motion) — the story is meant to play.
  useEffect(() => {
    if (reduceMotion) { stopTick(); return; }
    setPlaying(true);
    startTick();
    return () => stopTick();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduceMotion]);

  function goTo(n: number) {
    const next = ((n % MILESTONES.length) + MILESTONES.length) % MILESTONES.length;
    setPlaying(false);
    activeRef.current = next;
    setActive(next);
  }
  function handleBegin() { setPlaying(true); startTick(); }
  function handlePause() { setPlaying(false); }
  function handlePlay() {
    if (active >= MILESTONES.length - 1) { goTo(0); }
    setPlaying(true);
    if (!tickRef.current) startTick();
  }
  function handleMapMouseEnter() { stopTick(); }
  function handleMapMouseLeave() { if (!reduceMotion && playingRef.current) startTick(); }

  // ── Derived ──────────────────────────────────────────────────────────────────
  const M = MILESTONES[active];
  const isConvergence = M.thread === "convergence";
  const markerPt = project(M.coords[0], M.coords[1]);

  const amberPts = AMBER_SVG.slice(0, M.amberCount);
  const sapphirePts = SAPPHIRE_SVG.slice(0, M.sapphireCount);
  const amberFull = (isConvergence && CONVERGENCE_SVG) ? [...amberPts, CONVERGENCE_SVG] : amberPts;
  const sapphireFull = (isConvergence && CONVERGENCE_SVG) ? [...sapphirePts, CONVERGENCE_SVG] : sapphirePts;

  // ── Popup card position (anchored at the milestone, clamped to container) ────
  const popupPos = (markerPt && svgMeasure) ? (() => {
    const { scale, offsetX, offsetY, containerWidth, containerHeight } = svgMeasure;
    const rawLeft = offsetX + markerPt[0] * scale;
    const rawTop = offsetY + (markerPt[1] + 20) * scale;
    const left = Math.max(POPUP_W / 2 + 6, Math.min(rawLeft, containerWidth - POPUP_W / 2 - 6));
    const cardH = measuredCardH;
    const roomAbove = rawTop - cardH - CARD_GAP;
    const roomBelow = containerHeight - (rawTop + CARD_GAP + cardH);
    if (roomAbove >= CARD_MARGIN) return { left, top: rawTop, placement: "above" as const };
    if (roomBelow >= -CARD_MARGIN) return { left, top: rawTop, placement: "below" as const };
    return { left, top: CARD_MARGIN + cardH + CARD_GAP, placement: "above" as const };
  })() : null;

  const accent = THREAD_COLOR[M.thread];

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <section
      aria-label="Furlong founding story — convergence map"
      style={{
        border: "1px solid #cdd9ec", borderRadius: 14,
        background: "linear-gradient(160deg, #f3f7fd 0%, #e7eef9 100%)",
        color: "#162033", padding: 14, display: "grid", gap: 0,
      }}
    >
      <style>{`
        @keyframes fs-pulse { 0%{transform:scale(1);opacity:.55} 70%{transform:scale(2.6);opacity:0} 100%{transform:scale(2.6);opacity:0} }
        .fs-pulse-ring { transform-box: fill-box; transform-origin: center; animation: fs-pulse 2.8s ease-out infinite; }
        @keyframes fs-card-fade { from{opacity:0} to{opacity:1} }
        .fs-card-fade { animation: fs-card-fade .4s ease; }
        @media (prefers-reduced-motion: reduce) { .fs-pulse-ring{animation:none;opacity:0} .fs-card-fade{animation:none} }
        .fs-nav-btn { display:inline-flex; align-items:center; justify-content:center; min-height:36px; padding:0 14px; border-radius:999px; border:1px solid #cdd9ec; background:#fff; color:#162033; font-size:14px; font-weight:700; cursor:pointer; font-family:inherit; }
        .fs-nav-btn:hover { border-color:#0f766e; color:#0f766e; }
        .fs-nav-btn:focus-visible { outline:2px solid #0f766e; outline-offset:2px; }
        .fs-play-btn { display:inline-flex; align-items:center; gap:5px; min-height:36px; padding:0 14px; border-radius:999px; border:1.5px solid #b8862f; background:transparent; color:#7a5a1e; font-size:13px; font-weight:700; cursor:pointer; font-family:inherit; }
        .fs-play-btn:hover { background:rgba(184,134,47,.10); }
        .fs-play-btn:focus-visible { outline:2px solid #b8862f; outline-offset:2px; }
      `}</style>

      {/* Series label */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 12px", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10 }}>
        <strong style={{ fontSize: 13, letterSpacing: 0.5, textTransform: "uppercase", color: "#162033" }}>
          The Furlong Story · Convergence Map
        </strong>
        <span style={{ fontSize: 13, color: "#5d687a" }}>
          Illustrative founding threads — privacy-safe.
        </span>
      </div>

      {/* Map container */}
      <div style={{ position: "relative", borderRadius: 12, overflow: "visible", border: "1px solid #cdd9ec", background: "linear-gradient(180deg, #f8fbff 0%, #edf2fb 100%)" }}>
        <div
          ref={mapContainerRef}
          onMouseEnter={handleMapMouseEnter}
          onMouseLeave={handleMapMouseLeave}
          style={{ height: 480, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}
        >
          {mapStatus === "loading" && <p aria-live="polite" style={{ margin: 0, fontSize: 13, color: "#9db4d8" }}>Loading map…</p>}
          {mapStatus === "unavailable" && <p aria-live="polite" style={{ margin: 0, fontSize: 13, color: "#9db4d8", textAlign: "center", padding: "0 24px" }}>Map unavailable — a connection is required.</p>}

          {mapStatus === "ready" && (
            <svg
              ref={svgRef}
              viewBox="0 -20 960 580"
              preserveAspectRatio="xMidYMid meet"
              aria-label={`Founding-thread map — ${M.label}: ${M.region}. Illustrative historical journey.`}
              style={{ width: "auto", height: "100%", maxHeight: 480, display: "block" }}
            >
              {/* States */}
              {features.map((f, i) => {
                if (!f.geometry) return null;
                const d = geomToPath(f.geometry);
                if (!d) return null;
                const name = stateName(f);
                const isA = M.amberHighlight?.has(name) ?? false;
                const isS = M.sapphireHighlight?.has(name) ?? false;
                return (
                  <path key={i} d={d}
                    fill={isA ? "rgba(201,168,76,0.18)" : isS ? "rgba(59,130,246,0.13)" : "#edf2fb"}
                    stroke={isA ? "rgba(201,168,76,0.6)" : isS ? "rgba(59,130,246,0.45)" : "#c5d3e8"}
                    strokeWidth={isA || isS ? 1.4 : 0.5} strokeLinejoin="round" />
                );
              })}

              {/* Amber + sapphire routes */}
              {amberFull.length >= 2 && (
                <path d={ptsToPath(amberFull)} fill="none" stroke={isConvergence ? "#e8c96a" : "#c9a84c"}
                  strokeWidth={isConvergence ? 2.6 : 2} strokeLinecap="round" strokeLinejoin="round" opacity={0.92} />
              )}
              {sapphireFull.length >= 2 && (
                <path d={ptsToPath(sapphireFull)} fill="none" stroke={isConvergence ? "#7ec8fc" : "#3b82f6"}
                  strokeWidth={isConvergence ? 2.6 : 2} strokeLinecap="round" strokeLinejoin="round" opacity={0.88} />
              )}

              {/* Waypoint dots */}
              {amberPts.map(([x, y], i) => (
                <circle key={`a${i}`} cx={x} cy={y} r={3.4} fill="#c9a84c" stroke="#fff" strokeWidth={1} />
              ))}
              {sapphirePts.map(([x, y], i) => (
                <circle key={`s${i}`} cx={x} cy={y} r={3.4} fill="#3b82f6" stroke="#fff" strokeWidth={1} />
              ))}

              {/* Active milestone marker */}
              {markerPt && (
                <g>
                  {playing && !reduceMotion && (
                    <circle className="fs-pulse-ring" cx={markerPt[0]} cy={markerPt[1]} r={9} fill={accent} opacity={0.3} />
                  )}
                  <circle cx={markerPt[0]} cy={markerPt[1]} r={8} fill={accent} opacity={0.18} />
                  <circle cx={markerPt[0]} cy={markerPt[1]} r={5} fill={accent} opacity={0.9} />
                  <circle cx={markerPt[0]} cy={markerPt[1]} r={2.2} fill="#fff" opacity={0.9} />
                </g>
              )}

              {/* Convergence label */}
              {isConvergence && CONVERGENCE_SVG && (
                <text x={CONVERGENCE_SVG[0]} y={CONVERGENCE_SVG[1] + 20} textAnchor="middle" fontSize={9} fontWeight={800} fill="#162033">
                  Furlong
                </text>
              )}
            </svg>
          )}

          {/* On-map narrative card */}
          {popupPos && (
            <div
              ref={cardRef}
              aria-live="polite"
              aria-atomic="true"
              className="fs-card-fade"
              key={M.id}
              style={{
                position: "absolute", zIndex: 10, width: POPUP_W,
                left: popupPos.left, top: popupPos.top,
                transform: popupPos.placement === "above"
                  ? `translate(-50%, calc(-100% - ${CARD_GAP}px))`
                  : `translate(-50%, ${CARD_GAP + 4}px)`,
                background: "rgba(14,20,36,0.93)", border: `1px solid ${accent}55`,
                borderRadius: 10, overflow: "hidden", backdropFilter: "blur(6px)",
                WebkitBackdropFilter: "blur(6px)", boxShadow: "0 6px 24px rgba(0,0,0,0.35)",
                padding: "10px 12px 12px",
              }}
            >
              <p style={{ margin: 0, fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: accent }}>
                {M.era}
              </p>
              <p style={{ margin: "5px 0 2px", fontSize: 12.5, fontWeight: 700, color: "#e8effa", lineHeight: 1.35 }}>
                {M.label}
              </p>
              <p style={{ margin: "0 0 6px", fontSize: 11, color: "#9db4d8", lineHeight: 1.4 }}>
                {M.region}
              </p>
              <p style={{ margin: 0, fontSize: 11.5, color: "#cdd9ec", lineHeight: 1.55 }}>
                {M.body}
              </p>
            </div>
          )}

          {/* America 250 badge */}
          {(M.thread === "national" || isConvergence) && (
            <div aria-hidden="true" style={{ position: "absolute", top: 12, right: 12, zIndex: 2 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(22,32,51,0.82)", color: "#c9a84c", fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", padding: "5px 10px", borderRadius: 6, backdropFilter: "blur(4px)" }}>
                ★ America 250
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Progress dots */}
      <div style={{ marginTop: 8, display: "flex", gap: 5, justifyContent: "center" }}>
        {MILESTONES.map((m, idx) => (
          <span key={m.id} aria-hidden="true" style={{
            width: idx === active ? 18 : 6, height: 6, borderRadius: 999,
            background: idx === active ? THREAD_COLOR[m.thread] : "#cdd9ec",
            transition: "width 0.25s, background 0.25s", display: "inline-block",
          }} />
        ))}
      </div>

      {/* Controls */}
      <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 6 }}>
          <button type="button" className="fs-nav-btn" onClick={() => goTo(active - 1)} aria-label="Previous milestone">← Prev</button>
          <button type="button" className="fs-nav-btn" onClick={() => goTo(active + 1)} aria-label="Next milestone">Next →</button>
        </div>
        {!reduceMotion && (
          <div style={{ display: "flex", gap: 6 }}>
            {playing ? (
              <button type="button" className="fs-play-btn" onClick={handlePause} aria-label="Pause the story">⏸ Pause</button>
            ) : (
              <button type="button" className="fs-play-btn" onClick={handlePlay} aria-label="Play the story">▶ Play</button>
            )}
          </div>
        )}
        <span style={{ fontSize: 12, color: "#5d687a" }}>{active + 1} / {MILESTONES.length}</span>
      </div>

      <p style={{ margin: "10px 0 0", fontSize: 13, color: "#5d687a", lineHeight: 1.6 }}>
        Historical and illustrative only. The Amber and Sapphire threads are
        privacy-safe journeys — no living-person details, no exact modern
        locations, no founder names. The map reveals opportunities, not the visitor.
      </p>
    </section>
  );
}
