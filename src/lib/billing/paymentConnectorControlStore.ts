import { desc, eq } from "drizzle-orm";

import {
  paymentConnectorAdapters,
  paymentConnectorExecutions,
} from "@/db/schema";
import { db } from "@/lib/db";

/**
 * Canonical Payment Connector Control Runtime
 *
 * Master Volume Governance:
 * - Vol I: Keeps payment connector promotion under accountable authority and
 *   separate from regulated credit, financing, legal, or permitting decisions.
 * - Vol II: Protects tenant, billing, credential, entitlement, refund,
 *   dispute, and reconciliation metadata.
 * - Vol III: Provides deterministic certification and execution
 *   authorization without live payment processor capture.
 * - Vol IV: Supports outage handling, refund/dispute response,
 *   reconciliation, recovery, escalation, and audit preparation.
 * - Vol V: Enforces classification, observability, replayability, version
 *   lineage, connector governance, consent, schema, and isolation doctrine.
 */

const GOVERNANCE_VERSION = "master-volumes-runtime-v0.1.0";
const CLASSIFICATION = "RESTRICTED";
const PAYMENT_CONTROL_SOURCE = "payment-connector-control-runtime";

export type PaymentConnectorCertificationControls = {
  paymentAuthorityPresent: boolean;
  credentialRefPresent: boolean;
  credentialApproved: boolean;
  webhookSecretPresent: boolean;
  webhookSignatureVerified: boolean;
  outagePolicyPresent: boolean;
  outagePolicyTested: boolean;
  replayPolicyPresent: boolean;
  replayPolicyVerified: boolean;
  schemaContractPresent: boolean;
  refundPolicyPresent: boolean;
  refundPolicyApproved: boolean;
  disputePolicyPresent: boolean;
  disputePolicyApproved: boolean;
  reconciliationPolicyPresent: boolean;
  reconciliationPolicyApproved: boolean;
  consentRequired: true;
  isolationRequired: true;
  humanReviewRequired: true;
  livePaymentCaptured: false;
};

export type PaymentConnectorExecutionGates =
  PaymentConnectorCertificationControls & {
    adapterFound: boolean;
    adapterCertified: boolean;
    livePaymentsAllowed: boolean;
    schemaContractVerified: boolean;
    consentRefPresent: boolean;
    consentVerified: boolean;
    isolationRefPresent: boolean;
    isolationVerified: boolean;
    operationalRunbookPresent: boolean;
    operationalRunbookApproved: boolean;
    paymentProcessorActionPerformed: false;
    regulatedDecisionImpactAllowed: false;
  };

export type PersistPaymentConnectorAdapterInput = {
  traceId: string;
  adapterId?: string | null;
  adapterName?: string | null;
  processorName?: string | null;
  processorType?: string | null;
  processorEnvironment?: string | null;
  paymentAuthorityRef?: string | null;
  certificationStatus?: string | null;
  credentialRef?: string | null;
  credentialStatus?: string | null;
  webhookSecretRef?: string | null;
  webhookSignatureStatus?: string | null;
  outagePolicyRef?: string | null;
  outageStatus?: string | null;
  replayPolicyRef?: string | null;
  replayStatus?: string | null;
  schemaContractVersion?: string | null;
  refundPolicyRef?: string | null;
  refundPolicyStatus?: string | null;
  disputePolicyRef?: string | null;
  disputePolicyStatus?: string | null;
  reconciliationPolicyRef?: string | null;
  reconciliationPolicyStatus?: string | null;
  actorId?: string | null;
  metadata?: Record<string, unknown>;
};

export type PersistPaymentConnectorExecutionInput = {
  traceId: string;
  adapterId?: string | null;
  billingEventId?: string | null;
  sessionId?: string | null;
  tenantId?: string | null;
  actorId?: string | null;
  userId?: string | null;
  plan?: string | null;
  amountTotal?: number | null;
  currency?: string | null;
  executionRef?: string | null;
  paymentProcessorRef?: string | null;
  operationalRunbookRef?: string | null;
  operationalRunbookStatus?: string | null;
  schemaContractStatus?: string | null;
  consentRef?: string | null;
  consentStatus?: string | null;
  isolationRef?: string | null;
  isolationStatus?: string | null;
  metadata?: Record<string, unknown>;
};

export type PaymentConnectorAdapterResult = {
  adapter: typeof paymentConnectorAdapters.$inferSelect;
  controls: PaymentConnectorCertificationControls;
  certificationStatus: string;
  livePaymentsAllowed: boolean;
  message: string;
};

export type PaymentConnectorExecutionResult = {
  adapter: typeof paymentConnectorAdapters.$inferSelect;
  execution: typeof paymentConnectorExecutions.$inferSelect;
  gates: PaymentConnectorExecutionGates;
  executionAllowed: boolean;
  executionStatus: string;
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

function normalizeProcessorType(value: unknown): string {
  const normalized = normalizeText(value)?.toUpperCase();
  const allowed = new Set([
    "STRIPE",
    "ACH",
    "CARD",
    "PAYMENT_PROCESSOR",
  ]);

  return normalized && allowed.has(normalized)
    ? normalized
    : "PAYMENT_PROCESSOR";
}

function normalizeEnvironment(value: unknown): string {
  const normalized = normalizeText(value)?.toUpperCase();
  const allowed = new Set(["TEST", "SANDBOX", "LIVE"]);

  return normalized && allowed.has(normalized) ? normalized : "TEST";
}

function normalizeCertificationStatus(value: unknown): string {
  const normalized = normalizeText(value)?.toUpperCase();
  const allowed = new Set([
    "PENDING_CERTIFICATION",
    "CERTIFIED",
    "CERTIFICATION_BLOCKED",
    "SUSPENDED",
    "REVOKED",
  ]);

  return normalized && allowed.has(normalized)
    ? normalized
    : "PENDING_CERTIFICATION";
}

function normalizeCredentialStatus(value: unknown): string {
  const normalized = normalizeText(value)?.toUpperCase();
  const allowed = new Set([
    "MISSING",
    "PENDING_REVIEW",
    "APPROVED",
    "REVOKED",
  ]);

  return normalized && allowed.has(normalized) ? normalized : "MISSING";
}

function normalizeTestStatus(value: unknown, fallback: string): string {
  const normalized = normalizeText(value)?.toUpperCase();
  const allowed = new Set([
    "NOT_TESTED",
    "PENDING_TEST",
    "TESTED",
    "FAILED",
    "NOT_VERIFIED",
    "PENDING_VERIFICATION",
    "VERIFIED",
    "APPROVED",
    "NOT_APPROVED",
  ]);

  return normalized && allowed.has(normalized) ? normalized : fallback;
}

function approvedStatus(value: unknown): boolean {
  const normalized = normalizeText(value)?.toUpperCase();

  return normalized === "APPROVED" || normalized === "CERTIFIED";
}

function verifiedStatus(value: unknown): boolean {
  const normalized = normalizeText(value)?.toUpperCase();

  return normalized === "VERIFIED" || normalized === "APPROVED";
}

function testedStatus(value: unknown): boolean {
  const normalized = normalizeText(value)?.toUpperCase();

  return normalized === "TESTED" || normalized === "VERIFIED";
}

function normalizeAmount(value: number | null | undefined): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  const normalized = Math.round(Number(value));

  return Number.isFinite(normalized) ? normalized : null;
}

function certificationControls(input: {
  paymentAuthorityRef?: string | null;
  credentialRef?: string | null;
  credentialStatus: string;
  webhookSecretRef?: string | null;
  webhookSignatureStatus: string;
  outagePolicyRef?: string | null;
  outageStatus: string;
  replayPolicyRef?: string | null;
  replayStatus: string;
  schemaContractVersion?: string | null;
  refundPolicyRef?: string | null;
  refundPolicyStatus: string;
  disputePolicyRef?: string | null;
  disputePolicyStatus: string;
  reconciliationPolicyRef?: string | null;
  reconciliationPolicyStatus: string;
}): PaymentConnectorCertificationControls {
  return {
    paymentAuthorityPresent: Boolean(normalizeText(input.paymentAuthorityRef)),
    credentialRefPresent: Boolean(normalizeText(input.credentialRef)),
    credentialApproved: input.credentialStatus === "APPROVED",
    webhookSecretPresent: Boolean(normalizeText(input.webhookSecretRef)),
    webhookSignatureVerified: verifiedStatus(input.webhookSignatureStatus),
    outagePolicyPresent: Boolean(normalizeText(input.outagePolicyRef)),
    outagePolicyTested: testedStatus(input.outageStatus),
    replayPolicyPresent: Boolean(normalizeText(input.replayPolicyRef)),
    replayPolicyVerified: verifiedStatus(input.replayStatus),
    schemaContractPresent: Boolean(
      normalizeText(input.schemaContractVersion)
    ),
    refundPolicyPresent: Boolean(normalizeText(input.refundPolicyRef)),
    refundPolicyApproved: approvedStatus(input.refundPolicyStatus),
    disputePolicyPresent: Boolean(normalizeText(input.disputePolicyRef)),
    disputePolicyApproved: approvedStatus(input.disputePolicyStatus),
    reconciliationPolicyPresent: Boolean(
      normalizeText(input.reconciliationPolicyRef)
    ),
    reconciliationPolicyApproved: approvedStatus(
      input.reconciliationPolicyStatus
    ),
    consentRequired: true,
    isolationRequired: true,
    humanReviewRequired: true,
    livePaymentCaptured: false,
  };
}

function certificationComplete(
  controls: PaymentConnectorCertificationControls
): boolean {
  return (
    controls.paymentAuthorityPresent &&
    controls.credentialRefPresent &&
    controls.credentialApproved &&
    controls.webhookSecretPresent &&
    controls.webhookSignatureVerified &&
    controls.outagePolicyPresent &&
    controls.outagePolicyTested &&
    controls.replayPolicyPresent &&
    controls.replayPolicyVerified &&
    controls.schemaContractPresent &&
    controls.refundPolicyPresent &&
    controls.refundPolicyApproved &&
    controls.disputePolicyPresent &&
    controls.disputePolicyApproved &&
    controls.reconciliationPolicyPresent &&
    controls.reconciliationPolicyApproved &&
    controls.livePaymentCaptured === false
  );
}

function finalCertificationStatus(
  requestedStatus: string,
  controlsComplete: boolean
): string {
  if (requestedStatus === "REVOKED" || requestedStatus === "SUSPENDED") {
    return requestedStatus;
  }

  if (requestedStatus === "CERTIFIED" && controlsComplete) {
    return "CERTIFIED";
  }

  if (requestedStatus === "CERTIFIED" && !controlsComplete) {
    return "CERTIFICATION_BLOCKED";
  }

  return requestedStatus;
}

function executionGates(input: {
  adapter: typeof paymentConnectorAdapters.$inferSelect;
  operationalRunbookRef?: string | null;
  operationalRunbookStatus?: string | null;
  schemaContractStatus?: string | null;
  consentRef?: string | null;
  consentStatus?: string | null;
  isolationRef?: string | null;
  isolationStatus?: string | null;
}): PaymentConnectorExecutionGates {
  const certification = certificationControls({
    paymentAuthorityRef: input.adapter.paymentAuthorityRef,
    credentialRef: input.adapter.credentialRef,
    credentialStatus: input.adapter.credentialStatus,
    webhookSecretRef: input.adapter.webhookSecretRef,
    webhookSignatureStatus: input.adapter.webhookSignatureStatus,
    outagePolicyRef: input.adapter.outagePolicyRef,
    outageStatus: input.adapter.outageStatus,
    replayPolicyRef: input.adapter.replayPolicyRef,
    replayStatus: input.adapter.replayStatus,
    schemaContractVersion: input.adapter.schemaContractVersion,
    refundPolicyRef: input.adapter.refundPolicyRef,
    refundPolicyStatus: input.adapter.refundPolicyStatus,
    disputePolicyRef: input.adapter.disputePolicyRef,
    disputePolicyStatus: input.adapter.disputePolicyStatus,
    reconciliationPolicyRef: input.adapter.reconciliationPolicyRef,
    reconciliationPolicyStatus: input.adapter.reconciliationPolicyStatus,
  });
  const operationalRunbookPresent = Boolean(
    normalizeText(input.operationalRunbookRef)
  );
  const consentRefPresent = Boolean(normalizeText(input.consentRef));
  const isolationRefPresent = Boolean(normalizeText(input.isolationRef));

  return {
    ...certification,
    adapterFound: true,
    adapterCertified: input.adapter.certificationStatus === "CERTIFIED",
    livePaymentsAllowed: input.adapter.livePaymentsAllowed === true,
    schemaContractVerified: verifiedStatus(input.schemaContractStatus),
    consentRefPresent,
    consentVerified: verifiedStatus(input.consentStatus),
    isolationRefPresent,
    isolationVerified: verifiedStatus(input.isolationStatus),
    operationalRunbookPresent,
    operationalRunbookApproved: approvedStatus(
      input.operationalRunbookStatus
    ),
    paymentProcessorActionPerformed: false,
    regulatedDecisionImpactAllowed: false,
  };
}

function executionComplete(gates: PaymentConnectorExecutionGates): boolean {
  return (
    gates.adapterFound &&
    gates.adapterCertified &&
    gates.livePaymentsAllowed &&
    gates.paymentAuthorityPresent &&
    gates.credentialRefPresent &&
    gates.credentialApproved &&
    gates.webhookSecretPresent &&
    gates.webhookSignatureVerified &&
    gates.outagePolicyPresent &&
    gates.outagePolicyTested &&
    gates.replayPolicyPresent &&
    gates.replayPolicyVerified &&
    gates.schemaContractPresent &&
    gates.schemaContractVerified &&
    gates.consentRefPresent &&
    gates.consentVerified &&
    gates.isolationRefPresent &&
    gates.isolationVerified &&
    gates.operationalRunbookPresent &&
    gates.operationalRunbookApproved &&
    gates.refundPolicyPresent &&
    gates.refundPolicyApproved &&
    gates.disputePolicyPresent &&
    gates.disputePolicyApproved &&
    gates.reconciliationPolicyPresent &&
    gates.reconciliationPolicyApproved &&
    gates.paymentProcessorActionPerformed === false &&
    gates.livePaymentCaptured === false &&
    gates.regulatedDecisionImpactAllowed === false
  );
}

function executionStatus(allowed: boolean): string {
  return allowed
    ? "PAYMENT_EXECUTION_AUTHORIZED_NOT_CAPTURED"
    : "PAYMENT_EXECUTION_BLOCKED";
}

async function loadLatestAdapter(
  adapterId: string
): Promise<typeof paymentConnectorAdapters.$inferSelect> {
  const rows = await db
    .select()
    .from(paymentConnectorAdapters)
    .where(eq(paymentConnectorAdapters.adapterId, adapterId))
    .orderBy(desc(paymentConnectorAdapters.createdAt))
    .limit(1);
  const adapter = rows[0] ?? null;

  if (!adapter) {
    throw new Error("Payment connector adapter not found for execution.");
  }

  return adapter;
}

export async function persistPaymentConnectorAdapter(
  input: PersistPaymentConnectorAdapterInput
): Promise<PaymentConnectorAdapterResult> {
  const adapterId = normalizeRequiredText(input.adapterId, "adapterId");
  const adapterName = normalizeRequiredText(input.adapterName, "adapterName");
  const processorName =
    normalizeText(input.processorName) ?? "Stripe local adapter";
  const processorType = normalizeProcessorType(input.processorType);
  const processorEnvironment = normalizeEnvironment(input.processorEnvironment);
  const requestedCertificationStatus = normalizeCertificationStatus(
    input.certificationStatus
  );
  const credentialStatus = normalizeCredentialStatus(input.credentialStatus);
  const webhookSignatureStatus = normalizeTestStatus(
    input.webhookSignatureStatus,
    "NOT_VERIFIED"
  );
  const outageStatus = normalizeTestStatus(input.outageStatus, "NOT_TESTED");
  const replayStatus = normalizeTestStatus(input.replayStatus, "NOT_VERIFIED");
  const refundPolicyStatus = normalizeTestStatus(
    input.refundPolicyStatus,
    "NOT_APPROVED"
  );
  const disputePolicyStatus = normalizeTestStatus(
    input.disputePolicyStatus,
    "NOT_APPROVED"
  );
  const reconciliationPolicyStatus = normalizeTestStatus(
    input.reconciliationPolicyStatus,
    "NOT_APPROVED"
  );
  const controls = certificationControls({
    paymentAuthorityRef: input.paymentAuthorityRef,
    credentialRef: input.credentialRef,
    credentialStatus,
    webhookSecretRef: input.webhookSecretRef,
    webhookSignatureStatus,
    outagePolicyRef: input.outagePolicyRef,
    outageStatus,
    replayPolicyRef: input.replayPolicyRef,
    replayStatus,
    schemaContractVersion: input.schemaContractVersion,
    refundPolicyRef: input.refundPolicyRef,
    refundPolicyStatus,
    disputePolicyRef: input.disputePolicyRef,
    disputePolicyStatus,
    reconciliationPolicyRef: input.reconciliationPolicyRef,
    reconciliationPolicyStatus,
  });
  const complete = certificationComplete(controls);
  const certificationStatus = finalCertificationStatus(
    requestedCertificationStatus,
    complete
  );
  const livePaymentsAllowed = certificationStatus === "CERTIFIED";
  const now = new Date();
  const rows = await db
    .insert(paymentConnectorAdapters)
    .values({
      adapterId,
      adapterName,
      processorName,
      processorType,
      processorEnvironment,
      paymentAuthorityRef: normalizeText(input.paymentAuthorityRef),
      certificationStatus,
      livePaymentsAllowed,
      credentialRef: normalizeText(input.credentialRef),
      credentialStatus,
      credentialVaultRequired: true,
      webhookSecretRef: normalizeText(input.webhookSecretRef),
      webhookSignatureStatus,
      outagePolicyRef: normalizeText(input.outagePolicyRef),
      outageStatus,
      replayPolicyRef: normalizeText(input.replayPolicyRef),
      replayStatus,
      schemaContractVersion: normalizeText(input.schemaContractVersion),
      refundPolicyRef: normalizeText(input.refundPolicyRef),
      refundPolicyStatus,
      disputePolicyRef: normalizeText(input.disputePolicyRef),
      disputePolicyStatus,
      reconciliationPolicyRef: normalizeText(input.reconciliationPolicyRef),
      reconciliationPolicyStatus,
      consentRequired: true,
      isolationRequired: true,
      humanReviewRequired: true,
      livePaymentCaptured: false,
      lastCertifiedAt: livePaymentsAllowed ? now : null,
      revokedAt: certificationStatus === "REVOKED" ? now : null,
      governanceVersion: GOVERNANCE_VERSION,
      classification: CLASSIFICATION,
      replayRef: input.traceId,
      traceId: input.traceId,
      source: PAYMENT_CONTROL_SOURCE,
      metadata: {
        ...(input.metadata ?? {}),
        actorId: normalizeText(input.actorId),
        requestedCertificationStatus,
        controls,
        controlsComplete: complete,
        paymentConnectorControlRuntimeVersion:
          "payment-connector-control-runtime-v0.1.0",
      },
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  const adapter = rows[0];

  return {
    adapter,
    controls,
    certificationStatus,
    livePaymentsAllowed,
    message: livePaymentsAllowed
      ? "Payment connector adapter certified. Runtime still performs no live payment capture."
      : "Payment connector adapter certification is blocked or pending until all controls are complete.",
  };
}

export async function persistPaymentConnectorExecution(
  input: PersistPaymentConnectorExecutionInput
): Promise<PaymentConnectorExecutionResult> {
  const adapterId = normalizeRequiredText(input.adapterId, "adapterId");
  const adapter = await loadLatestAdapter(adapterId);
  const gates = executionGates({
    adapter,
    operationalRunbookRef: input.operationalRunbookRef,
    operationalRunbookStatus: input.operationalRunbookStatus,
    schemaContractStatus: input.schemaContractStatus,
    consentRef: input.consentRef,
    consentStatus: input.consentStatus,
    isolationRef: input.isolationRef,
    isolationStatus: input.isolationStatus,
  });
  const executionAllowed = executionComplete(gates);
  const status = executionStatus(executionAllowed);
  const now = new Date();
  const rows = await db
    .insert(paymentConnectorExecutions)
    .values({
      adapterId,
      billingEventId: normalizeText(input.billingEventId),
      sessionId: normalizeText(input.sessionId),
      tenantId: normalizeText(input.tenantId),
      actorId: normalizeText(input.actorId),
      userId: normalizeText(input.userId),
      plan: normalizeText(input.plan),
      amountTotal: normalizeAmount(input.amountTotal),
      currency: normalizeText(input.currency)?.toLowerCase() ?? null,
      executionStatus: status,
      executionRef: normalizeText(input.executionRef),
      paymentProcessorRef: normalizeText(input.paymentProcessorRef),
      paymentAuthorityRef: normalizeText(adapter.paymentAuthorityRef),
      credentialRef: normalizeText(adapter.credentialRef),
      webhookSecretRef: normalizeText(adapter.webhookSecretRef),
      outagePolicyRef: normalizeText(adapter.outagePolicyRef),
      replayPolicyRef: normalizeText(adapter.replayPolicyRef),
      operationalRunbookRef: normalizeText(input.operationalRunbookRef),
      schemaContractVersion: normalizeText(adapter.schemaContractVersion),
      consentRef: normalizeText(input.consentRef),
      isolationRef: normalizeText(input.isolationRef),
      refundPolicyRef: normalizeText(adapter.refundPolicyRef),
      disputePolicyRef: normalizeText(adapter.disputePolicyRef),
      reconciliationPolicyRef: normalizeText(adapter.reconciliationPolicyRef),
      adapterFound: gates.adapterFound,
      adapterCertified: gates.adapterCertified,
      livePaymentsAllowed: gates.livePaymentsAllowed,
      paymentAuthorityPresent: gates.paymentAuthorityPresent,
      credentialRefPresent: gates.credentialRefPresent,
      credentialApproved: gates.credentialApproved,
      webhookSecretPresent: gates.webhookSecretPresent,
      webhookSignatureVerified: gates.webhookSignatureVerified,
      outagePolicyPresent: gates.outagePolicyPresent,
      outagePolicyTested: gates.outagePolicyTested,
      replayPolicyPresent: gates.replayPolicyPresent,
      replayPolicyVerified: gates.replayPolicyVerified,
      schemaContractPresent: gates.schemaContractPresent,
      schemaContractVerified: gates.schemaContractVerified,
      consentRefPresent: gates.consentRefPresent,
      consentVerified: gates.consentVerified,
      isolationRefPresent: gates.isolationRefPresent,
      isolationVerified: gates.isolationVerified,
      operationalRunbookPresent: gates.operationalRunbookPresent,
      operationalRunbookApproved: gates.operationalRunbookApproved,
      refundPolicyPresent: gates.refundPolicyPresent,
      refundPolicyApproved: gates.refundPolicyApproved,
      disputePolicyPresent: gates.disputePolicyPresent,
      disputePolicyApproved: gates.disputePolicyApproved,
      reconciliationPolicyPresent: gates.reconciliationPolicyPresent,
      reconciliationPolicyApproved: gates.reconciliationPolicyApproved,
      executionAllowed,
      paymentProcessorActionPerformed: false,
      livePaymentCaptured: false,
      regulatedDecisionImpactAllowed: false,
      humanReviewRequired: true,
      executionAuthorizedAt: executionAllowed ? now : null,
      paymentCapturedAt: null,
      governanceVersion: GOVERNANCE_VERSION,
      classification: CLASSIFICATION,
      replayRef: input.traceId,
      traceId: input.traceId,
      source: PAYMENT_CONTROL_SOURCE,
      metadata: {
        ...(input.metadata ?? {}),
        gates,
        adapterCertificationStatus: adapter.certificationStatus,
        processorType: adapter.processorType,
        processorEnvironment: adapter.processorEnvironment,
        operationalRunbookStatus: normalizeText(
          input.operationalRunbookStatus
        ),
        schemaContractStatus: normalizeText(input.schemaContractStatus),
        consentStatus: normalizeText(input.consentStatus),
        isolationStatus: normalizeText(input.isolationStatus),
        paymentProcessorActionPerformed: false,
        livePaymentCaptured: false,
        regulatedDecisionImpactAllowed: false,
        paymentConnectorControlRuntimeVersion:
          "payment-connector-control-runtime-v0.1.0",
      },
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return {
    adapter,
    execution: rows[0],
    gates,
    executionAllowed,
    executionStatus: status,
  };
}
