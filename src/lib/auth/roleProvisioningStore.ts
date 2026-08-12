import { eq } from "drizzle-orm";

import { users } from "@/db/schema";
import {
  AccessRole,
  normalizeAccessRole,
} from "@/lib/auth/accessControl";
import {
  ensureDurableIdentity,
  normalizeIdentityEmail,
} from "@/lib/auth/identity";
import { db } from "@/lib/db";
import { recordMover } from "@/lib/auth/accessSecurityRuntime";

/**
 * Governed Role Provisioning Store
 *
 * Master Volume Governance:
 * - Vol I: Preserves accountable authority changes for platform roles.
 * - Vol II: Supports regulated operator, underwriter, lender, sponsor,
 *   auditor, admin, and governance role control.
 * - Vol III: Makes role changes durable and replay-linked.
 * - Vol IV: Supports access review, incident response, and operational
 *   recovery.
 * - Vol V: Preserves source authority, versioned role state, controlled
 *   disclosure, and evidence-ready metadata.
 */

type UserRecord = typeof users.$inferSelect;

export type RoleProvisioningInput = {
  targetUserId?: string | null;
  targetEmail?: string | null;
  targetName?: string | null;
  targetRole: AccessRole;
  targetTenantId?: string | null;
  provisionedBy: string;
  provisionedByRole: AccessRole;
  traceId: string;
  reason: string;
  operatorAttestation: string;
  metadata?: Record<string, unknown>;
};

export type RoleProvisioningResult = {
  user: UserRecord;
  created: boolean;
  previousRole: string | null;
  previousTenantId: string | null;
  targetRole: AccessRole;
  targetTenantId: string | null;
};

function objectMetadata(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : {};
}

async function findTargetUser(input: {
  targetUserId?: string | null;
  targetEmail?: string | null;
}): Promise<UserRecord | null> {
  if (input.targetUserId) {
    const rows = await db
      .select()
      .from(users)
      .where(eq(users.id, input.targetUserId))
      .limit(1);

    return rows[0] ?? null;
  }

  const email = normalizeIdentityEmail(input.targetEmail);

  if (!email) {
    return null;
  }

  const rows = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  return rows[0] ?? null;
}

export async function provisionUserRole(
  input: RoleProvisioningInput
): Promise<RoleProvisioningResult> {
  const targetRole = normalizeAccessRole(input.targetRole);
  const existing = await findTargetUser(input);
  let target = existing;
  let created = false;

  if (!target) {
    const email = normalizeIdentityEmail(input.targetEmail);

    if (!email) {
      throw new Error("Role provisioning requires a target user id or email.");
    }

    const identity = await ensureDurableIdentity({
      email,
      name: input.targetName ?? null,
      role: targetRole,
      tenantId: input.targetTenantId ?? null,
      traceId: input.traceId,
      source: "api.auth.role-provisioning",
      metadata: {
        ...(input.metadata ?? {}),
        provisionedBy: input.provisionedBy,
        provisionedByRole: input.provisionedByRole,
        roleProvisioningTraceId: input.traceId,
      },
    });

    target = identity.user;
    created = identity.created;
  }

  const previousRole = target.role ?? null;
  const previousTenantId = target.tenantId ?? null;
  const targetTenantId = input.targetTenantId ?? target.tenantId ?? null;
  const updatedRows = await db
    .update(users)
    .set({
      role: targetRole,
      tenantId: targetTenantId,
      metadata: {
        ...objectMetadata(target.metadata),
        ...(input.metadata ?? {}),
        roleProvisioning: {
          traceId: input.traceId,
          provisionedBy: input.provisionedBy,
          provisionedByRole: input.provisionedByRole,
          previousRole,
          targetRole,
          previousTenantId,
          targetTenantId,
          reason: input.reason,
          operatorAttestation: input.operatorAttestation,
          provisionedAt: new Date().toISOString(),
        },
      },
      updatedAt: new Date(),
    })
    .where(eq(users.id, target.id))
    .returning();

  if (previousRole !== targetRole || previousTenantId !== targetTenantId) {
    await recordMover(target.id, input.provisionedBy, input.reason, { previousRole, targetRole, previousTenantId, targetTenantId });
  }

  return {
    user: updatedRows[0] ?? target,
    created,
    previousRole,
    previousTenantId,
    targetRole,
    targetTenantId,
  };
}
