import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

import { users } from "@/db/schema";
import { ensureTenantId } from "@/lib/auth/tenant";
import { db } from "@/lib/db";

/**
 * Durable Identity Runtime
 *
 * Master Volume Governance:
 * - Vol I: Preserves stable identity and tenant authority.
 * - Vol II: Supports regulated borrower/operator identity handling.
 * - Vol III: Prevents session drift by binding auth to durable backend state.
 * - Vol IV: Supports identity recovery, operational support, and audit review.
 * - Vol V: Enforces source authority, replay context, versioning,
 *   classification, and governance metadata on identity records.
 */

const GOVERNANCE_VERSION = "master-volumes-runtime-v0.1.0";
const DEFAULT_CLASSIFICATION = "CONFIDENTIAL";

export type DurableIdentityInput = {
  email: string;
  name?: string | null;
  role?: string | null;
  tenantId?: string | null;
  traceId?: string | null;
  source?: string | null;
  metadata?: Record<string, unknown>;
};

export type DurableIdentityResult = {
  user: typeof users.$inferSelect;
  created: boolean;
};

function sanitizeRole(role: string | null | undefined): string {
  if (!role || role.trim().length === 0) {
    return "user";
  }

  return role.trim();
}

export function normalizeIdentityEmail(email: unknown): string | null {
  if (typeof email !== "string") {
    return null;
  }

  const normalized = email.trim().toLowerCase();

  return normalized.length > 0 ? normalized : null;
}

export function toPublicUserIdentity(user: typeof users.$inferSelect) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    tenantId: user.tenantId,
    governanceVersion: user.governanceVersion,
    classification: user.classification,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function ensureDurableIdentity(
  input: DurableIdentityInput
): Promise<DurableIdentityResult> {
  const email = normalizeIdentityEmail(input.email);

  if (!email) {
    throw new Error("A valid email is required for durable identity.");
  }

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing.length > 0) {
    return {
      user: existing[0],
      created: false,
    };
  }

  const tenantId = input.tenantId ?? ensureTenantId({ email });
  const created = await db
    .insert(users)
    .values({
      id: uuidv4(),
      email,
      name: input.name ?? null,
      role: sanitizeRole(input.role),
      tenantId,
      governanceVersion: GOVERNANCE_VERSION,
      classification: DEFAULT_CLASSIFICATION,
      metadata: {
        ...(input.metadata ?? {}),
        traceId: input.traceId ?? null,
        source: input.source ?? "durable-identity-runtime",
        identityRuntimeVersion: "durable-identity-runtime-v0.1.0",
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return {
    user: created[0],
    created: true,
  };
}
