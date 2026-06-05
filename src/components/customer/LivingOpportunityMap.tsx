"use client";

import { useEffect, useRef, useState } from "react";

import {
  CURATED_EXPLORATION_STORIES,
  FEATURED_EXPLORATION_ILLUSTRATIVE_NOTE,
  FEATURED_EXPLORATION_LABEL,
  type FeaturedStory,
} from "@/lib/customer-landing/featuredExplorationStories";

/**
 * Living Opportunity Map (Build 45 → map visual fix).
 *
 * A "use client" React component. It reads clearly as a NATIONAL MAP OF
 * POSSIBILITIES on first load: a recognizable United States silhouette is
 * always visible (light, high-contrast), with curated exploration pathways
 * illuminated on top and one featured state/county glowing at a time.
 *
 * Layered design:
 *   Layer 1 — visible US map base (always on, no hover/interaction needed)
 *   Layer 2 — soft regional glow + animated pathway lines over the map
 *   Layer 3 — featured state/county exploration node (glowing, pulsing)
 *   Layer 4 — story / opportunity card (accessible text)
 *
 * The map reveals opportunities, not the visitor: no geolocation, no
 * addresses, illustrative examples only. Respects prefers-reduced-motion;
 * selection is keyboard-accessible and never depends on hover (mobile-safe).
 */

const ROTATE_MS = 6500;

// Stylized-but-recognizable continental United States silhouette
// (viewBox 0 0 100 62): wide body, pointed Northeast, Florida hanging at the
// lower-right, Texas dipping at the lower-middle, Pacific coast on the left.
const US_SILHOUETTE_PATH =
  "M6 9 L18 8 L34 7 L46 7 L52 7 L56 11 L60 9 L72 8 L86 8 L94 11 " +
  "L92 16 L89 21 L87 26 L86 31 L88 35 L86 40 L85 44 L84 48 L82 54 " +
  "L80 50 L79 46 L72 47 L64 48 L58 48 L55 52 L50 57 L46 52 L44 48 " +
  "L38 48 L28 47 L18 45 L13 43 L11 37 L9 29 L8 21 L7 14 Z";

// Approximate on-map location of each featured state (viewBox coordinates), so
// the featured exploration visibly belongs to a point on the US map.
const STATE_MAP_POINTS: Record<string, { x: number; y: number }> = {
  Iowa: { x: 52, y: 25 },
  Missouri: { x: 56, y: 31 },
  Tennessee: { x: 64, y: 36 },
  Pennsylvania: { x: 80, y: 23 },
  "North Carolina": { x: 81, y: 34 },
};

function mapPointFor(story: FeaturedStory): { x: number; y: number } {
  return STATE_MAP_POINTS[story.state] ?? { x: 52, y: 30 };
}

export function LivingOpportunityMap({
  stories = CURATED_EXPLORATION_STORIES,
}: {
  stories?: FeaturedStory[];
}) {
  const [active, setActive] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
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
    if (reduceMotion || stories.length < 2) return;
    const id = window.setInterval(() => {
      if (!pausedRef.current) {
        setActive((current) => (current + 1) % stories.length);
      }
    }, ROTATE_MS);
    return () => window.clearInterval(id);
  }, [reduceMotion, stories.length]);

  const story = stories[active] ?? stories[0];
  const focus = mapPointFor(story);
  // A short pathway fanning inward from the featured state, illuminated over
  // the map (not floating in empty space).
  const pathwayPoints = [
    focus,
    { x: focus.x - 6, y: focus.y - 3 },
    { x: focus.x - 12, y: focus.y - 6 },
  ];

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
        background: "linear-gradient(160deg, #f3f7fd 0%, #e7eefa 100%)",
        color: "#162033",
        padding: 20,
        display: "grid",
        gap: 16,
      }}
    >
      <style>{`
        @keyframes furlong-pulse {
          0% { transform: scale(1); opacity: 0.55; }
          70% { transform: scale(2.6); opacity: 0; }
          100% { transform: scale(2.6); opacity: 0; }
        }
        @keyframes furlong-flow { to { stroke-dashoffset: -16; } }
        .furlong-pulse-ring { transform-box: fill-box; transform-origin: center; animation: furlong-pulse 2.4s ease-out infinite; }
        .furlong-flow { stroke-dasharray: 3 3; animation: furlong-flow 1.6s linear infinite; }
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
        {/* Layers 1–3: the US map. Informative (it reads as a US map); the
            featured details are also given as text in the card at right. */}
        <div
          style={{
            border: "1px solid #cdd9ec",
            borderRadius: 12,
            background: "#ffffff",
            padding: 8,
          }}
        >
          <svg
            viewBox="0 0 100 62"
            preserveAspectRatio="xMidYMid meet"
            role="img"
            aria-label={`Map of the United States highlighting a featured exploration region in ${story.state}.`}
            style={{ width: "100%", height: "auto", display: "block" }}
          >
            <defs>
              <filter id="furlong-soft" x="-60%" y="-60%" width="220%" height="220%">
                <feGaussianBlur stdDeviation="2.3" />
              </filter>
            </defs>

            {/* Layer 1 — visible US base map (always on). */}
            <path
              d={US_SILHOUETTE_PATH}
              fill="#dbe7f7"
              stroke="#8aa3cc"
              strokeWidth="0.7"
              strokeLinejoin="round"
            />

            {/* All featured regions as faint markers on the map. */}
            {stories.map((s, i) => {
              const p = mapPointFor(s);
              return (
                <circle
                  key={`dot-${s.state}`}
                  cx={p.x}
                  cy={p.y}
                  r={i === active ? 0 : 1}
                  fill="#6f86b3"
                  opacity={0.7}
                />
              );
            })}

            {/* Layer 2 — soft regional glow + animated pathway over the map. */}
            <circle
              cx={focus.x}
              cy={focus.y}
              r="7"
              fill={story.color}
              opacity="0.28"
              filter="url(#furlong-soft)"
            />
            <polyline
              className="furlong-flow"
              points={pathwayPoints.map((p) => `${p.x},${p.y}`).join(" ")}
              fill="none"
              stroke={story.color}
              strokeWidth="0.8"
              strokeLinecap="round"
            />
            {pathwayPoints.slice(1).map((p, i) => (
              <circle
                key={`path-node-${i}`}
                cx={p.x}
                cy={p.y}
                r="1.2"
                fill={story.color}
              />
            ))}

            {/* Layer 3 — featured state/county exploration node (glow + pulse). */}
            <circle
              className="furlong-pulse-ring"
              cx={focus.x}
              cy={focus.y}
              r="2.4"
              fill={story.color}
            />
            <circle cx={focus.x} cy={focus.y} r="2.4" fill={story.color} />
            <circle cx={focus.x} cy={focus.y} r="1" fill="#ffffff" opacity="0.9" />
          </svg>
        </div>

        {/* Layer 4 — accessible story / opportunity card. */}
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
            Featured / Illustrative Exploration
          </div>
          <div aria-live="polite" style={{ display: "grid", gap: 4 }}>
            <span style={{ fontSize: 12, color: "#5d687a" }}>Illustrative region</span>
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
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {story.connectedNodes.map((n, i) => (
              <span key={`chip-${story.state}-${n.type}`} style={{ fontSize: 12, color: "#475569" }}>
                {n.type}
                {i < story.connectedNodes.length - 1 ? " →" : ""}
              </span>
            ))}
          </div>
          <p style={{ margin: 0, lineHeight: 1.6, color: "#1f2a3d", fontSize: 14 }}>
            {story.story}
          </p>
        </div>
      </div>

      {/* Keyboard-accessible selectors (work without hover, mobile-safe). */}
      <div
        role="group"
        aria-label="Choose a featured exploration"
        style={{ display: "flex", flexWrap: "wrap", gap: 8 }}
      >
        {stories.map((s, index) => {
          const isActive = index === active;
          return (
            <button
              key={`sel-${s.state}`}
              type="button"
              onClick={() => select(index)}
              aria-pressed={isActive}
              style={{
                minHeight: 40,
                padding: "0 12px",
                borderRadius: 999,
                border: isActive ? `1px solid ${s.color}` : "1px solid #cdd9ec",
                background: isActive ? "#ffffff" : "transparent",
                color: isActive ? "#162033" : "#5d687a",
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              {s.state}
            </button>
          );
        })}
      </div>

      <p style={{ margin: 0, fontSize: 12, color: "#5d687a", lineHeight: 1.5 }}>
        A national map of possibilities. These are illustrative examples of what
        people explore — not offers, and not based on your location. The map
        reveals opportunities, not the visitor. We show pathways, not promises.
      </p>
    </section>
  );
}
