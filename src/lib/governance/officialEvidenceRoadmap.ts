export const OFFICIAL_EVIDENCE_ROADMAP_VERSION = "official-evidence-roadmap-v34";

export const OFFICIAL_EVIDENCE_SEQUENCE = Object.freeze([
  "3Q_EXTERNAL_NOTIFICATION_CONNECTOR",
  "3R_EXTERNAL_NOTIFICATION_DRY_RUN",
  "3S_EXTERNAL_NOTIFICATION_ACTIVATION",
  "3T_EXTERNAL_NOTIFICATION_DELIVERY",
  "3U_EXTERNAL_NOTIFICATION_ASSURANCE",
  "3V_EXTERNAL_NOTIFICATION_REINSTATEMENT",
  "3W_EXTERNAL_NOTIFICATION_RETIREMENT",
  "3X_EXTERNAL_NOTIFICATION_RETIREMENT_CLOSURE",
  "3Y_EXTERNAL_NOTIFICATION_RETIREMENT_TOMBSTONE",
  "3Z_EXTERNAL_NOTIFICATION_TOMBSTONE_INCIDENT",
  "4A_EXTERNAL_NOTIFICATION_CORRECTIVE_ACTION",
  "4B_EXTERNAL_NOTIFICATION_CORRECTIVE_ACTION_EFFECTIVENESS",
  "4C_EXTERNAL_NOTIFICATION_INSTITUTIONAL_CLOSURE",
  "4D_CONTROLLED_PROMOTION_READINESS_RECONCILIATION",
  "4E_PUBLIC_ALPHA_SIGNOFF_CEREMONY_PACKET",
  "4F_GOVERNED_EVIDENCE_REVIEW_PORTAL",
  "4G_INSTITUTIONAL_CREDENTIAL_VERIFICATION",
  "4H_INSTITUTIONAL_ABAC_FIELD_DISCLOSURE",
  "4I_COMPELLED_DISCLOSURE_DUAL_CONTROL",
  "4J_INSTITUTIONAL_ACCESS_SURVEILLANCE",
  "4K_INSTITUTIONAL_ACCESS_RUNTIME_ENFORCEMENT",
  "4L_INSTITUTIONAL_ACCESS_SURVEILLANCE_ORCHESTRATION",
  "4M_INSTITUTIONAL_SURVEILLANCE_ACTIVATION_CEREMONY",
  "4N_INSTITUTIONAL_SURVEILLANCE_CANARY_RELEASE",
  "4O_INSTITUTIONAL_SURVEILLANCE_SCHEDULER_PROVISIONING",
  "4P_GOVERNED_ULTIMATE_PROFORMA",
  "4Q_FEDERAL_LOAN_AUTHORITY_CONTINUOUS_MONITOR",
  "4R_FEDERAL_LOAN_AUTHORITY_AUTOMATIC_RECONCILIATION",
  "4S_FEDERAL_LOAN_AUTHORITY_REFRESH_RELIABILITY",
  "4T_FEDERAL_LOAN_AUTHORITY_CHANGE_TRIAGE",
  "4U_CONTROLLED_PUBLIC_SURFACE_PROMOTION",
  "4V_PRODUCTION_PROMOTION_READINESS",
  "4W_FINAL_PRODUCTION_PROMOTION_DECISION_PACKET",
  "4X_CROSS_FUNCTIONAL_INTERNAL_CHANGE_VERIFICATION",
  "4Y_THREE_FOUNDER_RELEASE_AUTHORITY",
  "4Z_FOUNDER_CHANGE_REVIEW_WORKSPACE",
  "5A_TWO_FOUNDER_INTERNAL_PILOT_GATE",
  "5B_CUSTOMER_PROPERTY_EXPERIENCE_RECONSTRUCTION",
  "5C_INTEGRATED_PRE_PROMOTION_FEATURE_VERIFICATION",
  "5D_THREE_LANE_CONSUMER_COMMAND_CENTER",
] as const);

export type OfficialEvidenceSequenceStep =
  (typeof OFFICIAL_EVIDENCE_SEQUENCE)[number];

const REQUIRED_ARTIFACT: Record<OfficialEvidenceSequenceStep, string> = {
  "3Q_EXTERNAL_NOTIFICATION_CONNECTOR":
    "src/lib/property/officialEvidenceExternalNotificationConnector.ts",
  "3R_EXTERNAL_NOTIFICATION_DRY_RUN":
    "src/lib/property/officialEvidenceExternalNotificationDryRun.ts",
  "3S_EXTERNAL_NOTIFICATION_ACTIVATION":
    "src/lib/property/officialEvidenceExternalNotificationActivation.ts",
  "3T_EXTERNAL_NOTIFICATION_DELIVERY":
    "src/lib/property/officialEvidenceExternalNotificationDelivery.ts",
  "3U_EXTERNAL_NOTIFICATION_ASSURANCE":
    "src/lib/property/officialEvidenceExternalNotificationAssurance.ts",
  "3V_EXTERNAL_NOTIFICATION_REINSTATEMENT":
    "src/lib/property/officialEvidenceExternalNotificationReinstatement.ts",
  "3W_EXTERNAL_NOTIFICATION_RETIREMENT":
    "src/lib/property/officialEvidenceExternalNotificationRetirement.ts",
  "3X_EXTERNAL_NOTIFICATION_RETIREMENT_CLOSURE":
    "src/lib/property/officialEvidenceExternalNotificationRetirementClosure.ts",
  "3Y_EXTERNAL_NOTIFICATION_RETIREMENT_TOMBSTONE":
    "src/lib/property/officialEvidenceExternalNotificationRetirementTombstone.ts",
  "3Z_EXTERNAL_NOTIFICATION_TOMBSTONE_INCIDENT":
    "src/lib/property/officialEvidenceExternalNotificationTombstoneIncident.ts",
  "4A_EXTERNAL_NOTIFICATION_CORRECTIVE_ACTION":
    "src/lib/property/officialEvidenceExternalNotificationCorrectiveAction.ts",
  "4B_EXTERNAL_NOTIFICATION_CORRECTIVE_ACTION_EFFECTIVENESS":
    "src/lib/property/officialEvidenceExternalNotificationCorrectiveActionEffectiveness.ts",
  "4C_EXTERNAL_NOTIFICATION_INSTITUTIONAL_CLOSURE":
    "src/lib/property/officialEvidenceExternalNotificationInstitutionalClosure.ts",
  "4D_CONTROLLED_PROMOTION_READINESS_RECONCILIATION":
    "src/lib/governance/controlledPromotionReadinessReconciliation.ts",
  "4E_PUBLIC_ALPHA_SIGNOFF_CEREMONY_PACKET":
    "src/lib/governance/publicAlphaSignoffCeremonyPacket.ts",
  "4F_GOVERNED_EVIDENCE_REVIEW_PORTAL":
    "src/lib/governance/governedEvidenceReviewPortal.ts",
  "4G_INSTITUTIONAL_CREDENTIAL_VERIFICATION":
    "src/lib/governance/institutionalCredentialVerification.ts",
  "4H_INSTITUTIONAL_ABAC_FIELD_DISCLOSURE":
    "src/lib/governance/institutionalAbacDisclosure.ts",
  "4I_COMPELLED_DISCLOSURE_DUAL_CONTROL":
    "src/lib/governance/compelledDisclosureCeremony.ts",
  "4J_INSTITUTIONAL_ACCESS_SURVEILLANCE":
    "src/lib/governance/institutionalAccessSurveillance.ts",
  "4K_INSTITUTIONAL_ACCESS_RUNTIME_ENFORCEMENT":
    "src/lib/governance/institutionalAccessRuntimeEnforcement.ts",
  "4L_INSTITUTIONAL_ACCESS_SURVEILLANCE_ORCHESTRATION":
    "src/lib/governance/institutionalAccessSurveillanceOrchestrator.ts",
  "4M_INSTITUTIONAL_SURVEILLANCE_ACTIVATION_CEREMONY":
    "src/lib/governance/institutionalAccessSurveillanceActivationCeremony.ts",
  "4N_INSTITUTIONAL_SURVEILLANCE_CANARY_RELEASE":
    "src/lib/governance/institutionalAccessSurveillanceCanaryRelease.ts",
  "4O_INSTITUTIONAL_SURVEILLANCE_SCHEDULER_PROVISIONING":
    "src/lib/governance/institutionalAccessSurveillanceSchedulerProvisioning.ts",
  "4P_GOVERNED_ULTIMATE_PROFORMA":
    "src/lib/governance/governedUltimateProforma.ts",
  "4Q_FEDERAL_LOAN_AUTHORITY_CONTINUOUS_MONITOR":
    "src/lib/governance/federalLoanAuthorityMonitor.ts",
  "4R_FEDERAL_LOAN_AUTHORITY_AUTOMATIC_RECONCILIATION":
    "src/lib/governance/federalLoanAuthorityReconciliation.ts",
  "4S_FEDERAL_LOAN_AUTHORITY_REFRESH_RELIABILITY":
    "src/scripts/verifyFederalLoanAuthorityRefreshReliability.ts",
  "4T_FEDERAL_LOAN_AUTHORITY_CHANGE_TRIAGE":
    "src/lib/governance/federalLoanAuthorityChangeTriage.ts",
  "4U_CONTROLLED_PUBLIC_SURFACE_PROMOTION":
    "src/scripts/verifyControlledPublicSurfacePromotion.ts",
  "4V_PRODUCTION_PROMOTION_READINESS":
    "src/lib/governance/productionPromotionReadiness.ts",
  "4W_FINAL_PRODUCTION_PROMOTION_DECISION_PACKET":
    "src/lib/governance/finalProductionPromotionDecisionPacket.ts",
  "4X_CROSS_FUNCTIONAL_INTERNAL_CHANGE_VERIFICATION":
    "src/lib/governance/internalChangeVerification.ts",
  "4Y_THREE_FOUNDER_RELEASE_AUTHORITY":
    "src/lib/governance/threeFounderReleaseAuthority.ts",
  "4Z_FOUNDER_CHANGE_REVIEW_WORKSPACE":
    "src/lib/governance/founderChangeReviewStore.ts",
  "5A_TWO_FOUNDER_INTERNAL_PILOT_GATE":
    "src/lib/governance/founderPilotTestGate.ts",
  "5B_CUSTOMER_PROPERTY_EXPERIENCE_RECONSTRUCTION":
    "src/scripts/verifyCustomerPropertyExperience.ts",
  "5C_INTEGRATED_PRE_PROMOTION_FEATURE_VERIFICATION":
    "src/scripts/verifyIntegratedPrePromotionFeatureSuite.ts",
  "5D_THREE_LANE_CONSUMER_COMMAND_CENTER":
    "src/scripts/verifyThreeLaneConsumerCommandCenter.ts",
};

export function roadmapArtifactFor(step: OfficialEvidenceSequenceStep): string {
  return REQUIRED_ARTIFACT[step];
}

export function assertRoadmapTransition(input: {
  completed: readonly OfficialEvidenceSequenceStep[];
  requested: OfficialEvidenceSequenceStep;
}): void {
  const requestedIndex = OFFICIAL_EVIDENCE_SEQUENCE.indexOf(input.requested);
  if (requestedIndex < 0)
    throw new Error("Requested step is not in the canonical roadmap.");
  const expected = OFFICIAL_EVIDENCE_SEQUENCE.slice(0, requestedIndex);
  if (
    input.completed.length !== expected.length ||
    expected.some((step, index) => input.completed[index] !== step)
  )
    throw new Error(
      `Roadmap deviation blocked. ${input.requested} requires exact predecessor sequence: ${expected.join(" -> ")}.`,
    );
}
