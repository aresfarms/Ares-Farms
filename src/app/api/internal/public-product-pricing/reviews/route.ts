import { randomUUID } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

import { sessionAuthority } from "@/lib/auth/sessionAuthority";
import {
  PUBLIC_PRODUCT_CATALOG_VERSION,
  publicProduct,
} from "@/lib/billing/publicProductCatalog";
import {
  evaluateRecordedPublicProductPrice,
  listPublicProductPriceReviews,
  recordPublicProductPriceReview,
} from "@/lib/billing/publicProductPriceReviewStore";
import type {
  PublicPricingEvidenceRef,
  PublicProductPriceCostInput,
} from "@/lib/billing/publicProductPricing";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import { readJsonBodyWithLimit } from "@/lib/security/requestGuards";

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function integer(value: unknown): number | null {
  return typeof value === "number" && Number.isSafeInteger(value)
    ? value
    : null;
}

function text(value: unknown, max = 500): string | null {
  return typeof value === "string" && value.trim()
    ? value.trim().slice(0, max)
    : null;
}

function pricingEvidence(value: unknown): PublicPricingEvidenceRef[] | null {
  if (!Array.isArray(value) || value.length > 20) return null;
  const parsed: PublicPricingEvidenceRef[] = [];
  for (const item of value) {
    const entry = record(item);
    const kind = text(entry.kind, 40);
    const reference = text(entry.reference, 500);
    const asOf = text(entry.asOf, 50);
    if (
      !kind ||
      ![
        "DATA_AND_COMPUTE",
        "REVIEW_LABOR",
        "PAYMENT_PROCESSING",
        "SUPPORT_AND_REFUNDS",
      ].includes(kind) ||
      !reference ||
      !asOf ||
      entry.reviewed !== true
    ) {
      return null;
    }
    parsed.push({
      kind: kind as PublicPricingEvidenceRef["kind"],
      reference,
      asOf,
      reviewed: true,
    });
  }
  return parsed;
}

function costInput(
  value: Record<string, unknown>,
  productCode: string,
): PublicProductPriceCostInput | null {
  const refs = pricingEvidence(value.sourceRefs);
  const effectiveAt = text(value.effectiveAt, 50);
  const expiresAt = text(value.expiresAt, 50);
  const currency = text(value.currency, 8);
  const numericKeys = [
    "unitAmountCents",
    "directDataCostCents",
    "computeCostCents",
    "reviewLaborMinutes",
    "reviewLaborRateCentsHourly",
    "supportReserveCents",
    "overheadAllocationCents",
    "paymentFeeBasisPoints",
    "paymentFeeFixedCents",
    "refundReserveBasisPoints",
    "minimumMarginBasisPoints",
  ] as const;
  const numbers = Object.fromEntries(
    numericKeys.map((key) => [key, integer(value[key])]),
  ) as Record<(typeof numericKeys)[number], number | null>;
  if (
    !refs ||
    !effectiveAt ||
    !expiresAt ||
    !currency ||
    Object.values(numbers).some((item) => item === null)
  ) {
    return null;
  }

  return {
    productCode,
    productCatalogVersion: text(
      value.productCatalogVersion,
      100,
    ) ?? "",
    unitAmountCents: numbers.unitAmountCents!,
    currency,
    directDataCostCents: numbers.directDataCostCents!,
    computeCostCents: numbers.computeCostCents!,
    reviewLaborMinutes: numbers.reviewLaborMinutes!,
    reviewLaborRateCentsHourly:
      numbers.reviewLaborRateCentsHourly!,
    supportReserveCents: numbers.supportReserveCents!,
    overheadAllocationCents: numbers.overheadAllocationCents!,
    paymentFeeBasisPoints: numbers.paymentFeeBasisPoints!,
    paymentFeeFixedCents: numbers.paymentFeeFixedCents!,
    refundReserveBasisPoints: numbers.refundReserveBasisPoints!,
    minimumMarginBasisPoints: numbers.minimumMarginBasisPoints!,
    effectiveAt,
    expiresAt,
    sourceRefs: refs,
  };
}

export async function GET(req: NextRequest) {
  const traceId = "public-price-review-read-" + randomUUID();
  const authority = sessionAuthority(req);
  if (
    !["governance", "operator"].includes(authority.role) ||
    !authority.actorId
  ) {
    return NextResponse.json(
      { ok: false, error: "Verified operator access is required." },
      { status: 403 },
    );
  }

  const product = publicProduct(
    req.nextUrl.searchParams.get("productCode") ??
      "custom_property_analysis",
  );
  if (!product) {
    return NextResponse.json(
      { ok: false, error: "Unknown public product." },
      { status: 400 },
    );
  }

  const guard = runRuntimeGuard({
    operation: "billing.public-product-price.read",
    module: "api.internal.public-product-pricing",
    traceId,
    replayRef: traceId,
    actorId: authority.actorId,
    schemaVersion: "public-product-price-review-v1.0.0",
    governanceVersion: "master-volumes-runtime-v0.1.0",
    classificationLevel: "CONFIDENTIAL",
    metadata: {
      productCode: product.code,
      operatorAuthorityBasis: authority.basis,
    },
  });
  if (!guard.allowed) {
    return NextResponse.json(
      { ok: false, error: "The price review read was blocked." },
      { status: 403 },
    );
  }

  const [reviews, current] = await Promise.all([
    listPublicProductPriceReviews({ productCode: product.code }),
    evaluateRecordedPublicProductPrice({ product }),
  ]);
  return NextResponse.json(
    {
      ok: true,
      product: {
        code: product.code,
        publicName: product.publicName,
        catalogVersion: PUBLIC_PRODUCT_CATALOG_VERSION,
        unitAmountCents: product.unitAmountCents,
        currency: product.currency,
        fulfillmentMode: product.fulfillmentMode,
        releaseState: product.releaseState,
        pricingBasis: product.pricingBasis,
      },
      current: {
        allowed: current.allowed,
        reasons: current.reasons,
        reviewId: current.review?.id ?? null,
      },
      reviews: reviews.map((review) => ({
        id: review.id,
        unitAmountCents: review.unitAmountCents,
        currency: review.currency,
        directDataCostCents: review.directDataCostCents,
        computeCostCents: review.computeCostCents,
        reviewLaborMinutes: review.reviewLaborMinutes,
        reviewLaborRateCentsHourly:
          review.reviewLaborRateCentsHourly,
        supportReserveCents: review.supportReserveCents,
        overheadAllocationCents: review.overheadAllocationCents,
        paymentFeeBasisPoints: review.paymentFeeBasisPoints,
        paymentFeeFixedCents: review.paymentFeeFixedCents,
        refundReserveBasisPoints: review.refundReserveBasisPoints,
        fullyLoadedCostCents: review.fullyLoadedCostCents,
        contributionMarginCents: review.contributionMarginCents,
        contributionMarginBasisPoints:
          review.contributionMarginBasisPoints,
        minimumMarginBasisPoints: review.minimumMarginBasisPoints,
        reviewStatus: review.reviewStatus,
        sourceRefs: review.sourceRefs,
        effectiveAt: review.effectiveAt.toISOString(),
        expiresAt: review.expiresAt.toISOString(),
        reviewedAt: review.reviewedAt?.toISOString() ?? null,
        createdAt: review.createdAt.toISOString(),
      })),
      traceId,
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}

export async function POST(req: NextRequest) {
  const traceId = "public-price-review-" + randomUUID();
  const authority = sessionAuthority(req);
  if (
    !["governance", "operator"].includes(authority.role) ||
    !authority.actorId
  ) {
    return NextResponse.json(
      { ok: false, error: "Verified operator access is required." },
      { status: 403 },
    );
  }

  const parsed = await readJsonBodyWithLimit<Record<string, unknown>>(
    req,
    { maxBytes: 64 * 1024 },
  );
  if (!parsed.ok) {
    return NextResponse.json(
      { ok: false, error: parsed.error },
      { status: parsed.status },
    );
  }

  const productCode = text(parsed.body.productCode, 100);
  const product = publicProduct(productCode);
  const review = product
    ? costInput(parsed.body, product.code)
    : null;
  if (!product || !review) {
    return NextResponse.json(
      {
        ok: false,
        error: "A complete, typed product cost review is required.",
      },
      { status: 400 },
    );
  }

  const guard = runRuntimeGuard({
    operation: "billing.public-product-price.review",
    module: "api.internal.public-product-pricing",
    traceId,
    replayRef: traceId,
    actorId: authority.actorId,
    schemaVersion: "public-product-price-review-v1.0.0",
    governanceVersion: "master-volumes-runtime-v0.1.0",
    classificationLevel: "CONFIDENTIAL",
    metadata: {
      productCode: product.code,
      approve: parsed.body.approve === true,
      sourceRefCount: review.sourceRefs.length,
      operatorAuthorityBasis: authority.basis,
    },
  });
  if (!guard.allowed) {
    return NextResponse.json(
      { ok: false, error: "The price review was blocked." },
      { status: 403 },
    );
  }

  try {
    const result = await recordPublicProductPriceReview({
      product,
      review,
      operatorActorId: authority.actorId,
      traceId,
      approve: parsed.body.approve === true,
    });
    return NextResponse.json(
      {
        ok: true,
        review: {
          id: result.review.id,
          productCode: result.review.productCode,
          catalogVersion: result.review.productCatalogVersion,
          unitAmountCents: result.review.unitAmountCents,
          fullyLoadedCostCents: result.review.fullyLoadedCostCents,
          contributionMarginCents:
            result.review.contributionMarginCents,
          contributionMarginBasisPoints:
            result.review.contributionMarginBasisPoints,
          minimumMarginBasisPoints:
            result.review.minimumMarginBasisPoints,
          reviewStatus: result.review.reviewStatus,
          effectiveAt: result.review.effectiveAt,
          expiresAt: result.review.expiresAt,
          reviewedAt: result.review.reviewedAt,
        },
        calculation: result.alignment.calculation,
        traceId,
      },
      {
        status: 201,
        headers: { "Cache-Control": "private, no-store" },
      },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Price review could not be recorded.",
        traceId,
      },
      { status: 422 },
    );
  }
}