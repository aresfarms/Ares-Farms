import {
  claimQueuedPropertyComparisonItems,
  recordPropertyComparisonVerification,
} from "@/lib/intelligence/propertyComparisonStore";
import { verifyImportedPropertyAddress } from "@/lib/property/importedPropertyVerification";

export async function processPropertyComparisonVerificationBatch(input: {
  limit?: number;
  traceId: string;
}) {
  const claimed = await claimQueuedPropertyComparisonItems({
    limit: Math.min(input.limit ?? 5, 10),
    traceId: input.traceId,
  });
  const results: Array<{
    itemId: string;
    comparisonId: string;
    status: "VERIFIED" | "UNVERIFIABLE";
    normalizedAddress: string | null;
  }> = [];

  // Deliberately bounded and sequential. The underlying verifier performs
  // governed public-source calls; large comparisons advance through repeated
  // worker invocations rather than creating a 1,000-request burst.
  for (const item of claimed) {
    try {
      const verification = await verifyImportedPropertyAddress({
        propertyId: "imported:comparison:" + item.id,
        exactAddress: item.submittedAddress,
        location: item.submittedAddress,
        rawInput: item.submittedAddress,
      });
      const verified = verification.status === "verified" || verification.status === "partial";
      await recordPropertyComparisonVerification({
        itemId: item.id,
        comparisonId: item.comparisonId,
        verified,
        normalizedAddress: verification.normalizedAddress,
        propertyId: verified ? "imported:comparison:" + item.id : null,
        failureCode: verified ? null : verification.status.toUpperCase(),
        evidenceRefs: [input.traceId],
        resultSnapshot: {
          verificationStatus: verification.status,
          parsedAddress: verification.parsedAddress,
          restrictions: verification.restrictions,
          warnings: verification.warnings,
          geocode: verification.geocode,
          lookupOutcomes: verification.lookupOutcomes,
          rankingEligible: false,
          nextRequiredStage: verified ? "FULL_PROPERTY_ANALYSIS" : null,
        },
        traceId: input.traceId,
      });
      results.push({
        itemId: item.id,
        comparisonId: item.comparisonId,
        status: verified ? "VERIFIED" : "UNVERIFIABLE",
        normalizedAddress: verification.normalizedAddress,
      });
    } catch {
      await recordPropertyComparisonVerification({
        itemId: item.id,
        comparisonId: item.comparisonId,
        verified: false,
        failureCode: "VERIFICATION_ERROR",
        evidenceRefs: [input.traceId],
        resultSnapshot: {
          rankingEligible: false,
          errorSafe: true,
          nextAction: "Retry or review the submitted address.",
        },
        traceId: input.traceId,
      });
      results.push({
        itemId: item.id,
        comparisonId: item.comparisonId,
        status: "UNVERIFIABLE",
        normalizedAddress: null,
      });
    }
  }
  return { claimed: claimed.length, processed: results.length, results };
}
