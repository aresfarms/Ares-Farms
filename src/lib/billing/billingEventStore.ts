import { and, desc, eq } from "drizzle-orm";

import { billingEvents, entitlements } from "@/db/schema";
import { db } from "@/lib/db";

/**
 * Canonical Billing Event Runtime
 *
 * Master Volume Governance:
 * - Vol I: Preserves a clear boundary between billing activity and
 *   regulated decision authority.
 * - Vol II: Protects tenant, payment, entitlement, and regulated-service
 *   access metadata during controlled reads.
 * - Vol III: Provides deterministic, replay-safe billing event persistence
 *   before admin surfaces or entitlement workflows consume billing state.
 * - Vol IV: Supports webhook recovery, billing review, incident triage,
 *   entitlement reconciliation, and audit preparation.
 * - Vol V: Enforces classification, observability, replayability, version
 *   lineage, connector governance, source authority, and human review.
 */

const GOVERNANCE_VERSION = "master-volumes-runtime-v0.1.0";
const CLASSIFICATION = "RESTRICTED";
const BILLING_EVENT_SOURCE = "billing-event-runtime";

export type PersistBillingEventInput = {
  traceId: string;
  billingEventId?: string | null;
  eventType: string;
  eventStatus: string;
  route: string;
  tenantId?: string | null;
  actorId?: string | null;
  userId?: string | null;
  reportId?: string | null;
  applicationId?: string | null;
  sessionId?: string | null;
  entitlementId?: string | null;
  stripeEventType?: string | null;
  plan?: string | null;
  productName?: string | null;
  amountTotal?: number | null;
  currency?: string | null;
  checkoutSessionCreated?: boolean;
  webhookReceived?: boolean;
  entitlementGranted?: boolean;
  paymentConnectorLiveMode?: boolean;
  stubSignatureVerification?: boolean;
  regulatedDecisionImpactAllowed?: boolean;
  humanReviewRequired?: boolean;
  requestPayload?: Record<string, unknown>;
  responsePayload?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
};

export type ListBillingAdminRecordsInput = {
  billingEventId?: string | null;
  eventType?: string | null;
  eventStatus?: string | null;
  tenantId?: string | null;
  actorId?: string | null;
  userId?: string | null;
  sessionId?: string | null;
  entitlementId?: string | null;
  plan?: string | null;
  limit?: number | null;
  includeEntitlement?: boolean | null;
};

export type BillingAdminRecord = {
  billingEvent: typeof billingEvents.$inferSelect;
  entitlement: typeof entitlements.$inferSelect | null;
};

export type BillingAdminScopeRecord = {
  billingEventId?: string | null;
  tenantId?: string | null;
  actorId?: string | null;
  userId?: string | null;
  sessionId?: string | null;
  entitlementId?: string | null;
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

function normalizeStatus(value: unknown): string | null {
  return normalizeText(value)?.toUpperCase() ?? null;
}

function normalizeLimit(value: number | null | undefined): number {
  if (!Number.isInteger(value) || !value || value < 1) {
    return 25;
  }

  return Math.min(value, 100);
}

function normalizeAmount(value: number | null | undefined): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  const normalized = Math.round(Number(value));

  return Number.isFinite(normalized) ? normalized : null;
}

async function loadEntitlementForEvent(
  event: typeof billingEvents.$inferSelect,
  includeEntitlement: boolean
): Promise<typeof entitlements.$inferSelect | null> {
  if (!includeEntitlement) {
    return null;
  }

  if (event.entitlementId) {
    const entitlementRows = await db
      .select()
      .from(entitlements)
      .where(eq(entitlements.id, event.entitlementId))
      .limit(1);

    if (entitlementRows[0]) {
      return entitlementRows[0];
    }
  }

  if (!event.tenantId) {
    return null;
  }

  const tenantRows = await db
    .select()
    .from(entitlements)
    .where(eq(entitlements.tenantId, event.tenantId))
    .limit(1);

  return tenantRows[0] ?? null;
}

export async function persistBillingEvent(
  input: PersistBillingEventInput
): Promise<typeof billingEvents.$inferSelect> {
  const now = new Date();
  const rows = await db
    .insert(billingEvents)
    .values({
      billingEventId:
        normalizeText(input.billingEventId) ??
        normalizeRequiredText(input.traceId, "traceId"),
      eventType: normalizeRequiredText(input.eventType, "eventType")
        .toUpperCase(),
      eventStatus: normalizeRequiredText(input.eventStatus, "eventStatus")
        .toUpperCase(),
      route: normalizeRequiredText(input.route, "route"),
      tenantId: normalizeText(input.tenantId),
      actorId: normalizeText(input.actorId),
      userId: normalizeText(input.userId),
      reportId: normalizeText(input.reportId),
      applicationId: normalizeText(input.applicationId),
      sessionId: normalizeText(input.sessionId),
      entitlementId: normalizeText(input.entitlementId),
      stripeEventType: normalizeText(input.stripeEventType),
      plan: normalizeText(input.plan),
      productName: normalizeText(input.productName),
      amountTotal: normalizeAmount(input.amountTotal),
      currency: normalizeText(input.currency)?.toLowerCase() ?? null,
      checkoutSessionCreated: input.checkoutSessionCreated ?? false,
      webhookReceived: input.webhookReceived ?? false,
      entitlementGranted: input.entitlementGranted ?? false,
      paymentConnectorLiveMode: input.paymentConnectorLiveMode ?? false,
      stubSignatureVerification: input.stubSignatureVerification ?? false,
      regulatedDecisionImpactAllowed:
        input.regulatedDecisionImpactAllowed ?? false,
      humanReviewRequired: input.humanReviewRequired ?? true,
      requestPayload: input.requestPayload ?? {},
      responsePayload: input.responsePayload ?? {},
      governanceVersion: GOVERNANCE_VERSION,
      classification: CLASSIFICATION,
      replayRef: input.traceId,
      traceId: input.traceId,
      source: BILLING_EVENT_SOURCE,
      metadata: {
        ...(input.metadata ?? {}),
        billingEventRuntimeVersion: "billing-event-runtime-v0.1.0",
        regulatedDecisionImpactAllowed:
          input.regulatedDecisionImpactAllowed ?? false,
        humanReviewRequired: input.humanReviewRequired ?? true,
      },
      occurredAt: now,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return rows[0];
}

export async function getBillingAdminScopeRecord(input: {
  billingEventId?: string | null;
  sessionId?: string | null;
  entitlementId?: string | null;
}): Promise<BillingAdminScopeRecord | null> {
  const normalizedBillingEventId = normalizeText(input.billingEventId);

  if (normalizedBillingEventId) {
    const rows = await db
      .select()
      .from(billingEvents)
      .where(eq(billingEvents.billingEventId, normalizedBillingEventId))
      .limit(1);
    const billingEvent = rows[0] ?? null;

    if (billingEvent) {
      return {
        billingEventId: billingEvent.billingEventId,
        tenantId: billingEvent.tenantId,
        actorId: billingEvent.actorId,
        userId: billingEvent.userId,
        sessionId: billingEvent.sessionId,
        entitlementId: billingEvent.entitlementId,
      };
    }
  }

  const normalizedSessionId = normalizeText(input.sessionId);

  if (normalizedSessionId) {
    const rows = await db
      .select()
      .from(billingEvents)
      .where(eq(billingEvents.sessionId, normalizedSessionId))
      .limit(1);
    const billingEvent = rows[0] ?? null;

    if (billingEvent) {
      return {
        billingEventId: billingEvent.billingEventId,
        tenantId: billingEvent.tenantId,
        actorId: billingEvent.actorId,
        userId: billingEvent.userId,
        sessionId: billingEvent.sessionId,
        entitlementId: billingEvent.entitlementId,
      };
    }
  }

  const normalizedEntitlementId = normalizeText(input.entitlementId);

  if (normalizedEntitlementId) {
    const rows = await db
      .select()
      .from(entitlements)
      .where(eq(entitlements.id, normalizedEntitlementId))
      .limit(1);
    const entitlement = rows[0] ?? null;

    if (entitlement) {
      return {
        billingEventId: null,
        tenantId: entitlement.tenantId,
        actorId: null,
        userId: null,
        sessionId: null,
        entitlementId: entitlement.id,
      };
    }
  }

  return null;
}

export async function listBillingAdminRecords(
  input: ListBillingAdminRecordsInput
): Promise<BillingAdminRecord[]> {
  const filters = [
    normalizeText(input.billingEventId)
      ? eq(billingEvents.billingEventId, normalizeText(input.billingEventId) ?? "")
      : undefined,
    normalizeStatus(input.eventType)
      ? eq(billingEvents.eventType, normalizeStatus(input.eventType) ?? "")
      : undefined,
    normalizeStatus(input.eventStatus)
      ? eq(billingEvents.eventStatus, normalizeStatus(input.eventStatus) ?? "")
      : undefined,
    normalizeText(input.tenantId)
      ? eq(billingEvents.tenantId, normalizeText(input.tenantId) ?? "")
      : undefined,
    normalizeText(input.actorId)
      ? eq(billingEvents.actorId, normalizeText(input.actorId) ?? "")
      : undefined,
    normalizeText(input.userId)
      ? eq(billingEvents.userId, normalizeText(input.userId) ?? "")
      : undefined,
    normalizeText(input.sessionId)
      ? eq(billingEvents.sessionId, normalizeText(input.sessionId) ?? "")
      : undefined,
    normalizeText(input.entitlementId)
      ? eq(billingEvents.entitlementId, normalizeText(input.entitlementId) ?? "")
      : undefined,
    normalizeText(input.plan)
      ? eq(billingEvents.plan, normalizeText(input.plan) ?? "")
      : undefined,
  ].filter((filter): filter is NonNullable<typeof filter> => Boolean(filter));

  const whereClause = filters.length > 0 ? and(...filters) : undefined;
  const rows = whereClause
    ? await db
        .select()
        .from(billingEvents)
        .where(whereClause)
        .orderBy(desc(billingEvents.createdAt))
        .limit(normalizeLimit(input.limit))
    : await db
        .select()
        .from(billingEvents)
        .orderBy(desc(billingEvents.createdAt))
        .limit(normalizeLimit(input.limit));
  const records: BillingAdminRecord[] = [];

  for (const billingEvent of rows) {
    records.push({
      billingEvent,
      entitlement: await loadEntitlementForEvent(
        billingEvent,
        input.includeEntitlement !== false
      ),
    });
  }

  return records;
}
