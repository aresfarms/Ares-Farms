import {
  bigint,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Zero-trust access security state.
 * Passkey biometrics never enter Furlong; only public WebAuthn credential data
 * and governed lifecycle state are stored.
 */
export const accessSecurityStates = pgTable("access_security_states", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().unique(),
  accessStatus: text("access_status").notNull().default("ACTIVE"),
  employmentStatus: text("employment_status").notNull().default("ACTIVE"),
  sessionVersion: integer("session_version").notNull().default(1),
  mfaRequired: text("mfa_required").notNull().default("POLICY"),
  lastAccessReviewAt: timestamp("last_access_review_at", { withTimezone: true }),
  deprovisionedAt: timestamp("deprovisioned_at", { withTimezone: true }),
  deprovisionReason: text("deprovision_reason"),
  governanceVersion: text("governance_version").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});
export const webauthnCredentials = pgTable("webauthn_credentials", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  credentialId: text("credential_id").notNull().unique(),
  publicKeyB64: text("public_key_b64").notNull(),
  counter: bigint("counter", { mode: "number" }).notNull().default(0),
  transports: jsonb("transports"),
  deviceType: text("device_type"),
  backedUp: text("backed_up"),
  label: text("label"),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const webauthnChallenges = pgTable("webauthn_challenges", {
  id: uuid("id").defaultRandom().primaryKey(),
  challengeId: text("challenge_id").notNull().unique(),
  userId: uuid("user_id").notNull(),
  challenge: text("challenge").notNull(),
  purpose: text("purpose").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  consumedAt: timestamp("consumed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});