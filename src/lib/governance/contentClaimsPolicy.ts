/**
 * Content Claims Policy Runtime
 *
 * Master Volume Governance:
 * - Vol I: Prevents public claims from exceeding constitutional authority.
 * - Vol II: Blocks approval, eligibility, credit, underwriting, disclosure,
 *   and regulated-reliance claims that could mislead borrowers or partners.
 * - Vol III: Provides deterministic, replay-safe claim evaluation before
 *   customer-facing modules, reports, exports, or AI copy are promoted.
 * - Vol III-B: Keeps governed content aligned with runtime controls and
 *   human-review boundaries.
 * - Vol IV: Supports operator review, deployment gates, and evidence-based
 *   remediation of prohibited public language.
 * - Vol V: Implements canonical claim governance, explainability,
 *   portability, verification, source-authority, and controlled disclosure.
 *
 * Supplemental governing inputs:
 * - Furlong_Customer_Version.pdf
 * - Furlong_Governance_Doctrines_Master_Series.pdf
 */

export type ContentClaimSeverity = "ALLOW" | "REVIEW" | "BLOCK";

export type ContentClaimContext = {
  publicVerificationGatewayOperational?: boolean;
  canonicalHashVerificationOperational?: boolean;
  lenderReadyDisclosurePresent?: boolean;
  freeTierBaselineReadinessAvailable?: boolean;
  borrowerPortabilityAvailable?: boolean;
  soc2Type2Operational?: boolean;
  fedRampAuthorized?: boolean;
  officialDecisionAuthority?: boolean;
};

export type ContentClaimRule = {
  code: string;
  severity: ContentClaimSeverity;
  source: string;
  requirement: string;
};

export type ContentClaimFinding = ContentClaimRule & {
  matchedText: string;
  message: string;
};

export type ContentClaimsEvaluation = {
  ok: boolean;
  evaluatedAt: string;
  policyVersion: string;
  sources: string[];
  findingCount: number;
  blockCount: number;
  reviewCount: number;
  findings: ContentClaimFinding[];
};

export type EvaluateContentClaimsInput = {
  text: string | string[];
  context?: ContentClaimContext;
};

type RulePattern = ContentClaimRule & {
  patterns: RegExp[];
  message: string;
  skipWhen?: (text: string, context: ContentClaimContext) => boolean;
  skipMatchWhen?: (
    text: string,
    matchIndex: number,
    matchedText: string
  ) => boolean;
};

export const CONTENT_CLAIMS_POLICY_VERSION =
  "content-claims-policy-v0.1.0";

export const CONTENT_CLAIMS_POLICY_SOURCES = [
  "Furlong_Customer_Version.pdf",
  "Furlong_Governance_Doctrines_Master_Series.pdf",
  "Furlong_Volume_I_Constitutional_Backbone_Master.pdf",
  "Furlong_Volume_II_Regulatory_Governance_Master.pdf",
  "Furlong_Volume_III_B_Governance_Runtime_Master.pdf",
  "Furlong_Volume_V_Canonical_Doctrines_Master.pdf",
];

export const LENDER_READY_DISCLOSURE =
  "Lender-ready means organized against intake requirements only. It does not mean approval, pre-approval, creditworthiness, eligibility for funding, underwriting approval, or guaranteed acceptance.";

export const BORROWER_PORTABILITY_DISCLOSURE =
  "Borrowers may review, export, and transport their records through governed, machine-readable portability workflows without premium barriers or dark patterns.";

export const ADVISORY_ONLY_DISCLOSURE =
  "Furlong facilitates governed coordination and advisory guidance only. It does not approve, deny, underwrite, determine eligibility, or make credit decisions.";

export const CONTENT_CLAIMS_REGISTRY: ContentClaimRule[] = [
  {
    code: "PROHIBITED_APPROVAL_CLAIM",
    severity: "BLOCK",
    source: "LENDER-READY-GOV-001",
    requirement:
      "Public content must not imply approval, pre-approval, creditworthiness, underwriting approval, eligibility for funding, or guaranteed acceptance.",
  },
  {
    code: "LENDER_READY_DISCLOSURE_REQUIRED",
    severity: "BLOCK",
    source: "LENDER-READY-GOV-001",
    requirement:
      "Lender-ready language must explain that it means organized and complete against intake requirements only.",
  },
  {
    code: "VERIFICATION_INFRASTRUCTURE_REQUIRED",
    severity: "BLOCK",
    source: "VERIFICATION-INFRA-001",
    requirement:
      "Reports or borrower packages must not claim public/external verification unless live verification infrastructure is operational.",
  },
  {
    code: "AI_DECISION_CLAIM",
    severity: "BLOCK",
    source: "Furlong_Customer_Version.pdf",
    requirement:
      "AI may be advisory only and must not be described as approving, denying, underwriting, determining eligibility, or making credit decisions.",
  },
  {
    code: "PLATFORM_DECISION_AUTHORITY_CLAIM",
    severity: "BLOCK",
    source: "Furlong_Customer_Version.pdf",
    requirement:
      "Furlong facilitates coordination and must not claim lender, credit bureau, underwriting, approval, denial, or eligibility authority.",
  },
  {
    code: "FREE_TIER_DARK_PATTERN",
    severity: "BLOCK",
    source: "FREE-TIER-GOV-001",
    requirement:
      "The free borrower tier must support baseline readiness and must not be positioned as a teaser, paywall, upsell trap, or degraded rights workflow.",
  },
  {
    code: "PORTABILITY_BARRIER",
    severity: "BLOCK",
    source: "PORTABILITY-GOV-001",
    requirement:
      "Borrower portability, export, review, and transport rights must not be hidden, throttled, degraded, paywalled, or made premium.",
  },
  {
    code: "BORROWER_FEE_CLAIM",
    severity: "BLOCK",
    source: "Furlong_Customer_Version.pdf",
    requirement:
      "Borrower-facing positioning must preserve that borrowers pay nothing and institutions pay for platform participation.",
  },
  {
    code: "DATA_MONETIZATION_CLAIM",
    severity: "BLOCK",
    source: "Furlong_Customer_Version.pdf",
    requirement:
      "Furlong must not claim ownership, sale, or monetization of borrower, application, loan, or personal data.",
  },
  {
    code: "SOC2_TYPE_II_OVERCLAIM",
    severity: "BLOCK",
    source: "Furlong_Customer_Version.pdf",
    requirement:
      "SOC 2 Type II must not be claimed as certified, active, or complete unless that control state is actually in place.",
  },
  {
    code: "FEDRAMP_OVERCLAIM",
    severity: "BLOCK",
    source: "Furlong_Customer_Version.pdf",
    requirement:
      "FedRAMP authorization or certification must not be claimed unless it is actually in place.",
  },
  {
    code: "FREE_TIER_BASELINE_REVIEW",
    severity: "REVIEW",
    source: "FREE-TIER-GOV-001",
    requirement:
      "Free-tier claims should reference baseline readiness, missing-document guidance, borrower rights, and export capability.",
  },
  {
    code: "PORTABILITY_RIGHTS_REVIEW",
    severity: "REVIEW",
    source: "PORTABILITY-GOV-001",
    requirement:
      "Borrower export or portability claims should preserve review, export, transport, audit, and machine-readable rights.",
  },
];

const PROHIBITED_APPROVAL_PATTERNS = [
  /\bpre[-\s]?approved\b/i,
  /\blender[-\s]?approved\b/i,
  /\bunderwriting[-\s]?approved\b/i,
  /\bapproved\s+for\s+(?:funding|financing|credit|a\s+loan)\b/i,
  /\bguaranteed\s+(?:acceptance|approval|funding|financing|eligibility)\b/i,
  /\beligible\s+for\s+(?:funding|financing|credit|a\s+loan)\b/i,
  /\bfunding[-\s]?eligible\b/i,
  /\bcredit[-\s]?worthy\b/i,
  /\bofficial\s+eligibility\b/i,
  /\bloan\s+approval\b/i,
];

const LENDER_READY_PATTERNS = [/\blender[-\s]?ready\b/i];

const VERIFICATION_PATTERNS = [
  /\bexternally\s+verified\b/i,
  /\bpublicly\s+verifiable\b/i,
  /\bverified\s+(?:report|readiness|lender\s+package|application|portfolio|profile|submission)\b/i,
  /\b(?:report|readiness|lender\s+package|application|portfolio|profile|submission)\s+verification\b/i,
  /\bpublic\s+verification\s+gateway\b/i,
  /\bcryptographically\s+(?:verified|verifiable)\s+(?:report|readiness|lender\s+package|application|portfolio|profile|submission)\b/i,
];

const AI_DECISION_PATTERNS = [
  /\bAI\b.{0,60}\b(?:approves?|denies|underwrites?|determines?\s+eligibility|makes?\s+credit\s+decisions?|scores?\s+creditworthiness)\b/i,
  /\b(?:algorithm|model|platform)\b.{0,60}\b(?:approves?|denies|underwrites?|determines?\s+eligibility|makes?\s+credit\s+decisions?)\b/i,
  /\b(?:approval|denial|underwriting|eligibility|credit\s+decision)\b.{0,60}\b(?:AI|algorithm|model)\b/i,
];

const PLATFORM_DECISION_PATTERNS = [
  /\b(?:Furlong|Ares|platform|we)\s+(?:approves?|denies|underwrites?|determines?\s+eligibility|makes?\s+credit\s+decisions?)\b/i,
  /\b(?:Furlong|Ares|platform|we)\s+(?:are|is)\s+(?:a\s+)?(?:lender|credit\s+bureau|underwriter)\b/i,
];

const FREE_TIER_DARK_PATTERN_PATTERNS = [
  /\bfree\s+(?:tier|baseline|readiness|report)\b.{0,80}\b(?:teaser|trial|upsell|unlock|paywall|premium|limited[-\s]?time)\b/i,
  /\b(?:teaser|trial|upsell|unlock|paywall|premium|limited[-\s]?time)\b.{0,80}\bfree\s+(?:tier|baseline|readiness|report)\b/i,
];

const PORTABILITY_BARRIER_PATTERNS = [
  /\b(?:export|portability|portable|transport|download)\b.{0,80}\b(?:premium|paid|paywall|upgrade|throttle|hidden|degraded|disabled)\b/i,
  /\b(?:premium|paid|paywall|upgrade|throttle|hidden|degraded|disabled)\b.{0,80}\b(?:export|portability|portable|transport|download)\b/i,
];

const BORROWER_FEE_PATTERNS = [
  /\bborrowers?\s+(?:pay|are\s+charged|will\s+be\s+charged|must\s+pay)\b/i,
  /\bcharge\s+borrowers?\b/i,
];

const BORROWER_NO_FEE_PATTERNS = [
  /\bborrowers?\s+pay\s+nothing\b/i,
  /\bno\s+borrower\s+(?:charge|fee|payment)\b/i,
  /\bborrower[-\s]?free\b/i,
];

const DATA_MONETIZATION_PATTERNS = [
  /\b(?:we|Furlong|Ares|platform)\s+(?:sell|monetize|own)\s+(?:borrower|customer|application|loan|personal)\s+(?:data|content|records?)\b/i,
  /\b(?:borrower|customer|application|loan|personal)\s+(?:data|content|records?)\s+(?:is|are)\s+(?:sold|monetized|owned\s+by\s+(?:us|Furlong|Ares|the\s+platform))\b/i,
];

const SOC2_TYPE_II_PATTERNS = [
  /\bSOC\s*2\s*Type\s*II\b.{0,60}\b(?:certified|complete|active|in\s+place|compliant)\b/i,
  /\b(?:certified|complete|active|in\s+place|compliant)\b.{0,60}\bSOC\s*2\s*Type\s*II\b/i,
];

const FEDRAMP_PATTERNS = [
  /\bFedRAMP\b.{0,60}\b(?:authorized|certified|complete|active|in\s+place|compliant)\b/i,
  /\b(?:authorized|certified|complete|active|in\s+place|compliant)\b.{0,60}\bFedRAMP\b/i,
];

const FREE_TIER_REVIEW_PATTERNS = [
  /\bfree\s+(?:tier|baseline|readiness|report)\b/i,
  /\bbaseline\s+readiness\s+report\b/i,
];

const PORTABILITY_REVIEW_PATTERNS = [
  /\b(?:borrower\s+)?(?:portability|portable|export|transport|download)\b/i,
];

const RULE_PATTERNS: RulePattern[] = [
  {
    ...rule("PROHIBITED_APPROVAL_CLAIM"),
    patterns: PROHIBITED_APPROVAL_PATTERNS,
    message:
      "This wording implies approval, eligibility, creditworthiness, underwriting approval, or guaranteed acceptance.",
    skipMatchWhen: negatedMatchContextPresent,
  },
  {
    ...rule("LENDER_READY_DISCLOSURE_REQUIRED"),
    patterns: LENDER_READY_PATTERNS,
    message:
      "Lender-ready language must include the required intake-only disclosure.",
    skipWhen: (text, context) =>
      Boolean(context.lenderReadyDisclosurePresent) ||
      lenderReadyDisclosurePresent(text),
  },
  {
    ...rule("VERIFICATION_INFRASTRUCTURE_REQUIRED"),
    patterns: VERIFICATION_PATTERNS,
    message:
      "This wording claims public or external verification before verification infrastructure is operational.",
    skipWhen: (_text, context) =>
      Boolean(
        context.publicVerificationGatewayOperational &&
          context.canonicalHashVerificationOperational
      ),
  },
  {
    ...rule("AI_DECISION_CLAIM"),
    patterns: AI_DECISION_PATTERNS,
    message:
      "This wording gives AI decision, underwriting, approval, denial, or eligibility authority.",
    skipMatchWhen: negatedMatchContextPresent,
  },
  {
    ...rule("PLATFORM_DECISION_AUTHORITY_CLAIM"),
    patterns: PLATFORM_DECISION_PATTERNS,
    message:
      "This wording gives the platform lender, underwriting, credit, approval, denial, or eligibility authority.",
    skipMatchWhen: negatedMatchContextPresent,
    skipWhen: (_text, context) => Boolean(context.officialDecisionAuthority),
  },
  {
    ...rule("FREE_TIER_DARK_PATTERN"),
    patterns: FREE_TIER_DARK_PATTERN_PATTERNS,
    message:
      "This wording turns the borrower free tier into a teaser, paywall, or upsell mechanism.",
  },
  {
    ...rule("PORTABILITY_BARRIER"),
    patterns: PORTABILITY_BARRIER_PATTERNS,
    message:
      "This wording makes borrower export, portability, review, or transport rights premium, hidden, throttled, or degraded.",
    skipMatchWhen: portabilityBarrierNegated,
  },
  {
    ...rule("BORROWER_FEE_CLAIM"),
    patterns: BORROWER_FEE_PATTERNS,
    message:
      "This wording suggests borrowers pay or are charged, conflicting with customer-facing borrower-free positioning.",
    skipWhen: (text) => containsAny(text, BORROWER_NO_FEE_PATTERNS),
  },
  {
    ...rule("DATA_MONETIZATION_CLAIM"),
    patterns: DATA_MONETIZATION_PATTERNS,
    message:
      "This wording suggests borrower/application/personal data is sold, owned, or monetized by the platform.",
  },
  {
    ...rule("SOC2_TYPE_II_OVERCLAIM"),
    patterns: SOC2_TYPE_II_PATTERNS,
    message:
      "This wording claims SOC 2 Type II is certified, active, complete, or in place.",
    skipWhen: (text, context) =>
      Boolean(context.soc2Type2Operational) || explicitNotInPlace(text),
  },
  {
    ...rule("FEDRAMP_OVERCLAIM"),
    patterns: FEDRAMP_PATTERNS,
    message:
      "This wording claims FedRAMP authorization, certification, active status, or completion.",
    skipWhen: (text, context) =>
      Boolean(context.fedRampAuthorized) || explicitNotInPlace(text),
  },
  {
    ...rule("FREE_TIER_BASELINE_REVIEW"),
    patterns: FREE_TIER_REVIEW_PATTERNS,
    message:
      "Free-tier wording should be reviewed for baseline readiness, missing-document guidance, borrower rights, and export capability.",
    skipWhen: (text, context) =>
      Boolean(context.freeTierBaselineReadinessAvailable) ||
      baselineReadinessLanguagePresent(text),
  },
  {
    ...rule("PORTABILITY_RIGHTS_REVIEW"),
    patterns: PORTABILITY_REVIEW_PATTERNS,
    message:
      "Portability wording should be reviewed for borrower review, export, transport, audit, and machine-readable rights.",
    skipWhen: (text, context) =>
      Boolean(context.borrowerPortabilityAvailable) ||
      portabilityRightsLanguagePresent(text),
  },
];

function rule(code: string): ContentClaimRule {
  const match = CONTENT_CLAIMS_REGISTRY.find((item) => item.code === code);

  if (!match) {
    throw new Error(`Missing content claim rule: ${code}`);
  }

  return match;
}

function normalizeText(value: string | string[]): string {
  const joined = Array.isArray(value) ? value.join("\n") : value;

  return joined.replace(/\s+/g, " ").trim();
}

function patternMatches(
  text: string,
  pattern: RegExp
): Array<{ matchedText: string; index: number }> {
  const flags = pattern.flags.includes("g")
    ? pattern.flags
    : `${pattern.flags}g`;
  const globalPattern = new RegExp(pattern.source, flags);
  const matches: Array<{ matchedText: string; index: number }> = [];

  for (const match of text.matchAll(globalPattern)) {
    const matchedText = match[0]?.trim();

    if (matchedText) {
      matches.push({
        matchedText,
        index: match.index ?? 0,
      });
    }
  }

  return matches;
}

function containsAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => {
    pattern.lastIndex = 0;
    return pattern.test(text);
  });
}

function explicitNotInPlace(text: string): boolean {
  return /\bnot\s+(?:yet\s+|currently\s+)?(?:in\s+place|certified|authorized|complete|active|compliant)\b/i.test(
    text
  );
}

function negatedMatchContextPresent(text: string, matchIndex: number): boolean {
  const prefix = text.slice(Math.max(0, matchIndex - 220), matchIndex);

  return (
    /\b(?:not|no|never|does\s+not\s+mean|do\s+not\s+mean|is\s+not|are\s+not|without)\b/i.test(
      prefix
    ) &&
    !/[.!?]\s*[^.!?]*(?:is|are|will\s+be|becomes?)\s*$/i.test(prefix)
  );
}

function portabilityBarrierNegated(
  text: string,
  matchIndex: number,
  matchedText: string
): boolean {
  return (
    negatedMatchContextPresent(text, matchIndex) ||
    /\b(?:without|no|not)\s+(?:a\s+)?(?:premium|paid|paywall|upgrade|throttle|hidden|degraded|disabled|barrier|dark\s+pattern)/i.test(
      matchedText
    )
  );
}

function lenderReadyDisclosurePresent(text: string): boolean {
  return (
    /\blender[-\s]?ready\b.{0,160}\bdoes\s+not\s+mean\b.{0,160}\b(?:approval|pre[-\s]?approval|creditworthiness|eligibility|funding|underwriting|guarantee)/i.test(
      text
    ) ||
    /\blender[-\s]?ready\b.{0,160}\borganized\b.{0,160}\bintake\b/i.test(
      text
    )
  );
}

function baselineReadinessLanguagePresent(text: string): boolean {
  return (
    /\bbaseline\s+readiness\b/i.test(text) &&
    /\b(?:missing[-\s]?document|document\s+guidance|borrower\s+rights?|export|portable|portability)\b/i.test(
      text
    )
  );
}

function portabilityRightsLanguagePresent(text: string): boolean {
  return (
    /\b(?:export|portable|portability|transport|machine[-\s]?readable)\b/i.test(
      text
    ) &&
    /\b(?:borrower\s+rights?|review|audit|without\s+premium|no\s+premium|not\s+premium|machine[-\s]?readable)\b/i.test(
      text
    )
  );
}

function finding(
  pattern: RulePattern,
  matchedText: string
): ContentClaimFinding {
  return {
    code: pattern.code,
    severity: pattern.severity,
    source: pattern.source,
    requirement: pattern.requirement,
    matchedText,
    message: pattern.message,
  };
}

export function evaluateContentClaims(
  input: EvaluateContentClaimsInput | string | string[]
): ContentClaimsEvaluation {
  const normalizedInput =
    typeof input === "string" || Array.isArray(input)
      ? { text: input, context: {} }
      : input;
  const text = normalizeText(normalizedInput.text);
  const context = normalizedInput.context ?? {};
  const findings: ContentClaimFinding[] = [];

  if (text.length > 0) {
    for (const pattern of RULE_PATTERNS) {
      if (pattern.skipWhen?.(text, context)) {
        continue;
      }

      for (const regex of pattern.patterns) {
        for (const match of patternMatches(text, regex)) {
          if (
            pattern.skipMatchWhen?.(text, match.index, match.matchedText)
          ) {
            continue;
          }

          findings.push(finding(pattern, match.matchedText));
        }
      }
    }
  }

  const blockCount = findings.filter(
    (item) => item.severity === "BLOCK"
  ).length;
  const reviewCount = findings.filter(
    (item) => item.severity === "REVIEW"
  ).length;

  return {
    ok: blockCount === 0,
    evaluatedAt: new Date().toISOString(),
    policyVersion: CONTENT_CLAIMS_POLICY_VERSION,
    sources: CONTENT_CLAIMS_POLICY_SOURCES,
    findingCount: findings.length,
    blockCount,
    reviewCount,
    findings,
  };
}

export function assertContentClaimsAllowed(
  input: EvaluateContentClaimsInput | string | string[]
): ContentClaimsEvaluation {
  const evaluation = evaluateContentClaims(input);

  if (!evaluation.ok) {
    const codes = evaluation.findings
      .filter((item) => item.severity === "BLOCK")
      .map((item) => item.code)
      .join(", ");

    throw new Error(`Content claims policy blocked output: ${codes}`);
  }

  return evaluation;
}
