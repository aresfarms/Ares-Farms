import {
  pgTable,
  text,
  timestamp,
  uuid,
  jsonb,
} from "drizzle-orm/pg-core";

/**
 * Canonical Schema Source
 *
 * Master Volume Governance:
 * - Vol I: Constitutional Backbone
 *   Establishes one authoritative backend schema spine.
 *
 * - Vol II: Regulatory Governance
 *   Supports classification-aware data governance and controlled onboarding.
 *
 * - Vol III: Technical Infrastructure
 *   Prevents schema drift and duplicate infrastructure paths.
 *
 * - Vol IV: Operational Runbooks
 *   Enables predictable operational recovery and replay.
 *
 * - Vol V: Canonical Platform Doctrines
 *   Supports canonical replay, versioning, observability, explainability,
 *   classification, source authority, and future simulation controls.
 *
 * Build Rule:
 * This file is the ONLY public schema export surface.
 * All schema modules must be exported through this barrel.
 */

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull(),
  name: text("name"),
  role: text("role").default("user"),
  tenantId: text("tenant_id"),
  governanceVersion: text("governance_version"),
  classification: text("classification"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const properties = pgTable("properties", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id"),
  tenantId: text("tenant_id"),
  name: text("name"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zip: text("zip"),
  county: text("county"),
  country: text("country"),
  federalRegion: text("federal_region"),
  internalRegion: text("internal_region"),
  governanceVersion: text("governance_version"),
  classification: text("classification"),
  replayRef: text("replay_ref"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

/**
 * Canonical governance schema modules.
 */

export * from "./applicationDocuments";
export * from "./applications";
export * from "./auditEvents";
export * from "./billingEvents";
export * from "./borrowerNoticeDeliveries";
export * from "./borrowerNoticeDeliveryReceipts";
export * from "./borrowerNoticeExceptionResolutions";
export * from "./borrowerNoticeProviderExecutions";
export * from "./canonicalLedger";
export * from "./canonicalLedgerMeta";
export * from "./certifiedConnectorAdapters";
export * from "./credentialVaultRefs";
export * from "./credentialedScrapingEvents";
export * from "./dataClassificationRegistry";
export * from "./documentStorageHandoffs";
export * from "./entitlements";
export * from "./environmentalComplianceRecords";
export * from "./externalConnectorExecutions";
export * from "./externalDataConnectors";
export * from "./externalSourceStackGovernance";
export * from "./liveActionReadinessReviews";
export * from "./lenderSubmissions";
export * from "./missingDoctrineGovernance";
export * from "./observabilityEvents";
export * from "./operatorReviewQueues";
export * from "./partnerWorkflows";
export * from "./paymentConnectorAdapters";
export * from "./paymentConnectorExecutions";
export * from "./pipeline";
export * from "./regulatedDecisionNotices";
export * from "./recommendationReleaseAttestations";
export * from "./recommendationReleaseEscalationAcknowledgements";
export * from "./recommendationReleaseRecords";
export * from "./reportRecords";
export * from "./revenueSourceIntelligenceGovernance";
export * from "./replayVerification";
export * from "./reviewTransitionControls";
export * from "./reviewWorkflows";
export * from "./ruleOverlayRegistry";
export * from "./schemaRegistry";
export * from "./scraperSourceGovernance";
export * from "./serviceRequests";
export * from "./sovereignConsentGatewayRecords";
export * from "./treasury";
export * from "./versionRegistry";
