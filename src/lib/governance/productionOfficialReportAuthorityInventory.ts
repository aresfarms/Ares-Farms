export const productionOfficialReportAuthorityVersion = "p5-b06-official-report-authority-v1";

export const productionOfficialReportAuthorityInventory = [
  "PROPERTY_ADVISORY_REPORT",
  "BORROWER_READINESS_REPORT",
  "EVIDENCE_PACKET",
  "ENVIRONMENTAL_REVIEW_REPORT",
  "FINANCING_PATHWAY_REPORT",
  "INSTITUTIONAL_GOVERNANCE_REPORT",
].map((reportType) => ({
  reportType,
  advisoryOnlyDisclosureRequired: true,
  qualifiedReviewerRequired: true,
  legalComplianceReviewRequired: true,
  sourceCitationRequired: true,
  provenanceRequired: true,
  dataClassificationRequired: true,
  redactionRequired: true,
  deterministicRegenerationRequired: true,
  immutableVersionRequired: true,
  cryptographicSignatureRequired: true,
  publicVerificationApprovalRequired: true,
  publicationAuthorityRequired: true,
  claimsPolicyRequired: true,
  officialRelianceApprovalRequired: true,
  publicationApproved: false,
  publicVerificationPermitted: false,
  officialReliancePermitted: false,
}));

export const productionOfficialReportAuthorization = {
  blockerId: "P5-B06",
  ownerRole: "QUALIFIED_REPORT_AUTHORITY",
  legalReviewerRole: "LEGAL_COMPLIANCE_AUTHORITY",
  approvalRequired: true,
  approvalGranted: false,
  publicationApproved: false,
  publicVerificationPermitted: false,
  officialReliancePermitted: false,
  productionAuthorized: false,
} as const;
