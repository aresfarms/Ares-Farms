/**
 * Possibility Discovery Engine — the deterministic routing layer (ISOMORPHIC).
 *
 * Caitlin's vision (2026-06-11): "Before we recommend a property, program,
 * financing option, grant, conservation pathway, business opportunity, or
 * strategic plan, understand what you're trying to accomplish. We're not here to
 * sell you something — we help you understand your possibilities."
 *
 * Flow: Person → Goals → Constraints → Possibilities → Pathways → Actions. The
 * property search is ONE possible destination, never assumed to be THE one.
 *
 * GOVERNANCE (the guardrails that keep this on-doctrine):
 *  1. INTERESTS, NOT QUALIFICATIONS — ANONYMOUS. This module is PURE and runs in
 *     the browser from answers held in component state + the verified feed the
 *     page already rendered. Nothing about the person is sent to a server, so
 *     there is no identity to store (mirrors GuidedIntake's "nothing is sent").
 *     No PII in core. Sensitive signals (savings / credit / retirement) only
 *     shape the person's OWN map; they are never transmitted, never sold.
 *  2. EDUCATION + ROUTING, NEVER DETERMINATION. Every output is a possibility to
 *     EXPLORE plus "confirm with a licensed advisor / the agency." It NEVER says
 *     a person qualifies / is eligible / is approved. (A PROPERTY place-fact
 *     stays verified + definitive elsewhere; a PERSON-side pathway is offered as
 *     a possibility and routed to a licensed human — different surfaces, both
 *     honest. This is the reconciliation with the no-"may fit" rule: discovery
 *     is education by design, not a dishonest property-card claim.)
 *  3. PERSON-ELIGIBILITY = THE LICENSED HUMAN'S CALL. Output #10 (Human Review)
 *     is the safety valve and is ALWAYS present and prominent. Furlong decides
 *     nothing.
 *  4. AI ROUTING LAYER = TIER-1 ADVISORY ONLY. This shipped layer is a
 *     DETERMINISTIC rule map (replay-safe, Vol III) — it generates possibilities
 *     and education, never credit / eligibility / approval calls.
 *  5. VERIFIED-ONLY for property/program FACTS — property counts come straight
 *     from the verified guided-intake feed; no "may fit" about a property.
 *
 * Master Volume traceability: Vol I CONST-DATA-001 (PII-free), Vol II person-
 * eligibility is a licensed act, Vol III replay-safe determinism / TECH-LEDGER,
 * Vol V canonical "ask, never assume."
 */

import type { GuidedIntakeFeed } from "@/lib/property/guidedIntakeFeed";

// ── Answer model (Caitlin's steps 1–7 + optional discovery) ──────────────────
export type PersonaId =
  | "individual" | "family" | "farmer" | "rancher" | "landowner" | "business-owner"
  | "investor" | "nonprofit" | "municipality" | "tribal" | "developer" | "veteran"
  | "retiree" | "student" | "other";

export type GoalId =
  | "buy-land" | "start-expand-farm" | "retire" | "generate-income" | "preserve-family-land"
  | "buy-sell-business" | "improve-environment" | "develop" | "create-housing" | "reduce-debt"
  | "improve-cash-flow" | "access-programs" | "access-financing" | "build-wealth"
  | "passive-income" | "evaluate-opportunities" | "not-sure";

export type TimeHorizon = "immediate" | "near" | "mid" | "long" | "legacy";

export type ResourceId =
  | "land" | "business" | "farm" | "equipment" | "livestock" | "housing" | "savings"
  | "retirement-assets" | "credit-access" | "family-support" | "industry-experience"
  | "professional-licenses" | "none";

export type ConstraintId =
  | "limited-capital" | "credit" | "experience" | "time" | "physical" | "regulatory"
  | "environmental" | "market-uncertainty" | "labor" | "geographic" | "unsure-where-to-start";

export type ValueId =
  | "income" | "stability" | "family-legacy" | "environmental-stewardship" | "community-impact"
  | "growth" | "risk-reduction" | "retirement-security" | "lifestyle" | "independence";

export type PropertyInterest = "yes" | "no" | "maybe";

export interface PropertyPreferences {
  states?: string[];
  categories?: string[];
  alreadyOwn?: boolean;
  financingRequired?: boolean;
}

export interface DiscoveryAnswers {
  persona?: PersonaId;
  goals: GoalId[];
  timeHorizon?: TimeHorizon;
  resources: ResourceId[];
  constraints: ConstraintId[];
  /** Ranked: order is the person's priority order. */
  values: ValueId[];
  propertyInterest?: PropertyInterest;
  property?: PropertyPreferences;
}

// ── Output model — the 10 outputs of the Final AI Routing Layer ──────────────
/** A possibility framed for EXPLORATION, never a determination. */
export interface PossibilityItem {
  label: string;
  /** What it is + why it might be worth exploring — possibility language only. */
  description: string;
  /** WHO confirms whether it applies to you (the determination is theirs). */
  confirmWith: string;
}

export interface Pathway {
  id: string;
  title: string;
  /** Why this pathway surfaced from YOUR goals/resources/values (not a promise). */
  whyItFits: string;
  /** Concrete things to explore next — all reversible, all education. */
  exploreSteps: string[];
  /** Which domains feed this pathway. */
  domains: ("property" | "financing" | "programs" | "environmental" | "revenue" | "planning")[];
}

export interface RiskItem {
  constraint: ConstraintId;
  note: string;
  /** A direction to EXPLORE — not advice, not a fix. */
  mitigationToExplore: string;
}

/**
 * Verified property counts — HONEST + SCOPED (same integrity standard as the
 * place-fact badges). `total` is the TRUE count for the stated scope across ALL
 * states (never silently capped). `states` shows the top few for readability;
 * when more exist, `truncated` is true and the render labels it ("showing the
 * top N of M states") so the number can never read as a total it isn't.
 */
export interface VerifiedPropertyCounts {
  /** TRUE total current listings for the scope, summed across every state. */
  total: number;
  /** Number of states that have ≥1 current listing in the scope. */
  totalStates: number;
  /** What the count is OF, e.g. "farm & land" or "all property types". */
  scopeLabel: string;
  /** True when no category filter applies (count covers every property type). */
  scopeAllCategories: boolean;
  asOf: string;
  /** The states shown (top by scoped count) — a readable subset, not the whole. */
  states: { abbr: string; total: number; oz?: number; hubzone?: number }[];
  /** = states.length (how many states are displayed). */
  statesShown: number;
  /** True when more states exist than are shown (render must label this). */
  truncated: boolean;
}

export interface PropertyOpportunities {
  relevant: boolean;
  note: string;
  verified?: VerifiedPropertyCounts;
  exploreHref: string;
}

export interface HumanReview {
  recommended: true;
  message: string;
  /** The licensed humans / agencies who make the determinations. */
  routeTo: string[];
}

export interface PossibilityMap {
  /** #1 Possibility Map. */
  headline: string;
  summary: string;
  themes: string[];
  /** #2 Recommended Pathways. */
  pathways: Pathway[];
  /** #3 Risks & Constraints. */
  risks: RiskItem[];
  /** #4 Available Programs. */
  programs: PossibilityItem[];
  /** #5 Financing Options. */
  financing: PossibilityItem[];
  /** #6 Revenue Opportunities. */
  revenue: PossibilityItem[];
  /** #7 Environmental Opportunities. */
  environmental: PossibilityItem[];
  /** #8 Property Opportunities (only when property is relevant). */
  property: PropertyOpportunities;
  /** #9 Suggested Next Actions. */
  nextActions: string[];
  /** #10 Human Review Recommendations — the safety valve, always present. */
  humanReview: HumanReview;
}

// ── Static rule tables (curated, deterministic — the Tier-1 routing map) ─────
const CONFIRM_AGENCY = "the administering agency or a licensed advisor — they confirm what applies to you";
const CONFIRM_LENDER = "your lender or a licensed financing professional — eligibility is their determination";
const CONFIRM_LICENSED = "a licensed professional for your situation";

interface PathwayDef {
  id: string;
  title: string;
  goals: GoalId[];
  why: (a: DiscoveryAnswers) => string;
  exploreSteps: string[];
  domains: Pathway["domains"];
}

const PATHWAYS: PathwayDef[] = [
  {
    id: "acquire-and-coordinate",
    title: "Acquire property, then coordinate the work around it",
    goals: ["buy-land", "develop", "build-wealth", "evaluate-opportunities", "passive-income"],
    why: () => "You're interested in acquiring property — a possible starting point you can explore without commitment.",
    exploreSteps: [
      "Browse verified government and listed inventory to see what currently exists",
      "Note the verified place-facts on listings (Opportunity Zone, HUBZone, flood, historic) — facts about the place, not about you",
      "When something interests you, talk with a licensed professional about the financing and program coordination around it",
    ],
    domains: ["property", "financing", "programs"],
  },
  {
    id: "grow-on-land-you-have",
    title: "Build or expand a farm operation",
    goals: ["start-expand-farm", "generate-income", "improve-cash-flow"],
    why: (a) => a.resources.includes("land") || a.resources.includes("farm")
      ? "You already have land or a farm to build on — a possible base to grow from."
      : "Starting or expanding a farm is a direction you can explore from the ground up.",
    exploreSteps: [
      "Explore agricultural and conservation programs that commonly support farm operations",
      "Consider revenue avenues to read about: agritourism, leasing, equipment utilization, conservation",
      "Confirm what fits your operation with the agency or an ag-lending professional",
    ],
    domains: ["programs", "revenue", "environmental", "financing"],
  },
  {
    id: "preserve-legacy",
    title: "Preserve family land for the next generation",
    goals: ["preserve-family-land", "retire"],
    why: () => "Keeping land in the family is a legacy goal worth exploring carefully — there are conservation and planning pathways to read about.",
    exploreSteps: [
      "Read about conservation easements and stewardship programs as preservation possibilities",
      "Explore succession and estate planning topics with a licensed professional",
      "Consider income avenues that are compatible with keeping the land (leasing, conservation payments)",
    ],
    domains: ["environmental", "programs", "planning"],
  },
  {
    id: "income-without-buying",
    title: "Generate income from what you already have",
    goals: ["generate-income", "passive-income", "improve-cash-flow", "build-wealth"],
    why: () => "There are revenue possibilities to explore that don't require buying anything new.",
    exploreSteps: [
      "Read about revenue avenues: leasing, agritourism, renewables/solar siting, equipment utilization, conservation payments",
      "Explore programs that can support new income activities",
      "Confirm the economics and any licensing with a licensed professional",
    ],
    domains: ["revenue", "programs", "financing"],
  },
  {
    id: "business-transition",
    title: "Buy or sell a business",
    goals: ["buy-sell-business", "build-wealth", "retire"],
    why: () => "Business acquisition or sale is a pathway you can explore — Furlong helps with the coordination around the transaction.",
    exploreSteps: [
      "Read about acquisition financing options as possibilities",
      "Explore programs that support business transition and development",
      "Work the actual transaction with a licensed broker and advisor",
    ],
    domains: ["financing", "programs", "planning"],
  },
  {
    id: "environmental-first",
    title: "Improve environmental outcomes on land",
    goals: ["improve-environment", "preserve-family-land"],
    why: () => "Stewardship is a pathway in its own right — there are conservation programs and practices to explore.",
    exploreSteps: [
      "Read about conservation programs and stewardship practices as possibilities",
      "Explore whether environmental work can also create revenue (conservation payments, carbon, renewables)",
      "Confirm specifics with the agency or an environmental professional",
    ],
    domains: ["environmental", "revenue", "programs"],
  },
  {
    id: "housing-development",
    title: "Create housing or develop",
    goals: ["create-housing", "develop"],
    why: () => "Creating housing or developing is a direction you can explore, with programs and financing that commonly support it.",
    exploreSteps: [
      "Browse property and land that could support development",
      "Read about housing and development programs as possibilities",
      "Confirm feasibility, zoning, and financing with licensed professionals",
    ],
    domains: ["property", "programs", "financing", "planning"],
  },
  {
    id: "stabilize-finances",
    title: "Improve cash flow and reduce debt",
    goals: ["reduce-debt", "improve-cash-flow", "retire"],
    why: () => "Strengthening your financial footing is a sensible place to start — there are options and programs to read about.",
    exploreSteps: [
      "Read about financing and refinancing options as possibilities",
      "Explore programs that can ease costs or support cash flow",
      "Work the numbers with your lender or a licensed financial professional",
    ],
    domains: ["financing", "programs", "planning"],
  },
  {
    id: "orient-first",
    title: "Get oriented before deciding anything",
    goals: ["not-sure", "evaluate-opportunities", "access-programs", "access-financing"],
    why: () => "It's completely fine not to be sure yet — this map is a place to look around with no commitment.",
    exploreSteps: [
      "Skim the possibilities below to see what's out there",
      "Follow whichever threads interest you — nothing here is a commitment",
      "When something clicks, a licensed professional can help you go deeper",
    ],
    domains: ["planning", "property", "programs", "financing", "revenue", "environmental"],
  },
];

const CONSTRAINT_NOTES: Record<ConstraintId, { note: string; explore: string }> = {
  "limited-capital": { note: "Limited capital can shape which pathways are practical first.", explore: "programs and financing structures designed for limited up-front capital" },
  credit: { note: "Credit access varies and is assessed by lenders, not here.", explore: "what a lender looks at and programs that work with a range of credit profiles" },
  experience: { note: "Less direct experience is common and workable.", explore: "beginner-oriented programs, mentorship, and technical assistance" },
  time: { note: "Limited time affects pace, not possibility.", explore: "lower-effort revenue avenues like leasing" },
  physical: { note: "Physical constraints can steer toward less labor-intensive options.", explore: "passive or managed-operation pathways" },
  regulatory: { note: "Regulatory requirements differ by place and activity.", explore: "which permits and rules apply with the relevant agency" },
  environmental: { note: "Environmental conditions of a place are verifiable facts to check.", explore: "verified place-facts (flood, designations) and conservation programs" },
  "market-uncertainty": { note: "Markets move; diversification is one response to read about.", explore: "multiple revenue avenues rather than a single bet" },
  labor: { note: "Labor availability shapes which operations are realistic.", explore: "lower-labor or contracted approaches" },
  geographic: { note: "Geography narrows the field, which can simplify the search.", explore: "what exists in your states of interest" },
  "unsure-where-to-start": { note: "Not knowing where to start is the most common starting point.", explore: "the orientation pathway and a conversation with a licensed professional" },
};

// ── The generator ────────────────────────────────────────────────────────────
const has = <T,>(arr: T[], v: T) => arr.includes(v);

function selectPathways(a: DiscoveryAnswers): Pathway[] {
  const goals = a.goals.length ? a.goals : (["not-sure"] as GoalId[]);
  const scored = PATHWAYS.map((p) => {
    const overlap = p.goals.filter((g) => has(goals, g)).length;
    return { p, overlap };
  }).filter((x) => x.overlap > 0);
  // Always offer orientation when nothing matched or the person is unsure.
  if (scored.length === 0 || has(goals, "not-sure")) {
    const orient = PATHWAYS.find((p) => p.id === "orient-first")!;
    if (!scored.some((s) => s.p.id === "orient-first")) scored.push({ p: orient, overlap: 0.5 });
  }
  return scored
    .sort((x, y) => y.overlap - x.overlap)
    .slice(0, 5)
    .map(({ p }) => ({
      id: p.id,
      title: p.title,
      whyItFits: p.why(a),
      exploreSteps: p.exploreSteps,
      domains: p.domains,
    }));
}

function programItems(a: DiscoveryAnswers): PossibilityItem[] {
  const items: PossibilityItem[] = [];
  const push = (label: string, description: string) => items.push({ label, description, confirmWith: CONFIRM_AGENCY });
  if (a.goals.some((g) => ["start-expand-farm", "improve-environment", "preserve-family-land"].includes(g)))
    push("Agricultural & conservation programs", "Federal and state programs that commonly support farming and land stewardship — worth reading about to see what could apply.");
  if (a.goals.some((g) => ["create-housing", "develop"].includes(g)))
    push("Housing & development programs", "Programs that frequently support housing creation and development projects — a possibility to explore.");
  if (a.goals.some((g) => ["buy-sell-business", "generate-income", "improve-cash-flow"].includes(g)))
    push("Business-development programs", "Programs that support starting, growing, or transitioning a business — read about which may be relevant.");
  if (a.persona === "veteran") push("Veteran-oriented programs", "Some programs are oriented toward veterans — worth exploring whether any apply to your situation.");
  if (items.length === 0) push("Place-based & general programs", "Federal, state, and local programs span land, business, energy, and workforce — a broad set worth browsing.");
  return items;
}

function financingItems(a: DiscoveryAnswers): PossibilityItem[] {
  const items: PossibilityItem[] = [];
  const push = (label: string, description: string) => items.push({ label, description, confirmWith: CONFIRM_LENDER });
  if (a.property?.financingRequired || a.goals.includes("buy-land") || a.goals.includes("develop"))
    push("Acquisition & development financing", "Several financing structures commonly support buying or developing property — possibilities to explore with a lender.");
  if (a.goals.includes("reduce-debt") || a.goals.includes("improve-cash-flow"))
    push("Refinancing & cash-flow options", "Refinancing and restructuring can change monthly costs — options to read about, then run the numbers with a professional.");
  if (a.goals.includes("buy-sell-business"))
    push("Business-acquisition financing", "Acquisition lending is its own category — a possibility to explore with a licensed financing professional.");
  if (items.length === 0) push("General financing pathways", "Furlong helps coordinate financing around your goal; a licensed professional confirms what's available to you.");
  return items;
}

function revenueItems(a: DiscoveryAnswers): PossibilityItem[] {
  const items: PossibilityItem[] = [];
  const push = (label: string, description: string) => items.push({ label, description, confirmWith: CONFIRM_LICENSED });
  const wantsIncome = a.goals.some((g) => ["generate-income", "passive-income", "improve-cash-flow", "build-wealth"].includes(g));
  if (wantsIncome || a.resources.includes("land") || a.resources.includes("farm")) {
    push("Agricultural & agritourism revenue", "Working land can generate income in several ways — avenues to read about and price out.");
    push("Leasing & equipment utilization", "Leasing land or putting equipment to use are lower-effort income possibilities to explore.");
  }
  if (a.goals.includes("improve-environment") || a.resources.includes("land"))
    push("Conservation, carbon & renewables", "Stewardship can also create revenue (conservation payments, carbon, solar siting) — possibilities to investigate.");
  if (items.length === 0) push("Revenue avenues to explore", "Several income avenues exist depending on your resources — worth browsing before deciding.");
  return items;
}

function environmentalItems(a: DiscoveryAnswers): PossibilityItem[] {
  const items: PossibilityItem[] = [];
  const push = (label: string, description: string) => items.push({ label, description, confirmWith: CONFIRM_AGENCY });
  if (a.goals.includes("improve-environment") || a.goals.includes("preserve-family-land") || a.resources.includes("land"))
    push("Conservation & stewardship pathways", "Conservation programs and practices can protect land and sometimes pay — possibilities to explore.");
  if (a.property || a.propertyInterest !== "no")
    push("Verified environmental place-facts", "Where a specific property is involved, verified facts (flood history, designations) describe the place — checked, not guessed.");
  if (items.length === 0) push("Environmental considerations", "Even without land today, stewardship pathways are worth understanding as you plan.");
  return items;
}

/** How many states to DISPLAY (the true total always covers every state). */
const PROPERTY_STATES_SHOWN = 8;

/**
 * Derive the property CATEGORY scope from the person's stated interests, so a
 * farmer interested in land sees farm & land counts — not every property type.
 * Explicit category picks win; otherwise persona + goals imply the scope.
 */
function categoryScope(a: DiscoveryAnswers): { cats: string[] | null; label: string } {
  const explicit = (a.property?.categories ?? []).filter(Boolean);
  if (explicit.length) return { cats: explicit, label: labelFor(explicit) };

  const cats = new Set<string>();
  const g = a.goals;
  if (a.persona === "farmer" || a.persona === "rancher" || g.includes("start-expand-farm")) { cats.add("farms-ranches"); cats.add("land"); }
  if (a.persona === "landowner" || g.includes("buy-land") || g.includes("preserve-family-land")) cats.add("land");
  if (g.includes("create-housing")) cats.add("homes");
  if (g.includes("develop")) { cats.add("land"); cats.add("commercial"); }
  if (a.persona === "business-owner" || a.persona === "investor" || g.includes("buy-sell-business")) { cats.add("commercial"); cats.add("businesses"); }
  // No strong property signal → cover every type (and say so).
  if (cats.size === 0) return { cats: null, label: "all property types" };
  return { cats: [...cats], label: labelFor([...cats]) };
}

const CAT_LABEL: Record<string, string> = {
  homes: "homes", "farms-ranches": "farm & ranch", land: "land", commercial: "commercial",
  hospitality: "hospitality", businesses: "business", misc: "other",
};
function labelFor(cats: string[]): string {
  const parts = cats.map((c) => CAT_LABEL[c] ?? c);
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return `${parts[0]} & ${parts[1]}`;
  return parts.slice(0, -1).join(", ") + " & " + parts[parts.length - 1];
}

function propertyOpportunities(a: DiscoveryAnswers, feed: GuidedIntakeFeed): PropertyOpportunities {
  const relevant = a.propertyInterest !== "no";
  if (!relevant) {
    return {
      relevant: false,
      note: "You said property isn't part of this — so the map focuses on the other pathways. You can always look at property later.",
      exploreHref: "/explore?lane=property-land",
    };
  }

  const wantStates = (a.property?.states ?? []).map((s) => s.toUpperCase());
  const inGeo = wantStates.length ? feed.states.filter((s) => wantStates.includes(s.abbr)) : feed.states;
  const { cats, label } = categoryScope(a);
  const scopeAll = cats === null;

  // Per-state SCOPED count (sum only the in-scope categories; all → state total).
  const scopedTotal = (s: GuidedIntakeFeed["states"][number]) =>
    scopeAll ? s.total : (cats as string[]).reduce((n, c) => n + (s.byCategory[c as keyof typeof s.byCategory] ?? 0), 0);

  const withCounts = inGeo
    .map((s) => ({
      abbr: s.abbr,
      total: scopedTotal(s),
      // OZ/HUBZone designations are whole-state (not per-category); only show
      // them when the scope is the whole inventory, so they never overclaim a
      // scoped subset.
      oz: scopeAll ? s.ozDesignated : undefined,
      hubzone: scopeAll ? s.hubzoneDesignated : undefined,
    }))
    .filter((s) => s.total > 0)
    .sort((x, y) => y.total - x.total);

  // TRUE total + true state count — NEVER capped. Only the DISPLAY is trimmed.
  const total = withCounts.reduce((n, s) => n + s.total, 0);
  const totalStates = withCounts.length;
  const shown = withCounts.slice(0, PROPERTY_STATES_SHOWN);

  return {
    relevant: true,
    note: a.propertyInterest === "maybe"
      ? "You're open to property — here is what currently exists in the verified inventory, shown only because it may support a pathway above. Real counts, not a claim about you."
      : "Here is what currently exists in the verified inventory, scoped to your interests. Real current counts, with verified place-facts on each listing — facts about the place, never about you.",
    verified: {
      total,
      totalStates,
      scopeLabel: label,
      scopeAllCategories: scopeAll,
      asOf: feed.asOf,
      states: shown,
      statesShown: shown.length,
      truncated: totalStates > shown.length,
    },
    exploreHref: "/explore?lane=property-land",
  };
}

function nextActions(a: DiscoveryAnswers, pathways: Pathway[]): string[] {
  const out: string[] = [];
  if (pathways[0]) out.push(`Explore the first pathway: "${pathways[0].title}" — it's the closest match to what you described.`);
  out.push("Follow any possibilities above that interest you — everything here is reading and looking, no commitment.");
  if (a.propertyInterest !== "no") out.push("Browse current inventory if and when property feels relevant.");
  out.push("When you're ready to find out what actually applies to you, talk with a licensed professional — that's where determinations happen.");
  if (a.timeHorizon === "immediate") out.push("Since your timing is near-term, a licensed professional can help you move quickly and correctly.");
  return out;
}

export function generatePossibilityMap(
  answers: DiscoveryAnswers,
  feed: GuidedIntakeFeed,
): PossibilityMap {
  const pathways = selectPathways(answers);

  const valueLead = answers.values[0];
  const themeFromValue: Partial<Record<ValueId, string>> = {
    income: "building income", stability: "stability", "family-legacy": "family legacy",
    "environmental-stewardship": "environmental stewardship", "community-impact": "community impact",
    growth: "growth", "risk-reduction": "lowering risk", "retirement-security": "retirement security",
    lifestyle: "lifestyle", independence: "independence",
  };
  const themes = [
    valueLead ? `What matters most to you: ${themeFromValue[valueLead]}` : "Exploring what's possible, no commitment",
    answers.timeHorizon ? `Time horizon: ${horizonLabel(answers.timeHorizon)}` : "Timing: open",
    `${pathways.length} pathway${pathways.length === 1 ? "" : "s"} to explore`,
  ];

  const risks: RiskItem[] = answers.constraints.map((c) => ({
    constraint: c,
    note: CONSTRAINT_NOTES[c].note,
    mitigationToExplore: `Worth exploring: ${CONSTRAINT_NOTES[c].explore}.`,
  }));

  return {
    headline: "Your possibilities",
    summary:
      "This is a map of possibilities to explore — not advice, and not a decision about you. Whether any of it fits your " +
      "situation — eligibility, qualification, approval — is for a licensed professional or the agency to determine with you, " +
      "never us. We're not selling you anything — we're helping you see what's out there.",
    themes,
    pathways,
    risks,
    programs: programItems(answers),
    financing: financingItems(answers),
    revenue: revenueItems(answers),
    environmental: environmentalItems(answers),
    property: propertyOpportunities(answers, feed),
    nextActions: nextActions(answers, pathways),
    humanReview: {
      recommended: true,
      message:
        "Whether any of these possibilities actually apply to you — eligibility, qualification, approval — is a licensed " +
        "professional's call, never ours. We strongly recommend confirming anything that interests you with the right person before acting.",
      routeTo: [
        "A licensed financing professional or your lender (for financing and eligibility)",
        "The administering agency (for program and grant determinations)",
        "An environmental professional (for conservation and compliance specifics)",
        "Your own advisor for planning, legal, and tax questions",
      ],
    },
  };
}

function horizonLabel(h: TimeHorizon): string {
  return { immediate: "immediate (0–6 months)", near: "near (6–24 months)", mid: "mid (2–5 years)", long: "long (5–10 years)", legacy: "legacy (10+ years)" }[h];
}
