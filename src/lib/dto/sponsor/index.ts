import { moduleManifests } from "@/lib/modules/moduleRegistry";

import {
  PublicSafeModuleViewModel,
  toPublicSafeModuleViewModel,
} from "@/lib/dto/shared";

/**
 * Sponsor DTO Layer
 *
 * Sponsor views expose coordination and readiness posture only. They do not
 * create sponsor commitments, borrower disclosures, official reports, or
 * production promotion.
 */

export function buildSponsorModuleViews(): PublicSafeModuleViewModel[] {
  return moduleManifests
    .filter((manifest) => manifest.audience.includes("sponsor"))
    .map(toPublicSafeModuleViewModel);
}
