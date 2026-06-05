"use client";

import { useEffect, useRef, useState } from "react";

import {
  CURATED_EXPLORATION_STORIES,
  FEATURED_EXPLORATION_ILLUSTRATIVE_NOTE,
  FEATURED_EXPLORATION_LABEL,
  type FeaturedStory,
} from "@/lib/customer-landing/featuredExplorationStories";

/**
 * Living Opportunity Map (Build 45) — homepage discovery visual.
 *
 * A "use client" React component (state/refs/effects — no raw DOM mutation).
 * The animated SVG is purely DECORATIVE (aria-hidden); all real content lives
 * in accessible HTML so the experience works without the graphic. The map
 * reveals illustrative OPPORTUNITIES, never the visitor: no geolocation, no
 * addresses, and an explicit "not based on your location" label.
 *
 * Respects prefers-reduced-motion (no auto-rotation, no pulse). Selection is
 * keyboard-accessible and never depends on hover, so it works on mobile.
 */

const ROTATE_MS = 6500;

export function LivingOpportunityMap({
  stories = CURATED_EXPLORATION_STORIES,
}: {
  stories?: FeaturedStory[];
}) {
  const [active, setActive] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const pausedRef = useRef(false);

  // Detect reduced-motion preference.
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduceMotion(mq.matches);
    apply();
    mq.addEventListener?.("change", apply);
    return () => mq.removeEventListener?.("change", apply);
  }, []);

  // Auto-rotate the featured example so the map "feels alive".
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

  function select(index: number) {
    setActive(index);
    // Briefly pause auto-rotation after a manual choice.
    pausedRef.current = true;
    window.setTimeout(() => {
      pausedRef.current = false;
    }, ROTATE_MS * 2);
  }

  return (
    <section
      aria-label="Featured exploration"
      style={{
        border: "1px solid #1f2a44",
        borderRadius: 16,
        background: "linear-gradient(160deg, #0b1220 0%, #0f1b30 100%)",
        color: "#e8eefb",
        padding: 20,
        display: "grid",
        gap: 16,
      }}
    >
      <style>{`
        @keyframes furlong-pulse {
          0% { r: 2.2; opacity: 1; }
          70% { r: 6.5; opacity: 0; }
          100% { r: 6.5; opacity: 0; }
        }
        .furlong-pulse-ring { animation: furlong-pulse 2.4s ease-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .furlong-pulse-ring { animation: none; opacity: 0; }
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
        <span style={{ fontSize: 12, color: "#9fb0d0" }}>
          {FEATURED_EXPLORATION_ILLUSTRATIVE_NOTE}
        </span>
      </div>

      <div
        style={{
          display: "grid",
          gap: 16,
          gridTemplateColumns: "minmax(0, 1.3fr) minmax(0, 1fr)",
          alignItems: "stretch",
        }}
      >
        {/* Decorative animated map — hidden from assistive tech. */}
        <div
          aria-hidden="true"
          style={{
            position: "relative",
            minHeight: 220,
            border: "1px solid #21314f",
            borderRadius: 12,
            background:
              "radial-gradient(circle at 50% 40%, rgba(79,195,247,0.10), transparent 60%)",
            overflow: "hidden",
          }}
        >
          <svg
            viewBox="0 0 100 70"
            preserveAspectRatio="xMidYMid meet"
            style={{ width: "100%", height: "100%", display: "block" }}
          >
            {/* faint graticule */}
            {[14, 28, 42, 56].map((gy) => (
              <line
                key={`h${gy}`}
                x1="6"
                y1={gy}
                x2="94"
                y2={gy}
                stroke="#1b2742"
                strokeWidth="0.3"
              />
            ))}
            {[20, 40, 60, 80].map((gx) => (
              <line
                key={`v${gx}`}
                x1={gx}
                y1="8"
                x2={gx}
                y2="64"
                stroke="#1b2742"
                strokeWidth="0.3"
              />
            ))}

            {/* all stories as faint markers */}
            {stories.map((s, i) => (
              <circle
                key={`dot-${s.state}`}
                cx={s.focusPoint.x}
                cy={s.focusPoint.y}
                r={i === active ? 0 : 1.3}
                fill="#5a6c92"
                opacity={0.6}
              />
            ))}

            {/* active story: connecting path + nodes */}
            <polyline
              points={story.connectedNodes
                .map((n) => `${n.x},${n.y}`)
                .join(" ")}
              fill="none"
              stroke={story.color}
              strokeWidth="0.6"
              strokeOpacity="0.8"
            />
            {story.connectedNodes.map((n) => (
              <circle
                key={`node-${story.state}-${n.type}`}
                cx={n.x}
                cy={n.y}
                r="1.6"
                fill={story.color}
              />
            ))}
            {/* focus point + pulse */}
            <circle
              cx={story.focusPoint.x}
              cy={story.focusPoint.y}
              r="2.6"
              fill={story.color}
            />
            <circle
              className="furlong-pulse-ring"
              cx={story.focusPoint.x}
              cy={story.focusPoint.y}
              r="2.2"
              fill="none"
              stroke={story.color}
              strokeWidth="0.6"
            />
          </svg>
        </div>

        {/* Accessible content — the real, non-canvas exploration card. */}
        <div style={{ display: "grid", gap: 10, alignContent: "start" }}>
          <div aria-live="polite" style={{ display: "grid", gap: 4 }}>
            <span style={{ fontSize: 12, color: "#9fb0d0" }}>
              Example region
            </span>
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
              background: "rgba(255,255,255,0.08)",
              color: story.color,
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            {story.opportunity}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {story.connectedNodes.map((n, i) => (
              <span
                key={`chip-${story.state}-${n.type}`}
                style={{
                  fontSize: 12,
                  color: "#cdd9f2",
                }}
              >
                {n.type}
                {i < story.connectedNodes.length - 1 ? " →" : ""}
              </span>
            ))}
          </div>
          <p style={{ margin: 0, lineHeight: 1.6, color: "#dbe5fb", fontSize: 14 }}>
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
                border: isActive
                  ? `1px solid ${s.color}`
                  : "1px solid #2c3b5c",
                background: isActive ? "rgba(255,255,255,0.10)" : "transparent",
                color: isActive ? "#ffffff" : "#aebbd8",
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

      <p style={{ margin: 0, fontSize: 12, color: "#8094b8", lineHeight: 1.5 }}>
        These are illustrative examples of what people explore — not offers, and
        not based on your location. We show pathways, not promises.
      </p>
    </section>
  );
}
