/**
 * propertyProfile — the CANONICAL property-type taxonomy (founder-approved
 * philosophy, 2026-07-17):
 *
 *   Axis 1 — what the asset IS (this module)
 *   Axis 2 — how it is being SOLD (mechanicsForSource)
 *   Axis 3 — who is READING (chart lenses; paid-tier personalization)
 *
 *   "If it's a fact about the place, it's tier-free and property-typed;
 *    if it's about the person's file, it's paid and person-typed."
 *
 * The free tier is driven entirely by axes 1+2 — verified facts don't depend
 * on who's asking. Axis 3 reorders and reframes at the free tier (lenses) and
 * becomes real personalization only in paid tiers.
 *
 * Each profile carries the QUESTIONS that property type demands — a mobile
 * home park asks about lot rent rolls and master metering; a hotel asks about
 * lodging zoning and life safety; a farm asks about water rights and FSA
 * history. Profiles with no governed listing source yet (hospitality,
 * mobile-home-park) still activate through user-imported properties.
 *
 * Deterministic and versioned: same inputs → same profile (replay-safe).
 * New profile logic belongs HERE — not in scattered regexes.
 */

export const PROPERTY_PROFILE_VERSION = "property-profile-v1.0.0";

export type PropertyProfileId =
  | "residential"
  | "farm"
  | "commercial"
  | "hospitality"
  | "mobile-home-park"
  | "land";

export interface PropertyProfile {
  id: PropertyProfileId;
  /** As a buyer would say it, e.g. "Working farm or ranch". */
  label: string;
}

/** Structurally identical to BriefUnknownLine (kept local to avoid a cycle). */
export interface ProfileQuestionLine {
  label: string;
  pointer: string;
  url?: string;
  howToFind: string;
}

/** Structurally identical to DiligenceCostLine. */
export interface ProfileCostLine {
  label: string;
  range: string;
  note: string | null;
}

const PROFILE_LABELS: Record<PropertyProfileId, string> = {
  residential: "Home to live in",
  farm: "Working farm or ranch",
  commercial: "Commercial property",
  hospitality: "Lodging or hospitality property",
  "mobile-home-park": "Mobile home park",
  land: "Bare land",
};

/**
 * Classify a property into its canonical profile from the type text the
 * source (or the importer) provides. Order matters: the more specific
 * profiles match first so "mobile home park" never falls through to
 * "residential" on the word "home".
 */
export function classifyPropertyProfile(args: {
  propertyType: string | null;
  description?: string | null;
  acreageText?: string | null;
}): PropertyProfile {
  // Puerto Rico's property registry calls each recorded parcel a "farm"
  // (finca): descriptions read "Recorded at farm 7015, book 2…" on ordinary
  // subdivision houses. Strip that registry citation before matching so the
  // word "farm" in a folio reference never classifies a house as agricultural
  // (founder-caught 2026-07-17).
  let cleanedDesc = (args.description ?? "")
    // Broker contact boilerplate: "Office 787-…", "Broker:", "Address:" lines
    // carry words ("office", "business") that falsely read as commercial use.
    .replace(/\b(?:office|broker|phone|fax|cell|tel)\s*[:#]?\s*[\d(]/gi, " ")
    .replace(/\bproperties\s+inc\b/gi, " ");
  // Puerto Rico's property registry calls each recorded parcel a "farm"
  // (finca): descriptions read "REC AT FARM 7015", "Recorded farm-12,577",
  // "Book 240 Farm Number 3" on ordinary subdivision houses. "farm" directly
  // followed by a folio number (any punctuation, optional "number"/"no"/"#")
  // is ALWAYS a registry reference — a genuine farm listing writes "farm
  // land"/"farm with…", never "farm 7015". Strip it so the word never
  // classifies a house as agricultural (founder-caught 2026-07-17). Real
  // farms carry pasture/crop/ranch language and still classify correctly.
  cleanedDesc = cleanedDesc.replace(
    /\bfarm[\s.-]*(?:number|núm\.?|num\.?|no\.?|n[°º]?\.?|inf\.?|#)?[\s.-]*[\d,]+/gi,
    " "
  );
  const text = `${args.propertyType ?? ""} ${cleanedDesc}`.toLowerCase();

  const id: PropertyProfileId =
    /mobile home park|manufactured housing (community|park)|mhp|trailer park|rv park/.test(text)
      ? "mobile-home-park"
      : /hotel|motel|inn\b|lodge|lodging|bed and breakfast|b&b|resort|hospitality|short[- ]term rental/.test(text)
        ? "hospitality"
        : /commercial|retail|industrial|warehouse|restaurant|mixed[- ]use|office (?:building|space|unit|suite)|(?:self[- ]|storage )storage|business (?:park|center)/.test(text)
          ? "commercial"
          : /\bfarm\b|ranch|agric|crop|pasture|orchard|vineyard|homestead|dairy/.test(text)
            ? "farm"
            : /\bland\b|\blot\b|vacant|acreage|parcel only|unimproved/.test(text)
              ? "land"
              : "residential";

  return { id, label: PROFILE_LABELS[id] };
}

/** Profiles whose purchase is home-mortgage-shaped (ownership-cost lanes apply). */
export function profileUsesResidentialLanes(id: PropertyProfileId): boolean {
  return id === "residential" || id === "farm";
}

/**
 * The questions THIS property type demands — appended to the chart's
 * "Uncharted" waypoint and the report's honest unknowns. Every line follows
 * the unknowns doctrine: name the question, point at the official place that
 * answers it, explain how. Never a judgment, never a prediction.
 */
export function profileQuestionLines(id: PropertyProfileId): ProfileQuestionLine[] {
  switch (id) {
    case "mobile-home-park":
      return [
        {
          label: "Lot rent roll and occupancy",
          pointer: "Seller's rent roll + tenant estoppels",
          howToFind:
            "The park's income is its lot rents: ask for the current rent roll (every lot, rent, " +
            "vacancy, delinquency) and confirm it with tenant estoppel letters during diligence — " +
            "what tenants actually pay decides what the park actually earns.",
        },
        {
          label: "Park-owned vs. tenant-owned homes",
          pointer: "Seller's home inventory + titles",
          howToFind:
            "Tenant-owned homes mean lot rent only; park-owned homes add home rent but also titles, " +
            "maintenance, and turnover costs. Ask for the inventory list and the title status of " +
            "every park-owned home — manufactured homes carry vehicle-style titles unless converted.",
        },
        {
          label: "Utilities and metering",
          pointer: "Utility bills + system maps",
          howToFind:
            "Master-metered parks pay the utilities and rebill tenants; direct-billed parks don't. " +
            "Ask which, and whether the park runs its own well, septic, or lagoon systems — private " +
            "systems serving a park are often regulated as small public water systems with their own " +
            "testing obligations, and their condition is a five-figure question.",
        },
        {
          label: "Zoning status and local park rules",
          pointer: "City/county planning office",
          howToFind:
            "Many parks are legal non-conforming uses — grandfathered, but with limits on expanding " +
            "or rebuilding after damage. Some states and cities also have lot-rent stabilization or " +
            "park-closure/relocation ordinances. The planning office answers both in one visit.",
        },
        {
          label: "Park license and violations",
          pointer: "State mobile-home-park license registry",
          howToFind:
            "Most states license parks annually and publish inspection or violation records — " +
            "verify the license is current and ask the licensing agency for the park's file.",
        },
      ];
    case "hospitality":
      return [
        {
          label: "Lodging zoning and permits",
          pointer: "City/county zoning + short-term-rental ordinance",
          howToFind:
            "Confirm lodging is a permitted use at this parcel — and if the plan involves " +
            "short-term rentals, read the current STR ordinance; these rules change fast and " +
            "grandfathering is rare.",
        },
        {
          label: "Operating history",
          pointer: "Seller P&L + local tourism data",
          howToFind:
            "Ask for 2–3 years of occupancy, rate, and revenue history. The local tourism bureau " +
            "or lodging association publishes seasonality context to sanity-check it against.",
        },
        {
          label: "Life-safety compliance",
          pointer: "Fire marshal inspection record",
          howToFind:
            "Lodging buildings carry commercial life-safety code (alarms, sprinklers, egress). Ask " +
            "the fire marshal's office for the building's inspection history — retrofit costs on " +
            "older buildings can be the biggest number in the deal.",
        },
        {
          label: "Licenses and lodging taxes",
          pointer: "State lodging license + tax accounts",
          howToFind:
            "Lodging licenses and occupancy-tax registrations usually do not transfer automatically " +
            "— the state revenue office and licensing agency list what a new owner must reissue.",
        },
      ];
    case "commercial":
      return [
        {
          label: "Zoning and permitted use",
          pointer: "City/county planning office",
          howToFind:
            "What the building may be USED for is a parcel-level fact: the planning office states " +
            "which uses are permitted as of right and which need a special-use permit — before any " +
            "business plan is worth drawing.",
        },
        {
          label: "Environmental history",
          pointer: "Phase I Environmental Site Assessment",
          howToFind:
            "Prior uses (fuel, dry cleaning, auto repair, industrial) can leave contamination that " +
            "becomes the buyer's problem. Lenders on commercial property typically require a Phase I " +
            "ESA; the state environmental agency's spill database is a free first look.",
        },
        {
          label: "Accessibility and code posture",
          pointer: "Access/code walk-through",
          howToFind:
            "Public-facing buildings carry accessibility obligations (ADA); older buildings often " +
            "need entrance, restroom, or parking upgrades. A code-focused walk-through with a local " +
            "architect or inspector prices this before it surprises you.",
        },
      ];
    case "farm":
      return [
        {
          label: "Water rights and irrigation",
          pointer: "State water office + county extension",
          howToFind:
            "Whether water rights convey with the land — and what the well or irrigation permits " +
            "allow — is a state-registry fact. The state water office holds the records; the county " +
            "extension agent knows how the local system actually works.",
        },
        {
          label: "Soils and productivity",
          pointer: "USDA Web Soil Survey",
          url: "https://websoilsurvey.nrcs.usda.gov/",
          howToFind:
            "USDA's Web Soil Survey maps soil types and productivity ratings for any parcel — free " +
            "and official, and the county's yield history is at the FSA office.",
        },
        {
          label: "FSA program history",
          pointer: "County FSA office",
          howToFind:
            "Base acres, program payment history, and any CRP contracts that bind the ground travel " +
            "with the land — the county Farm Service Agency office pulls the parcel's file for a " +
            "buyer at no cost.",
        },
      ];
    case "land":
      return [
        {
          label: "Legal access and easements",
          pointer: "Title search + county road department",
          howToFind:
            "Confirm the parcel has recorded legal access (not just a path someone uses) and learn " +
            "what easements cross it — the title search surfaces both definitively.",
        },
        {
          label: "Buildability and septic feasibility",
          pointer: "County health department perc test",
          howToFind:
            "If there's no sewer, a percolation test decides whether a septic system — and " +
            "therefore a dwelling — is feasible. The county health department administers it.",
        },
        {
          label: "Utilities at the road",
          pointer: "Serving utilities",
          howToFind:
            "Distance to power, water, and broadband decides the real cost of building. Each " +
            "serving utility quotes line-extension costs on request — get them in writing.",
        },
      ];
    case "residential":
    default:
      return []; // the base unknowns set already covers the home questions
  }
}

/** Profile-specific diligence-cost guidance (national ranges, never quotes). */
export function profileCostLines(id: PropertyProfileId): ProfileCostLine[] {
  switch (id) {
    case "commercial":
    case "hospitality":
      return [
        {
          label: "Phase I Environmental Site Assessment",
          range: "$2,000–$4,500",
          note: "typically lender-required on commercial property; Phase II (if triggered) costs more",
        },
      ];
    case "mobile-home-park":
      return [
        {
          label: "Park utility-systems inspection (well/septic/lagoon)",
          range: "$500–$1,500",
          note: "private systems serving a park are the costliest surprise — inspect before pricing",
        },
        {
          label: "Phase I Environmental Site Assessment",
          range: "$2,000–$4,500",
          note: "typically lender-required on income property",
        },
      ];
    case "land":
      return [
        {
          label: "Percolation test",
          range: "$150–$1,500",
          note: "county fee schedules vary widely; decides septic feasibility",
        },
        {
          label: "Boundary survey",
          range: "$500–$2,500",
          note: "acreage and terrain drive cost; lenders often require one",
        },
      ];
    default:
      return [];
  }
}
