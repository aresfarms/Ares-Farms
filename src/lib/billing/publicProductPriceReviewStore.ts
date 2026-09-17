import { randomUUID } from "node:crypto";

import { and, desc, eq, gt, lte } from "drizzle-orm";

import { furlongPublicProductPriceReviews } from "@/db/schema";
import {
  PUBLIC_PRODUCT_CATALOG_VERSION,
  type PublicProduct,
} from "@/lib/billing/publicProductCatalog";
import {
  calculatePublicProductPrice,
  evaluateCatalogPriceAlignment,
  type PublicPricingEvidenceRef,
  type PublicProductPriceCostInput,
} from "@/lib/billing/publicProductPricing";
import { db } from "@/lib/db";

const PRICE_REVIEW_SOURCE = "public-product-price-review-runtime";
const PRICE_REVIEW_GOVERNANCE_VERSION =
  "public-product-price-review-v1.0.0";

function evidenceRefs(value: unknown): PublicPricingEvidenceRef[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return [];
    const record = item as Record<string, unknown>;
    const kind = record.kind;
    const reference = record.reference;
    const asOf = record.asOf;
    const reviewed = record.reviewed;
    if (
      ![
        "DATA_AND_COMPUTE",
        "REVIEW_LABOR",
        "PAYMENT_PROCESSING",
        "SUPPORT_AND_REFUNDS",
      ].includes(String(kind)) ||
      typeof reference !== "string" ||
      typeof asOf !== "string" ||
      typeof reviewed !== "boolean"
    ) {
      return [];
    }
    return [
      {
        kind: kind as PublicPricingEvidenceRef["kind"],
        reference,
        asOf,
        reviewed,
      },
    ];
  });
}

function reviewInput(
  row: typeof furlongPublicProductPriceReviews.$inferSelect,
): PublicProductPriceCostInput {
  return {
    productCode: row.productCode,
    productCatalogVersion: row.productCatalogVersion,
    unitAmountCents: row.unitAmountCents,
    currency: row.currency,
    directDataCostCents: row.directDataCostCents,
    computeCostCents: row.computeCostCents,
    reviewLaborMinutes: row.reviewLaborMinutes,
    reviewLaborRateCentsHourly: row.reviewLaborRateCentsHourly,
    supportReserveCents: row.supportReserveCents,
    overheadAllocationCents: row.overheadAllocationCents,
    paymentFeeBasisPoints: row.paymentFeeBasisPoints,
    paymentFeeFixedCents: row.paymentFeeFixedCents,
    refundReserveBasisPoints: row.refundReserveBasisPoints,
    minimumMarginBasisPoints: row.minimumMarginBasisPoints,
    effectiveAt: row.effectiveAt.toISOString(),
    expiresAt: row.expiresAt.toISOString(),
    sourceRefs: evidenceRefs(row.sourceRefs),
  };
}

export async function recordPublicProductPriceReview(input: {
  product: PublicProduct;
  review: PublicProductPriceCostInput;
  operatorActorId: string;
  traceId: string;
  approve: boolean;
}) {
  const operatorActorId = input.operatorActorId.trim();
  if (!operatorActorId) {
    throw new Error("A verified operator is required.");
  }
  const alignment = evaluateCatalogPriceAlignment({
    product: input.product,
    review: input.review,
    expectedCatalogVersion: PUBLIC_PRODUCT_CATALOG_VERSION,
    now: new Date(),
  });
  if (input.approve && !alignment.allowed) {
    throw new Error(
      "Price review cannot be approved: " +
        alignment.reasons.join(", "),
    );
  }

  const now = new Date();
  const effectiveAt = new Date(input.review.effectiveAt);
  const expiresAt = new Date(input.review.expiresAt);
  const [created] = await db
    .insert(furlongPublicProductPriceReviews)
    .values({
      id: randomUUID(),
      productCode: input.product.code,
      productCatalogVersion: PUBLIC_PRODUCT_CATALOG_VERSION,
      unitAmountCents: input.review.unitAmountCents,
      currency: input.review.currency.toLowerCase(),
      directDataCostCents: input.review.directDataCostCents,
      computeCostCents: input.review.computeCostCents,
      reviewLaborMinutes: input.review.reviewLaborMinutes,
      reviewLaborRateCentsHourly:
        input.review.reviewLaborRateCentsHourly,
      supportReserveCents: input.review.supportReserveCents,
      overheadAllocationCents: input.review.overheadAllocationCents,
      paymentFeeBasisPoints: input.review.paymentFeeBasisPoints,
      paymentFeeFixedCents: input.review.paymentFeeFixedCents,
      refundReserveBasisPoints: input.review.refundReserveBasisPoints,
      fullyLoadedCostCents: alignment.calculation.fullyLoadedCostCents,
      contributionMarginCents:
        alignment.calculation.contributionMarginCents,
      contributionMarginBasisPoints:
        alignment.calculation.contributionMarginBasisPoints,
      minimumMarginBasisPoints: input.review.minimumMarginBasisPoints,
      reviewStatus: input.approve ? "APPROVED" : "DRAFT",
      reviewedBy: input.approve ? operatorActorId : null,
      sourceRefs: input.review.sourceRefs,
      assumptions: {
        pricingModelVersion: "public-product-pricing-model-v1.0.0",
        reviewLaborCostCents:
          alignment.calculation.reviewLaborCostCents,
        paymentFeeCents: alignment.calculation.paymentFeeCents,
        refundReserveCents:
          alignment.calculation.refundReserveCents,
        approvalReasons: alignment.reasons,
      },
      governanceVersion: PRICE_REVIEW_GOVERNANCE_VERSION,
      classification: "CONFIDENTIAL",
      replayRef: input.traceId,
      traceId: input.traceId,
      source: PRICE_REVIEW_SOURCE,
      metadata: {
        approvedAgainstServerCatalog: input.approve,
        browserSuppliedPriceAccepted: false,
      },
      effectiveAt,
      expiresAt,
      reviewedAt: input.approve ? now : null,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  if (!created) throw new Error("Price review could not be recorded.");
  return { review: created, alignment };
}

export async function listPublicProductPriceReviews(input: {
  productCode: string;
  limit?: number;
}) {
  const limit = Math.max(1, Math.min(input.limit ?? 20, 50));
  return db
    .select()
    .from(furlongPublicProductPriceReviews)
    .where(
      and(
        eq(
          furlongPublicProductPriceReviews.productCode,
          input.productCode,
        ),
        eq(
          furlongPublicProductPriceReviews.productCatalogVersion,
          PUBLIC_PRODUCT_CATALOG_VERSION,
        ),
      ),
    )
    .orderBy(desc(furlongPublicProductPriceReviews.createdAt))
    .limit(limit);
}

export async function evaluateRecordedPublicProductPrice(input: {
  product: PublicProduct;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const [row] = await db
    .select()
    .from(furlongPublicProductPriceReviews)
    .where(
      and(
        eq(
          furlongPublicProductPriceReviews.productCode,
          input.product.code,
        ),
        eq(
          furlongPublicProductPriceReviews.productCatalogVersion,
          PUBLIC_PRODUCT_CATALOG_VERSION,
        ),
        eq(
          furlongPublicProductPriceReviews.reviewStatus,
          "APPROVED",
        ),
        lte(furlongPublicProductPriceReviews.effectiveAt, now),
        gt(furlongPublicProductPriceReviews.expiresAt, now),
      ),
    )
    .orderBy(desc(furlongPublicProductPriceReviews.effectiveAt))
    .limit(1);

  if (!row) {
    return {
      allowed: false,
      reasons: ["NO_CURRENT_APPROVED_PRICE_REVIEW"],
      review: null,
      calculation: null,
    };
  }

  const calculated = calculatePublicProductPrice(reviewInput(row));
  const alignment = evaluateCatalogPriceAlignment({
    product: input.product,
    review: reviewInput(row),
    expectedCatalogVersion: PUBLIC_PRODUCT_CATALOG_VERSION,
    now,
  });
  const storedCalculationMatches =
    row.fullyLoadedCostCents === calculated.fullyLoadedCostCents &&
    row.contributionMarginCents ===
      calculated.contributionMarginCents &&
    row.contributionMarginBasisPoints ===
      calculated.contributionMarginBasisPoints;
  const reasons = [...alignment.reasons];
  if (!storedCalculationMatches) {
    reasons.push("STORED_PRICE_CALCULATION_MISMATCH");
  }

  return {
    allowed: reasons.length === 0,
    reasons: Array.from(new Set(reasons)),
    review: row,
    calculation: calculated,
  };
}