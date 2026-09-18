/**
 * chartThemes — the Chart Table design family (founder direction 2026-07-16:
 * "create this exact thing for all the other groups").
 *
 * One chart language — fixed instrument panel + plotted waypoint route —
 * themed per audience lens:
 *   buyer         · navigator teal/gold  (the original Place Brief chart)
 *   environmental · surveyor green       (engineering / site-screen lens)
 *   finance       · ledger gold/slate    (capital module — bankers' lens)
 *   commercial    · harbor copper        (commercial property buyers)
 *
 * GOVERNANCE (binding):
 * - Every lens reads the SAME PropertyBriefIntelligence — facts with
 *   provenance, honest unknowns. A lens reorders and reframes; it never
 *   invents data.
 * - The finance lens is FACTS + OPEN ITEMS ONLY: no products, no rates, no
 *   terms, no eligibility. FINANCING_NODE_LIVE stays false (counsel gate,
 *   see financing-node spec) — this lens does not activate it.
 * - Lens-specific "uncharted" items are pointers to OFFICIAL sources only.
 * - Copy scanned by verify:brief-copy (this file is in SCANNED_FILES).
 */

export type ChartVariant = "buyer" | "environmental" | "finance" | "commercial";

export interface ChartTheme {
  /** Page stage behind the chart. */
  stage: string;
  /** Instrument plates + waypoint cards. */
  plate: string;
  plateBorder: string;
  waypointBg: string;
  waypointBorder: string;
  /** The accent (kickers, waypoint numerals, primary flags). */
  accent: string;
  /** Warning flag color (small pennants only). */
  warn: string;
  /** Soft caution ink for text (pause lines, unknown pointers) — the approved
      mock used light honey, never burnt orange, for reading-size text. */
  honey: string;
  /** Fact cell background/border. */
  cellBg: string;
  cellBorder: string;
  /** Text colors. */
  ink: string;
  inkSoft: string;
  inkFaint: string;
}

export interface ChartLensCopy {
  /** Panel kicker, e.g. "The fix on this property". */
  panelKicker: string;
  /** The plain-language headline for this lens (always labeled as a read). */
  headline: string;
  /** Waypoint titles. */
  waypointFacts: string;
  waypointLiving: string;
  waypointUncharted: string;
  waypointNext: string;
  /** Which fact labels lead waypoint I, in order (others follow). */
  factPriority: string[];
  /** Whether the living-here waypoint renders for this lens. */
  showLiving: boolean;
  /** Extra lens-specific open items (official pointers only). */
  extraUnknowns: { label: string; pointer: string; url?: string; howToFind: string }[];
  /** Tier ladder order: which deeper-waters line leads. */
  tierLead: "coordination" | "environmental";
}

// Clean FURLONG palette (founder direction 2026-07-17: no brown/tan anywhere).
// Navy and slate grounds, a crisp gold accent, and a clean amber for caution
// text — never the muddy honey/brown of the old themes.
export const CHART_THEMES: Record<ChartVariant, ChartTheme> = {
  buyer: {
    stage: "linear-gradient(180deg, #0c2233, #0a1b29 60%, #081521)",
    plate: "linear-gradient(160deg, #12354a, #0d283a)",
    plateBorder: "#2c5876",
    waypointBg: "rgba(16, 45, 64, 0.74)",
    waypointBorder: "#29536f",
    accent: "#e7c25c",
    warn: "#e6a552",
    honey: "#f0cf83",
    cellBg: "rgba(9, 28, 41, 0.8)",
    cellBorder: "#234a63",
    ink: "#eaf3f7",
    inkSoft: "#b7ccd9",
    inkFaint: "#5b7f95",
  },
  environmental: {
    stage: "linear-gradient(180deg, #0e2620, #0a1e18 60%, #07160f)",
    plate: "linear-gradient(160deg, #163d30, #103023)",
    plateBorder: "#2f6b52",
    waypointBg: "rgba(18, 50, 38, 0.74)",
    waypointBorder: "#2c5c46",
    accent: "#8fd0a2",
    warn: "#e6b45c",
    honey: "#bfe2c4",
    cellBg: "rgba(9, 30, 22, 0.8)",
    cellBorder: "#255040",
    ink: "#ecf5ef",
    inkSoft: "#b3d0bd",
    inkFaint: "#6a9081",
  },
  finance: {
    stage: "linear-gradient(180deg, #101a26, #0c1420 60%, #090f18)",
    plate: "linear-gradient(160deg, #182838, #12202e)",
    plateBorder: "#33465c",
    waypointBg: "rgba(20, 34, 48, 0.78)",
    waypointBorder: "#32465c",
    accent: "#e7c25c",
    warn: "#e6a552",
    honey: "#a9c6df",
    cellBg: "rgba(12, 20, 30, 0.85)",
    cellBorder: "#2b3d52",
    ink: "#eef2f7",
    inkSoft: "#b9c6d5",
    inkFaint: "#72859a",
  },
  commercial: {
    stage: "linear-gradient(180deg, #0f2430, #0b1c27 60%, #08151d)",
    plate: "linear-gradient(160deg, #143842, #0f2b33)",
    plateBorder: "#2f5c6b",
    waypointBg: "rgba(16, 46, 54, 0.74)",
    waypointBorder: "#2c5966",
    accent: "#6fc0d6",
    warn: "#e6a552",
    honey: "#a6dcea",
    cellBg: "rgba(9, 28, 34, 0.82)",
    cellBorder: "#245061",
    ink: "#eaf5f7",
    inkSoft: "#b3cdd6",
    inkFaint: "#688f9c",
  },
};

export const CHART_LENS_COPY: Record<ChartVariant, ChartLensCopy> = {
  buyer: {
    panelKicker: "The fix on this property",
    headline: "", // buyer headline comes from buildAnswerCard (source-aware)
    waypointFacts: "The place, verified",
    waypointLiving: "Living here, in distances",
    waypointUncharted: "Uncharted — what nobody can tell you yet",
    waypointNext: "Your next move",
    factPriority: ["Flood zone", "County", "Owner-occupancy", "Rental context"],
    showLiving: true,
    extraUnknowns: [],
    tierLead: "coordination",
  },
  environmental: {
    panelKicker: "Site screen — first pass",
    headline:
      "An environmental first look: what the public record already shows about this site, and which screens only fieldwork can answer.",
    waypointFacts: "On the public record",
    waypointLiving: "Site surroundings, in distances",
    waypointUncharted: "Unscreened — fieldwork and records checks",
    waypointNext: "Scoping the screen",
    factPriority: ["Flood zone", "Historic status", "County", "Grocery access"],
    showLiving: true,
    extraUnknowns: [
      {
        label: "Prior site uses",
        pointer: "Phase I ESA records search",
        howToFind:
          "Historical use is established through a Phase I Environmental Site Assessment records review — aerial photos, city directories, and fire-insurance maps — performed by an environmental professional.",
      },
      {
        label: "Nearby regulated facilities",
        pointer: "EPA Envirofacts / FRS",
        url: "https://www.epa.gov/frs",
        howToFind:
          "EPA's Envirofacts and Facility Registry Service list permitted and regulated facilities near any address — free, official, searchable by location.",
      },
      {
        label: "Wetlands on or near the parcel",
        pointer: "USFWS National Wetlands Inventory",
        url: "https://www.fws.gov/program/national-wetlands-inventory/wetlands-mapper",
        howToFind:
          "The National Wetlands Inventory mapper shows mapped wetlands; a jurisdictional determination from the Corps of Engineers is the official answer for a specific parcel.",
      },
      {
        label: "Storage tanks on record",
        pointer: "State UST/LUST registry",
        howToFind:
          "State environmental agencies publish underground storage tank and leaking-tank registries — search the address and the surrounding block.",
      },
    ],
    tierLead: "environmental",
  },
  finance: {
    panelKicker: "The collateral's place — verified",
    headline:
      "A lender's first pass: what is verified about the place this file sits in, and what the file still needs before anyone can underwrite it. Facts and open items only — no terms, no rates, no eligibility here.",
    waypointFacts: "Verified place facts on the file",
    waypointLiving: "Area context, in distances",
    waypointUncharted: "The file still needs",
    waypointNext: "Where this file goes next",
    factPriority: ["Rental context", "Owner-occupancy", "Flood zone", "County"],
    showLiving: true,
    extraUnknowns: [
      {
        label: "Appraised value",
        pointer: "Licensed appraisal",
        howToFind:
          "Only a licensed appraisal establishes value for lending purposes; nothing in this brief is a valuation.",
      },
      {
        label: "Title and liens",
        pointer: "Title search / county records",
        howToFind:
          "A title company search against county records establishes ownership, liens, and encumbrances definitively.",
      },
      {
        label: "Insurance quote",
        pointer: "Licensed insurance agent",
        howToFind:
          "Flood-zone status above is the map fact; the actual insurability and premium come from a licensed agent's quote.",
      },
    ],
    tierLead: "coordination",
  },
  commercial: {
    panelKicker: "The fix on this asset",
    headline: "", // commercial headline also comes from buildAnswerCard (GSA/USDA aware)
    waypointFacts: "The place, verified",
    waypointLiving: "Around the asset, in distances",
    waypointUncharted: "Uncharted — what nobody can tell you yet",
    waypointNext: "Your next move",
    factPriority: ["County", "Flood zone", "Opportunity Zone", "HUBZone", "New Markets Tax Credit area"],
    showLiving: true,
    extraUnknowns: [
      {
        label: "Zoning and permitted use",
        pointer: "County/city planning office",
        howToFind:
          "The local planning or zoning office states what uses the parcel's zoning permits — the listing never decides this.",
      },
    ],
    tierLead: "coordination",
  },
};

/**
 * Chart tone tokens — semantic slots for customer form/card surfaces that
 * embed INSIDE a stage (address-first discovery, intake panels, lane cards).
 *
 * "light" is the front-door treatment — /discover stays light (founder
 * direction). "dark" sits the same cells on the navigator stage and derives
 * every value from CHART_THEMES.buyer so no surface re-invents hexes.
 */
export type ChartTone = "light" | "dark";

export interface ChartToneTokens {
  /** Card shell around a form or standalone section. */
  sectionBg: string;
  sectionBorder: string;
  /** Headings / strong labels. */
  headingInk: string;
  labelInk: string;
  /** Reading text, quiet helper text, faintest metadata. */
  bodyInk: string;
  quietInk: string;
  faintInk: string;
  /** Kicker/eyebrow honey ink (brand caution family). */
  eyebrow: string;
  /** Verified/confidence ink (teal family). */
  accent: string;
  warnInk: string;
  errorInk: string;
  /** Inner panels (inputs group, result block). */
  cardBg: string;
  cardBorder: string;
  /** Fact cells. */
  cellBg: string;
  cellBorder: string;
  /** Verified-status badge chip. */
  badgeBg: string;
  badgeBorder: string;
  badgeInk: string;
  /** Verified-program highlight card. */
  programBg: string;
  programBorder: string;
  /** Text inputs. */
  inputBg: string;
  inputBorder: string;
  inputInk: string;
}

const navigator = CHART_THEMES.buyer;

export const CHART_TONES: Record<ChartTone, ChartToneTokens> = {
  light: {
    sectionBg: "#ffffff",
    sectionBorder: "#d7deea",
    headingInk: "#101a2b",
    labelInk: "#1f2a3d",
    bodyInk: "#5d687a",
    quietInk: "#7a8aa0",
    faintInk: "#9aa6b6",
    eyebrow: "#0f766e",
    accent: "#0f766e",
    warnInk: "#b45309",
    errorInk: "#b42318",
    cardBg: "#ffffff",
    cardBorder: "#e6ebf2",
    cellBg: "#ffffff",
    cellBorder: "#dbe4ee",
    badgeBg: "#ecfdf3",
    badgeBorder: "#a6f4c5",
    badgeInk: "#0f766e",
    programBg: "#f4fbf8",
    programBorder: "#b9e3d4",
    inputBg: "#ffffff",
    inputBorder: "#cbd5e1",
    inputInk: "#101a2b",
  },
  dark: {
    sectionBg: "transparent",
    sectionBorder: navigator.plateBorder,
    headingInk: navigator.ink,
    labelInk: navigator.ink,
    bodyInk: navigator.inkSoft,
    quietInk: "#7ea4bb",
    faintInk: "#7ea4bb",
    eyebrow: navigator.accent,
    accent: "#7fc4b8",
    warnInk: navigator.honey,
    errorInk: "#f19c8e",
    cardBg: navigator.waypointBg,
    cardBorder: navigator.waypointBorder,
    cellBg: navigator.cellBg,
    cellBorder: navigator.cellBorder,
    badgeBg: "rgba(15, 118, 110, 0.18)",
    badgeBorder: "#2f6f62",
    badgeInk: "#7fc4b8",
    programBg: "rgba(15, 110, 86, 0.14)",
    programBorder: "#2f6f62",
    inputBg: navigator.cellBg,
    inputBorder: navigator.plateBorder,
    inputInk: navigator.ink,
  },
};

/**
 * chartSurface — shared page-surface styles for a chart variant (Chart Table
 * cohesion rollout). Module pages (compass, financing-pathways, readiness,
 * intake, portal surfaces) consume these instead of re-declaring panel/input/
 * badge hexes. All values derive from CHART_THEMES; the signal hues match
 * ChartTableBrief's signal-flag family (green=clear, amber=review, red=blocked).
 */
export function chartSurface(variant: ChartVariant) {
  const t = CHART_THEMES[variant];
  return {
    theme: t,
    /** The stage the whole page sits on (rounded dark panel on the light shell). */
    container: {
      maxWidth: 1180,
      margin: "0 auto",
      padding: "28px 24px 48px",
      display: "grid",
      gap: 18,
      background: t.stage,
      borderRadius: 20,
      color: t.ink,
    },
    /** Instrument plate — primary sections. */
    panel: {
      background: t.plate,
      border: `1px solid ${t.plateBorder}`,
      borderRadius: 12,
    },
    /** Fact cell — inner cards, chips, source rows. */
    cell: {
      background: t.cellBg,
      border: `1px solid ${t.cellBorder}`,
      borderRadius: 10,
    },
    kicker: {
      fontSize: 11,
      fontWeight: 800,
      letterSpacing: "0.18em",
      textTransform: "uppercase",
      color: t.accent,
    },
    muted: { color: t.inkSoft, lineHeight: 1.6 },
    label: { color: t.inkSoft, fontSize: 13, fontWeight: 800 },
    input: {
      width: "100%",
      minHeight: 42,
      border: `1px solid ${t.plateBorder}`,
      borderRadius: 8,
      padding: "8px 10px",
      fontSize: 14,
      color: t.ink,
      background: t.cellBg,
    },
    link: { color: t.accent, fontWeight: 800, textDecoration: "none" },
    /** Brand CTA (same honey button family as the discovery form). */
    primaryButton: {
      minHeight: 42,
      border: 0,
      borderRadius: 999,
      padding: "0 18px",
      background: "#0f766e",
      color: "#ffffff",
      fontWeight: 800,
    },
    primaryButtonBusyBg: "#9a6730",
    errorPanel: {
      border: "1px solid rgba(207, 138, 74, 0.55)",
      background: "rgba(201, 111, 82, 0.14)",
      color: "#f19c8e",
      borderRadius: 10,
      padding: 12,
      fontWeight: 700,
    },
    /** Progress meter — track + the signal-flag hues. */
    meterTrack: "rgba(255, 255, 255, 0.12)",
    meterGood: "#6fbf8f",
    meterWarn: "#e2b34c",
    /** Status badge tones (signal-flag family, legible on every stage). */
    badges: {
      ready: { background: "rgba(111, 191, 143, 0.16)", color: "#6fbf8f" },
      review: { background: "rgba(226, 179, 76, 0.16)", color: "#e2b34c" },
      blocked: { background: "rgba(207, 138, 74, 0.18)", color: "#f19c8e" },
      neutral: { background: "rgba(255, 255, 255, 0.08)", color: t.inkSoft },
    },
  } as const;
}

/** Order facts for a lens: priority labels first (in order), the rest after. */
export function orderFactsForLens<T extends { label: string }>(
  facts: T[],
  variant: ChartVariant
): T[] {
  const priority = CHART_LENS_COPY[variant].factPriority;
  const ranked = (label: string) => {
    const i = priority.indexOf(label);
    return i === -1 ? priority.length : i;
  };
  return [...facts].sort((a, b) => ranked(a.label) - ranked(b.label));
}
