/**
 * chartThemes — the Chart Table design family (founder direction 2026-07-16:
 * "create this exact thing for all the other groups").
 *
 * One chart language — fixed instrument panel + plotted waypoint route —
 * themed per audience lens:
 *   buyer         · navigator teal/gold  (the original Place Brief chart)
 *   environmental · surveyor green       (engineering / site-screen lens)
 *   finance       · ledger gold/slate    (Stuart's module — bankers' lens)
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

export const CHART_THEMES: Record<ChartVariant, ChartTheme> = {
  buyer: {
    stage: "linear-gradient(180deg, #0c2233, #0a1b29 60%, #081521)",
    plate: "linear-gradient(160deg, #12354a, #0d283a)",
    plateBorder: "#2c5876",
    waypointBg: "rgba(16, 45, 64, 0.74)",
    waypointBorder: "#29536f",
    accent: "#d4b06a",
    warn: "#cf8a4a",
    honey: "#e8c088",
    cellBg: "rgba(9, 28, 41, 0.8)",
    cellBorder: "#234a63",
    ink: "#eaf3f7",
    inkSoft: "#b7ccd9",
    inkFaint: "#5b7f95",
  },
  environmental: {
    stage: "linear-gradient(180deg, #12271c, #0e2017 60%, #0a1811)",
    plate: "linear-gradient(160deg, #1b3d2b, #143021)",
    plateBorder: "#356b4c",
    waypointBg: "rgba(20, 50, 34, 0.74)",
    waypointBorder: "#2e5c42",
    accent: "#a8c66c",
    warn: "#cf9a4a",
    honey: "#d8cf9a",
    cellBg: "rgba(10, 30, 19, 0.8)",
    cellBorder: "#27503a",
    ink: "#ecf5ec",
    inkSoft: "#b9cfbd",
    inkFaint: "#6b8f74",
  },
  finance: {
    stage: "linear-gradient(180deg, #1d2026, #17191f 60%, #121318)",
    plate: "linear-gradient(160deg, #2a2d35, #202329)",
    plateBorder: "#4a4536",
    waypointBg: "rgba(38, 40, 47, 0.78)",
    waypointBorder: "#44403a",
    accent: "#d4b06a",
    warn: "#c96f52",
    honey: "#e3cf9e",
    cellBg: "rgba(24, 25, 30, 0.85)",
    cellBorder: "#3c3a33",
    ink: "#f0eee8",
    inkSoft: "#c4bfb2",
    inkFaint: "#84806f",
  },
  commercial: {
    stage: "linear-gradient(180deg, #23191b, #1d1416 60%, #170f11)",
    plate: "linear-gradient(160deg, #3a2a26, #2c1f1c)",
    plateBorder: "#6b4a3a",
    waypointBg: "rgba(50, 34, 30, 0.74)",
    waypointBorder: "#5a3f34",
    accent: "#d69a6b",
    warn: "#cf8a4a",
    honey: "#edc9a3",
    cellBg: "rgba(30, 20, 18, 0.8)",
    cellBorder: "#4c352c",
    ink: "#f5ede8",
    inkSoft: "#d0bcb0",
    inkFaint: "#93796a",
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
    showLiving: false,
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
    showLiving: false,
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
    showLiving: false,
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
