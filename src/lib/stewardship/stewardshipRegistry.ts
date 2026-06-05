/**
 * Furlong Stewardship — registry (Build 44-A).
 *
 * Stewardship is integrated as content / UX / navigation. It does NOT change
 * governance rules, voting, Alpha status, or human-authority requirements.
 *
 * Future-proofing: stewardship DOMAINS persist independently from the
 * individuals who currently steward them. The domain is stable; the
 * `currentSteward` may change without altering homepage architecture.
 *
 * Doctrine: stewards illuminate, they do not decide. They explain, they do not
 * determine outcomes. They guide exploration, they do not control journeys.
 */

export const FURLONG_STEWARDSHIP_VERSION = "furlong-stewardship-v1.0";

export const STEWARDSHIP_TAGLINE = "Every journey benefits from trusted guides.";

export const STEWARDSHIP_INTRO: readonly string[] = [
  "Every journey benefits from trusted guides.",
  "Furlong's stewards help illuminate opportunities, pathways, considerations, and next steps.",
  "The journey remains yours. The decisions remain yours. We help you understand the map.",
];

export const STEWARDSHIP_DOCTRINE_RULES: readonly string[] = [
  "Stewards illuminate. Stewards do not decide.",
  "Stewards explain. Stewards do not determine outcomes.",
  "Stewards guide exploration. Stewards do not control journeys.",
  "Stewards help understand the map. Customers choose where to go.",
];

/**
 * Titles to avoid (positioning posture). Stewardship language only.
 */
export const STEWARDSHIP_FORBIDDEN_TITLE_WORDS: readonly string[] = [
  "expert",
  "guru",
  "master",
  "captain",
  "salesperson",
];

/**
 * Sales / claim language patterns prohibited in customer-facing stewardship
 * copy (advisory posture; no approval/guarantee/official determination, no
 * sales push).
 */
export const STEWARDSHIP_PROHIBITED_PATTERNS: readonly RegExp[] = [
  /\byou\s+(are|will be|'re)\s+(approved|pre-?approved|eligible|qualified)\b/i,
  /\bguaranteed\s+(approval|funding|loan|rate|financing)\b/i,
  /\bofficial\s+(determination|decision|approval|certification)\b/i,
  /\bwe\s+(approve|deny|guarantee|certify|decide for you)\b/i,
  /\b(buy now|act now|limited time|special offer|sign up today)\b/i,
];

export function detectStewardshipViolation(text: string): string | null {
  const lower = text.toLowerCase();
  for (const word of STEWARDSHIP_FORBIDDEN_TITLE_WORDS) {
    // word-boundary match to avoid false hits inside other words
    const re = new RegExp(`\\b${word}\\b`, "i");
    if (re.test(lower)) {
      return `forbidden-title-word:${word}`;
    }
  }
  for (const re of STEWARDSHIP_PROHIBITED_PATTERNS) {
    const m = re.exec(text);
    if (m) {
      return `prohibited:${m[0]}`;
    }
  }
  return null;
}

export interface StewardshipDomain {
  domainId: string;
  domainName: string;
  /** Stewardship-language title, e.g. "Steward of Financing & Capital". */
  stewardTitle: string;
  description: string;
  /** The person currently stewarding this domain — may change over time. */
  currentSteward: string;
  /** Own profile page, /stewardship/<domainId>. */
  profileRoute: string;
  /** Maps to the exploration engine's specialist domain (decoupled string). */
  explorationSpecialistDomain:
    | "FINANCING_CAPITAL"
    | "ENVIRONMENTAL_COMPLIANCE"
    | "PUBLIC_TRUST";
  helpsIlluminate: string[];
  questionsExplored: string[];
  whenHumanReviewAppropriate: string[];
  /** Optional note when a regulated technical review is held for Alpha. */
  heldForAlphaNote?: string;
}

export const STEWARDSHIP_DOMAINS: StewardshipDomain[] = [
  {
    domainId: "financing-capital",
    domainName: "Financing & Capital",
    stewardTitle: "Steward of Financing & Capital",
    description:
      "Helps illuminate the kinds of financing and capital pathways that might fit a project, and the readiness questions worth exploring first.",
    currentSteward: "Stuart Fraass",
    profileRoute: "/stewardship/financing-capital",
    explorationSpecialistDomain: "FINANCING_CAPITAL",
    helpsIlluminate: [
      "Possible capital pathway categories",
      "Readiness gaps to explore before applying anywhere",
      "How different financing routes tend to differ",
      "Documentation people commonly prepare",
    ],
    questionsExplored: [
      "What financing pathways could fit a project like this?",
      "What might I want to prepare before talking to a lender?",
      "What trade-offs are worth understanding between routes?",
    ],
    whenHumanReviewAppropriate: [
      "When you want a person to walk the pathways through with you",
      "When information seems to conflict or is incomplete",
      "When you would like help understanding next steps",
    ],
  },
  {
    domainId: "environmental-compliance",
    domainName: "Environmental & Compliance",
    stewardTitle: "Steward of Environmental & Compliance",
    description:
      "Helps illuminate environmental and compliance questions that can change what is realistic, financeable, or safe to pursue — early, before they become surprises.",
    currentSteward: "Caitlin Hudson",
    profileRoute: "/stewardship/environmental-compliance",
    explorationSpecialistDomain: "ENVIRONMENTAL_COMPLIANCE",
    helpsIlluminate: [
      "Questions worth asking before buying or building",
      "Where a closer environmental look may be appropriate",
      "Broad categories of environmental and compliance risk",
      "When a qualified environmental review should be involved",
    ],
    questionsExplored: [
      "What environmental questions could affect this site?",
      "What might change what is realistic or safe to pursue?",
      "When should a qualified reviewer take a closer look?",
    ],
    whenHumanReviewAppropriate: [
      "When a site raises environmental questions you want explored",
      "When prior use or site history is uncertain",
      "When a project may need a qualified environmental review",
    ],
    heldForAlphaNote:
      "Technical environmental engineering review remains held during Public Alpha and is only conducted by a qualified environmental reviewer when activated.",
  },
  {
    domainId: "communications-public-trust",
    domainName: "Communications & Public Trust",
    stewardTitle: "Steward of Communications & Public Trust",
    description:
      "Helps illuminate how Furlong communicates clearly and keeps your information yours, so you can explore with confidence.",
    currentSteward: "Frances Fraass",
    profileRoute: "/stewardship/communications-public-trust",
    explorationSpecialistDomain: "PUBLIC_TRUST",
    helpsIlluminate: [
      "How Furlong explains what it does and does not do",
      "How your information is handled and kept yours",
      "How to read pathways as possibilities, not promises",
      "Where to find your data rights and trust commitments",
    ],
    questionsExplored: [
      "What does Furlong do, and what does it not do?",
      "How is my information used and protected?",
      "How do I keep control of my own journey?",
    ],
    whenHumanReviewAppropriate: [
      "When you want help understanding how Furlong works",
      "When you have questions about your information or data rights",
      "When you want to talk through what you are seeing",
    ],
  },
];

/**
 * Which stewardship domains are relevant to offer (after value is shown) when a
 * customer is exploring a given exploration module. The customer always retains
 * control — these are options, never automatic hand-offs.
 */
export const STEWARDSHIP_REVIEW_BY_EXPLORATION_MODULE: Record<string, string[]> =
  {
    "property-land": ["financing-capital", "environmental-compliance"],
    "small-business-growth": [
      "financing-capital",
      "communications-public-trust",
    ],
    "environmental-compliance": ["environmental-compliance"],
    "financing-capital": ["financing-capital"],
    "farms-agriculture": ["financing-capital", "environmental-compliance"],
    "housing-development": ["financing-capital", "environmental-compliance"],
    "programs-incentives": ["financing-capital"],
    "not-sure-yet": [
      "financing-capital",
      "environmental-compliance",
      "communications-public-trust",
    ],
  };

export const STEWARDSHIP_REVIEW_PROMPT = {
  heading: "Need help exploring further?",
  body: "You may continue exploring on your own or request stewardship review.",
} as const;

export function stewardshipDomainById(
  domainId: string,
  domains: StewardshipDomain[] = STEWARDSHIP_DOMAINS
): StewardshipDomain | undefined {
  return domains.find((d) => d.domainId === domainId);
}

export function stewardshipDomainsForExplorationModule(
  moduleId: string,
  domains: StewardshipDomain[] = STEWARDSHIP_DOMAINS
): StewardshipDomain[] {
  const ids = STEWARDSHIP_REVIEW_BY_EXPLORATION_MODULE[moduleId] ?? [];
  return ids
    .map((id) => stewardshipDomainById(id, domains))
    .filter((d): d is StewardshipDomain => d !== undefined);
}

export function stewardshipLineage(): {
  version: string;
  domainCount: number;
  domainIds: string[];
} {
  return {
    version: FURLONG_STEWARDSHIP_VERSION,
    domainCount: STEWARDSHIP_DOMAINS.length,
    domainIds: STEWARDSHIP_DOMAINS.map((d) => d.domainId),
  };
}
