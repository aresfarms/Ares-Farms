/**
 * CompassRose — the Furlong compass-rose explorer, lifted VERBATIM from the
 * /explore page so it can lead the front page (founder direction 2026-07-17:
 * "keep the old one exactly — just move it to the front page intact"). The
 * emblem, the eight lanes, the gold spokes, the colors: unchanged. No arrows,
 * no hints, no redesign.
 *
 * Server component. The lane links point back into /explore for the lane view.
 */

import { CHART_THEMES } from "@/lib/property/chartThemes";
import { InteractiveCompassRose } from "@/components/public/InteractiveCompassRose";

const theme = CHART_THEMES.buyer;

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

// Residential removed from the rose (founder 2026-08-05: focused portal —
// residential is parked, not marketed). Seven points; Farms takes North.
// Positions are COMPUTED evenly around the ring (founder 2026-08-05: the
// 7 lanes on the old 8-slot compass grid left a hole at NW and read wonky).
const LANE_ORDER: Omit<LaneNode, "top" | "left">[] = [
  { slug: "farms-agriculture",        label: "Farms, Agriculture & Land",       icon: "plant",   tint: "#EAF3DE", color: "#3B6D11" },
  { slug: "small-business-growth",    label: "Commercial Properties",           icon: "store",   tint: "#E6F1FB", color: "#185FA5" },
  { slug: "environmental-compliance", label: "Environmental",                   icon: "leaf",    tint: "#E1F5EE", color: "#0F6E56" },
  { slug: "financing-capital",        label: "Financing & Capital",             icon: "coin",    tint: "#EEEDFE", color: "#534AB7" },
  { slug: "guild",                    label: "The Guild",                       icon: "community", tint: "#faf3e6", color: "#b8862f", href: "/guild" },
  { slug: "programs-incentives",      label: "Grants & State and Federal Programs", icon: "gift", tint: "#FBEAF0", color: "#993556" },
  { slug: "not-sure",                 label: "Taxes, Accounting & Regulations", icon: "doc",     tint: "#E6F1FB", color: "#185FA5" },
];

/** Evenly space n points clockwise from North on the ring the old 8-point
 *  rose used (vertical radius 37, horizontal radius 38 around center 50,50). */
export function evenRosePositions<T>(nodes: (T & { top?: number; left?: number })[]): (T & { top: number; left: number })[] {
  return nodes.map((node, i) => {
    const angle = (i * 2 * Math.PI) / nodes.length;
    return {
      ...node,
      top: Math.round((50 - 37 * Math.cos(angle)) * 10) / 10,
      left: Math.round((50 + 38 * Math.sin(angle)) * 10) / 10,
    };
  });
}

const LANES: LaneNode[] = evenRosePositions(LANE_ORDER);

export function CompassRose({
  showHeading = true,
  showObjectives = false,
}: {
  showHeading?: boolean;
  /** Show the "Point me toward…" objective picker (front door turns this on). */
  showObjectives?: boolean;
}) {
  return (
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

      {/* The real, interactive compass (founder direction 2026-07-20): needle
          swings to the hovered/focused lane; the front door also shows the
          "point me toward…" picker. Progressive enhancement over real links. */}
      <InteractiveCompassRose lanes={LANES} ink={theme.ink} accent={theme.accent} showObjectives={showObjectives} />
    </section>
  );
}
