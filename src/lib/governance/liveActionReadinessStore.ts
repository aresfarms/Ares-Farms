import { eq } from "drizzle-orm";

import {
  borrowerNoticeProviderExecutions,
  externalConnectorExecutions,
  liveActionReadinessReviews,
  paymentConnectorExecutions,
} from "@/db/schema";
import { db } from "@/lib/db";

/**
 * Canonical Live Action Readiness Runtime
 *
 * Master Volume Governance:
 * - Vol I: Requires accountable authority before live action promotion.
 * - Vol II: Keeps regulatory, borrower, tenant, billing, and notice
 *   protections intact before live external action.
 * - Vol III: Produces deterministic, replay-safe readiness records before
 *   live connector calls, notice sends, or payment capture.
 * - Vol IV: Requires runbook, rollback, monitoring, incident response,
 *   dry-run, and audit evidence before promotion.
 * - Vol V: Enforces source authority, classification, replay, observability,
 *   consent, isolation, controlled disclosure, and evidence preservation.
 */

const GOVERNANCE_VERSION = "master-volumes-runtime-v0.1.0";
const CLASSIFICATION = "RESTRICTED";
const LIVE_ACTION_READINESS_SOURCE =
  "live-action-readiness-runtime";

export type LiveActionType =
  | "EXTERNAL_CONNECTOR_CALL"
  | "NOTICE_PROVIDER_SEND"
  | "PAYMENT_PROCESSOR_CAPTURE";

export type LiveActionReadinessInput = {
  traceId: string;
  actionType?: string | null;
  targetExecutionId?: string | null;
  tenantId?: string | null;
  actorId?: string | null;
  productionCredentialVaultRef?: string | null;
  liveAdapterImplementationRef?: string | null;
  productionRunbookApprovalRef?: string | null;
  dryRunEvidenceRef?: string | null;
  rollbackPlanRef?: string | null;
  incidentResponsePlanRef?: string | null;
  monitoringPlanRef?: string | null;
  auditEvidenceExportRef?: string | null;
  humanApprovalRef?: string | null;
  metadata?: Record<string, unknown>;
};

export type LiveActionReadinessTargetScope = {
  actionType: LiveActionType;
  targetExecutionId: string;
  tenantId: string | null;
  applicationId: string | null;
  borrowerId: string | null;
};

export type LiveActionReadinessGates = Record<string, boolean>;

export type LiveActionReadinessResult = {
  review: typeof liveActionReadinessReviews.$inferSelect;
  gates: LiveActionReadinessGates;
  blockerReasons: string[];
  readyForLiveAction: boolean;
  readinessStatus: string;
};

type TargetSnapshot = {
  actionType: LiveActionType;
  targetExecutionId: string;
  targetAdapterId: string | null;
  targetProviderId: string | null;
  targetSourceId: string | null;
  targetTenantId: string | null;
  targetApplicationId: string | null;
  targetBorrowerId: string | null;
  targetBillingEventId: string | null;
  targetSessionId: string | null;
  executionAuthorizationAllowed: boolean;
  liveActionNotPreviouslyPerformed: boolean;
  credentialApproved: boolean;
  outagePolicyTested: boolean;
  replayPolicyVerified: boolean;
  schemaContractVerified: boolean;
  consentVerified: boolean;
  isolationVerified: boolean;
  operationalRunbookApproved: boolean;
  domainSpecificControlsSatisfied: boolean;
  regulatedDecisionImpactAllowed: boolean;
  externalActionPerformed: boolean;
  liveActionPerformed: boolean;
  metadata: Record<string, unknown>;
};

function normalizeText(value: unknown): string | null {
  if (typeof value !== "string") {
    return value === null || value === undefined ? null : String(value);
  }

  const normalized = value.trim();

  return normalized.length > 0 ? normalized : null;
}

function normalizeRequiredText(value: unknown, label: string): string {
  const normalized = normalizeText(value);

  if (!normalized) {
    throw new Error(`${label} is required.`);
  }

  return normalized;
}

function normalizeActionType(value: unknown): LiveActionType {
  const normalized = normalizeRequiredText(value, "actionType").toUpperCase();
  const allowed = new Set<LiveActionType>([
    "EXTERNAL_CONNECTOR_CALL",
    "NOTICE_PROVIDER_SEND",
    "PAYMENT_PROCESSOR_CAPTURE",
  ]);

  if (!allowed.has(normalized as LiveActionType)) {
    throw new Error(
      "actionType must be EXTERNAL_CONNECTOR_CALL, NOTICE_PROVIDER_SEND, or PAYMENT_PROCESSOR_CAPTURE."
    );
  }

  return normalized as LiveActionType;
}

function refPresent(value: unknown): boolean {
  return Boolean(normalizeText(value));
}

function readinessStatus(readyForLiveAction: boolean): string {
  return readyForLiveAction
    ? "LIVE_ACTION_PROMOTION_READY_NOT_EXECUTED"
    : "LIVE_ACTION_PROMOTION_BLOCKED";
}

function blockerReasons(gates: LiveActionReadinessGates): string[] {
  return Object.entries(gates)
    .filter(([, passed]) => !passed)
    .map(([gate]) => gate);
}

function allGatesPass(gates: LiveActionReadinessGates): boolean {
  return Object.values(gates).every((passed) => passed === true);
}

async function loadExternalConnectorTarget(
  targetExecutionId: string
): Promise<TargetSnapshot> {
  const rows = await db
    .select()
    .from(externalConnectorExecutions)
    .where(eq(externalConnectorExecutions.id, targetExecutionId))
    .limit(1);
  const execution = rows[0] ?? null;

  if (!execution) {
    throw new Error(
      "External connector execution authorization record was not found."
    );
  }

  const domainSpecificControlsSatisfied =
    execution.sourceLiveCallsAllowed === true &&
    execution.adapterCertified === true &&
    execution.adapterLiveCallsAllowed === true &&
    execution.sourceAuthorityPresent === true &&
    execution.connectorRunNotPreviouslyLive === true &&
    execution.applicationMatches === true &&
    execution.sourceMatches === true;

  return {
    actionType: "EXTERNAL_CONNECTOR_CALL",
    targetExecutionId: execution.id,
    targetAdapterId: execution.adapterId,
    targetProviderId: null,
    targetSourceId: execution.sourceId,
    targetTenantId: execution.tenantId,
    targetApplicationId: execution.applicationId,
    targetBorrowerId: execution.borrowerId,
    targetBillingEventId: null,
    targetSessionId: null,
    executionAuthorizationAllowed: execution.executionAllowed === true,
    liveActionNotPreviouslyPerformed:
      execution.liveCallPerformed === false &&
      execution.officialDataFetched === false,
    credentialApproved: execution.credentialApproved === true,
    outagePolicyTested: execution.outagePolicyTested === true,
    replayPolicyVerified: execution.replayPolicyVerified === true,
    schemaContractVerified: execution.schemaContractVerified === true,
    consentVerified: execution.consentVerified === true,
    isolationVerified: execution.isolationVerified === true,
    operationalRunbookApproved:
      execution.operationalRunbookApproved === true,
    domainSpecificControlsSatisfied,
    regulatedDecisionImpactAllowed: false,
    externalActionPerformed: execution.liveCallPerformed === true,
    liveActionPerformed:
      execution.liveCallPerformed === true ||
      execution.officialDataFetched === true,
    metadata: {
      connectorRunId: execution.connectorRunId,
      sourceName: execution.sourceName,
      connectorType: execution.connectorType,
      queryType: execution.queryType,
      executionStatus: execution.executionStatus,
    },
  };
}

async function loadNoticeProviderTarget(
  targetExecutionId: string
): Promise<TargetSnapshot> {
  const rows = await db
    .select()
    .from(borrowerNoticeProviderExecutions)
    .where(eq(borrowerNoticeProviderExecutions.id, targetExecutionId))
    .limit(1);
  const execution = rows[0] ?? null;

  if (!execution) {
    throw new Error(
      "Borrower notice provider execution authorization record was not found."
    );
  }

  const domainSpecificControlsSatisfied =
    execution.deliveryAllowedSnapshot === true &&
    execution.borrowerDisclosureAllowedSnapshot === true &&
    execution.deliveryProviderConfigured === true &&
    execution.providerAdapterApproved === true &&
    execution.retryPolicyAttached === true &&
    execution.returnedMailPolicyAttached === true &&
    execution.failedDeliveryPolicyAttached === true &&
    execution.disputeIntakeAttached === true;

  return {
    actionType: "NOTICE_PROVIDER_SEND",
    targetExecutionId: execution.id,
    targetAdapterId: null,
    targetProviderId: execution.providerId,
    targetSourceId: null,
    targetTenantId: execution.tenantId,
    targetApplicationId: execution.applicationId,
    targetBorrowerId: execution.borrowerId,
    targetBillingEventId: null,
    targetSessionId: null,
    executionAuthorizationAllowed:
      execution.providerExecutionAllowed === true,
    liveActionNotPreviouslyPerformed:
      execution.externalProviderActionPerformed === false,
    credentialApproved: execution.credentialApproved === true,
    outagePolicyTested: execution.outagePolicyTested === true,
    replayPolicyVerified: execution.replayPolicyVerified === true,
    schemaContractVerified: execution.schemaContractVerified === true,
    consentVerified: execution.consentVerified === true,
    isolationVerified: execution.isolationVerified === true,
    operationalRunbookApproved:
      execution.operationalRunbookApproved === true,
    domainSpecificControlsSatisfied,
    regulatedDecisionImpactAllowed: false,
    externalActionPerformed:
      execution.externalProviderActionPerformed === true,
    liveActionPerformed:
      execution.externalProviderActionPerformed === true,
    metadata: {
      deliveryId: execution.deliveryId,
      decisionNoticeId: execution.decisionNoticeId,
      providerType: execution.providerType,
      deliveryChannel: execution.deliveryChannel,
      executionStatus: execution.executionStatus,
    },
  };
}

async function loadPaymentProcessorTarget(
  targetExecutionId: string
): Promise<TargetSnapshot> {
  const rows = await db
    .select()
    .from(paymentConnectorExecutions)
    .where(eq(paymentConnectorExecutions.id, targetExecutionId))
    .limit(1);
  const execution = rows[0] ?? null;

  if (!execution) {
    throw new Error(
      "Payment connector execution authorization record was not found."
    );
  }

  const domainSpecificControlsSatisfied =
    execution.adapterCertified === true &&
    execution.livePaymentsAllowed === true &&
    execution.paymentAuthorityPresent === true &&
    execution.webhookSecretPresent === true &&
    execution.webhookSignatureVerified === true &&
    execution.refundPolicyPresent === true &&
    execution.refundPolicyApproved === true &&
    execution.disputePolicyPresent === true &&
    execution.disputePolicyApproved === true &&
    execution.reconciliationPolicyPresent === true &&
    execution.reconciliationPolicyApproved === true;

  return {
    actionType: "PAYMENT_PROCESSOR_CAPTURE",
    targetExecutionId: execution.id,
    targetAdapterId: execution.adapterId,
    targetProviderId: null,
    targetSourceId: null,
    targetTenantId: execution.tenantId,
    targetApplicationId: null,
    targetBorrowerId: null,
    targetBillingEventId: execution.billingEventId,
    targetSessionId: execution.sessionId,
    executionAuthorizationAllowed: execution.executionAllowed === true,
    liveActionNotPreviouslyPerformed:
      execution.paymentProcessorActionPerformed === false &&
      execution.livePaymentCaptured === false,
    credentialApproved: execution.credentialApproved === true,
    outagePolicyTested: execution.outagePolicyTested === true,
    replayPolicyVerified: execution.replayPolicyVerified === true,
    schemaContractVerified: execution.schemaContractVerified === true,
    consentVerified: execution.consentVerified === true,
    isolationVerified: execution.isolationVerified === true,
    operationalRunbookApproved:
      execution.operationalRunbookApproved === true,
    domainSpecificControlsSatisfied,
    regulatedDecisionImpactAllowed:
      execution.regulatedDecisionImpactAllowed === true,
    externalActionPerformed:
      execution.paymentProcessorActionPerformed === true,
    liveActionPerformed:
      execution.paymentProcessorActionPerformed === true ||
      execution.livePaymentCaptured === true,
    metadata: {
      plan: execution.plan,
      amountTotal: execution.amountTotal,
      currency: execution.currency,
      executionStatus: execution.executionStatus,
    },
  };
}

async function loadTargetSnapshot(input: {
  actionType: LiveActionType;
  targetExecutionId: string;
}): Promise<TargetSnapshot> {
  if (input.actionType === "EXTERNAL_CONNECTOR_CALL") {
    return loadExternalConnectorTarget(input.targetExecutionId);
  }

  if (input.actionType === "NOTICE_PROVIDER_SEND") {
    return loadNoticeProviderTarget(input.targetExecutionId);
  }

  return loadPaymentProcessorTarget(input.targetExecutionId);
}

export async function getLiveActionReadinessTargetScope(input: {
  actionType?: string | null;
  targetExecutionId?: string | null;
}): Promise<LiveActionReadinessTargetScope> {
  const actionType = normalizeActionType(input.actionType);
  const targetExecutionId = normalizeRequiredText(
    input.targetExecutionId,
    "targetExecutionId"
  );
  const snapshot = await loadTargetSnapshot({ actionType, targetExecutionId });

  return {
    actionType,
    targetExecutionId,
    tenantId: snapshot.targetTenantId,
    applicationId: snapshot.targetApplicationId,
    borrowerId: snapshot.targetBorrowerId,
  };
}

export async function createLiveActionReadinessReview(
  input: LiveActionReadinessInput
): Promise<LiveActionReadinessResult> {
  const actionType = normalizeActionType(input.actionType);
  const targetExecutionId = normalizeRequiredText(
    input.targetExecutionId,
    "targetExecutionId"
  );
  const snapshot = await loadTargetSnapshot({ actionType, targetExecutionId });

  if (
    input.tenantId &&
    snapshot.targetTenantId &&
    input.tenantId !== snapshot.targetTenantId
  ) {
    throw new Error("Live action readiness review tenant scope mismatch.");
  }

  const productionCredentialVaultPresent = refPresent(
    input.productionCredentialVaultRef
  );
  const liveAdapterImplementationPresent = refPresent(
    input.liveAdapterImplementationRef
  );
  const productionRunbookApprovalPresent = refPresent(
    input.productionRunbookApprovalRef
  );
  const dryRunEvidencePresent = refPresent(input.dryRunEvidenceRef);
  const rollbackPlanPresent = refPresent(input.rollbackPlanRef);
  const incidentResponsePlanPresent = refPresent(
    input.incidentResponsePlanRef
  );
  const monitoringPlanPresent = refPresent(input.monitoringPlanRef);
  const auditEvidenceExportPresent = refPresent(
    input.auditEvidenceExportRef
  );
  const humanApprovalPresent = refPresent(input.humanApprovalRef);

  const gates: LiveActionReadinessGates = {
    executionAuthorizationFound: true,
    executionAuthorizationAllowed:
      snapshot.executionAuthorizationAllowed,
    liveActionNotPreviouslyPerformed:
      snapshot.liveActionNotPreviouslyPerformed,
    credentialApproved: snapshot.credentialApproved,
    outagePolicyTested: snapshot.outagePolicyTested,
    replayPolicyVerified: snapshot.replayPolicyVerified,
    schemaContractVerified: snapshot.schemaContractVerified,
    consentVerified: snapshot.consentVerified,
    isolationVerified: snapshot.isolationVerified,
    operationalRunbookApproved:
      snapshot.operationalRunbookApproved,
    domainSpecificControlsSatisfied:
      snapshot.domainSpecificControlsSatisfied,
    productionCredentialVaultPresent,
    liveAdapterImplementationPresent,
    productionRunbookApprovalPresent,
    dryRunEvidencePresent,
    rollbackPlanPresent,
    incidentResponsePlanPresent,
    monitoringPlanPresent,
    auditEvidenceExportPresent,
    humanApprovalPresent,
    regulatedDecisionImpactBlocked:
      snapshot.regulatedDecisionImpactAllowed === false,
    externalActionNotPerformed:
      snapshot.externalActionPerformed === false,
    liveActionNotPerformed: snapshot.liveActionPerformed === false,
  };
  const reasons = blockerReasons(gates);
  const readyForLiveAction = allGatesPass(gates);
  const status = readinessStatus(readyForLiveAction);
  const now = new Date();
  const rows = await db
    .insert(liveActionReadinessReviews)
    .values({
      actionType,
      readinessStatus: status,
      targetExecutionId,
      targetAdapterId: snapshot.targetAdapterId,
      targetProviderId: snapshot.targetProviderId,
      targetSourceId: snapshot.targetSourceId,
      targetTenantId: snapshot.targetTenantId,
      targetApplicationId: snapshot.targetApplicationId,
      targetBorrowerId: snapshot.targetBorrowerId,
      targetBillingEventId: snapshot.targetBillingEventId,
      targetSessionId: snapshot.targetSessionId,
      actorId: input.actorId ?? null,
      productionCredentialVaultRef:
        input.productionCredentialVaultRef ?? null,
      liveAdapterImplementationRef:
        input.liveAdapterImplementationRef ?? null,
      productionRunbookApprovalRef:
        input.productionRunbookApprovalRef ?? null,
      dryRunEvidenceRef: input.dryRunEvidenceRef ?? null,
      rollbackPlanRef: input.rollbackPlanRef ?? null,
      incidentResponsePlanRef:
        input.incidentResponsePlanRef ?? null,
      monitoringPlanRef: input.monitoringPlanRef ?? null,
      auditEvidenceExportRef:
        input.auditEvidenceExportRef ?? null,
      humanApprovalRef: input.humanApprovalRef ?? null,
      executionAuthorizationFound: true,
      executionAuthorizationAllowed:
        snapshot.executionAuthorizationAllowed,
      liveActionNotPreviouslyPerformed:
        snapshot.liveActionNotPreviouslyPerformed,
      credentialApproved: snapshot.credentialApproved,
      outagePolicyTested: snapshot.outagePolicyTested,
      replayPolicyVerified: snapshot.replayPolicyVerified,
      schemaContractVerified: snapshot.schemaContractVerified,
      consentVerified: snapshot.consentVerified,
      isolationVerified: snapshot.isolationVerified,
      operationalRunbookApproved:
        snapshot.operationalRunbookApproved,
      productionCredentialVaultPresent,
      liveAdapterImplementationPresent,
      productionRunbookApprovalPresent,
      dryRunEvidencePresent,
      rollbackPlanPresent,
      incidentResponsePlanPresent,
      monitoringPlanPresent,
      auditEvidenceExportPresent,
      humanApprovalPresent,
      domainSpecificControlsSatisfied:
        snapshot.domainSpecificControlsSatisfied,
      readyForLiveAction,
      regulatedDecisionImpactAllowed:
        snapshot.regulatedDecisionImpactAllowed,
      externalActionPerformed: snapshot.externalActionPerformed,
      liveActionPerformed: snapshot.liveActionPerformed,
      gateSnapshot: gates,
      blockerReasons: reasons,
      governanceVersion: GOVERNANCE_VERSION,
      classification: CLASSIFICATION,
      replayRef: input.traceId,
      traceId: input.traceId,
      source: LIVE_ACTION_READINESS_SOURCE,
      metadata: {
        ...(input.metadata ?? {}),
        targetSnapshot: snapshot.metadata,
      },
      reviewedAt: now,
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  const review = rows[0];

  if (!review) {
    throw new Error("Live action readiness review was not persisted.");
  }

  return {
    review,
    gates,
    blockerReasons: reasons,
    readyForLiveAction,
    readinessStatus: status,
  };
}
