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
const LANES: LaneNode[] = [
  { slug: "farms-agriculture",        label: "Farms, Agriculture & Land",       icon: "plant",   tint: "#EAF3DE", color: "#3B6D11", top: 13, left: 50 }, // N
  { slug: "small-business-growth",    label: "Commercial Properties",           icon: "store",   tint: "#E6F1FB", color: "#185FA5", top: 24, left: 78 }, // NE
  { slug: "environmental-compliance", label: "Environmental",                   icon: "leaf",    tint: "#E1F5EE", color: "#0F6E56", top: 50, left: 88 }, // E
  { slug: "financing-capital",        label: "Financing & Capital",             icon: "coin",    tint: "#EEEDFE", color: "#534AB7", top: 76, left: 78 }, // SE
  { slug: "guild",                    label: "The Guild",                       icon: "community", tint: "#faf3e6", color: "#b8862f", top: 87, left: 50, href: "/guild" }, // S — the gold membership entity
  { slug: "programs-incentives",      label: "Grants & State and Federal Programs", icon: "gift", tint: "#FBEAF0", color: "#993556", top: 76, left: 22 }, // SW
  { slug: "not-sure",                 label: "Taxes, Accounting & Regulations", icon: "doc",     tint: "#E6F1FB", color: "#185FA5", top: 50, left: 12 }, // W
];

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
