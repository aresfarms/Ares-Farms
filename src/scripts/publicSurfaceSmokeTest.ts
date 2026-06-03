import fs from "fs";
import path from "path";

import {
  buildPublicSurfaceGatewayPayload,
  publicGatewayPayloadIsRedacted,
} from "@/lib/dto/public";
import {
  buildPublicSourceIntelligencePayload,
  publicSourceIntelligencePayloadIsRedacted,
} from "@/lib/dto/publicSourceIntelligence";
import { REQUIRED_SURFACE_STATUS_MESSAGES } from "@/lib/dto/shared";

/**
 * Public Surface Gateway Smoke Test
 *
 * Verifies that the public DTO layer and /api/public gateway surface exist and
 * return redacted, production-blocked translation metadata.
 */

const repoRoot = process.cwd();

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function exists(pathname: string): boolean {
  return fs.existsSync(path.join(repoRoot, pathname));
}

function main() {
  const requiredPaths = [
    "src/lib/dto/internal/index.ts",
    "src/lib/dto/borrower/index.ts",
    "src/lib/dto/lender/index.ts",
    "src/lib/dto/sponsor/index.ts",
    "src/lib/dto/public/index.ts",
    "src/lib/dto/publicSourceIntelligence.ts",
    "src/lib/source-stack/publicSourceIntelligenceApi.ts",
    "src/app/api/public/surfaces/route.ts",
    "src/app/api/public/grants/route.ts",
    "src/app/api/public/property-discovery/route.ts",
    "src/app/api/public/equipment/route.ts",
    "src/app/api/public/market-context/route.ts",
    "src/app/api/public/weather-risk/route.ts",
  ];

  for (const pathname of requiredPaths) {
    assert(exists(pathname), `${pathname} is required for public surface DTOs.`);
  }

  const payload = buildPublicSurfaceGatewayPayload();

  assert(payload.surfaces.length > 0, "Public surface payload must include surfaces.");
  assert(
    publicGatewayPayloadIsRedacted(payload),
    "Public surface payload must not expose raw backend fields."
  );
  assert(
    payload.surfaces.every((surface) => surface.productionBlocked),
    "Public surfaces must remain production-blocked."
  );
  assert(
    payload.surfaces.every((surface) =>
      REQUIRED_SURFACE_STATUS_MESSAGES.every((message) =>
        surface.statusMessages.includes(message)
      )
    ),
    "Public surfaces must include the required safe status messages."
  );
  assert(
    payload.gatewayControls.classificationFiltering &&
      payload.gatewayControls.claimsGovernance &&
      payload.gatewayControls.audiencePermissions &&
      payload.gatewayControls.redactionRules &&
      payload.gatewayControls.auditLogging &&
      payload.gatewayControls.rateLimitingRequired &&
      payload.gatewayControls.publicSafeFormatting,
    "Public surface gateway controls must all be declared."
  );

  const sourcePayloads = [
    buildPublicSourceIntelligencePayload("grants"),
    buildPublicSourceIntelligencePayload("property-discovery"),
    buildPublicSourceIntelligencePayload("equipment"),
    buildPublicSourceIntelligencePayload("market-context"),
    buildPublicSourceIntelligencePayload("weather-risk"),
  ];

  assert(
    sourcePayloads.every((sourcePayload) => sourcePayload.items.length > 0),
    "Public source intelligence payloads must expose public-safe items."
  );
  assert(
    sourcePayloads.every(publicSourceIntelligencePayloadIsRedacted),
    "Public source intelligence payloads must not expose raw backend fields."
  );
  assert(
    sourcePayloads.every(
      (sourcePayload) =>
        sourcePayload.controls.publicDtoOnly &&
        sourcePayload.controls.claimsGovernance &&
        sourcePayload.controls.humanReviewRequired &&
        sourcePayload.controls.productionBlocked &&
        sourcePayload.controls.liveFetchAllowed === false
    ),
    "Public source intelligence controls must preserve DTO, claims, review, production-block, and no-live-fetch posture."
  );
  assert(
    sourcePayloads.every((sourcePayload) =>
      REQUIRED_SURFACE_STATUS_MESSAGES.every((message) =>
        sourcePayload.statusMessages.includes(message)
      )
    ),
    "Public source intelligence payloads must include the required safe status messages."
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        checkedAt: new Date().toISOString(),
        surfaceCount: payload.surfaces.length,
        publicSourceIntelligenceSurfaces: sourcePayloads.length,
        message: "Public surface gateway smoke test passed.",
      },
      null,
      2
    )
  );
}

main();
