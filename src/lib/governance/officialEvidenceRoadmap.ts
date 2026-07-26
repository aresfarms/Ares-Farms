export const OFFICIAL_EVIDENCE_ROADMAP_VERSION = "official-evidence-roadmap-v1";

export const OFFICIAL_EVIDENCE_SEQUENCE = Object.freeze([
  "3Q_EXTERNAL_NOTIFICATION_CONNECTOR",
  "3R_EXTERNAL_NOTIFICATION_DRY_RUN",
  "3S_EXTERNAL_NOTIFICATION_ACTIVATION",
  "3T_EXTERNAL_NOTIFICATION_DELIVERY",
  "3U_EXTERNAL_NOTIFICATION_ASSURANCE",
  "3V_EXTERNAL_NOTIFICATION_REINSTATEMENT",
  "3W_EXTERNAL_NOTIFICATION_RETIREMENT",
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
};

export function roadmapArtifactFor(step: OfficialEvidenceSequenceStep): string {
  return REQUIRED_ARTIFACT[step];
}

export function assertRoadmapTransition(input: {
  completed: readonly OfficialEvidenceSequenceStep[];
  requested: OfficialEvidenceSequenceStep;
}): void {
  const requestedIndex = OFFICIAL_EVIDENCE_SEQUENCE.indexOf(input.requested);
  if (requestedIndex < 0) throw new Error("Requested step is not in the canonical roadmap.");
  const expected = OFFICIAL_EVIDENCE_SEQUENCE.slice(0, requestedIndex);
  if (
    input.completed.length !== expected.length ||
    expected.some((step, index) => input.completed[index] !== step)
  )
    throw new Error(
      `Roadmap deviation blocked. ${input.requested} requires exact predecessor sequence: ${expected.join(" -> ")}.`,
    );
}
