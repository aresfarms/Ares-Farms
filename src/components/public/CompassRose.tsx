/**
 * CompassRose — the Furlong compass-rose explorer, lifted VERBATIM from the
 * /explore page so it can lead the front page (founder direction 2026-07-17:
 * "keep the old one exactly — just move it to the front page intact"). The
 * emblem, the eight lanes, the gold spokes, the colors: unchanged. No arrows,
 * no hints, no redesign.
 *
 * Server component. The lane links point back into /explore for the lane view.
 */

import Link from "next/link";

import { CHART_THEMES } from "@/lib/property/chartThemes";

const theme = CHART_THEMES.buyer;

/** No-account lane destination — stays inside /explore. */
function laneHref(slug: string): string {
  return `/explore?lane=${encodeURIComponent(slug)}`;
}

type IconName = "map-pin" | "plant" | "store" | "leaf" | "coin" | "mail" | "gift" | "compass" | "doc" | "community";

type LaneNode = {
  slug: string;
  label: string;
  icon: IconName;
  tint: string;
  color: string;
  top: number;
  left: number;
  /** Optional destination override (else /explore?lane=slug). */
  href?: string;
};

const LANES: LaneNode[] = [
  { slug: "property-land",            label: "Residential",                     icon: "map-pin", tint: "#FAEEDA", color: "#854F0B", top: 13, left: 50 }, // N
  { slug: "farms-agriculture",        label: "Farms, Agriculture & Land",       icon: "plant",   tint: "#EAF3DE", color: "#3B6D11", top: 24, left: 78 }, // NE
  { slug: "small-business-growth",    label: "Commercial Properties",           icon: "store",   tint: "#E6F1FB", color: "#185FA5", top: 50, left: 88 }, // E
  { slug: "environmental-compliance", label: "Environmental",                   icon: "leaf",    tint: "#E1F5EE", color: "#0F6E56", top: 76, left: 78 }, // SE
  { slug: "financing-capital",        label: "Financing & Capital",             icon: "coin",    tint: "#EEEDFE", color: "#534AB7", top: 87, left: 50 }, // S
  { slug: "guild",                    label: "The Guild",                       icon: "community", tint: "#faf3e6", color: "#b8862f", top: 76, left: 22, href: "/guild" }, // SW — the gold membership entity
  { slug: "programs-incentives",      label: "Grants & State and Federal Programs", icon: "gift", tint: "#FBEAF0", color: "#993556", top: 50, left: 12 }, // W
  { slug: "not-sure",                 label: "Taxes, Accounting & Regulations", icon: "doc",     tint: "#E6F1FB", color: "#185FA5", top: 24, left: 22 }, // NW
];

function LaneIcon({ name }: { name: IconName }) {
  const common = {
    width: 26, height: 26, viewBox: "0 0 24 24", fill: "none",
    stroke: "currentColor", strokeWidth: 1.9, strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const, "aria-hidden": true,
  };
  switch (name) {
    case "map-pin":  return (<svg {...common}><path d="M12 21s-6-5.686-6-10a6 6 0 1 1 12 0c0 4.314-6 10-6 10z" /><circle cx="12" cy="11" r="2.2" /></svg>);
    case "plant":    return (<svg {...common}><path d="M12 20v-8" /><path d="M12 12c0-3 2.2-5 5.2-5 0 3-2.2 5-5.2 5z" /><path d="M12 14c0-2.6-2.1-4.6-5.1-4.6 0 2.6 2.1 4.6 5.1 4.6z" /></svg>);
    case "store":    return (<svg {...common}><path d="M4.5 9.5V19a1 1 0 0 0 1 1h13a1 1 0 0 0 1-1V9.5" /><path d="M3 9.5 4.6 5h14.8L21 9.5a2.5 2.5 0 0 1-5 0 2.5 2.5 0 0 1-5 0 2.5 2.5 0 0 1-5 0 2.5 2.5 0 0 1-3 0z" /><path d="M9.5 20v-5h5v5" /></svg>);
    case "leaf":     return (<svg {...common}><path d="M5 19s-.5-8.5 8-11.5c4-1.4 5.5-2 5.5-2s.5 9.5-5.5 13.5C8.5 21 5 19 5 19z" /><path d="M5 19c4-4.5 7.5-6.5 11-7.5" /></svg>);
    case "coin":     return (<svg {...common}><circle cx="12" cy="12" r="8.2" /><path d="M12 7.5v9" /><path d="M14.4 9.7c0-1.1-1-1.7-2.6-1.7s-2.6.7-2.6 1.7 1 1.4 2.6 1.6 2.6.5 2.6 1.6-1 1.7-2.6 1.7-2.6-.6-2.6-1.7" /></svg>);
    case "mail":     return (<svg {...common}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3.5 7 8.5 6 8.5-6" /></svg>);
    case "gift":     return (<svg {...common}><rect x="4" y="9.5" width="16" height="10.5" rx="1" /><path d="M3 9.5h18v3H3z" /><path d="M12 9.5V20" /><path d="M12 9.5C12 9.5 11 4.5 8.3 4.5 6.5 4.5 6.5 7 8 8s4 1.5 4 1.5zM12 9.5s1-5 3.7-5C17.5 4.5 17.5 7 16 8s-4 1.5-4 1.5z" /></svg>);
    case "compass":  return (<svg {...common}><circle cx="12" cy="12" r="8.5" /><path d="M15.6 8.4l-2 5.2-5.2 2 2-5.2z" /></svg>);
    case "doc":      return (<svg {...common}><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 8h6M9 12h6M9 16h4" /></svg>);
    case "community":return (<svg {...common}><circle cx="9" cy="8" r="3" /><path d="M3.5 19c0-3 2.4-5 5.5-5s5.5 2 5.5 5" /><path d="M15.5 6.2a3 3 0 0 1 0 5.6" /><path d="M16.5 14.2c2.1.5 3.7 2.3 3.7 4.8" /></svg>);
  }
}

export function CompassRose({ showHeading = true }: { showHeading?: boolean }) {
  return (
    <>
      <style>{`
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
          width: 116px; text-decoration: none; transition: transform .14s ease;
          border-radius: 12px;
        }
        .cr-node:hover { transform: translate(-50%, -50%) scale(1.07); }
        .cr-node:focus-visible {
          transform: translate(-50%, -50%) scale(1.07);
          outline: 2px solid #ffffff; outline-offset: 6px;
        }
        .cr-chip {
          width: 56px; height: 56px; border-radius: 50%; display: flex;
          align-items: center; justify-content: center;
          box-shadow: 0 2px 10px rgba(0,0,0,0.35);
          transition: box-shadow .14s ease;
        }
        .cr-node:hover .cr-chip, .cr-node:focus-visible .cr-chip {
          box-shadow: 0 0 0 4px var(--ring), 0 0 22px var(--ring), 0 6px 16px rgba(0,0,0,0.5);
        }
        .cr-label { color: ${theme.ink}; font-size: 13px; font-weight: 600; text-align: center; line-height: 1.3; }

        @media (max-width: 640px) {
          .cr-rose { aspect-ratio: auto; display: flex; flex-direction: column; align-items: stretch; gap: 10px; max-width: 400px; margin: 0 auto; }
          .cr-spokes { display: none !important; }
          .cr-hub { position: static !important; transform: none !important; width: 150px; align-self: center; margin-bottom: 6px; }
          .cr-node {
            position: static !important; transform: none !important;
            flex-direction: row; justify-content: flex-start; gap: 14px;
            width: 100%; padding: 10px 14px; border-radius: 12px;
            background: rgba(255,255,255,0.04);
          }
          .cr-node:hover, .cr-node:focus-visible { transform: none !important; background: rgba(255,255,255,0.09); outline-offset: -2px; }
          .cr-chip { width: 46px; height: 46px; flex-shrink: 0; }
          .cr-label { text-align: left; font-size: 15px; }
        }
      `}</style>

      <section
        aria-label="Explore the eight Furlong lanes"
        style={{ background: theme.stage, color: theme.ink, padding: "clamp(36px, 6vw, 64px) 24px" }}
      >
        {showHeading && (
          <div style={{ maxWidth: 720, margin: "0 auto 28px", textAlign: "center", display: "grid", gap: 12 }}>
            <h2 style={{ margin: 0, fontSize: "clamp(28px, 4.5vw, 42px)", fontWeight: 800, letterSpacing: "-0.02em", color: theme.ink }}>
              Explore your opportunities
            </h2>
            <p style={{ margin: 0, fontSize: 17, lineHeight: 1.6, color: theme.inkSoft }}>
              Discover what&apos;s possible before you commit. No account, no personal data, and no footprints
              required. Change direction at any time.
            </p>
          </div>
        )}

        <div className="cr-rose">
          <svg className="cr-spokes" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
            {LANES.map((l) => (
              <line key={l.slug} x1={50} y1={50} x2={l.left} y2={l.top} stroke={theme.accent} strokeWidth={0.5} strokeDasharray="1.8 1.8" opacity={0.55} />
            ))}
          </svg>

          <div className="cr-hub">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/furlong-emblem.png" alt="Furlong emblem — a guide through uncertain waters" />
          </div>

          {LANES.map((l) => (
            <Link
              key={l.slug}
              href={l.href ?? laneHref(l.slug)}
              className="cr-node"
              style={{ top: `${l.top}%`, left: `${l.left}%`, ["--ring" as string]: l.color }}
              aria-label={`Explore ${l.label}`}
            >
              <span className="cr-chip" style={{ background: l.tint, color: l.color }}>
                <LaneIcon name={l.icon} />
              </span>
              <span className="cr-label">{l.label}</span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
