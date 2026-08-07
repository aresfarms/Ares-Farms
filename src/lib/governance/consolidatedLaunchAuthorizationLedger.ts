export const CONSOLIDATED_LAUNCH_LEDGER_VERSION = "p6-consolidated-launch-authorization-v1";

export type HumanDecision = "PENDING" | "APPROVE" | "APPROVE_WITH_CONDITIONS" | "REJECT";

export const launchAuthorizationRequirements = [
  { blockerId: "P5-B01", title: "Named tester acceptance", authorityRoles: ["CAITLIN_NAMED_TESTER", "STUART_NAMED_TESTER"], evidencePattern: "runtime-state named tester attestations", minimumApprovals: 2 },
  { blockerId: "P5-B02", title: "Production data classification and PII authorization", authorityRoles: ["DATA_RIGHTS_OFFICER"], evidencePattern: "p5-b02-data-classification", minimumApprovals: 1 },
  { blockerId: "P5-B03", title: "Financing activation authority", authorityRoles: ["CREDIT_ELIGIBILITY_AUTHORITY", "LEGAL_COMPLIANCE_AUTHORITY"], evidencePattern: "p5-b03-financing-authority", minimumApprovals: 2 },
  { blockerId: "P5-B04", title: "Live source legal and licensing approval", authorityRoles: ["SOURCE_LEGAL_AUTHORITY"], evidencePattern: "p5-b04-source-legal", minimumApprovals: 1 },
  { blockerId: "P5-B05", title: "External connector activation", authorityRoles: ["CONNECTOR_ACTIVATION_AUTHORITY", "SECURITY_AUTHORITY"], evidencePattern: "p5-b05-connector-activation", minimumApprovals: 2 },
  { blockerId: "P5-B06", title: "Official report authority", authorityRoles: ["QUALIFIED_REPORT_AUTHORITY", "LEGAL_COMPLIANCE_AUTHORITY"], evidencePattern: "p5-b06-official-report-authority", minimumApprovals: 2 },
  { blockerId: "P5-B07", title: "Payments and treasury authorization", authorityRoles: ["TREASURY_AUTHORITY", "LEGAL_COMPLIANCE_AUTHORITY"], evidencePattern: "p5-b07-payments-treasury-authorization", minimumApprovals: 2 },
  { blockerId: "P5-B08", title: "Security and incident readiness", authorityRoles: ["SECURITY_AUTHORITY", "INCIDENT_COMMAND_AUTHORITY"], evidencePattern: "p6-security-incident", minimumApprovals: 2 },
  { blockerId: "P5-B09", title: "Database backup and recovery readiness", authorityRoles: ["DATABASE_RECOVERY_AUTHORITY", "SECURITY_AUTHORITY"], evidencePattern: "p5-b09-database-recovery", minimumApprovals: 2 },
  { blockerId: "P5-B10", title: "Domain, DNS, cutover, and final launch hold", authorityRoles: ["RELEASE_MANAGER", "RELEASE_BOARD", "FINAL_LAUNCH_AUTHORITY"], evidencePattern: "p5-b10-domain-cutover-authorization", minimumApprovals: 3 },
] as const;

export const launchAuthorizationDecisions = launchAuthorizationRequirements.flatMap((requirement) =>
  requirement.authorityRoles.map((authorityRole) => ({
    blockerId: requirement.blockerId,
    authorityRole,
    decision: "PENDING" as HumanDecision,
    decidedBy: null as string | null,
    decidedAtUtc: null as string | null,
    conditions: [] as string[],
    evidenceRef: null as string | null,
  }))
);

export const consolidatedLaunchAuthorization = {
  approvalRequired: true,
  allTechnicalEvidenceRequired: true,
  allHumanDecisionsRequired: true,
  separationOfDutiesRequired: true,
  proxyApprovalForbidden: true,
  approvalsComplete: false,
  finalLaunchHoldReleased: false,
  productionAuthorized: false,
} as const;
