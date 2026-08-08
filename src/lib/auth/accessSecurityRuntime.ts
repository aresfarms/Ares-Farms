import { and, eq, isNull } from "drizzle-orm";

import { accessSecurityStates, users, webauthnCredentials } from "@/db/schema";
import { db } from "@/lib/db";
import { recordSecurityEvent } from "@/security/securityRuntimeGuards";

export const ZERO_TRUST_ACCESS_VERSION = "zero-trust-access-v1";

export const PRIVILEGED_MFA_ROLES = new Set([
  "lender", "sponsor", "operator", "underwriter", "auditor",
  "government_official", "attorney", "admin", "governance",
]);

export type AccessSecurityState = typeof accessSecurityStates.$inferSelect;

export function privilegedMfaRequired(role: unknown): boolean {
  return typeof role === "string" && PRIVILEGED_MFA_ROLES.has(role);
}

export async function ensureAccessSecurityState(userId: string): Promise<AccessSecurityState> {
  const found = await db.select().from(accessSecurityStates)
    .where(eq(accessSecurityStates.userId, userId)).limit(1);
  if (found[0]) return found[0];
  const inserted = await db.insert(accessSecurityStates).values({
    userId,
    governanceVersion: ZERO_TRUST_ACCESS_VERSION,
  }).returning();
  return inserted[0];
}

export async function accessSecurityState(userId: string): Promise<AccessSecurityState | null> {
  const rows = await db.select().from(accessSecurityStates)
    .where(eq(accessSecurityStates.userId, userId)).limit(1);
  return rows[0] ?? null;
}
export type ZeroTrustDecision = {
  allowed: boolean;
  reason: string;
  sessionVersion: number | null;
  mfaRequired: boolean;
};

export async function evaluateZeroTrustAccess(input: {
  userId: string | null;
  tokenSessionVersion?: number | null;
  role?: unknown;
}): Promise<ZeroTrustDecision> {
  if (!input.userId) return { allowed: false, reason: "IDENTITY_MISSING", sessionVersion: null, mfaRequired: false };
  const state = await ensureAccessSecurityState(input.userId);
  const mfaRequired = privilegedMfaRequired(input.role);
  if (state.accessStatus !== "ACTIVE" || state.employmentStatus === "TERMINATED") {
    return { allowed: false, reason: "ACCESS_DEPROVISIONED", sessionVersion: state.sessionVersion, mfaRequired };
  }
  if (input.tokenSessionVersion != null && input.tokenSessionVersion !== state.sessionVersion) {
    return { allowed: false, reason: "SESSION_VERSION_REVOKED", sessionVersion: state.sessionVersion, mfaRequired };
  }
  return { allowed: true, reason: "CURRENT_AUTHORITY_CONFIRMED", sessionVersion: state.sessionVersion, mfaRequired };
}

export async function activePasskeys(userId: string) {
  return db.select().from(webauthnCredentials).where(and(
    eq(webauthnCredentials.userId, userId),
    isNull(webauthnCredentials.revokedAt),
  ));
}

export async function deprovisionUser(input: {
  userId: string;
  reason: string;
  actorId: string;
  event: "LEAVER" | "SUSPEND";
}) {
  const state = await ensureAccessSecurityState(input.userId);
  const now = new Date();
  const nextVersion = state.sessionVersion + 1;  await db.update(accessSecurityStates).set({
    accessStatus: input.event === "LEAVER" ? "TERMINATED" : "SUSPENDED",
    employmentStatus: input.event === "LEAVER" ? "TERMINATED" : state.employmentStatus,
    sessionVersion: nextVersion,
    deprovisionedAt: now,
    deprovisionReason: input.reason,
    updatedAt: now,
    metadata: { actorId: input.actorId, event: input.event },
  }).where(eq(accessSecurityStates.userId, input.userId));
  await db.update(webauthnCredentials).set({ revokedAt: now, updatedAt: now })
    .where(and(eq(webauthnCredentials.userId, input.userId), isNull(webauthnCredentials.revokedAt)));
  await db.update(users).set({
    role: "user",
    tenantId: null,
    updatedAt: now,
    metadata: { accessLifecycle: { event: input.event, reason: input.reason, actorId: input.actorId, at: now.toISOString() } },
  }).where(eq(users.id, input.userId));
  recordSecurityEvent({
    type: input.event === "LEAVER" ? "ACCESS_LEAVER_DEPROVISIONED" : "ACCESS_SUSPENDED",
    severity: "high",
    summary: `Access lifecycle ${input.event.toLowerCase()} executed`,
    detail: { userId: input.userId, actorId: input.actorId, sessionVersion: nextVersion },
  });
  return { userId: input.userId, sessionVersion: nextVersion, accessStatus: input.event === "LEAVER" ? "TERMINATED" : "SUSPENDED" };
}

export async function activateJoiner(userId: string, actorId: string, reason: string) {
  const state = await ensureAccessSecurityState(userId);
  const now = new Date();
  const nextVersion = state.sessionVersion + 1;
  await db.update(accessSecurityStates).set({
    accessStatus: "ACTIVE", employmentStatus: "ACTIVE", sessionVersion: nextVersion,
    deprovisionedAt: null, deprovisionReason: null, updatedAt: now,
    metadata: { actorId, event: "JOINER", reason },
  }).where(eq(accessSecurityStates.userId, userId));
  recordSecurityEvent({ type: "ACCESS_JOINER_ACTIVATED", severity: "info", summary: "Joiner access activated", detail: { userId, actorId, sessionVersion: nextVersion } });
  return { userId, sessionVersion: nextVersion, accessStatus: "ACTIVE" as const };
}
export async function recordMover(userId: string, actorId: string, reason: string, detail?: Record<string, unknown>) {
  const state = await ensureAccessSecurityState(userId);
  const now = new Date();
  const nextVersion = state.sessionVersion + 1;
  await db.update(accessSecurityStates).set({ sessionVersion: nextVersion, updatedAt: now, metadata: { actorId, event: "MOVER", reason, ...(detail ?? {}) } }).where(eq(accessSecurityStates.userId, userId));
  recordSecurityEvent({ type: "ACCESS_MOVER_REAUTHORIZED", severity: "high", summary: "Mover access changed; prior sessions revoked", detail: { userId, actorId, sessionVersion: nextVersion, ...detail } });
  return { userId, sessionVersion: nextVersion, accessStatus: state.accessStatus };
}
