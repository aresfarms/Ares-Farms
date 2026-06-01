import {
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Canonical Application Documents Schema
 *
 * Master Volume Governance:
 * - Vol I: Establishes governed document submission authority.
 * - Vol II: Preserves regulated borrower document handling and review posture.
 * - Vol III: Provides durable replay-safe document metadata persistence.
 * - Vol IV: Supports document review, escalation, recovery, and audit prep.
 * - Vol V: Supports classification, consent, source authority,
 *   replayability, observability, and evidence preservation.
 */

export const applicationDocuments = pgTable("application_documents", {
  id: uuid("id").defaultRandom().primaryKey(),

  applicationId: text("application_id").notNull(),
  borrowerId: text("borrower_id"),
  tenantId: text("tenant_id"),
  propertyId: uuid("property_id"),

  documentType: text("document_type").notNull(),
  documentName: text("document_name").notNull(),
  fileName: text("file_name"),
  mimeType: text("mime_type"),
  byteSize: integer("byte_size"),
  checksum: text("checksum"),
  storageUri: text("storage_uri"),

  status: text("status").notNull().default("RECEIVED"),
  reviewStatus: text("review_status").notNull().default("REVIEW_REQUIRED"),
  retentionStatus: text("retention_status").notNull().default("RETAIN_PER_POLICY"),

  governanceVersion: text("governance_version").notNull(),
  classification: text("classification").notNull(),
  replayRef: text("replay_ref"),
  source: text("source"),

  metadata: jsonb("metadata"),

  receivedAt: timestamp("received_at", { withTimezone: true }).defaultNow(),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});
