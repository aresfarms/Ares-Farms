import { publicSurfaceManifests } from "@/lib/modules/moduleRegistry";

import {
  PublicSafeModuleViewModel,
  publicViewModelHasNoRawRecordFields,
  toPublicSafeModuleViewModel,
} from "@/lib/dto/shared";

/**
 * Public DTO Layer
 *
 * Public gateway responses are built from public-safe view models only. Raw
 * backend records, direct identifiers, permissions, dependencies, and event
 * internals are intentionally excluded.
 */

export type PublicSurfaceGatewayPayload = {
  surfaces: PublicSafeModuleViewModel[];
  gatewayControls: {
    classificationFiltering: true;
    claimsGovernance: true;
    audiencePermissions: true;
    redactionRules: true;
    auditLogging: true;
    rateLimitingRequired: true;
    publicSafeFormatting: true;
  };
  productionBlocks: string[];
};

export function buildPublicSurfaceGatewayPayload(): PublicSurfaceGatewayPayload {
  const surfaces = publicSurfaceManifests().map(toPublicSafeModuleViewModel);

  return {
    surfaces,
    gatewayControls: {
      classificationFiltering: true,
      claimsGovernance: true,
      audiencePermissions: true,
      redactionRules: true,
      auditLogging: true,
      rateLimitingRequired: true,
      publicSafeFormatting: true,
    },
    productionBlocks: [
      "no production-live exposure",
      "no public verification claim",
      "no official report publication",
      "no final lending decision",
      "no external notice send",
      "no payment capture",
      "no live external agency call",
      "no raw document-content processing",
    ],
  };
}

export function publicGatewayPayloadIsRedacted(
  payload: PublicSurfaceGatewayPayload
): boolean {
  return payload.surfaces.every(publicViewModelHasNoRawRecordFields);
}
