"use client";

/**
 * FurlongStoryTimeline — Build 48
 *
 * Interactive convergence timeline for /about/furlong-story.
 * Two threads of history — Amber and Sapphire — that converged
 * in the founding of Furlong.
 *
 * Privacy posture:
 *   - Do not expose modern addresses, living-person details, exact birthdates,
 *     identity-theft-sensitive lineage facts, or full family trees.
 *   - Use "Amber Thread" / "Sapphire Thread" / "Modern Convergence" —
 *     NOT named family lines.
 *   - Map is illustrative, not exact.
 *   - "The map reveals opportunities, not the visitor."
 *
 * Public Alpha remains PENDING.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// ── Albers USA projection (lower 48 only — story focuses on eastern US) ───────
// Same parameters as LivingOpportunityMap. Alaska/Hawaii excluded by bounds guard.

const DEG = Math.PI / 180;

function albersConicEqualArea(
  phiLow: number, phiHigh: number, lambda0: number, phi0: number
) {
  const n  = (Math.sin(phiLow) + Math.sin(phiHigh)) / 2;
  const C  = Math.cos(phiLow) ** 2 + 2 * n * Math.sin(phiLow);
  const r0 = Math.sqrt(C - 2 * n * Math.sin(phi0)) / n;
  return (lambda: number, phi: number): [number, number] => {
    const rho   = Math.sqrt(C - 2 * n * Math.sin(phi)) / n;
    const theta = n * (lambda - lambda0);
    return [rho * Math.sin(theta), r0 - rho * Math.cos(theta)];
  };
}

const lower48 = albersConicEqualArea(29.5 * DEG, 45.5 * DEG, -96 * DEG, 37.5 * DEG);
const SCALE = 1060;
const TX    = 485;
const TY    = 275;

function project(lon: number, lat: number): [number, number] | null {
  // Exclude Alaska and Hawaii — story focuses on eastern U.S.
  if (lat > 50 && lon < -125) return null;
  if (lat < 28 && lon < -140) return null;
  if (lon > -60 || lon < -180 || lat < 20 || lat > 72) return null;
  const [px, py] = lower48(lon * DEG, lat * DEG);
  const x = px * SCALE + TX;
  const y = -py * SCALE + TY;
  if (x < -20 || x > 980 || y < -20 || y > 620) return null;
  return [x, y];
}

// ── GeoJSON → SVG path ────────────────────────────────────────────────────────

type Coord = [number, number];
type Ring  = Coord[];
type GeoGeom =
  | { type: "Polygon";      coordinates: Ring[]   }
  | { type: "MultiPolygon"; coordinates: Ring[][] };

type GeoFeature = {
  type: "Feature";
  geometry: GeoGeom | null;
  properties: Record<string, unknown> | null;
};

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

function geomToPath(geom: GeoGeom): string {
  if (geom.type === "Polygon")
    return geom.coordinates.map(ringToPath).join(" ");
  return geom.coordinates.map(p => p.map(ringToPath).join(" ")).join(" ");
}

function stateName(f: GeoFeature): string {
  return ((f.properties?.NAME ?? f.properties?.name ?? "") as string);
}

// ── ViewBox animation ─────────────────────────────────────────────────────────

type ViewBox = { x: number; y: number; w: number; h: number };

// National view — full lower 48 + slight upper margin for northern states
const NATIONAL: ViewBox = { x: 0, y: -20, w: 960, h: 580 };

function vbStr(vb: ViewBox): string {
  return `${vb.x.toFixed(2)} ${vb.y.toFixed(2)} ${vb.w.toFixed(2)} ${vb.h.toFixed(2)}`;
}

function lerpVB(a: ViewBox, b: ViewBox, t: number): ViewBox {
  const i = (u: number, v: number) => u + (v - u) * t;
  return { x: i(a.x, b.x), y: i(a.y, b.y), w: i(a.w, b.w), h: i(a.h, b.h) };
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

// ── Milestone data ────────────────────────────────────────────────────────────

type StoryThread = "national" | "amber" | "sapphire" | "convergence";

type Milestone = {
  id:             string;
  thread:         StoryThread;
  label:          string;
  region:         string;
  era:            string;
  body:           string;
  viewBox:        ViewBox;
  // Geographic coordinates [lon, lat] of this story anchor — illustrative only
  point?:         [number, number];
  // States to tint amber for this milestone
  highlightAmber?: ReadonlySet<string>;
};

// Amber thread anchor points — Albers-projected to SVG at module load.
// Approximate SVG positions: Virginia ≈ [760, 251], Chesapeake ≈ [771, 232],
// Delaware ≈ [776, 221]. These are illustrative, not surveyed locations.
const AMBER_ANCHORS: [number, number][] = [
  [-77.0, 37.3], // Virginia (Jamestown / tidal river region)
  [-76.0, 38.2], // Lower Chesapeake Bay / Delmarva Peninsula
  [-75.6, 38.7], // Sussex County, Southern Delaware
];

// Pre-compute SVG coordinates from geographic anchors (constant at module scope)
const AMBER_SVG_PTS: ([number, number] | null)[] =
  AMBER_ANCHORS.map(([lon, lat]) => project(lon, lat));

const MILESTONES: Milestone[] = [
  {
    id:      "m0-america250",
    thread:  "national",
    label:   "America 250 Living History",
    region:  "United States of America",
    era:     "2026 — Semiquincentennial",
    body:    "In 2026, America celebrates 250 years of independence. Across the country, families and communities are reconnecting with the threads of history that shaped the land they live on — and the values they carry forward. The Furlong story is one of those threads.",
    viewBox: NATIONAL,
  },
  {
    id:      "m1-amber-virginia",
    thread:  "amber",
    label:   "Amber Thread — Early Virginia Settlement",
    region:  "Jamestown · Stafford County, Virginia",
    era:     "Late 17th Century",
    body:    "Long before the United States was an idea, farming families were building lives along Virginia's tidal rivers and creek-cut inland counties. The land was demanding. The ties between families, fields, and waterways were deep. This is where one thread of the Furlong story begins.",
    viewBox: { x: 640, y: 179, w: 240, h: 145 },
    point:   [-77.0, 37.3],
    highlightAmber: new Set(["Virginia"]),
  },
  {
    id:      "m2-amber-chesapeake",
    thread:  "amber",
    label:   "Amber Thread — Chesapeake Crossing",
    region:  "Lower Chesapeake Bay · Delmarva Peninsula",
    era:     "Late 17th Century",
    body:    "By the late seventeenth century, some families had moved — across estuaries, around headlands, and up the bay. Each crossing required reading the land, calculating risk, and trusting in what could be cultivated from difficult terrain.",
    viewBox: { x: 651, y: 158, w: 235, h: 142 },
    point:   [-76.0, 38.2],
    highlightAmber: new Set(["Virginia", "Maryland", "Delaware"]),
  },
  {
    id:      "m3-amber-delaware",
    thread:  "amber",
    label:   "Amber Thread — First State Foundations",
    region:  "Sussex County · Southern Delaware",
    era:     "18th Century",
    body:    "Across generations, that thread became rooted in the First State. Families established themselves in southern Delaware, building agricultural identities that persisted long after the original settlers were gone. The land held the memory of those choices.",
    viewBox: { x: 661, y: 149, w: 225, h: 136 },
    point:   [-75.6, 38.7],
    highlightAmber: new Set(["Delaware"]),
  },
  {
    id:      "m4-sapphire-placeholder",
    thread:  "sapphire",
    label:   "Sapphire Thread — A Second Journey",
    region:  "To be added after founder review",
    era:     "Pending",
    body:    "A second historical journey will be added here after founder review. It will trace a separate path — different geography, different era, different challenges — that eventually converged with the Amber Thread in a shared commitment to stewardship and land.",
    viewBox: NATIONAL,
  },
  {
    id:      "m5-convergence",
    thread:  "convergence",
    label:   "Modern Convergence",
    region:  "The founding of Furlong",
    era:     "Present Day",
    body:    "Two separate journeys — different geographies, different eras, different challenges — eventually converged in a shared belief: that people make better decisions when they can see the pathways before them. That belief became Furlong. The threads are still here, in the way we work.",
    viewBox: NATIONAL,
    highlightAmber: new Set(["Virginia", "Maryland", "Delaware"]),
  },
];

const THREAD_COLOR: Record<StoryThread, string> = {
  national:    "#456077",
  amber:       "#c9a84c",
  sapphire:    "#3b82f6",
  convergence: "#c9a84c",
};

// ── Component ─────────────────────────────────────────────────────────────────

export function FurlongStoryTimeline() {
  const [geoFeatures, setGeoFeatures] = useState<GeoFeature[]>([]);
  const [active, setActive]           = useState(0);
  const [viewBox, _setViewBox]        = useState<ViewBox>(NATIONAL);
  const [reduceMotion, setReduceMotion] = useState(false);

  // Refs for stable access inside animation callbacks
  const viewBoxRef       = useRef<ViewBox>(NATIONAL);
  const rafRef           = useRef<number | null>(null);
  const cancelledRef     = useRef(false);
  const reduceMotionRef  = useRef(false);
  const btnRefs          = useRef<(HTMLButtonElement | null)[]>([]);

  function setViewBox(vb: ViewBox) {
    viewBoxRef.current = vb;
    _setViewBox(vb);
  }

  // Load GeoJSON
  useEffect(() => {
    fetch("/maps/us-states.geojson")
      .then(r => r.json())
      .then((d: unknown) => {
        const data = d as { type: string; features: GeoFeature[] };
        if (data.type === "FeatureCollection") setGeoFeatures(data.features);
      })
      .catch(() => { /* map will show without state outlines */ });
  }, []);

  // Detect prefers-reduced-motion
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    reduceMotionRef.current = mq.matches;
    setReduceMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => {
      reduceMotionRef.current = e.matches;
      setReduceMotion(e.matches);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Animate viewBox from `from` to `to`
  const animateVB = useCallback((from: ViewBox, to: ViewBox) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    cancelledRef.current = false;

    if (reduceMotionRef.current) {
      setViewBox(to);
      return;
    }

    const DURATION = 700;
    const start    = performance.now();

    function tick(now: number) {
      if (cancelledRef.current) return;
      const raw = (now - start) / DURATION;
      const t   = Math.min(raw, 1);
      setViewBox(lerpVB(from, to, easeInOut(t)));
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }

    rafRef.current = requestAnimationFrame(tick);
  }, []);

  // Navigate to a milestone
  const goToMilestone = useCallback((idx: number) => {
    if (idx < 0 || idx >= MILESTONES.length) return;
    const from = viewBoxRef.current;
    setActive(idx);
    animateVB(from, MILESTONES[idx].viewBox);
    // Move focus to the newly active button
    btnRefs.current[idx]?.focus();
  }, [animateVB]);

  // Arrow key navigation within the list
  const handleKeyDown = useCallback((
    e: React.KeyboardEvent<HTMLButtonElement>,
    idx: number
  ) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      goToMilestone(Math.min(idx + 1, MILESTONES.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      goToMilestone(Math.max(idx - 1, 0));
    }
  }, [goToMilestone]);

  // Pre-compute state SVG paths (only recalculate when GeoJSON changes)
  const statePaths = useMemo(() =>
    geoFeatures.map(f => ({
      name: stateName(f),
      d:    f.geometry ? geomToPath(f.geometry) : "",
    })),
  [geoFeatures]);

  // How many amber anchors to display based on active milestone
  // 0→0, 1→1, 2→2, 3→3, 4→3 (keep all), 5→3 (convergence keeps all)
  const visibleAmberCount = Math.min(active, 3);

  // Visible amber SVG points (nulls already filtered)
  const visibleAmberPts = AMBER_SVG_PTS
    .slice(0, visibleAmberCount)
    .filter((pt): pt is [number, number] => pt !== null);

  // Scale factor for SVG strokes and markers (constant visual size across zoom)
  const scale = viewBox.w / NATIONAL.w;

  const M = MILESTONES[active];

  return (
    <div className="fl-story-root">

      {/* ── Left: milestone navigation ──────────────────────────────────── */}
      <nav aria-label="Furlong story timeline" className="fl-story-nav">
        <p className="fl-story-nav-hint" aria-hidden="true">
          Click a milestone or use ↑↓ keys
        </p>
        <ul role="list" className="fl-story-list">
          {MILESTONES.map((m, i) => {
            const isActive = i === active;
            const color    = THREAD_COLOR[m.thread];
            return (
              <li key={m.id} className="fl-story-item">
                <button
                  ref={el => { btnRefs.current[i] = el; }}
                  className={`fl-story-btn${isActive ? " fl-story-btn--active" : ""}`}
                  onClick={() => goToMilestone(i)}
                  onKeyDown={e => handleKeyDown(e, i)}
                  aria-pressed={isActive}
                >
                  {/* Thread color indicator */}
                  <span
                    className="fl-story-dot"
                    aria-hidden="true"
                    style={{ background: color }}
                  />

                  <div className="fl-story-content">
                    <span className="fl-story-era" style={{ color }}>
                      {m.era}
                    </span>
                    <strong className="fl-story-label">{m.label}</strong>
                    <span className="fl-story-region">{m.region}</span>

                    {/* Always in the DOM; hidden visually when inactive */}
                    <p
                      className={`fl-story-body${isActive ? " fl-story-body--visible" : ""}`}
                      aria-hidden={!isActive}
                    >
                      {m.body}
                    </p>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* ── Right: map ──────────────────────────────────────────────────── */}
      <div className="fl-story-map-wrap">

        {/* Accessible live region announces viewpoint changes */}
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="fl-story-sr"
        >
          {`Map view: ${M.label} — ${M.region}`}
        </div>

        {/* Reduced-motion notice */}
        {reduceMotion && (
          <div className="fl-story-motion-note" aria-hidden="true">
            Static map — reduced motion active
          </div>
        )}

        {/* Loading state */}
        {geoFeatures.length === 0 && (
          <div className="fl-story-loading" aria-live="polite">
            Loading map…
          </div>
        )}

        <svg
          className="fl-story-svg"
          viewBox={vbStr(viewBox)}
          role="img"
          aria-label={`Historical map — ${M.label}: ${M.region}`}
        >
          {/* ── State fills ─────────────────────────────────────────── */}
          {statePaths.map((sp, idx) => {
            if (!sp.d) return null;
            const isAmber = M.highlightAmber?.has(sp.name) ?? false;
            return (
              <path
                key={idx}
                d={sp.d}
                fill={isAmber ? "rgba(201,168,76,0.18)" : "#dde3ee"}
                stroke={isAmber ? "rgba(201,168,76,0.6)" : "#b0bbd0"}
                strokeWidth={scale * 0.8}
                strokeLinejoin="round"
              />
            );
          })}

          {/* ── Amber thread line ────────────────────────────────────── */}
          {visibleAmberPts.length >= 2 && (
            <polyline
              points={visibleAmberPts
                .map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`)
                .join(" ")}
              fill="none"
              stroke="#c9a84c"
              strokeWidth={scale * 1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.88}
            />
          )}

          {/* ── Amber node markers ───────────────────────────────────── */}
          {visibleAmberPts.map(([x, y], i) => {
            const anchor   = AMBER_ANCHORS[i];
            const isActive = !!(
              M.point &&
              Math.abs(M.point[0] - anchor[0]) < 0.01 &&
              Math.abs(M.point[1] - anchor[1]) < 0.01
            );
            return (
              <g key={i}>
                {/* Halo ring around the active anchor */}
                {isActive && (
                  <circle
                    cx={x} cy={y}
                    r={scale * 11}
                    fill="rgba(201,168,76,0.15)"
                    stroke="rgba(201,168,76,0.40)"
                    strokeWidth={scale * 0.7}
                  />
                )}
                {/* Core dot */}
                <circle
                  cx={x} cy={y}
                  r={scale * (isActive ? 5 : 3.5)}
                  fill="#c9a84c"
                  stroke="#ffffff"
                  strokeWidth={scale * 1.0}
                />
              </g>
            );
          })}

          {/* ── Convergence marker (milestone 5) ────────────────────── */}
          {active === 5 && (() => {
            // Convergence at Albers center (lon=-96, lat≈39) → SVG ≈ [485, 248]
            // This is a symbolic/illustrative point — no real address.
            const cx = 485, cy = 248;
            return (
              <g>
                <circle
                  cx={cx} cy={cy}
                  r={scale * 14}
                  fill="rgba(201,168,76,0.14)"
                  stroke="rgba(201,168,76,0.45)"
                  strokeWidth={scale * 0.8}
                />
                <circle
                  cx={cx} cy={cy}
                  r={scale * 6}
                  fill="#c9a84c"
                  stroke="#ffffff"
                  strokeWidth={scale * 1.2}
                />
                <text
                  x={cx}
                  y={cy + scale * 20}
                  textAnchor="middle"
                  fontSize={scale * 8}
                  fontWeight={700}
                  fill="#162033"
                  fontFamily="Inter, ui-sans-serif, sans-serif"
                >
                  Furlong
                </text>
              </g>
            );
          })()}

          {/* ── Sapphire placeholder hint (milestone 4) ─────────────── */}
          {active === 4 && (
            <text
              x={480}
              y={300}
              textAnchor="middle"
              fontSize={scale * 9}
              fill="rgba(59,130,246,0.40)"
              fontStyle="italic"
              fontFamily="Inter, ui-sans-serif, sans-serif"
              aria-hidden="true"
            >
              Second thread — pending founder review
            </text>
          )}
        </svg>

        {/* America 250 badge on national views */}
        {(active === 0 || active === 4 || active === 5) && (
          <div className="fl-story-a250" aria-hidden="true">
            <span style={{
              display:       "inline-flex",
              alignItems:    "center",
              gap:           6,
              background:    "rgba(22,32,51,0.82)",
              color:         "#c9a84c",
              fontSize:      11,
              fontWeight:    800,
              letterSpacing: "0.08em",
              textTransform: "uppercase" as const,
              padding:       "5px 10px",
              borderRadius:  6,
              backdropFilter: "blur(4px)",
            }}>
              ★ America 250
            </span>
          </div>
        )}
      </div>

      {/* ── Styles ────────────────────────────────────────────────────────── */}
      <style>{`
        .fl-story-root {
          display: grid;
          grid-template-columns: 320px 1fr;
          align-items: stretch;
          background: #f6f8fb;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid #d7deea;
          min-height: 520px;
        }

        /* ── Left nav ─────────────────────────────────────────────────── */
        .fl-story-nav {
          background: #ffffff;
          border-right: 1px solid #d7deea;
          overflow-y: auto;
          max-height: 620px;
          display: flex;
          flex-direction: column;
        }
        .fl-story-nav-hint {
          margin: 0;
          padding: 10px 16px 6px;
          font-size: 11px;
          color: #8898aa;
          letter-spacing: 0.02em;
          border-bottom: 1px solid #eef2f7;
        }
        .fl-story-list {
          list-style: none;
          margin: 0;
          padding: 0;
          flex: 1;
        }
        .fl-story-item {
          border-bottom: 1px solid #eef2f7;
        }
        .fl-story-item:last-child {
          border-bottom: none;
        }
        .fl-story-btn {
          display: flex;
          align-items: flex-start;
          gap: 11px;
          width: 100%;
          text-align: left;
          background: none;
          border: none;
          padding: 13px 16px;
          cursor: pointer;
          transition: background 0.12s;
          border-left: 3px solid transparent;
        }
        .fl-story-btn:hover {
          background: #f6f8fb;
        }
        .fl-story-btn:focus-visible {
          outline: 2px solid #c9a84c;
          outline-offset: -2px;
          background: #fdf8ec;
        }
        .fl-story-btn--active {
          background: #fdf8ec;
          border-left-color: #c9a84c;
        }
        .fl-story-dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          margin-top: 5px;
          flex-shrink: 0;
          display: inline-block;
        }
        .fl-story-content {
          display: grid;
          gap: 1px;
          min-width: 0;
        }
        .fl-story-era {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }
        .fl-story-label {
          font-size: 12px;
          font-weight: 700;
          color: #162033;
          line-height: 1.35;
          display: block;
          margin-top: 1px;
        }
        .fl-story-region {
          font-size: 11px;
          color: #5d687a;
          line-height: 1.4;
          display: block;
          margin-top: 1px;
        }
        /* Body text: always in DOM, hidden visually for inactive items */
        .fl-story-body {
          margin: 0;
          font-size: 12px;
          color: #3b475a;
          line-height: 1.65;
          max-height: 0;
          overflow: hidden;
          opacity: 0;
          transition: max-height 0.25s ease, opacity 0.2s ease;
        }
        .fl-story-body--visible {
          max-height: 200px;
          opacity: 1;
          margin-top: 7px;
        }
        @media (prefers-reduced-motion: reduce) {
          .fl-story-body {
            transition: none;
          }
        }

        /* ── Right map ────────────────────────────────────────────────── */
        .fl-story-map-wrap {
          position: relative;
          background: #e4eaf4;
          display: flex;
          flex-direction: column;
          align-items: stretch;
          min-height: 400px;
        }
        .fl-story-svg {
          display: block;
          width: 100%;
          height: auto;
          min-height: 360px;
          flex: 1;
        }
        .fl-story-loading {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #5d687a;
          font-size: 14px;
          background: #e4eaf4;
        }
        .fl-story-motion-note {
          position: absolute;
          top: 10px;
          left: 10px;
          font-size: 10px;
          color: #8898aa;
          background: rgba(255,255,255,0.75);
          padding: 3px 8px;
          border-radius: 4px;
          pointer-events: none;
          z-index: 2;
        }
        .fl-story-a250 {
          position: absolute;
          top: 12px;
          right: 12px;
          pointer-events: none;
          z-index: 2;
        }

        /* Screen-reader only utility */
        .fl-story-sr {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0 0 0 0);
          white-space: nowrap;
          border: 0;
        }

        /* ── Mobile: stack layout ─────────────────────────────────────── */
        @media (max-width: 768px) {
          .fl-story-root {
            grid-template-columns: 1fr;
          }
          .fl-story-nav {
            border-right: none;
            border-bottom: 1px solid #d7deea;
            max-height: none;
          }
          .fl-story-map-wrap {
            min-height: 280px;
          }
          .fl-story-svg {
            min-height: 240px;
          }
        }
      `}</style>
    </div>
  );
}
