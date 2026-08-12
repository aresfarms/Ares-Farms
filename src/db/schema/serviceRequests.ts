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
 * Canonical Service Request Schema (licensed-module order + intake record)
 *
 * The durable, governed record produced when a customer ORDERS a licensed
 * service through the two licensed modules — an environmental report order
 * (Phase I/II/III or a PE review, routed to the Environmental Engineering
 * Spoke) or a financing deal intake (routed to the licensed lending spoke).
 * One row per submitted request. This is the "governed intake → licensed
 * professional fulfills" record: it holds property + contact + scope only, not
 * full borrower financials (the full deal-data workspace is a security-reviewed
 * fast-follow).
 *
 * Master Volume Governance:
 * - Vol I (FACILITATION-001, §3.32): the platform may FACILITATE but not
 *   DECIDE — a service request records an order and routes it to the licensed
 *   professional; it is never itself a determination, clearance, permit,
 *   credit decision, or lender commitment.
 * - Vol II (REG-NEPA-001 / USDA-ENV-001 §3.21): environmental requests record
 *   an order and route to the determining authority; no environmental
 *   determination is implied. (CONST-PATHWAY-001): financing requests route
 *   qualified interest to the licensed lender; no qualification is implied.
 *   Section 1071 firewall (§3.20): NO demographic data is collected or stored
 *   on this record — the firewall is architectural, so the columns simply do
 *   not exist.
 * - Vol III / III-B: durable, replay-safe order state carrying runtime guard,
 *   version lineage, classification, observability, explainability, and replay
 *   reference — written before any operator or fulfillment surface relies on it.
 * - Vol V (CANON-CLASS-001): classified Level 4 RESTRICTED — contact PII +
 *   property context. (CANON-EXPL-001 / HITL-GOV-001): human review required;
 *   the licensed professional is the reviewer of record. (CANON-TREASURY-001
 *   §9.1): any fee is disclosed at intake — the acknowledgement is recorded
 *   here; no post-hoc fee assessment. (CANON-CONSENT-001 §6): consent is
 *   recorded before the record is acted on.
 */

export const serviceRequests = pgTable("service_requests", {
  id: uuid("id").defaultRandom().primaryKey(),

  serviceRequestId: text("service_request_id").notNull(),
  // "environmental_report_order" | "financing_deal_intake"
  requestType: text("request_type").notNull(),
  // e.g. "phase_1_esa" | "phase_2_esa" | "phase_3_remediation" | "pe_review"
  // | "sba_7a" | "sba_504" | "usda_bi" | "fsa_farm_ownership" | "conventional"
  serviceCode: text("service_code"),
  status: text("status").notNull().default("SUBMITTED_PENDING_REVIEW"),
  // "environmental-engineering-spoke" | "licensed-lending-spoke"
  routedTo: text("routed_to").notNull(),

  tenantId: text("tenant_id"),
  actorId: text("actor_id"),
  userId: text("user_id"),
  applicationId: text("application_id"),
  reportId: text("report_id"),

  // Contact PII — Level 4 RESTRICTED. No demographic fields (1071 firewall).
  contactName: text("contact_name"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),

  // Property + scope context (not full financials).
  propertyDescriptor: text("property_descriptor"),
  locationState: text("location_state"),
  locationCounty: text("location_county"),
  scopeSummary: text("scope_summary"),
  // High-level, ranged project/deal size only — never a credit determination.
  estimatedValue: integer("estimated_value"),

  feeDisclosureAcknowledged: boolean("fee_disclosure_acknowledged")
    .notNull()
    .default(false),
  consentAcknowledged: boolean("consent_acknowledged").notNull().default(false),
  humanReviewRequired: boolean("human_review_required").notNull().default(true),
  // Furlong records + routes only; it never issues the determination/decision.
  determinationIssued: boolean("determination_issued").notNull().default(false),

  requestPayload: jsonb("request_payload"),
  responsePayload: jsonb("response_payload"),

  governanceVersion: text("governance_version").notNull(),
  classification: text("classification").notNull().default("RESTRICTED"),
  replayRef: text("replay_ref"),
  traceId: text("trace_id"),
  source: text("source"),
  metadata: jsonb("metadata"),

  occurredAt: timestamp("occurred_at", { withTimezone: true }).defaultNow(),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export type ServiceRequestRow = typeof serviceRequests.$inferSelect;
export type ServiceRequestInsert = typeof serviceRequests.$inferInsert;
