import { eq } from "drizzle-orm";

import {
  borrowerNoticeDeliveries,
  borrowerNoticeDeliveryReceipts,
  borrowerNoticeExceptionResolutions,
  operatorReviewQueueItems,
} from "@/db/schema";
import { db } from "@/lib/db";

/**
 * Canonical Borrower Notice Exception Resolution Runtime
 *
 * Master Volume Governance:
 * - Vol I: Preserves accountable authority before notice exceptions close.
 * - Vol II: Blocks closure unless delivery, retry, dispute, contact, appeal,
 *   retention, and borrower-disclosure controls remain intact.
 * - Vol III: Provides deterministic replay-safe exception resolution and
 *   operator queue lifecycle evidence.
 * - Vol IV: Supports failed-delivery recovery, dispute handling, escalation,
 *   operator resolution, and audit preparation.
 * - Vol V: Enforces classification, observability, replayability, version
 *   lineage, controlled disclosure, and evidence preservation.
 */

const GOVERNANCE_VERSION = "master-volumes-runtime-v0.1.0";
const CLASSIFICATION = "CONFIDENTIAL";
const NOTICE_EXCEPTION_SOURCE = "borrower-notice-exception-resolution-runtime";

type QueueItem = typeof operatorReviewQueueItems.$inferSelect;
type NoticeReceipt = typeof borrowerNoticeDeliveryReceipts.$inferSelect;
type NoticeDelivery = typeof borrowerNoticeDeliveries.$inferSelect;

export type PersistBorrowerNoticeExceptionResolutionInput = {
  traceId: string;
  queueItemId?: string | null;
  receiptId?: string | null;
  applicationId?: string | null;
  borrowerId?: string | null;
  tenantId?: string | null;
  actorId?: string | null;
  exceptionType?: string | null;
  resolutionAction?: string | null;
  resolutionEvidenceRef?: string | null;
  operatorAttestationRef?: string | null;
  borrowerContactRef?: string | null;
  retryPlanRef?: string | null;
  disputeResolutionRef?: string | null;
  retentionPolicyRef?: string | null;
  humanReviewCompleted?: boolean | null;
  metadata?: Record<string, unknown>;
};

export type BorrowerNoticeExceptionResolutionGates = {
  queueItemFound: boolean;
  queueTypeMatches: boolean;
  queueSourceMatches: boolean;
  queueIsOpenForResolution: boolean;
  receiptFound: boolean;
  receiptMatchesQueue: boolean;
  receiptAccepted: boolean;
  receiptRequiresOperatorReview: boolean;
  deliveryFound: boolean;
  applicationMatches: boolean;
  exceptionTypeAllowed: boolean;
  resolutionActionAllowed: boolean;
  resolutionEvidenceAttached: boolean;
  operatorAttestationAttached: boolean;
  humanReviewCompleted: boolean;
  retentionPolicyAttached: boolean;
  retryEvidenceSatisfied: boolean;
  contactEvidenceSatisfied: boolean;
  disputeEvidenceSatisfied: boolean;
  externalProviderActionPerformed: false;
};

export type BorrowerNoticeExceptionResolutionResult = {
  queueItem: QueueItem;
  receipt: NoticeReceipt;
  delivery: NoticeDelivery;
  resolution: typeof borrowerNoticeExceptionResolutions.$inferSelect;
  gates: BorrowerNoticeExceptionResolutionGates;
  resolutionAllowed: boolean;
  queueCompleted: boolean;
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

function normalizeExceptionType(value: unknown, receipt: NoticeReceipt): string {
  const normalized = normalizeText(value)?.toUpperCase();
  const allowed = new Set([
    "DELIVERY_FAILED",
    "NOTICE_RETURNED",
    "DELIVERY_BOUNCED",
    "DELIVERY_DISPUTED",
    "RETRY_REQUIRED",
  ]);

  if (normalized && allowed.has(normalized)) {
    return normalized;
  }

  if (receipt.deliveryOutcome === "DISPUTED") {
    return "DELIVERY_DISPUTED";
  }

  if (receipt.deliveryOutcome === "RETURNED") {
    return "NOTICE_RETURNED";
  }

  if (receipt.deliveryOutcome === "BOUNCED") {
    return "DELIVERY_BOUNCED";
  }

  if (receipt.retryRequired) {
    return "RETRY_REQUIRED";
  }

  return "DELIVERY_FAILED";
}

function normalizeResolutionAction(value: unknown): string {
  const normalized = normalizeText(value)?.toUpperCase();
  const allowed = new Set([
    "AUTHORIZE_RETRY",
    "UPDATE_CONTACT_AND_AUTHORIZE_RETRY",
    "MARK_DELIVERY_CONFIRMED_BY_EVIDENCE",
    "CLOSE_NO_RETRY",
    "RESOLVE_DISPUTE",
  ]);

  return normalized && allowed.has(normalized)
    ? normalized
    : "CLOSE_NO_RETRY";
}

function queueCanClose(status: string): boolean {
  return new Set(["OPEN", "ASSIGNED", "IN_PROGRESS", "ESCALATED"]).has(status);
}

function actionAllowsRetry(action: string): boolean {
  return (
    action === "AUTHORIZE_RETRY" ||
    action === "UPDATE_CONTACT_AND_AUTHORIZE_RETRY"
  );
}

function actionRequiresContact(action: string, exceptionType: string): boolean {
  return (
    action === "UPDATE_CONTACT_AND_AUTHORIZE_RETRY" ||
    exceptionType === "NOTICE_RETURNED" ||
    exceptionType === "DELIVERY_BOUNCED"
  );
}

function actionRequiresDisputeResolution(
  action: string,
  exceptionType: string
): boolean {
  return action === "RESOLVE_DISPUTE" || exceptionType === "DELIVERY_DISPUTED";
}

function resolutionStatus(allowed: boolean): string {
  return allowed ? "RESOLUTION_APPROVED" : "RESOLUTION_BLOCKED";
}

function deliveryStatusAfterResolution(input: {
  exceptionType: string;
  resolutionAction: string;
}): string {
  if (actionAllowsRetry(input.resolutionAction)) {
    return "DELIVERY_RETRY_AUTHORIZED";
  }

  if (input.resolutionAction === "MARK_DELIVERY_CONFIRMED_BY_EVIDENCE") {
    return "DELIVERY_CONFIRMED_BY_OPERATOR_EVIDENCE";
  }

  if (input.exceptionType === "DELIVERY_DISPUTED") {
    return "DELIVERY_DISPUTE_RESOLVED";
  }

  return "DELIVERY_EXCEPTION_RESOLVED";
}

function resolutionGates(input: {
  queueItem: QueueItem;
  receipt: NoticeReceipt;
  delivery: NoticeDelivery;
  requestedReceiptId?: string | null;
  requestedApplicationId?: string | null;
  exceptionType: string;
  resolutionAction: string;
  resolutionEvidenceRef?: string | null;
  operatorAttestationRef?: string | null;
  borrowerContactRef?: string | null;
  retryPlanRef?: string | null;
  disputeResolutionRef?: string | null;
  retentionPolicyRef?: string | null;
  humanReviewCompleted?: boolean | null;
}): BorrowerNoticeExceptionResolutionGates {
  const requestedReceiptId = normalizeText(input.requestedReceiptId);
  const requestedApplicationId = normalizeText(input.requestedApplicationId);
  const receiptIdMatches =
    !requestedReceiptId || String(input.receipt.id) === requestedReceiptId;
  const applicationMatches =
    !requestedApplicationId ||
    input.receipt.applicationId === requestedApplicationId;
  const retentionPolicyRef =
    normalizeText(input.retentionPolicyRef) ||
    normalizeText(input.receipt.retentionPolicyRef);

  return {
    queueItemFound: true,
    queueTypeMatches: input.queueItem.queueType === "NOTICE_DELIVERY_REVIEW",
    queueSourceMatches:
      input.queueItem.sourceType === "borrower_notice_delivery_receipt",
    queueIsOpenForResolution: queueCanClose(input.queueItem.status),
    receiptFound: true,
    receiptMatchesQueue:
      receiptIdMatches && input.queueItem.sourceId === String(input.receipt.id),
    receiptAccepted: input.receipt.receiptAccepted === true,
    receiptRequiresOperatorReview:
      input.receipt.operatorReviewRequired === true,
    deliveryFound: true,
    applicationMatches,
    exceptionTypeAllowed: new Set([
      "DELIVERY_FAILED",
      "NOTICE_RETURNED",
      "DELIVERY_BOUNCED",
      "DELIVERY_DISPUTED",
      "RETRY_REQUIRED",
    ]).has(input.exceptionType),
    resolutionActionAllowed: new Set([
      "AUTHORIZE_RETRY",
      "UPDATE_CONTACT_AND_AUTHORIZE_RETRY",
      "MARK_DELIVERY_CONFIRMED_BY_EVIDENCE",
      "CLOSE_NO_RETRY",
      "RESOLVE_DISPUTE",
    ]).has(input.resolutionAction),
    resolutionEvidenceAttached: Boolean(
      normalizeText(input.resolutionEvidenceRef)
    ),
    operatorAttestationAttached: Boolean(
      normalizeText(input.operatorAttestationRef)
    ),
    humanReviewCompleted: input.humanReviewCompleted === true,
    retentionPolicyAttached: Boolean(retentionPolicyRef),
    retryEvidenceSatisfied: actionAllowsRetry(input.resolutionAction)
      ? Boolean(normalizeText(input.retryPlanRef))
      : true,
    contactEvidenceSatisfied: actionRequiresContact(
      input.resolutionAction,
      input.exceptionType
    )
      ? Boolean(normalizeText(input.borrowerContactRef))
      : true,
    disputeEvidenceSatisfied: actionRequiresDisputeResolution(
      input.resolutionAction,
      input.exceptionType
    )
      ? Boolean(normalizeText(input.disputeResolutionRef))
      : true,
    externalProviderActionPerformed: false,
  };
}

function gatesComplete(gates: BorrowerNoticeExceptionResolutionGates): boolean {
  return (
    gates.queueItemFound &&
    gates.queueTypeMatches &&
    gates.queueSourceMatches &&
    gates.queueIsOpenForResolution &&
    gates.receiptFound &&
    gates.receiptMatchesQueue &&
    gates.receiptAccepted &&
    gates.receiptRequiresOperatorReview &&
    gates.deliveryFound &&
    gates.applicationMatches &&
    gates.exceptionTypeAllowed &&
    gates.resolutionActionAllowed &&
    gates.resolutionEvidenceAttached &&
    gates.operatorAttestationAttached &&
    gates.humanReviewCompleted &&
    gates.retentionPolicyAttached &&
    gates.retryEvidenceSatisfied &&
    gates.contactEvidenceSatisfied &&
    gates.disputeEvidenceSatisfied &&
    gates.externalProviderActionPerformed === false
  );
}

async function loadQueueItem(queueItemId: string): Promise<QueueItem> {
  const rows = await db
    .select()
    .from(operatorReviewQueueItems)
    .where(eq(operatorReviewQueueItems.id, queueItemId))
    .limit(1);
  const queueItem = rows[0] ?? null;

  if (!queueItem) {
    throw new Error("Notice exception queue item not found.");
  }

  return queueItem;
}

async function loadReceipt(receiptId: string): Promise<NoticeReceipt> {
  const rows = await db
    .select()
    .from(borrowerNoticeDeliveryReceipts)
    .where(eq(borrowerNoticeDeliveryReceipts.id, receiptId))
    .limit(1);
  const receipt = rows[0] ?? null;

  if (!receipt) {
    throw new Error("Borrower notice delivery receipt not found.");
  }

  return receipt;
}

async function loadDelivery(deliveryId: string): Promise<NoticeDelivery> {
  const rows = await db
    .select()
    .from(borrowerNoticeDeliveries)
    .where(eq(borrowerNoticeDeliveries.id, deliveryId))
    .limit(1);
  const delivery = rows[0] ?? null;

  if (!delivery) {
    throw new Error("Borrower notice delivery not found.");
  }

  return delivery;
}

export async function persistBorrowerNoticeExceptionResolution(
  input: PersistBorrowerNoticeExceptionResolutionInput
): Promise<BorrowerNoticeExceptionResolutionResult> {
  const queueItemId = normalizeRequiredText(input.queueItemId, "queueItemId");
  const queueItem = await loadQueueItem(queueItemId);
  const receiptId =
    normalizeText(input.receiptId) ??
    normalizeRequiredText(queueItem.sourceId, "receiptId");
  const receipt = await loadReceipt(receiptId);
  const delivery = await loadDelivery(String(receipt.deliveryId));
  const exceptionType = normalizeExceptionType(input.exceptionType, receipt);
  const resolutionAction = normalizeResolutionAction(input.resolutionAction);
  const gates = resolutionGates({
    queueItem,
    receipt,
    delivery,
    requestedReceiptId: input.receiptId,
    requestedApplicationId: input.applicationId,
    exceptionType,
    resolutionAction,
    resolutionEvidenceRef: input.resolutionEvidenceRef,
    operatorAttestationRef: input.operatorAttestationRef,
    borrowerContactRef: input.borrowerContactRef,
    retryPlanRef: input.retryPlanRef,
    disputeResolutionRef: input.disputeResolutionRef,
    retentionPolicyRef: input.retentionPolicyRef,
    humanReviewCompleted: input.humanReviewCompleted,
  });
  const resolutionAllowed = gatesComplete(gates);
  const now = new Date();
  const queueStatusAfter = resolutionAllowed ? "COMPLETED" : queueItem.status;
  const retryAuthorized = resolutionAllowed && actionAllowsRetry(resolutionAction);
  const retentionPolicyRef =
    normalizeText(input.retentionPolicyRef) ?? receipt.retentionPolicyRef;
  const resolutionRows = await db
    .insert(borrowerNoticeExceptionResolutions)
    .values({
      queueItemId,
      receiptId,
      deliveryId: receipt.deliveryId,
      decisionNoticeId: receipt.decisionNoticeId,
      applicationId:
        normalizeText(input.applicationId) ?? receipt.applicationId,
      borrowerId: normalizeText(input.borrowerId) ?? receipt.borrowerId,
      tenantId: normalizeText(input.tenantId) ?? receipt.tenantId,
      actorId: normalizeText(input.actorId),
      exceptionType,
      resolutionAction,
      resolutionStatus: resolutionStatus(resolutionAllowed),
      queueStatusBefore: queueItem.status,
      queueStatusAfter,
      resolutionEvidenceRef: normalizeText(input.resolutionEvidenceRef),
      operatorAttestationRef: normalizeText(input.operatorAttestationRef),
      borrowerContactRef: normalizeText(input.borrowerContactRef),
      retryPlanRef: normalizeText(input.retryPlanRef),
      disputeResolutionRef: normalizeText(input.disputeResolutionRef),
      retentionPolicyRef,
      resolutionAllowed,
      queueCompleted: resolutionAllowed,
      retryAuthorized,
      borrowerDisclosureAllowed: false,
      externalProviderActionPerformed: false,
      humanReviewCompleted: input.humanReviewCompleted === true,
      resolvedAt: resolutionAllowed ? now : null,
      governanceVersion: GOVERNANCE_VERSION,
      classification: CLASSIFICATION,
      replayRef: input.traceId,
      traceId: input.traceId,
      source: NOTICE_EXCEPTION_SOURCE,
      metadata: {
        ...(input.metadata ?? {}),
        gates,
        queueItemId,
        receiptId,
        deliveryId: receipt.deliveryId,
        borrowerNoticeExceptionResolutionRuntimeVersion:
          "borrower-notice-exception-resolution-runtime-v0.1.0",
        externalProviderActionPerformed: false,
      },
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  const resolution = resolutionRows[0];

  if (resolutionAllowed) {
    await db
      .update(operatorReviewQueueItems)
      .set({
        status: "COMPLETED",
        completedAt: now,
        updatedAt: now,
        metadata: {
          ...(typeof queueItem.metadata === "object" &&
          queueItem.metadata !== null &&
          !Array.isArray(queueItem.metadata)
            ? queueItem.metadata
            : {}),
          noticeExceptionResolutionId: resolution.id,
          noticeExceptionResolutionTraceId: input.traceId,
          noticeExceptionResolutionAction: resolutionAction,
        },
      })
      .where(eq(operatorReviewQueueItems.id, queueItemId));

    await db
      .update(borrowerNoticeDeliveries)
      .set({
        deliveryStatus: deliveryStatusAfterResolution({
          exceptionType,
          resolutionAction,
        }),
        updatedAt: now,
      })
      .where(eq(borrowerNoticeDeliveries.id, receipt.deliveryId));

    if (exceptionType === "DELIVERY_DISPUTED") {
      await db
        .update(borrowerNoticeDeliveryReceipts)
        .set({
          disputeStatus: "DISPUTE_RESOLVED",
          updatedAt: now,
        })
        .where(eq(borrowerNoticeDeliveryReceipts.id, receiptId));
    }
  }

  return {
    queueItem,
    receipt,
    delivery,
    resolution,
    gates,
    resolutionAllowed,
    queueCompleted: resolutionAllowed,
  };
}
