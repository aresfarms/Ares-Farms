import { createHash, randomBytes, randomUUID } from "node:crypto";

import {
  and,
  count,
  desc,
  eq,
  gt,
  inArray,
  isNull,
  or,
  sql,
} from "drizzle-orm";

import {
  furlongPublicAccessGrants,
  furlongPublicOrderEvents,
  furlongPublicOrders,
} from "@/db/schema";
import { db } from "@/lib/db";
import {
  PUBLIC_PRODUCT_CATALOG_VERSION,
  PUBLIC_PRODUCTS,
  isPublicProductCode,
  type PublicProduct,
  type PublicProductTargetType,
} from "@/lib/billing/publicProductCatalog";
import {
  PUBLIC_ORDER_AGREEMENT_ACCEPTANCE,
  PUBLIC_ORDER_AGREEMENT_ID,
  PUBLIC_ORDER_AGREEMENT_TERMS,
  PUBLIC_ORDER_AGREEMENT_TEXT,
  PUBLIC_ORDER_AGREEMENT_TITLE,
  PUBLIC_ORDER_AGREEMENT_VERSION,
} from "@/lib/billing/publicOrderAgreement";
import {
  evaluatePublicOrderPaymentEvent,
  type PublicOrderStripeEventInput,
} from "@/lib/billing/publicOrderPaymentPolicy";
import { evaluatePublicOrderFullRefund } from "@/lib/billing/publicOrderRefundPolicy";
import { readPublicOrderReportArtifact } from "@/lib/billing/publicOrderReportArtifact";

export const PUBLIC_ORDER_GOVERNANCE_VERSION = "furlong-public-order-v1.0.0";
const PUBLIC_ORDER_SOURCE = "furlong-public-order-runtime";
const ORDER_RECOVERY_DAYS = 365;
const PUBLIC_ORDER_CAPACITY_STATUSES = [
  "CREATED",
  "CHECKOUT_CREATED",
  "PAYMENT_PENDING",
  "PAID",
  "FULFILLMENT_PENDING",
  "IN_FULFILLMENT",
  "HELD",
  "REFUND_PENDING",
  "DISPUTED",
];
const PUBLIC_ORDER_AGREEMENT_DIGEST = createHash("sha256")
  .update(PUBLIC_ORDER_AGREEMENT_TEXT, "utf8")
  .digest("hex");

export class PublicOrderConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PublicOrderConflictError";
  }
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function newAccessToken(): string {
  return "furlong-order-" + randomBytes(32).toString("base64url");
}

function requiredText(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(label + " is required.");
  return normalized;
}

function safeMetadata(value: Record<string, unknown> | undefined) {
  return value ?? {};
}

export async function createPublicOrder(input: {
  checkoutRequestId: string;
  buyerActorId: string | null;
  product: PublicProduct;
  targetType: PublicProductTargetType;
  targetRef: string;
  targetSnapshot: Record<string, unknown>;
  priceReviewId: string;
  maxOpenOrders: number;
  upgradeSource?: {
    orderId: string;
    accessToken: string;
  } | null;
  traceId: string;
}) {
  if (
    input.product.unitAmountCents === null ||
    input.product.unitAmountCents <= 0
  ) {
    throw new Error("A paid, fixed-price product is required.");
  }
  const unitAmountCents = input.product.unitAmountCents;
  if (!input.product.targetTypes.includes(input.targetType)) {
    throw new Error("The product does not support this target.");
  }
  if (
    !Number.isSafeInteger(input.maxOpenOrders) ||
    input.maxOpenOrders < 1 ||
    input.maxOpenOrders > 100
  ) {
    throw new Error("A valid paid-report order capacity is required.");
  }

  const orderId = randomUUID();
  const accessToken = newAccessToken();
  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + ORDER_RECOVERY_DAYS * 24 * 60 * 60 * 1000,
  );
  const created = await db.transaction(async (tx) => {
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtext(${input.product.code}))`,
    );
    const [capacity] = await tx
      .select({ openOrders: count() })
      .from(furlongPublicOrders)
      .where(
        and(
          eq(furlongPublicOrders.productCode, input.product.code),
          inArray(furlongPublicOrders.status, PUBLIC_ORDER_CAPACITY_STATUSES),
        ),
      );
    if ((capacity?.openOrders ?? 0) >= input.maxOpenOrders) {
      throw new PublicOrderConflictError(
        "This report is temporarily at capacity. No payment was taken.",
      );
    }

    let creditSourceOrderId: string | null = null;
    let creditAmountCents = 0;
    if (input.upgradeSource) {
      const offer = input.product.upgradeCredit;
      if (!offer) {
        throw new PublicOrderConflictError(
          "This product does not accept a prior-report credit.",
        );
      }
      const sourceOrderId = requiredText(
        input.upgradeSource.orderId,
        "upgrade source orderId",
      );
      const sourceAccessHash = hashToken(
        requiredText(
          input.upgradeSource.accessToken,
          "upgrade source accessToken",
        ),
      );
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtext(${sourceOrderId}))`,
      );
      const [sourceOrder] = await tx
        .select()
        .from(furlongPublicOrders)
        .where(
          and(
            eq(furlongPublicOrders.id, sourceOrderId),
            eq(furlongPublicOrders.accessTokenHash, sourceAccessHash),
          ),
        )
        .limit(1);
      const [priorUse] = await tx
        .select({ id: furlongPublicOrders.id })
        .from(furlongPublicOrders)
        .where(eq(furlongPublicOrders.creditSourceOrderId, sourceOrderId))
        .limit(1);
      const cutoff = new Date(
        now.getTime() - offer.validDays * 24 * 60 * 60 * 1000,
      );
      if (
        !sourceOrder ||
        priorUse ||
        sourceOrder.productCode !== offer.sourceProductCode ||
        sourceOrder.targetType !== input.targetType ||
        sourceOrder.targetRef !== input.targetRef ||
        sourceOrder.status !== "FULFILLED" ||
        !sourceOrder.paidAt ||
        sourceOrder.paidAt < cutoff ||
        sourceOrder.amountPaidCents !== sourceOrder.amountTotalCents ||
        sourceOrder.amountRefundedCents !== 0
      ) {
        throw new PublicOrderConflictError(
          "The prior Property Report is not eligible for this upgrade credit.",
        );
      }
      creditSourceOrderId = sourceOrder.id;
      creditAmountCents = Math.min(
        offer.amountCents,
        sourceOrder.amountPaidCents,
        unitAmountCents,
      );
    }

    return tx
      .insert(furlongPublicOrders)
      .values({
        id: orderId,
        checkoutRequestId: requiredText(
          input.checkoutRequestId,
          "checkoutRequestId",
        ),
        buyerActorId: input.buyerActorId?.trim() || null,
        accessTokenHash: hashToken(accessToken),
        productCode: input.product.code,
        productCatalogVersion: PUBLIC_PRODUCT_CATALOG_VERSION,
        targetType: input.targetType,
        targetRef: requiredText(input.targetRef, "targetRef"),
        targetSnapshot: input.targetSnapshot,
        fulfillmentMode: input.product.fulfillmentMode,
        status: "CREATED",
        unitAmountCents,
        amountTotalCents: unitAmountCents - creditAmountCents,
        amountPaidCents: 0,
        amountRefundedCents: 0,
        currency: input.product.currency,
        quantity: 1,
        reportCredits: input.product.reportCredits,
        creditSourceOrderId,
        creditAmountCents,
        provider: "stripe",
        governanceVersion: PUBLIC_ORDER_GOVERNANCE_VERSION,
        classification: "CONFIDENTIAL",
        replayRef: input.traceId,
        traceId: input.traceId,
        source: PUBLIC_ORDER_SOURCE,
        metadata: {
          priceSource: "server-catalog",
          browserPriceAccepted: false,
          productReleaseState: input.product.releaseState,
          pricingBasis: input.product.pricingBasis,
          priceReviewId: requiredText(input.priceReviewId, "priceReviewId"),
          pricingReviewVerifiedAt: now.toISOString(),
          paidReportCapacityLimit: input.maxOpenOrders,
          upgradeCredit: creditSourceOrderId
            ? {
                sourceOrderId: creditSourceOrderId,
                amountCents: creditAmountCents,
                validDays: input.product.upgradeCredit?.validDays ?? null,
                samePropertyVerified: true,
                singleUseReserved: true,
              }
            : null,
        },
        expiresAt,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoNothing({
        target: furlongPublicOrders.checkoutRequestId,
      })
      .returning();
  });

  if (!created[0]) {
    throw new PublicOrderConflictError(
      "This checkout request has already created an order.",
    );
  }

  return { order: created[0], accessToken };
}

export async function recordPublicOrderAgreementAcceptance(input: {
  orderId: string;
  productName: string;
  productDescription: string;
  includedScope: readonly string[];
  excludedScope: readonly string[];
  acceptedAt: Date;
  networkAddress: string | null;
  userAgent: string | null;
  traceId: string;
}) {
  if (!Number.isFinite(input.acceptedAt.getTime())) {
    throw new Error("A valid agreement acceptance time is required.");
  }
  const productName = requiredText(input.productName, "productName");
  const productDescription = requiredText(
    input.productDescription,
    "productDescription",
  );
  const networkAddress = input.networkAddress?.trim().slice(0, 256) || null;
  const userAgent = input.userAgent?.trim().slice(0, 1_000) || null;

  return db.transaction(async (tx) => {
    const [order] = await tx
      .select()
      .from(furlongPublicOrders)
      .where(eq(furlongPublicOrders.id, input.orderId))
      .limit(1);
    if (!order) throw new Error("Public order not found.");
    if (order.status !== "CREATED") {
      throw new PublicOrderConflictError(
        "The order agreement must be recorded before checkout is created.",
      );
    }

    const confirmation = {
      productCode: order.productCode,
      productName,
      reportScope: productDescription,
      includedScope: input.includedScope
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 30),
      excludedScope: input.excludedScope
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 30),
      productCatalogVersion: order.productCatalogVersion,
      targetType: order.targetType,
      targetRef: order.targetRef,
      targetSnapshot: order.targetSnapshot,
      totalPriceCents: order.amountTotalCents,
      currency: order.currency,
      quantity: order.quantity,
      immediateProcessingAuthorized: true,
    };
    const agreementRecord = {
      agreementId: PUBLIC_ORDER_AGREEMENT_ID,
      agreementVersion: PUBLIC_ORDER_AGREEMENT_VERSION,
      agreementTitle: PUBLIC_ORDER_AGREEMENT_TITLE,
      agreementTerms: PUBLIC_ORDER_AGREEMENT_TERMS,
      acceptanceText: PUBLIC_ORDER_AGREEMENT_ACCEPTANCE,
      exactText: PUBLIC_ORDER_AGREEMENT_TEXT,
      exactTextSha256: PUBLIC_ORDER_AGREEMENT_DIGEST,
      accepted: true,
      acceptedAt: input.acceptedAt.toISOString(),
      grantMethod: "EXPLICIT_UNCHECKED_REQUIRED_CHECKBOX",
      disclosurePlacement: "IMMEDIATELY_BEFORE_PAYMENT_ACTION",
      scope: {
        authorizedOperations: [
          "CREATE_PAYMENT_SESSION",
          "BEGIN_PROPERTY_SPECIFIC_ANALYSIS_AFTER_PAYMENT",
        ],
        resourceType: order.targetType,
        resourceRef: order.targetRef,
        revocableUntil: "FULFILLMENT_PROCESSING_BEGINS",
      },
      confirmation,
      requestEvidence: {
        networkAddress,
        userAgent,
      },
    };
    const payloadDigest = createHash("sha256")
      .update(JSON.stringify(agreementRecord), "utf8")
      .digest("hex");
    const providerEventId = [
      PUBLIC_ORDER_AGREEMENT_ID,
      PUBLIC_ORDER_AGREEMENT_VERSION,
      order.id,
    ].join(":");
    const events = await tx
      .insert(furlongPublicOrderEvents)
      .values({
        orderId: order.id,
        provider: "furlong-checkout",
        providerEventId,
        eventType: "public_order.agreement_accepted",
        eventStatus: "ACCEPTED",
        payloadDigest,
        amountCents: order.amountTotalCents,
        currency: order.currency,
        paymentStatus: null,
        governanceVersion: PUBLIC_ORDER_GOVERNANCE_VERSION,
        classification: "RESTRICTED",
        replayRef: input.traceId,
        traceId: input.traceId,
        source: "public-checkout-required-consent",
        metadata: agreementRecord,
        occurredAt: input.acceptedAt,
      })
      .returning();
    const acceptedEvent = events[0];
    if (!acceptedEvent) {
      throw new PublicOrderConflictError(
        "The order agreement could not be recorded.",
      );
    }

    const priorMetadata =
      order.metadata && typeof order.metadata === "object"
        ? (order.metadata as Record<string, unknown>)
        : {};
    const [updatedOrder] = await tx
      .update(furlongPublicOrders)
      .set({
        metadata: {
          ...priorMetadata,
          checkoutAgreement: {
            eventId: acceptedEvent.id,
            agreementId: PUBLIC_ORDER_AGREEMENT_ID,
            agreementVersion: PUBLIC_ORDER_AGREEMENT_VERSION,
            exactTextSha256: PUBLIC_ORDER_AGREEMENT_DIGEST,
            acceptedAt: input.acceptedAt.toISOString(),
            immediateProcessingAuthorized: true,
          },
        },
        replayRef: input.traceId,
        traceId: input.traceId,
        updatedAt: input.acceptedAt,
      })
      .where(
        and(
          eq(furlongPublicOrders.id, order.id),
          eq(furlongPublicOrders.status, "CREATED"),
        ),
      )
      .returning();

    if (!updatedOrder) {
      throw new PublicOrderConflictError(
        "The order agreement could not be bound to checkout.",
      );
    }
    return {
      order: updatedOrder,
      event: acceptedEvent,
      agreementVersion: PUBLIC_ORDER_AGREEMENT_VERSION,
      agreementDigest: PUBLIC_ORDER_AGREEMENT_DIGEST,
      acceptedAt: input.acceptedAt,
    };
  });
}

export async function attachPublicOrderCheckout(input: {
  orderId: string;
  checkoutSessionId: string;
  traceId: string;
}) {
  const now = new Date();
  const updated = await db
    .update(furlongPublicOrders)
    .set({
      checkoutSessionId: requiredText(
        input.checkoutSessionId,
        "checkoutSessionId",
      ),
      status: "CHECKOUT_CREATED",
      checkoutCreatedAt: now,
      traceId: input.traceId,
      replayRef: input.traceId,
      updatedAt: now,
    })
    .where(
      and(
        eq(furlongPublicOrders.id, input.orderId),
        eq(furlongPublicOrders.status, "CREATED"),
      ),
    )
    .returning();

  if (!updated[0]) {
    throw new PublicOrderConflictError(
      "The order is not available for checkout attachment.",
    );
  }
  return updated[0];
}

export async function markPublicOrderCheckoutFailed(input: {
  orderId: string;
  traceId: string;
  reason: string;
}) {
  const [current] = await db
    .select({
      metadata: furlongPublicOrders.metadata,
      unitAmountCents: furlongPublicOrders.unitAmountCents,
      creditSourceOrderId: furlongPublicOrders.creditSourceOrderId,
      creditAmountCents: furlongPublicOrders.creditAmountCents,
    })
    .from(furlongPublicOrders)
    .where(eq(furlongPublicOrders.id, input.orderId))
    .limit(1);
  const priorMetadata =
    current?.metadata && typeof current.metadata === "object"
      ? (current.metadata as Record<string, unknown>)
      : {};
  const now = new Date();
  const releasesCredit = Boolean(current?.creditSourceOrderId);

  const [updated] = await db
    .update(furlongPublicOrders)
    .set({
      status: "FAILED",
      ...(releasesCredit && current
        ? {
            creditSourceOrderId: null,
            creditAmountCents: 0,
            amountTotalCents: current.unitAmountCents,
          }
        : {}),
      traceId: input.traceId,
      replayRef: input.traceId,
      metadata: {
        ...priorMetadata,
        checkoutFailure: input.reason.slice(0, 240),
        ...(releasesCredit && current
          ? {
              upgradeCreditRelease: {
                sourceOrderId: current.creditSourceOrderId,
                amountCents: current.creditAmountCents,
                reason: "CHECKOUT_CREATION_FAILED",
                releasedAt: now.toISOString(),
              },
            }
          : {}),
      },
      updatedAt: now,
    })
    .where(
      and(
        eq(furlongPublicOrders.id, input.orderId),
        inArray(furlongPublicOrders.status, ["CREATED", "CHECKOUT_CREATED"]),
        eq(furlongPublicOrders.amountPaidCents, 0),
      ),
    )
    .returning();
  return updated ?? null;
}

export async function loadPublicOrder(input: {
  orderId: string;
  buyerActorId: string | null;
  accessToken: string | null;
}) {
  const accessHash = input.accessToken?.trim()
    ? hashToken(input.accessToken.trim())
    : null;
  const authority = [
    input.buyerActorId
      ? eq(furlongPublicOrders.buyerActorId, input.buyerActorId)
      : undefined,
    accessHash
      ? eq(furlongPublicOrders.accessTokenHash, accessHash)
      : undefined,
  ].filter((item): item is NonNullable<typeof item> => Boolean(item));
  if (!authority.length) return null;

  const [order] = await db
    .select()
    .from(furlongPublicOrders)
    .where(
      and(
        eq(furlongPublicOrders.id, input.orderId),
        gt(furlongPublicOrders.expiresAt, new Date()),
        authority.length === 2 ? or(authority[0], authority[1]) : authority[0],
      ),
    )
    .limit(1);
  if (!order) return null;

  const grants = await db
    .select()
    .from(furlongPublicAccessGrants)
    .where(eq(furlongPublicAccessGrants.orderId, order.id));
  const [agreementEvent] = await db
    .select()
    .from(furlongPublicOrderEvents)
    .where(
      and(
        eq(furlongPublicOrderEvents.orderId, order.id),
        eq(
          furlongPublicOrderEvents.eventType,
          "public_order.agreement_accepted",
        ),
      ),
    )
    .orderBy(desc(furlongPublicOrderEvents.occurredAt))
    .limit(1);
  return { order, grants, agreementEvent: agreementEvent ?? null };
}

export async function publicOrderUpgradeOffer(
  order: typeof furlongPublicOrders.$inferSelect,
) {
  const target = PUBLIC_PRODUCTS.custom_property_analysis;
  const offer = target.upgradeCredit;
  if (!offer || order.productCode !== offer.sourceProductCode) {
    return null;
  }
  const [priorUse] = await db
    .select({ id: furlongPublicOrders.id })
    .from(furlongPublicOrders)
    .where(eq(furlongPublicOrders.creditSourceOrderId, order.id))
    .limit(1);
  const expiresAt = order.paidAt
    ? new Date(order.paidAt.getTime() + offer.validDays * 24 * 60 * 60 * 1000)
    : null;
  const reasons: string[] = [];
  if (order.status !== "FULFILLED") {
    reasons.push("SOURCE_REPORT_NOT_FULFILLED");
  }
  if (
    order.amountPaidCents !== order.amountTotalCents ||
    order.amountRefundedCents !== 0
  ) {
    reasons.push("SOURCE_PAYMENT_NOT_ELIGIBLE");
  }
  if (!expiresAt || expiresAt <= new Date()) {
    reasons.push("UPGRADE_WINDOW_EXPIRED");
  }
  if (priorUse) reasons.push("UPGRADE_CREDIT_ALREADY_USED");
  const amountCents = Math.min(
    offer.amountCents,
    order.amountPaidCents,
    target.unitAmountCents ?? 0,
  );
  return {
    eligible: reasons.length === 0 && amountCents > 0,
    reasons,
    sourceOrderId: order.id,
    targetProductCode: target.code,
    targetProductName: target.publicName,
    creditAmountCents: amountCents,
    targetListPriceCents: target.unitAmountCents,
    payableAmountCents:
      target.unitAmountCents === null
        ? null
        : target.unitAmountCents - amountCents,
    expiresAt,
    samePropertyRequired: true,
    singleUse: true,
  };
}

export async function findPublicOrderForProviderEvent(input: {
  orderId: string | null;
  checkoutSessionId: string | null;
  paymentIntentId: string | null;
}) {
  if (input.orderId) {
    const [order] = await db
      .select()
      .from(furlongPublicOrders)
      .where(eq(furlongPublicOrders.id, input.orderId))
      .limit(1);
    return order ?? null;
  }
  if (input.paymentIntentId) {
    const [order] = await db
      .select()
      .from(furlongPublicOrders)
      .where(eq(furlongPublicOrders.paymentIntentId, input.paymentIntentId))
      .limit(1);
    if (order) return order;
  }
  if (input.checkoutSessionId) {
    const [order] = await db
      .select()
      .from(furlongPublicOrders)
      .where(eq(furlongPublicOrders.checkoutSessionId, input.checkoutSessionId))
      .limit(1);
    return order ?? null;
  }
  return null;
}

function orderStatusForAction(
  action: ReturnType<typeof evaluatePublicOrderPaymentEvent>["action"],
  currentStatus: string,
): string | null {
  if (action === "MARK_PENDING") return "PAYMENT_PENDING";
  if (action === "CONFIRM_PAID") return "FULFILLMENT_PENDING";
  if (action === "MARK_FAILED") return "FAILED";
  if (action === "CANCEL") return "CANCELED";
  if (action === "REVOKE_REFUND") return "REFUNDED";
  if (action === "HOLD_REFUND_FAILED") return "HELD";
  if (action === "REVOKE_DISPUTE") return "DISPUTED";
  if (action === "CLOSE_DISPUTE_WON") return "DISPUTE_WON";
  if (action === "CLOSE_DISPUTE_LOST") return "DISPUTE_LOST";
  if (
    action === "REJECT_HOLD" &&
    [
      "REFUND_PENDING",
      "REFUNDED",
      "DISPUTED",
      "DISPUTE_WON",
      "DISPUTE_LOST",
    ].includes(currentStatus)
  ) {
    return currentStatus;
  }
  if (action === "REJECT_HOLD") return "HELD";
  return null;
}

function paymentSnapshot(order: typeof furlongPublicOrders.$inferSelect) {
  if (!isPublicProductCode(order.productCode)) {
    throw new Error("Stored public order has an unknown product code.");
  }
  return {
    id: order.id,
    productCode: order.productCode,
    productCatalogVersion: order.productCatalogVersion,
    status: order.status,
    amountTotalCents: order.amountTotalCents,
    currency: order.currency,
    checkoutSessionId: order.checkoutSessionId,
    paymentIntentId: order.paymentIntentId,
  };
}

export async function applyPublicOrderProviderEvent(input: {
  event: PublicOrderStripeEventInput;
  payloadDigest: string;
  occurredAt: Date;
  traceId: string;
}) {
  if (!/^[a-f0-9]{64}$/.test(input.payloadDigest)) {
    throw new Error("A SHA-256 provider payload digest is required.");
  }

  return db.transaction(async (tx) => {
    let order: typeof furlongPublicOrders.$inferSelect | undefined;
    if (input.event.orderId) {
      [order] = await tx
        .select()
        .from(furlongPublicOrders)
        .where(eq(furlongPublicOrders.id, input.event.orderId))
        .limit(1);
    } else if (input.event.paymentIntentId) {
      [order] = await tx
        .select()
        .from(furlongPublicOrders)
        .where(
          eq(furlongPublicOrders.paymentIntentId, input.event.paymentIntentId),
        )
        .limit(1);
    } else if (input.event.checkoutSessionId) {
      [order] = await tx
        .select()
        .from(furlongPublicOrders)
        .where(
          eq(
            furlongPublicOrders.checkoutSessionId,
            input.event.checkoutSessionId,
          ),
        )
        .limit(1);
    }
    if (!order) return { handled: false as const };

    const decision = evaluatePublicOrderPaymentEvent(
      paymentSnapshot(order),
      input.event,
    );
    const insertedEvent = await tx
      .insert(furlongPublicOrderEvents)
      .values({
        orderId: order.id,
        provider: "stripe",
        providerEventId: requiredText(
          input.event.providerEventId,
          "providerEventId",
        ),
        eventType: input.event.eventType,
        eventStatus: decision.eventStatus,
        payloadDigest: input.payloadDigest,
        amountCents:
          input.event.amountCents ?? input.event.amountRefundedCents ?? null,
        currency: input.event.currency?.toLowerCase() ?? null,
        paymentStatus: input.event.paymentStatus,
        governanceVersion: PUBLIC_ORDER_GOVERNANCE_VERSION,
        classification: "RESTRICTED",
        replayRef: input.traceId,
        traceId: input.traceId,
        source: "stripe-signed-webhook",
        metadata: {
          action: decision.action,
          reasons: decision.reasons,
          signatureVerified: input.event.signatureVerified,
          providerEvidence: input.event.providerEvidence ?? null,
        },
        occurredAt: input.occurredAt,
      })
      .onConflictDoNothing({
        target: [
          furlongPublicOrderEvents.provider,
          furlongPublicOrderEvents.providerEventId,
        ],
      })
      .returning({ id: furlongPublicOrderEvents.id });

    if (!insertedEvent[0]) {
      return {
        handled: true as const,
        duplicate: true,
        order,
        decision,
      };
    }

    const now = new Date();
    const nextStatus = orderStatusForAction(decision.action, order.status);
    const releasesUnusedUpgradeCredit = Boolean(
      order.creditSourceOrderId &&
      order.amountPaidCents === 0 &&
      ["MARK_FAILED", "CANCEL"].includes(decision.action),
    );
    const update: Partial<typeof furlongPublicOrders.$inferInsert> = {
      traceId: input.traceId,
      replayRef: input.traceId,
      updatedAt: now,
    };
    if (nextStatus) update.status = nextStatus;
    if (releasesUnusedUpgradeCredit) {
      update.creditSourceOrderId = null;
      update.creditAmountCents = 0;
      update.amountTotalCents = order.unitAmountCents;
      update.metadata = {
        ...safeMetadata(order.metadata as Record<string, unknown> | undefined),
        upgradeCreditRelease: {
          sourceOrderId: order.creditSourceOrderId,
          amountCents: order.creditAmountCents,
          reason:
            decision.action === "CANCEL"
              ? "CHECKOUT_EXPIRED"
              : "PAYMENT_FAILED",
          releasedAt: now.toISOString(),
          providerEventId: input.event.providerEventId,
        },
      };
    }
    if (input.event.paymentIntentId && !order.paymentIntentId) {
      update.paymentIntentId = input.event.paymentIntentId;
    }
    if (decision.action === "CONFIRM_PAID") {
      update.amountPaidCents = order.amountTotalCents;
      update.paidAt = order.paidAt ?? now;
    }
    if (decision.action === "CANCEL") update.canceledAt = now;
    if (decision.action === "REVOKE_REFUND") {
      const refundedCents = Math.min(
        Math.max(input.event.amountRefundedCents ?? 0, 0),
        order.amountTotalCents,
      );
      update.amountRefundedCents = refundedCents;
      update.refundedAt = now;
      if (
        order.creditSourceOrderId &&
        refundedCents === order.amountTotalCents
      ) {
        update.creditSourceOrderId = null;
        update.metadata = {
          ...safeMetadata(
            order.metadata as Record<string, unknown> | undefined,
          ),
          upgradeCreditRelease: {
            sourceOrderId: order.creditSourceOrderId,
            amountCents: order.creditAmountCents,
            reason: "TARGET_ORDER_FULLY_REFUNDED",
            releasedAt: now.toISOString(),
            providerEventId: input.event.providerEventId,
            historicalCreditRetainedOnRefundedOrder: true,
          },
        };
      }
    }
    if (decision.action === "REVOKE_DISPUTE") {
      update.disputedAt = now;
    }
    if (
      decision.action === "CLOSE_DISPUTE_WON" ||
      decision.action === "CLOSE_DISPUTE_LOST"
    ) {
      const priorMetadata = safeMetadata(
        order.metadata as Record<string, unknown> | undefined,
      );
      update.metadata = {
        ...priorMetadata,
        dispute: {
          outcome: decision.action === "CLOSE_DISPUTE_WON" ? "WON" : "LOST",
          providerEventId: input.event.providerEventId,
          closedAt: now.toISOString(),
          accessRemainsRevoked: true,
        },
      };
    }

    if (decision.revokeAccess) {
      const priorMetadata = safeMetadata(
        (update.metadata ?? order.metadata) as
          Record<string, unknown> | undefined,
      );
      const reportArtifact = readPublicOrderReportArtifact(priorMetadata);
      if (reportArtifact) {
        update.metadata = {
          ...priorMetadata,
          reportArtifact: {
            ...reportArtifact,
            status: "REVOKED",
            revokedAt: now.toISOString(),
            revocationReason: decision.reasons.join(","),
          },
        };
      }
    }

    const [updatedOrder] = await tx
      .update(furlongPublicOrders)
      .set(update)
      .where(eq(furlongPublicOrders.id, order.id))
      .returning();

    if (
      decision.action === "REVOKE_REFUND" ||
      decision.action === "REVOKE_DISPUTE"
    ) {
      const [dependentOrder] = await tx
        .select()
        .from(furlongPublicOrders)
        .where(eq(furlongPublicOrders.creditSourceOrderId, order.id))
        .limit(1);
      const dependentTerminal = dependentOrder
        ? [
            "REFUND_PENDING",
            "CANCELED",
            "FAILED",
            "REFUNDED",
            "DISPUTED",
            "DISPUTE_WON",
            "DISPUTE_LOST",
          ].includes(dependentOrder.status)
        : true;
      if (dependentOrder && !dependentTerminal) {
        const reason =
          decision.action === "REVOKE_REFUND"
            ? "UPGRADE_CREDIT_SOURCE_REFUNDED"
            : "UPGRADE_CREDIT_SOURCE_DISPUTED";
        const invalidationPayload = {
          dependentOrderId: dependentOrder.id,
          sourceOrderId: order.id,
          sourceProviderEventId: input.event.providerEventId,
          reason,
        };
        const [invalidationEvent] = await tx
          .insert(furlongPublicOrderEvents)
          .values({
            orderId: dependentOrder.id,
            provider: "furlong-upgrade-credit",
            providerEventId:
              "upgrade-credit-source:" + input.event.providerEventId,
            eventType: "public_order.upgrade_credit_source_invalidated",
            eventStatus: "HELD",
            payloadDigest: createHash("sha256")
              .update(JSON.stringify(invalidationPayload))
              .digest("hex"),
            amountCents: dependentOrder.creditAmountCents,
            currency: dependentOrder.currency,
            paymentStatus: null,
            governanceVersion: PUBLIC_ORDER_GOVERNANCE_VERSION,
            classification: "RESTRICTED",
            replayRef: input.traceId,
            traceId: input.traceId,
            source: "furlong-upgrade-credit-reconciliation",
            metadata: invalidationPayload,
            occurredAt: now,
          })
          .onConflictDoNothing({
            target: [
              furlongPublicOrderEvents.provider,
              furlongPublicOrderEvents.providerEventId,
            ],
          })
          .returning({ id: furlongPublicOrderEvents.id });
        const dependentMetadata = safeMetadata(
          dependentOrder.metadata as Record<string, unknown> | undefined,
        );
        await tx
          .update(furlongPublicOrders)
          .set({
            status: "HELD",
            traceId: input.traceId,
            replayRef: input.traceId,
            metadata: {
              ...dependentMetadata,
              upgradeCreditInvalidation: {
                ...invalidationPayload,
                eventId: invalidationEvent?.id ?? null,
                heldAt: now.toISOString(),
              },
            },
            updatedAt: now,
          })
          .where(eq(furlongPublicOrders.id, dependentOrder.id));
        await tx
          .update(furlongPublicAccessGrants)
          .set({
            active: false,
            unitsRemaining: 0,
            revokedAt: now,
            revocationReason: reason,
            traceId: input.traceId,
            replayRef: input.traceId,
            updatedAt: now,
          })
          .where(eq(furlongPublicAccessGrants.orderId, dependentOrder.id));
      }
    }

    let grant: typeof furlongPublicAccessGrants.$inferSelect | null = null;
    if (decision.grantAccess) {
      const units = Math.max(order.reportCredits, 1);
      const rows = await tx
        .insert(furlongPublicAccessGrants)
        .values({
          orderId: order.id,
          buyerActorId: order.buyerActorId,
          accessType: "PAID_ANALYSIS_FULFILLMENT",
          resourceType: order.targetType,
          resourceRef: order.targetRef,
          active: true,
          unitsGranted: units,
          unitsRemaining: units,
          governanceVersion: PUBLIC_ORDER_GOVERNANCE_VERSION,
          classification: "CONFIDENTIAL",
          replayRef: input.traceId,
          traceId: input.traceId,
          source: "verified-stripe-payment",
          metadata: {
            productCode: order.productCode,
            providerEventId: input.event.providerEventId,
            reportCompleted: false,
          },
          startsAt: now,
          expiresAt: order.expiresAt,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: [
            furlongPublicAccessGrants.orderId,
            furlongPublicAccessGrants.accessType,
            furlongPublicAccessGrants.resourceType,
            furlongPublicAccessGrants.resourceRef,
          ],
          set: {
            active: true,
            unitsRemaining: units,
            revokedAt: null,
            revocationReason: null,
            traceId: input.traceId,
            replayRef: input.traceId,
            updatedAt: now,
          },
        })
        .returning();
      grant = rows[0] ?? null;
    }

    if (decision.revokeAccess) {
      const rows = await tx
        .update(furlongPublicAccessGrants)
        .set({
          active: false,
          unitsRemaining: 0,
          revokedAt: now,
          revocationReason: decision.reasons.join(","),
          traceId: input.traceId,
          replayRef: input.traceId,
          updatedAt: now,
        })
        .where(eq(furlongPublicAccessGrants.orderId, order.id))
        .returning();
      grant = rows[0] ?? null;
    }

    return {
      handled: true as const,
      duplicate: false,
      order: updatedOrder,
      grant,
      decision,
    };
  });
}

export async function reservePublicOrderFullRefund(input: {
  orderId: string;
  traceId: string;
}) {
  const idempotencyKey = "public-order:full-refund:" + input.orderId;

  return db.transaction(async (tx) => {
    const [order] = await tx
      .select()
      .from(furlongPublicOrders)
      .where(eq(furlongPublicOrders.id, input.orderId))
      .limit(1);
    if (!order) throw new Error("Public order not found.");

    const orderMetadata = safeMetadata(
      order.metadata as Record<string, unknown> | undefined,
    );
    const refundMetadata = safeMetadata(
      orderMetadata.customerRefund as Record<string, unknown> | undefined,
    );
    const eligibility = evaluatePublicOrderFullRefund({
      status: order.status,
      amountTotalCents: order.amountTotalCents,
      amountPaidCents: order.amountPaidCents,
      amountRefundedCents: order.amountRefundedCents,
      paymentIntentId: order.paymentIntentId,
      fulfillmentStartedAt: order.fulfillmentStartedAt,
      providerRefundId:
        typeof refundMetadata.providerRefundId === "string"
          ? refundMetadata.providerRefundId
          : null,
    });

    if (eligibility.outcome === "ALREADY_REFUNDED") {
      return {
        state: "ALREADY_REFUNDED" as const,
        order,
        idempotencyKey,
      };
    }
    if (eligibility.outcome === "ALREADY_PENDING") {
      return {
        state: "ALREADY_PENDING" as const,
        order,
        idempotencyKey,
      };
    }
    if (eligibility.outcome === "RETRY_PROVIDER_SUBMISSION") {
      return {
        state: "RESERVED" as const,
        order,
        idempotencyKey,
      };
    }
    if (!eligibility.allowed) {
      throw new PublicOrderConflictError(
        "A full refund is automatic only after payment and before processing begins.",
      );
    }

    const now = new Date();
    const reason = "CUSTOMER_CANCELLATION_BEFORE_PROCESSING";
    const eventIdentity = "public-order-refund-request:" + order.id;
    const payloadDigest = createHash("sha256")
      .update(
        JSON.stringify({
          orderId: order.id,
          amountCents: order.amountTotalCents,
          currency: order.currency,
          reason,
        }),
      )
      .digest("hex");
    const events = await tx
      .insert(furlongPublicOrderEvents)
      .values({
        orderId: order.id,
        provider: "furlong-customer",
        providerEventId: eventIdentity,
        eventType: "public_order.full_refund_requested",
        eventStatus: "REFUND_PENDING",
        payloadDigest,
        amountCents: order.amountTotalCents,
        currency: order.currency,
        paymentStatus: "paid",
        governanceVersion: PUBLIC_ORDER_GOVERNANCE_VERSION,
        classification: "RESTRICTED",
        replayRef: input.traceId,
        traceId: input.traceId,
        source: "customer-self-service-cancellation",
        metadata: {
          reason,
          fullRefund: true,
          fulfillmentStarted: false,
        },
        occurredAt: now,
      })
      .onConflictDoNothing({
        target: [
          furlongPublicOrderEvents.provider,
          furlongPublicOrderEvents.providerEventId,
        ],
      })
      .returning({ id: furlongPublicOrderEvents.id });

    const priorMetadata = orderMetadata;
    const [updated] = await tx
      .update(furlongPublicOrders)
      .set({
        status: "REFUND_PENDING",
        traceId: input.traceId,
        replayRef: input.traceId,
        metadata: {
          ...priorMetadata,
          customerRefund: {
            reason,
            requestedAt: now.toISOString(),
            fullRefund: true,
            eventId: events[0]?.id ?? null,
          },
        },
        updatedAt: now,
      })
      .where(
        and(
          eq(furlongPublicOrders.id, order.id),
          eq(furlongPublicOrders.status, "FULFILLMENT_PENDING"),
          isNull(furlongPublicOrders.fulfillmentStartedAt),
        ),
      )
      .returning();

    if (!updated) {
      throw new PublicOrderConflictError(
        "The order changed before the refund could be reserved.",
      );
    }
    return {
      state: "RESERVED" as const,
      order: updated,
      idempotencyKey,
    };
  });
}

export async function recordPublicOrderRefundSubmission(input: {
  orderId: string;
  providerRefundId: string;
  providerStatus: string;
  paymentIntentId: string;
  amountCents: number;
  currency: string;
  traceId: string;
}) {
  const providerRefundId = requiredText(
    input.providerRefundId,
    "providerRefundId",
  );
  const providerStatus = requiredText(input.providerStatus, "providerStatus");

  return db.transaction(async (tx) => {
    const [order] = await tx
      .select()
      .from(furlongPublicOrders)
      .where(eq(furlongPublicOrders.id, input.orderId))
      .limit(1);
    if (!order) throw new Error("Public order not found.");
    if (
      !["REFUND_PENDING", "REFUNDED"].includes(order.status) ||
      order.paymentIntentId !== input.paymentIntentId ||
      order.amountTotalCents !== input.amountCents ||
      order.currency !== input.currency.toLowerCase()
    ) {
      throw new PublicOrderConflictError(
        "The provider refund does not match the reserved order.",
      );
    }

    const now = new Date();
    const evidence = {
      orderId: order.id,
      providerRefundId,
      providerStatus,
      paymentIntentId: input.paymentIntentId,
      amountCents: input.amountCents,
      currency: input.currency.toLowerCase(),
    };
    const payloadDigest = createHash("sha256")
      .update(JSON.stringify(evidence))
      .digest("hex");
    const events = await tx
      .insert(furlongPublicOrderEvents)
      .values({
        orderId: order.id,
        provider: "stripe-api",
        providerEventId: providerRefundId,
        eventType: "public_order.refund_submitted",
        eventStatus: "REFUND_PENDING",
        payloadDigest,
        amountCents: input.amountCents,
        currency: input.currency.toLowerCase(),
        paymentStatus: providerStatus,
        governanceVersion: PUBLIC_ORDER_GOVERNANCE_VERSION,
        classification: "RESTRICTED",
        replayRef: input.traceId,
        traceId: input.traceId,
        source: "server-initiated-stripe-refund",
        metadata: evidence,
        occurredAt: now,
      })
      .onConflictDoNothing({
        target: [
          furlongPublicOrderEvents.provider,
          furlongPublicOrderEvents.providerEventId,
        ],
      })
      .returning({ id: furlongPublicOrderEvents.id });

    const priorMetadata = safeMetadata(
      order.metadata as Record<string, unknown> | undefined,
    );
    const priorRefund = safeMetadata(
      priorMetadata.customerRefund as Record<string, unknown> | undefined,
    );
    const [updated] = await tx
      .update(furlongPublicOrders)
      .set({
        traceId: input.traceId,
        replayRef: input.traceId,
        metadata: {
          ...priorMetadata,
          customerRefund: {
            ...priorRefund,
            providerRefundId,
            providerStatus,
            submittedAt: now.toISOString(),
            submissionEventId: events[0]?.id ?? null,
          },
        },
        updatedAt: now,
      })
      .where(eq(furlongPublicOrders.id, order.id))
      .returning();

    return {
      order: updated ?? order,
      duplicate: !events[0],
      eventId: events[0]?.id ?? null,
    };
  });
}

export async function recordPublicOrderRefundAttemptFailure(input: {
  orderId: string;
  reason: string;
  traceId: string;
}) {
  const reason = requiredText(input.reason, "reason").slice(0, 240);

  return db.transaction(async (tx) => {
    const [order] = await tx
      .select()
      .from(furlongPublicOrders)
      .where(eq(furlongPublicOrders.id, input.orderId))
      .limit(1);
    if (!order) throw new Error("Public order not found.");
    if (order.status !== "REFUND_PENDING") return order;

    const now = new Date();
    const evidence = {
      orderId: order.id,
      reason,
      statusPreserved: "REFUND_PENDING",
    };
    const [event] = await tx
      .insert(furlongPublicOrderEvents)
      .values({
        orderId: order.id,
        provider: "stripe-api",
        providerEventId: "public-order-refund-attempt-failed:" + input.traceId,
        eventType: "public_order.refund_submission_failed",
        eventStatus: "FAILED",
        payloadDigest: createHash("sha256")
          .update(JSON.stringify(evidence))
          .digest("hex"),
        amountCents: order.amountTotalCents,
        currency: order.currency,
        paymentStatus: "failed",
        governanceVersion: PUBLIC_ORDER_GOVERNANCE_VERSION,
        classification: "RESTRICTED",
        replayRef: input.traceId,
        traceId: input.traceId,
        source: "server-initiated-stripe-refund",
        metadata: evidence,
        occurredAt: now,
      })
      .onConflictDoNothing({
        target: [
          furlongPublicOrderEvents.provider,
          furlongPublicOrderEvents.providerEventId,
        ],
      })
      .returning({ id: furlongPublicOrderEvents.id });

    const priorMetadata = safeMetadata(
      order.metadata as Record<string, unknown> | undefined,
    );
    const priorRefund = safeMetadata(
      priorMetadata.customerRefund as Record<string, unknown> | undefined,
    );
    const [updated] = await tx
      .update(furlongPublicOrders)
      .set({
        traceId: input.traceId,
        replayRef: input.traceId,
        metadata: {
          ...priorMetadata,
          customerRefund: {
            ...priorRefund,
            lastSubmissionFailure: reason,
            lastSubmissionFailureAt: now.toISOString(),
            failureEventId: event?.id ?? null,
          },
        },
        updatedAt: now,
      })
      .where(
        and(
          eq(furlongPublicOrders.id, order.id),
          eq(furlongPublicOrders.status, "REFUND_PENDING"),
        ),
      )
      .returning();

    return updated ?? order;
  });
}

export type PublicOrderFulfillmentAction = "START" | "COMPLETE" | "HOLD";

export async function listPublicOrdersForFulfillment(input: {
  statuses?: string[];
  limit?: number;
}) {
  const statuses = input.statuses?.filter((status) =>
    [
      "FULFILLMENT_PENDING",
      "IN_FULFILLMENT",
      "REFUND_PENDING",
      "HELD",
      "FULFILLED",
    ].includes(status),
  ) ?? ["FULFILLMENT_PENDING", "IN_FULFILLMENT", "REFUND_PENDING", "HELD"];
  if (!statuses.length) return [];
  const limit = Math.min(Math.max(Math.trunc(input.limit ?? 50), 1), 100);
  return db
    .select()
    .from(furlongPublicOrders)
    .where(inArray(furlongPublicOrders.status, statuses))
    .orderBy(desc(furlongPublicOrders.updatedAt))
    .limit(limit);
}

function fulfillmentTransitionAllowed(
  status: string,
  action: PublicOrderFulfillmentAction,
): boolean {
  if (action === "START") {
    return ["FULFILLMENT_PENDING", "HELD"].includes(status);
  }
  if (action === "COMPLETE") return status === "IN_FULFILLMENT";
  if (action === "HOLD") {
    return ["FULFILLMENT_PENDING", "IN_FULFILLMENT"].includes(status);
  }
  return false;
}

export async function transitionPublicOrderFulfillment(input: {
  orderId: string;
  action: PublicOrderFulfillmentAction;
  operatorActorId: string;
  reportRef?: string | null;
  evidenceRefs?: string[];
  reason?: string | null;
  idempotencyKey: string;
  traceId: string;
}) {
  const operatorActorId = requiredText(
    input.operatorActorId,
    "operatorActorId",
  );
  const idempotencyKey = requiredText(input.idempotencyKey, "idempotencyKey");
  const reportRef = input.reportRef?.trim() || null;
  let evidenceRefs = Array.from(
    new Set(
      (input.evidenceRefs ?? []).map((value) => value.trim()).filter(Boolean),
    ),
  ).slice(0, 100);
  if (
    input.action === "COMPLETE" &&
    (!reportRef || evidenceRefs.length === 0)
  ) {
    throw new Error(
      "Completing fulfillment requires a report reference and evidence.",
    );
  }

  return db.transaction(async (tx) => {
    const [order] = await tx
      .select()
      .from(furlongPublicOrders)
      .where(eq(furlongPublicOrders.id, input.orderId))
      .limit(1);
    if (!order) throw new Error("Public order not found.");

    if (
      order.creditSourceOrderId &&
      ["START", "COMPLETE"].includes(input.action)
    ) {
      const [creditSource] = await tx
        .select()
        .from(furlongPublicOrders)
        .where(eq(furlongPublicOrders.id, order.creditSourceOrderId))
        .limit(1);
      if (
        !creditSource ||
        creditSource.status !== "FULFILLED" ||
        creditSource.amountPaidCents !== creditSource.amountTotalCents ||
        creditSource.amountRefundedCents !== 0
      ) {
        throw new PublicOrderConflictError(
          "The prior-report credit is no longer valid. This order must remain on hold for operator resolution.",
        );
      }
    }

    const priorMetadata = safeMetadata(
      order.metadata as Record<string, unknown> | undefined,
    );
    const reportArtifact = readPublicOrderReportArtifact(priorMetadata);
    if (input.action === "COMPLETE" && order.fulfillmentMode === "SUPERVISED") {
      if (
        !reportArtifact ||
        reportArtifact.artifactId !== reportRef ||
        reportArtifact.status !== "VERIFIED" ||
        !reportArtifact.verifiedSha256
      ) {
        throw new PublicOrderConflictError(
          "Completion requires the verified report artifact bound to this order.",
        );
      }
      evidenceRefs = Array.from(
        new Set([
          ...evidenceRefs,
          "artifact:" + reportArtifact.artifactId,
          "sha256:" + reportArtifact.verifiedSha256,
        ]),
      ).slice(0, 100);
    }

    const eventType =
      input.action === "START"
        ? "public_order.fulfillment_started"
        : input.action === "COMPLETE"
          ? "public_order.fulfillment_completed"
          : "public_order.fulfillment_held";
    const digestPayload = JSON.stringify({
      orderId: order.id,
      action: input.action,
      reportRef,
      evidenceRefs,
      reason: input.reason?.trim() || null,
    });
    const reason = input.reason?.trim() || null;
    if (input.action === "HOLD" && !reason) {
      throw new Error("Holding fulfillment requires a reason.");
    }

    const now = new Date();
    const payloadDigest = createHash("sha256")
      .update(digestPayload)
      .digest("hex");
    const eventRows = await tx
      .insert(furlongPublicOrderEvents)
      .values({
        orderId: order.id,
        provider: "furlong-operator",
        providerEventId: idempotencyKey,
        eventType,
        eventStatus:
          input.action === "COMPLETE"
            ? "FULFILLED"
            : input.action === "START"
              ? "IN_FULFILLMENT"
              : "HELD",
        payloadDigest,
        amountCents: order.amountTotalCents,
        currency: order.currency,
        paymentStatus: null,
        governanceVersion: PUBLIC_ORDER_GOVERNANCE_VERSION,
        classification: "RESTRICTED",
        replayRef: input.traceId,
        traceId: input.traceId,
        source: "furlong-operator-fulfillment",
        metadata: {
          action: input.action,
          operatorActorId,
          reportRef,
          evidenceRefs,
          reason,
        },
        occurredAt: now,
      })
      .onConflictDoNothing({
        target: [
          furlongPublicOrderEvents.provider,
          furlongPublicOrderEvents.providerEventId,
        ],
      })
      .returning({ id: furlongPublicOrderEvents.id });

    if (!eventRows[0]) {
      const [existingEvent] = await tx
        .select()
        .from(furlongPublicOrderEvents)
        .where(
          and(
            eq(furlongPublicOrderEvents.provider, "furlong-operator"),
            eq(furlongPublicOrderEvents.providerEventId, idempotencyKey),
          ),
        )
        .limit(1);
      if (
        !existingEvent ||
        existingEvent.orderId !== order.id ||
        existingEvent.eventType !== eventType ||
        existingEvent.payloadDigest !== payloadDigest
      ) {
        throw new PublicOrderConflictError(
          "The fulfillment idempotency key is already bound to another action.",
        );
      }
      return {
        handled: true as const,
        duplicate: true,
        order,
        eventId: existingEvent.id,
      };
    }

    if (!fulfillmentTransitionAllowed(order.status, input.action)) {
      throw new PublicOrderConflictError(
        `Order status ${order.status} cannot accept fulfillment action ${input.action}.`,
      );
    }

    const nextStatus =
      input.action === "START"
        ? "IN_FULFILLMENT"
        : input.action === "COMPLETE"
          ? "FULFILLED"
          : "HELD";
    const [updatedOrder] = await tx
      .update(furlongPublicOrders)
      .set({
        status: nextStatus,
        fulfillmentStartedAt:
          input.action === "START"
            ? (order.fulfillmentStartedAt ?? now)
            : order.fulfillmentStartedAt,
        fulfilledAt: input.action === "COMPLETE" ? now : order.fulfilledAt,
        traceId: input.traceId,
        replayRef: input.traceId,
        metadata: {
          ...priorMetadata,
          reportArtifact:
            input.action === "COMPLETE" && reportArtifact
              ? {
                  ...reportArtifact,
                  status: "AVAILABLE",
                  availableAt: now.toISOString(),
                }
              : priorMetadata.reportArtifact,
          fulfillment: {
            action: input.action,
            operatorActorId,
            reportRef,
            evidenceRefs,
            reason,
            eventId: eventRows[0].id,
            recordedAt: now.toISOString(),
          },
        },
        updatedAt: now,
      })
      .where(
        and(
          eq(furlongPublicOrders.id, order.id),
          eq(furlongPublicOrders.status, order.status),
        ),
      )
      .returning();

    if (!updatedOrder) {
      throw new PublicOrderConflictError(
        "The order changed while fulfillment was being updated.",
      );
    }

    let grant: typeof furlongPublicAccessGrants.$inferSelect | null = null;
    if (input.action === "COMPLETE") {
      const [currentGrant] = await tx
        .select()
        .from(furlongPublicAccessGrants)
        .where(eq(furlongPublicAccessGrants.orderId, order.id))
        .limit(1);
      const grantMetadata =
        currentGrant?.metadata && typeof currentGrant.metadata === "object"
          ? (currentGrant.metadata as Record<string, unknown>)
          : {};
      const rows = await tx
        .update(furlongPublicAccessGrants)
        .set({
          active: false,
          unitsRemaining: 0,
          traceId: input.traceId,
          replayRef: input.traceId,
          metadata: {
            ...grantMetadata,
            reportCompleted: true,
            reportRef,
            evidenceRefs,
            completedAt: now.toISOString(),
          },
          updatedAt: now,
        })
        .where(eq(furlongPublicAccessGrants.orderId, order.id))
        .returning();
      grant = rows[0] ?? null;
    }

    return {
      handled: true as const,
      duplicate: false,
      order: updatedOrder,
      grant,
      eventId: eventRows[0].id,
    };
  });
}
