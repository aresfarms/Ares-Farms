/**
 * Canonical Stripe Client Adapter
 *
 * Master Volume Governance:
 * - Vol I: Keeps payment-adjacent behavior bounded by constitutional disclosure limits.
 * - Vol II: Preserves controlled handling for borrower, tenant, and billing metadata.
 * - Vol III: Provides a deterministic local adapter while real Stripe promotion is gated.
 * - Vol IV: Supports safe local development, testing, rollback, and operator review.
 * - Vol V: Keeps connector behavior centralized for versioning, replay, and audit review.
 *
 * This is the canonical local Stripe-shaped adapter for the current build phase.
 * Real Stripe SDK promotion should replace this adapter in one controlled module,
 * after connector governance, webhook verification, and secret handling are hardened.
 */

export type StripeCheckoutLineItem = {
  price_data?: {
    currency?: string;
    product_data?: {
      name?: string;
    };
    unit_amount?: number;
  };
  quantity?: number;
};

export type StripeCheckoutSessionCreateParams = {
  mode?: "payment" | "subscription";
  payment_method_types?: string[];
  line_items?: StripeCheckoutLineItem[];
  metadata?: Record<string, string | number | boolean | null | undefined>;
  success_url?: string;
  cancel_url?: string;
  customer_email?: string | null;
};

export type StripeCheckoutSession = {
  id: string;
  url: string;
  mode: "payment" | "subscription";
  payment_method_types: string[];
  amount_total: number;
  currency: string;
  customer_email: string | null;
  metadata: Record<string, string>;
  success_url: string;
  cancel_url: string;
};

function normalizeMetadata(
  metadata?: StripeCheckoutSessionCreateParams["metadata"]
): Record<string, string> {
  if (!metadata) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(metadata)
      .filter(([, value]) => value !== null && value !== undefined)
      .map(([key, value]) => [key, String(value)])
  );
}

function calculateAmountTotal(lineItems: StripeCheckoutLineItem[] = []): number {
  return lineItems.reduce((total, item) => {
    const unitAmount = item.price_data?.unit_amount ?? 0;
    const quantity = item.quantity ?? 1;

    return total + unitAmount * quantity;
  }, 0);
}

function resolveCurrency(lineItems: StripeCheckoutLineItem[] = []): string {
  return lineItems[0]?.price_data?.currency ?? "usd";
}

export const stripe = {
  checkout: {
    sessions: {
      create: async (
        params: StripeCheckoutSessionCreateParams
      ): Promise<StripeCheckoutSession> => {
        const successUrl = params.success_url ?? "http://localhost:3000/success";
        const cancelUrl = params.cancel_url ?? "http://localhost:3000/dashboard";

        return {
          id: `stub_checkout_session_${Date.now()}`,
          url: successUrl,
          mode: params.mode ?? "payment",
          payment_method_types: params.payment_method_types ?? ["card"],
          amount_total: calculateAmountTotal(params.line_items),
          currency: resolveCurrency(params.line_items),
          customer_email: params.customer_email ?? null,
          metadata: normalizeMetadata(params.metadata),
          success_url: successUrl,
          cancel_url: cancelUrl,
        };
      },
    },
  },
};
