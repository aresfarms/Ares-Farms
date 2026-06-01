import {
  boolean,
  pgTable,
  text,
  timestamp,
  uuid,
  jsonb,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/**
 * Canonical Entitlements Schema
 *
 * Master Volume Governance:
 * - Vol I: Keeps access authority constitutionally bounded and reviewable.
 * - Vol II: Preserves regulated-service access and disclosure boundaries.
 * - Vol III: Provides durable entitlement state for replay-safe backend flows.
 * - Vol IV: Supports operator review, revocation, recovery, and escalation.
 * - Vol V: Enforces classification, source authority, replay, versioning, and observability.
 *
 * Purpose:
 * This table stores tenant access grants created by governed billing,
 * onboarding, or operator workflows. Entitlements are operational access
 * controls only; they are not lending, eligibility, regulatory, or legal
 * decisions.
 */

export const entitlements = pgTable(
  "entitlements",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    tenantId: text("tenant_id").notNull(),
    plan: text("plan").notNull(),
    active: boolean("active").notNull().default(true),
    permissions: jsonb("permissions").notNull(),

    source: text("source").notNull().default("governed-runtime"),
    sourceRef: text("source_ref"),
    traceId: text("trace_id"),
    replayRef: text("replay_ref"),

    governanceVersion: text("governance_version").notNull(),
    classification: text("classification").notNull(),
    metadata: jsonb("metadata"),

    grantedBy: text("granted_by"),
    revokedBy: text("revoked_by"),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    tenantIdUnique: uniqueIndex("entitlements_tenant_id_unique").on(
      table.tenantId
    ),
  })
);
