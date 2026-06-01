/**
 * Canonical Stripe Export
 *
 * Master Volume Governance:
 * - Vol III: centralizes connector access through one authoritative adapter.
 * - Vol V: prevents duplicate payment connector behavior from drifting.
 */

export { stripe } from "./client";
export type {
  StripeCheckoutLineItem,
  StripeCheckoutSession,
  StripeCheckoutSessionCreateParams,
} from "./client";
