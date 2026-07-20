import type { Metadata } from "next";
import Link from "next/link";

import { EXPLORATION_CATEGORIES } from "@/lib/customer-landing/featuredExplorationStories";
import { CommunityCta } from "@/components/public/CommunityCta";
import { CurrentNewsletters } from "@/components/public/CurrentNewsletters";
import { CapitalRatesBlock } from "@/components/public/CapitalRatesBlock";
import { CommercialLaneSections } from "@/components/public/CommercialLaneSections";
import { EnvironmentalLaneSections } from "@/components/public/EnvironmentalLaneSections";
import { FarmCommodityTicker, FarmLaneSections } from "@/components/public/FarmLaneSections";
import { FinancingLaneSections } from "@/components/public/FinancingLaneSections";
import { GrantsLaneSections } from "@/components/public/GrantsLaneSections";
import { HundredPercentFinancingCallout } from "@/components/public/HundredPercentFinancingCallout";
import { ResidentialLoanTable, ResidentialRateTiles } from "@/components/public/ResidentialRatesBlock";
import { Disclosures } from "@/components/public/Disclosures";
import { PropertyHub } from "@/components/property/PropertyHub";
import { PropertyGroupsFrontDoor } from "@/components/public/PropertyGroupsFrontDoor";
import { PropertyShowcaseRail } from "@/components/public/PropertyShowcaseRail";
import { PublicMapExperience } from "@/components/public/PublicMapExperience";
import { buildFrontDoorGroups } from "@/lib/property/propertyFrontDoor";
import type { NewsletterAudience } from "@/lib/newsletter/newsletterEditions";
import { CHART_THEMES, CHART_TONES } from "@/lib/property/chartThemes";
import { categoryForType } from "@/lib/property/propertyCategories";
import { accentForLane } from "@/lib/property/laneThemes";
import { buildPublicSafeInventoryByState } from "@/lib/property/propertyData";
import type { PropertyProfileId } from "@/lib/property/propertyProfile";
import { getRuntimeLiveSources } from "@/lib/property/sourceActivationStore";
import { STATE_DROUGHT_PROVENANCE } from "@/lib/property/stateDroughtGenerated";
import { providersForLane } from "@/lib/providers/providerRegistry";
import { isoWeekSeed, visitRotationSeed } from "@/lib/public-content/weekSeed";

/**
 * Each emblem on the wheel gets its own themed newsletter (founder direction
 * 2026-07-17). Mapped lanes render their Dispatch in the lane view; the rest
 * slot in as their letters are written (the deeper newsletter work is later).
 */
const LANE_AUDIENCE: Record<string, NewsletterAudience> = {
  "farms-agriculture": "farm",
  "property-land": "residential",
};

/**
 * The three property-browsing lanes, each showing ONLY its own inventory
 * (founder direction 2026-07-17). `categories` filters the map + shelf (via
 * categoryForType); `profiles` filters the grouped front door (via profileId).
 */
const PROPERTY_LANE_FILTERS: Record<string, { categories: string[]; profiles: PropertyProfileId[] }> = {
  "property-land": { categories: ["homes"], profiles: ["residential"] },
  "farms-agriculture": { categories: ["farms-ranches", "land"], profiles: ["farm", "land"] },
  "small-business-growth": { categories: ["commercial", "hospitality", "businesses", "misc"], profiles: ["commercial", "hospitality", "mobile-home-park"] },
};

/** Keep only the listings whose category is in the lane's set (drops empty states). */
function filterInventoryByCategories(
  inv: ReturnType<typeof buildPublicSafeInventoryByState>,
  categories: Set<string>
): ReturnType<typeof buildPublicSafeInventoryByState> {
  const out: ReturnType<typeof buildPublicSafeInventoryByState> = {};
  for (const [state, props] of Object.entries(inv)) {
    const kept = props.filter((p) => categories.has(categoryForType(p.propertyType)));
    if (kept.length) out[state] = kept;
  }
  return out;
}

/**
 * /explore — Compass-rose navigation (Build 56).
 *
 * The eight exploration lanes radiate as spokes around the Furlong emblem on
 * the navigator stage (Chart Table cohesion rollout, founder 2026-07-17: every
 * compass surface shares the chart language — stage, plates, kickers, gold
 * plotted-route spokes from CHART_THEMES.buyer; no per-surface hexes).
 * NAVIGATION ONLY — each spoke links to its /explore?lane=<id> route; the lane
 * landing pages / onboarding / search platform are intentionally deferred.
 *
 * No-account promise: spokes stay inside /explore (?lane=) — never /onboarding.
 * The shared <Disclosures> strip renders below the dark band on the light page.
 *
 * Governance: "The map reveals opportunities, not the visitor." Public Alpha PENDING.
 */

export const metadata: Metadata = {
  title: "Explore Your Possibilities | Furlong",
  description:
    "Look around before you commit. Eight exploration lanes around the Furlong compass — no account " +
    "and no personal information needed to look around.",
};

/** No-account lane destination — stays inside /explore. */
function laneHref(slug: string): string {
  return `/explore?lane=${encodeURIComponent(slug)}`;
}

// ── Compass-rose lane metadata ───────────────────────────────────────────────
// Eight lanes at the eight compass points (N, NE, E, SE, S, SW, W, NW), evenly
// spaced on a ring (top/left as % of the square container).
type LaneNode = {
  slug: string;
  label: string;
  icon: IconName;
  tint: string;      // soft chip background
  color: string;     // icon + focus ring color
  top: number;       // % position of the node centre
  left: number;
  href?: string;     // override the /explore?lane= link (e.g. The Guild → /guild)
};

// Positions pulled inward from the square's edges (verticals 13–87, diagonals
// 24/76) so the chips + labels never clip the band top/bottom and all eight fit
// without scrolling on desktop.
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

type IconName = "map-pin" | "plant" | "store" | "leaf" | "coin" | "mail" | "gift" | "compass" | "doc" | "community";

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
    case "community": return (<svg {...common}><circle cx="9" cy="8" r="2.6" /><circle cx="16.5" cy="9" r="2.1" /><path d="M4.5 19v-1.2a4.5 4.5 0 0 1 9 0V19" /><path d="M14.5 19v-1a3.6 3.6 0 0 1 5.5-3.1" /></svg>);
  }
}

// ── Shared tokens — the navigator chart theme (Chart Table family) ───────────
const theme = CHART_THEMES.buyer;
const dark = CHART_TONES.dark;
const stageContainer = {
  maxWidth: 880,
  margin: "0 auto",
  padding: "32px 24px 60px",
  display: "grid",
  gap: 24,
  background: theme.stage,
  borderRadius: 20,
  color: theme.ink,
} as const;
const muted = { color: theme.inkSoft, lineHeight: 1.6 } as const;
const kicker = {
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: theme.accent,
} as const;

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function ExplorePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolved  = searchParams ? await searchParams : {};
  const laneValue = resolved.lane;
  const laneSlug  = Array.isArray(laneValue) ? laneValue[0] : laneValue;
  const selected  = EXPLORATION_CATEGORIES.find((c) => c.slug === laneSlug) ?? null;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? null;

  // ── Property lanes — Residential / Farms-Ag-Land / Commercial — each browses
  // ONLY its own inventory (founder direction 2026-07-17). The Farms lane also
  // carries its newsletter at the top. Map + grouped listings sit side by side
  // (map has a fixed ~794px width → side-by-side on wide screens, stacks below).
  const laneFilter = selected ? PROPERTY_LANE_FILTERS[selected.slug] : undefined;
  if (selected && laneFilter) {
    const laneInventory = filterInventoryByCategories(buildPublicSafeInventoryByState(), new Set(laneFilter.categories));
    const laneGroups = buildFrontDoorGroups().filter((g) => laneFilter.profiles.includes(g.profileId));
    const landWeekSeed = isoWeekSeed();
    // The live-listings shelf cycles per visit (founder 2026-07-19) so it walks
    // the full inventory instead of a fixed weekly window; the map keeps the
    // weekly narrative seed.
    const shelfSeed = visitRotationSeed();
    const audience = LANE_AUDIENCE[selected.slug];
    const isFarmLane = selected.slug === "farms-agriculture";
    const isResidentialLane = selected.slug === "property-land";
    const isCommercialLane = selected.slug === "small-business-growth";
    // Each module wears its own accent (founder direction 2026-07-18). These
    // property lanes render on white → the onLight variant.
    const laneAccent = accentForLane(selected.slug, "light");
    return (
      <>
        {/* Farms lane leads with the commodity ticker (founder direction
            2026-07-18: the module answers what agricultural people actually
            want to know — prices first). */}
        {isFarmLane && (
          <div style={{ maxWidth: 1280, margin: "0 auto", padding: "20px 20px 0" }}>
            <FarmCommodityTicker />
          </div>
        )}
        <div
          className="land-top-row"
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "24px 20px 0",
            display: "grid",
            gap: 24,
            gridTemplateColumns: "minmax(0, 1.35fr) minmax(0, 1fr)",
            alignItems: "start",
          }}
        >
          <div className="fl-map-section">
            <PublicMapExperience
              liveSources={getRuntimeLiveSources()}
              mapInventoryByState={laneInventory}
              weekSeed={landWeekSeed}
              fillHeight={isFarmLane}
            />
          </div>
          {/* Right column beside the map. Farms/Land: the Real Listings fill the
              dead space under the browse box. Residential: the mortgage-rate
              tiles sit under the "Homes to live in" box (founder direction
              2026-07-18). Other lanes keep the full-width shelf below. */}
          <div style={{ display: "grid", gap: 16, alignContent: "start" }}>
            <PropertyGroupsFrontDoor groups={laneGroups} compact accent={laneAccent} />
            {isFarmLane && (
              <PropertyShowcaseRail inventoryByState={laneInventory} weekSeed={shelfSeed} limit={6} layout="column" accent={laneAccent} />
            )}
            {isResidentialLane && <ResidentialRateTiles />}
            {isResidentialLane && <HundredPercentFinancingCallout />}
            {isCommercialLane && <CapitalRatesBlock accent={laneAccent} />}
          </div>
        </div>
        {/* The farmer sections as cards (founder direction 2026-07-18):
            enterprise economics, land-money options, equipment, cross-links. */}
        {isFarmLane && (
          <div style={{ maxWidth: 1180, margin: "0 auto", padding: "18px 20px 0" }}>
            <FarmLaneSections />
          </div>
        )}
        {/* The commercial sections (founder direction 2026-07-18): the kinds of
            commercial property, the questions owners ask + the ones they don't. */}
        {isCommercialLane && (
          <div style={{ maxWidth: 1180, margin: "0 auto", padding: "18px 20px 0" }}>
            <CommercialLaneSections />
          </div>
        )}
        {/* Non-farm lanes keep the full-width listings shelf below the map. */}
        {!isFarmLane && (
          <div style={{ maxWidth: 1180, margin: "0 auto", padding: "18px 20px 0" }}>
            <PropertyShowcaseRail inventoryByState={laneInventory} weekSeed={shelfSeed} accent={laneAccent} />
          </div>
        )}
        {/* Residential lane: the full loan-options table full-width below the
            shelf (the rate tiles already sit next to the map above). */}
        {isResidentialLane && (
          <div style={{ maxWidth: 1180, margin: "0 auto", padding: "18px 20px 0" }}>
            <ResidentialLoanTable />
          </div>
        )}
        <PropertyHub
          state={one(resolved.state)}
          type={one(resolved.type)}
          category={one(resolved.category)}
          lane={selected.slug}
        />
        {/* Newsletters & podcasts, then the gold Community cue, at the BOTTOM
            of every lane (founder direction 2026-07-18). */}
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "24px 20px 0", display: "grid", gap: 16 }}>
          {audience && <CurrentNewsletters audiences={[audience]} />}
          <CommunityCta />
        </div>
        {/* The map is width-responsive now (960×580 aspect held at any width),
            so it keeps its side column at normal widths; only narrow screens stack.
            min-width:0 on the grid children lets them shrink into the single mobile
            column instead of forcing an 8px page overflow (their min-content is
            wider than a phone); overflow-x:clip guards against any residual. */}
        <style>{`
          .land-top-row { overflow-x: clip; }
          .land-top-row > * { min-width: 0; }
          @media (max-width: 900px) { .land-top-row { grid-template-columns: 1fr !important; } }
        `}</style>
      </>
    );
  }

  // ── Content-module lanes (real modules, no property inventory) ─────────────
  // Light page: header + the module's own sections + the Guild cue. Environmental
  // is live; Financing joins here when its module is built (founder direction
  // 2026-07-18). Emerald accent for environmental.
  if (selected && selected.slug === "environmental-compliance") {
    return (
      <main>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "28px 20px 48px", display: "grid", gap: 24 }}>
          <header style={{ display: "grid", gap: 8 }}>
            <Link href="/explore" style={{ fontSize: 13, fontWeight: 700, color: accentForLane(selected.slug, "light"), textDecoration: "none", width: "fit-content" }}>
              ← Back to the compass
            </Link>
            <h1 style={{ margin: 0, fontSize: "clamp(26px, 4vw, 36px)", fontWeight: 800, letterSpacing: -0.02, lineHeight: 1.15, color: "#101a2b" }}>
              {selected.label}
            </h1>
            <p style={{ margin: 0, fontSize: 16, color: "#4d596d", lineHeight: 1.6, maxWidth: 640 }}>
              What the ground can tell you before you commit — read it all free, then order a licensed assessment from a PE when you&apos;re ready.
            </p>
          </header>
          <EnvironmentalLaneSections />
          <CommunityCta />
          <Disclosures variant="full" />
        </div>
      </main>
    );
  }

  // Financial & Capital — a licensed module: learn how financing works, see live
  // public rates, then submit a deal routed to the licensed lender (founder
  // direction 2026-07-18). Purple accent. Facilitation only — never a lender.
  if (selected && selected.slug === "financing-capital") {
    return (
      <main>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "28px 20px 48px", display: "grid", gap: 24 }}>
          <header style={{ display: "grid", gap: 8 }}>
            <Link href="/explore" style={{ fontSize: 13, fontWeight: 700, color: accentForLane(selected.slug, "light"), textDecoration: "none", width: "fit-content" }}>
              ← Back to the compass
            </Link>
            <h1 style={{ margin: 0, fontSize: "clamp(26px, 4vw, 36px)", fontWeight: 800, letterSpacing: -0.02, lineHeight: 1.15, color: "#101a2b" }}>
              {selected.label}
            </h1>
            <p style={{ margin: 0, fontSize: 16, color: "#4d596d", lineHeight: 1.6, maxWidth: 640 }}>
              The capital side of every property decision — learn the programs and see today&apos;s rates free, then bring your deal to a licensed lender when you&apos;re ready.
            </p>
          </header>
          <FinancingLaneSections />
          <CommunityCta />
          <Disclosures variant="full" />
        </div>
      </main>
    );
  }

  // Grants & Programs — a content module: the federal/state grant programs a
  // rural owner should know (founder direction 2026-07-19). Raspberry accent.
  // Educational, never a promise of an award.
  if (selected && selected.slug === "programs-incentives") {
    return (
      <main>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "28px 20px 48px", display: "grid", gap: 24 }}>
          <header style={{ display: "grid", gap: 8 }}>
            <Link href="/explore" style={{ fontSize: 13, fontWeight: 700, color: accentForLane(selected.slug, "light"), textDecoration: "none", width: "fit-content" }}>
              ← Back to the compass
            </Link>
            <h1 style={{ margin: 0, fontSize: "clamp(26px, 4vw, 36px)", fontWeight: 800, letterSpacing: -0.02, lineHeight: 1.15, color: "#101a2b" }}>
              {selected.label}
            </h1>
            <p style={{ margin: 0, fontSize: 16, color: "#4d596d", lineHeight: 1.6, maxWidth: 640 }}>
              Grants and cost-share programs can fund a real slice of a project — free to learn here, and the programs most people miss.
            </p>
          </header>
          <GrantsLaneSections />
          <CommunityCta />
          <Disclosures variant="full" />
        </div>
      </main>
    );
  }

  // ── Deferred lane view (a spoke's destination — platform not built here) ────
  if (selected) {
    // Property → Finance bridge context: a visitor arriving from a property they
    // found in the hub. Carries illustrative pathway tags (no PII) so the lane
    // can frame the next step. Advisory only — never qualified/approved.
    const fromProperty = one(resolved.from) === "property";
    const pathwayTags = (one(resolved.pathways) ?? "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    // Each deferred module wears its own accent (founder direction 2026-07-18).
    // The stage is dark navy → the onDark (light) variant; the newsletter cards
    // are white → the onLight variant.
    const laneAccentDark = accentForLane(selected.slug, "dark");
    const laneAccentLight = accentForLane(selected.slug, "light");
    return (
      <main>
        <div style={stageContainer}>
          <header style={{ display: "grid", gap: 10 }}>
            <h1 style={{ margin: 0, fontSize: "clamp(28px, 4vw, 38px)", fontWeight: 800, letterSpacing: -0.02, lineHeight: 1.12, color: theme.ink }}>
              {selected.label}
            </h1>
            <p style={{ margin: 0, fontSize: 17, ...muted, maxWidth: 620 }}>
              Discover what's possible before you commit. No account, no personal data, and no footprints
              required. Change direction at any time.
            </p>
          </header>

          {/* The Newsletters & Podcasts emblem lists ALL current newsletters
              (and podcasts once running) — links, not inline letters (founder
              direction 2026-07-18). Other mapped lanes list their own. */}
          {selected.slug === "housing-development" ? (
            <CurrentNewsletters accent={laneAccentLight} />
          ) : LANE_AUDIENCE[selected.slug] ? (
            <CurrentNewsletters audiences={[LANE_AUDIENCE[selected.slug]]} accent={laneAccentLight} />
          ) : null}

          <section
            aria-label={`Exploring: ${selected.label}`}
            style={{ background: theme.plate, border: `1px solid ${theme.plateBorder}`, borderRadius: 14, padding: "24px 28px", display: "grid", gap: 12 }}
          >
            <span style={{ ...kicker, color: laneAccentDark }}>
              Exploring — no account needed
            </span>
            <strong style={{ fontSize: 22, color: theme.ink }}>{selected.label}</strong>
            <p style={{ margin: 0, fontSize: 16, ...muted }}>{selected.blurb}</p>
            <Link href="/explore" style={{ fontSize: 14, fontWeight: 700, color: laneAccentDark, textDecoration: "none", width: "fit-content" }}>
              ← Back to the compass
            </Link>
          </section>

          {fromProperty && (
            <section
              aria-label="Next step — explore financing for a property you found"
              style={{ background: theme.waypointBg, border: `1px solid ${theme.waypointBorder}`, borderRadius: 14, padding: "20px 24px", display: "grid", gap: 8 }}
            >
              <strong style={{ fontSize: 16, color: laneAccentDark }}>
                Exploring financing for a property you found
              </strong>
              <p style={{ margin: 0, fontSize: 15, ...muted }}>
                {pathwayTags.length > 0 ? (
                  <>It <strong style={{ color: theme.ink }}>may fit a {pathwayTags.join(" / ")} pathway</strong> — providers below can help you explore it.</>
                ) : (
                  <>It <strong style={{ color: theme.ink }}>may fit a USDA / SBA / conventional pathway</strong> — providers below can help you explore it.</>
                )}{" "}
                Furlong is advisory only — we don&apos;t lend, approve, or determine eligibility, and we
                pass none of your information. You choose whether to engage a provider directly.
              </p>
            </section>
          )}

          {providersForLane(selected.slug).length > 0 && (
            <section aria-label="Providers in this lane" style={{ display: "grid", gap: 12 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: theme.ink }}>Providers in this lane</h2>
              <p style={{ margin: 0, fontSize: 13, ...muted }}>
                Independent, licensed companies — each a separate business that pays a flat license fee to be
                listed. Furlong takes no referral fee and submits none of your information.
              </p>
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 10 }}>
                {providersForLane(selected.slug).map((p) => (
                  <li key={p.slug} style={{ border: `1px solid ${theme.cellBorder}`, borderRadius: 12, background: theme.cellBg, padding: "16px 18px", display: "grid", gap: 4 }}>
                    <Link href={`/providers/${p.slug}`} style={{ fontSize: 17, fontWeight: 700, color: laneAccentDark, textDecoration: "none" }}>
                      {p.name} →
                    </Link>
                    <span style={{ fontSize: 14, ...muted }}>{p.tagline}</span>
                    <span style={{ fontSize: 12, color: theme.honey }}>{p.separateCompanyLabel}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {/* The gold Community cue at the bottom of every lane (founder
              direction 2026-07-18). */}
          <CommunityCta />
          <Disclosures variant="full" tone="dark" />
        </div>
      </main>
    );
  }

  // ── Compass-rose index (the navigator stage) ────────────────────────────────
  return (
    <main>
      <style>{`
        /* Desktop radial. Smaller rose so all 8 nodes + labels fit without
           scrolling; overflow visible so nothing clips at the band edges. */
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
        /* Real, visible keyboard focus ring (white on the chart stage) + glow. */
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
        /* Hover/focus glow — colored ring + soft bloom in the lane's own color. */
        .cr-node:hover .cr-chip, .cr-node:focus-visible .cr-chip {
          box-shadow: 0 0 0 4px var(--ring), 0 0 22px var(--ring), 0 6px 16px rgba(0,0,0,0.5);
        }
        .cr-label { color: ${theme.ink}; font-size: 13px; font-weight: 600; text-align: center; line-height: 1.3; }

        /* Phone: radial doesn't fit — collapse to emblem-on-top + stacked list. */
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

      {/* ── The chart stage (full width) — plotted routes radiate from the hub ── */}
      <section
        aria-label="Explore the eight Furlong lanes"
        style={{ background: theme.stage, color: theme.ink, padding: "clamp(36px, 6vw, 64px) 24px" }}
      >
        <div style={{ maxWidth: 720, margin: "0 auto 28px", textAlign: "center", display: "grid", gap: 12 }}>
          <h1 style={{ margin: 0, fontSize: "clamp(28px, 4.5vw, 42px)", fontWeight: 800, letterSpacing: "-0.02em", color: theme.ink }}>
            Explore your opportunities
          </h1>
          <p style={{ margin: 0, fontSize: 17, lineHeight: 1.6, color: theme.inkSoft }}>
            Discover what's possible before you commit. No account, no personal data, and no footprints
            required. Change direction at any time.
          </p>
        </div>

        <div className="cr-rose">
          {/* Decorative spokes — dashed plotted routes from the emblem toward each
              lane, in the chart's gold accent (the waypoint-route language). */}
          <svg className="cr-spokes" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
            {LANES.map((l) => (
              <line key={l.slug} x1={50} y1={50} x2={l.left} y2={l.top} stroke={theme.accent} strokeWidth={0.5} strokeDasharray="1.8 1.8" opacity={0.55} />
            ))}
          </svg>

          {/* Center hub — the Furlong emblem (circular frame). */}
          <div className="cr-hub">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/furlong-emblem.png" alt="Furlong emblem — a guide through uncertain waters" />
          </div>

          {/* Eight lane spokes (real links). */}
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

      {/* ── Light page below the band — tightened shared disclosures strip ────── */}
      <div style={{ maxWidth: 880, margin: "0 auto", padding: "20px 24px 48px" }}>
        <Disclosures variant="full" />
      </div>
    </main>
  );
}
