import { eq } from "drizzle-orm";

import {
  borrowerNoticeDeliveries,
  borrowerNoticeDeliveryReceipts,
} from "@/db/schema";
import { db } from "@/lib/db";
import { persistOperatorReviewQueueItem } from "@/lib/queues/operatorReviewQueueStore";

/**
 * Canonical Borrower Notice Delivery Receipt Runtime
 *
 * Master Volume Governance:
 * - Vol I: Preserves accountable authority for receipt evidence.
 * - Vol II: Records delivery, failure, return, retry, and dispute signals
 *   without weakening borrower notice or appeal protections.
 * - Vol III: Provides deterministic, replay-safe lifecycle evidence.
 * - Vol IV: Supports delivery monitoring, failed-delivery response,
 *   dispute intake, recovery, escalation, and audit preparation.
 * - Vol V: Enforces classification, explainability, observability, replay,
 *   version lineage, controlled disclosure, and evidence preservation.
 */

const GOVERNANCE_VERSION = "master-volumes-runtime-v0.1.0";
const CLASSIFICATION = "CONFIDENTIAL";
const NOTICE_RECEIPT_SOURCE = "borrower-notice-receipt-runtime";

type NoticeDelivery = typeof borrowerNoticeDeliveries.$inferSelect;

export type PersistBorrowerNoticeReceiptInput = {
  traceId: string;
  deliveryId?: string | null;
  applicationId?: string | null;
  borrowerId?: string | null;
  tenantId?: string | null;
  actorId?: string | null;
  receiptType?: string | null;
  deliveryOutcome?: string | null;
  providerStatus?: string | null;
  failureReasonCode?: string | null;
  providerEventId?: string | null;
  receiptEvidenceRef?: string | null;
  deliveryTrackingRef?: string | null;
  disputeCaseRef?: string | null;
  retryPolicyRef?: string | null;
  retryRequired?: boolean | null;
  receiptReceivedAt?: string | Date | null;
  metadata?: Record<string, unknown>;
};

export type BorrowerNoticeReceiptGates = {
  deliveryFound: boolean;
  applicationMatches: boolean;
  deliveryWasAllowed: boolean;
  borrowerDisclosureWasAllowed: boolean;
  deliveryProviderWasConfigured: boolean;
  providerEventAttached: boolean;
  receiptEvidenceAttached: boolean;
  deliveryTrackingAvailable: boolean;
  retentionPolicyAvailable: boolean;
  receiptOutcomeAllowed: boolean;
  externalDeliveryPerformedByRuntime: false;
};

export type BorrowerNoticeReceiptResult = {
  delivery: NoticeDelivery;
  receipt: typeof borrowerNoticeDeliveryReceipts.$inferSelect;
  operatorQueueItem:
    | Awaited<ReturnType<typeof persistOperatorReviewQueueItem>>["queueItem"]
    | null;
  gates: BorrowerNoticeReceiptGates;
  receiptAccepted: boolean;
  deliveryStatusAfterReceipt: string;
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

function normalizeReceiptType(value: unknown): string {
  const normalized = normalizeText(value)?.toUpperCase();
  const allowed = new Set([
    "DELIVERY_CONFIRMATION",
    "DELIVERY_FAILURE",
    "RETURNED_NOTICE",
    "DELIVERY_DISPUTE",
    "STATUS_UPDATE",
  ]);

  return normalized && allowed.has(normalized)
    ? normalized
    : "STATUS_UPDATE";
}

function normalizeDeliveryOutcome(value: unknown): string {
  const normalized = normalizeText(value)?.toUpperCase();
  const allowed = new Set([
    "DELIVERED",
    "FAILED",
    "RETURNED",
    "BOUNCED",
    "DISPUTED",
    "PENDING",
  ]);

  return normalized && allowed.has(normalized) ? normalized : "PENDING";
}

function parseDate(value: string | Date | null | undefined): Date {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = new Date(value);

    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return new Date();
}

function receiptStatus(accepted: boolean): string {
  return accepted ? "RECEIPT_ACCEPTED" : "RECEIPT_BLOCKED";
}

function disputeStatus(input: {
  deliveryOutcome: string;
  disputeCaseRef?: string | null;
}): string {
  if (
    input.deliveryOutcome === "DISPUTED" ||
    Boolean(normalizeText(input.disputeCaseRef))
  ) {
    return "DISPUTE_OPEN";
  }

  return "NO_DISPUTE";
}

function retryRequired(input: {
  deliveryOutcome: string;
  retryRequired?: boolean | null;
}): boolean {
  return (
    input.retryRequired === true ||
    input.deliveryOutcome === "FAILED" ||
    input.deliveryOutcome === "RETURNED" ||
    input.deliveryOutcome === "BOUNCED"
  );
}

function operatorReviewRequired(input: {
  deliveryOutcome: string;
  retryRequired: boolean;
}): boolean {
  return input.retryRequired || input.deliveryOutcome === "DISPUTED";
}

function deliveryStatusAfterReceipt(deliveryOutcome: string): string {
  if (deliveryOutcome === "DELIVERED") {
    return "DELIVERY_RECEIPT_CONFIRMED";
  }

  if (deliveryOutcome === "FAILED") {
    return "DELIVERY_FAILED_REVIEW_REQUIRED";
  }

  if (deliveryOutcome === "RETURNED" || deliveryOutcome === "BOUNCED") {
    return "DELIVERY_RETURNED_REVIEW_REQUIRED";
  }

  if (deliveryOutcome === "DISPUTED") {
    return "DELIVERY_DISPUTE_REVIEW_REQUIRED";
  }

  return "DELIVERY_RECEIPT_PENDING";
}

function reviewPriority(deliveryOutcome: string): string {
  if (deliveryOutcome === "DISPUTED") {
    return "URGENT";
  }

  if (
    deliveryOutcome === "FAILED" ||
    deliveryOutcome === "RETURNED" ||
    deliveryOutcome === "BOUNCED"
  ) {
    return "HIGH";
  }

  return "NORMAL";
}

function reviewReason(input: {
  deliveryOutcome: string;
  failureReasonCode?: string | null;
  disputeCaseRef?: string | null;
}): string {
  if (input.deliveryOutcome === "DISPUTED") {
    return `Borrower notice delivery dispute requires operator review. Dispute ref: ${
      normalizeText(input.disputeCaseRef) ?? "not provided"
    }.`;
  }

  if (input.deliveryOutcome === "RETURNED") {
    return "Borrower notice was returned and requires operator review before retry or alternate delivery.";
  }

  if (input.deliveryOutcome === "BOUNCED") {
    return "Borrower notice bounced and requires operator review before retry or alternate delivery.";
  }

  if (input.deliveryOutcome === "FAILED") {
    return `Borrower notice delivery failed and requires operator review. Failure code: ${
      normalizeText(input.failureReasonCode) ?? "not provided"
    }.`;
  }

  return "Borrower notice delivery receipt requires operator review.";
}

function receiptGates(input: {
  delivery: NoticeDelivery;
  applicationId?: string | null;
  deliveryOutcome: string;
  providerEventId?: string | null;
  receiptEvidenceRef?: string | null;
  deliveryTrackingRef?: string | null;
}): BorrowerNoticeReceiptGates {
  const applicationId = normalizeText(input.applicationId);

  return {
    deliveryFound: true,
    applicationMatches:
      !applicationId || input.delivery.applicationId === applicationId,
    deliveryWasAllowed: input.delivery.deliveryAllowed === true,
    borrowerDisclosureWasAllowed:
      input.delivery.borrowerDisclosureAllowed === true,
    deliveryProviderWasConfigured:
      input.delivery.deliveryProviderConfigured === true,
    providerEventAttached: Boolean(normalizeText(input.providerEventId)),
    receiptEvidenceAttached: Boolean(normalizeText(input.receiptEvidenceRef)),
    deliveryTrackingAvailable: Boolean(
      normalizeText(input.deliveryTrackingRef) ||
        normalizeText(input.delivery.deliveryTrackingRef)
    ),
    retentionPolicyAvailable: Boolean(
      normalizeText(input.delivery.retentionPolicyRef)
    ),
    receiptOutcomeAllowed: new Set([
      "DELIVERED",
      "FAILED",
      "RETURNED",
      "BOUNCED",
      "DISPUTED",
      "PENDING",
    ]).has(input.deliveryOutcome),
    externalDeliveryPerformedByRuntime: false,
  };
}

function gatesComplete(gates: BorrowerNoticeReceiptGates): boolean {
  return (
    gates.deliveryFound &&
    gates.applicationMatches &&
    gates.deliveryWasAllowed &&
    gates.borrowerDisclosureWasAllowed &&
    gates.deliveryProviderWasConfigured &&
    gates.providerEventAttached &&
    gates.receiptEvidenceAttached &&
    gates.deliveryTrackingAvailable &&
    gates.retentionPolicyAvailable &&
    gates.receiptOutcomeAllowed &&
    gates.externalDeliveryPerformedByRuntime === false
  );
}

async function loadDelivery(deliveryId: string): Promise<NoticeDelivery> {
  const rows = await db
    .select()
    .from(borrowerNoticeDeliveries)
    .where(eq(borrowerNoticeDeliveries.id, deliveryId))
    .limit(1);
  const delivery = rows[0] ?? null;

  if (!delivery) {
    throw new Error("Borrower notice delivery not found for receipt intake.");
  }

  return delivery;
}

export async function persistBorrowerNoticeReceipt(
  input: PersistBorrowerNoticeReceiptInput
): Promise<BorrowerNoticeReceiptResult> {
  const deliveryId = normalizeRequiredText(input.deliveryId, "deliveryId");
  const delivery = await loadDelivery(deliveryId);
  const receiptType = normalizeReceiptType(input.receiptType);
  const deliveryOutcome = normalizeDeliveryOutcome(input.deliveryOutcome);
  const receivedAt = parseDate(input.receiptReceivedAt);
  const gates = receiptGates({
    delivery,
    applicationId: input.applicationId,
    deliveryOutcome,
    providerEventId: input.providerEventId,
    receiptEvidenceRef: input.receiptEvidenceRef,
    deliveryTrackingRef: input.deliveryTrackingRef,
  });
  const receiptAccepted = gatesComplete(gates);
  const nextDeliveryStatus = deliveryStatusAfterReceipt(deliveryOutcome);
  const retryNeeded = retryRequired({
    deliveryOutcome,
    retryRequired: input.retryRequired,
  });
  const reviewNeeded = operatorReviewRequired({
    deliveryOutcome,
    retryRequired: retryNeeded,
  });
  const now = new Date();
  const receiptRows = await db
    .insert(borrowerNoticeDeliveryReceipts)
    .values({
      deliveryId,
      decisionNoticeId: delivery.decisionNoticeId,
      applicationId:
        normalizeText(input.applicationId) ?? delivery.applicationId,
      borrowerId: normalizeText(input.borrowerId) ?? delivery.borrowerId,
      tenantId: normalizeText(input.tenantId) ?? delivery.tenantId,
      actorId: normalizeText(input.actorId),
      receiptType,
      deliveryChannel: delivery.deliveryChannel,
      deliveryOutcome,
      receiptStatus: receiptStatus(receiptAccepted),
      providerStatus: normalizeText(input.providerStatus),
      failureReasonCode: normalizeText(input.failureReasonCode),
      disputeStatus: disputeStatus({
        deliveryOutcome,
        disputeCaseRef: input.disputeCaseRef,
      }),
      deliveryProviderRef: delivery.deliveryProviderRef,
      providerEventId: normalizeText(input.providerEventId),
      receiptEvidenceRef: normalizeText(input.receiptEvidenceRef),
      deliveryTrackingRef:
        normalizeText(input.deliveryTrackingRef) ??
        delivery.deliveryTrackingRef,
      retentionPolicyRef: delivery.retentionPolicyRef,
      disputeCaseRef: normalizeText(input.disputeCaseRef),
      retryPolicyRef: normalizeText(input.retryPolicyRef),
      receiptAccepted,
      providerDeliveryEventRecorded: receiptAccepted,
      externalDeliveryPerformedByRuntime: false,
      deliveryWasAllowed: delivery.deliveryAllowed === true,
      borrowerDisclosureWasAllowed:
        delivery.borrowerDisclosureAllowed === true,
      deliveryProviderWasConfigured:
        delivery.deliveryProviderConfigured === true,
      retryRequired: retryNeeded,
      operatorReviewRequired: reviewNeeded,
      receiptReceivedAt: receivedAt,
      deliveryConfirmedAt:
        receiptAccepted && deliveryOutcome === "DELIVERED"
          ? receivedAt
          : null,
      failureRecordedAt:
        receiptAccepted &&
        (deliveryOutcome === "FAILED" ||
          deliveryOutcome === "RETURNED" ||
          deliveryOutcome === "BOUNCED")
          ? receivedAt
          : null,
      returnedAt:
        receiptAccepted &&
        (deliveryOutcome === "RETURNED" || deliveryOutcome === "BOUNCED")
          ? receivedAt
          : null,
      governanceVersion: GOVERNANCE_VERSION,
      classification: CLASSIFICATION,
      replayRef: input.traceId,
      traceId: input.traceId,
      source: NOTICE_RECEIPT_SOURCE,
      metadata: {
        ...(input.metadata ?? {}),
        gates,
        borrowerNoticeReceiptRuntimeVersion:
          "borrower-notice-receipt-runtime-v0.1.0",
        externalDeliveryPerformedByRuntime: false,
      },
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  const receipt = receiptRows[0];

  if (receiptAccepted) {
    await db
      .update(borrowerNoticeDeliveries)
      .set({
        deliveryStatus: nextDeliveryStatus,
        externalDeliveryPerformed: true,
        externalDeliveredAt:
          deliveryOutcome === "DELIVERED"
            ? receivedAt
            : delivery.externalDeliveredAt,
        updatedAt: now,
      })
      .where(eq(borrowerNoticeDeliveries.id, deliveryId));
  }

  const operatorQueue =
    receiptAccepted && reviewNeeded
      ? await persistOperatorReviewQueueItem({
          traceId: input.traceId,
          queueType: "NOTICE_DELIVERY_REVIEW",
          sourceType: "borrower_notice_delivery_receipt",
          sourceId: String(receipt.id),
          sourceTraceId: input.traceId,
          applicationId: receipt.applicationId,
          borrowerId: receipt.borrowerId,
          tenantId: receipt.tenantId,
          actorId: normalizeText(input.actorId),
          status: "OPEN",
          priority: reviewPriority(deliveryOutcome),
          escalationStatus:
            deliveryOutcome === "DISPUTED"
              ? "ESCALATION_REVIEW_REQUIRED"
              : undefined,
          reviewReason: reviewReason({
            deliveryOutcome,
            failureReasonCode: input.failureReasonCode,
            disputeCaseRef: input.disputeCaseRef,
          }),
          requiredRole:
            deliveryOutcome === "DISPUTED"
              ? "operator-supervisor"
              : "operator",
          metadata: {
            receiptId: receipt.id,
            deliveryId,
            decisionNoticeId: delivery.decisionNoticeId,
            receiptType,
            deliveryOutcome,
            receiptStatus: receipt.receiptStatus,
            failureReasonCode: normalizeText(input.failureReasonCode),
            disputeCaseRef: normalizeText(input.disputeCaseRef),
            retryPolicyRef: normalizeText(input.retryPolicyRef),
            borrowerNoticeReceiptRuntimeVersion:
              "borrower-notice-receipt-runtime-v0.1.0",
          },
        })
      : null;

  return {
    delivery,
    receipt,
    operatorQueueItem: operatorQueue?.queueItem ?? null,
    gates,
    receiptAccepted,
    deliveryStatusAfterReceipt: receiptAccepted
      ? nextDeliveryStatus
      : delivery.deliveryStatus,
  };
}
