import { buildPublicSurfaceGatewayPayload } from "@/lib/dto/public";
import { evaluateContentClaims } from "@/lib/governance/contentClaimsPolicy";

/**
 * Public Claims Smoke Test
 *
 * Verifies that public-safe DTO text stays inside governed claims policy.
 */

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function main() {
  const payload = buildPublicSurfaceGatewayPayload();
  const evaluation = evaluateContentClaims({
    text: [
      ...payload.surfaces.map((surface) =>
        [
          surface.title,
          surface.route,
          surface.claimsProfile,
          ...surface.statusMessages,
        ].join(" ")
      ),
      ...payload.productionBlocks,
    ],
    context: {
      publicVerificationGatewayOperational: false,
      canonicalHashVerificationOperational: false,
      officialDecisionAuthority: false,
    },
  });

  assert(evaluation.ok, "Public surface claims must pass content governance.");

  console.log(
    JSON.stringify(
      {
        ok: true,
        checkedAt: new Date().toISOString(),
        policyVersion: evaluation.policyVersion,
        surfaceCount: payload.surfaces.length,
        findingCount: evaluation.findingCount,
        message: "Public claims smoke test passed.",
      },
      null,
      2
    )
  );
}

main();
