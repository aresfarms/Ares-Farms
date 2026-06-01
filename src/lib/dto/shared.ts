import { ModuleManifest } from "@/lib/modules/moduleRegistry";

/**
 * Shared DTO and View Model Primitives
 *
 * Master Volume Governance:
 * - Vol I: prevents raw institutional records from leaking across authority
 *   boundaries.
 * - Vol II: protects borrower, lender, sponsor, notice, payment, report, and
 *   regulated-decision disclosure limits.
 * - Vol III: keeps public and partner surfaces behind deterministic DTOs.
 * - Vol III-B: carries classification and permission posture into view models.
 * - Vol IV: supports operator-readable status translation.
 * - Vol V: preserves claims governance, redaction, portability, controlled
 *   disclosure, and source-authority boundaries.
 */

export type SurfaceAudience =
  | "internal"
  | "borrower"
  | "lender"
  | "sponsor"
  | "public";

export type SurfaceStatusMessage =
  | "Your document was received."
  | "Human review is pending."
  | "More information may be needed."
  | "This is not an official report."
  | "No final decision has been made."
  | "No live external action has been performed.";

export type PublicSafeModuleViewModel = {
  id: string;
  title: string;
  route: string;
  audience: SurfaceAudience[];
  statusMessages: SurfaceStatusMessage[];
  claimsProfile: string;
  productionBlocked: boolean;
  publicSurfaceAllowed: boolean;
  replayRequired: boolean;
};

export type InternalModuleViewModel = PublicSafeModuleViewModel & {
  permissions: string[];
  dataDependencies: string[];
  adjacentModules: string[];
  eventsPublished: string[];
  eventsConsumed: string[];
};

export const PUBLIC_SAFE_STATUS_MESSAGES: SurfaceStatusMessage[] = [
  "Your document was received.",
  "Human review is pending.",
  "More information may be needed.",
  "This is not an official report.",
  "No final decision has been made.",
  "No live external action has been performed.",
];

export const REQUIRED_SURFACE_STATUS_MESSAGES: SurfaceStatusMessage[] = [
  "Your document was received.",
  "Human review is pending.",
  "More information may be needed.",
];

function withRequiredSurfaceStatusMessages(
  messages: SurfaceStatusMessage[]
): SurfaceStatusMessage[] {
  return Array.from(
    new Set<SurfaceStatusMessage>([
      ...REQUIRED_SURFACE_STATUS_MESSAGES,
      ...messages,
    ])
  );
}

export function statusMessagesForManifest(
  manifest: ModuleManifest
): SurfaceStatusMessage[] {
  if (manifest.claimsProfile === "advisory-reporting") {
    return withRequiredSurfaceStatusMessages([
      "This is not an official report.",
    ]);
  }

  if (
    manifest.claimsProfile === "live-action-blocked" ||
    manifest.id === "promotion"
  ) {
    return withRequiredSurfaceStatusMessages([
      "No live external action has been performed.",
    ]);
  }

  if (
    manifest.claimsProfile === "borrower-safe" ||
    manifest.id.includes("documents")
  ) {
    return withRequiredSurfaceStatusMessages([]);
  }

  return withRequiredSurfaceStatusMessages([
    "No final decision has been made.",
  ]);
}

export function toPublicSafeModuleViewModel(
  manifest: ModuleManifest
): PublicSafeModuleViewModel {
  return {
    id: manifest.id,
    title: manifest.title,
    route: manifest.route,
    audience: manifest.audience,
    statusMessages: statusMessagesForManifest(manifest),
    claimsProfile: manifest.claimsProfile,
    productionBlocked: manifest.productionBlocked,
    publicSurfaceAllowed: manifest.publicSurfaceAllowed,
    replayRequired: manifest.replayRequired,
  };
}

export function toInternalModuleViewModel(
  manifest: ModuleManifest
): InternalModuleViewModel {
  return {
    ...toPublicSafeModuleViewModel(manifest),
    permissions: manifest.permissions,
    dataDependencies: manifest.dataDependencies,
    adjacentModules: manifest.adjacentModules,
    eventsPublished: manifest.eventsPublished,
    eventsConsumed: manifest.eventsConsumed,
  };
}

export function publicViewModelHasNoRawRecordFields(
  viewModel: PublicSafeModuleViewModel
): boolean {
  return !Object.keys(viewModel).some((key) =>
    [
      "borrower_id",
      "tenant_id",
      "application_id",
      "property_id",
      "dataDependencies",
      "permissions",
      "eventsPublished",
      "eventsConsumed",
    ].includes(key)
  );
}
