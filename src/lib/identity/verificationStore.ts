/**
 * verificationStore — applying a Stripe Identity outcome to our own record.
 *
 * LIVES IN lib, NOT IN THE ROUTE. The Stripe webhook needs this, and a route
 * importing another route makes the webhook bundle the identity route's entire
 * module graph — it typechecks and then surprises you at runtime. Shared
 * behaviour belongs in a module both routes can import.
 *
 * `verified` is set HERE and nowhere else, and only ever from a caller that has
 * already verified Stripe's webhook signature.
 */

import { eq } from "drizzle-orm";

import { identityVerifications } from "@/db/schema";
import { db } from "@/lib/db";
import { IDENTITY_PROVIDER, namesMatch, readVerificationOutcome } from "@/lib/identity/stripeIdentity";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";

/**
 * Applied from the Stripe webhook ONLY, after signature verification.
 * Exported rather than inlined so the webhook has one obvious call and the
 * name-match logic lives beside the record it describes.
 */
export async function applyVerificationOutcome(providerSessionId: string, traceId: string) {
  const outcome = await readVerificationOutcome(providerSessionId);
  const [existing] = await db
    .select()
    .from(identityVerifications)
    .where(eq(identityVerifications.providerSessionId, providerSessionId))
    .limit(1);
  if (!existing) return null;

  const requestName = (existing.metadata as Record<string, unknown> | null)?.requestName;
  const matched = namesMatch(
    outcome.verifiedName,
    typeof requestName === "string" ? requestName : null
  );

  await db
    .update(identityVerifications)
    .set({
      status: outcome.status,
      verified: outcome.verified,
      nameMatchedRequest: matched,
      lastErrorCode: outcome.lastErrorCode,
      verifiedAt: outcome.verified ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(identityVerifications.id, existing.id));

  await createObservabilityEvent({
    eventType: outcome.verified ? "IDENTITY_VERIFICATION_VERIFIED" : "IDENTITY_VERIFICATION_RESOLVED",
    domain: "security",
    severity: outcome.verified && matched === false ? "WARN" : "INFO",
    message:
      outcome.verified && matched === false
        ? "Identity verified, but the verified name does not match the name on the request — human review required."
        : `Identity verification resolved: ${outcome.status}.`,
    traceId,
    replayRef: traceId,
    actorId: `identity-provider:${IDENTITY_PROVIDER}`,
    module: "api.identity.verify",
    metadata: {
      subjectRef: existing.subjectRef,
      providerSessionId,
      status: outcome.status,
      verified: outcome.verified,
      nameMatchedRequest: matched,
    },
  });

  return { verified: outcome.verified, nameMatchedRequest: matched, status: outcome.status };
}
