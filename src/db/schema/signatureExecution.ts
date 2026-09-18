import { boolean, integer, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

const evidence = {
  governanceVersion: text("governance_version").notNull(),
  classification: text("classification").notNull().default("RESTRICTED"),
  replayRef: text("replay_ref").notNull(),
  traceId: text("trace_id").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
};

export const signatureExecutionCases = pgTable("signature_execution_cases", {
  id: uuid("id").defaultRandom().primaryKey(), applicationId: text("application_id").notNull(),
  sourceDocumentId: uuid("source_document_id").notNull(), purpose: text("purpose").notNull(),
  transactionClass: text("transaction_class").notNull(), jurisdiction: text("jurisdiction").notNull(),
  state: text("state").notNull().default("DRAFT"), aggregateVersion: integer("aggregate_version").notNull().default(1),
  activeDocumentVersionId: uuid("active_document_version_id"), activePlacementPlanId: uuid("active_placement_plan_id"),
  liveSigningBlocked: boolean("live_signing_blocked").notNull().default(true),
  closedAt: timestamp("closed_at", { withTimezone: true }), updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  ...evidence,
});

export const executionDocumentVersions = pgTable("execution_document_versions", {
  id: uuid("id").defaultRandom().primaryKey(), caseId: uuid("case_id").notNull(), sourceRef: text("source_ref").notNull(),
  sourceSha256: text("source_sha256").notNull(), mediaType: text("media_type").notNull(), pageCount: integer("page_count").notNull(),
  pageBoxesHash: text("page_boxes_hash").notNull(), pdfProfile: text("pdf_profile").notNull(), formAnalysisRef: text("form_analysis_ref"),
  existingSignatureStatus: text("existing_signature_status").notNull(), analysisJson: jsonb("analysis_json").notNull(),
  sealedAt: timestamp("sealed_at", { withTimezone: true }).notNull(), supersedesId: uuid("supersedes_id"), invalidatedAt: timestamp("invalidated_at", { withTimezone: true }),
  ...evidence,
}, (t) => [uniqueIndex("execution_document_case_hash_uq").on(t.caseId, t.sourceSha256)]);

export const signaturePlacementPlans = pgTable("signature_placement_plans", {
  id: uuid("id").defaultRandom().primaryKey(), documentVersionId: uuid("document_version_id").notNull(), profile: text("profile").notNull(),
  zoneRefs: jsonb("zone_refs").notNull(), marginRegions: jsonb("margin_regions").notNull(),
  appendedPageTemplateVersion: text("appended_page_template_version"), collisionReportHash: text("collision_report_hash").notNull(),
  planSha256: text("plan_sha256").notNull(), reviewerId: text("reviewer_id"), approvedAt: timestamp("approved_at", { withTimezone: true }),
  invalidatedAt: timestamp("invalidated_at", { withTimezone: true }), ...evidence,
});

export const signerAuthorityRecords = pgTable("signer_authority_records", {
  id: uuid("id").defaultRandom().primaryKey(), caseId: uuid("case_id").notNull(), signerId: text("signer_id").notNull(),
  identityAssuranceLevel: text("identity_assurance_level").notNull(), identityEvidenceRef: text("identity_evidence_ref").notNull(),
  capacity: text("capacity").notNull(), representedPartyRef: text("represented_party_ref"), authorityBasis: text("authority_basis").notNull(),
  evidenceRefs: jsonb("evidence_refs").notNull(), verifiedBy: text("verified_by").notNull(), validFrom: timestamp("valid_from", { withTimezone: true }).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(), revokedAt: timestamp("revoked_at", { withTimezone: true }), ...evidence,
});

export const signatureElectronicConsents = pgTable("signature_electronic_consents", {
  id: uuid("id").defaultRandom().primaryKey(), caseId: uuid("case_id").notNull(), signerId: text("signer_id").notNull(),
  disclosureVersion: text("disclosure_version").notNull(), disclosureSha256: text("disclosure_sha256").notNull(), locale: text("locale").notNull(),
  accessibilityMode: text("accessibility_mode").notNull(), presentationRef: text("presentation_ref").notNull(), affirmativeAction: text("affirmative_action").notNull(),
  consentedAt: timestamp("consented_at", { withTimezone: true }).notNull(), expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  withdrawnAt: timestamp("withdrawn_at", { withTimezone: true }), ...evidence,
});

export const signatureIntentRecords = pgTable("signature_intent_records", {
  id: uuid("id").defaultRandom().primaryKey(), caseId: uuid("case_id").notNull(), documentVersionId: uuid("document_version_id").notNull(),
  sourceSha256: text("source_sha256").notNull(), signerId: text("signer_id").notNull(), authorityId: uuid("authority_id").notNull(),
  consentId: uuid("consent_id").notNull(), intentStatementHash: text("intent_statement_hash").notNull(), affirmativeAction: text("affirmative_action").notNull(),
  sessionRef: text("session_ref").notNull(), occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(), revokedAt: timestamp("revoked_at", { withTimezone: true }), ...evidence,
});

export const signatureExecutionAuthorizations = pgTable("signature_execution_authorizations", {
  id: uuid("id").defaultRandom().primaryKey(), caseId: uuid("case_id").notNull(), documentVersionId: uuid("document_version_id").notNull(),
  intentId: uuid("intent_id").notNull(), placementPlanId: uuid("placement_plan_id").notNull(), gateSnapshot: jsonb("gate_snapshot").notNull(),
  gateSnapshotHash: text("gate_snapshot_hash").notNull(), idempotencyKey: text("idempotency_key").notNull(), decision: text("decision").notNull(),
  blockerCodes: jsonb("blocker_codes").notNull(), environment: text("environment").notNull(), authorizedBy: text("authorized_by").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(), consumedAt: timestamp("consumed_at", { withTimezone: true }), ...evidence,
}, (t) => [uniqueIndex("signature_execution_authorization_idempotency_uq").on(t.idempotencyKey)]);

export const signatureCommandOutbox = pgTable("signature_command_outbox", {
  id: uuid("id").defaultRandom().primaryKey(), caseId: uuid("case_id").notNull(), authorizationId: uuid("authorization_id").notNull(),
  commandType: text("command_type").notNull(), idempotencyKey: text("idempotency_key").notNull(), status: text("status").notNull().default("PENDING"),
  attemptCount: integer("attempt_count").notNull().default(0), nextAttemptAt: timestamp("next_attempt_at", { withTimezone: true }),
  lockedAt: timestamp("locked_at", { withTimezone: true }), completedAt: timestamp("completed_at", { withTimezone: true }), ...evidence,
}, (t) => [uniqueIndex("signature_command_outbox_key_uq").on(t.idempotencyKey)]);

export const signatureWebhookInbox = pgTable("signature_webhook_inbox", {
  id: uuid("id").defaultRandom().primaryKey(), adapterId: text("adapter_id").notNull(), providerEventId: text("provider_event_id").notNull(),
  bodySha256: text("body_sha256").notNull(), signatureVerified: boolean("signature_verified").notNull(), replayWindowValid: boolean("replay_window_valid").notNull(),
  tenantVerified: boolean("tenant_verified").notNull(), receivedAt: timestamp("received_at", { withTimezone: true }).notNull(), normalizedEventType: text("normalized_event_type"),
  processedAt: timestamp("processed_at", { withTimezone: true }), ...evidence,
}, (t) => [uniqueIndex("signature_webhook_provider_event_uq").on(t.adapterId, t.providerEventId)]);

export const signatureEvidenceBundles = pgTable("signature_evidence_bundles", {
  id: uuid("id").defaultRandom().primaryKey(), caseId: uuid("case_id").notNull(), authorizationId: uuid("authorization_id").notNull(),
  adapterId: text("adapter_id").notNull(), providerCorrelationRef: text("provider_correlation_ref").notNull(), evidenceRefs: jsonb("evidence_refs").notNull(),
  evidenceSha256: text("evidence_sha256").notNull(), signatureMethod: text("signature_method").notNull(), capturedAt: timestamp("captured_at", { withTimezone: true }).notNull(), ...evidence,
});

export const executedPdfVersions = pgTable("executed_pdf_versions", {
  id: uuid("id").defaultRandom().primaryKey(), caseId: uuid("case_id").notNull(), authorizationId: uuid("authorization_id").notNull(),
  sourceSha256: text("source_sha256").notNull(), executedSha256: text("executed_sha256").notNull(), bytesRef: text("bytes_ref").notNull(),
  pageCount: integer("page_count").notNull(), evidenceBundleId: uuid("evidence_bundle_id").notNull(), validationReportHash: text("validation_report_hash").notNull(),
  executedAt: timestamp("executed_at", { withTimezone: true }).notNull(), status: text("status").notNull(), supersedesId: uuid("supersedes_id"),
  voidedAt: timestamp("voided_at", { withTimezone: true }), ...evidence,
}, (t) => [uniqueIndex("executed_pdf_case_hash_uq").on(t.caseId, t.executedSha256)]);

export const signatureValidationReports = pgTable("signature_validation_reports", {
  id: uuid("id").defaultRandom().primaryKey(), caseId: uuid("case_id").notNull(), executedPdfVersionId: uuid("executed_pdf_version_id"),
  sourceSha256: text("source_sha256").notNull(), executedSha256: text("executed_sha256").notNull(), structuralValid: boolean("structural_valid").notNull(),
  pageCountValid: boolean("page_count_valid").notNull(), originalPagesPreserved: boolean("original_pages_preserved").notNull(),
  evidenceBindingValid: boolean("evidence_binding_valid").notNull(), accessibilityValid: boolean("accessibility_valid").notNull(),
  checks: jsonb("checks").notNull(), reportSha256: text("report_sha256").notNull(), validatedAt: timestamp("validated_at", { withTimezone: true }).notNull(), ...evidence,
});

export const signatureFailures = pgTable("signature_failures", {
  id: uuid("id").defaultRandom().primaryKey(), caseId: uuid("case_id").notNull(), stage: text("stage").notNull(), failureClass: text("failure_class").notNull(),
  blockerCode: text("blocker_code").notNull(), retryable: boolean("retryable").notNull().default(false), outcomeAmbiguous: boolean("outcome_ambiguous").notNull().default(false),
  providerCodeSanitized: text("provider_code_sanitized"), nextAction: text("next_action").notNull(), owner: text("owner").notNull(), resolvedAt: timestamp("resolved_at", { withTimezone: true }), ...evidence,
});

export const signatureReconciliationDecisions = pgTable("signature_reconciliation_decisions", {
  id: uuid("id").defaultRandom().primaryKey(), caseId: uuid("case_id").notNull(), outboxId: uuid("outbox_id"),
  determination: text("determination").notNull(), evidenceRefs: jsonb("evidence_refs").notNull(), decidedBy: text("decided_by").notNull(),
  decidedAt: timestamp("decided_at", { withTimezone: true }).notNull(), ...evidence,
});

export const signatureExecutionEvents = pgTable("signature_execution_events", {
  id: uuid("id").defaultRandom().primaryKey(), caseId: uuid("case_id").notNull(), aggregateVersion: integer("aggregate_version").notNull(),
  eventType: text("event_type").notNull(), actorRef: text("actor_ref").notNull(), occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
  payloadHash: text("payload_hash").notNull(), priorEventHash: text("prior_event_hash").notNull(), eventHash: text("event_hash").notNull(),
  correlationRef: text("correlation_ref").notNull(), causationRef: text("causation_ref"), idempotencyKey: text("idempotency_key"), ...evidence,
}, (t) => [uniqueIndex("signature_event_case_version_uq").on(t.caseId, t.aggregateVersion), uniqueIndex("signature_event_idempotency_uq").on(t.idempotencyKey)]);

export const signatureReplayRefs = pgTable("signature_replay_refs", {
  id: uuid("id").defaultRandom().primaryKey(), caseId: uuid("case_id").notNull(), eventRange: jsonb("event_range").notNull(),
  policyVersion: text("policy_version").notNull(), overlayVersion: text("overlay_version").notNull(), templateVersion: text("template_version"),
  providerVersion: text("provider_version").notNull(), reconstructedState: text("reconstructed_state").notNull(),
  deterministic: boolean("deterministic").notNull(), validationResultHash: text("validation_result_hash").notNull(), verifiedAt: timestamp("verified_at", { withTimezone: true }).notNull(), ...evidence,
});
