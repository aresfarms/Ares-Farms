import type { PublicProduct } from "./publicProductCatalog";

export const PUBLIC_PRODUCT_PRICING_MODEL_VERSION =
  "public-product-pricing-model-v1.0.0";

export type PublicPricingEvidenceKind =
  | "DATA_AND_COMPUTE"
  | "REVIEW_LABOR"
  | "PAYMENT_PROCESSING"
  | "SUPPORT_AND_REFUNDS";

export type PublicPricingEvidenceRef = {
  kind: PublicPricingEvidenceKind;
  reference: string;
  asOf: string;
  reviewed: boolean;
};

export type PublicProductPriceCostInput = {
  productCode: string;
  productCatalogVersion: string;
  unitAmountCents: number;
  currency: string;
  directDataCostCents: number;
  computeCostCents: number;
  reviewLaborMinutes: number;
  reviewLaborRateCentsHourly: number;
  supportReserveCents: number;
  overheadAllocationCents: number;
  paymentFeeBasisPoints: number;
  paymentFeeFixedCents: number;
  refundReserveBasisPoints: number;
  minimumMarginBasisPoints: number;
  effectiveAt: string;
  expiresAt: string;
  sourceRefs: PublicPricingEvidenceRef[];
};

export type PublicProductPriceCalculation = {
  valid: boolean;
  reasons: string[];
  reviewLaborCostCents: number;
  paymentFeeCents: number;
  refundReserveCents: number;
  fullyLoadedCostCents: number;
  contributionMarginCents: number;
  contributionMarginBasisPoints: number;
};

function integerInRange(
  value: number,
  minimum: number,
  maximum = Number.MAX_SAFE_INTEGER,
): boolean {
  return (
    Number.isSafeInteger(value) &&
    value >= minimum &&
    value <= maximum
  );
}

function parseDate(value: string): Date | null {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

function requiredEvidenceKinds(
  refs: PublicPricingEvidenceRef[],
): string[] {
  const reasons: string[] = [];
  const required: PublicPricingEvidenceKind[] = [
    "DATA_AND_COMPUTE",
    "REVIEW_LABOR",
    "PAYMENT_PROCESSING",
    "SUPPORT_AND_REFUNDS",
  ];
  for (const kind of required) {
    const matching = refs.filter((ref) => ref.kind === kind);
    if (!matching.length) {
      reasons.push("MISSING_PRICING_EVIDENCE:" + kind);
      continue;
    }
    if (
      matching.some(
        (ref) =>
          !ref.reviewed ||
          !ref.reference.trim() ||
          !parseDate(ref.asOf),
      )
    ) {
      reasons.push("UNREVIEWED_PRICING_EVIDENCE:" + kind);
    }
  }
  return reasons;
}

export function calculatePublicProductPrice(
  input: PublicProductPriceCostInput,
): PublicProductPriceCalculation {
  const reasons: string[] = [];
  const centFields = [
    input.unitAmountCents,
    input.directDataCostCents,
    input.computeCostCents,
    input.reviewLaborMinutes,
    input.reviewLaborRateCentsHourly,
    input.supportReserveCents,
    input.overheadAllocationCents,
    input.paymentFeeFixedCents,
  ];
  if (!centFields.every((value) => integerInRange(value, 0))) {
    reasons.push("INVALID_NONNEGATIVE_INTEGER_COST");
  }
  if (!integerInRange(input.unitAmountCents, 1)) {
    reasons.push("INVALID_UNIT_PRICE");
  }
  if (!integerInRange(input.paymentFeeBasisPoints, 0, 10_000)) {
    reasons.push("INVALID_PAYMENT_FEE_RATE");
  }
  if (!integerInRange(input.refundReserveBasisPoints, 0, 10_000)) {
    reasons.push("INVALID_REFUND_RESERVE_RATE");
  }
  if (!integerInRange(input.minimumMarginBasisPoints, 0, 10_000)) {
    reasons.push("INVALID_MINIMUM_MARGIN");
  }
  if (input.currency.trim().toLowerCase() !== "usd") {
    reasons.push("UNSUPPORTED_CURRENCY");
  }

  const reviewLaborCostCents = Math.ceil(
    (Math.max(input.reviewLaborMinutes, 0) *
      Math.max(input.reviewLaborRateCentsHourly, 0)) /
      60,
  );
  const paymentFeeCents =
    Math.ceil(
      (Math.max(input.unitAmountCents, 0) *
        Math.max(input.paymentFeeBasisPoints, 0)) /
        10_000,
    ) + Math.max(input.paymentFeeFixedCents, 0);
  const refundReserveCents = Math.ceil(
    (Math.max(input.unitAmountCents, 0) *
      Math.max(input.refundReserveBasisPoints, 0)) /
      10_000,
  );
  const fullyLoadedCostCents =
    Math.max(input.directDataCostCents, 0) +
    Math.max(input.computeCostCents, 0) +
    reviewLaborCostCents +
    Math.max(input.supportReserveCents, 0) +
    Math.max(input.overheadAllocationCents, 0) +
    paymentFeeCents +
    refundReserveCents;
  const contributionMarginCents =
    input.unitAmountCents - fullyLoadedCostCents;
  const contributionMarginBasisPoints =
    input.unitAmountCents > 0
      ? Math.floor(
          (contributionMarginCents / input.unitAmountCents) * 10_000,
        )
      : -100_000;

  if (
    contributionMarginBasisPoints < input.minimumMarginBasisPoints
  ) {
    reasons.push("CONTRIBUTION_MARGIN_BELOW_APPROVED_FLOOR");
  }
  reasons.push(...requiredEvidenceKinds(input.sourceRefs));

  const effectiveAt = parseDate(input.effectiveAt);
  const expiresAt = parseDate(input.expiresAt);
  if (!effectiveAt || !expiresAt || expiresAt <= effectiveAt) {
    reasons.push("INVALID_PRICE_REVIEW_PERIOD");
  } else if (
    expiresAt.getTime() - effectiveAt.getTime() >
    120 * 24 * 60 * 60 * 1000
  ) {
    reasons.push("PRICE_REVIEW_PERIOD_EXCEEDS_120_DAYS");
  }

  return {
    valid: reasons.length === 0,
    reasons,
    reviewLaborCostCents,
    paymentFeeCents,
    refundReserveCents,
    fullyLoadedCostCents,
    contributionMarginCents,
    contributionMarginBasisPoints,
  };
}

export function evaluateCatalogPriceAlignment(input: {
  product: PublicProduct;
  review: PublicProductPriceCostInput;
  expectedCatalogVersion: string;
  now?: Date;
}) {
  const calculation = calculatePublicProductPrice(input.review);
  const reasons = [...calculation.reasons];
  if (input.review.productCode !== input.product.code) {
    reasons.push("PRODUCT_CODE_MISMATCH");
  }
  if (
    input.review.productCatalogVersion !== input.expectedCatalogVersion
  ) {
    reasons.push("PRODUCT_CATALOG_VERSION_MISMATCH");
  }
  if (
    input.product.unitAmountCents === null ||
    input.review.unitAmountCents !== input.product.unitAmountCents
  ) {
    reasons.push("CATALOG_PRICE_MISMATCH");
  }
  if (
    input.review.currency.toLowerCase() !==
    input.product.currency.toLowerCase()
  ) {
    reasons.push("CATALOG_CURRENCY_MISMATCH");
  }

  const now = input.now ?? new Date();
  const effectiveAt = parseDate(input.review.effectiveAt);
  const expiresAt = parseDate(input.review.expiresAt);
  if (
    !effectiveAt ||
    !expiresAt ||
    effectiveAt > now ||
    expiresAt <= now
  ) {
    reasons.push("PRICE_REVIEW_NOT_CURRENT");
  }

  return {
    allowed: reasons.length === 0,
    reasons: Array.from(new Set(reasons)),
    calculation,
  };
}