import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Canonical Document Storage Handoff Schema
 *
 * Master Volume Governance:
 * - Vol I: Establishes governed storage intent authority before raw files move.
 * - Vol II: Preserves regulated borrower document handling, consent,
 *   controlled disclosure, and retention posture.
 * - Vol III: Provides durable replay-safe upload handoff records without
 *   accepting raw binary content into API runtime.
 * - Vol IV: Supports document recovery, escalation, storage provider review,
 *   chain-of-custody, and audit preparation.
 * - Vol V: Supports classification, source authority, replayability,
 *   observability, versioning, and evidence preservation.
 */

export const documentStorageHandoffs = pgTable("document_storage_handoffs", {
  id: uuid("id").defaultRandom().primaryKey(),

  applicationId: text("application_id").notNull(),
  borrowerId: text("borrower_id"),
  tenantId: text("tenant_id"),
  propertyId: uuid("property_id"),

  documentType: text("document_type").notNull(),
  documentName: text("document_name").notNull(),
  fileName: text("file_name").notNull(),
  mimeType: text("mime_type"),
  byteSize: integer("byte_size"),
  checksum: text("checksum"),

  storageProvider: text("storage_provider").notNull(),
  storageBucket: text("storage_bucket"),
  objectKey: text("object_key").notNull(),
  storageUri: text("storage_uri").notNull(),
  uploadMethod: text("upload_method").notNull().default("PUT"),
  uploadUrl: text("upload_url"),
  uploadTokenHash: text("upload_token_hash").notNull(),

  handoffStatus: text("handoff_status")
    .notNull()
    .default("PENDING_PROVIDER_CONFIGURATION"),
  rawContentAccepted: boolean("raw_content_accepted").notNull().default(false),
  providerConfigured: boolean("provider_configured").notNull().default(false),
  humanReviewRequired: boolean("human_review_required").notNull().default(true),

  governanceVersion: text("governance_version").notNull(),
  classification: text("classification").notNull(),
  replayRef: text("replay_ref"),
  traceId: text("trace_id"),
  source: text("source"),
  metadata: jsonb("metadata"),

  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  consumedAt: timestamp("consumed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});
