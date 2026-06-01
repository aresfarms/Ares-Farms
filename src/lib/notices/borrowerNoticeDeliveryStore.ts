import { eq } from "drizzle-orm";

import {
  borrowerNoticeDeliveries,
  regulatedDecisionNotices,
} from "@/db/schema";
import { db } from "@/lib/db";

/**
 * Canonical Borrower Notice Delivery Runtime
 *
 * Master Volume Governance:
 * - Vol I: Preserves constitutional authority for borrower notice delivery.
 * - Vol II: Blocks borrower disclosure until final notice, redaction,
 *   appeal, delivery tracking, and retention gates are complete.
 * - Vol III: Provides deterministic, replay-safe notice packet and delivery
 *   state without ungoverned external provider transmission.
 * - Vol IV: Supports delivery monitoring, dispute handling, recovery,
 *   escalation, and audit preparation.
 * - Vol V: Enforces classification, explainability, observability, replay,
 *   version lineage, controlled disclosure, and evidence preservation.
 */

const GOVERNANCE_VERSION = "master-volumes-runtime-v0.1.0";
const CLASSIFICATION = "CONFIDENTIAL";
const NOTICE_DELIVERY_SOURCE = "borrower-notice-delivery-runtime";

export type PersistBorrowerNoticeDeliveryInput = {
  traceId: string;
  decisionNoticeId?: string | null;
  applicationId?: string | null;
  borrowerId?: string | null;
  tenantId?: string | null;
  actorId?: string | null;
  noticeType?: string | null;
  deliveryChannel?: string | null;
  noticePacketRef?: string | null;
  redactionProfileRef?: string | null;
  redactionStatus?: string | null;
  appealPacketRef?: string | null;
  retentionPolicyRef?: string | null;
  deliveryTrackingRef?: string | null;
  deliveryProviderRef?: string | null;
  deliveryProviderConfigured?: boolean | null;
  metadata?: Record<string, unknown>;
};

export type BorrowerNoticeDeliveryGates = {
  decisionNoticeFound: boolean;
  applicationMatches: boolean;
  finalActionAllowed: boolean;
  finalNoticeAllowedOrNotRequired: boolean;
  borrowerDisclosureAllowed: boolean;
  deliveryChannelAllowed: boolean;
  noticePacketPrepared: boolean;
  redactionApproved: boolean;
  appealPacketAttached: boolean;
  retentionPolicyAttached: boolean;
  deliveryTrackingAttached: boolean;
  externalDeliveryPerformed: false;
};

export type BorrowerNoticeDeliveryResult = {
  decisionNotice: typeof regulatedDecisionNotices.$inferSelect;
  delivery: typeof borrowerNoticeDeliveries.$inferSelect;
  gates: BorrowerNoticeDeliveryGates;
  deliveryAllowed: boolean;
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

function normalizeNoticeType(value: unknown): string {
  const normalized = normalizeText(value)?.toUpperCase();
  const allowed = new Set([
    "ADVERSE_ACTION_NOTICE",
    "CREDIT_DECISION_NOTICE",
    "CONDITIONAL_DECISION_NOTICE",
    "APPLICATION_STATUS_NOTICE",
  ]);

  return normalized && allowed.has(normalized)
    ? normalized
    : "ADVERSE_ACTION_NOTICE";
}

function normalizeDeliveryChannel(value: unknown): string {
  const normalized = normalizeText(value)?.toUpperCase();
  const allowed = new Set([
    "SECURE_PORTAL",
    "SECURE_MESSAGE",
    "CONTROLLED_EMAIL",
    "CONTROLLED_MAIL",
  ]);

  return normalized && allowed.has(normalized) ? normalized : "SECURE_PORTAL";
}

function normalizeRedactionStatus(value: unknown): string {
  const normalized = normalizeText(value)?.toUpperCase();
  const allowed = new Set([
    "REDACTION_REQUIRED",
    "REDACTION_APPROVED",
    "APPROVED",
    "BLOCKED",
  ]);

  return normalized && allowed.has(normalized)
    ? normalized
    : "REDACTION_REQUIRED";
}

function noticePacketRef(traceId: string, explicit?: string | null): string {
  return normalizeText(explicit) ?? `notice-packet://${traceId}`;
}

function finalNoticeAllowedOrNotRequired(
  decisionNotice: typeof regulatedDecisionNotices.$inferSelect
): boolean {
  return (
    decisionNotice.finalNoticeAllowed === true ||
    decisionNotice.noticeStatus === "NO_ADVERSE_NOTICE_REQUIRED"
  );
}

function redactionApproved(status: string): boolean {
  return status === "REDACTION_APPROVED" || status === "APPROVED";
}

function deliveryStatus(deliveryAllowed: boolean): string {
  return deliveryAllowed
    ? "CONTROLLED_DELIVERY_READY"
    : "DELIVERY_BLOCKED";
}

function noticePacketStatus(deliveryAllowed: boolean): string {
  return deliveryAllowed ? "PACKET_CREATED" : "PACKET_BLOCKED";
}

function appealPacketStatus(input: {
  appealPacketAttached: boolean;
  adverseActionRequired: boolean;
}): string {
  if (!input.adverseActionRequired) {
    return "NO_APPEAL_PACKET_REQUIRED";
  }

  return input.appealPacketAttached
    ? "APPEAL_PACKET_ATTACHED"
    : "APPEAL_PACKET_REQUIRED";
}

function retentionStatus(attached: boolean): string {
  return attached ? "RETENTION_POLICY_ATTACHED" : "RETENTION_POLICY_REQUIRED";
}

function allowedChannel(channel: string): boolean {
  return new Set([
    "SECURE_PORTAL",
    "SECURE_MESSAGE",
    "CONTROLLED_EMAIL",
    "CONTROLLED_MAIL",
  ]).has(channel);
}

function deliveryGates(input: {
  decisionNotice: typeof regulatedDecisionNotices.$inferSelect;
  applicationId?: string | null;
  deliveryChannel: string;
  noticePacketRef: string;
  redactionStatus: string;
  redactionProfileRef?: string | null;
  appealPacketRef?: string | null;
  retentionPolicyRef?: string | null;
  deliveryTrackingRef?: string | null;
}): BorrowerNoticeDeliveryGates {
  const adverseActionRequired = input.decisionNotice.adverseActionRequired === true;
  const applicationId = normalizeText(input.applicationId);

  return {
    decisionNoticeFound: true,
    applicationMatches:
      !applicationId || input.decisionNotice.applicationId === applicationId,
    finalActionAllowed: input.decisionNotice.finalActionAllowed === true,
    finalNoticeAllowedOrNotRequired: finalNoticeAllowedOrNotRequired(
      input.decisionNotice
    ),
    borrowerDisclosureAllowed:
      input.decisionNotice.borrowerDisclosureAllowed === true,
    deliveryChannelAllowed: allowedChannel(input.deliveryChannel),
    noticePacketPrepared: Boolean(normalizeText(input.noticePacketRef)),
    redactionApproved:
      redactionApproved(input.redactionStatus) &&
      Boolean(normalizeText(input.redactionProfileRef)),
    appealPacketAttached: adverseActionRequired
      ? Boolean(normalizeText(input.appealPacketRef))
      : true,
    retentionPolicyAttached: Boolean(normalizeText(input.retentionPolicyRef)),
    deliveryTrackingAttached: Boolean(normalizeText(input.deliveryTrackingRef)),
    externalDeliveryPerformed: false,
  };
}

function gatesComplete(gates: BorrowerNoticeDeliveryGates): boolean {
  return (
    gates.decisionNoticeFound &&
    gates.applicationMatches &&
    gates.finalActionAllowed &&
    gates.finalNoticeAllowedOrNotRequired &&
    gates.borrowerDisclosureAllowed &&
    gates.deliveryChannelAllowed &&
    gates.noticePacketPrepared &&
    gates.redactionApproved &&
    gates.appealPacketAttached &&
    gates.retentionPolicyAttached &&
    gates.deliveryTrackingAttached &&
    gates.externalDeliveryPerformed === false
  );
}

async function loadDecisionNotice(decisionNoticeId: string) {
  const rows = await db
    .select()
    .from(regulatedDecisionNotices)
    .where(eq(regulatedDecisionNotices.id, decisionNoticeId))
    .limit(1);
  const decisionNotice = rows[0] ?? null;

  if (!decisionNotice) {
    throw new Error("Regulated decision notice not found for delivery.");
  }

  return decisionNotice;
}

export async function persistBorrowerNoticeDelivery(
  input: PersistBorrowerNoticeDeliveryInput
): Promise<BorrowerNoticeDeliveryResult> {
  const decisionNoticeId = normalizeRequiredText(
    input.decisionNoticeId,
    "decisionNoticeId"
  );
  const decisionNotice = await loadDecisionNotice(decisionNoticeId);
  const noticeType = normalizeNoticeType(
    input.noticeType ?? decisionNotice.decisionType
  );
  const deliveryChannel = normalizeDeliveryChannel(input.deliveryChannel);
  const redactionStatus = normalizeRedactionStatus(input.redactionStatus);
  const preparedNoticePacketRef = noticePacketRef(
    input.traceId,
    input.noticePacketRef
  );
  const gates = deliveryGates({
    decisionNotice,
    applicationId: input.applicationId,
    deliveryChannel,
    noticePacketRef: preparedNoticePacketRef,
    redactionStatus,
    redactionProfileRef: input.redactionProfileRef,
    appealPacketRef: input.appealPacketRef,
    retentionPolicyRef: input.retentionPolicyRef,
    deliveryTrackingRef: input.deliveryTrackingRef,
  });
  const deliveryAllowed = gatesComplete(gates);
  const now = new Date();
  const rows = await db
    .insert(borrowerNoticeDeliveries)
    .values({
      decisionNoticeId,
      applicationId:
        normalizeText(input.applicationId) ?? decisionNotice.applicationId,
      borrowerId: normalizeText(input.borrowerId) ?? decisionNotice.borrowerId,
      tenantId: normalizeText(input.tenantId) ?? decisionNotice.tenantId,
      actorId: normalizeText(input.actorId),
      noticeType,
      deliveryChannel,
      deliveryStatus: deliveryStatus(deliveryAllowed),
      noticePacketStatus: noticePacketStatus(deliveryAllowed),
      redactionStatus,
      appealPacketStatus: appealPacketStatus({
        appealPacketAttached: gates.appealPacketAttached,
        adverseActionRequired: decisionNotice.adverseActionRequired === true,
      }),
      retentionStatus: retentionStatus(gates.retentionPolicyAttached),
      noticePacketRef: preparedNoticePacketRef,
      redactionProfileRef: normalizeText(input.redactionProfileRef),
      appealPacketRef: normalizeText(input.appealPacketRef),
      retentionPolicyRef: normalizeText(input.retentionPolicyRef),
      deliveryTrackingRef: normalizeText(input.deliveryTrackingRef),
      deliveryProviderRef: normalizeText(input.deliveryProviderRef),
      deliveryAllowed,
      borrowerDisclosureAllowed: deliveryAllowed,
      externalDeliveryPerformed: false,
      deliveryProviderConfigured: input.deliveryProviderConfigured === true,
      appealRightsIncluded: gates.appealPacketAttached,
      redactionCompleted: gates.redactionApproved,
      retentionPolicyAttached: gates.retentionPolicyAttached,
      deliveryPreparedAt: deliveryAllowed ? now : null,
      externalDeliveredAt: null,
      governanceVersion: GOVERNANCE_VERSION,
      classification: CLASSIFICATION,
      replayRef: input.traceId,
      traceId: input.traceId,
      source: NOTICE_DELIVERY_SOURCE,
      metadata: {
        ...(input.metadata ?? {}),
        gates,
        borrowerNoticeDeliveryRuntimeVersion:
          "borrower-notice-delivery-runtime-v0.1.0",
        externalDeliveryPerformed: false,
        providerDeliveryDeferred: true,
      },
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return {
    decisionNotice,
    delivery: rows[0],
    gates,
    deliveryAllowed,
  };
}
