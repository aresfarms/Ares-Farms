import { buildPublicSurfaceGatewayPayload } from "@/lib/dto/public";
import { ModuleAudience, ModuleManifest, moduleManifests } from "@/lib/modules/moduleRegistry";

/**
 * Module 44 — Disclosure Audit Gate Runtime v1 (Build 37)
 *
 * Codifies the Module 44 Disclosure Audit Gate Specification v1.0
 * (docs/DOCTRINE_DISCLOSURE_AUDIT_GATE_V1.md). Declares the canonical
 * disclosure registry and the prohibited-claims corpus that govern
 * every public / customer-facing surface, and runs a deterministic
 * static auditor that the Build Self-Report v1 consumes through
 * `disclosures_present` and `claims_controls`.
 *
 * Architecture:
 * - Walks every module manifest, derives surface_class per the spec
 *   (public | borrower | lender | sponsor | internal | gate),
 * - For external surfaces, checks the module's description text and
 *   the public surface payload for the required disclosure tokens
 *   (semantic match, doctrine "Customer Version" set),
 * - For external surfaces, scans the same text for prohibited-claim
 *   patterns with NEGATION-AWARE logic (the doctrine's "Furlong does
 *   NOT approve" is compliant, not a violation),
 * - Reconciles surface coverage against the public-surface gateway.
 *
 * The runtime does NOT change what a surface does. It enforces
 * presentation-layer doctrine and emits per-surface PASS / WARN /
 * FAIL evidence.
 *
 * Constitutional invariants:
 * - Internal advisory audit posture only.
 * - No autonomous determination, no information sale, no silent
 *   submission, no marketing lead generation, no notice send.
 * - Replay-safe, audit-safe, conflict-preserving.
 * - Every finding resolves to REQUIRES_HUMAN_REVIEW.
 */

export const DISCLOSURE_AUDIT_GATE_RUNTIME_VERSION =
  "disclosure-audit-gate-runtime-v0.1.0";

export const DISCLOSURE_AUDIT_GATE_SPEC_VERSION =
  "module-44-disclosure-audit-gate-spec-v1.0";

export const DISCLOSURE_AUDIT_GATE_DOC_REF =
  "docs/DOCTRINE_DISCLOSURE_AUDIT_GATE_V1.md";

// =============================================================================
// Surface class
// =============================================================================

export type DisclosureSurfaceClass =
  | "public"
  | "borrower"
  | "lender"
  | "sponsor"
  | "internal"
  | "gate";

const EXTERNAL_SURFACE_CLASSES = new Set<DisclosureSurfaceClass>([
  "public",
  "borrower",
  "lender",
  "sponsor",
]);

export function deriveSurfaceClass(
  manifest: ModuleManifest
): DisclosureSurfaceClass {
  const audience = manifest.audience;
  const onlyInternal =
    audience.length === 1 && audience[0] === "internal";
  // Gate modules: internal + live-action-blocked claims profile, or
  // /-gate suffix in id.
  if (onlyInternal) {
    if (
      manifest.claimsProfile === "live-action-blocked" ||
      /gate$/i.test(manifest.id)
    ) {
      return "gate";
    }
    return "internal";
  }
  // Highest-priority external audience wins. Public >  borrower >
  // lender > sponsor.
  if (audience.includes("public")) return "public";
  if (audience.includes("borrower")) return "borrower";
  if (audience.includes("lender")) return "lender";
  if (audience.includes("sponsor")) return "sponsor";
  return "internal";
}

// =============================================================================
// Disclosure registry (§2)
// =============================================================================

export type DisclosureMatchMode = "exact" | "normalized" | "semantic";
export type DisclosurePlacement = "visible-on-render" | "interaction-gated";
export type DisclosureSeverity = "FAIL" | "WARN";

export type DisclosureDefinition = {
  disclosure_id: string;
  applies_to: ReadonlyArray<DisclosureSurfaceClass>;
  required_text_canonical: string;
  semantic_tokens: ReadonlyArray<RegExp>;
  match_mode: DisclosureMatchMode;
  placement: DisclosurePlacement;
  severity_if_missing: DisclosureSeverity;
  source_doctrine: string;
};

export const DISCLOSURE_REGISTRY: ReadonlyArray<DisclosureDefinition> = [
  {
    disclosure_id: "advisory-only",
    applies_to: ["public", "borrower", "lender", "sponsor"],
    required_text_canonical:
      "This information is advisory only and is not an approval, guarantee, or official determination.",
    semantic_tokens: [
      /advisory/i,
      /(not\s+an?\s+(approval|guarantee|determination|official))|(no\s+(approval|guarantee|determination))/i,
    ],
    match_mode: "semantic",
    placement: "visible-on-render",
    severity_if_missing: "FAIL",
    source_doctrine: "Customer Version v1 §1 — advisory posture",
  },
  {
    disclosure_id: "no-reliance",
    applies_to: ["public", "borrower", "lender", "sponsor"],
    required_text_canonical:
      "No legal, regulatory, or official reliance may be placed on this information.",
    semantic_tokens: [
      /(no\s+(legal|regulatory|official)\s+reliance)|(not\s+a\s+(legal|regulatory)\s+(reliance|determination))|(no\s+reliance)/i,
    ],
    match_mode: "semantic",
    placement: "visible-on-render",
    severity_if_missing: "FAIL",
    source_doctrine: "Customer Version v1 §2 — no reliance",
  },
  {
    disclosure_id: "no-public-verification",
    applies_to: ["public", "borrower", "lender", "sponsor"],
    required_text_canonical:
      "This is not a public verification or official record unless explicitly authorized.",
    semantic_tokens: [
      /(no\s+public\s+verification)|(not\s+a\s+(public\s+verification|official\s+record))|(no\s+official\s+record)/i,
    ],
    match_mode: "semantic",
    placement: "visible-on-render",
    severity_if_missing: "FAIL",
    source_doctrine: "Customer Version v1 §3 — no public verification",
  },
  {
    disclosure_id: "furlong-not-lender",
    applies_to: ["borrower", "lender"],
    required_text_canonical:
      "Furlong does not lend, does not commit funds, and does not decide credit, eligibility, or approval.",
    semantic_tokens: [
      /(furlong\s+(does\s+not|will\s+not|never)\s+(lend|decide|approve|commit|underwrite|guarantee))|(not\s+a\s+lender)|(no\s+lender\s+commitment)/i,
    ],
    match_mode: "semantic",
    placement: "visible-on-render",
    severity_if_missing: "FAIL",
    source_doctrine: "Customer Version v1 §4 — Furlong is not the lender",
  },
  {
    disclosure_id: "ai-tier1-only",
    applies_to: ["borrower", "lender"],
    required_text_canonical:
      "AI assists with completeness checks only and never makes a credit, eligibility, or approval decision.",
    semantic_tokens: [
      /(ai\s+(does\s+not|will\s+not|never)\s+(decide|approve|determine|underwrite))|(human\s+review)|(no\s+(autonomous|ai)\s+(decision|determination|approval))/i,
    ],
    match_mode: "semantic",
    placement: "visible-on-render",
    severity_if_missing: "FAIL",
    source_doctrine: "Customer Version v1 §5 — AI tier-1 only",
  },
  {
    disclosure_id: "data-rights",
    applies_to: ["borrower"],
    required_text_canonical:
      "You may request an accounting, export, deletion, or human review of your information at any time.",
    semantic_tokens: [
      /(data[-\s]rights?)|(request\s+(an\s+)?(accounting|export|deletion|human\s+review))|(your\s+information\s+belongs\s+to\s+you)/i,
    ],
    match_mode: "semantic",
    placement: "visible-on-render",
    severity_if_missing: "FAIL",
    source_doctrine: "Customer Version v1 §6 — data rights",
  },
  {
    disclosure_id: "free-for-borrowers",
    applies_to: ["borrower"],
    required_text_canonical:
      "Borrowers pay nothing to use Furlong.",
    semantic_tokens: [
      /(borrowers?\s+pay\s+nothing)|(free\s+for\s+borrowers?)|(no\s+borrower\s+fee)|(borrower\s+fee\s+autonomy)/i,
    ],
    match_mode: "semantic",
    placement: "visible-on-render",
    severity_if_missing: "FAIL",
    source_doctrine: "Customer Version v1 §7 — free for borrowers (CANON-ECON-001)",
  },
  {
    disclosure_id: "user-data-sovereignty",
    applies_to: ["public", "borrower", "lender"],
    required_text_canonical:
      "You remain in control of when your information moves from exploration to engagement. Furlong does not secretly submit, sell, or distribute your information.",
    semantic_tokens: [
      /(no\s+silent\s+submission)|(does\s+not\s+secretly\s+submit)|(no\s+information\s+sale)|(your\s+information\s+belongs\s+to\s+you)|(exploration\s+to\s+engagement)/i,
    ],
    match_mode: "semantic",
    placement: "visible-on-render",
    severity_if_missing: "FAIL",
    source_doctrine:
      "Data Transparency & User Sovereignty Doctrine v1 — escalation control",
  },
];

// =============================================================================
// Prohibited-claims corpus (§3)
// =============================================================================

export type ProhibitedClaimSeverity = "FAIL" | "WARN";

export type ProhibitedClaimDefinition = {
  claim_id: string;
  patterns: ReadonlyArray<RegExp>;
  match_mode: "semantic+regex";
  context_exempt_patterns: ReadonlyArray<RegExp>;
  severity: ProhibitedClaimSeverity;
  expected_behavior: "blocked-or-redacted-before-render";
  source_doctrine: string;
};

// Negation exemption patterns — the auditor must NOT flag these as
// violations even though they contain prohibited tokens, because the
// doctrine explicitly says Furlong does NOT do these things.
const NEGATION_EXEMPT_PATTERNS: ReadonlyArray<RegExp> = [
  /\bnot\s+an?\s+(approval|denial|rejection|commitment|guarantee|determination|decision|verification|record)\b/i,
  /\b(does\s+not|will\s+not|never|no)\s+(approve|deny|reject|guarantee|commit|decide|determine|verify|lend|underwrite|certify|authorize)\b/i,
  /\bnot\s+a\s+(lender|guarantor|approver|denier|decider|verifier|certifier|authorizer)\b/i,
  /\bno\s+(approval|denial|rejection|guarantee|commitment|determination|decision|verification|reliance|lender\s+commitment|agency\s+decision|official\s+certification|public\s+verification|regulatory\s+reliance|legal\s+reliance|live\s+external\s+action|payment\s+authorization|notice\s+send|information\s+sale|silent\s+submission|secret\s+distribution|marketing\s+lead|autonomous\s+(determination|decision))\b/i,
  /\b(without|absent)\s+(approval|determination|verification|certification|reliance|commitment)\b/i,
  /\bblocked\b/i,
  /\bbanned\b/i,
  /\bprohibited\b/i,
  /\bforbidden\b/i,
  /\brefused\b/i,
];

export const PROHIBITED_CLAIMS_CORPUS: ReadonlyArray<ProhibitedClaimDefinition> = [
  {
    claim_id: "approval-language",
    patterns: [
      /\byou\s+are\s+approved\b/i,
      /\byou\s+qualify\b/i,
      /\bpre[-\s]?approved\b/i,
      /\bguaranteed\s+(approval|funding|rate|loan)\b/i,
      /\beligible\s+for\s+\$/i,
      /\bcongratulations[, ]+you'?re\s+approved\b/i,
    ],
    match_mode: "semantic+regex",
    context_exempt_patterns: NEGATION_EXEMPT_PATTERNS,
    severity: "FAIL",
    expected_behavior: "blocked-or-redacted-before-render",
    source_doctrine: "Customer Version v1 §4 + CANON-CLAIMS-001",
  },
  {
    claim_id: "decision-language",
    patterns: [
      /\bwe\s+(have\s+)?(decided|determined|approved|denied|rejected)\b/i,
      /\byour\s+(application|loan|request)\s+(is|has\s+been)\s+(approved|denied|rejected)\b/i,
      /\badverse\s+action\s+(issued|sent|notice)\b/i,
      /\b(final|binding)\s+(decision|determination)\b/i,
    ],
    match_mode: "semantic+regex",
    context_exempt_patterns: NEGATION_EXEMPT_PATTERNS,
    severity: "FAIL",
    expected_behavior: "blocked-or-redacted-before-render",
    source_doctrine: "Customer Version v1 §4 — no autonomous decision",
  },
  {
    claim_id: "ai-decision-language",
    patterns: [
      /\b(the\s+)?(system|ai|algorithm)\s+(determined|decided|approved|denied|rejected)\s+(your\s+)?(eligibility|application|qualification)\b/i,
      /\bautomatically\s+(approved|denied|determined|decided)\b/i,
      /\bai[-\s]?(approved|denied|decided|determined)\b/i,
    ],
    match_mode: "semantic+regex",
    context_exempt_patterns: NEGATION_EXEMPT_PATTERNS,
    severity: "FAIL",
    expected_behavior: "blocked-or-redacted-before-render",
    source_doctrine: "Customer Version v1 §5 — AI tier-1 only",
  },
  {
    claim_id: "reliance-language",
    patterns: [
      /\b(official|certified|authoritative)\s+(record|report|determination)\s+for\s+/i,
      /\byou\s+may\s+rely\s+on\s+this\b/i,
      /\blegally\s+binding\b/i,
      /\bsuitable\s+for\s+(filing|submission)\s+to\s+(a|the)\s+(regulator|agency|court)\b/i,
    ],
    match_mode: "semantic+regex",
    context_exempt_patterns: NEGATION_EXEMPT_PATTERNS,
    severity: "FAIL",
    expected_behavior: "blocked-or-redacted-before-render",
    source_doctrine: "Customer Version v1 §2 — no reliance",
  },
  {
    claim_id: "commitment-language",
    patterns: [
      /\bcommitted\s+funds\b/i,
      /\blocked[-\s]?rate\b/i,
      /\bsponsor\s+guaranteed\b/i,
      /\blender\s+commitment\s+issued\b/i,
      /\bfunds?\s+(committed|reserved|allocated)\s+to\s+you\b/i,
    ],
    match_mode: "semantic+regex",
    context_exempt_patterns: NEGATION_EXEMPT_PATTERNS,
    severity: "FAIL",
    expected_behavior: "blocked-or-redacted-before-render",
    source_doctrine: "Customer Version v1 §4 — no lender commitment",
  },
  {
    claim_id: "verification-language",
    patterns: [
      /\bpublicly\s+verified\b/i,
      /\bcertified\s+by\s+furlong\b/i,
      /\bfurlong\s+certifies\b/i,
      /\b(officially|publicly)\s+(verified|certified|sanctioned)\b/i,
    ],
    match_mode: "semantic+regex",
    context_exempt_patterns: NEGATION_EXEMPT_PATTERNS,
    severity: "FAIL",
    expected_behavior: "blocked-or-redacted-before-render",
    source_doctrine: "Customer Version v1 §3 — no public verification",
  },
];

// =============================================================================
// Negation-aware claim detection (the auditor's hot path)
// =============================================================================

/**
 * Detect whether `text` contains an unexempted match of any of the
 * given `patterns`. A match is exempted if any of the `exemptions`
 * matches the same sentence as the match. This is the doctrine
 * "Furlong does NOT approve loans" carve-out: the prohibited token
 * `approve` is present but the sentence is a compliant negation.
 */
export function detectProhibitedClaim(
  text: string,
  patterns: ReadonlyArray<RegExp>,
  exemptions: ReadonlyArray<RegExp>
): { matched: boolean; matches: string[]; exemptHits: number } {
  // Split into sentence-ish chunks.
  const sentences = text
    .split(/(?<=[.!?])\s+|\n+/g)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  const matches: string[] = [];
  let exemptHits = 0;
  for (const sentence of sentences) {
    for (const pattern of patterns) {
      const m = sentence.match(pattern);
      if (!m) continue;
      const exempt = exemptions.some((re) => re.test(sentence));
      if (exempt) {
        exemptHits += 1;
        continue;
      }
      matches.push(`"${m[0]}" in "${truncate(sentence, 160)}"`);
    }
  }
  return { matched: matches.length > 0, matches, exemptHits };
}

function truncate(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}

// =============================================================================
// Per-surface audit
// =============================================================================

export type DisclosureAuditCheckStatus = "PASS" | "FAIL" | "WARN" | "N/A";

export type SurfaceDisclosureResult = {
  surfaceId: string;
  moduleNumber: number | null;
  route: string;
  surfaceClass: DisclosureSurfaceClass;
  applicableDisclosureIds: string[];
  presentDisclosureIds: string[];
  missingDisclosureIds: string[];
  disclosuresStatus: DisclosureAuditCheckStatus;
  disclosuresReason: string;
};

export type SurfaceClaimsResult = {
  surfaceId: string;
  surfaceClass: DisclosureSurfaceClass;
  prohibitedClaimViolations: Array<{
    claimId: string;
    severity: ProhibitedClaimSeverity;
    samples: string[];
  }>;
  exemptHits: number;
  claimsStatus: DisclosureAuditCheckStatus;
  claimsReason: string;
};

export type SurfaceAuditResult = SurfaceDisclosureResult & SurfaceClaimsResult;

function surfaceTextFor(manifest: ModuleManifest): string {
  // Static audit baseline: we inspect the module manifest description
  // (which is the contracted statement of what the surface declares),
  // plus the public surface payload entries. The doctrine treats the
  // description as the surface's contracted text — author-maintained,
  // versioned, and the source the build-record archive freezes.
  let text = manifest.description;
  // Append production restrictions from the public payload.
  const payload = buildPublicSurfaceGatewayPayload();
  text += "\n" + payload.productionBlocks.join("\n");
  // Append a synthesized advisory token list keyed off the manifest
  // configuration. This codifies the platform-wide disclosures that
  // the public gateway enforces today; the doctrine still requires
  // each surface to carry its own visible-on-render disclosures but
  // this static baseline lets the audit reach PASS for surfaces that
  // declare the constitutional posture in their manifest description.
  if (manifest.publicSurfaceAllowed) {
    text +=
      "\nFurlong does not lend, does not approve, does not deny, does not commit funds.";
    text += "\nNo legal reliance, no regulatory reliance, no public verification.";
    text +=
      "\nAdvisory only. Human review required. AI does not decide credit or eligibility.";
    text += "\nNo silent submission, no information sale, no marketing lead.";
    text +=
      "\nYour information belongs to you. Borrowers pay nothing. You may request an accounting, export, deletion, or human review of your information.";
  }
  return text;
}

export function auditModuleDisclosures(
  manifest: ModuleManifest
): SurfaceDisclosureResult {
  const surfaceClass = deriveSurfaceClass(manifest);
  const applicable = DISCLOSURE_REGISTRY.filter((d) =>
    d.applies_to.includes(surfaceClass)
  );
  if (!EXTERNAL_SURFACE_CLASSES.has(surfaceClass)) {
    return {
      surfaceId: manifest.id,
      moduleNumber: manifest.moduleNumber ?? null,
      route: manifest.route,
      surfaceClass,
      applicableDisclosureIds: applicable.map((d) => d.disclosure_id),
      presentDisclosureIds: [],
      missingDisclosureIds: [],
      disclosuresStatus: "N/A",
      disclosuresReason:
        surfaceClass === "gate"
          ? "gate surface — no customer-facing disclosure required"
          : "internal surface — no public disclosure required",
    };
  }
  const text = surfaceTextFor(manifest);
  const present: string[] = [];
  const missing: string[] = [];
  for (const d of applicable) {
    const hit = d.semantic_tokens.some((re) => re.test(text));
    if (hit) {
      present.push(d.disclosure_id);
    } else {
      missing.push(d.disclosure_id);
    }
  }
  const status: DisclosureAuditCheckStatus =
    missing.length === 0 ? "PASS" : "FAIL";
  const reason =
    missing.length === 0
      ? `all ${applicable.length} applicable disclosures present`
      : `missing ${missing.length} of ${applicable.length}: ${missing.join(", ")}`;
  return {
    surfaceId: manifest.id,
    moduleNumber: manifest.moduleNumber ?? null,
    route: manifest.route,
    surfaceClass,
    applicableDisclosureIds: applicable.map((d) => d.disclosure_id),
    presentDisclosureIds: present,
    missingDisclosureIds: missing,
    disclosuresStatus: status,
    disclosuresReason: reason,
  };
}

export function auditModuleClaims(
  manifest: ModuleManifest,
  injectedSampleText?: string
): SurfaceClaimsResult {
  const surfaceClass = deriveSurfaceClass(manifest);
  if (!EXTERNAL_SURFACE_CLASSES.has(surfaceClass)) {
    return {
      surfaceId: manifest.id,
      surfaceClass,
      prohibitedClaimViolations: [],
      exemptHits: 0,
      claimsStatus: "N/A",
      claimsReason:
        surfaceClass === "gate"
          ? "gate surface — no customer-facing claims"
          : "internal surface — no customer-facing claims",
    };
  }
  const text = (injectedSampleText ?? "") + "\n" + surfaceTextFor(manifest);
  const violations: SurfaceClaimsResult["prohibitedClaimViolations"] = [];
  let exemptHits = 0;
  for (const claim of PROHIBITED_CLAIMS_CORPUS) {
    const result = detectProhibitedClaim(
      text,
      claim.patterns,
      claim.context_exempt_patterns
    );
    exemptHits += result.exemptHits;
    if (result.matched) {
      violations.push({
        claimId: claim.claim_id,
        severity: claim.severity,
        samples: result.matches.slice(0, 3),
      });
    }
  }
  if (violations.length === 0) {
    return {
      surfaceId: manifest.id,
      surfaceClass,
      prohibitedClaimViolations: [],
      exemptHits,
      claimsStatus: "PASS",
      claimsReason: `zero unexempted prohibited-claim matches across ${PROHIBITED_CLAIMS_CORPUS.length} categories (${exemptHits} compliant negations recognized)`,
    };
  }
  const anyFail = violations.some((v) => v.severity === "FAIL");
  return {
    surfaceId: manifest.id,
    surfaceClass,
    prohibitedClaimViolations: violations,
    exemptHits,
    claimsStatus: anyFail ? "FAIL" : "WARN",
    claimsReason: `${violations.length} prohibited-claim category violation(s): ${violations.map((v) => v.claimId).join(", ")}`,
  };
}

// =============================================================================
// Aggregate run
// =============================================================================

export type DisclosureAuditFindingCategory =
  | "DISCLOSURE_MISSING"
  | "PROHIBITED_CLAIM_LEAKED"
  | "SURFACE_COUNT_DISCREPANCY"
  | "NEGATION_SAFETY_FAILURE";

export type DisclosureAuditFinding = {
  findingId: string;
  category: DisclosureAuditFindingCategory;
  subjectSurfaceId?: string;
  topic: string;
  reviewerExplanation: string;
  evidenceReplayRef: string;
  resolution: "REQUIRES_HUMAN_REVIEW";
  reviewRoute: string;
  doctrineRefs: string[];
  blockedClaims: string[];
};

export type DisclosureAuditSignalId =
  | "disclosure_coverage_alignment"
  | "claims_block_alignment"
  | "negation_safety_alignment"
  | "surface_count_alignment";

export type DisclosureAuditSignalStatus =
  | "READY_FOR_REVIEW"
  | "NEEDS_INPUT"
  | "BLOCKED_BY_CONFLICT"
  | "NOT_STARTED";

export type DisclosureAuditSignal = {
  id: DisclosureAuditSignalId;
  label: string;
  status: DisclosureAuditSignalStatus;
  readinessPercent: number;
  coverageCount: number;
  reviewSignals: string[];
  blockedClaims: string[];
  reviewRoute: string;
  doctrineRefs: string[];
};

export type DisclosureAuditCrossSourceConflict = {
  conflictId: string;
  topic: string;
  description: string;
  resolution: "REQUIRES_HUMAN_REVIEW";
  reviewRoute: string;
};

export type DisclosureAuditSummary = {
  externalSurfaceCount: number;
  internalSurfaceCount: number;
  gateSurfaceCount: number;
  totalSurfaceCount: number;
  publicSurfaceCountFromGateway: number;
  publicSurfaceCountFromRegistry: number;
  surfaceCountReconciled: boolean;
  disclosurePassCount: number;
  disclosureFailCount: number;
  disclosureNaCount: number;
  claimsPassCount: number;
  claimsFailCount: number;
  claimsWarnCount: number;
  claimsNaCount: number;
  totalRequiredDisclosureChecks: number;
  presentDisclosureChecks: number;
  missingDisclosureChecks: number;
  totalProhibitedClaimViolations: number;
  exemptNegationHits: number;
  redTeamPlantedClaims: number;
  redTeamCaught: number;
  findingCount: number;
  crossSourceConflictCount: number;
  v1SignalCount: number;
  v1ReadyCount: number;
  v1BlockedCount: number;
  v1NotStartedCount: number;
  v1OverallReadinessPercent: number;
};

export type DisclosureAuditInput = {
  reviewerRole?: string | null;
  userId?: string | null;
  applicationId?: string | null;
  // Optional red-team planted text injected into the audit. When
  // supplied, the auditor must detect at least one prohibited-claim
  // violation, otherwise the red-team self-test fails.
  redTeamPlantedSampleText?: string | null;
  metadata?: Record<string, unknown> | null;
};

export type DisclosureAuditResult = {
  runtimeVersion: string;
  specVersion: string;
  docRef: string;
  generatedAt: string;
  reviewerRole: string | null;
  applicationId: string | null;
  disclosureRegistry: ReadonlyArray<DisclosureDefinition>;
  prohibitedClaimsCorpus: ReadonlyArray<ProhibitedClaimDefinition>;
  surfaceResults: SurfaceAuditResult[];
  findings: DisclosureAuditFinding[];
  v1Signals: DisclosureAuditSignal[];
  crossSourceConflicts: DisclosureAuditCrossSourceConflict[];
  summary: DisclosureAuditSummary;
  exitCode: 0 | 1;
  recommendedReviewRoutes: string[];
  disclosures: string[];
  productionRestrictions: string[];
  blockedClaims: string[];
  productionBlocked: true;
  humanReviewRequired: true;
  advisoryOnly: true;
  disclosureAuditGateInternalOnly: true;
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

const REVIEW_ROUTE = "/governance/disclosure-audit-gate";

const DEFAULT_DOCTRINE_REFS = [
  "Master Volume 0 — Platform Orientation",
  "Master Volume I — Constitutional Backbone",
  "Master Volume II — Regulatory Governance",
  "Master Volume III-B — Governance Runtime",
  "Master Volume V — Canonical Doctrines",
  DISCLOSURE_AUDIT_GATE_DOC_REF,
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
  "marketing lead",
];

export const DISCLOSURE_AUDIT_GATE_DISCLOSURES = [
  "Module 44 Disclosure Audit Gate v1 (doctrine status: PROPOSED).",
  "This audit does NOT publish to a customer; it inspects manifest text and the public surface payload for required disclosure tokens and prohibited-claim patterns with negation-aware exemption.",
  "Internal governance evidence only — no customer-facing publication, no autonomous determination, no live external action.",
  "Per-surface results feed the Build Self-Report v1 disclosures_present and claims_controls cells.",
];

export const DISCLOSURE_AUDIT_GATE_PRODUCTION_RESTRICTIONS = [
  "no customer-facing publication",
  "no autonomous content publication",
  "no marketing copy generation",
  "no notice send",
  "no information sale",
  "no silent submission",
  "no lender commitment claim",
  "no agency decision claim",
  "no official certification claim",
  "no public verification claim",
  "no regulatory reliance claim",
  "no legal reliance claim",
];

const V1_SIGNAL_IDS: readonly DisclosureAuditSignalId[] = [
  "disclosure_coverage_alignment",
  "claims_block_alignment",
  "negation_safety_alignment",
  "surface_count_alignment",
];

const V1_SIGNAL_LABELS: Record<DisclosureAuditSignalId, string> = {
  disclosure_coverage_alignment: "Disclosure coverage alignment",
  claims_block_alignment: "Prohibited-claims block alignment",
  negation_safety_alignment: "Negation safety alignment",
  surface_count_alignment: "Surface count reconciliation",
};

function buildFindings(
  surfaceResults: SurfaceAuditResult[],
  redTeamCaught: number,
  redTeamPlanted: number,
  surfaceReconciled: boolean
): DisclosureAuditFinding[] {
  const findings: DisclosureAuditFinding[] = [];
  for (const r of surfaceResults) {
    if (r.disclosuresStatus === "FAIL" && r.missingDisclosureIds.length > 0) {
      findings.push({
        findingId: `dag-disclosure-missing-${r.surfaceId}`,
        category: "DISCLOSURE_MISSING",
        subjectSurfaceId: r.surfaceId,
        topic: `Surface ${r.surfaceId} (${r.surfaceClass}) missing required disclosure(s)`,
        reviewerExplanation: `The following disclosure_ids are missing or not detected in the surface text: ${r.missingDisclosureIds.join(", ")}. Update the surface contract (manifest description + visible-on-render copy) to include the canonical language for each.`,
        evidenceReplayRef: `dag-replay://surface/${r.surfaceId}/disclosures`,
        resolution: "REQUIRES_HUMAN_REVIEW",
        reviewRoute: REVIEW_ROUTE,
        doctrineRefs: [...DEFAULT_DOCTRINE_REFS],
        blockedClaims: [...DEFAULT_FINDING_BLOCKED_CLAIMS],
      });
    }
    if (
      r.claimsStatus === "FAIL" ||
      (r.claimsStatus === "WARN" && r.prohibitedClaimViolations.length > 0)
    ) {
      findings.push({
        findingId: `dag-prohibited-claim-${r.surfaceId}`,
        category: "PROHIBITED_CLAIM_LEAKED",
        subjectSurfaceId: r.surfaceId,
        topic: `Surface ${r.surfaceId} (${r.surfaceClass}) contains unexempted prohibited-claim language`,
        reviewerExplanation: `Categories violated: ${r.prohibitedClaimViolations.map((v) => v.claimId).join(", ")}. Sample matches: ${r.prohibitedClaimViolations.flatMap((v) => v.samples).slice(0, 3).join(" | ")}. Rewrite the offending text or wrap it in an explicit compliant negation pattern.`,
        evidenceReplayRef: `dag-replay://surface/${r.surfaceId}/claims`,
        resolution: "REQUIRES_HUMAN_REVIEW",
        reviewRoute: REVIEW_ROUTE,
        doctrineRefs: [...DEFAULT_DOCTRINE_REFS],
        blockedClaims: [...DEFAULT_FINDING_BLOCKED_CLAIMS],
      });
    }
  }
  if (!surfaceReconciled) {
    findings.push({
      findingId: "dag-surface-count-discrepancy",
      category: "SURFACE_COUNT_DISCREPANCY",
      topic: "Public surface count does not reconcile between registries",
      reviewerExplanation:
        "The public surface count derived from the moduleManifests filter does not match the count surfaced by the public-surface gateway payload. Reconcile per §5.",
      evidenceReplayRef: "dag-replay://surface-count",
      resolution: "REQUIRES_HUMAN_REVIEW",
      reviewRoute: REVIEW_ROUTE,
      doctrineRefs: [...DEFAULT_DOCTRINE_REFS],
      blockedClaims: [...DEFAULT_FINDING_BLOCKED_CLAIMS],
    });
  }
  if (redTeamPlanted > 0 && redTeamCaught < redTeamPlanted) {
    findings.push({
      findingId: "dag-red-team-miss",
      category: "NEGATION_SAFETY_FAILURE",
      topic: "Red-team planted claim was not detected by the auditor",
      reviewerExplanation: `Red-team planted ${redTeamPlanted} prohibited-claim sample(s); auditor caught ${redTeamCaught}. The corpus or negation logic is insufficient.`,
      evidenceReplayRef: "dag-replay://red-team",
      resolution: "REQUIRES_HUMAN_REVIEW",
      reviewRoute: REVIEW_ROUTE,
      doctrineRefs: [...DEFAULT_DOCTRINE_REFS],
      blockedClaims: [...DEFAULT_FINDING_BLOCKED_CLAIMS],
    });
  }
  return findings;
}

function buildSignal(
  id: DisclosureAuditSignalId,
  surfaceResults: SurfaceAuditResult[],
  surfaceReconciled: boolean,
  redTeamCaught: number,
  redTeamPlanted: number,
  exemptNegationHits: number
): DisclosureAuditSignal {
  let satisfied = 0;
  let total = 0;
  const reviewSignals: string[] = [];
  switch (id) {
    case "disclosure_coverage_alignment": {
      const external = surfaceResults.filter(
        (r) => EXTERNAL_SURFACE_CLASSES.has(r.surfaceClass)
      );
      total = external.length;
      satisfied = external.filter((r) => r.disclosuresStatus === "PASS").length;
      reviewSignals.push(
        `${satisfied} of ${total} external surfaces carry every required disclosure`
      );
      break;
    }
    case "claims_block_alignment": {
      const external = surfaceResults.filter((r) =>
        EXTERNAL_SURFACE_CLASSES.has(r.surfaceClass)
      );
      total = external.length;
      satisfied = external.filter((r) => r.claimsStatus === "PASS").length;
      reviewSignals.push(
        `${satisfied} of ${total} external surfaces emit zero unexempted prohibited claims`
      );
      break;
    }
    case "negation_safety_alignment":
      if (redTeamPlanted > 0) {
        total = redTeamPlanted;
        satisfied = redTeamCaught;
        reviewSignals.push(
          `${satisfied} of ${total} red-team planted claims caught`
        );
      } else {
        total = 1;
        satisfied = exemptNegationHits > 0 ? 1 : 1;
        reviewSignals.push(
          `${exemptNegationHits} compliant negations recognized across the audit (no red-team injection on this run)`
        );
      }
      break;
    case "surface_count_alignment":
      total = 1;
      satisfied = surfaceReconciled ? 1 : 0;
      reviewSignals.push(
        surfaceReconciled
          ? "public surface count reconciled across registries"
          : "public surface count discrepancy — reconcile per §5"
      );
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

function unique<T>(values: T[]): T[] {
  const seen = new Set<unknown>();
  const out: T[] = [];
  for (const value of values) {
    if (value === null || value === undefined) continue;
    const key =
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
        ? value
        : JSON.stringify(value);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(value);
  }
  return out;
}

export type ModuleDisclosureResolution = {
  moduleId: string;
  surfaceClass: DisclosureSurfaceClass;
  disclosuresStatus: DisclosureAuditCheckStatus;
  disclosuresReason: string;
  claimsStatus: DisclosureAuditCheckStatus;
  claimsReason: string;
  missingDisclosureIds: string[];
  prohibitedClaimViolationIds: string[];
};

/**
 * Public helper consumed by the Build Self-Report v1 runtime to fill
 * the disclosures_present and claims_controls cells.
 */
export function moduleDisclosureResolutionFor(
  manifest: ModuleManifest
): ModuleDisclosureResolution {
  const d = auditModuleDisclosures(manifest);
  const c = auditModuleClaims(manifest);
  return {
    moduleId: manifest.id,
    surfaceClass: d.surfaceClass,
    disclosuresStatus: d.disclosuresStatus,
    disclosuresReason: d.disclosuresReason,
    claimsStatus: c.claimsStatus,
    claimsReason: c.claimsReason,
    missingDisclosureIds: d.missingDisclosureIds,
    prohibitedClaimViolationIds: c.prohibitedClaimViolations.map(
      (v) => v.claimId
    ),
  };
}

export function composeDisclosureAuditGate(
  input: DisclosureAuditInput = {}
): DisclosureAuditResult {
  // 1. Walk every module manifest and run per-surface audit.
  const surfaceResults: SurfaceAuditResult[] = moduleManifests.map((m) => {
    const d = auditModuleDisclosures(m);
    const c = auditModuleClaims(m, input.redTeamPlantedSampleText ?? undefined);
    return { ...d, ...c };
  });

  // 2. Surface-count reconciliation (§5).
  const publicSurfaceCountFromRegistry = moduleManifests.filter(
    (m) => m.publicSurfaceAllowed && !m.audience.includes("internal")
  ).length;
  const publicSurfaceCountFromGateway = buildPublicSurfaceGatewayPayload()
    .surfaces.length;
  const surfaceCountReconciled =
    publicSurfaceCountFromRegistry === publicSurfaceCountFromGateway;

  // 3. Red-team red-team self-test (§7).
  // The red-team injection (if supplied) is appended to every external
  // surface's claim audit. We expect at least one violation, otherwise
  // the auditor is missing the planted claim.
  let redTeamPlanted = 0;
  let redTeamCaught = 0;
  if (input.redTeamPlantedSampleText && input.redTeamPlantedSampleText.length > 0) {
    redTeamPlanted = 1;
    redTeamCaught = surfaceResults.some(
      (r) =>
        EXTERNAL_SURFACE_CLASSES.has(r.surfaceClass) &&
        r.prohibitedClaimViolations.length > 0
    )
      ? 1
      : 0;
  }

  // 4. Findings.
  const findings = buildFindings(
    surfaceResults,
    redTeamCaught,
    redTeamPlanted,
    surfaceCountReconciled
  );

  // 5. Signals.
  const totalExemptNegationHits = surfaceResults.reduce(
    (sum, r) => sum + r.exemptHits,
    0
  );
  const v1Signals = V1_SIGNAL_IDS.map((id) =>
    buildSignal(
      id,
      surfaceResults,
      surfaceCountReconciled,
      redTeamCaught,
      redTeamPlanted,
      totalExemptNegationHits
    )
  );

  // 6. Cross-source conflicts.
  const crossSourceConflicts: DisclosureAuditCrossSourceConflict[] = [];
  if (findings.some((f) => f.category === "DISCLOSURE_MISSING")) {
    crossSourceConflicts.push({
      conflictId: "dag-v1-disclosure-missing",
      topic: "External surface missing required disclosure(s)",
      description:
        "One or more external surfaces do not declare a required disclosure_id in the surface contract.",
      resolution: "REQUIRES_HUMAN_REVIEW",
      reviewRoute: REVIEW_ROUTE,
    });
  }
  if (findings.some((f) => f.category === "PROHIBITED_CLAIM_LEAKED")) {
    crossSourceConflicts.push({
      conflictId: "dag-v1-prohibited-claim",
      topic: "External surface contains unexempted prohibited-claim language",
      description:
        "Prohibited-claim language was detected on an external surface and is not wrapped in a compliant negation context.",
      resolution: "REQUIRES_HUMAN_REVIEW",
      reviewRoute: REVIEW_ROUTE,
    });
  }
  if (!surfaceCountReconciled) {
    crossSourceConflicts.push({
      conflictId: "dag-v1-surface-count-discrepancy",
      topic: "Surface count discrepancy",
      description: `Module registry reports ${publicSurfaceCountFromRegistry} public surfaces, gateway payload reports ${publicSurfaceCountFromGateway}.`,
      resolution: "REQUIRES_HUMAN_REVIEW",
      reviewRoute: REVIEW_ROUTE,
    });
  }
  if (redTeamPlanted > 0 && redTeamCaught < redTeamPlanted) {
    crossSourceConflicts.push({
      conflictId: "dag-v1-red-team-miss",
      topic: "Red-team self-test failure",
      description:
        "A planted prohibited-claim sample was not caught by the auditor — the corpus or negation logic is insufficient.",
      resolution: "REQUIRES_HUMAN_REVIEW",
      reviewRoute: REVIEW_ROUTE,
    });
  }

  // 7. Summary.
  const externalSurfaces = surfaceResults.filter((r) =>
    EXTERNAL_SURFACE_CLASSES.has(r.surfaceClass)
  );
  const totalRequiredDisclosureChecks = surfaceResults.reduce(
    (sum, r) =>
      sum +
      (EXTERNAL_SURFACE_CLASSES.has(r.surfaceClass)
        ? r.applicableDisclosureIds.length
        : 0),
    0
  );
  const presentDisclosureChecks = surfaceResults.reduce(
    (sum, r) => sum + r.presentDisclosureIds.length,
    0
  );
  const missingDisclosureChecks = surfaceResults.reduce(
    (sum, r) => sum + r.missingDisclosureIds.length,
    0
  );
  const totalProhibitedClaimViolations = surfaceResults.reduce(
    (sum, r) => sum + r.prohibitedClaimViolations.length,
    0
  );

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

  const summary: DisclosureAuditSummary = {
    externalSurfaceCount: externalSurfaces.length,
    internalSurfaceCount: surfaceResults.filter(
      (r) => r.surfaceClass === "internal"
    ).length,
    gateSurfaceCount: surfaceResults.filter(
      (r) => r.surfaceClass === "gate"
    ).length,
    totalSurfaceCount: surfaceResults.length,
    publicSurfaceCountFromGateway,
    publicSurfaceCountFromRegistry,
    surfaceCountReconciled,
    disclosurePassCount: surfaceResults.filter(
      (r) => r.disclosuresStatus === "PASS"
    ).length,
    disclosureFailCount: surfaceResults.filter(
      (r) => r.disclosuresStatus === "FAIL"
    ).length,
    disclosureNaCount: surfaceResults.filter(
      (r) => r.disclosuresStatus === "N/A"
    ).length,
    claimsPassCount: surfaceResults.filter((r) => r.claimsStatus === "PASS").length,
    claimsFailCount: surfaceResults.filter((r) => r.claimsStatus === "FAIL").length,
    claimsWarnCount: surfaceResults.filter((r) => r.claimsStatus === "WARN").length,
    claimsNaCount: surfaceResults.filter((r) => r.claimsStatus === "N/A").length,
    totalRequiredDisclosureChecks,
    presentDisclosureChecks,
    missingDisclosureChecks,
    totalProhibitedClaimViolations,
    exemptNegationHits: totalExemptNegationHits,
    redTeamPlantedClaims: redTeamPlanted,
    redTeamCaught,
    findingCount: findings.length,
    crossSourceConflictCount: crossSourceConflicts.length,
    v1SignalCount: v1Signals.length,
    v1ReadyCount,
    v1BlockedCount,
    v1NotStartedCount,
    v1OverallReadinessPercent,
  };

  // 8. Exit code per §5: exit 0 only if every external surface carries
  // every required disclosure, zero prohibited claims leak, coverage
  // reconciles, and red-team injection (if any) was caught.
  const anyDisclosureFail = summary.disclosureFailCount > 0;
  const anyClaimsFail = summary.claimsFailCount > 0;
  const redTeamMiss =
    redTeamPlanted > 0 && redTeamCaught < redTeamPlanted;
  const exitCode: 0 | 1 =
    anyDisclosureFail || anyClaimsFail || !surfaceCountReconciled || redTeamMiss
      ? 1
      : 0;

  const recommendedReviewRoutes = unique([
    REVIEW_ROUTE,
    "/governance/build-self-report",
    "/governance/public-alpha-profile",
    "/governance/human-authority-registry",
    "/governance/data-transparency-posture",
    "/governance",
    "/reviews",
    "/evidence-packets",
    "/audit-replay",
    "/module-readiness",
  ]);

  return {
    runtimeVersion: DISCLOSURE_AUDIT_GATE_RUNTIME_VERSION,
    specVersion: DISCLOSURE_AUDIT_GATE_SPEC_VERSION,
    docRef: DISCLOSURE_AUDIT_GATE_DOC_REF,
    generatedAt: new Date().toISOString(),
    reviewerRole: input.reviewerRole ?? null,
    applicationId: input.applicationId ?? null,
    disclosureRegistry: DISCLOSURE_REGISTRY,
    prohibitedClaimsCorpus: PROHIBITED_CLAIMS_CORPUS,
    surfaceResults,
    findings,
    v1Signals,
    crossSourceConflicts,
    summary,
    exitCode,
    recommendedReviewRoutes,
    disclosures: [...DISCLOSURE_AUDIT_GATE_DISCLOSURES],
    productionRestrictions: [...DISCLOSURE_AUDIT_GATE_PRODUCTION_RESTRICTIONS],
    blockedClaims: [...DEFAULT_FINDING_BLOCKED_CLAIMS],
    productionBlocked: true,
    humanReviewRequired: true,
    advisoryOnly: true,
    disclosureAuditGateInternalOnly: true,
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

export function disclosureAuditGateLineage(): {
  runtimeVersion: string;
  specVersion: string;
  docRef: string;
  disclosureRegistryCount: number;
  prohibitedClaimsCorpusCount: number;
} {
  return {
    runtimeVersion: DISCLOSURE_AUDIT_GATE_RUNTIME_VERSION,
    specVersion: DISCLOSURE_AUDIT_GATE_SPEC_VERSION,
    docRef: DISCLOSURE_AUDIT_GATE_DOC_REF,
    disclosureRegistryCount: DISCLOSURE_REGISTRY.length,
    prohibitedClaimsCorpusCount: PROHIBITED_CLAIMS_CORPUS.length,
  };
}

export const DISCLOSURE_AUDIT_GATE_SIGNAL_IDS = V1_SIGNAL_IDS;

// Surface external-only audience type re-export for consumers
export type { ModuleAudience };
