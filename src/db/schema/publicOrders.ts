import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Resource-scoped public purchases.
 *
 * These records never mutate the institution/tenant entitlement table. A
 * purchase is bound to one property, one comparison, or an explicitly metered
 * access grant and retains its price/catalog lineage for replay.
 */
const lineage = {
  governanceVersion: text("governance_version").notNull(),
  classification: text("classification").notNull().default("CONFIDENTIAL"),
  replayRef: text("replay_ref").notNull(),
  traceId: text("trace_id").notNull(),
  source: text("source").notNull(),
  metadata: jsonb("metadata"),
};

export const furlongPublicOrders = pgTable(
  "furlong_public_orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    checkoutRequestId: text("checkout_request_id").notNull(),
    buyerActorId: text("buyer_actor_id"),
    accessTokenHash: text("access_token_hash").notNull(),

    productCode: text("product_code").notNull(),
    productCatalogVersion: text("product_catalog_version").notNull(),
    targetType: text("target_type").notNull(),
    targetRef: text("target_ref").notNull(),
    targetSnapshot: jsonb("target_snapshot").notNull(),
    fulfillmentMode: text("fulfillment_mode").notNull(),
    status: text("status").notNull().default("CREATED"),

    unitAmountCents: integer("unit_amount_cents").notNull(),
    amountTotalCents: integer("amount_total_cents").notNull(),
    amountPaidCents: integer("amount_paid_cents").notNull().default(0),
    amountRefundedCents: integer("amount_refunded_cents").notNull().default(0),
    currency: text("currency").notNull().default("usd"),
    quantity: integer("quantity").notNull().default(1),
    reportCredits: integer("report_credits").notNull().default(0),
    creditSourceOrderId: uuid("credit_source_order_id"),
    creditAmountCents: integer("credit_amount_cents").notNull().default(0),

    checkoutSessionId: text("checkout_session_id"),
    paymentIntentId: text("payment_intent_id"),
    subscriptionId: text("subscription_id"),
    provider: text("provider").notNull().default("stripe"),

    ...lineage,

    checkoutCreatedAt: timestamp("checkout_created_at", {
      withTimezone: true,
    }),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    fulfillmentStartedAt: timestamp("fulfillment_started_at", {
      withTimezone: true,
    }),
    fulfilledAt: timestamp("fulfilled_at", { withTimezone: true }),
    canceledAt: timestamp("canceled_at", { withTimezone: true }),
    refundedAt: timestamp("refunded_at", { withTimezone: true }),
    disputedAt: timestamp("disputed_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("furlong_public_orders_checkout_request_uq").on(
      table.checkoutRequestId,
    ),
    uniqueIndex("furlong_public_orders_access_token_uq").on(
      table.accessTokenHash,
    ),
    uniqueIndex("furlong_public_orders_checkout_session_uq").on(
      table.checkoutSessionId,
    ),
    uniqueIndex("furlong_public_orders_payment_intent_uq").on(
      table.paymentIntentId,
    ),
    uniqueIndex("furlong_public_orders_credit_source_uq").on(
      table.creditSourceOrderId,
    ),
    index("furlong_public_orders_buyer_idx").on(
      table.buyerActorId,
      table.updatedAt,
    ),
    index("furlong_public_orders_target_idx").on(
      table.targetType,
      table.targetRef,
      table.updatedAt,
    ),
    index("furlong_public_orders_status_idx").on(table.status, table.updatedAt),
  ],
);

export const furlongPublicOrderEvents = pgTable(
  "furlong_public_order_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => furlongPublicOrders.id, { onDelete: "cascade" }),
    provider: text("provider").notNull().default("stripe"),
    providerEventId: text("provider_event_id").notNull(),
    eventType: text("event_type").notNull(),
    eventStatus: text("event_status").notNull(),
    payloadDigest: text("payload_digest").notNull(),
    amountCents: integer("amount_cents"),
    currency: text("currency"),
    paymentStatus: text("payment_status"),
    ...lineage,
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("furlong_public_order_events_provider_event_uq").on(
      table.provider,
      table.providerEventId,
    ),
    index("furlong_public_order_events_order_idx").on(
      table.orderId,
      table.occurredAt,
    ),
  ],
);

export const furlongPublicAccessGrants = pgTable(
  "furlong_public_access_grants",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => furlongPublicOrders.id, { onDelete: "cascade" }),
    buyerActorId: text("buyer_actor_id"),
    accessType: text("access_type").notNull(),
    resourceType: text("resource_type").notNull(),
    resourceRef: text("resource_ref").notNull(),
    active: boolean("active").notNull().default(true),
    unitsGranted: integer("units_granted").notNull().default(1),
    unitsRemaining: integer("units_remaining").notNull().default(1),
    ...lineage,
    startsAt: timestamp("starts_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    revocationReason: text("revocation_reason"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("furlong_public_access_grants_scope_uq").on(
      table.orderId,
      table.accessType,
      table.resourceType,
      table.resourceRef,
    ),
    index("furlong_public_access_grants_resource_idx").on(
      table.resourceType,
      table.resourceRef,
      table.active,
    ),
    index("furlong_public_access_grants_buyer_idx").on(
      table.buyerActorId,
      table.active,
    ),
  ],
);

export type FurlongPublicOrderRow = typeof furlongPublicOrders.$inferSelect;
export type FurlongPublicOrderEventRow =
  typeof furlongPublicOrderEvents.$inferSelect;
export type FurlongPublicAccessGrantRow =
  typeof furlongPublicAccessGrants.$inferSelect;

export const furlongPublicProductPriceReviews = pgTable(
  "furlong_public_product_price_reviews",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    productCode: text("product_code").notNull(),
    productCatalogVersion: text("product_catalog_version").notNull(),
    unitAmountCents: integer("unit_amount_cents").notNull(),
    currency: text("currency").notNull().default("usd"),

    directDataCostCents: integer("direct_data_cost_cents").notNull(),
    computeCostCents: integer("compute_cost_cents").notNull(),
    reviewLaborMinutes: integer("review_labor_minutes").notNull(),
    reviewLaborRateCentsHourly: integer(
      "review_labor_rate_cents_hourly",
    ).notNull(),
    supportReserveCents: integer("support_reserve_cents").notNull(),
    overheadAllocationCents: integer("overhead_allocation_cents").notNull(),
    paymentFeeBasisPoints: integer("payment_fee_basis_points").notNull(),
    paymentFeeFixedCents: integer("payment_fee_fixed_cents").notNull(),
    refundReserveBasisPoints: integer("refund_reserve_basis_points").notNull(),

    fullyLoadedCostCents: integer("fully_loaded_cost_cents").notNull(),
    contributionMarginCents: integer("contribution_margin_cents").notNull(),
    contributionMarginBasisPoints: integer(
      "contribution_margin_basis_points",
    ).notNull(),
    minimumMarginBasisPoints: integer("minimum_margin_basis_points").notNull(),

    reviewStatus: text("review_status").notNull().default("DRAFT"),
    reviewedBy: text("reviewed_by"),
    sourceRefs: jsonb("source_refs").notNull().default([]),
    assumptions: jsonb("assumptions").notNull().default({}),
    ...lineage,
    effectiveAt: timestamp("effective_at", { withTimezone: true }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("furlong_public_product_price_reviews_period_uq").on(
      table.productCode,
      table.productCatalogVersion,
      table.effectiveAt,
    ),
    index("furlong_public_product_price_reviews_active_idx").on(
      table.productCode,
      table.productCatalogVersion,
      table.reviewStatus,
      table.effectiveAt,
      table.expiresAt,
    ),
  ],
);

export type FurlongPublicProductPriceReviewRow =
  typeof furlongPublicProductPriceReviews.$inferSelect;
