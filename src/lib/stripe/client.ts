import Stripe from "stripe";

/**
 * Canonical Stripe Client Adapter
 *
 * Security posture:
 * - Local development may use a deterministic stub when STRIPE_SECRET_KEY is
 *   absent and NODE_ENV !== production.
 * - Production-like environments fail closed when the Stripe secret is missing.
 * - Webhook verification must always use STRIPE_WEBHOOK_SECRET separately.
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
  payment_intent_data?: {
    metadata?: Record<string, string | number | boolean | null | undefined>;
    transfer_group?: string;
  };
  payment_method_options?: {
    card?: { request_three_d_secure?: "automatic" | "any" | "challenge" };
  };
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

export type StripeRuntimeMode = "stub" | "live";

function stripeSecretKey(): string | null {
  const value = process.env.STRIPE_SECRET_KEY?.trim();
  return value && value.length > 0 ? value : null;
}

export function stripeRuntimeMode(): StripeRuntimeMode {
  return stripeSecretKey() ? "live" : "stub";
}

export function stripeConfiguredForLivePayments(): boolean {
  return stripeRuntimeMode() === "live";
}

export function assertStripeCheckoutAvailable(): void {
  if (!stripeSecretKey() && process.env.NODE_ENV === "production") {
    throw new Error("STRIPE_SECRET_KEY is not configured for this production environment.");
  }
}

function stripeSdk(): Stripe {
  const secret = stripeSecretKey();
  if (!secret) {
    throw new Error("STRIPE_SECRET_KEY is not configured.");
  }
  return new Stripe(secret);
}

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

async function createLiveCheckoutSession(
  params: StripeCheckoutSessionCreateParams
): Promise<StripeCheckoutSession> {
  const sdk = stripeSdk();
  const session = await sdk.checkout.sessions.create({
    mode: params.mode ?? "payment",
    payment_method_types: (params.payment_method_types ??
      ["card"]) as NonNullable<
      Parameters<typeof sdk.checkout.sessions.create>[0]
    >["payment_method_types"],
    line_items: (params.line_items ?? []).map((item) => ({
      price_data: item.price_data
        ? {
            currency: item.price_data.currency ?? "usd",
            product_data: {
              name: item.price_data.product_data?.name ?? "Furlong purchase",
            },
            unit_amount: item.price_data.unit_amount ?? 0,
          }
        : undefined,
      quantity: item.quantity ?? 1,
    })),
    metadata: normalizeMetadata(params.metadata),
    payment_method_options: params.payment_method_options,
    payment_intent_data: params.payment_intent_data
      ? {
          metadata: normalizeMetadata(params.payment_intent_data.metadata),
          transfer_group: params.payment_intent_data.transfer_group,
        }
      : undefined,
    success_url: params.success_url ?? "http://localhost:3000/success",
    cancel_url: params.cancel_url ?? "http://localhost:3000/dashboard",
    customer_email: params.customer_email ?? undefined,
  });

  return {
    id: session.id,
    url: session.url ?? params.success_url ?? "http://localhost:3000/success",
    mode: (session.mode as "payment" | "subscription") ?? (params.mode ?? "payment"),
    payment_method_types: session.payment_method_types ?? ["card"],
    amount_total: session.amount_total ?? 0,
    currency: session.currency ?? "usd",
    customer_email: session.customer_email ?? null,
    metadata: Object.fromEntries(
      Object.entries(session.metadata ?? {}).map(([key, value]) => [key, value ?? ""])
    ),
    success_url: params.success_url ?? "http://localhost:3000/success",
    cancel_url: params.cancel_url ?? "http://localhost:3000/dashboard",
  };
}

async function createStubCheckoutSession(
  params: StripeCheckoutSessionCreateParams
): Promise<StripeCheckoutSession> {
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
}

/**
 * Stripe Identity — verification sessions.
 *
 * THE STUB HERE CAN NEVER RETURN "verified", AND THAT IS THE WHOLE POINT.
 * The checkout stub above may safely fake a success, because a fake payment
 * harms nobody in local dev. A fake IDENTITY does: it would raise a subject to
 * the `identity-verified` assurance tier and unlock financial-document upload,
 * bank connection, and signing — on the strength of a stub. So the stub path
 * returns `requires_input` forever and says why.
 */
export type StripeIdentitySession = {
  id: string;
  status: "requires_input" | "processing" | "verified" | "canceled";
  url: string | null;
  last_error: { code?: string | null } | null;
  metadata: Record<string, string>;
  verified_outputs?: { first_name?: string | null; last_name?: string | null } | null;
};

export type StripeIdentitySessionCreateParams = {
  type: "document";
  options?: { document?: { require_matching_selfie?: boolean } };
  return_url: string;
  metadata?: Record<string, string | number | boolean | null | undefined>;
};

async function createLiveIdentitySession(
  params: StripeIdentitySessionCreateParams
): Promise<StripeIdentitySession> {
  const sdk = stripeSdk();
  const session = await sdk.identity.verificationSessions.create({
    type: params.type,
    options: params.options,
    return_url: params.return_url,
    metadata: normalizeMetadata(params.metadata),
  });
  return {
    id: session.id,
    status: session.status as StripeIdentitySession["status"],
    url: session.url ?? null,
    last_error: session.last_error ? { code: session.last_error.code ?? null } : null,
    metadata: Object.fromEntries(
      Object.entries(session.metadata ?? {}).map(([key, value]) => [key, value ?? ""])
    ),
  };
}

async function retrieveLiveIdentitySession(id: string): Promise<StripeIdentitySession> {
  const sdk = stripeSdk();
  const session = await sdk.identity.verificationSessions.retrieve(id, {
    expand: ["verified_outputs"],
  });
  const outputs = (session as unknown as {
    verified_outputs?: { first_name?: string | null; last_name?: string | null } | null;
  }).verified_outputs;
  return {
    id: session.id,
    status: session.status as StripeIdentitySession["status"],
    url: session.url ?? null,
    last_error: session.last_error ? { code: session.last_error.code ?? null } : null,
    metadata: Object.fromEntries(
      Object.entries(session.metadata ?? {}).map(([key, value]) => [key, value ?? ""])
    ),
    verified_outputs: outputs ?? null,
  };
}

function stubIdentitySession(id: string, metadata: Record<string, string>): StripeIdentitySession {
  return {
    id,
    // NEVER "verified". See the note above.
    status: "requires_input",
    url: null,
    last_error: { code: "identity_provider_not_configured" },
    metadata,
    verified_outputs: null,
  };
}

export const stripe = {
  checkout: {
    sessions: {
      create: async (
        params: StripeCheckoutSessionCreateParams
      ): Promise<StripeCheckoutSession> => {
        if (stripeConfiguredForLivePayments()) {
          return createLiveCheckoutSession(params);
        }

        assertStripeCheckoutAvailable();
        return createStubCheckoutSession(params);
      },
    },
  },
  identity: {
    verificationSessions: {
      create: async (
        params: StripeIdentitySessionCreateParams
      ): Promise<StripeIdentitySession> => {
        if (stripeConfiguredForLivePayments()) {
          return createLiveIdentitySession(params);
        }
        return stubIdentitySession(
          `stub_identity_session_${Date.now()}`,
          normalizeMetadata(params.metadata)
        );
      },
      retrieve: async (id: string, _options?: unknown): Promise<StripeIdentitySession> => {
        void _options;
        if (stripeConfiguredForLivePayments()) {
          return retrieveLiveIdentitySession(id);
        }
        return stubIdentitySession(id, {});
      },
    },
  },
};
