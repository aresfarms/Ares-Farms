import Stripe from "stripe";
import { and, desc, eq } from "drizzle-orm";

import { serviceRequests } from "@/db/schema";
import { db } from "@/lib/db";
import { persistServiceRequest } from "@/lib/serviceRequests/serviceRequestStore";

export type FounderConnectRecipient = "CAITLIN";

const RECIPIENTS = {
  CAITLIN: { email: "chudson@aresfarmsinc.com", label: "Caitlin Hudson" },
} as const;

function sdk(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured.");
  return new Stripe(key);
}

export function recipientDefinition(recipient: FounderConnectRecipient) {
  return RECIPIENTS[recipient];
}
async function latestAccountRecord(recipient: FounderConnectRecipient) {
  const rows = await db.select().from(serviceRequests).where(and(
    eq(serviceRequests.requestType, "stripe_connect_account_onboarding"),
    eq(serviceRequests.contactEmail, RECIPIENTS[recipient].email),
  )).orderBy(desc(serviceRequests.updatedAt)).limit(10);
  return rows.find((row) => {
    const m = (row.metadata ?? {}) as Record<string, unknown>;
    return m.recipient === recipient && typeof m.stripeAccountId === "string";
  }) ?? null;
}

export async function ensureFounderConnectedAccount(recipient: FounderConnectRecipient, traceId: string) {
  const existing = await latestAccountRecord(recipient);
  const existingId = (existing?.metadata as Record<string, unknown> | null)?.stripeAccountId;
  if (typeof existingId === "string" && existingId.startsWith("acct_")) return existingId;

  const account = await sdk().accounts.create({
    type: "express", country: "US", email: RECIPIENTS[recipient].email,
    capabilities: { transfers: { requested: true } },
    metadata: { furlongRecipient: recipient, governanceVersion: "stripe-connect-onboarding-v1" },
  });
  await persistServiceRequest({
    traceId, serviceRequestId: `stripe-connect-${recipient.toLowerCase()}-${Date.now()}`,
    requestType: "stripe_connect_account_onboarding", serviceCode: "stripe_connect",
    status: "ONBOARDING_REQUIRED", routedTo: "stripe-connect",
    contactName: RECIPIENTS[recipient].label, contactEmail: RECIPIENTS[recipient].email,
    consentAcknowledged: true, humanReviewRequired: false,
    metadata: { recipient, stripeAccountId: account.id, testMode: process.env.STRIPE_SECRET_KEY?.trim().startsWith("sk_test_") === true },
  });
  return account.id;
}
export async function createFounderOnboardingLink(
  recipient: FounderConnectRecipient,
  traceId: string,
  baseUrl: string,
) {
  const accountId = await ensureFounderConnectedAccount(recipient, traceId);
  const link = await sdk().accountLinks.create({
    account: accountId,
    refresh_url: `${baseUrl}/governance/stripe-connect?recipient=${recipient}&refresh=1`,
    return_url: `${baseUrl}/governance/stripe-connect?recipient=${recipient}&returned=1`,
    type: "account_onboarding",
    collection_options: { fields: "eventually_due", future_requirements: "include" },
  });
  return { accountId, url: link.url, expiresAt: link.expires_at };
}

export async function founderConnectStatus(recipient: FounderConnectRecipient) {
  const row = await latestAccountRecord(recipient);
  const accountId = (row?.metadata as Record<string, unknown> | null)?.stripeAccountId;
  if (typeof accountId !== "string") return { exists: false as const, recipient };
  const account = await sdk().accounts.retrieve(accountId, { expand: ["external_accounts"] });
  if (account.deleted) return { exists: false as const, recipient };
  const banks = account.external_accounts?.data.filter((item) => item.object === "bank_account") ?? [];
  return {
    exists: true as const, recipient, accountId: account.id, testMode: process.env.STRIPE_SECRET_KEY?.trim().startsWith("sk_test_") === true,
    detailsSubmitted: account.details_submitted, chargesEnabled: account.charges_enabled,
    payoutsEnabled: account.payouts_enabled,
    currentlyDue: account.requirements?.currently_due ?? [],
    eventuallyDue: account.requirements?.eventually_due ?? [],
    disabledReason: account.requirements?.disabled_reason ?? null,
    bankAccounts: banks.map((bank) => ({ id: bank.id, bankName: bank.bank_name,
      last4: bank.last4, currency: bank.currency, status: bank.status, defaultForCurrency: bank.default_for_currency })),
  };
}
