import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { composeDisclosureAuditGate } from "@/lib/disclosure-audit/disclosureAuditGateRuntime";
import { HUMAN_AUTHORITY_BINDINGS } from "@/lib/human-authority/humanAuthorityRegistryRuntime";
import { ModuleManifest, moduleManifests } from "@/lib/modules/moduleRegistry";

/**
 * Build 38 — Public Alpha Profile v1 (Customer Journey)
 *
 * Codifies the Public Alpha Profile v1 doctrine
 * (docs/DOCTRINE_PUBLIC_ALPHA_CUSTOMER_JOURNEY_V1.md) into a governed
 * runtime that audits the first customer-facing experience against:
 *
 *   - 7 entry-surface sections (founder intro, intake, pathway
 *     discovery, readiness review, financing reality classification,
 *     human escalation, data transparency),
 *   - 6 customer success criteria (questions the customer must be
 *     able to answer without external explanation),
 *   - The Customer Promise (Furlong does NOT approve/deny/issue/
 *     guarantee + Furlong helps users understand the six topics),
 *   - The 6 Financing Reality Classifications (likely-financeable,
 *     with-conditions, specialist-review, limited-market, cash-
 *     favored, not-enough-info),
 *   - Module 44 disclosure coverage on every entry-surface page,
 *   - Module 45 human authority binding for every escalation path,
 *   - The Build 35 Public Alpha Profile gate (alpha_entry_allowed).
 *
 * The runtime does NOT publish to customers. It is a deterministic
 * static auditor of the customer journey shape — feeds the Build
 * Self-Report and the Public Alpha Profile signal stack.
 *
 * Constitutional posture: internal advisory audit posture only,
 * replay-safe, audit-safe, conflict-preserving, production-blocked.
 * Every finding resolves to REQUIRES_HUMAN_REVIEW.
 */

export const PUBLIC_ALPHA_CUSTOMER_JOURNEY_RUNTIME_VERSION =
  "public-alpha-customer-journey-runtime-v0.1.0";

export const PUBLIC_ALPHA_CUSTOMER_JOURNEY_SPEC_VERSION =
  "public-alpha-profile-v1";

export const PUBLIC_ALPHA_CUSTOMER_JOURNEY_DOC_REF =
  "docs/DOCTRINE_PUBLIC_ALPHA_CUSTOMER_JOURNEY_V1.md";

// =============================================================================
// 1. Customer Promise (Furlong does NOT / Furlong helps users understand)
// =============================================================================

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

export const CUSTOMER_PROMISE_TAGLINE = "Compass to Capital";

// =============================================================================
// 2. The 6 Financing Reality Classifications
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
// 3. The 6 Customer Success Criteria (Alpha Success Criteria)
// =============================================================================

export type CustomerSuccessQuestionId =
  | "what_are_my_options"
  | "what_are_my_risks"
  | "what_documents_do_i_need"
  | "what_happens_to_my_data"
  | "what_should_i_do_next"
  | "who_can_help_me";

export type CustomerSuccessQuestion = {
  id: CustomerSuccessQuestionId;
  questionCanonical: string;
  answeredBySections: ReadonlyArray<CustomerJourneySectionId>;
};

// =============================================================================
// 4. The 7 Entry-Surface Sections
// =============================================================================

export type CustomerJourneySectionId =
  | "founder_introduction"
  | "customer_project_intake"
  | "pathway_discovery"
  | "readiness_review"
  | "financing_reality_classification"
  | "human_escalation"
  | "data_transparency";

export type CustomerJourneySection = {
  id: CustomerJourneySectionId;
  ordinal: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  doctrineLabel: string;
  purpose: string;
  // Canonical surface route(s) the section appears on. The auditor
  // file-system-probes every candidate; PASS requires ≥ 1 route to
  // load.
  candidateRoutes: ReadonlyArray<string>;
  // Semantic tokens that must appear in the surface text for the
  // section to be considered present. The auditor reads the page
  // source file (a deterministic static probe; the rendered DOM is
  // out of scope at audit time).
  requiredSemanticTokens: ReadonlyArray<RegExp>;
  // Disclosures that must be present on this section's surface,
  // sourced from Module 44.
  requiredDisclosureIds: ReadonlyArray<string>;
  // Customer success criteria this section helps answer.
  answersQuestions: ReadonlyArray<CustomerSuccessQuestionId>;
  // Whether the section requires a Module 45 named-role binding for
  // its clearable actions (human_escalation always does; the others
  // may not).
  requiresHumanAuthorityRole: boolean;
  // Banned tokens specific to the section (e.g. pathway_discovery
  // forbids approval language by §3 spec).
  bannedSemanticTokens: ReadonlyArray<RegExp>;
};

export const PUBLIC_ALPHA_CUSTOMER_JOURNEY_SECTIONS: ReadonlyArray<CustomerJourneySection> =
  [
    {
      id: "founder_introduction",
      ordinal: 1,
      doctrineLabel: "Founder Introduction",
      purpose:
        "Primary founder video and/or written introduction. Establish trust, explain mission, explain platform limitations.",
      candidateRoutes: ["/about", "/trust"],
      requiredSemanticTokens: [
        /furlong/i,
        /(mission|purpose|what\s+furlong\s+is)/i,
        /(advisory|not\s+a\s+lender|does\s+not\s+(lend|approve|decide|guarantee))/i,
      ],
      requiredDisclosureIds: [
        "advisory-only",
        "no-reliance",
        "furlong-not-lender",
        "user-data-sovereignty",
      ],
      answersQuestions: ["what_should_i_do_next"],
      requiresHumanAuthorityRole: false,
      bannedSemanticTokens: [],
    },
    {
      id: "customer_project_intake",
      ordinal: 2,
      doctrineLabel: "Customer Project Intake",
      purpose:
        "Simple guided intake — What type of business do you own, what are you trying to accomplish, where is the property located, what type of asset is involved.",
      candidateRoutes: ["/onboarding", "/portal/borrower/onboarding"],
      requiredSemanticTokens: [
        /(intake|onboarding|getting\s+started|tell\s+us\s+about)/i,
        /(business|project|property|asset|opportunity)/i,
      ],
      requiredDisclosureIds: [
        "advisory-only",
        "data-rights",
        "user-data-sovereignty",
        "free-for-borrowers",
      ],
      answersQuestions: ["what_should_i_do_next"],
      requiresHumanAuthorityRole: true,
      bannedSemanticTokens: [],
    },
    {
      id: "pathway_discovery",
      ordinal: 3,
      doctrineLabel: "Pathway Discovery",
      purpose:
        "Present likely pathways, excluded pathways, and rationale. No approval language permitted.",
      candidateRoutes: [
        "/financing-pathways",
        "/portal/borrower/financing-pathways",
      ],
      requiredSemanticTokens: [
        /(pathway|pathways|option|options|financing)/i,
        /(advisory|not\s+an?\s+(approval|guarantee|commitment))/i,
      ],
      requiredDisclosureIds: [
        "advisory-only",
        "no-reliance",
        "furlong-not-lender",
        "ai-tier1-only",
      ],
      answersQuestions: ["what_are_my_options", "what_are_my_risks"],
      requiresHumanAuthorityRole: true,
      // Spec §3: "No approval language permitted." The auditor flags
      // any unexempted approval-language match here as a hard fail.
      bannedSemanticTokens: [
        /\byou\s+are\s+approved\b/i,
        /\byou\s+qualify\b/i,
        /\bguaranteed\s+(approval|funding|rate|loan)\b/i,
        /\bpre[-\s]?approved\b/i,
      ],
    },
    {
      id: "readiness_review",
      ordinal: 4,
      doctrineLabel: "Readiness Review",
      purpose:
        "Present readiness indicators, missing items, and documentation recommendations.",
      candidateRoutes: ["/readiness", "/portal/borrower/readiness"],
      requiredSemanticTokens: [
        /(readiness|missing|documentation|documents)/i,
        /(advisory|human\s+review|not\s+a\s+(decision|determination))/i,
      ],
      requiredDisclosureIds: [
        "advisory-only",
        "no-reliance",
        "data-rights",
      ],
      answersQuestions: [
        "what_documents_do_i_need",
        "what_should_i_do_next",
      ],
      requiresHumanAuthorityRole: true,
      bannedSemanticTokens: [],
    },
    {
      id: "financing_reality_classification",
      ordinal: 5,
      doctrineLabel: "Financing Reality Classification",
      purpose:
        "Present one of 6 reality classifications: likely-financeable, with-conditions, specialist-review, limited-market, cash-favored, not-enough-info.",
      candidateRoutes: [
        "/financing-pathways",
        "/portal/borrower/financing-pathways",
        "/readiness",
      ],
      requiredSemanticTokens: [
        /(financeable|financing\s+(reality|classification)|reality|specialist\s+review|cash[-\s]favored|limited\s+(financing\s+)?market|not\s+enough\s+information)/i,
      ],
      requiredDisclosureIds: [
        "advisory-only",
        "no-reliance",
        "furlong-not-lender",
      ],
      answersQuestions: ["what_are_my_options", "what_are_my_risks"],
      requiresHumanAuthorityRole: true,
      bannedSemanticTokens: [],
    },
    {
      id: "human_escalation",
      ordinal: 6,
      doctrineLabel: "Human Escalation",
      purpose:
        "Present available human review paths, authority assignments, and next-step guidance.",
      candidateRoutes: [
        "/portal/borrower",
        "/reviews",
        "/onboarding",
      ],
      requiredSemanticTokens: [
        /(human\s+review|escalation|next[\s-]?step|reviewer|named|authority)/i,
      ],
      requiredDisclosureIds: [
        "advisory-only",
        "furlong-not-lender",
        "ai-tier1-only",
      ],
      answersQuestions: ["who_can_help_me", "what_should_i_do_next"],
      requiresHumanAuthorityRole: true,
      bannedSemanticTokens: [],
    },
    {
      id: "data_transparency",
      ordinal: 7,
      doctrineLabel: "Data Transparency",
      purpose:
        "Present what information is collected, why, how it is used, what has been shared, what has not been shared. Visible without legal-document review.",
      candidateRoutes: ["/data-rights", "/portal/borrower/data-rights", "/trust"],
      requiredSemanticTokens: [
        /(what\s+information|information\s+is\s+collected|how\s+(it|information)\s+is\s+used|shared)/i,
        /(does\s+not\s+(sell|secretly\s+submit)|your\s+information\s+belongs\s+to\s+you|no\s+information\s+sale|no\s+silent\s+submission)/i,
      ],
      requiredDisclosureIds: [
        "advisory-only",
        "data-rights",
        "user-data-sovereignty",
        "free-for-borrowers",
      ],
      answersQuestions: ["what_happens_to_my_data", "who_can_help_me"],
      requiresHumanAuthorityRole: true,
      bannedSemanticTokens: [],
    },
  ];

export const PUBLIC_ALPHA_CUSTOMER_SUCCESS_QUESTIONS: ReadonlyArray<CustomerSuccessQuestion> =
  [
    {
      id: "what_are_my_options",
      questionCanonical: "What are my options?",
      answeredBySections: [
        "pathway_discovery",
        "financing_reality_classification",
      ],
    },
    {
      id: "what_are_my_risks",
      questionCanonical: "What are my risks?",
      answeredBySections: [
        "pathway_discovery",
        "financing_reality_classification",
      ],
    },
    {
      id: "what_documents_do_i_need",
      questionCanonical: "What documents do I need?",
      answeredBySections: ["readiness_review"],
    },
    {
      id: "what_happens_to_my_data",
      questionCanonical: "What happens to my data?",
      answeredBySections: ["data_transparency"],
    },
    {
      id: "what_should_i_do_next",
      questionCanonical: "What should I do next?",
      answeredBySections: [
        "founder_introduction",
        "customer_project_intake",
        "readiness_review",
        "human_escalation",
      ],
    },
    {
      id: "who_can_help_me",
      questionCanonical: "Who can help me?",
      answeredBySections: ["human_escalation", "data_transparency"],
    },
  ];

// =============================================================================
// 5. Section audit
// =============================================================================

export type SectionAuditStatus =
  | "PASS"
  | "FAIL"
  | "WARN"
  | "PENDING_SIGNOFF";

export type SectionAuditResult = {
  sectionId: CustomerJourneySectionId;
  ordinal: number;
  doctrineLabel: string;
  resolvedRoute: string | null;
  candidateRoutes: ReadonlyArray<string>;
  routeLoads: boolean;
  requiredTokensPresent: number;
  requiredTokensTotal: number;
  missingTokenPatterns: string[];
  requiredDisclosureIds: ReadonlyArray<string>;
  disclosuresPresent: number;
  disclosuresMissing: string[];
  humanAuthorityBindingPresent: boolean;
  bannedTokenViolations: string[];
  status: SectionAuditStatus;
  reason: string;
};

function probeRoute(fsRoot: string, route: string): string | null {
  // Resolve a Next.js app-router route to a page.tsx absolute path.
  // Try /src/app{route}/page.tsx.
  const rel = route.replace(/^\//, "");
  const candidate = path.join(fsRoot, "src", "app", rel, "page.tsx");
  if (existsSync(candidate)) return candidate;
  return null;
}

function readSurfaceText(absolutePath: string): string {
  try {
    return readFileSync(absolutePath, "utf-8");
  } catch {
    return "";
  }
}

function moduleIdFromRoute(route: string): string | null {
  const m = moduleManifests.find((mm) => mm.route === route);
  return m?.id ?? null;
}

function disclosureCoverageForSurface(
  route: string,
  requiredIds: ReadonlyArray<string>,
  disclosurePack: ReturnType<typeof composeDisclosureAuditGate>
): { present: number; missing: string[] } {
  // Find the module whose route matches; pull its surfaceResult from
  // the disclosure audit pack and intersect with the required ids.
  const moduleId = moduleIdFromRoute(route);
  if (!moduleId) return { present: 0, missing: [...requiredIds] };
  const sr = disclosurePack.surfaceResults.find(
    (r) => r.surfaceId === moduleId
  );
  if (!sr) return { present: 0, missing: [...requiredIds] };
  const present = requiredIds.filter((id) =>
    sr.presentDisclosureIds.includes(id)
  );
  const missing = requiredIds.filter(
    (id) => !sr.presentDisclosureIds.includes(id)
  );
  return { present: present.length, missing };
}

function humanAuthorityBindingForRoute(route: string): boolean {
  const moduleId = moduleIdFromRoute(route);
  if (!moduleId) return false;
  return HUMAN_AUTHORITY_BINDINGS.some((b) => b.module_id === moduleId);
}

export function auditCustomerJourneySection(
  section: CustomerJourneySection,
  fsRoot: string,
  disclosurePack: ReturnType<typeof composeDisclosureAuditGate>
): SectionAuditResult {
  // 1. Route loads.
  let resolvedRoute: string | null = null;
  let surfaceFile: string | null = null;
  for (const cand of section.candidateRoutes) {
    surfaceFile = probeRoute(fsRoot, cand);
    if (surfaceFile) {
      resolvedRoute = cand;
      break;
    }
  }
  const routeLoads = surfaceFile !== null;

  // 2. Required tokens.
  const text = surfaceFile ? readSurfaceText(surfaceFile) : "";
  const tokensPresent: RegExp[] = [];
  const missingTokenPatterns: string[] = [];
  for (const re of section.requiredSemanticTokens) {
    if (re.test(text)) tokensPresent.push(re);
    else missingTokenPatterns.push(re.source);
  }

  // 3. Disclosures.
  const { present: disclosuresPresentCount, missing: disclosuresMissing } =
    resolvedRoute
      ? disclosureCoverageForSurface(
          resolvedRoute,
          section.requiredDisclosureIds,
          disclosurePack
        )
      : {
          present: 0,
          missing: [...section.requiredDisclosureIds],
        };

  // 4. Human authority binding.
  const humanAuthorityBindingPresent = resolvedRoute
    ? humanAuthorityBindingForRoute(resolvedRoute)
    : false;

  // 5. Banned tokens (e.g. §3 pathway_discovery forbids approval
  //    language; the disclosure audit gate's corpus is the source of
  //    truth for general prohibitions, but per-section banned tokens
  //    are surfaced here as well).
  const bannedTokenViolations: string[] = [];
  for (const re of section.bannedSemanticTokens) {
    if (re.test(text)) {
      bannedTokenViolations.push(re.source);
    }
  }

  // 6. Status roll-up.
  let status: SectionAuditStatus;
  let reason: string;
  if (!routeLoads) {
    status = "FAIL";
    reason = `no candidate route loaded — searched ${section.candidateRoutes.join(", ")}`;
  } else if (bannedTokenViolations.length > 0) {
    status = "FAIL";
    reason = `banned token(s) present: ${bannedTokenViolations.join(", ")}`;
  } else if (missingTokenPatterns.length > 0) {
    status = "FAIL";
    reason = `missing ${missingTokenPatterns.length} of ${section.requiredSemanticTokens.length} required semantic tokens`;
  } else if (disclosuresMissing.length > 0) {
    status = "FAIL";
    reason = `disclosure coverage incomplete — missing ${disclosuresMissing.join(", ")}`;
  } else if (
    section.requiresHumanAuthorityRole &&
    !humanAuthorityBindingPresent
  ) {
    status = "FAIL";
    reason =
      "section requires Module 45 human-authority binding for the underlying module; no binding found";
  } else {
    status = "PASS";
    reason =
      "route loads, required tokens present, required disclosures present, human authority binding (where required) present";
  }

  return {
    sectionId: section.id,
    ordinal: section.ordinal,
    doctrineLabel: section.doctrineLabel,
    resolvedRoute,
    candidateRoutes: section.candidateRoutes,
    routeLoads,
    requiredTokensPresent: tokensPresent.length,
    requiredTokensTotal: section.requiredSemanticTokens.length,
    missingTokenPatterns,
    requiredDisclosureIds: section.requiredDisclosureIds,
    disclosuresPresent: disclosuresPresentCount,
    disclosuresMissing,
    humanAuthorityBindingPresent,
    bannedTokenViolations,
    status,
    reason,
  };
}

// =============================================================================
// 6. Customer Success Criteria evaluation
// =============================================================================

export type CustomerSuccessAuditResult = {
  questionId: CustomerSuccessQuestionId;
  questionCanonical: string;
  answeredBySections: ReadonlyArray<CustomerJourneySectionId>;
  sectionsPassing: number;
  sectionsTotal: number;
  status: SectionAuditStatus;
  reason: string;
};

function evaluateCustomerSuccessQuestion(
  question: CustomerSuccessQuestion,
  sectionResults: SectionAuditResult[]
): CustomerSuccessAuditResult {
  const relevant = sectionResults.filter((r) =>
    question.answeredBySections.includes(r.sectionId)
  );
  const passing = relevant.filter((r) => r.status === "PASS").length;
  const total = relevant.length;
  const status: SectionAuditStatus =
    total > 0 && passing === total
      ? "PASS"
      : passing > 0
      ? "WARN"
      : "FAIL";
  const reason =
    status === "PASS"
      ? `customer can answer "${question.questionCanonical}" via ${total} passing section(s)`
      : status === "WARN"
      ? `customer can partially answer "${question.questionCanonical}" — ${passing} of ${total} answering sections pass`
      : `customer cannot reliably answer "${question.questionCanonical}" — 0 of ${total} answering sections pass`;
  return {
    questionId: question.id,
    questionCanonical: question.questionCanonical,
    answeredBySections: question.answeredBySections,
    sectionsPassing: passing,
    sectionsTotal: total,
    status,
    reason,
  };
}

// =============================================================================
// 7. Customer Promise audit
// =============================================================================

export type CustomerPromiseAuditResult = {
  taglinePresent: boolean;
  negationsPresentCount: number;
  negationsTotal: number;
  negationsMissing: string[];
  affirmationsPresentCount: number;
  affirmationsTotal: number;
  affirmationsMissing: string[];
  status: SectionAuditStatus;
  reason: string;
};

function auditCustomerPromise(
  fsRoot: string
): CustomerPromiseAuditResult {
  // The customer promise is fulfilled when at least one of the
  // founder/trust surfaces contains the tagline AND every negation AND
  // every affirmation. We scan /about and /trust.
  const candidatePaths = ["/about", "/trust"].map((r) =>
    probeRoute(fsRoot, r)
  );
  const blob = candidatePaths
    .filter((p): p is string => p !== null)
    .map(readSurfaceText)
    .join("\n");
  const taglinePresent = new RegExp(
    CUSTOMER_PROMISE_TAGLINE.replace(/\s+/g, "\\s+"),
    "i"
  ).test(blob);
  const negationsMissing: string[] = [];
  for (const n of CUSTOMER_PROMISE_NEGATIONS) {
    // Match either "does not <verb>" or "not a/an <noun>" form.
    const re = new RegExp(
      `(does\\s+not\\s+${n.replace(/\s+/g, "\\s+")}|not\\s+an?\\s+${n.replace(
        /\s+/g,
        "\\s+"
      )})`,
      "i"
    );
    if (!re.test(blob)) negationsMissing.push(n);
  }
  const affirmationsMissing: string[] = [];
  for (const a of CUSTOMER_PROMISE_AFFIRMATIONS) {
    const re = new RegExp(a.replace(/\s+/g, "\\s+"), "i");
    if (!re.test(blob)) affirmationsMissing.push(a);
  }
  const negationsPresentCount =
    CUSTOMER_PROMISE_NEGATIONS.length - negationsMissing.length;
  const affirmationsPresentCount =
    CUSTOMER_PROMISE_AFFIRMATIONS.length - affirmationsMissing.length;
  const status: SectionAuditStatus =
    taglinePresent &&
    negationsMissing.length === 0 &&
    affirmationsMissing.length === 0
      ? "PASS"
      : "WARN";
  const reason =
    status === "PASS"
      ? `customer promise statement complete on founder/trust surfaces — tagline + ${CUSTOMER_PROMISE_NEGATIONS.length} negations + ${CUSTOMER_PROMISE_AFFIRMATIONS.length} affirmations`
      : `customer promise statement incomplete — ${taglinePresent ? "tagline present" : "tagline missing"}, ${negationsMissing.length} negation(s) missing, ${affirmationsMissing.length} affirmation(s) missing`;
  return {
    taglinePresent,
    negationsPresentCount,
    negationsTotal: CUSTOMER_PROMISE_NEGATIONS.length,
    negationsMissing,
    affirmationsPresentCount,
    affirmationsTotal: CUSTOMER_PROMISE_AFFIRMATIONS.length,
    affirmationsMissing,
    status,
    reason,
  };
}

// =============================================================================
// 8. Financing Reality Classification audit
// =============================================================================

export type FinancingRealityAuditResult = {
  classificationsPresentCount: number;
  classificationsTotal: number;
  classificationsMissing: string[];
  resolvedRoute: string | null;
  status: SectionAuditStatus;
  reason: string;
};

function auditFinancingRealityClassifications(
  fsRoot: string
): FinancingRealityAuditResult {
  const candidates = [
    "/financing-pathways",
    "/portal/borrower/financing-pathways",
    "/readiness",
  ];
  let resolvedRoute: string | null = null;
  let text = "";
  for (const c of candidates) {
    const p = probeRoute(fsRoot, c);
    if (p) {
      text += "\n" + readSurfaceText(p);
      if (!resolvedRoute) resolvedRoute = c;
    }
  }
  const missing: string[] = [];
  for (const c of FINANCING_REALITY_CLASSIFICATIONS) {
    const re = new RegExp(c.replace(/\s+/g, "\\s+"), "i");
    if (!re.test(text)) missing.push(c);
  }
  const presentCount = FINANCING_REALITY_CLASSIFICATIONS.length - missing.length;
  const status: SectionAuditStatus =
    missing.length === 0 ? "PASS" : presentCount > 0 ? "WARN" : "FAIL";
  const reason =
    missing.length === 0
      ? "all 6 financing reality classifications present on the financing-pathways surface"
      : `${presentCount} of ${FINANCING_REALITY_CLASSIFICATIONS.length} classifications present; missing: ${missing.join(", ")}`;
  return {
    classificationsPresentCount: presentCount,
    classificationsTotal: FINANCING_REALITY_CLASSIFICATIONS.length,
    classificationsMissing: missing,
    resolvedRoute,
    status,
    reason,
  };
}

// =============================================================================
// 9. Public-facing types
// =============================================================================

export type CustomerJourneyFindingCategory =
  | "SECTION_ROUTE_MISSING"
  | "SECTION_REQUIRED_TOKEN_MISSING"
  | "SECTION_BANNED_TOKEN_PRESENT"
  | "SECTION_DISCLOSURE_MISSING"
  | "SECTION_HUMAN_AUTHORITY_BINDING_MISSING"
  | "CUSTOMER_PROMISE_INCOMPLETE"
  | "FINANCING_REALITY_CLASSIFICATION_MISSING"
  | "CUSTOMER_SUCCESS_QUESTION_UNANSWERED";

export type CustomerJourneyFinding = {
  findingId: string;
  category: CustomerJourneyFindingCategory;
  subjectSectionId?: CustomerJourneySectionId;
  subjectQuestionId?: CustomerSuccessQuestionId;
  topic: string;
  reviewerExplanation: string;
  evidenceReplayRef: string;
  resolution: "REQUIRES_HUMAN_REVIEW";
  reviewRoute: string;
  doctrineRefs: string[];
  blockedClaims: string[];
};

export type CustomerJourneySignalId =
  | "customer_journey_section_coverage"
  | "customer_promise_alignment"
  | "customer_success_criteria_coverage"
  | "disclosure_visibility_alignment"
  | "escalation_assignment_alignment"
  | "financing_reality_classification_alignment";

export type CustomerJourneySignalStatus =
  | "READY_FOR_REVIEW"
  | "NEEDS_INPUT"
  | "BLOCKED_BY_CONFLICT"
  | "NOT_STARTED";

export type CustomerJourneySignal = {
  id: CustomerJourneySignalId;
  label: string;
  status: CustomerJourneySignalStatus;
  readinessPercent: number;
  coverageCount: number;
  reviewSignals: string[];
  blockedClaims: string[];
  reviewRoute: string;
  doctrineRefs: string[];
};

export type CustomerJourneyCrossSourceConflict = {
  conflictId: string;
  topic: string;
  description: string;
  resolution: "REQUIRES_HUMAN_REVIEW";
  reviewRoute: string;
};

export type CustomerJourneySummary = {
  sectionCount: number;
  sectionsPass: number;
  sectionsFail: number;
  sectionsWarn: number;
  customerSuccessQuestionCount: number;
  customerSuccessQuestionsPass: number;
  customerSuccessQuestionsWarn: number;
  customerSuccessQuestionsFail: number;
  customerPromiseStatus: SectionAuditStatus;
  financingRealityStatus: SectionAuditStatus;
  classificationsPresentCount: number;
  classificationsTotal: number;
  findingCount: number;
  crossSourceConflictCount: number;
  v1SignalCount: number;
  v1ReadyCount: number;
  v1BlockedCount: number;
  v1NotStartedCount: number;
  v1OverallReadinessPercent: number;
};

export type CustomerJourneyInput = {
  reviewerRole?: string | null;
  userId?: string | null;
  applicationId?: string | null;
  fileSystemRoot?: string;
  metadata?: Record<string, unknown> | null;
};

export type CustomerJourneyResult = {
  runtimeVersion: string;
  specVersion: string;
  docRef: string;
  generatedAt: string;
  reviewerRole: string | null;
  applicationId: string | null;
  taglineCanonical: string;
  promiseNegations: ReadonlyArray<string>;
  promiseAffirmations: ReadonlyArray<string>;
  financingRealityClassifications: ReadonlyArray<string>;
  sections: ReadonlyArray<CustomerJourneySection>;
  sectionResults: SectionAuditResult[];
  customerPromise: CustomerPromiseAuditResult;
  financingReality: FinancingRealityAuditResult;
  customerSuccessQuestions: ReadonlyArray<CustomerSuccessQuestion>;
  customerSuccessResults: CustomerSuccessAuditResult[];
  findings: CustomerJourneyFinding[];
  v1Signals: CustomerJourneySignal[];
  crossSourceConflicts: CustomerJourneyCrossSourceConflict[];
  summary: CustomerJourneySummary;
  alphaJourneyReady: "PASS" | "FAIL" | "PENDING_SIGNOFF";
  exitCode: 0 | 1;
  recommendedReviewRoutes: string[];
  disclosures: string[];
  productionRestrictions: string[];
  blockedClaims: string[];
  productionBlocked: true;
  humanReviewRequired: true;
  advisoryOnly: true;
  publicAlphaCustomerJourneyInternalOnly: true;
  noCustomerFacingPublication: true;
  noAutonomousDetermination: true;
  noInformationSale: true;
  noSilentSubmission: true;
  noApproval: true;
  noDenial: true;
  noLenderCommitment: true;
  noLegalReliance: true;
  noPublicVerification: true;
  noRegulatoryReliance: true;
  noLiveExternalAction: true;
  noSourceCertainty: true;
  noNoticeSend: true;
  replaySafe: true;
  auditSafe: true;
  federationScoped: true;
  conflictPreserving: true;
};

const REVIEW_ROUTE = "/governance/public-alpha-customer-journey";

const DEFAULT_DOCTRINE_REFS = [
  "Master Volume 0 — Platform Orientation",
  "Master Volume I — Constitutional Backbone",
  "Master Volume IV — Operational Runbooks",
  "Master Volume V — Canonical Doctrines",
  "Master Volume VII — Unified Governance Conformance Matrix",
  PUBLIC_ALPHA_CUSTOMER_JOURNEY_DOC_REF,
  "docs/DOCTRINE_PUBLIC_ALPHA_DEFINITION_V1.md",
  "docs/DOCTRINE_DISCLOSURE_AUDIT_GATE_V1.md",
  "docs/DOCTRINE_HUMAN_AUTHORITY_REGISTRY_V1.md",
  "docs/DOCTRINE_DATA_TRANSPARENCY_USER_SOVEREIGNTY_V1.md",
  "docs/CUSTOMER_TRUST_PROFILE_V1.md",
];

const DEFAULT_FINDING_BLOCKED_CLAIMS = [
  "approval",
  "denial",
  "rejection",
  "lender commitment",
  "agency decision",
  "official certification",
  "public verification",
  "regulatory reliance",
  "legal reliance",
  "source certainty",
  "live external action",
  "payment authorization",
  "notice send",
  "information sale",
  "silent submission",
];

export const PUBLIC_ALPHA_CUSTOMER_JOURNEY_DISCLOSURES = [
  "Public Alpha Profile v1 (doctrine status: PROPOSED) — Customer journey audit only.",
  "This runtime audits whether the customer-facing entry surface contains the required sections, customer promise, financing reality classifications, disclosures, and human authority bindings. It does NOT authorize Public Alpha entry; the named governance authority records that decision externally.",
  "Internal governance evidence only — no customer-facing publication, no autonomous determination, no live external action.",
];

export const PUBLIC_ALPHA_CUSTOMER_JOURNEY_PRODUCTION_RESTRICTIONS = [
  "no Alpha entry authorization",
  "no customer-facing publication",
  "no autonomous determination",
  "no lender commitment claim",
  "no agency decision claim",
  "no official certification claim",
  "no public verification claim",
  "no regulatory reliance claim",
  "no legal reliance claim",
  "no live external action",
  "no payment authorization",
  "no notice send",
  "no information sale",
  "no silent submission",
];

const V1_SIGNAL_IDS: readonly CustomerJourneySignalId[] = [
  "customer_journey_section_coverage",
  "customer_promise_alignment",
  "customer_success_criteria_coverage",
  "disclosure_visibility_alignment",
  "escalation_assignment_alignment",
  "financing_reality_classification_alignment",
];

const V1_SIGNAL_LABELS: Record<CustomerJourneySignalId, string> = {
  customer_journey_section_coverage: "Customer journey section coverage",
  customer_promise_alignment: "Customer promise alignment",
  customer_success_criteria_coverage: "Customer success criteria coverage",
  disclosure_visibility_alignment: "Disclosure visibility alignment",
  escalation_assignment_alignment: "Escalation assignment alignment",
  financing_reality_classification_alignment:
    "Financing reality classification alignment",
};

function buildFindings(
  sectionResults: SectionAuditResult[],
  promise: CustomerPromiseAuditResult,
  reality: FinancingRealityAuditResult,
  successResults: CustomerSuccessAuditResult[]
): CustomerJourneyFinding[] {
  const out: CustomerJourneyFinding[] = [];
  for (const r of sectionResults) {
    if (!r.routeLoads) {
      out.push({
        findingId: `pacj-section-route-missing-${r.sectionId}`,
        category: "SECTION_ROUTE_MISSING",
        subjectSectionId: r.sectionId,
        topic: `Section ${r.sectionId} has no loaded route`,
        reviewerExplanation: r.reason,
        evidenceReplayRef: `pacj-replay://section/${r.sectionId}/route`,
        resolution: "REQUIRES_HUMAN_REVIEW",
        reviewRoute: REVIEW_ROUTE,
        doctrineRefs: [...DEFAULT_DOCTRINE_REFS],
        blockedClaims: [...DEFAULT_FINDING_BLOCKED_CLAIMS],
      });
    }
    if (r.missingTokenPatterns.length > 0) {
      out.push({
        findingId: `pacj-section-token-missing-${r.sectionId}`,
        category: "SECTION_REQUIRED_TOKEN_MISSING",
        subjectSectionId: r.sectionId,
        topic: `Section ${r.sectionId} missing ${r.missingTokenPatterns.length} required semantic token(s)`,
        reviewerExplanation: `Required tokens not detected on ${r.resolvedRoute ?? "(no route)"}: ${r.missingTokenPatterns.join(", ")}.`,
        evidenceReplayRef: `pacj-replay://section/${r.sectionId}/tokens`,
        resolution: "REQUIRES_HUMAN_REVIEW",
        reviewRoute: REVIEW_ROUTE,
        doctrineRefs: [...DEFAULT_DOCTRINE_REFS],
        blockedClaims: [...DEFAULT_FINDING_BLOCKED_CLAIMS],
      });
    }
    if (r.bannedTokenViolations.length > 0) {
      out.push({
        findingId: `pacj-section-banned-${r.sectionId}`,
        category: "SECTION_BANNED_TOKEN_PRESENT",
        subjectSectionId: r.sectionId,
        topic: `Section ${r.sectionId} contains banned token(s)`,
        reviewerExplanation: `Banned tokens detected on ${r.resolvedRoute ?? "(no route)"}: ${r.bannedTokenViolations.join(", ")}.`,
        evidenceReplayRef: `pacj-replay://section/${r.sectionId}/banned`,
        resolution: "REQUIRES_HUMAN_REVIEW",
        reviewRoute: REVIEW_ROUTE,
        doctrineRefs: [...DEFAULT_DOCTRINE_REFS],
        blockedClaims: [...DEFAULT_FINDING_BLOCKED_CLAIMS],
      });
    }
    if (r.disclosuresMissing.length > 0) {
      out.push({
        findingId: `pacj-section-disclosure-missing-${r.sectionId}`,
        category: "SECTION_DISCLOSURE_MISSING",
        subjectSectionId: r.sectionId,
        topic: `Section ${r.sectionId} missing required disclosure(s)`,
        reviewerExplanation: `Per Module 44, the surface ${r.resolvedRoute ?? "(no route)"} must carry: ${r.disclosuresMissing.join(", ")}.`,
        evidenceReplayRef: `pacj-replay://section/${r.sectionId}/disclosures`,
        resolution: "REQUIRES_HUMAN_REVIEW",
        reviewRoute: REVIEW_ROUTE,
        doctrineRefs: [...DEFAULT_DOCTRINE_REFS],
        blockedClaims: [...DEFAULT_FINDING_BLOCKED_CLAIMS],
      });
    }
    if (
      PUBLIC_ALPHA_CUSTOMER_JOURNEY_SECTIONS.find(
        (s) => s.id === r.sectionId
      )?.requiresHumanAuthorityRole &&
      !r.humanAuthorityBindingPresent
    ) {
      out.push({
        findingId: `pacj-section-human-authority-missing-${r.sectionId}`,
        category: "SECTION_HUMAN_AUTHORITY_BINDING_MISSING",
        subjectSectionId: r.sectionId,
        topic: `Section ${r.sectionId} has no Module 45 human-authority binding`,
        reviewerExplanation: `Per Module 45 + the Public Alpha Customer Journey Doctrine §6, every escalation-capable section requires a Module 45 binding. The module backing ${r.resolvedRoute ?? "(no route)"} has none.`,
        evidenceReplayRef: `pacj-replay://section/${r.sectionId}/authority`,
        resolution: "REQUIRES_HUMAN_REVIEW",
        reviewRoute: REVIEW_ROUTE,
        doctrineRefs: [...DEFAULT_DOCTRINE_REFS],
        blockedClaims: [...DEFAULT_FINDING_BLOCKED_CLAIMS],
      });
    }
  }
  if (promise.status !== "PASS") {
    out.push({
      findingId: "pacj-customer-promise-incomplete",
      category: "CUSTOMER_PROMISE_INCOMPLETE",
      topic: "Customer promise statement incomplete on founder/trust surfaces",
      reviewerExplanation: promise.reason,
      evidenceReplayRef: "pacj-replay://customer-promise",
      resolution: "REQUIRES_HUMAN_REVIEW",
      reviewRoute: REVIEW_ROUTE,
      doctrineRefs: [...DEFAULT_DOCTRINE_REFS],
      blockedClaims: [...DEFAULT_FINDING_BLOCKED_CLAIMS],
    });
  }
  if (reality.status !== "PASS") {
    out.push({
      findingId: "pacj-financing-reality-incomplete",
      category: "FINANCING_REALITY_CLASSIFICATION_MISSING",
      topic: "Financing reality classifications incomplete",
      reviewerExplanation: reality.reason,
      evidenceReplayRef: "pacj-replay://financing-reality",
      resolution: "REQUIRES_HUMAN_REVIEW",
      reviewRoute: REVIEW_ROUTE,
      doctrineRefs: [...DEFAULT_DOCTRINE_REFS],
      blockedClaims: [...DEFAULT_FINDING_BLOCKED_CLAIMS],
    });
  }
  for (const q of successResults) {
    if (q.status === "FAIL") {
      out.push({
        findingId: `pacj-customer-question-unanswered-${q.questionId}`,
        category: "CUSTOMER_SUCCESS_QUESTION_UNANSWERED",
        subjectQuestionId: q.questionId,
        topic: `Customer cannot reliably answer "${q.questionCanonical}"`,
        reviewerExplanation: q.reason,
        evidenceReplayRef: `pacj-replay://question/${q.questionId}`,
        resolution: "REQUIRES_HUMAN_REVIEW",
        reviewRoute: REVIEW_ROUTE,
        doctrineRefs: [...DEFAULT_DOCTRINE_REFS],
        blockedClaims: [...DEFAULT_FINDING_BLOCKED_CLAIMS],
      });
    }
  }
  return out;
}

function buildSignal(
  id: CustomerJourneySignalId,
  sectionResults: SectionAuditResult[],
  promise: CustomerPromiseAuditResult,
  reality: FinancingRealityAuditResult,
  successResults: CustomerSuccessAuditResult[]
): CustomerJourneySignal {
  let satisfied = 0;
  let total = 0;
  const reviewSignals: string[] = [];
  switch (id) {
    case "customer_journey_section_coverage":
      total = sectionResults.length;
      satisfied = sectionResults.filter((r) => r.status === "PASS").length;
      reviewSignals.push(`${satisfied} of ${total} entry-surface sections pass`);
      break;
    case "customer_promise_alignment":
      total = 1;
      satisfied = promise.status === "PASS" ? 1 : 0;
      reviewSignals.push(promise.reason);
      break;
    case "customer_success_criteria_coverage":
      total = successResults.length;
      satisfied = successResults.filter((r) => r.status === "PASS").length;
      reviewSignals.push(
        `${satisfied} of ${total} customer success questions answerable`
      );
      break;
    case "disclosure_visibility_alignment":
      total = sectionResults.length;
      satisfied = sectionResults.filter(
        (r) => r.disclosuresMissing.length === 0
      ).length;
      reviewSignals.push(
        `${satisfied} of ${total} sections carry all required disclosures`
      );
      break;
    case "escalation_assignment_alignment":
      total = sectionResults.filter(
        (r) =>
          PUBLIC_ALPHA_CUSTOMER_JOURNEY_SECTIONS.find(
            (s) => s.id === r.sectionId
          )?.requiresHumanAuthorityRole
      ).length;
      satisfied = sectionResults.filter(
        (r) =>
          PUBLIC_ALPHA_CUSTOMER_JOURNEY_SECTIONS.find(
            (s) => s.id === r.sectionId
          )?.requiresHumanAuthorityRole && r.humanAuthorityBindingPresent
      ).length;
      reviewSignals.push(
        `${satisfied} of ${total} escalation-capable sections have a Module 45 binding`
      );
      break;
    case "financing_reality_classification_alignment":
      total = reality.classificationsTotal;
      satisfied = reality.classificationsPresentCount;
      reviewSignals.push(reality.reason);
      break;
  }
  const ready = total === 0 ? true : satisfied === total;
  const readinessPercent =
    total === 0 ? 100 : Math.round((satisfied / total) * 100);
  return {
    id,
    label: V1_SIGNAL_LABELS[id],
    status: ready ? "READY_FOR_REVIEW" : "BLOCKED_BY_CONFLICT",
    readinessPercent,
    coverageCount: satisfied,
    reviewSignals,
    blockedClaims: [...DEFAULT_FINDING_BLOCKED_CLAIMS],
    reviewRoute: REVIEW_ROUTE,
    doctrineRefs: [...DEFAULT_DOCTRINE_REFS],
  };
}

function defaultFsRoot(): string {
  // The runtime is invoked from the repo root in CLI mode; the API
  // route resolves CWD likewise.
  return process.cwd();
}

export type ModuleManifestForExport = Pick<
  ModuleManifest,
  "id" | "route" | "audience"
>;

export function composePublicAlphaCustomerJourney(
  input: CustomerJourneyInput = {}
): CustomerJourneyResult {
  const fsRoot = input.fileSystemRoot ?? defaultFsRoot();
  const disclosurePack = composeDisclosureAuditGate();

  const sectionResults = PUBLIC_ALPHA_CUSTOMER_JOURNEY_SECTIONS.map((s) =>
    auditCustomerJourneySection(s, fsRoot, disclosurePack)
  );
  const customerPromise = auditCustomerPromise(fsRoot);
  const financingReality = auditFinancingRealityClassifications(fsRoot);
  const customerSuccessResults = PUBLIC_ALPHA_CUSTOMER_SUCCESS_QUESTIONS.map(
    (q) => evaluateCustomerSuccessQuestion(q, sectionResults)
  );

  const findings = buildFindings(
    sectionResults,
    customerPromise,
    financingReality,
    customerSuccessResults
  );

  const v1Signals = V1_SIGNAL_IDS.map((id) =>
    buildSignal(
      id,
      sectionResults,
      customerPromise,
      financingReality,
      customerSuccessResults
    )
  );

  const crossSourceConflicts: CustomerJourneyCrossSourceConflict[] = [];
  if (findings.some((f) => f.category === "SECTION_DISCLOSURE_MISSING")) {
    crossSourceConflicts.push({
      conflictId: "pacj-v1-disclosure-mismatch",
      topic: "Customer journey section disclosure mismatch with Module 44",
      description:
        "A customer journey section's surface does not carry all disclosures required by Module 44 for its surface class.",
      resolution: "REQUIRES_HUMAN_REVIEW",
      reviewRoute: REVIEW_ROUTE,
    });
  }
  if (
    findings.some(
      (f) => f.category === "SECTION_HUMAN_AUTHORITY_BINDING_MISSING"
    )
  ) {
    crossSourceConflicts.push({
      conflictId: "pacj-v1-authority-binding-mismatch",
      topic:
        "Customer journey section authority mismatch with Module 45",
      description:
        "A customer journey section requires a Module 45 human-authority binding but the underlying module has none.",
      resolution: "REQUIRES_HUMAN_REVIEW",
      reviewRoute: REVIEW_ROUTE,
    });
  }
  if (findings.some((f) => f.category === "SECTION_BANNED_TOKEN_PRESENT")) {
    crossSourceConflicts.push({
      conflictId: "pacj-v1-banned-token",
      topic: "Customer journey section contains banned language",
      description:
        "A section's surface contains language explicitly banned by the section spec (e.g. approval language on pathway discovery).",
      resolution: "REQUIRES_HUMAN_REVIEW",
      reviewRoute: REVIEW_ROUTE,
    });
  }

  const sectionsPass = sectionResults.filter((r) => r.status === "PASS").length;
  const sectionsFail = sectionResults.filter((r) => r.status === "FAIL").length;
  const sectionsWarn = sectionResults.filter((r) => r.status === "WARN").length;
  const successPass = customerSuccessResults.filter(
    (r) => r.status === "PASS"
  ).length;
  const successWarn = customerSuccessResults.filter(
    (r) => r.status === "WARN"
  ).length;
  const successFail = customerSuccessResults.filter(
    (r) => r.status === "FAIL"
  ).length;

  const v1ReadyCount = v1Signals.filter(
    (s) => s.status === "READY_FOR_REVIEW"
  ).length;
  const v1BlockedCount = v1Signals.filter(
    (s) => s.status === "BLOCKED_BY_CONFLICT"
  ).length;
  const v1NotStartedCount = v1Signals.filter(
    (s) => s.status === "NOT_STARTED"
  ).length;
  const v1OverallReadinessPercent =
    v1Signals.length === 0
      ? 0
      : Math.round(
          v1Signals.reduce((sum, s) => sum + s.readinessPercent, 0) /
            v1Signals.length
        );

  const summary: CustomerJourneySummary = {
    sectionCount: sectionResults.length,
    sectionsPass,
    sectionsFail,
    sectionsWarn,
    customerSuccessQuestionCount: customerSuccessResults.length,
    customerSuccessQuestionsPass: successPass,
    customerSuccessQuestionsWarn: successWarn,
    customerSuccessQuestionsFail: successFail,
    customerPromiseStatus: customerPromise.status,
    financingRealityStatus: financingReality.status,
    classificationsPresentCount: financingReality.classificationsPresentCount,
    classificationsTotal: financingReality.classificationsTotal,
    findingCount: findings.length,
    crossSourceConflictCount: crossSourceConflicts.length,
    v1SignalCount: v1Signals.length,
    v1ReadyCount,
    v1BlockedCount,
    v1NotStartedCount,
    v1OverallReadinessPercent,
  };

  // Aggregate alpha_journey_ready: PASS only when all sections PASS,
  // all success questions PASS, the customer promise is complete, the
  // financing reality classifications are all present, and no
  // disclosures or authority bindings are missing. PENDING_SIGNOFF
  // when section/promise/classification coverage is present but
  // success questions only WARN (partial answers). FAIL otherwise.
  let alphaJourneyReady: "PASS" | "FAIL" | "PENDING_SIGNOFF";
  if (
    sectionsFail === 0 &&
    successFail === 0 &&
    customerPromise.status === "PASS" &&
    financingReality.status === "PASS" &&
    findings.length === 0
  ) {
    alphaJourneyReady = "PASS";
  } else if (sectionsFail === 0 && successFail === 0) {
    alphaJourneyReady = "PENDING_SIGNOFF";
  } else {
    alphaJourneyReady = "FAIL";
  }
  const exitCode: 0 | 1 = alphaJourneyReady === "PASS" ? 0 : 1;

  const recommendedReviewRoutes = [
    REVIEW_ROUTE,
    "/governance/public-alpha-profile",
    "/governance/disclosure-audit-gate",
    "/governance/human-authority-registry",
    "/governance/build-self-report",
    "/governance/data-transparency-posture",
    "/governance",
    "/reviews",
    "/evidence-packets",
    "/audit-replay",
  ];

  return {
    runtimeVersion: PUBLIC_ALPHA_CUSTOMER_JOURNEY_RUNTIME_VERSION,
    specVersion: PUBLIC_ALPHA_CUSTOMER_JOURNEY_SPEC_VERSION,
    docRef: PUBLIC_ALPHA_CUSTOMER_JOURNEY_DOC_REF,
    generatedAt: new Date().toISOString(),
    reviewerRole: input.reviewerRole ?? null,
    applicationId: input.applicationId ?? null,
    taglineCanonical: CUSTOMER_PROMISE_TAGLINE,
    promiseNegations: CUSTOMER_PROMISE_NEGATIONS,
    promiseAffirmations: CUSTOMER_PROMISE_AFFIRMATIONS,
    financingRealityClassifications: FINANCING_REALITY_CLASSIFICATIONS,
    sections: PUBLIC_ALPHA_CUSTOMER_JOURNEY_SECTIONS,
    sectionResults,
    customerPromise,
    financingReality,
    customerSuccessQuestions: PUBLIC_ALPHA_CUSTOMER_SUCCESS_QUESTIONS,
    customerSuccessResults,
    findings,
    v1Signals,
    crossSourceConflicts,
    summary,
    alphaJourneyReady,
    exitCode,
    recommendedReviewRoutes,
    disclosures: [...PUBLIC_ALPHA_CUSTOMER_JOURNEY_DISCLOSURES],
    productionRestrictions: [
      ...PUBLIC_ALPHA_CUSTOMER_JOURNEY_PRODUCTION_RESTRICTIONS,
    ],
    blockedClaims: [...DEFAULT_FINDING_BLOCKED_CLAIMS],
    productionBlocked: true,
    humanReviewRequired: true,
    advisoryOnly: true,
    publicAlphaCustomerJourneyInternalOnly: true,
    noCustomerFacingPublication: true,
    noAutonomousDetermination: true,
    noInformationSale: true,
    noSilentSubmission: true,
    noApproval: true,
    noDenial: true,
    noLenderCommitment: true,
    noLegalReliance: true,
    noPublicVerification: true,
    noRegulatoryReliance: true,
    noLiveExternalAction: true,
    noSourceCertainty: true,
    noNoticeSend: true,
    replaySafe: true,
    auditSafe: true,
    federationScoped: true,
    conflictPreserving: true,
  };
}

export function publicAlphaCustomerJourneyLineage(): {
  runtimeVersion: string;
  specVersion: string;
  docRef: string;
  sectionCount: number;
  customerSuccessQuestionCount: number;
  financingRealityClassificationCount: number;
  promiseNegationCount: number;
  promiseAffirmationCount: number;
} {
  return {
    runtimeVersion: PUBLIC_ALPHA_CUSTOMER_JOURNEY_RUNTIME_VERSION,
    specVersion: PUBLIC_ALPHA_CUSTOMER_JOURNEY_SPEC_VERSION,
    docRef: PUBLIC_ALPHA_CUSTOMER_JOURNEY_DOC_REF,
    sectionCount: PUBLIC_ALPHA_CUSTOMER_JOURNEY_SECTIONS.length,
    customerSuccessQuestionCount: PUBLIC_ALPHA_CUSTOMER_SUCCESS_QUESTIONS.length,
    financingRealityClassificationCount: FINANCING_REALITY_CLASSIFICATIONS.length,
    promiseNegationCount: CUSTOMER_PROMISE_NEGATIONS.length,
    promiseAffirmationCount: CUSTOMER_PROMISE_AFFIRMATIONS.length,
  };
}

export const PUBLIC_ALPHA_CUSTOMER_JOURNEY_SIGNAL_IDS = V1_SIGNAL_IDS;
