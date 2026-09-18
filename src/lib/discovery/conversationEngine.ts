/**
 * Conversational interview — the DETERMINISTIC FLOOR (ISOMORPHIC).
 *
 * Caitlin's vision (2026-06-11): the Possibility Discovery front door is a
 * guided, one-question-at-a-time interview that adapts to each answer and builds
 * toward the Possibility Map (the 10 outputs of possibilityEngine).
 *
 * This module is the deterministic substrate that runs WITH or WITHOUT the AI:
 *   - It defines the canonical question SLOTS, the structured option sets the UI
 *     renders, and the adaptive ordering (which question comes next given the
 *     answers so far — a farmer who says "start a farm" gets farm follow-ups;
 *     "I'm not sure" gets gentler orienting questions).
 *   - It maps a chosen option back into the typed DiscoveryAnswers (so the final
 *     map is ALWAYS produced by the verified deterministic engine — the model
 *     can never invent a program, a number, or an eligibility result).
 *   - When the AI is unavailable or uncertain, this IS the interview (Tier-1
 *     advisory floor). The AI only personalizes the wording + picks the next
 *     slot from the allowed set; structure, options, slot-filling, and the map
 *     stay here.
 *
 * Anonymous by construction: state is the interview answers only — interests,
 * never identity. No PII fields exist in this model.
 */

import type {
  DiscoveryAnswers, PersonaId, GoalId, TimeHorizon, ResourceId, ConstraintId, ValueId, PropertyInterest,
} from "./possibilityEngine";

export type SlotId =
  | "persona" | "goals" | "timeHorizon" | "resources" | "constraints"
  | "values" | "propertyInterest" | "propertyStates" | "propertyCategories";

export interface Option { value: string; label: string }

export interface QuestionStep {
  kind: "question";
  slot: SlotId;
  /** The default (deterministic) question wording — the AI may replace this. */
  prompt: string;
  options: Option[];
  multi: boolean;
  /** Optional free-text is allowed but PII-guarded server-side. */
  allowFreeText?: boolean;
}
export interface MapReadyStep { kind: "map-ready" }
export type InterviewStep = QuestionStep | MapReadyStep;

/** Accumulated answers + the verified feed's available states (for property slots). */
export interface InterviewState {
  answers: DiscoveryAnswers;
  /** Two-letter state codes that currently have inventory (from the verified feed). */
  availableStates?: string[];
  availableCategories?: { value: string; label: string }[];
}

// ── Canonical option catalogs (shared by deterministic + AI paths + the UI) ──
const PERSONA: Option[] = [
  ["individual", "Individual"], ["family", "Family"], ["farmer", "Farmer"], ["rancher", "Rancher"],
  ["landowner", "Landowner"], ["business-owner", "Business owner"], ["investor", "Investor"],
  ["nonprofit", "Nonprofit"], ["municipality", "Municipality"], ["tribal", "Tribal organization"],
  ["developer", "Developer"], ["veteran", "Veteran"], ["retiree", "Retiree"], ["student", "Student"], ["other", "Other"],
].map(([value, label]) => ({ value, label }));

const GOALS: Option[] = [
  ["buy-land", "Buy land"], ["start-expand-farm", "Start / expand a farm"], ["retire", "Retire"],
  ["generate-income", "Generate income"], ["preserve-family-land", "Preserve family land"],
  ["buy-sell-business", "Buy / sell a business"], ["improve-environment", "Improve environmental outcomes"],
  ["develop", "Develop"], ["create-housing", "Create housing"], ["reduce-debt", "Reduce debt"],
  ["improve-cash-flow", "Improve cash flow"], ["access-programs", "Access programs"],
  ["access-financing", "Access financing"], ["build-wealth", "Build generational wealth"],
  ["passive-income", "Passive income"], ["evaluate-opportunities", "Evaluate opportunities"],
  ["not-sure", "I'm not sure yet"],
].map(([value, label]) => ({ value, label }));

const HORIZON: Option[] = [
  ["immediate", "Immediate (0–6 months)"], ["near", "Near (6–24 months)"], ["mid", "Mid (2–5 years)"],
  ["long", "Long (5–10 years)"], ["legacy", "Legacy (10+ years)"],
].map(([value, label]) => ({ value, label }));

const RESOURCES: Option[] = [
  ["land", "Land"], ["business", "Business"], ["farm", "Farm"], ["equipment", "Equipment"], ["livestock", "Livestock"],
  ["housing", "Housing"], ["savings", "Savings"], ["retirement-assets", "Retirement assets"], ["credit-access", "Credit access"],
  ["family-support", "Family support"], ["industry-experience", "Industry experience"], ["professional-licenses", "Professional licenses"], ["none", "None of these"],
].map(([value, label]) => ({ value, label }));

const CONSTRAINTS: Option[] = [
  ["limited-capital", "Limited capital"], ["credit", "Credit"], ["experience", "Experience"], ["time", "Time"],
  ["physical", "Physical"], ["regulatory", "Regulatory"], ["environmental", "Environmental"], ["market-uncertainty", "Market uncertainty"],
  ["labor", "Labor"], ["geographic", "Geographic"], ["unsure-where-to-start", "Unsure where to start"],
].map(([value, label]) => ({ value, label }));

const VALUES: Option[] = [
  ["income", "Income"], ["stability", "Stability"], ["family-legacy", "Family legacy"], ["environmental-stewardship", "Environmental stewardship"],
  ["community-impact", "Community impact"], ["growth", "Growth"], ["risk-reduction", "Risk reduction"], ["retirement-security", "Retirement security"],
  ["lifestyle", "Lifestyle"], ["independence", "Independence"],
].map(([value, label]) => ({ value, label }));

const PROPERTY_INTEREST: Option[] = [
  { value: "yes", label: "Yes" }, { value: "maybe", label: "Maybe" }, { value: "no", label: "No" },
];

export const SLOT_OPTIONS: Record<SlotId, Option[]> = {
  persona: PERSONA, goals: GOALS, timeHorizon: HORIZON, resources: RESOURCES,
  constraints: CONSTRAINTS, values: VALUES, propertyInterest: PROPERTY_INTEREST,
  propertyStates: [], propertyCategories: [],
};

// ── Adaptive default question wording (persona-aware where it helps) ─────────
function goalsPrompt(a: DiscoveryAnswers): string {
  switch (a.persona) {
    case "farmer": case "rancher": return "What are you hoping to do with your land or operation?";
    case "retiree": return "What would you most like this next chapter to make possible?";
    case "business-owner": return "What are you trying to accomplish with the business?";
    case "investor": return "What are you trying to accomplish — and over what kind of horizon?";
    default: return "What are you trying to accomplish? Pick anything that fits — there are no wrong answers.";
  }
}
function resourcesPrompt(a: DiscoveryAnswers): string {
  return a.goals.includes("not-sure")
    ? "No pressure on direction yet — what do you already have to work with? It helps narrow what's worth a look."
    : "What do you already have to work with? This shapes which possibilities are practical first.";
}

function questionFor(slot: SlotId, state: InterviewState): QuestionStep {
  const a = state.answers;
  const base = (prompt: string, multi: boolean, options = SLOT_OPTIONS[slot], allowFreeText = false): QuestionStep =>
    ({ kind: "question", slot, prompt, options, multi, allowFreeText });
  switch (slot) {
    case "persona": return base("To start — which of these sounds most like you?", false, PERSONA, true);
    case "goals": return base(goalsPrompt(a), true);
    case "timeHorizon": return base("What's your rough time horizon?", false);
    case "resources": return base(resourcesPrompt(a), true);
    case "constraints": return base("What constraints should we keep in mind? No judgment — this just keeps the map realistic.", true);
    case "values": return base("What matters most to you? Tap them in the order that feels right.", true);
    case "propertyInterest": return base("Is property part of what you're exploring? It's one option — never assumed.", false);
    case "propertyStates": return base("Which states are you curious about? (only states with current inventory are shown)", true,
      (state.availableStates ?? []).map((s) => ({ value: s, label: s })));
    case "propertyCategories": return base("What kind of property?", true, state.availableCategories ?? []);
  }
}

/**
 * The remaining slots to fill, in adaptive priority order. Branching:
 *  - property slots only appear when the person said yes/maybe to property;
 *  - everything is optional past persona+goals — the interview can wrap early
 *    once it has enough to produce a meaningful map.
 */
export function allowedNextSlots(state: InterviewState): SlotId[] {
  const a = state.answers;
  const out: SlotId[] = [];
  if (!a.persona) out.push("persona");
  if (!a.goals?.length) out.push("goals");
  if (!a.timeHorizon) out.push("timeHorizon");
  if (!a.resources?.length) out.push("resources");
  if (!a.constraints?.length) out.push("constraints");
  if (!a.values?.length) out.push("values");
  if (!a.propertyInterest) out.push("propertyInterest");
  if (a.propertyInterest && a.propertyInterest !== "no") {
    if (!(a.property?.states?.length) && (state.availableStates?.length ?? 0) > 0) out.push("propertyStates");
    if ((a.property?.states?.length ?? 0) > 0 && !(a.property?.categories?.length) && (state.availableCategories?.length ?? 0) > 0)
      out.push("propertyCategories");
  }
  return out;
}

/**
 * The slots still to present, EXCLUDING ones already shown. A slot is presented
 * at most once, so a Skipped optional (answered with no selection) is "done" and
 * never re-asked — `remaining` strictly shrinks and the interview terminates.
 */
export function remainingSlots(state: InterviewState, asked: Iterable<SlotId>): SlotId[] {
  const seen = new Set(asked);
  return allowedNextSlots(state).filter((s) => !seen.has(s));
}

/** Minimum to produce a meaningful map: persona + goals + property-interest answered. */
export function hasEnoughForMap(state: InterviewState): boolean {
  const a = state.answers;
  return !!a.persona && (a.goals?.length ?? 0) > 0 && !!a.propertyInterest;
}

const OPTIONAL_SLOTS: SlotId[] = ["timeHorizon", "resources", "constraints", "values"];

/** The deterministic next step (the floor + the canonical question definitions). */
export function nextStep(state: InterviewState): InterviewStep {
  const slots = allowedNextSlots(state);
  if (slots.length === 0) return { kind: "map-ready" };
  // Wrap up once we have the essentials and only deep-optional detail remains.
  if (hasEnoughForMap(state) && slots.every((s) => OPTIONAL_SLOTS.includes(s)) && slots.length <= 1) {
    return { kind: "map-ready" };
  }
  return questionFor(slots[0], state);
}

/** Look up the canonical question for an explicit slot (used by the AI path). */
export function questionForSlot(slot: SlotId, state: InterviewState): QuestionStep {
  return questionFor(slot, state);
}

// ── Answer mapping: chosen option value(s) → typed DiscoveryAnswers ──────────
const isOpt = (slot: SlotId, v: string) => SLOT_OPTIONS[slot].some((o) => o.value === v) || slot === "propertyStates" || slot === "propertyCategories";

/**
 * Fold a slot answer into the accumulated answers. `values` are option codes the
 * UI selected — never free text (free text, if any, is PII-guarded server-side
 * and discarded from the typed model). Unknown codes are ignored (safety).
 */
export function applyAnswer(state: InterviewState, slot: SlotId, values: string[]): InterviewState {
  const a: DiscoveryAnswers = {
    ...state.answers,
    goals: [...(state.answers.goals ?? [])],
    resources: [...(state.answers.resources ?? [])],
    constraints: [...(state.answers.constraints ?? [])],
    values: [...(state.answers.values ?? [])],
  };
  const valid = values.filter((v) => isOpt(slot, v));
  switch (slot) {
    case "persona": a.persona = valid[0] as PersonaId | undefined; break;
    case "goals": a.goals = valid as GoalId[]; break;
    case "timeHorizon": a.timeHorizon = valid[0] as TimeHorizon | undefined; break;
    case "resources": a.resources = valid as ResourceId[]; break;
    case "constraints": a.constraints = valid as ConstraintId[]; break;
    case "values": a.values = valid as ValueId[]; break;
    case "propertyInterest":
      a.propertyInterest = valid[0] as PropertyInterest | undefined;
      a.property = a.propertyInterest && a.propertyInterest !== "no" ? (a.property ?? { states: [], categories: [] }) : undefined;
      break;
    case "propertyStates": a.property = { ...(a.property ?? {}), states: valid.map((s) => s.toUpperCase()) }; break;
    case "propertyCategories": a.property = { ...(a.property ?? {}), categories: valid }; break;
  }
  return { ...state, answers: a };
}

/** A fresh interview state. */
export function emptyInterview(availableStates: string[] = [], availableCategories: { value: string; label: string }[] = []): InterviewState {
  return {
    answers: { goals: [], resources: [], constraints: [], values: [] },
    availableStates,
    availableCategories,
  };
}
