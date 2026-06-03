import { eventContractRegistry } from "@/lib/modules/eventContractRegistry";
import { crossModuleHandoffMap } from "@/lib/modules/handoffMap";
import { moduleManifests } from "@/lib/modules/moduleRegistry";
import {
  PUBLIC_TRUST_BORROWER_PROTECTIONS,
  PUBLIC_TRUST_CANONICAL_DISCLOSURES,
  PUBLIC_TRUST_PRODUCTION_RESTRICTIONS,
  PUBLIC_TRUST_RUNTIME_VERSION,
  PUBLIC_TRUST_WHAT_FURLONG_IS,
  PUBLIC_TRUST_WHAT_FURLONG_IS_NOT,
  evaluatePublicTrustContent,
} from "@/lib/trust/trustPagesRuntime";

/**
 * Public Trust Smoke Test
 *
 * Master Volume Governance:
 * - Vol 0: protects the public orientation translation layer.
 * - Vol I: protects accountable trust content.
 * - Vol II: keeps trust copy from implying approval, eligibility,
 *   credit, underwriting, lender commitment, environmental clearance,
 *   certification, public verification, payment authorization, or
 *   regulatory or legal reliance.
 * - Vol III: validates deterministic, replay-safe trust content
 *   composition and content-claims posture.
 * - Vol III-B: confirms human-review-required posture and governed evidence.
 * - Vol IV: confirms governed handoffs to data rights, readiness, and
 *   financing pathway guidance.
 * - Vol V-VII: confirms registry, contract, handoff, claims policy, and
 *   disclosure conformance.
 */

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function main() {
  const result = evaluatePublicTrustContent({ audience: "public" });

  assert(
    result.runtimeVersion === PUBLIC_TRUST_RUNTIME_VERSION,
    "Public trust runtime must emit the runtime version."
  );
  assert(
    result.productionBlocked === true,
    "Public trust content must remain production-blocked."
  );
  assert(
    result.humanReviewRequired === true,
    "Public trust content must require human review."
  );
  assert(
    result.advisoryOnly === true &&
      result.noApproval === true &&
      result.noGuarantee === true &&
      result.noCertification === true &&
      result.noPublicVerification === true &&
      result.noLegalOrRegulatoryReliance === true &&
      result.publicSurfaceSafe === true,
    "Public trust content must block approval, guarantee, certification, verification, and reliance claims."
  );
  assert(
    result.whatFurlongIs.length >= 4 &&
      result.whatFurlongIsNot.length >= 6 &&
      result.borrowerProtections.length >= 6,
    "Public trust content must compose the canonical orientation catalogs."
  );
  assert(
    result.contentClaimsEvaluation.ok === true &&
      result.contentClaimsEvaluation.blockCount === 0,
    "Public trust content must pass the content-claims policy with zero block findings."
  );
  assert(
    result.contentClaimsEvaluation.policyVersion === "content-claims-policy-v0.1.0",
    "Public trust content must evaluate against the canonical content-claims policy version."
  );
  assert(
    result.canonicalDisclosures.includes(
      "Furlong does not approve, deny, underwrite, determine eligibility, or make credit decisions."
    ),
    "Public trust disclosures must include the no-credit-decision language."
  );
  assert(
    result.canonicalDisclosures.includes(
      "Furlong does not authorize legal or regulatory reliance."
    ),
    "Public trust disclosures must include the no-legal-reliance language."
  );
  assert(
    result.productionRestrictions.includes("no public verification") &&
      result.productionRestrictions.includes("no approval") &&
      result.productionRestrictions.includes("no environmental clearance") &&
      result.productionRestrictions.includes("no certification"),
    "Public trust production restrictions must block approval, certification, public verification, and environmental clearance."
  );
  assert(
    PUBLIC_TRUST_CANONICAL_DISCLOSURES.includes(
      "Your document was received."
    ) &&
      PUBLIC_TRUST_CANONICAL_DISCLOSURES.includes(
        "Human review is pending."
      ) &&
      PUBLIC_TRUST_CANONICAL_DISCLOSURES.includes(
        "More information may be needed."
      ),
    "Public trust canonical disclosures must include the required surface status messages."
  );
  assert(
    PUBLIC_TRUST_WHAT_FURLONG_IS.length === result.whatFurlongIs.length,
    "Public trust runtime must surface every What-Furlong-Is item."
  );
  assert(
    PUBLIC_TRUST_WHAT_FURLONG_IS_NOT.length === result.whatFurlongIsNot.length,
    "Public trust runtime must surface every What-Furlong-Is-Not item."
  );
  assert(
    PUBLIC_TRUST_BORROWER_PROTECTIONS.length ===
      result.borrowerProtections.length,
    "Public trust runtime must surface every borrower protection."
  );
  assert(
    PUBLIC_TRUST_PRODUCTION_RESTRICTIONS.includes("no approval"),
    "Public trust production restriction constants must include the no-approval boundary."
  );

  const referrerResult = evaluatePublicTrustContent({
    audience: "borrower",
    referrerRoute: "/readiness",
  });

  assert(
    referrerResult.handoffs.every(
      (handoff) => handoff.route !== "/readiness"
    ),
    "Public trust handoffs must filter the referring route."
  );

  const aboutManifest = moduleManifests.find(
    (manifest) => manifest.id === "public-about"
  );
  assert(
    aboutManifest !== undefined,
    "Public About Furlong module manifest must be registered."
  );
  assert(
    aboutManifest.productionBlocked && aboutManifest.replayRequired,
    "Public About Furlong module must remain production-blocked and replay-required."
  );
  assert(
    aboutManifest.publicSurfaceAllowed === true,
    "Public About Furlong module must be a public surface."
  );
  assert(
    aboutManifest.claimsProfile === "public-safe",
    "Public About Furlong module must use the public-safe claims profile."
  );

  const trustManifest = moduleManifests.find(
    (manifest) => manifest.id === "public-trust"
  );
  assert(
    trustManifest !== undefined,
    "Public Trust module manifest must be registered."
  );
  assert(
    trustManifest.productionBlocked && trustManifest.replayRequired,
    "Public Trust module must remain production-blocked and replay-required."
  );
  assert(
    trustManifest.publicSurfaceAllowed === true,
    "Public Trust module must be a public surface."
  );
  assert(
    trustManifest.eventsPublished.includes("public.trust.viewed"),
    "Public Trust module must publish the trust viewed event."
  );

  const contract = eventContractRegistry.find(
    (eventContract) => eventContract.eventType === "public.trust.viewed"
  );
  assert(
    contract !== undefined,
    "Public trust viewed event contract must be registered."
  );
  assert(
    contract.productionBlocked && contract.replayRequired,
    "Public trust event contract must be production-blocked and replay-required."
  );
  assert(
    contract.classificationLevel === "PUBLIC",
    "Public trust event contract must be PUBLIC."
  );
  assert(
    contract.publicSurfaceAllowed === true,
    "Public trust event contract must be public-surface allowed."
  );
  assert(
    contract.purpose.includes("without approval"),
    "Public trust event contract must preserve no-approval purpose language."
  );

  const handoffs = crossModuleHandoffMap.filter(
    (handoff) =>
      handoff.fromModuleId === "public-trust" ||
      handoff.toModuleId === "public-trust"
  );
  assert(
    handoffs.length >= 3,
    "Public trust module must have at least three governed handoff routes."
  );
  assert(
    handoffs.every(
      (handoff) => handoff.productionBlocked && handoff.humanReviewBoundary
    ),
    "Every public trust handoff must remain production-blocked and human-review-bound."
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        runtimeVersion: result.runtimeVersion,
        contentClaimsOk: result.contentClaimsEvaluation.ok,
        contentClaimsPolicy: result.contentClaimsEvaluation.policyVersion,
        whatFurlongIs: result.whatFurlongIs.length,
        whatFurlongIsNot: result.whatFurlongIsNot.length,
        borrowerProtections: result.borrowerProtections.length,
        disclosures: result.canonicalDisclosures.length,
        handoffs: handoffs.length,
        message: "Public trust smoke test passed.",
      },
      null,
      2
    )
  );
}

main();
