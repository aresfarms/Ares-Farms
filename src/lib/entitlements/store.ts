import { randomUUID } from "node:crypto";

import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { entitlements } from "@/db/schema";

/**
 * Durable Entitlement Store
 *
 * Master Volume Governance:
 * - Vol I: Keeps access authority explicit, bounded, and reviewable.
 * - Vol II: Preserves controlled access to regulated service surfaces.
 * - Vol III: Replaces in-memory access state with durable backend persistence.
 * - Vol IV: Supports revocation, recovery, operator review, and continuity.
 * - Vol V: Preserves classification, replay, version lineage, source authority,
 *   and observability context for entitlement state.
 *
 * Rule:
 * Entitlements are operational access controls only. They are not approvals,
 * eligibility findings, credit decisions, reports, permits, or regulatory outputs.
 */

export type EntitlementType = "paid" | "environmental" | "free";

export type EntitlementPlan = "free" | "basic" | "pro" | "enterprise";

export type Entitlement = {
  id: string;
  tenantId: string;
  plan: EntitlementPlan;
  active: boolean;
  permissions: EntitlementType[];
  createdAt: string;
  updatedAt: string;
  revokedAt: string | null;
  replayRef: string | null;
  traceId: string | null;
  governanceVersion: string;
  classification: string;
};

export type EntitlementWriteContext = {
  traceId?: string | null;
  replayRef?: string | null;
  source?: string | null;
  sourceRef?: string | null;
  grantedBy?: string | null;
  revokedBy?: string | null;
  metadata?: Record<string, unknown>;
};

function normalizePermissions(value: unknown): EntitlementType[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((permission): permission is EntitlementType => {
    return (
      permission === "paid" ||
      permission === "environmental" ||
      permission === "free"
    );
  });
}

function toIsoString(value: Date | string | null | undefined): string {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "string") {
    return value;
  }

  return new Date().toISOString();
}

function toNullableIsoString(
  value: Date | string | null | undefined
): string | null {
  if (!value) {
    return null;
  }

  return toIsoString(value);
}

function normalizePlan(plan: string): EntitlementPlan {
  if (
    plan === "free" ||
    plan === "basic" ||
    plan === "pro" ||
    plan === "enterprise"
  ) {
    return plan;
  }

  return "free";
}

function toEntitlement(row: typeof entitlements.$inferSelect): Entitlement {
  return {
    id: row.id,
    tenantId: row.tenantId,
    plan: normalizePlan(row.plan),
    active: row.active,
    permissions: normalizePermissions(row.permissions),
    createdAt: toIsoString(row.createdAt),
    updatedAt: toIsoString(row.updatedAt),
    revokedAt: toNullableIsoString(row.revokedAt),
    replayRef: row.replayRef ?? null,
    traceId: row.traceId ?? null,
    governanceVersion: row.governanceVersion,
    classification: row.classification,
  };
}

async function findEntitlementRow(tenantId: string) {
  const rows = await db
    .select()
    .from(entitlements)
    .where(eq(entitlements.tenantId, tenantId))
    .limit(1);

  return rows[0] ?? null;
}

export async function hasEntitlement(
  tenantId = "dev",
  type?: EntitlementType
): Promise<boolean> {
  const entitlement = await getEntitlement(tenantId);

  if (!entitlement?.active) {
    return false;
  }

  if (!type) {
    return true;
  }

  return entitlement.permissions.includes(type);
}

export async function grantEntitlement(
  tenantId = "dev",
  plan: EntitlementPlan = "free",
  permissions: EntitlementType[] = ["free"],
  context: EntitlementWriteContext = {}
): Promise<Entitlement> {
  const existing = await findEntitlementRow(tenantId);
  const now = new Date();
  const governanceVersion = "master-volumes-runtime-v0.1.0";
  const classification = "RESTRICTED";
  const normalizedPermissions = Array.from(new Set(permissions));

  if (existing) {
    const updated = await db
      .update(entitlements)
      .set({
        plan,
        active: true,
        permissions: normalizedPermissions,
        source: context.source ?? "governed-runtime",
        sourceRef: context.sourceRef ?? null,
        traceId: context.traceId ?? null,
        replayRef: context.replayRef ?? context.traceId ?? null,
        governanceVersion,
        classification,
        metadata: context.metadata ?? {},
        grantedBy: context.grantedBy ?? null,
        revokedBy: null,
        revokedAt: null,
        updatedAt: now,
      })
      .where(eq(entitlements.tenantId, tenantId))
      .returning();

    return toEntitlement(updated[0]);
  }

  const created = await db
    .insert(entitlements)
    .values({
      id: randomUUID(),
      tenantId,
      plan,
      active: true,
      permissions: normalizedPermissions,
      source: context.source ?? "governed-runtime",
      sourceRef: context.sourceRef ?? null,
      traceId: context.traceId ?? null,
      replayRef: context.replayRef ?? context.traceId ?? null,
      governanceVersion,
      classification,
      metadata: context.metadata ?? {},
      grantedBy: context.grantedBy ?? null,
      revokedBy: null,
      revokedAt: null,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return toEntitlement(created[0]);
}

export async function revokeEntitlement(
  tenantId: string,
  context: EntitlementWriteContext = {}
): Promise<Entitlement | null> {
  const existing = await findEntitlementRow(tenantId);

  if (!existing) {
    return null;
  }

  const now = new Date();
  const updated = await db
    .update(entitlements)
    .set({
      active: false,
      revokedBy: context.revokedBy ?? null,
      revokedAt: now,
      traceId: context.traceId ?? existing.traceId,
      replayRef: context.replayRef ?? context.traceId ?? existing.replayRef,
      metadata: context.metadata ?? existing.metadata,
      updatedAt: now,
    })
    .where(eq(entitlements.tenantId, tenantId))
    .returning();

  return toEntitlement(updated[0]);
}

export async function getEntitlement(
  tenantId = "dev"
): Promise<Entitlement | null> {
  const row = await findEntitlementRow(tenantId);

  return row ? toEntitlement(row) : null;
}
