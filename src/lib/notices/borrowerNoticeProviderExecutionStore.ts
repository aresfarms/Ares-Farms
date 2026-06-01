import { eq } from "drizzle-orm";

import {
  borrowerNoticeDeliveries,
  borrowerNoticeProviderExecutions,
} from "@/db/schema";
import { db } from "@/lib/db";

/**
 * Canonical Borrower Notice Provider Execution Runtime
 *
 * Master Volume Governance:
 * - Vol I: Preserves accountable authority for notice provider execution.
 * - Vol II: Blocks provider execution unless borrower disclosure, redaction,
 *   appeal, delivery, retry, returned-mail, failed-delivery, and dispute
 *   protections are complete.
 * - Vol III: Provides deterministic, replay-safe provider execution
 *   authorization without an uncontrolled external provider send.
 * - Vol IV: Supports provider runbooks, outage handling, retry handling,
 *   returned-mail handling, failed-delivery response, dispute intake,
 *   recovery, escalation, and audit preparation.
 * - Vol V: Enforces classification, observability, replay, version lineage,
 *   controlled disclosure, schema contracts, consent, and isolation.
 */

const GOVERNANCE_VERSION = "master-volumes-runtime-v0.1.0";
const CLASSIFICATION = "CONFIDENTIAL";
const PROVIDER_EXECUTION_SOURCE =
  "borrower-notice-provider-execution-runtime";

type NoticeDelivery = typeof borrowerNoticeDeliveries.$inferSelect;

export type PersistBorrowerNoticeProviderExecutionInput = {
  traceId: string;
  deliveryId?: string | null;
  applicationId?: string | null;
  borrowerId?: string | null;
  tenantId?: string | null;
  actorId?: string | null;
  providerId?: string | null;
  providerType?: string | null;
  providerAdapterStatus?: string | null;
  providerExecutionRef?: string | null;
  providerEventId?: string | null;
  providerResponseRef?: string | null;
  credentialRef?: string | null;
  credentialStatus?: string | null;
  retryPolicyRef?: string | null;
  returnedMailPolicyRef?: string | null;
  failedDeliveryPolicyRef?: string | null;
  disputeIntakeRef?: string | null;
  outagePolicyRef?: string | null;
  outageStatus?: string | null;
  replayPolicyRef?: string | null;
  replayStatus?: string | null;
  operationalRunbookRef?: string | null;
  operationalRunbookStatus?: string | null;
  schemaContractVersion?: string | null;
  schemaContractStatus?: string | null;
  consentRef?: string | null;
  consentStatus?: string | null;
  isolationRef?: string | null;
  isolationStatus?: string | null;
  metadata?: Record<string, unknown>;
};

export type BorrowerNoticeProviderExecutionGates = {
  deliveryFound: boolean;
  applicationMatches: boolean;
  deliveryAllowed: boolean;
  borrowerDisclosureAllowed: boolean;
  deliveryReadyForProvider: boolean;
  deliveryProviderConfigured: boolean;
  deliveryProviderRefMatches: boolean;
  providerAdapterApproved: boolean;
  credentialRefPresent: boolean;
  credentialApproved: boolean;
  outagePolicyPresent: boolean;
  outagePolicyTested: boolean;
  retryPolicyAttached: boolean;
  returnedMailPolicyAttached: boolean;
  failedDeliveryPolicyAttached: boolean;
  disputeIntakeAttached: boolean;
  replayPolicyPresent: boolean;
  replayPolicyVerified: boolean;
  schemaContractPresent: boolean;
  schemaContractVerified: boolean;
  consentRefPresent: boolean;
  consentVerified: boolean;
  isolationRefPresent: boolean;
  isolationVerified: boolean;
  operationalRunbookPresent: boolean;
  operationalRunbookApproved: boolean;
  externalProviderActionPerformed: false;
};

export type BorrowerNoticeProviderExecutionResult = {
  delivery: NoticeDelivery;
  execution: typeof borrowerNoticeProviderExecutions.$inferSelect;
  gates: BorrowerNoticeProviderExecutionGates;
  providerExecutionAllowed: boolean;
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

function normalizeProviderType(value: unknown): string {
  const normalized = normalizeText(value)?.toUpperCase();
  const allowed = new Set([
    "SECURE_PORTAL",
    "SECURE_MESSAGE",
    "CONTROLLED_EMAIL",
    "CONTROLLED_MAIL",
    "NOTICE_PROVIDER",
  ]);

  return normalized && allowed.has(normalized)
    ? normalized
    : "NOTICE_PROVIDER";
}

function approvedStatus(value: unknown): boolean {
  const normalized = normalizeText(value)?.toUpperCase();

  return normalized === "APPROVED" || normalized === "CERTIFIED";
}

function testedStatus(value: unknown): boolean {
  const normalized = normalizeText(value)?.toUpperCase();

  return normalized === "TESTED" || normalized === "VERIFIED";
}

function verifiedStatus(value: unknown): boolean {
  const normalized = normalizeText(value)?.toUpperCase();

  return normalized === "VERIFIED" || normalized === "APPROVED";
}

function providerRefMatches(input: {
  deliveryProviderRef?: string | null;
  providerId: string;
}): boolean {
  const deliveryProviderRef = normalizeText(input.deliveryProviderRef);

  return !deliveryProviderRef || deliveryProviderRef === input.providerId;
}

function deliveryReadyForProvider(delivery: NoticeDelivery): boolean {
  return new Set([
    "CONTROLLED_DELIVERY_READY",
    "PROVIDER_EXECUTION_AUTHORIZED_NOT_SENT",
  ]).has(delivery.deliveryStatus);
}

function providerExecutionGates(input: {
  delivery: NoticeDelivery;
  applicationId?: string | null;
  providerId: string;
  providerAdapterStatus?: string | null;
  credentialRef?: string | null;
  credentialStatus?: string | null;
  retryPolicyRef?: string | null;
  returnedMailPolicyRef?: string | null;
  failedDeliveryPolicyRef?: string | null;
  disputeIntakeRef?: string | null;
  outagePolicyRef?: string | null;
  outageStatus?: string | null;
  replayPolicyRef?: string | null;
  replayStatus?: string | null;
  operationalRunbookRef?: string | null;
  operationalRunbookStatus?: string | null;
  schemaContractVersion?: string | null;
  schemaContractStatus?: string | null;
  consentRef?: string | null;
  consentStatus?: string | null;
  isolationRef?: string | null;
  isolationStatus?: string | null;
}): BorrowerNoticeProviderExecutionGates {
  const applicationId = normalizeText(input.applicationId);
  const credentialRefPresent = Boolean(normalizeText(input.credentialRef));
  const outagePolicyPresent = Boolean(normalizeText(input.outagePolicyRef));
  const replayPolicyPresent = Boolean(normalizeText(input.replayPolicyRef));
  const schemaContractPresent = Boolean(
    normalizeText(input.schemaContractVersion)
  );
  const consentRefPresent = Boolean(normalizeText(input.consentRef));
  const isolationRefPresent = Boolean(normalizeText(input.isolationRef));
  const operationalRunbookPresent = Boolean(
    normalizeText(input.operationalRunbookRef)
  );

  return {
    deliveryFound: true,
    applicationMatches:
      !applicationId || input.delivery.applicationId === applicationId,
    deliveryAllowed: input.delivery.deliveryAllowed === true,
    borrowerDisclosureAllowed:
      input.delivery.borrowerDisclosureAllowed === true,
    deliveryReadyForProvider: deliveryReadyForProvider(input.delivery),
    deliveryProviderConfigured:
      input.delivery.deliveryProviderConfigured === true,
    deliveryProviderRefMatches: providerRefMatches({
      deliveryProviderRef: input.delivery.deliveryProviderRef,
      providerId: input.providerId,
    }),
    providerAdapterApproved: approvedStatus(input.providerAdapterStatus),
    credentialRefPresent,
    credentialApproved: approvedStatus(input.credentialStatus),
    outagePolicyPresent,
    outagePolicyTested: testedStatus(input.outageStatus),
    retryPolicyAttached: Boolean(normalizeText(input.retryPolicyRef)),
    returnedMailPolicyAttached: Boolean(
      normalizeText(input.returnedMailPolicyRef)
    ),
    failedDeliveryPolicyAttached: Boolean(
      normalizeText(input.failedDeliveryPolicyRef)
    ),
    disputeIntakeAttached: Boolean(normalizeText(input.disputeIntakeRef)),
    replayPolicyPresent,
    replayPolicyVerified: verifiedStatus(input.replayStatus),
    schemaContractPresent,
    schemaContractVerified: verifiedStatus(input.schemaContractStatus),
    consentRefPresent,
    consentVerified: verifiedStatus(input.consentStatus),
    isolationRefPresent,
    isolationVerified: verifiedStatus(input.isolationStatus),
    operationalRunbookPresent,
    operationalRunbookApproved: approvedStatus(input.operationalRunbookStatus),
    externalProviderActionPerformed: false,
  };
}

function gatesComplete(gates: BorrowerNoticeProviderExecutionGates): boolean {
  return (
    gates.deliveryFound &&
    gates.applicationMatches &&
    gates.deliveryAllowed &&
    gates.borrowerDisclosureAllowed &&
    gates.deliveryReadyForProvider &&
    gates.deliveryProviderConfigured &&
    gates.deliveryProviderRefMatches &&
    gates.providerAdapterApproved &&
    gates.credentialRefPresent &&
    gates.credentialApproved &&
    gates.outagePolicyPresent &&
    gates.outagePolicyTested &&
    gates.retryPolicyAttached &&
    gates.returnedMailPolicyAttached &&
    gates.failedDeliveryPolicyAttached &&
    gates.disputeIntakeAttached &&
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
    gates.externalProviderActionPerformed === false
  );
}

function executionStatus(allowed: boolean): string {
  return allowed
    ? "PROVIDER_EXECUTION_AUTHORIZED_NOT_SENT"
    : "PROVIDER_EXECUTION_BLOCKED";
}

async function loadDelivery(deliveryId: string): Promise<NoticeDelivery> {
  const rows = await db
    .select()
    .from(borrowerNoticeDeliveries)
    .where(eq(borrowerNoticeDeliveries.id, deliveryId))
    .limit(1);
  const delivery = rows[0] ?? null;

  if (!delivery) {
    throw new Error("Borrower notice delivery not found for provider execution.");
  }

  return delivery;
}

export async function persistBorrowerNoticeProviderExecution(
  input: PersistBorrowerNoticeProviderExecutionInput
): Promise<BorrowerNoticeProviderExecutionResult> {
  const deliveryId = normalizeRequiredText(input.deliveryId, "deliveryId");
  const providerId = normalizeRequiredText(input.providerId, "providerId");
  const delivery = await loadDelivery(deliveryId);
  const providerType = normalizeProviderType(input.providerType);
  const gates = providerExecutionGates({
    delivery,
    applicationId: input.applicationId,
    providerId,
    providerAdapterStatus: input.providerAdapterStatus,
    credentialRef: input.credentialRef,
    credentialStatus: input.credentialStatus,
    retryPolicyRef: input.retryPolicyRef,
    returnedMailPolicyRef: input.returnedMailPolicyRef,
    failedDeliveryPolicyRef: input.failedDeliveryPolicyRef,
    disputeIntakeRef: input.disputeIntakeRef,
    outagePolicyRef: input.outagePolicyRef,
    outageStatus: input.outageStatus,
    replayPolicyRef: input.replayPolicyRef,
    replayStatus: input.replayStatus,
    operationalRunbookRef: input.operationalRunbookRef,
    operationalRunbookStatus: input.operationalRunbookStatus,
    schemaContractVersion: input.schemaContractVersion,
    schemaContractStatus: input.schemaContractStatus,
    consentRef: input.consentRef,
    consentStatus: input.consentStatus,
    isolationRef: input.isolationRef,
    isolationStatus: input.isolationStatus,
  });
  const providerExecutionAllowed = gatesComplete(gates);
  const status = executionStatus(providerExecutionAllowed);
  const now = new Date();
  const executionRows = await db
    .insert(borrowerNoticeProviderExecutions)
    .values({
      deliveryId,
      decisionNoticeId: delivery.decisionNoticeId,
      applicationId:
        normalizeText(input.applicationId) ?? delivery.applicationId,
      borrowerId: normalizeText(input.borrowerId) ?? delivery.borrowerId,
      tenantId: normalizeText(input.tenantId) ?? delivery.tenantId,
      actorId: normalizeText(input.actorId),
      providerId,
      providerType,
      deliveryChannel: delivery.deliveryChannel,
      executionStatus: status,
      providerExecutionRef: normalizeText(input.providerExecutionRef),
      providerEventId: normalizeText(input.providerEventId),
      providerResponseRef: normalizeText(input.providerResponseRef),
      credentialRef: normalizeText(input.credentialRef),
      retryPolicyRef: normalizeText(input.retryPolicyRef),
      returnedMailPolicyRef: normalizeText(input.returnedMailPolicyRef),
      failedDeliveryPolicyRef: normalizeText(input.failedDeliveryPolicyRef),
      disputeIntakeRef: normalizeText(input.disputeIntakeRef),
      outagePolicyRef: normalizeText(input.outagePolicyRef),
      replayPolicyRef: normalizeText(input.replayPolicyRef),
      operationalRunbookRef: normalizeText(input.operationalRunbookRef),
      schemaContractVersion: normalizeText(input.schemaContractVersion),
      consentRef: normalizeText(input.consentRef),
      isolationRef: normalizeText(input.isolationRef),
      deliveryAllowedSnapshot: delivery.deliveryAllowed === true,
      borrowerDisclosureAllowedSnapshot:
        delivery.borrowerDisclosureAllowed === true,
      deliveryProviderConfigured:
        delivery.deliveryProviderConfigured === true,
      providerAdapterApproved: gates.providerAdapterApproved,
      credentialApproved: gates.credentialApproved,
      outagePolicyTested: gates.outagePolicyTested,
      retryPolicyAttached: gates.retryPolicyAttached,
      returnedMailPolicyAttached: gates.returnedMailPolicyAttached,
      failedDeliveryPolicyAttached: gates.failedDeliveryPolicyAttached,
      disputeIntakeAttached: gates.disputeIntakeAttached,
      replayPolicyVerified: gates.replayPolicyVerified,
      schemaContractVerified: gates.schemaContractVerified,
      consentVerified: gates.consentVerified,
      isolationVerified: gates.isolationVerified,
      operationalRunbookApproved: gates.operationalRunbookApproved,
      providerExecutionAllowed,
      externalProviderActionPerformed: false,
      humanReviewRequired: !providerExecutionAllowed,
      executionAuthorizedAt: providerExecutionAllowed ? now : null,
      externalProviderActionAt: null,
      governanceVersion: GOVERNANCE_VERSION,
      classification: CLASSIFICATION,
      replayRef: input.traceId,
      traceId: input.traceId,
      source: PROVIDER_EXECUTION_SOURCE,
      metadata: {
        ...(input.metadata ?? {}),
        gates,
        providerAdapterStatus: normalizeText(input.providerAdapterStatus),
        credentialStatus: normalizeText(input.credentialStatus),
        outageStatus: normalizeText(input.outageStatus),
        replayStatus: normalizeText(input.replayStatus),
        operationalRunbookStatus: normalizeText(
          input.operationalRunbookStatus
        ),
        schemaContractStatus: normalizeText(input.schemaContractStatus),
        consentStatus: normalizeText(input.consentStatus),
        isolationStatus: normalizeText(input.isolationStatus),
        externalProviderActionPerformed: false,
        borrowerNoticeProviderExecutionRuntimeVersion:
          "borrower-notice-provider-execution-runtime-v0.1.0",
      },
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  const execution = executionRows[0];

  const updatedDelivery =
    providerExecutionAllowed
      ? (
          await db
            .update(borrowerNoticeDeliveries)
            .set({
              deliveryStatus: status,
              deliveryProviderConfigured: true,
              externalDeliveryPerformed: false,
              externalDeliveredAt: null,
              updatedAt: now,
            })
            .where(eq(borrowerNoticeDeliveries.id, deliveryId))
            .returning()
        )[0] ?? delivery
      : delivery;

  return {
    delivery: updatedDelivery,
    execution,
    gates,
    providerExecutionAllowed,
    executionStatus: status,
  };
}
