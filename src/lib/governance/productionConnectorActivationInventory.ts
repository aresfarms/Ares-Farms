import { listCanonicalExternalSources } from "@/lib/connectors/connectorSourceRegistry";

export const productionConnectorActivationVersion = "p5-b05-connector-activation-v1";

export const productionConnectorActivationInventory = listCanonicalExternalSources().map((source) => ({
  connectorId: source.id,
  sourceName: source.sourceName,
  sourceType: source.sourceType,
  authorityLevel: source.authorityLevel,
  sourceVersion: source.sourceVersion,
  allowedQueryTypes: [...source.allowedQueryTypes],
  adapterCertificationRequired: true,
  credentialVaultRequired: true,
  schemaContractRequired: true,
  provenanceRequired: true,
  deterministicReplayRequired: true,
  monitoringAndAlertingRequired: true,
  rollbackPlanRequired: true,
  killSwitchRequired: true,
  incidentRunbookRequired: true,
  dataClassificationRequired: true,
  sourceLegalApprovalRequired: true,
  qualifiedHumanApprovalRequired: true,
  liveExecutionApproved: false,
  liveExecutionPermitted: false,
}));

export const productionConnectorActivationAuthorization = {
  blockerId: "P5-B05",
  ownerRole: "QUALIFIED_GOVERNANCE_REVIEWER",
  approvalRequired: true,
  approvalGranted: false,
  certifiedAdaptersApproved: false,
  monitoringApproved: false,
  rollbackApproved: false,
  killSwitchApproved: false,
  liveExternalExecutionPermitted: false,
  productionAuthorized: false,
} as const;
