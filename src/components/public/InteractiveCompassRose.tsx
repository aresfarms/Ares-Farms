"use client";

/**
 * InteractiveCompassRose — the /explore compass, made to behave like a real
 * compass (founder direction 2026-07-20). Progressive enhancement over the static
 * rose: the spokes are still real <Link>s that work with no JS and full keyboard
 * / screen-reader support; the NEEDLE and the "point me toward…" objective picker
 * are the enhancement, never the requirement.
 *
 *  - Hover or keyboard-focus a lane → the needle swings to point at it and the
 *    spoke blooms in its lane color.
 *  - Pick an objective → the needle points to the matching lane and the others
 *    dim. Guidance, not a funnel: the highlighted spoke is still the click target.
 */

import Link from "next/link";
import { useState } from "react";

export interface CompassLane {
  slug: string;
  label: string;
  icon: string;
  tint: string;
  color: string;
  top: number;
  left: number;
  href?: string;
}

function LaneIcon({ name }: { name: string }) {
  const common = { width: 26, height: 26, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (name) {
    case "map-pin": return (<svg {...common}><path d="M12 21s-6-5.686-6-10a6 6 0 1 1 12 0c0 4.314-6 10-6 10z" /><circle cx="12" cy="11" r="2.2" /></svg>);
    case "plant": return (<svg {...common}><path d="M12 20v-8" /><path d="M12 12c0-3 2.2-5 5.2-5 0 3-2.2 5-5.2 5z" /><path d="M12 14c0-2.6-2.1-4.6-5.1-4.6 0 2.6 2.1 4.6 5.1 4.6z" /></svg>);
    case "store": return (<svg {...common}><path d="M4.5 9.5V19a1 1 0 0 0 1 1h13a1 1 0 0 0 1-1V9.5" /><path d="M3 9.5 4.6 5h14.8L21 9.5a2.5 2.5 0 0 1-5 0 2.5 2.5 0 0 1-5 0 2.5 2.5 0 0 1-5 0 2.5 2.5 0 0 1-3 0z" /><path d="M9.5 20v-5h5v5" /></svg>);
    case "leaf": return (<svg {...common}><path d="M5 19s-.5-8.5 8-11.5c4-1.4 5.5-2 5.5-2s.5 9.5-5.5 13.5C8.5 21 5 19 5 19z" /><path d="M5 19c4-4.5 7.5-6.5 11-7.5" /></svg>);
    case "coin": return (<svg {...common}><circle cx="12" cy="12" r="8.2" /><path d="M12 7.5v9" /><path d="M14.4 9.7c0-1.1-1-1.7-2.6-1.7s-2.6.7-2.6 1.7 1 1.4 2.6 1.6 2.6.5 2.6 1.6-1 1.7-2.6 1.7-2.6-.6-2.6-1.7" /></svg>);
    case "gift": return (<svg {...common}><rect x="4" y="9.5" width="16" height="10.5" rx="1" /><path d="M3 9.5h18v3H3z" /><path d="M12 9.5V20" /><path d="M12 9.5C12 9.5 11 4.5 8.3 4.5 6.5 4.5 6.5 7 8 8s4 1.5 4 1.5zM12 9.5s1-5 3.7-5C17.5 4.5 17.5 7 16 8s-4 1.5-4 1.5z" /></svg>);
    case "community": return (<svg {...common}><circle cx="9" cy="8" r="2.6" /><circle cx="16.5" cy="9" r="2.1" /><path d="M4.5 19v-1.2a4.5 4.5 0 0 1 9 0V19" /><path d="M14.5 19v-1a3.6 3.6 0 0 1 5.5-3.1" /></svg>);
    case "doc": return (<svg {...common}><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 8h6M9 12h6M9 16h4" /></svg>);
    default: return (<svg {...common}><circle cx="12" cy="12" r="8.5" /><path d="M15.6 8.4l-2 5.2-5.2 2 2-5.2z" /></svg>);
  }
}

// "Point me toward…" — plain-language objectives mapped to lanes. Guidance only.
const OBJECTIVES: { label: string; slug: string }[] = [
  { label: "Buy a home", slug: "property-land" },
  { label: "Work the land", slug: "farms-agriculture" },
  { label: "Open a business", slug: "small-business-growth" },
  { label: "Fund a deal", slug: "financing-capital" },
  { label: "Read the ground", slug: "environmental-compliance" },
];

const PROPERTY_DISCOVERY_LANES = new Set([
  "property-land",
  "farms-agriculture",
  "small-business-growth",
]);

function laneHref(l: CompassLane): string {
  if (l.href) return l.href;
  if (PROPERTY_DISCOVERY_LANES.has(l.slug)) {
    return `/navigator?flow=property-discovery&lens=${encodeURIComponent(l.slug)}`;
  }
  return `/explore?lane=${encodeURIComponent(l.slug)}`;
}

/** Bearing (deg, clockwise from north) from the hub to a lane node. */
function bearing(l: CompassLane): number {
  const dx = l.left - 50;
  const dy = l.top - 50;
  return (Math.atan2(dx, -dy) * 180) / Math.PI;
}

export function InteractiveCompassRose({
  lanes,
  ink,
  accent,
  showObjectives = true,
}: {
  lanes: CompassLane[];
  ink: string;
  accent: string;
  /** Show the "Point me toward…" objective picker (default on). */
  showObjectives?: boolean;
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [pinned, setPinned] = useState<string | null>(null);
  const activeSlug = hovered ?? pinned;
  const activeLane = lanes.find((l) => l.slug === activeSlug) ?? null;
  const needleAngle = activeLane ? bearing(activeLane) : 0; // rest = north

  return (
    <div style={{ display: "grid", gap: 18, justifyItems: "center" }}>
      {/* Objective picker — guidance, not a funnel. */}
      {showObjectives && (
      <div className="cr-obj" role="group" aria-label="Point the compass toward what you want to do">
        <span className="cr-obj-lead">Point me toward…</span>
        {OBJECTIVES.map((o) => (
          <button
            key={o.slug}
            type="button"
            className="cr-obj-btn"
            aria-pressed={pinned === o.slug}
            onClick={() => setPinned((p) => (p === o.slug ? null : o.slug))}
            style={pinned === o.slug ? { borderColor: accent, color: accent, background: "rgba(201,168,76,0.12)" } : undefined}
          >
            {o.label}
          </button>
        ))}
      </div>
      )}

      <div className="cr-rose">
        {/* Decorative dashed spokes. */}
        <svg className="cr-spokes" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
          {lanes.map((l) => (
            <line key={l.slug} x1={50} y1={50} x2={l.left} y2={l.top} stroke={accent} strokeWidth={0.5} strokeDasharray="1.8 1.8" opacity={l.slug === activeSlug ? 0.95 : 0.5} />
          ))}
        </svg>

        {/* The needle — swings to the active lane, rests pointing north. */}
        <svg className="cr-spokes" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
          <g style={{ transform: `rotate(${needleAngle}deg)`, transformOrigin: "50px 50px", transition: "transform .55s cubic-bezier(.34,1.32,.5,1)" }}>
            <polygon points="50,15 47.6,50 52.4,50" fill={accent} />
            <polygon points="50,70 48.6,50 51.4,50" fill="rgba(255,255,255,0.28)" />
            <circle cx="50" cy="50" r="2.3" fill={accent} />
            <circle cx="50" cy="50" r="3.6" fill="none" stroke={accent} strokeWidth="0.5" opacity="0.6" />
          </g>
        </svg>

        {/* Center hub — the Furlong emblem. */}
        <div className="cr-hub">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/furlong-ship-emblem-v2.png" alt="Furlong ship emblem — Compass to Capital" />
        </div>

        {/* Lane spokes — real links, enhanced with hover/focus + active state. */}
        {lanes.map((l) => {
          const isActive = l.slug === activeSlug;
          const dimmed = pinned != null && l.slug !== pinned && l.slug !== hovered;
          return (
            <Link
              key={l.slug}
              href={laneHref(l)}
              className={`cr-node${isActive ? " cr-node-active" : ""}`}
              style={{ top: `${l.top}%`, left: `${l.left}%`, ["--ring" as string]: l.color, opacity: dimmed ? 0.42 : 1 }}
              aria-label={`Explore ${l.label}`}
              onMouseEnter={() => setHovered(l.slug)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(l.slug)}
              onBlur={() => setHovered(null)}
            >
              <span className="cr-chip" style={{ background: l.tint, color: l.color, ...(isActive ? { boxShadow: `0 0 0 4px ${l.color}, 0 0 22px ${l.color}` } : {}) }}>
                <LaneIcon name={l.icon} />
              </span>
              <span className="cr-label" style={{ color: ink }}>{l.label}</span>
            </Link>
          );
        })}
      </div>

      <style>{`
        .cr-obj { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; justify-content: center; }
        .cr-obj-lead { font-size: 12.5px; font-weight: 700; letter-spacing: 0.02em; color: ${ink}; opacity: 0.85; margin-right: 2px; }
        .cr-obj-btn {
          font-size: 12.5px; font-weight: 700; color: ${ink};
          background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.22);
          border-radius: 999px; padding: 6px 13px; cursor: pointer; transition: all .15s ease;
        }
        .cr-obj-btn:hover, .cr-obj-btn:focus-visible { border-color: ${accent}; color: ${accent}; }
        .cr-rose { position: relative; width: 100%; max-width: 520px; margin: 4px auto 0; aspect-ratio: 1 / 1; overflow: visible; }
        .cr-spokes { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
        .cr-hub {
          position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
          width: 36%; max-width: 200px; aspect-ratio: 1 / 1; border-radius: 50%;
          overflow: hidden; z-index: 2; box-shadow: 0 0 48px rgba(201,168,76,0.30);
          background: rgba(201,168,76,0.04);
        }
        .cr-hub img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .cr-node {
          position: absolute; transform: translate(-50%, -50%); z-index: 3;
          display: flex; flex-direction: column; align-items: center; gap: 8px;
          width: 116px; text-decoration: none; transition: transform .14s ease, opacity .3s ease;
          border-radius: 12px;
        }
        .cr-node:hover, .cr-node.cr-node-active { transform: translate(-50%, -50%) scale(1.08); }
        .cr-node:focus-visible { transform: translate(-50%, -50%) scale(1.08); outline: 2px solid #ffffff; outline-offset: 6px; }
        .cr-chip {
          width: 56px; height: 56px; border-radius: 50%; display: flex;
          align-items: center; justify-content: center;
          box-shadow: 0 2px 10px rgba(0,0,0,0.35); transition: box-shadow .16s ease;
        }
        .cr-node:hover .cr-chip, .cr-node:focus-visible .cr-chip {
          box-shadow: 0 0 0 4px var(--ring), 0 0 22px var(--ring), 0 6px 16px rgba(0,0,0,0.5);
        }
        .cr-label { font-size: 13px; font-weight: 600; text-align: center; line-height: 1.3; }

        @media (max-width: 640px) {
          .cr-rose { aspect-ratio: auto; display: flex; flex-direction: column; align-items: stretch; gap: 10px; max-width: 400px; margin: 0 auto; }
          .cr-spokes { display: none !important; }
          .cr-hub { position: static !important; transform: none !important; width: 150px; align-self: center; margin-bottom: 6px; }
          .cr-node {
            position: static !important; transform: none !important;
            flex-direction: row; justify-content: flex-start; gap: 14px;
            width: 100%; padding: 10px 14px; border-radius: 12px; background: rgba(255,255,255,0.04);
          }
          .cr-node:hover, .cr-node:focus-visible, .cr-node.cr-node-active { transform: none !important; background: rgba(255,255,255,0.09); outline-offset: -2px; }
          .cr-chip { width: 46px; height: 46px; flex-shrink: 0; }
          .cr-label { text-align: left; font-size: 15px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .cr-spokes g { transition: none !important; }
        }
      `}</style>
    </div>
  );
}
