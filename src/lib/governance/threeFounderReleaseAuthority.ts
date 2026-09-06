import { createHash } from "node:crypto";

export const THREE_FOUNDER_RELEASE_AUTHORITY_RULE =
  "ROLE-SEPARATED-CROSS-FUNCTIONAL-RELEASE-AUTHORITY-002" as const;

export type Founder = "OWNER" | "INDEPENDENT_REVIEWER" | "FINANCE_RISK_REVIEWER" | "INDEPENDENT_FINAL_REVIEWER";
export type FounderDomain =
  | "TECHNICAL_GOVERNANCE"
  | "FINANCE_UNDERWRITING"
  | "PUBLIC_COMMUNICATIONS";

export type FounderAuthorityRecord = {
  founder: Founder;
  domain: FounderDomain;
  role:
    | "TECHNICAL_CONSTITUTIONAL_ATTESTATION"
    | "FINANCE_RELEASE_RISK_APPROVAL"
    | "PUBLIC_INDEPENDENT_FINAL_REVIEW";
  decision: "APPROVE" | "REJECT";
  signedAt: string;
  packetSha256: string;
  signatureRef: string;
};

export type ThreeFounderReleaseInput = {
  initialLaunch: boolean;
  packetSha256: string;
  changeOwner: Founder;
  affectedDomains: FounderDomain[];
  approvals: FounderAuthorityRecord[];
};

export type ThreeFounderReleaseDecision = {
  rule: typeof THREE_FOUNDER_RELEASE_AUTHORITY_RULE;
  status: "BLOCKED" | "READY_FOR_SEPARATE_ACTIVATION";
  activationPerformed: false;
  roleSeparatedInitialLaunchRequired: true;
  ownerSelfApprovalProhibited: true;
  unilateralStopAuthority: true;
  blockers: string[];
  decisionSha256: string;
};

function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${JSON.stringify(k)}:${stable(v)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

export function evaluateThreeFounderReleaseAuthority(
  input: ThreeFounderReleaseInput,
): ThreeFounderReleaseDecision {
  const blockers: string[] = [];
  const founders = new Set(input.approvals.map((a) => a.founder));

  if (input.initialLaunch && founders.size !== 3)
    blockers.push("initial-launch-requires-three-role-separated-approvals");
  const ownerRecords = input.approvals.filter((a) => a.founder === input.changeOwner);
  if (ownerRecords.some((a) => a.role !== "TECHNICAL_CONSTITUTIONAL_ATTESTATION"))
    blockers.push("change-owner-cannot-independently-approve-own-change");
  if (!input.initialLaunch && ownerRecords.length > 0)
    blockers.push("routine-change-owner-must-not-approve");
  if (input.approvals.some((a) => a.packetSha256 !== input.packetSha256))
    blockers.push("approval-packet-mismatch");
  if (input.approvals.some((a) => a.decision !== "APPROVE"))
    blockers.push("approval-rejected");
  if (input.approvals.some((a) => !a.signatureRef.trim() || !Number.isFinite(Date.parse(a.signedAt))))
    blockers.push("approval-signature-invalid");

  const roleSet = new Set(input.approvals.map((a) => a.role));
  if (input.initialLaunch && roleSet.size !== 3)
    blockers.push("cross-functional-role-coverage-incomplete");

  const unsigned = {
    rule: THREE_FOUNDER_RELEASE_AUTHORITY_RULE,
    status: blockers.length === 0
      ? ("READY_FOR_SEPARATE_ACTIVATION" as const)
      : ("BLOCKED" as const),
    activationPerformed: false as const,
    roleSeparatedInitialLaunchRequired: true as const,
    ownerSelfApprovalProhibited: true as const,
    unilateralStopAuthority: true as const,
    blockers: [...new Set(blockers)].sort(),
  };
  return {
    ...unsigned,
    decisionSha256: createHash("sha256").update(stable(unsigned)).digest("hex"),
  };
}
