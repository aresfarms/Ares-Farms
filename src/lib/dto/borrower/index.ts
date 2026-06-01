import { moduleManifests } from "@/lib/modules/moduleRegistry";

import {
  PublicSafeModuleViewModel,
  toPublicSafeModuleViewModel,
} from "@/lib/dto/shared";

/**
 * Borrower DTO Layer
 *
 * Borrower views expose safe translated status only. They do not expose raw
 * backend records, approvals, eligibility, underwriting outcomes, official
 * reports, or external verification claims.
 */

export function buildBorrowerModuleViews(): PublicSafeModuleViewModel[] {
  return moduleManifests
    .filter((manifest) => manifest.audience.includes("borrower"))
    .map(toPublicSafeModuleViewModel);
}
