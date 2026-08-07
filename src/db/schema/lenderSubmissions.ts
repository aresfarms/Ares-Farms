import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/** Governed lender-submission records. Payload-bearing rows are append-only. */
const evidence = {
  governanceVersion: text("governance_version").notNull(),
  classification: text("classification").notNull().default("RESTRICTED"),
  replayRef: text("replay_ref").notNull(),
  traceId: text("trace_id").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
};

export const lenderSubmissionCases = pgTable("lender_submission_cases", {
  id: uuid("id").defaultRandom().primaryKey(),
  applicationId: text("application_id").notNull(),
  customerId: text("customer_id").notNull(),
  state: text("state").notNull().default("DRAFT"),
  activePackageVersionId: uuid("active_package_version_id"),
  productionDeliveryBlocked: boolean("production_delivery_blocked").notNull().default(true),
  closedAt: timestamp("closed_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  ...evidence,
});

export const submissionPackageVersions = pgTable(
  "submission_package_versions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    caseId: uuid("case_id").notNull(),
    version: integer("version").notNull(),
    manifestJson: jsonb("manifest_json").notNull(),
    manifestSha256: text("manifest_sha256").notNull(),
    byteLength: integer("byte_length").notNull(),
    frozenAt: timestamp("frozen_at", { withTimezone: true }).notNull(),
    invalidatedAt: timestamp("invalidated_at", { withTimezone: true }),
    invalidationReason: text("invalidation_reason"),
    ...evidence,
  },
  (table) => [uniqueIndex("submission_package_case_version_uq").on(table.caseId, table.version)],
);

export const submissionPackageItems = pgTable(
  "submission_package_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    packageVersionId: uuid("package_version_id").notNull(),
    ordinal: integer("ordinal").notNull(),
    canonicalName: text("canonical_name").notNull(),
    sourceRef: text("source_ref").notNull(),
    sourceVersion: text("source_version").notNull(),
    sha256: text("sha256").notNull(),
    byteLength: integer("byte_length").notNull(),
    mediaType: text("media_type").notNull(),
    dataCategory: text("data_category").notNull(),
    itemClassification: text("item_classification").notNull(),
    malwareScanStatus: text("malware_scan_status").notNull(),
    redactionStatus: text("redaction_status").notNull(),
    overlayVersion: text("overlay_version").notNull(),
    authenticityEvidenceRef: text("authenticity_evidence_ref").notNull(),
    authenticityClassification: text("authenticity_classification").notNull(),
    ...evidence,
  },
  (table) => [uniqueIndex("submission_package_item_ordinal_uq").on(table.packageVersionId, table.ordinal)],
);

export const customerSubmissionConsents = pgTable("customer_submission_consents", {
  id: uuid("id").defaultRandom().primaryKey(),
  caseId: uuid("case_id").notNull(),
  packageVersionId: uuid("package_version_id").notNull(),
  manifestSha256: text("manifest_sha256").notNull(),
  customerId: text("customer_id").notNull(),
  lenderId: text("lender_id").notNull(),
  recipientScope: text("recipient_scope").notNull(),
  purpose: text("purpose").notNull(),
  channel: text("channel").notNull(),
  dataCategories: jsonb("data_categories").notNull(),
  disclosureVersion: text("disclosure_version").notNull(),
  disclosureSha256: text("disclosure_sha256").notNull(),
  consentedAt: timestamp("consented_at", { withTimezone: true }).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  ...evidence,
});

export const recipientVerifications = pgTable("recipient_verifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  lenderId: text("lender_id").notNull(),
  channel: text("channel").notNull(),
  destinationFingerprint: text("destination_fingerprint").notNull(),
  verificationLevel: text("verification_level").notNull(),
  verifiedBy: text("verified_by"),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  ...evidence,
});

export const dispatchAuthorizations = pgTable("dispatch_authorizations", {
  id: uuid("id").defaultRandom().primaryKey(),
  caseId: uuid("case_id").notNull(),
  packageVersionId: uuid("package_version_id").notNull(),
  consentId: uuid("consent_id").notNull(),
  recipientVerificationId: uuid("recipient_verification_id").notNull(),
  adapterId: text("adapter_id").notNull(),
  environment: text("environment").notNull(),
  allowed: boolean("allowed").notNull(),
  gateResults: jsonb("gate_results").notNull(),
  authorizationSha256: text("authorization_sha256").notNull(),
  authorizedBy: text("authorized_by").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  consumedAt: timestamp("consumed_at", { withTimezone: true }),
  ...evidence,
});

export const deliveryOutbox = pgTable(
  "delivery_outbox",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    caseId: uuid("case_id").notNull(),
    authorizationId: uuid("authorization_id").notNull(),
    idempotencyKey: text("idempotency_key").notNull(),
    status: text("status").notNull().default("PENDING"),
    attemptCount: integer("attempt_count").notNull().default(0),
    nextAttemptAt: timestamp("next_attempt_at", { withTimezone: true }),
    lockedAt: timestamp("locked_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    ...evidence,
  },
  (table) => [uniqueIndex("delivery_outbox_idempotency_uq").on(table.idempotencyKey)],
);

export const deliveryAttempts = pgTable("delivery_attempts", {
  id: uuid("id").defaultRandom().primaryKey(),
  outboxId: uuid("outbox_id").notNull(),
  attemptNumber: integer("attempt_number").notNull(),
  status: text("status").notNull(),
  providerReference: text("provider_reference"),
  requestSha256: text("request_sha256").notNull(),
  transientSafe: boolean("transient_safe").notNull().default(false),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  ...evidence,
});

export const deliveryReceipts = pgTable("delivery_receipts", {
  id: uuid("id").defaultRandom().primaryKey(),
  outboxId: uuid("outbox_id").notNull(),
  attemptId: uuid("attempt_id"),
  providerEventId: text("provider_event_id").notNull(),
  truthStatus: text("truth_status").notNull(),
  payloadSha256: text("payload_sha256").notNull(),
  signatureVerified: boolean("signature_verified").notNull().default(false),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
  ...evidence,
});

export const submissionFailures = pgTable("submission_failures", {
  id: uuid("id").defaultRandom().primaryKey(),
  caseId: uuid("case_id").notNull(),
  outboxId: uuid("outbox_id"),
  code: text("code").notNull(),
  severity: text("severity").notNull(),
  retryable: boolean("retryable").notNull().default(false),
  reconciliationRequired: boolean("reconciliation_required").notNull().default(false),
  safeMessage: text("safe_message").notNull(),
  detailsSha256: text("details_sha256").notNull(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  ...evidence,
});
