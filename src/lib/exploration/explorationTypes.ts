/**
 * Universal Exploration Engine — types (Build 45).
 *
 * A reusable framework every customer-facing module can use to offer the same
 * customer-friendly discovery pattern:
 *   1. Explore the Full Map (general discovery, no personalization)
 *   2. Focus My Exploration (progressive narrowing)
 *   3. Narrow by topic / geography / asset / project / commodity / concern
 *   4. Show useful exploratory value BEFORE asking for personal information
 *   5. Offer deeper exploration or human review only AFTER value is shown
 *
 * Constitutional posture: advisory-only. No approval, guarantee, eligibility,
 * or official-determination claims. No personal identity information is
 * required before exploratory value is shown.
 */

export const UNIVERSAL_EXPLORATION_ENGINE_VERSION =
  "universal-exploration-engine-v1.0";

export type ExplorationMode = "FULL_MAP" | "FOCUS_MY_EXPLORATION";

export const EXPLORATION_MODES: readonly ExplorationMode[] = [
  "FULL_MAP",
  "FOCUS_MY_EXPLORATION",
];

export type ExplorationAlphaStatus =
  | "ACTIVE"
  | "HELD_FOR_ALPHA"
  | "INTERNAL_ONLY";

export type ExplorationSpecialistDomain =
  | "FINANCING_CAPITAL"
  | "ENVIRONMENTAL_COMPLIANCE"
  | "PUBLIC_TRUST"
  | "GENERAL_REVIEW";

export interface ExplorationOption {
  optionId: string;
  label: string;
  plainEnglishDescription: string;
  nextDimensions?: string[];
  sourceHints?: string[];
}

export interface ExplorationDimension {
  dimensionId: string;
  label: string;
  prompt: string;
  options: ExplorationOption[];
  requiredForFocus: boolean;
}

export interface FirstValueOutput {
  outputId: string;
  label: string;
  description: string;
  /** First value must be free — this is enforced false by the verifier. */
  requiresPersonalInfo: boolean;
  allowedInFreeExploration: boolean;
}

export interface HumanReviewRoute {
  routeId: string;
  label: string;
  specialistDomain: ExplorationSpecialistDomain;
  /** Human review may only be offered after first value has been shown. */
  triggerAfterValueShown: boolean;
  /**
   * Build 45 extension: a regulated technical review (e.g. environmental
   * engineering) that is HELD for Alpha until a qualified reviewer is
   * assigned. When true the route is advisory-held and never auto-activated.
   */
  heldForAlpha?: boolean;
}

export interface ExplorationModule {
  moduleId: string;
  label: string;
  plainEnglishDescription: string;
  routeBase: string;
  fullMapIntro: string;
  focusPrompt: string;
  narrowingDimensions: ExplorationDimension[];
  firstValueOutputs: FirstValueOutput[];
  humanReviewRoutes: HumanReviewRoute[];
  sourceFamilies: string[];
  alphaStatus: ExplorationAlphaStatus;
}

/** The eight required Alpha exploration modules. */
export const REQUIRED_ALPHA_EXPLORATION_MODULE_IDS: readonly string[] = [
  "property-land",
  "farms-agriculture",
  "small-business-growth",
  "environmental-compliance",
  "financing-capital",
  "housing-development",
  "programs-incentives",
  "not-sure-yet",
];

/**
 * Prohibited-claim patterns for customer-facing exploration copy. These match
 * ASSERTIONS (e.g. "you are approved") — not topic mentions (e.g. "eligibility
 * questions" or "USDA programs"), which are legitimate exploratory content.
 */
export const EXPLORATION_PROHIBITED_CLAIM_PATTERNS: readonly RegExp[] = [
  /\byou\s+(are|will be|have been|'re)\s+(approved|pre-?approved|eligible|qualified|denied|rejected)\b/i,
  /\byou\s+qualify\b/i,
  /\bpre-?approved\b/i,
  /\bguaranteed\s+(approval|funding|loan|rate|financing|money)\b/i,
  /\bofficial\s+(determination|decision|approval|certification)\b/i,
  /\bwe\s+(approve|deny|reject|guarantee|certify)\b/i,
  /\b(loan|financing|funding)\s+is\s+guaranteed\b/i,
];

export function detectExplorationProhibitedClaim(text: string): string | null {
  for (const re of EXPLORATION_PROHIBITED_CLAIM_PATTERNS) {
    const m = re.exec(text);
    if (m) {
      return m[0];
    }
  }
  return null;
}
