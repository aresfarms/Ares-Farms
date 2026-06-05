"use client";

import { useEffect, useRef, useState } from "react";

import {
  CURATED_EXPLORATION_STORIES,
  FEATURED_EXPLORATION_ILLUSTRATIVE_NOTE,
  FEATURED_EXPLORATION_LABEL,
  type FeaturedStory,
} from "@/lib/customer-landing/featuredExplorationStories";

/**
 * Living Opportunity Map — Build 47 (Authoritative Map Asset System).
 *
 * Renders a real U.S. map from locally cached GeoJSON assets ingested from
 * U.S. Census Bureau TIGER Web Services (federal, public domain).
 * See: public/maps/us-states.geojson, us-counties.geojson, us-map-metadata.json
 * and docs/DOCTRINE_AUTHORITATIVE_MAP_ASSET_INGESTION_V1.md
 *
 * Hard rules (Build 47):
 * - No fake or hand-drawn U.S. map outline
 * - No live fetch from third-party services during page load
 * - No geolocation
 * - No exact addresses
 * - The map reveals opportunities, not the visitor
 *
 * If local GeoJSON assets are missing or invalid:
 * - Renders professional abstract opportunity network fallback
 * - Labels it: "Opportunity Network / Map asset temporarily unavailable"
 * - Does NOT render a fake U.S. silhouette
 */

// ── Albers USA projection ────────────────────────────────────────────────────
// Composite projection: lower 48 states via Albers Equal-Area Conic,
// with Alaska and Hawaii in conventional inset positions.
// Parameters match d3-composite-projections AlbersUSA standard.
// Output: [x, y] in a 960 × 600 viewport.

const DEG = Math.PI / 180;

function albersConicEqualArea(
  phiLow: number,
  phiHigh: number,
  lambda0: number,
  phi0: number
) {
  const sinPhiLow = Math.sin(phiLow);
  const sinPhiHigh = Math.sin(phiHigh);
  const n = (sinPhiLow + sinPhiHigh) / 2;
  const C = Math.cos(phiLow) ** 2 + 2 * n * sinPhiLow;
  const rho0 = Math.sqrt(C - 2 * n * Math.sin(phi0)) / n;
  return (lambda: number, phi: number): [number, number] => {
    const rho = Math.sqrt(C - 2 * n * Math.sin(phi)) / n;
    const theta = n * (lambda - lambda0);
    return [rho * Math.sin(theta), rho0 - rho * Math.cos(theta)];
  };
}

// Lower 48
const lower48Project = albersConicEqualArea(
  29.5 * DEG, 45.5 * DEG, -96 * DEG, 37.5 * DEG
);
const LOWER48_SCALE = 1070;
const LOWER48_TX = 480;
const LOWER48_TY = 250;

// Alaska: rotated and scaled to conventional inset position (lower left)
const alaskaProject = albersConicEqualArea(
  55 * DEG, 65 * DEG, -154 * DEG, 50 * DEG
);
const ALASKA_SCALE = LOWER48_SCALE * 0.35;
const ALASKA_TX = 122;
const ALASKA_TY = 490;

// Hawaii: simple shifted Albers
const hawaiiProject = albersConicEqualArea(
  8 * DEG, 18 * DEG, -157 * DEG, 20.9 * DEG
);
const HAWAII_SCALE = LOWER48_SCALE;
const HAWAII_TX = 298;
const HAWAII_TY = 538;

function isAlaska(lon: number, lat: number): boolean {
  return lat > 50 && lon < -125;
}

function isHawaii(lon: number, lat: number): boolean {
  return lat < 28 && lat > 15 && lon < -140;
}

function project(lon: number, lat: number): [number, number] | null {
  const lonR = lon * DEG;
  const latR = lat * DEG;
  if (isAlaska(lon, lat)) {
    const [px, py] = alaskaProject(lonR, latR);
    return [px * ALASKA_SCALE + ALASKA_TX, -py * ALASKA_SCALE + ALASKA_TY];
  }
  if (isHawaii(lon, lat)) {
    const [px, py] = hawaiiProject(lonR, latR);
    return [px * HAWAII_SCALE + HAWAII_TX, -py * HAWAII_SCALE + HAWAII_TY];
  }
  // Exclude most territories outside the main viewport
  if (lon > -60 || lon < -180 || lat < 20 || lat > 72) return null;
  const [px, py] = lower48Project(lonR, latR);
  const x = px * LOWER48_SCALE + LOWER48_TX;
  const y = -py * LOWER48_SCALE + LOWER48_TY;
  if (x < 0 || x > 960 || y < 0 || y > 600) return null;
  return [x, y];
}

// ── GeoJSON → SVG path ──────────────────────────────────────────────────────

type Coord = [number, number];
type Ring = Coord[];

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
  | { type: "Polygon"; coordinates: Ring[] }
  | { type: "MultiPolygon"; coordinates: Ring[][] };

function geometryToPath(geom: GeoGeometry): string {
  if (geom.type === "Polygon") {
    return geom.coordinates.map(ringToPath).join(" ");
  }
  return geom.coordinates
    .map((poly) => poly.map(ringToPath).join(" "))
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

// ── Component ────────────────────────────────────────────────────────────────

const ROTATE_MS = 6500;

type MapAssetState =
  | { status: "loading" }
  | { status: "ready"; states: GeoFeatureCollection }
  | { status: "unavailable" };

let cachedStates: GeoFeatureCollection | null = null;

export function LivingOpportunityMap({
  stories = CURATED_EXPLORATION_STORIES,
}: {
  stories?: FeaturedStory[];
}) {
  const [active, setActive] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [mapAssets, setMapAssets] = useState<MapAssetState>({ status: "loading" });
  const pausedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduceMotion(mq.matches);
    apply();
    mq.addEventListener?.("change", apply);
    return () => mq.removeEventListener?.("change", apply);
  }, []);

  useEffect(() => {
    if (cachedStates) {
      setMapAssets({ status: "ready", states: cachedStates });
      return;
    }
    fetch("/maps/us-states.geojson")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<GeoFeatureCollection>;
      })
      .then((data) => {
        if (
          data.type !== "FeatureCollection" ||
          !Array.isArray(data.features) ||
          data.features.length < 50
        ) {
          throw new Error("Invalid or incomplete states GeoJSON");
        }
        cachedStates = data;
        setMapAssets({ status: "ready", states: data });
      })
      .catch(() => {
        setMapAssets({ status: "unavailable" });
      });
  }, []);

  useEffect(() => {
    if (reduceMotion || stories.length < 2) return;
    const id = window.setInterval(() => {
      if (!pausedRef.current) {
        setActive((cur) => (cur + 1) % stories.length);
      }
    }, ROTATE_MS);
    return () => window.clearInterval(id);
  }, [reduceMotion, stories.length]);

  const story = stories[active] ?? stories[0];

  function select(index: number) {
    setActive(index);
    pausedRef.current = true;
    window.setTimeout(() => {
      pausedRef.current = false;
    }, ROTATE_MS * 2);
  }

  return (
    <section
      aria-label="Featured exploration"
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
          0% { transform: scale(1); opacity: 0.5; }
          70% { transform: scale(2.4); opacity: 0; }
          100% { transform: scale(2.4); opacity: 0; }
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
          .furlong-flow { animation: none; }
        }
      `}</style>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          alignItems: "baseline",
          justifyContent: "space-between",
        }}
      >
        <strong style={{ fontSize: 14, letterSpacing: 0.4, textTransform: "uppercase" }}>
          {FEATURED_EXPLORATION_LABEL}
        </strong>
        <span style={{ fontSize: 12, color: "#5d687a" }}>
          {FEATURED_EXPLORATION_ILLUSTRATIVE_NOTE}
        </span>
      </div>

      <div
        style={{
          display: "grid",
          gap: 16,
          gridTemplateColumns: "minmax(0, 1.35fr) minmax(0, 1fr)",
          alignItems: "stretch",
        }}
      >
        <div
          style={{
            border: "1px solid #cdd9ec",
            borderRadius: 12,
            background:
              "radial-gradient(circle at 20% 20%, rgba(79,112,180,0.06), transparent 28%), " +
              "linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)",
            overflow: "hidden",
            position: "relative",
          }}
        >
          {mapAssets.status === "loading" && (
            <div
              aria-hidden="true"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 180,
                color: "#9db4d8",
                fontSize: 13,
              }}
            >
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
              reduceMotion={reduceMotion}
            />
          )}
        </div>

        <StoryCard story={story} />
      </div>

      <div
        role="group"
        aria-label="Choose a featured exploration"
        style={{ display: "flex", flexWrap: "wrap", gap: 8 }}
      >
        {stories.map((candidate, index) => {
          const isActive = index === active;
          return (
            <button
              key={`sel-${candidate.state}`}
              type="button"
              onClick={() => select(index)}
              aria-pressed={isActive}
              style={{
                minHeight: 40,
                padding: "0 12px",
                borderRadius: 999,
                border: isActive ? `1px solid ${candidate.color}` : "1px solid #cdd9ec",
                background: isActive ? "#ffffff" : "transparent",
                color: isActive ? "#162033" : "#5d687a",
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              {candidate.state}
            </button>
          );
        })}
      </div>

      <p style={{ margin: 0, fontSize: 12, color: "#5d687a", lineHeight: 1.5 }}>
        Featured explorations are illustrative examples only. No geolocation,
        no exact addresses, and no personalized location tracking are used
        here. The map reveals opportunities, not the visitor. We show
        pathways, not promises.
      </p>
    </section>
  );
}

// ── Real U.S. map (GeoJSON + Albers USA) ────────────────────────────────────

function RealUsMap({
  states,
  story,
  reduceMotion,
}: {
  states: GeoFeatureCollection;
  story: FeaturedStory;
  reduceMotion: boolean;
}) {
  // Project the featured story markers
  const markerPoints = story.connectedNodes
    .map((node) => {
      const pt = project(node.latLon.lon, node.latLon.lat);
      return pt ? { ...node, svgX: pt[0], svgY: pt[1] } : null;
    })
    .filter(Boolean) as Array<{
      type: string;
      svgX: number;
      svgY: number;
    }>;

  const polylinePoints = markerPoints
    .map((p) => `${p.svgX.toFixed(1)},${p.svgY.toFixed(1)}`)
    .join(" ");

  return (
    <svg
      viewBox="0 0 960 600"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={`U.S. map highlighting a featured exploration in ${story.state} — illustrative, not based on your location.`}
      style={{ width: "100%", height: "auto", display: "block" }}
    >
      <defs>
        <filter id="furlong-glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="furlong-soft" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="8" />
        </filter>
      </defs>

      {/* State polygons */}
      {states.features.map((feature, i) => {
        if (!feature.geometry) return null;
        const d = geometryToPath(feature.geometry);
        if (!d) return null;
        const name = String(feature.properties?.NAME ?? feature.properties?.name ?? "");
        const isFeatured = name === story.state;
        return (
          <path
            key={i}
            d={d}
            fill={isFeatured ? `${story.color}22` : "#e8eef8"}
            stroke={isFeatured ? story.color : "#c5d3e8"}
            strokeWidth={isFeatured ? 1.5 : 0.5}
            strokeLinejoin="round"
          />
        );
      })}

      {/* Featured story route line */}
      {markerPoints.length >= 2 && !reduceMotion && (
        <polyline
          className="furlong-flow"
          points={polylinePoints}
          fill="none"
          stroke={story.color}
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.85}
        />
      )}
      {markerPoints.length >= 2 && reduceMotion && (
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

      {/* Featured story node markers */}
      {markerPoints.map((pt, index) => (
        <g key={`${story.state}-${pt.type}`}>
          {/* Glow halo */}
          <circle
            cx={pt.svgX}
            cy={pt.svgY}
            r={22}
            fill={story.color}
            opacity={0.08}
            filter="url(#furlong-soft)"
          />
          {/* Pulse ring on active node */}
          {index === 1 && (
            <circle
              className="furlong-pulse-ring"
              cx={pt.svgX}
              cy={pt.svgY}
              r={10}
              fill={story.color}
              opacity={0.25}
            />
          )}
          {/* Outer marker */}
          <circle cx={pt.svgX} cy={pt.svgY} r={8} fill={story.color} opacity={0.18} />
          {/* Core dot */}
          <circle cx={pt.svgX} cy={pt.svgY} r={5} fill={story.color} />
          <circle cx={pt.svgX} cy={pt.svgY} r={2} fill="#ffffff" opacity={0.9} />
          {/* Label */}
          <text
            x={pt.svgX}
            y={pt.svgY - 13}
            textAnchor="middle"
            fontSize={10}
            fontWeight={700}
            fill="#1f2a3d"
            paintOrder="stroke"
            stroke="#f8fbff"
            strokeWidth={3}
          >
            {pt.type}
          </text>
        </g>
      ))}
    </svg>
  );
}

// ── Abstract fallback (assets unavailable) ──────────────────────────────────

const FALLBACK_HUBS = [
  { x: 140, y: 180 },
  { x: 260, y: 110 },
  { x: 310, y: 270 },
  { x: 490, y: 155 },
  { x: 550, y: 290 },
  { x: 720, y: 115 },
  { x: 790, y: 245 },
  { x: 890, y: 175 },
] as const;

const FALLBACK_CONNECTIONS: [number, number][] = [
  [0, 2], [0, 3], [1, 3], [2, 4], [3, 5], [3, 6], [4, 6], [5, 7], [6, 7],
];

function AbstractOpportunityNetwork({
  story,
  reduceMotion,
}: {
  story: FeaturedStory;
  reduceMotion: boolean;
}) {
  void reduceMotion;
  return (
    <div style={{ position: "relative" }}>
      <svg
        viewBox="0 0 960 600"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Opportunity network diagram — map asset temporarily unavailable."
        style={{ width: "100%", height: "auto", display: "block", opacity: 0.55 }}
      >
        <defs>
          <linearGradient id="fb-fade" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#9db4d8" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#9db4d8" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        {FALLBACK_CONNECTIONS.map(([a, b]) => (
          <line
            key={`${a}-${b}`}
            x1={FALLBACK_HUBS[a].x}
            y1={FALLBACK_HUBS[a].y}
            x2={FALLBACK_HUBS[b].x}
            y2={FALLBACK_HUBS[b].y}
            stroke="url(#fb-fade)"
            strokeWidth="2"
          />
        ))}
        {FALLBACK_HUBS.map((hub, i) => (
          <circle key={i} cx={hub.x} cy={hub.y} r={14} fill="#9db4d8" opacity={0.18} />
        ))}
        {FALLBACK_HUBS.map((hub, i) => (
          <circle key={`c-${i}`} cx={hub.x} cy={hub.y} r={6} fill="#9db4d8" opacity={0.5} />
        ))}
      </svg>
      <div
        style={{
          position: "absolute",
          bottom: 10,
          left: 0,
          right: 0,
          textAlign: "center",
          pointerEvents: "none",
        }}
      >
        <span
          style={{
            display: "inline-block",
            background: "rgba(248,251,255,0.92)",
            border: "1px solid #cdd9ec",
            borderRadius: 8,
            padding: "4px 12px",
            fontSize: 11,
            color: "#5d687a",
          }}
        >
          Opportunity Network — Map asset temporarily unavailable.
        </span>
      </div>
      <div aria-live="polite" style={{ display: "none" }}>
        {story.state}
      </div>
    </div>
  );
}

// ── Story card ───────────────────────────────────────────────────────────────

function StoryCard({ story }: { story: FeaturedStory }) {
  return (
    <div style={{ display: "grid", gap: 10, alignContent: "start" }}>
      <div
        style={{
          display: "inline-flex",
          alignSelf: "start",
          padding: "4px 10px",
          borderRadius: 999,
          background: "#eef3fb",
          color: "#35507a",
          fontSize: 12,
          fontWeight: 800,
        }}
      >
        Featured Exploration / Illustrative example
      </div>
      <div aria-live="polite" style={{ display: "grid", gap: 4 }}>
        <span style={{ fontSize: 12, color: "#5d687a" }}>Featured region</span>
        <strong style={{ fontSize: 18 }}>
          {story.state} · {story.county}
        </strong>
      </div>
      <div
        style={{
          display: "inline-flex",
          alignSelf: "start",
          padding: "3px 10px",
          borderRadius: 999,
          background: "#eef3fb",
          color: story.color,
          fontSize: 12,
          fontWeight: 700,
        }}
      >
        {story.opportunity}
      </div>
      <p style={{ margin: 0, fontSize: 13, color: "#475569", lineHeight: 1.6 }}>
        Exploration path: {story.pathway}
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {story.connectedNodes.map((node, index) => (
          <span key={`chip-${story.state}-${node.type}`} style={{ fontSize: 12, color: "#475569" }}>
            {node.type}
            {index < story.connectedNodes.length - 1 ? " →" : ""}
          </span>
        ))}
      </div>
      <p style={{ margin: 0, lineHeight: 1.6, color: "#1f2a3d", fontSize: 14 }}>
        {story.story}
      </p>
    </div>
  );
}
