import { createHash } from "node:crypto";

export const INTERNAL_CHANGE_VERIFICATION_RULE =
  "CROSS-FUNCTIONAL-INTERNAL-CHANGE-VERIFICATION-001" as const;

export type ChangeDomain = "TECHNICAL_GOVERNANCE" | "FINANCE_UNDERWRITING" | "PUBLIC_COMMUNICATIONS";
export type FounderPrincipal = "CAITLIN" | "STUART" | "FRANCIS";
export type VerificationStatus =
  | "BLOCKED"
  | "VERIFIED_WITH_LIMITATIONS"
  | "READY_FOR_CROSS_FUNCTIONAL_APPROVAL"
  | "APPROVED_FOR_ACTIVATION";

export type MachineEvidence = {
  requestId: string;
  requestVersion: string;
  requirementText: string;
  successCriteria: string[];
  changeOwner: FounderPrincipal;
  domain: ChangeDomain;
  commitSha: string;
  imageDigest: string;
  buildId: string;
  buildStatus: "SUCCESS" | "FAILURE";
  changedComponents: string[];
  affectedRoutes: string[];
  affectedPermissions: string[];
  databaseChanges: string[];
  configurationChanges: string[];
  tests: Array<{ name: string; status: "PASS" | "FAIL"; evidenceRef: string }>;
  securityFindings: string[];
  knownLimitations: string[];
  unverifiedClaims: string[];
  rollbackImageDigest: string;
  rollbackProcedure: string;
  releaseInvariants: string[];
  postReleaseChecks: Array<{ name: string; status: "PASS" | "FAIL" | "PENDING" }>;
};

export type PlainLanguageSummary = {
  whatChanged: string;
  whyItChanged: string;
  whoIsAffected: string;
  whatTestsProved: string[];
  whatTestsDidNotProve: string[];
  principalRisks: string[];
  rollbackExplanation: string;
};

export type OwnerAttestation = {
  principal: FounderPrincipal;
  signedAt: string;
  signatureRef: string;
  statement: string;
  reportSha256: string;
};

export type ReviewerApproval = {
  principal: FounderPrincipal;
  role: "REQUESTER_ACCEPTANCE" | "INDEPENDENT_REVIEW";
  decision: "APPROVE" | "REJECT" | "EXTERNAL_REVIEW_REQUIRED";
  checklistVersion: string;
  checklistAnswers: Array<{ itemId: string; answer: "YES" | "NO" | "NOT_APPLICABLE"; note?: string }>;
  signedAt: string;
  signatureRef: string;
  reportSha256: string;
};

export type InternalChangeVerificationInput = {
  evidence: MachineEvidence;
  summary: PlainLanguageSummary;
  ownerAttestation?: OwnerAttestation | null;
  reviewerApprovals?: ReviewerApproval[];
};

export type InternalChangeVerificationReport = {
  rule: typeof INTERNAL_CHANGE_VERIFICATION_RULE;
  status: VerificationStatus;
  activationAllowed: boolean;
  externalReviewRequired: boolean;
  evidence: MachineEvidence;
  summary: PlainLanguageSummary;
  requiredReviewers: FounderPrincipal[];
  checklistOverlay: string[];
  ownerAttestation: OwnerAttestation | null;
  reviewerApprovals: ReviewerApproval[];
  blockers: string[];
  reportSha256: string;
};

const REVIEWERS: Record<ChangeDomain, FounderPrincipal[]> = {
  TECHNICAL_GOVERNANCE: ["STUART", "FRANCIS"],
  FINANCE_UNDERWRITING: ["CAITLIN", "FRANCIS"],
  PUBLIC_COMMUNICATIONS: ["CAITLIN", "STUART"],
};

const CHECKLISTS: Record<ChangeDomain, string[]> = {
  TECHNICAL_GOVERNANCE: [
    "financial-and-underwriting-effects-disclosed",
    "user-visible-behavior-matches-report",
    "permissions-data-and-security-impact-disclosed",
    "rollback-is-specific-and-usable",
    "public-claims-do-not-overstate-capability",
    "unverified-areas-are-clearly-stated",
  ],
  FINANCE_UNDERWRITING: [
    "calculation-and-assumption-changes-disclosed",
    "authority-and-source-lineage-preserved",
    "borrower-and-lender-effects-explained",
    "no-approval-eligibility-or-commitment-overclaim",
    "historical-records-and-regressions-preserved",
    "public-language-is-clear-and-not-misleading",
  ],
  PUBLIC_COMMUNICATIONS: [
    "public-behavior-matches-request",
    "financial-representations-are-accurate",
    "claims-and-disclosures-are-clear",
    "accessibility-and-navigation-effects-reviewed",
    "privacy-and-internal-identifiers-remain-protected",
    "screens-or-user-flow-evidence-supports-the-change",
  ],
};

function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, child]) => `${JSON.stringify(key)}:${stable(child)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function sha(value: unknown): string {
  return createHash("sha256").update(stable(value)).digest("hex");
}

function validDigest(value: string): boolean {
  return /^sha256:[a-f0-9]{64}$/.test(value);
}

function validDate(value: string): boolean {
  return Number.isFinite(Date.parse(value));
}

function unsignedPayload(input: InternalChangeVerificationInput) {
  return {
    rule: INTERNAL_CHANGE_VERIFICATION_RULE,
    evidence: input.evidence,
    summary: input.summary,
    requiredReviewers: REVIEWERS[input.evidence.domain],
    checklistOverlay: CHECKLISTS[input.evidence.domain],
  };
}

export function internalChangeReportHash(input: InternalChangeVerificationInput): string {
  return sha(unsignedPayload(input));
}

export function buildInternalChangeVerificationReport(
  input: InternalChangeVerificationInput,
): InternalChangeVerificationReport {
  const reportSha256 = internalChangeReportHash(input);
  const reviewers = REVIEWERS[input.evidence.domain];
  const approvals = input.reviewerApprovals ?? [];
  const blockers: string[] = [];

  if (!input.evidence.requestId.trim() || !input.evidence.requirementText.trim())
    blockers.push("frozen-request-missing");
  if (!/^[a-f0-9]{7,64}$/.test(input.evidence.commitSha)) blockers.push("commit-sha-invalid");
  if (!validDigest(input.evidence.imageDigest)) blockers.push("image-digest-invalid");
  if (!validDigest(input.evidence.rollbackImageDigest)) blockers.push("rollback-image-invalid");
  if (input.evidence.buildStatus !== "SUCCESS") blockers.push("build-not-successful");
  if (input.evidence.tests.some((test) => test.status !== "PASS")) blockers.push("test-failure");
  if (input.evidence.postReleaseChecks.some((check) => check.status === "FAIL")) blockers.push("post-release-regression");
  if (input.evidence.releaseInvariants.length === 0) blockers.push("release-invariants-missing");
  if (!input.summary.whatChanged.trim() || !input.summary.whatTestsDidNotProve.length)
    blockers.push("plain-language-assurance-incomplete");

  const owner = input.ownerAttestation ?? null;
  if (!owner) blockers.push("owner-attestation-missing");
  else {
    if (owner.principal !== input.evidence.changeOwner) blockers.push("owner-attestation-principal-mismatch");
    if (owner.reportSha256 !== reportSha256) blockers.push("owner-attestation-stale");
    if (!owner.signatureRef.trim() || !validDate(owner.signedAt)) blockers.push("owner-attestation-invalid");
  }

  for (const reviewer of reviewers) {
    const matches = approvals.filter((approval) => approval.principal === reviewer);
    if (matches.length !== 1) blockers.push(`review-${reviewer.toLowerCase()}-missing-or-duplicate`);
  }
  if (approvals.some((approval) => approval.principal === input.evidence.changeOwner))
    blockers.push("implementer-cannot-independently-approve");

  for (const approval of approvals) {
    if (!reviewers.includes(approval.principal)) blockers.push(`unauthorized-reviewer:${approval.principal}`);
    if (approval.reportSha256 !== reportSha256) blockers.push(`stale-signature:${approval.principal}`);
    if (!approval.signatureRef.trim() || !validDate(approval.signedAt)) blockers.push(`invalid-signature:${approval.principal}`);
    if (approval.decision === "REJECT") blockers.push(`review-rejected:${approval.principal}`);
    if (approval.checklistAnswers.some((answer) => answer.answer === "NO"))
      blockers.push(`checklist-failed:${approval.principal}`);
  }

  const externalReviewRequired = approvals.some(
    (approval) => approval.decision === "EXTERNAL_REVIEW_REQUIRED",
  );
  if (externalReviewRequired) blockers.push("external-review-required");

  const limitations = input.evidence.knownLimitations.length > 0 || input.evidence.unverifiedClaims.length > 0;
  const completeApprovals = reviewers.every((reviewer) =>
    approvals.some(
      (approval) =>
        approval.principal === reviewer &&
        approval.decision === "APPROVE" &&
        approval.reportSha256 === reportSha256,
    ),
  );

  let status: VerificationStatus = "BLOCKED";
  if (blockers.length === 0 && completeApprovals) status = "APPROVED_FOR_ACTIVATION";
  else if (
    blockers.every((blocker) =>
      blocker.startsWith("review-") || blocker === "owner-attestation-missing",
    )
  ) status = limitations ? "VERIFIED_WITH_LIMITATIONS" : "READY_FOR_CROSS_FUNCTIONAL_APPROVAL";

  return {
    rule: INTERNAL_CHANGE_VERIFICATION_RULE,
    status,
    activationAllowed: status === "APPROVED_FOR_ACTIVATION",
    externalReviewRequired,
    evidence: input.evidence,
    summary: input.summary,
    requiredReviewers: reviewers,
    checklistOverlay: CHECKLISTS[input.evidence.domain],
    ownerAttestation: owner,
    reviewerApprovals: approvals,
    blockers: [...new Set(blockers)].sort(),
    reportSha256,
  };
}
