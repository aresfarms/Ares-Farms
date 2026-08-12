import Stripe from "stripe";
import {
  assertStripeConnectTransferExecutionAllowed,
  buildStripeTransferPlan,
  StripeConnectAllocationEvidence,
} from "./runtime";

function stripeSecretKey(): string {
  const value = process.env.STRIPE_SECRET_KEY?.trim();
  if (!value) {
    throw new Error("STRIPE_SECRET_KEY is not configured.");
  }
  return value;
}

export function stripeConnectRecipientRegistryFromEnv() {
  return {
    CAITLIN: {
      connectedAccountRef: process.env.STRIPE_CONNECT_CAITLIN_ACCOUNT_ID?.trim() || null,
      certified: process.env.STRIPE_CONNECT_CAITLIN_CERTIFIED === "true",
    },
    STUART: {
      connectedAccountRef: process.env.STRIPE_CONNECT_STUART_ACCOUNT_ID?.trim() || null,
      certified: process.env.STRIPE_CONNECT_STUART_CERTIFIED === "true",
    },
  } as const;
}

export async function executeStripeConnectTransfers(
  evidence: StripeConnectAllocationEvidence
) {
  assertStripeConnectTransferExecutionAllowed(evidence);
  const sdk = new Stripe(stripeSecretKey());
  const plan = buildStripeTransferPlan(evidence);
  const results = [];
  for (const item of plan) {
    if (!item.executionAllowed || !item.destination || !item.sourceTransaction) {
      throw new Error(`Transfer execution blocked for ${item.recipient}.`);
    }
    const transfer = await sdk.transfers.create({
      amount: item.amount,
      currency: item.currency,
      destination: item.destination,
      source_transaction: item.sourceTransaction,
      transfer_group: item.transferGroup,
      metadata: item.metadata,
    });
    results.push({ recipient: item.recipient, transferId: transfer.id, amount: item.amount });
  }
  return results;
}
