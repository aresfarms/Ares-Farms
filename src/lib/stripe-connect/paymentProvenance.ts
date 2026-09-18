import type Stripe from "stripe";
import { RevenueClass, directModuleRule } from "./founderEconomics";
import { createAllocationRule } from "./runtime";
import {
  syntheticFixtureProviderMetadata,
  type SyntheticFixtureContext,
} from "@/lib/testing/syntheticFixtureLineage";

export const FURLONG_PAYMENT_PROVENANCE_VERSION =
  "furlong-payment-provenance-v1";

const REVENUE_CLASSES = new Set<RevenueClass>([
  "OWNER_ENVIRONMENTAL_MODULE",
  "PLATFORM_FINANCING_MODULE",
  "GENERAL_PLATFORM",
]);

export function normalizeRevenueClass(value: unknown): RevenueClass | null {
  if (typeof value !== "string") return null;
  return REVENUE_CLASSES.has(value as RevenueClass)
    ? (value as RevenueClass)
    : null;
}

export function inferRevenueClass(
  plan: string | null | undefined,
): RevenueClass {
  return plan === "environmental"
    ? "OWNER_ENVIRONMENTAL_MODULE"
    : "GENERAL_PLATFORM";
}

export function approvedPlatformRevenueRule(revenueClass: RevenueClass) {
  const direct = directModuleRule(revenueClass);
  return createAllocationRule({
    ruleId: `platform-revenue-${revenueClass.toLowerCase()}`,
    revenueClass,
    version: 2,
    status: "APPROVED",
    caitlinBasisPoints: direct.caitlinBasisPoints,
    effectiveAt: "2026-08-07T00:00:00.000Z",
    approvedByRefs: ["owner-controlled-platform-transition-2026-09-03"],
  });
}

export function checkoutTransferGroup(traceId: string): string {
  return `furlong:${traceId}`;
}

export function furlongCheckoutMetadata(input: {
  tenantId: string;
  plan: string;
  traceId: string;
  customerSubjectRef?: string | null;
  dealRef?: string | null;
  revenueClass: RevenueClass;
  scopeAcceptanceId?: string | null;
  feeControlId?: string | null;
  actualWorkEvidenceId?: string | null;
  moduleAttribution?: string | null;
  syntheticFixtureContext?: SyntheticFixtureContext | null;
}): Record<string, string> {
  return {
    ...(input.syntheticFixtureContext
      ? syntheticFixtureProviderMetadata(input.syntheticFixtureContext)
      : {}),
    furlongOrigin: "true",
    provenanceVersion: FURLONG_PAYMENT_PROVENANCE_VERSION,
    tenantId: input.tenantId,
    plan: input.plan,
    traceId: input.traceId,
    customerSubjectRef: input.customerSubjectRef?.trim() || "none",
    dealRef: input.dealRef?.trim() || "none",
    revenueClass: input.revenueClass,
    scopeAcceptanceId: input.scopeAcceptanceId?.trim() || "none",
    feeControlId: input.feeControlId?.trim() || "none",
    actualWorkEvidenceId: input.actualWorkEvidenceId?.trim() || "none",
    moduleAttribution: input.moduleAttribution?.trim() || "none",
    transferGroup: checkoutTransferGroup(input.traceId),
  };
}

export function isFurlongCheckoutSession(
  session: Stripe.Checkout.Session,
): boolean {
  return (
    session.metadata?.furlongOrigin === "true" &&
    session.metadata?.provenanceVersion === FURLONG_PAYMENT_PROVENANCE_VERSION
  );
}
