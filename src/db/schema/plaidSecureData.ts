import { jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

/** Plaid consumer data: ciphertext-only persistence. */
export const plaidSecureRecords = pgTable("plaid_secure_records", {
  id: uuid("id").defaultRandom().primaryKey(),
  subjectRef: text("subject_ref").notNull(),
  dataCategory: text("data_category").notNull(),
  ciphertextB64: text("ciphertext_b64").notNull(),
  ivB64: text("iv_b64").notNull(),
  authTagB64: text("auth_tag_b64").notNull(),
  wrappedDekB64: text("wrapped_dek_b64").notNull(),
  wrapIvB64: text("wrap_iv_b64").notNull(),
  wrapAuthTagB64: text("wrap_auth_tag_b64").notNull(),
  keyVersion: text("key_version").notNull(),
  algorithm: text("algorithm").notNull().default("AES-256-GCM-envelope-v1"),
  consentRef: text("consent_ref").notNull(),
  retentionClass: text("retention_class").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});
