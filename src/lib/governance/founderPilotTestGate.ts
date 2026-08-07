import { createHash } from "node:crypto";
import type { InternalChangeVerificationReport } from "@/lib/governance/internalChangeVerification";

export const FOUNDER_PILOT_TEST_GATE_RULE =
  "TWO-FOUNDER-INTERNAL-PILOT-TEST-GATE-001" as const;

export type PilotTesterAcceptance = {
  tester: "STUART";
  decision: "GREEN_LIGHT" | "REJECT" | "RETEST_REQUIRED";
  signedAt: string;
  signatureRef: string;
  reportSha256: string;
  checklistVersion: string;
  checklistAnswers: Array<{
    itemId: string;
    answer: "YES" | "NO" | "NOT_APPLICABLE";
    note?: string;
  }>;
};

export type FounderPilotTestDecision = {
  rule: typeof FOUNDER_PILOT_TEST_GATE_RULE;
  status: "BLOCKED" | "READY_FOR_CONTROLLED_INTERNAL_PILOT";
  testingOnly: true;
  publicLaunchAllowed: false;
  externalActionsAllowed: false;
  paymentCaptureAllowed: false;
  noticeSendAllowed: false;
  officialRelianceAllowed: false;
  francisBindingRequiredForFinalLaunch: true;
  blockers: string[];
  decisionSha256: string;
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

export function evaluateFounderPilotTestGate(input: {
  report: InternalChangeVerificationReport | null;
  acceptance: PilotTesterAcceptance | null;
}): FounderPilotTestDecision {
  const blockers: string[] = [];
  const report = input.report;
  const acceptance = input.acceptance;

  if (!report) blockers.push("frozen-change-report-required");
  if (report) {
    if (!report.ownerAttestation) blockers.push("owner-attestation-required");
    if (report.evidence.changeOwner !== "CAITLIN")
      blockers.push("initial-pilot-change-owner-must-be-caitlin");
    if (report.evidence.buildStatus !== "SUCCESS") blockers.push("successful-build-required");
    if (report.evidence.tests.some((test) => test.status !== "PASS"))
      blockers.push("all-tests-must-pass");
    if (report.evidence.postReleaseChecks.some((check) => check.status === "FAIL"))
      blockers.push("post-release-regression-present");
    if (!report.evidence.rollbackProcedure.trim()) blockers.push("rollback-procedure-required");
    if (report.externalReviewRequired) blockers.push("external-review-required");
    if (report.reviewerApprovals.some((approval) => approval.decision === "REJECT"))
      blockers.push("review-rejected");
  }

  if (!acceptance) blockers.push("stuart-pilot-acceptance-required");
  else {
    if (acceptance.tester !== "STUART") blockers.push("pilot-tester-must-be-stuart");
    if (acceptance.decision !== "GREEN_LIGHT") blockers.push("pilot-not-green-lit");
    if (!acceptance.signatureRef.trim() || !Number.isFinite(Date.parse(acceptance.signedAt)))
      blockers.push("pilot-signature-invalid");
    if (report && acceptance.reportSha256 !== report.reportSha256)
      blockers.push("pilot-acceptance-stale");
    if (acceptance.checklistAnswers.some((answer) => answer.answer === "NO"))
      blockers.push("pilot-checklist-failed");
  }

  const unsigned = {
    rule: FOUNDER_PILOT_TEST_GATE_RULE,
    status: blockers.length === 0
      ? ("READY_FOR_CONTROLLED_INTERNAL_PILOT" as const)
      : ("BLOCKED" as const),
    testingOnly: true as const,
    publicLaunchAllowed: false as const,
    externalActionsAllowed: false as const,
    paymentCaptureAllowed: false as const,
    noticeSendAllowed: false as const,
    officialRelianceAllowed: false as const,
    francisBindingRequiredForFinalLaunch: true as const,
    blockers: [...new Set(blockers)].sort(),
  };
  return {
    ...unsigned,
    decisionSha256: createHash("sha256").update(stable(unsigned)).digest("hex"),
  };
}
