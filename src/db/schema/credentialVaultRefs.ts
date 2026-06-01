import {
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Canonical Credential Vault Reference Schema
 *
 * Master Volume Governance:
 * - Vol I §3.37: requires external platform credentials to be resolved from
 *   a secure vault before Credentialed Agency Ingestion.
 * - Vol II §3.25: preserves license governance, expiry, renewal, and
 *   revocation posture for credentialed external sessions.
 * - Vol III TECH-CONN-001: implements credential_vault_refs as append-only
 *   connector governance records.
 * - Vol IV OPS-CONN-002: supports pre-session credential authentication,
 *   credential hygiene review, and SEV-2 escalation.
 * - Vol V CANON-EXTSOURCE-001: enforces source governance, license boundary,
 *   provenance, replay, and sovereignty-aware controls.
 */

export const credentialVaultRefs = pgTable("credential_vault_refs", {
  id: uuid("id").defaultRandom().primaryKey(),

  vaultRefId: text("vault_ref_id").notNull().unique(),
  credentialType: text("credential_type").notNull(),
  externalPlatform: text("external_platform").notNull(),
  holdingActorId: text("holding_actor_id").notNull(),
  licenseType: text("license_type").notNull(),
  licenseScope: jsonb("license_scope"),
  expiryTimestamp: timestamp("expiry_timestamp", {
    withTimezone: true,
  }),
  lastValidatedTimestamp: timestamp("last_validated_timestamp", {
    withTimezone: true,
  }),
  renewalStatus: text("renewal_status").notNull(),
  revocationEventRef: text("revocation_event_ref"),

  governanceVersion: text("governance_version").notNull(),
  classification: text("classification").notNull(),
  replayRef: text("replay_ref"),
  traceId: text("trace_id"),
  source: text("source"),
  metadata: jsonb("metadata"),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});
