import { moduleManifests } from "@/lib/modules/moduleRegistry";

import {
  PublicSafeModuleViewModel,
  toPublicSafeModuleViewModel,
} from "@/lib/dto/shared";

/**
 * Lender DTO Layer
 *
 * Lender views expose coordination posture only. They do not create lender
 * commitments, underwriting decisions, eligibility determinations, or financing
 * reliance.
 */

export function buildLenderModuleViews(): PublicSafeModuleViewModel[] {
  return moduleManifests
    .filter((manifest) => manifest.audience.includes("lender"))
    .map(toPublicSafeModuleViewModel);
}
