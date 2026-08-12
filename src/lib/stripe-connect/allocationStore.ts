import { eq } from "drizzle-orm";
import { stripeConnectAllocations } from "@/db/schema";
import { db } from "@/lib/db";
import type { RevenueClass } from "./founderEconomics";
import type { StripeConnectAllocationEvidence, StripeConnectAllocationRule } from "./runtime";

export async function persistStripeConnectAllocation(input: {
  evidence: StripeConnectAllocationEvidence;
  rule: StripeConnectAllocationRule;
  revenueClass: RevenueClass;
  traceId: string;
  replayRef: string;
  transferExecutionPerformed?: boolean;
}) {
  const caitlin = input.evidence.allocations.find((item) => item.recipient === "CAITLIN");
  const stuart = input.evidence.allocations.find((item) => item.recipient === "STUART");

  const rows = await db.insert(stripeConnectAllocations).values({
    evidenceId: input.evidence.evidenceId,
    evidenceSha256: input.evidence.evidenceSha256,
    paymentRef: input.evidence.paymentRef,
    sourceTransactionRef: input.evidence.sourceTransactionRef,
    transferGroup: input.evidence.transferGroup,
    grossAmount: input.evidence.grossAmount,
    currency: input.evidence.currency,
    revenueClass: input.revenueClass,
    ruleId: input.rule.ruleId,
    ruleVersion: input.rule.version,
    ruleStatus: input.rule.status,
    caitlinBasisPoints: input.rule.caitlinBasisPoints,
    stuartBasisPoints: input.rule.stuartBasisPoints,
    caitlinAmount: caitlin?.amount ?? 0,
    stuartAmount: stuart?.amount ?? 0,
    furlongRetainedAmount: input.evidence.furlongRetainedAmount,
    caitlinConnectedAccountRef: caitlin?.connectedAccountRef ?? null,
    stuartConnectedAccountRef: stuart?.connectedAccountRef ?? null,
    caitlinRecipientCertified: Boolean(caitlin?.transferEligible),
    stuartRecipientCertified: Boolean(stuart?.transferEligible),
    transferPromotionActive: false,
    transferExecutionPerformed: input.transferExecutionPerformed ?? false,
    approvedByRefs: input.rule.approvedByRefs,
    allocationPayload: input.evidence,
    governanceVersion: input.evidence.governanceVersion,
    classification: "RESTRICTED",
    replayRef: input.replayRef,
    traceId: input.traceId,
    generatedAt: new Date(input.evidence.generatedAt),
  }).onConflictDoNothing({ target: stripeConnectAllocations.evidenceId }).returning();

  if (rows[0]) return rows[0];

  const existing = await db
    .select()
    .from(stripeConnectAllocations)
    .where(eq(stripeConnectAllocations.evidenceId, input.evidence.evidenceId))
    .limit(1);

  if (!existing[0]) {
    throw new Error("Stripe Connect allocation evidence persistence failed.");
  }

  return existing[0];
}
