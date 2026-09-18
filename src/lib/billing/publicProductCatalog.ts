/**
 * Public property-intelligence product catalog.
 *
 * This registry is separate from institution-funded PLANS. Prices are
 * server-owned hypotheses until validation is complete, and a withheld product
 * can never be made purchasable by browser input.
 */
export const PUBLIC_PRODUCT_CATALOG_VERSION =
  "furlong-public-product-catalog-v2.0.0";

export type PublicProductCode =
  | "property_snapshot"
  | "focused_property_report"
  | "complete_property_analysis"
  | "custom_property_analysis"
  | "portfolio_comparison"
  | "high_frequency_access";

export type PublicProductTargetType = "PROPERTY" | "PROPERTY_COMPARISON";

export type PublicFulfillmentMode =
  "INSTANT" | "AUTOMATED" | "SUPERVISED" | "METERED" | "MEMBERSHIP";

export type PublicProductReleaseState =
  "FREE" | "WITHHELD" | "AUTOMATED_FLAG" | "SUPERVISED_FLAG";

export type PublicProduct = {
  code: PublicProductCode;
  publicName: string | null;
  description: string;
  unitAmountCents: number | null;
  currency: "usd";
  targetTypes: readonly PublicProductTargetType[];
  fulfillmentMode: PublicFulfillmentMode;
  releaseState: PublicProductReleaseState;
  reportCredits: number;
  publicCheckout: boolean;
  pricingBasis: "FREE" | "HYPOTHESIS" | "UNPRICED";
  included: readonly string[];
  excluded: readonly string[];
  upgradeCredit?: {
    sourceProductCode: PublicProductCode;
    amountCents: number;
    validDays: number;
  } | null;
  holdReason: string | null;
};

export const PUBLIC_PRODUCTS: Record<PublicProductCode, PublicProduct> = {
  property_snapshot: {
    code: "property_snapshot",
    publicName: "Furlong Property Snapshot",
    description:
      "A useful free screen of the property facts, material warnings, evidence coverage, and the next question to resolve.",
    unitAmountCents: 0,
    currency: "usd",
    targetTypes: ["PROPERTY"],
    fulfillmentMode: "INSTANT",
    releaseState: "FREE",
    reportCredits: 0,
    publicCheckout: false,
    pricingBasis: "FREE",
    included: [
      "matched property identity and current-use context",
      "material constraints and known warnings",
      "source coverage, confidence, and missing evidence",
      "a specific next action",
    ],
    excluded: [
      "complete enterprise economics and long-range projections",
      "a human-reviewed acquisition decision",
    ],
    holdReason: null,
  },
  focused_property_report: {
    code: "focused_property_report",
    publicName: "Furlong Property Report",
    description:
      "An immediate automated report that explains the property, tests the strongest supported uses, and shows the evidence and assumptions behind the screen.",
    unitAmountCents: 4_900,
    currency: "usd",
    targetTypes: ["PROPERTY"],
    fulfillmentMode: "AUTOMATED",
    releaseState: "AUTOMATED_FLAG",
    reportCredits: 1,
    publicCheckout: true,
    pricingBasis: "HYPOTHESIS",
    included: [
      "automated property, parcel, use, market, and constraint analysis",
      "preliminary single-use, mixed-use, and selected-vision comparison",
      "preliminary NOI, DSCR, and projections when supported inputs exist",
      "financing and incentive families, sources, assumptions, and evidence gaps",
      "a downloadable, version-frozen report",
    ],
    excluded: [
      "human review or a negotiated acquisition recommendation",
      "borrower underwriting, appraisal, loan approval, or guaranteed outcome",
      "site visits, sampling, laboratory work, stamped plans, or official professional reports",
    ],
    holdReason:
      "Checkout remains closed until the automated report artifact, delivery, refund, and price-accuracy gates are verified.",
  },
  complete_property_analysis: {
    code: "complete_property_analysis",
    publicName: null,
    description:
      "Retired public placeholder. Furlong offers one automated Property Report and one human-reviewed Property Decision Report.",
    unitAmountCents: null,
    currency: "usd",
    targetTypes: ["PROPERTY"],
    fulfillmentMode: "AUTOMATED",
    releaseState: "WITHHELD",
    reportCredits: 0,
    publicCheckout: false,
    pricingBasis: "UNPRICED",
    included: [],
    excluded: [],
    holdReason: "This overlapping middle tier is retired and must not be sold.",
  },
  custom_property_analysis: {
    code: "custom_property_analysis",
    publicName: "Furlong Property Decision Report",
    description:
      "A human-reviewed decision report for a customer who needs to decide whether, at what price, and under which plan to proceed.",
    unitAmountCents: 24_900,
    currency: "usd",
    targetTypes: ["PROPERTY"],
    fulfillmentMode: "SUPERVISED",
    releaseState: "SUPERVISED_FLAG",
    reportCredits: 1,
    publicCheckout: true,
    pricingBasis: "HYPOTHESIS",
    included: [
      "human review of the property evidence and automated calculations",
      "ranked single-enterprise, mixed-use, and customer-vision scenarios",
      "acquisition-price and offer boundary with sensitivity testing",
      "monthly, quarterly, annual, 5-, 10-, and 30-year projections when supportable",
      "labor, benefits, inflation, maintenance, replacement, NOI, and DSCR analysis",
      "competition, financing, grants, execution conditions, and an explicit action verdict",
    ],
    excluded: [
      "borrower personal-financial underwriting or a lender commitment",
      "appraisal, legal advice, permit or agency determination, or guaranteed profit",
      "Phase I, II, or III work, remediation, site supervision, laboratory work, or stamped drawings",
    ],
    upgradeCredit: {
      sourceProductCode: "focused_property_report",
      amountCents: 4_900,
      validDays: 30,
    },
    holdReason:
      "Checkout remains closed until supervised fulfillment capacity, refund operations, and the current cost-and-margin review are activated.",
  },
  portfolio_comparison: {
    code: "portfolio_comparison",
    publicName: "Property List Comparison",
    description: "Evidence-backed comparison of 1–1,000 submitted properties.",
    unitAmountCents: null,
    currency: "usd",
    targetTypes: ["PROPERTY_COMPARISON"],
    fulfillmentMode: "METERED",
    releaseState: "WITHHELD",
    reportCredits: 0,
    publicCheckout: false,
    pricingBasis: "UNPRICED",
    included: [],
    excluded: [],
    holdReason:
      "Batch unit cost and tiered 1–1,000-property pricing are not validated.",
  },
  high_frequency_access: {
    code: "high_frequency_access",
    publicName: null,
    description: "Reserved annual high-frequency access product.",
    unitAmountCents: null,
    currency: "usd",
    targetTypes: ["PROPERTY", "PROPERTY_COMPARISON"],
    fulfillmentMode: "MEMBERSHIP",
    releaseState: "WITHHELD",
    reportCredits: 0,
    publicCheckout: false,
    pricingBasis: "UNPRICED",
    included: [],
    excluded: [],
    holdReason:
      "Public name, fair-use limits, unit economics and annual price are undecided.",
  },
};

export function isPublicProductCode(
  value: unknown,
): value is PublicProductCode {
  return (
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(PUBLIC_PRODUCTS, value)
  );
}

export function publicProduct(value: unknown): PublicProduct | null {
  return isPublicProductCode(value) ? PUBLIC_PRODUCTS[value] : null;
}

export type PublicCheckoutDecision = {
  allowed: boolean;
  reason: string | null;
  deliveryBusinessDays: number | null;
  maxOpenOrders: number | null;
};

function boundedPositiveInteger(
  value: string | undefined,
  maximum: number,
): number | null {
  const raw = value?.trim() ?? "";
  if (!/^\d+$/.test(raw)) return null;
  const parsed = Number(raw);
  return Number.isSafeInteger(parsed) && parsed >= 1 && parsed <= maximum
    ? parsed
    : null;
}

export function publicProductDeliveryBusinessDays(
  product: PublicProduct,
  env: Record<string, string | undefined> = process.env,
): number | null {
  if (product.fulfillmentMode !== "SUPERVISED") return null;
  return boundedPositiveInteger(
    env.FURLONG_DECISION_REPORT_DELIVERY_BUSINESS_DAYS,
    30,
  );
}

export function publicProductMaxOpenOrders(
  product: PublicProduct,
  env: Record<string, string | undefined> = process.env,
): number | null {
  if (product.fulfillmentMode === "AUTOMATED") {
    return boundedPositiveInteger(
      env.FURLONG_PROPERTY_REPORT_MAX_OPEN_ORDERS,
      100,
    );
  }
  if (product.fulfillmentMode === "SUPERVISED") {
    return boundedPositiveInteger(
      env.FURLONG_DECISION_REPORT_MAX_OPEN_ORDERS,
      100,
    );
  }
  return null;
}

export function publicProductDeliveryPromise(
  product: PublicProduct,
  deliveryBusinessDays: number | null,
): string {
  if (product.fulfillmentMode === "AUTOMATED") {
    return "Available after signed payment confirmation and successful report-artifact verification";
  }
  if (
    product.fulfillmentMode === "SUPERVISED" &&
    deliveryBusinessDays !== null
  ) {
    return `Within ${deliveryBusinessDays} business days after signed payment confirmation`;
  }
  return "No paid delivery promise is active";
}

function releaseFlagEnabled(
  product: PublicProduct,
  env: Record<string, string | undefined>,
): boolean {
  if (product.releaseState === "AUTOMATED_FLAG") {
    return (
      env.FURLONG_PUBLIC_PROPERTY_REPORT_SALES_ENABLED === "true" &&
      env.FURLONG_PROPERTY_REPORT_ARTIFACT_DELIVERY_ENABLED === "true"
    );
  }
  if (product.releaseState === "SUPERVISED_FLAG") {
    return env.FURLONG_PUBLIC_DECISION_REPORT_SALES_ENABLED === "true";
  }
  return false;
}

export function publicCheckoutDecision(
  product: PublicProduct,
  env: Record<string, string | undefined> = process.env,
): PublicCheckoutDecision {
  const closed = (reason: string): PublicCheckoutDecision => ({
    allowed: false,
    reason,
    deliveryBusinessDays: null,
    maxOpenOrders: null,
  });
  if (
    !product.publicCheckout ||
    product.unitAmountCents === null ||
    product.unitAmountCents <= 0
  ) {
    return closed(
      product.holdReason ?? "This product is not sold through checkout.",
    );
  }
  if (!["AUTOMATED_FLAG", "SUPERVISED_FLAG"].includes(product.releaseState)) {
    return closed(product.holdReason ?? "This product is not released.");
  }
  if (!releaseFlagEnabled(product, env)) {
    return closed(
      product.holdReason ?? "Paid fulfillment has not been activated.",
    );
  }

  const deliveryBusinessDays = publicProductDeliveryBusinessDays(product, env);
  if (
    product.fulfillmentMode === "SUPERVISED" &&
    deliveryBusinessDays === null
  ) {
    return closed(
      "A definite Decision Report delivery window must be configured before payment.",
    );
  }

  const maxOpenOrders = publicProductMaxOpenOrders(product, env);
  if (maxOpenOrders === null) {
    return closed(
      "A verified paid-report order capacity must be configured before payment.",
    );
  }
  return {
    allowed: true,
    reason: null,
    deliveryBusinessDays,
    maxOpenOrders,
  };
}

export function productSupportsTarget(
  product: PublicProduct,
  targetType: PublicProductTargetType,
): boolean {
  return product.targetTypes.includes(targetType);
}
