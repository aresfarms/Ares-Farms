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

/**
 * Capital Network — durable multi-provider financing network state.
 *
 * A provider profile declares appetite and institutional posture. A match is an
 * advisory fit snapshot. A deal room is created only after borrower selection,
 * and provider access remains false until exact package consent is recorded.
 * None of these records is a credit decision, commitment, or lender approval.
 */
const evidence = {
  governanceVersion: text("governance_version").notNull(),
  classification: text("classification").notNull().default("CONFIDENTIAL"),
  replayRef: text("replay_ref"),
  traceId: text("trace_id"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};

export const capitalNetworkProviders = pgTable(
  "capital_network_providers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    providerId: text("provider_id").notNull(),
    organizationName: text("organization_name").notNull(),
    providerRole: text("provider_role").notNull(),
    providerType: text("provider_type").notNull(),
    status: text("status").notNull().default("APPLICANT"),
    affiliation: text("affiliation").notNull().default("INDEPENDENT"),
    primaryContactEmail: text("primary_contact_email").notNull(),
    website: text("website"),
    states: jsonb("states").notNull(),
    programs: jsonb("programs").notNull(),
    purposes: jsonb("purposes").notNull(),
    propertyTypes: jsonb("property_types").notNull(),
    industries: jsonb("industries").notNull(),
    borrowerTypes: jsonb("borrower_types").notNull(),
    minDealAmount: integer("min_deal_amount"),
    maxDealAmount: integer("max_deal_amount"),
    acceptsBrokeredDeals: boolean("accepts_brokered_deals").notNull().default(false),
    acceptsDirectBorrower: boolean("accepts_direct_borrower").notNull().default(false),
    matchingEnabled: boolean("matching_enabled").notNull().default(false),
    explicitAssignmentAllowed: boolean("explicit_assignment_allowed").notNull().default(false),
    liveRoutingAllowed: boolean("live_routing_allowed").notNull().default(false),
    credentialStatus: text("credential_status").notNull().default("PENDING"),
    connectorStatus: text("connector_status").notNull().default("NOT_CONFIGURED"),
    participationTermsStatus: text("participation_terms_status").notNull().default("PENDING"),
    dataAgreementStatus: text("data_agreement_status").notNull().default("PENDING"),
    compensationStatus: text("compensation_status").notNull().default("UNSET"),
    profileVersion: integer("profile_version").notNull().default(1),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    ...evidence,
  },
  (table) => [
    uniqueIndex("capital_network_provider_id_uq").on(table.providerId),
  ],
);

export const capitalNetworkMatches = pgTable(
  "capital_network_matches",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    serviceRequestId: text("service_request_id").notNull(),
    providerId: text("provider_id").notNull(),
    providerProfileVersion: integer("provider_profile_version").notNull(),
    score: integer("score").notNull(),
    eligible: boolean("eligible").notNull().default(false),
    reasons: jsonb("reasons").notNull(),
    blockers: jsonb("blockers").notNull(),
    matchStatus: text("match_status").notNull().default("CANDIDATE"),
    selectedBy: text("selected_by"),
    selectedAt: timestamp("selected_at", { withTimezone: true }),
    lastMatchedAt: timestamp("last_matched_at", { withTimezone: true }).notNull().defaultNow(),
    dataShared: boolean("data_shared").notNull().default(false),
    ...evidence,
  },
  (table) => [
    uniqueIndex("capital_network_match_case_provider_uq").on(
      table.serviceRequestId,
      table.providerId,
    ),
  ],
);

export const capitalNetworkDealRooms = pgTable(
  "capital_network_deal_rooms",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    serviceRequestId: text("service_request_id").notNull(),
    providerId: text("provider_id").notNull(),
    matchId: uuid("match_id"),
    submissionCaseId: uuid("submission_case_id"),
    roomStatus: text("room_status").notNull().default("AWAITING_PACKAGE_AND_CONSENT"),
    providerAccessAllowed: boolean("provider_access_allowed").notNull().default(false),
    dataShared: boolean("data_shared").notNull().default(false),
    selectedAt: timestamp("selected_at", { withTimezone: true }),
    consentedAt: timestamp("consented_at", { withTimezone: true }),
    closedAt: timestamp("closed_at", { withTimezone: true }),
    ...evidence,
  },
  (table) => [
    uniqueIndex("capital_network_room_case_provider_uq").on(
      table.serviceRequestId,
      table.providerId,
    ),
  ],
);

export type CapitalNetworkProviderRow = typeof capitalNetworkProviders.$inferSelect;
export type CapitalNetworkMatchRow = typeof capitalNetworkMatches.$inferSelect;
export type CapitalNetworkDealRoomRow = typeof capitalNetworkDealRooms.$inferSelect;
