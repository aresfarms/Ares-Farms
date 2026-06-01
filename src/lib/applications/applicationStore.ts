import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";

import { applications, properties } from "@/db/schema";
import { db } from "@/lib/db";

/**
 * Canonical Application Persistence Runtime
 *
 * Master Volume Governance:
 * - Vol I: Preserves governed borrower/application state authority.
 * - Vol II: Supports regulated application, borrower, and property review.
 * - Vol III: Provides deterministic durable persistence for intake workflows.
 * - Vol IV: Supports operational review, escalation, recovery, and audit prep.
 * - Vol V: Enforces classification, versioning, replay, source authority,
 *   controlled disclosure, and evidence-preservation doctrine.
 */

const GOVERNANCE_VERSION = "master-volumes-runtime-v0.1.0";
const CLASSIFICATION = "CONFIDENTIAL";

export type PersistApplicationInput = {
  traceId: string;
  source: string;
  applicationId?: string | null;
  userId?: string | null;
  borrowerId?: string | null;
  tenantId?: string | null;
  status?: string | null;
  reviewStatus?: string | null;
  decisionStatus?: string | null;
  requestedAmount?: unknown;
  requestedPrograms?: unknown;
  payload?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
};

export type PersistedApplicationState = {
  application: typeof applications.$inferSelect;
  property: typeof properties.$inferSelect | null;
};

function normalizeText(value: unknown): string | null {
  if (typeof value !== "string") {
    return value === null || value === undefined ? null : String(value);
  }

  const normalized = value.trim();

  return normalized.length > 0 ? normalized : null;
}

function preserveText(
  incomingValue: unknown,
  existingValue: string | null | undefined
): string | null {
  return normalizeText(incomingValue) ?? existingValue ?? null;
}

function normalizeApplicationId(input: PersistApplicationInput): string {
  return (
    normalizeText(input.applicationId) ??
    normalizeText(input.payload?.applicationId) ??
    `application-${input.traceId}`
  );
}

function normalizeRequestedAmount(input: PersistApplicationInput): string | null {
  return normalizeText(input.requestedAmount ?? input.payload?.requestedAmount);
}

function normalizeRequestedPrograms(input: PersistApplicationInput): unknown[] {
  const raw = input.requestedPrograms ?? input.payload?.requestedPrograms;

  return Array.isArray(raw) ? raw : [];
}

function propertyPayload(input: PersistApplicationInput): {
  hasPropertyData: boolean;
  name: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  county: string | null;
  country: string | null;
  metadata: Record<string, unknown>;
} {
  const payload = input.payload ?? {};
  const property =
    typeof payload.property === "object" && payload.property !== null
      ? (payload.property as Record<string, unknown>)
      : {};

  const name =
    normalizeText(property.name) ??
    normalizeText(payload.propertyName) ??
    normalizeText(payload.farmName) ??
    null;
  const address =
    normalizeText(property.address) ?? normalizeText(payload.address) ?? null;
  const city = normalizeText(property.city) ?? normalizeText(payload.city) ?? null;
  const state =
    normalizeText(property.state) ?? normalizeText(payload.state) ?? null;
  const zip = normalizeText(property.zip) ?? normalizeText(payload.zip) ?? null;
  const county =
    normalizeText(property.county) ?? normalizeText(payload.county) ?? null;
  const country =
    normalizeText(property.country) ?? normalizeText(payload.country) ?? "US";

  return {
    hasPropertyData: Boolean(name || address || city || state || zip || county),
    name,
    address,
    city,
    state,
    zip,
    county,
    country,
    metadata: {
      acreage: payload.acreage ?? property.acreage ?? null,
      source: input.source,
      traceId: input.traceId,
    },
  };
}

async function createPropertyIfPresent(
  input: PersistApplicationInput
): Promise<typeof properties.$inferSelect | null> {
  const normalized = propertyPayload(input);

  if (!normalized.hasPropertyData) {
    return null;
  }

  const inserted = await db
    .insert(properties)
    .values({
      tenantId: normalizeText(input.tenantId),
      name: normalized.name,
      address: normalized.address,
      city: normalized.city,
      state: normalized.state,
      zip: normalized.zip,
      county: normalized.county,
      country: normalized.country,
      governanceVersion: GOVERNANCE_VERSION,
      classification: CLASSIFICATION,
      replayRef: input.traceId,
      metadata: normalized.metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return inserted[0] ?? null;
}

export async function persistApplicationState(
  input: PersistApplicationInput
): Promise<PersistedApplicationState> {
  const applicationId = normalizeApplicationId(input);
  const property = await createPropertyIfPresent(input);
  const now = new Date();
  const existing = await db
    .select()
    .from(applications)
    .where(eq(applications.id, applicationId))
    .limit(1);
  const existingApplication = existing[0] ?? null;
  const requestedPrograms = normalizeRequestedPrograms(input);

  const values = {
    id: applicationId,
    userId: preserveText(input.userId, existingApplication?.userId),
    borrowerId: preserveText(input.borrowerId, existingApplication?.borrowerId),
    tenantId: preserveText(input.tenantId, existingApplication?.tenantId),
    propertyId: property?.id ?? existingApplication?.propertyId ?? null,
    status: normalizeText(input.status) ?? existingApplication?.status ?? "INTAKE_RECEIVED",
    reviewStatus:
      normalizeText(input.reviewStatus) ??
      existingApplication?.reviewStatus ??
      "REVIEW_REQUIRED",
    decisionStatus:
      normalizeText(input.decisionStatus) ??
      existingApplication?.decisionStatus ??
      "PENDING_REVIEW",
    requestedAmount:
      normalizeRequestedAmount(input) ?? existingApplication?.requestedAmount ?? null,
    requestedPrograms:
      requestedPrograms.length > 0
        ? requestedPrograms
        : existingApplication?.requestedPrograms ?? [],
    governanceVersion: GOVERNANCE_VERSION,
    classification: CLASSIFICATION,
    replayRef: input.traceId,
    source: input.source,
    payload: input.payload ?? existingApplication?.payload ?? {},
    metadata: {
      ...((existingApplication?.metadata as Record<string, unknown> | null) ?? {}),
      ...(input.metadata ?? {}),
      traceId: input.traceId,
      source: input.source,
      applicationPersistenceVersion: "application-persistence-runtime-v0.1.0",
    },
    createdAt: existingApplication?.createdAt ?? now,
    updatedAt: now,
  };

  if (existingApplication) {
    const updated = await db
      .update(applications)
      .set({
        ...values,
        createdAt: existingApplication.createdAt,
      })
      .where(eq(applications.id, applicationId))
      .returning();

    return {
      application: updated[0],
      property,
    };
  }

  const inserted = await db
    .insert(applications)
    .values({
      ...values,
      id: applicationId || `application-${randomUUID()}`,
    })
    .returning();

  return {
    application: inserted[0],
    property,
  };
}
