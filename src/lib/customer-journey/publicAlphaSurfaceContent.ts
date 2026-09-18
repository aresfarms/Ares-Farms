/**
 * Build 41 — Public Alpha Surface Content Registry
 *
 * Machine-readable mirror of docs/PUBLIC_ALPHA_SURFACE_CONTENT.md.
 * If this file and the markdown drift, the markdown is authoritative
 * and this file MUST be updated to match.
 *
 * Every content block below is sourced from an existing doctrine —
 * no new claims are introduced. The `sourceDoctrine` field on each
 * required block records the canonical citation for the auditor.
 *
 * Consumed by:
 *   - src/scripts/verifyCustomerJourney.ts (the Build 41 gate)
 *   - Each customer-facing page.tsx (as the import source for the
 *     canonical text it should render)
 */

export const PUBLIC_ALPHA_SURFACE_CONTENT_VERSION =
  "public-alpha-surface-content-v0.1.0";

export const PUBLIC_ALPHA_SURFACE_CONTENT_DOC_REF =
  "docs/PUBLIC_ALPHA_SURFACE_CONTENT.md";

// =============================================================================
// Customer Promise (sourced from Public Alpha Customer Journey Doctrine)
// =============================================================================

export const CUSTOMER_PROMISE_TAGLINE = "Compass to Capital";

export const CUSTOMER_PROMISE_NEGATIONS = [
  "approve loans",
  "deny loans",
  "issue underwriting decisions",
  "issue agency determinations",
  "guarantee funding",
] as const;

export const CUSTOMER_PROMISE_AFFIRMATIONS = [
  "available pathways",
  "readiness gaps",
  "documentation needs",
  "financing realities",
  "environmental considerations",
  "next recommended actions",
] as const;

// =============================================================================
// Financing Reality Classifications (sourced from CJ Doctrine §5)
// =============================================================================

export const FINANCING_REALITY_CLASSIFICATIONS = [
  "likely financeable",
  "financeable with conditions",
  "specialist review required",
  "limited financing market",
  "cash-favored transaction",
  "not enough information",
] as const;

// =============================================================================
// Customer Rights (sourced from Data Transparency Posture Runtime v1)
// =============================================================================

export const CUSTOMER_RIGHT_IDS = [
  "REQUEST_EXPLANATION",
  "REQUEST_DELETION",
  "REQUEST_EXPORT",
  "REQUEST_HUMAN_REVIEW",
  "REQUEST_HOLD_ON_ESCALATION",
] as const;

// =============================================================================
// Customer Project Intake Questions (sourced from CJ Doctrine §2)
// =============================================================================

export const CUSTOMER_PROJECT_INTAKE_QUESTIONS = [
  "What type of business do you own?",
  "What are you trying to accomplish?",
  "Where is the property located?",
  "What type of asset is involved?",
] as const;

// =============================================================================
// Four-stage escalation (verbatim, Data Transparency Doctrine §Escalation)
// =============================================================================

export const FOUR_STAGE_ESCALATION = [
  "Exploration",
  "Human Review",
  "Lender Engagement",
  "Application Submission",
] as const;

// =============================================================================
// The ten "Furlong will" obligations (verbatim, Data Transparency §WillDo)
// =============================================================================

export const FURLONG_WILL_DO = [
  "Explain why information is requested.",
  "Explain how information is used.",
  "Explain which recommendations relied upon specific information.",
  "Explain when additional information is needed.",
  "Explain when information is shared.",
  "Explain when information is retained.",
  "Explain when information can be deleted.",
  "Explain when information can be exported.",
  "Preserve evidence lineage and recommendation traceability.",
  "Allow users to understand how conclusions were reached.",
] as const;

// =============================================================================
// The twelve "Furlong will not" prohibitions (verbatim, §WillNotDo)
// =============================================================================

export const FURLONG_WILL_NOT_DO = [
  "Sell user information.",
  "Secretly submit user information to lenders.",
  "Secretly submit user information to agencies.",
  "Secretly submit user information to brokers.",
  "Secretly distribute user information to third parties.",
  "Generate undisclosed marketing leads.",
  "Hide recommendation logic.",
  "Hide pathway exclusions.",
  "Hide readiness limitations.",
  "Hide known conflicts.",
  "Hide known risks.",
  "Represent user information as verified when it has not been verified.",
] as const;

// =============================================================================
// Verbatim deletion language (must match Data Transparency Doctrine §WillDo #7)
// =============================================================================

export const VERBATIM_DELETION_LANGUAGE_MARKERS = [
  /delete\s+your\s+information\s+from\s+the\s+live\s+system/i,
  /audit\s+log\s+required\s+for\s+regulatory\s+traceability/i,
  /(when|what)\s+information\s+can\s+be\s+deleted/i,
] as const;

// =============================================================================
// Banned tokens specific to pathway_discovery (CJ Doctrine §3)
// =============================================================================

export const PATHWAY_DISCOVERY_BANNED_TOKENS = [
  /\byou\s+are\s+approved\b/i,
  /\byou\s+qualify\b/i,
  /\bguaranteed\s+(approval|funding|rate|loan)\b/i,
  /\bpre[-\s]?approved\b/i,
] as const;

// =============================================================================
// Surface registry — the 7 routes
// =============================================================================

export type ContentRequirementId =
  | "tagline"
  | "founder-mission"
  | "promise-negations"
  | "promise-affirmations"
  | "foundational-principle"
  | "ten-will-do"
  | "twelve-will-not-do"
  | "trust-principle"
  | "five-customer-rights"
  | "verbatim-deletion-language"
  | "pathway-discovery-categories"
  | "six-financing-reality-classifications"
  | "readiness-property-context-bridge"
  | "readiness-human-review-boundary"
  | "four-intake-questions"
  | "four-stage-escalation"
  | "human-review-paths"
  | "next-step-guidance";

export type ContentRequirement = {
  id: ContentRequirementId;
  label: string;
  sourceDoctrine: string;
  // Regex patterns that the page text MUST satisfy (all of them).
  requiredPatterns: ReadonlyArray<RegExp>;
};

export type SurfaceSection = {
  route: string;
  ordinal: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  doctrineSection: string;
  doctrineLabel: string;
  pageFilePath: string; // relative to repo root
  requiredContent: ReadonlyArray<ContentRequirement>;
  requiredDisclosureIds: ReadonlyArray<string>; // Module 44 ids
  bannedTokens: ReadonlyArray<RegExp>;
};

// Helper: build a pattern that requires every item of a string array
// to appear (case-insensitive) on the page.
function eachOf(items: ReadonlyArray<string>): ReadonlyArray<RegExp> {
  return items.map(
    (s) =>
      new RegExp(
        s
          .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
          .replace(/\s+/g, "\\s+"),
        "i"
      )
  );
}

export const PUBLIC_ALPHA_SURFACE_SECTIONS: ReadonlyArray<SurfaceSection> = [
  // ──────────────────────────────────────────────────────────────────
  // Route 1 — /about (Founder Introduction)
  // ──────────────────────────────────────────────────────────────────
  {
    // Build 56 consolidation: the value-prop / founder-introduction surface is
    // now /compass (What We Do). /about became "Our Story" (founding narrative).
    route: "/compass",
    ordinal: 1,
    doctrineSection: "Customer Journey §1",
    doctrineLabel: "Founder Introduction",
    pageFilePath: "src/app/(public)/compass/page.tsx",
    requiredContent: [
      {
        id: "tagline",
        label: "Compass to Capital tagline",
        sourceDoctrine: "Customer Journey §Customer Promise",
        requiredPatterns: [/Compass\s+to\s+Capital/i],
      },
      {
        id: "founder-mission",
        label: "Founder mission paragraph",
        sourceDoctrine: "Customer Trust Profile §Foundational Principle",
        requiredPatterns: [
          /(compass|not\s+a\s+lender|help\s+(people|users))/i,
          /(human|decision|cleared)/i,
        ],
      },
      {
        id: "promise-negations",
        label: "Customer Promise — 5 negations",
        sourceDoctrine: "Customer Journey §Customer Promise",
        requiredPatterns: eachOf(CUSTOMER_PROMISE_NEGATIONS),
      },
      {
        id: "promise-affirmations",
        label: "Customer Promise — 6 affirmations",
        sourceDoctrine: "Customer Journey §Customer Promise",
        requiredPatterns: eachOf(CUSTOMER_PROMISE_AFFIRMATIONS),
      },
    ],
    requiredDisclosureIds: [
      "advisory-only",
      "no-reliance",
      "furlong-not-lender",
      "user-data-sovereignty",
    ],
    bannedTokens: [],
  },

  // ──────────────────────────────────────────────────────────────────
  // Route 2 — /trust (Trust Posture)
  // ──────────────────────────────────────────────────────────────────
  {
    route: "/trust",
    ordinal: 2,
    doctrineSection: "Customer Trust Profile",
    doctrineLabel: "Trust Posture",
    pageFilePath: "src/app/(public)/trust/page.tsx",
    requiredContent: [
      {
        id: "foundational-principle",
        label: "Foundational principle (Your information belongs to you)",
        sourceDoctrine: "Data Transparency §Foundational Principle",
        requiredPatterns: [/your\s+information\s+belongs\s+to\s+you/i],
      },
      {
        id: "ten-will-do",
        label: "Ten Furlong will obligations",
        sourceDoctrine: "Data Transparency §What Furlong Will Do",
        requiredPatterns: eachOf(FURLONG_WILL_DO),
      },
      {
        id: "twelve-will-not-do",
        label: "Twelve Furlong will not prohibitions",
        sourceDoctrine: "Data Transparency §What Furlong Will Not Do",
        requiredPatterns: eachOf(FURLONG_WILL_NOT_DO),
      },
      {
        id: "trust-principle",
        label: "Trust principle (informed decision-making)",
        sourceDoctrine: "Data Transparency §Trust Principle",
        requiredPatterns: [
          /informed\s+decision[-\s]?making/i,
          /(hidden\s+process|prioritize)/i,
        ],
      },
    ],
    requiredDisclosureIds: [
      "advisory-only",
      "no-reliance",
      "no-public-verification",
      "furlong-not-lender",
      "ai-tier1-only",
      "data-rights",
      "free-for-borrowers",
      "user-data-sovereignty",
    ],
    bannedTokens: [],
  },

  // ──────────────────────────────────────────────────────────────────
  // Route 3 — Data Transparency & Customer Rights.
  // Build 56 consolidation: the standalone /data-rights page was retired;
  // /data-rights 308-redirects to /trust#your-data and the data-rights content
  // (the five rights + honest-deletion language + disclosures) is merged into the
  // Trust & Your Data page. This section therefore validates that content against
  // its canonical home, src/app/(public)/trust/page.tsx.
  // ──────────────────────────────────────────────────────────────────
  {
    route: "/trust#your-data",
    ordinal: 3,
    doctrineSection: "Customer Journey §7",
    doctrineLabel: "Data Transparency",
    pageFilePath: "src/app/(public)/trust/page.tsx",
    requiredContent: [
      {
        id: "foundational-principle",
        label: "Foundational statement (Your information belongs to you)",
        sourceDoctrine: "Data Transparency §Foundational Principle",
        requiredPatterns: [/your\s+information\s+belongs\s+to\s+you/i],
      },
      {
        id: "five-customer-rights",
        label: "Five customer rights",
        sourceDoctrine: "Data Transparency Posture Runtime v1",
        requiredPatterns: eachOf(CUSTOMER_RIGHT_IDS),
      },
      {
        id: "verbatim-deletion-language",
        label: "Verbatim deletion language (Data Transparency §WillDo #7)",
        sourceDoctrine: "Data Transparency §What Furlong Will Do (item 7)",
        requiredPatterns: VERBATIM_DELETION_LANGUAGE_MARKERS,
      },
    ],
    requiredDisclosureIds: [
      "advisory-only",
      "data-rights",
      "user-data-sovereignty",
      "free-for-borrowers",
    ],
    bannedTokens: [],
  },

  // ──────────────────────────────────────────────────────────────────
  // Route 4 — /financing-pathways (Pathway Discovery + Reality Class.)
  // ──────────────────────────────────────────────────────────────────
  {
    route: "/financing-pathways",
    ordinal: 4,
    doctrineSection: "Customer Journey §3 + §5",
    doctrineLabel: "Pathway Discovery + Financing Reality Classification",
    pageFilePath: "src/app/(public)/financing-pathways/page.tsx",
    requiredContent: [
      {
        id: "pathway-discovery-categories",
        label: "Likely / Excluded pathways + rationale",
        sourceDoctrine: "Customer Journey §3",
        requiredPatterns: [
          /likely\s+pathways/i,
          /excluded\s+pathways/i,
          /rationale/i,
        ],
      },
      {
        id: "six-financing-reality-classifications",
        label: "Six financing reality classifications",
        sourceDoctrine: "Customer Journey §5",
        requiredPatterns: eachOf(FINANCING_REALITY_CLASSIFICATIONS),
      },
    ],
    requiredDisclosureIds: [
      "advisory-only",
      "no-reliance",
      "furlong-not-lender",
      "ai-tier1-only",
    ],
    bannedTokens: [...PATHWAY_DISCOVERY_BANNED_TOKENS],
  },

  // ──────────────────────────────────────────────────────────────────
  // Route 5 — /readiness (Readiness Review)
  // ──────────────────────────────────────────────────────────────────
  {
    route: "/readiness",
    ordinal: 5,
    doctrineSection: "Customer Journey §4",
    doctrineLabel: "Readiness Review",
    pageFilePath: "src/app/(public)/readiness/page.tsx",
    requiredContent: [
      {
        id: "readiness-property-context-bridge",
        label: "Readiness is presented in property context",
        sourceDoctrine: "Founder direction 2026-07-17 + Customer Journey §4",
        requiredPatterns: [
          /readiness lives inside your property analysis now/i,
          /there is no separate readiness score to chase/i,
          /missing/i,
          /documents/i,
        ],
      },
      {
        id: "readiness-human-review-boundary",
        label: "Advisory and human-review boundary",
        sourceDoctrine: "Customer Journey §4 + Customer Trust Profile §3",
        requiredPatterns: [
          /human review is required/i,
          /advisory/i,
        ],
      },
    ],
    requiredDisclosureIds: ["advisory-only", "no-reliance", "data-rights"],
    bannedTokens: [],
  },

  // ──────────────────────────────────────────────────────────────────
  // Route 6 — /onboarding (Customer Project Intake)
  // ──────────────────────────────────────────────────────────────────
  {
    route: "/onboarding",
    ordinal: 6,
    doctrineSection: "Customer Journey §2",
    doctrineLabel: "Customer Project Intake",
    pageFilePath: "src/app/(public)/onboarding/page.tsx",
    requiredContent: [
      {
        id: "four-intake-questions",
        label: "Four intake questions",
        sourceDoctrine: "Customer Journey §2",
        requiredPatterns: eachOf(CUSTOMER_PROJECT_INTAKE_QUESTIONS),
      },
    ],
    requiredDisclosureIds: [
      "advisory-only",
      "data-rights",
      "user-data-sovereignty",
      "free-for-borrowers",
    ],
    bannedTokens: [],
  },

  // ──────────────────────────────────────────────────────────────────
  // Route 7 — /portal/borrower (Human Escalation)
  // ──────────────────────────────────────────────────────────────────
  {
    route: "/portal/borrower",
    ordinal: 7,
    doctrineSection: "Customer Journey §6 + Data Transparency §Escalation",
    doctrineLabel: "Human Escalation",
    pageFilePath: "src/app/portal/borrower/page.tsx",
    requiredContent: [
      {
        id: "four-stage-escalation",
        label: "Four-stage escalation (Exploration → Application Submission)",
        sourceDoctrine: "Data Transparency §Escalation Control",
        requiredPatterns: eachOf(FOUR_STAGE_ESCALATION),
      },
      {
        id: "human-review-paths",
        label: "Available human review paths (5 reviewer roles)",
        sourceDoctrine: "Customer Journey §6 + Vol VII Operational Annex",
        requiredPatterns: [
          /borrower\s+intake\s+reviewer/i,
          /document\s+verification\s+reviewer/i,
          /qualified\s+governance\s+reviewer/i,
          /data\s+rights\s+officer/i,
          /chief\s+governance\s+authority/i,
        ],
      },
      {
        id: "next-step-guidance",
        label: "Next-step guidance",
        sourceDoctrine: "Customer Journey §6",
        requiredPatterns: [
          /(your\s+decision|whatever\s+you\s+do\s+next\s+is\s+your)/i,
          /(recommend|trade[-\s]?offs?|next\s+stage)/i,
        ],
      },
    ],
    requiredDisclosureIds: [
      "advisory-only",
      "furlong-not-lender",
      "ai-tier1-only",
    ],
    bannedTokens: [],
  },
];

// =============================================================================
// Lineage
// =============================================================================

export function publicAlphaSurfaceContentLineage(): {
  version: string;
  docRef: string;
  sectionCount: number;
  totalRequiredContentBlocks: number;
  totalRequiredDisclosures: number;
  promiseNegationCount: number;
  promiseAffirmationCount: number;
  financingClassificationCount: number;
  customerRightCount: number;
  intakeQuestionCount: number;
  willDoCount: number;
  willNotDoCount: number;
} {
  return {
    version: PUBLIC_ALPHA_SURFACE_CONTENT_VERSION,
    docRef: PUBLIC_ALPHA_SURFACE_CONTENT_DOC_REF,
    sectionCount: PUBLIC_ALPHA_SURFACE_SECTIONS.length,
    totalRequiredContentBlocks: PUBLIC_ALPHA_SURFACE_SECTIONS.reduce(
      (sum, s) => sum + s.requiredContent.length,
      0
    ),
    totalRequiredDisclosures: PUBLIC_ALPHA_SURFACE_SECTIONS.reduce(
      (sum, s) => sum + s.requiredDisclosureIds.length,
      0
    ),
    promiseNegationCount: CUSTOMER_PROMISE_NEGATIONS.length,
    promiseAffirmationCount: CUSTOMER_PROMISE_AFFIRMATIONS.length,
    financingClassificationCount: FINANCING_REALITY_CLASSIFICATIONS.length,
    customerRightCount: CUSTOMER_RIGHT_IDS.length,
    intakeQuestionCount: CUSTOMER_PROJECT_INTAKE_QUESTIONS.length,
    willDoCount: FURLONG_WILL_DO.length,
    willNotDoCount: FURLONG_WILL_NOT_DO.length,
  };
}
