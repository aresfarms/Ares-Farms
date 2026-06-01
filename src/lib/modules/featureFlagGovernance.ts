/**
 * Module Feature Flag Governance
 *
 * Master Volume Governance:
 * - Vol I: keeps constitutional activation authority explicit.
 * - Vol II: prevents production, notice, payment, document, and external
 *   action states from activating through UI drift.
 * - Vol III: provides deterministic activation state for module runtimes.
 * - Vol III-B: exposes controlled runtime posture for shell and gateway use.
 * - Vol IV: supports operator stop/start, incident, rollback, and promotion
 *   runbooks.
 * - Vol V: preserves source authority, classification, replay, claims, and
 *   controlled-disclosure boundaries.
 *
 * Supplemental integration sources:
 * - Ares_Furlong_Module_Integration_Expansion_Requirements.docx
 * - Ares_Furlong_Platform_Integration_Architecture.docx
 */

export type ModuleFeatureFlagName =
  | "module_enabled"
  | "public_surface_enabled"
  | "production_live_enabled"
  | "external_actions_enabled"
  | "payment_capture_enabled"
  | "notice_send_enabled"
  | "raw_document_processing_enabled";

export type ModuleFeatureFlags = Record<ModuleFeatureFlagName, boolean>;

export type ModuleActivationState = {
  moduleId: string;
  flags: ModuleFeatureFlags;
  productionBlocked: boolean;
  publicSurfaceBlocked: boolean;
  externalActionsBlocked: boolean;
  paymentCaptureBlocked: boolean;
  noticeSendBlocked: boolean;
  rawDocumentProcessingBlocked: boolean;
  evaluatedAt: string;
};

export const DEFAULT_MODULE_FEATURE_FLAGS: ModuleFeatureFlags = {
  module_enabled: true,
  public_surface_enabled: false,
  production_live_enabled: false,
  external_actions_enabled: false,
  payment_capture_enabled: false,
  notice_send_enabled: false,
  raw_document_processing_enabled: false,
};

export const MODULE_FEATURE_FLAG_REQUIREMENTS: ModuleFeatureFlagName[] = [
  "module_enabled",
  "public_surface_enabled",
  "production_live_enabled",
  "external_actions_enabled",
  "payment_capture_enabled",
  "notice_send_enabled",
  "raw_document_processing_enabled",
];

export function createModuleFeatureFlags(
  overrides: Partial<ModuleFeatureFlags> = {}
): ModuleFeatureFlags {
  return {
    ...DEFAULT_MODULE_FEATURE_FLAGS,
    ...overrides,
  };
}

export function evaluateModuleActivationState(input: {
  moduleId: string;
  flags?: Partial<ModuleFeatureFlags>;
  productionBlocked?: boolean;
}): ModuleActivationState {
  const flags = createModuleFeatureFlags(input.flags);
  const productionBlocked =
    input.productionBlocked ?? !flags.production_live_enabled;

  return {
    moduleId: input.moduleId,
    flags,
    productionBlocked,
    publicSurfaceBlocked: !flags.public_surface_enabled,
    externalActionsBlocked: !flags.external_actions_enabled,
    paymentCaptureBlocked: !flags.payment_capture_enabled,
    noticeSendBlocked: !flags.notice_send_enabled,
    rawDocumentProcessingBlocked: !flags.raw_document_processing_enabled,
    evaluatedAt: new Date().toISOString(),
  };
}

export function moduleFeatureFlagsComplete(
  flags: Partial<ModuleFeatureFlags>
): boolean {
  return MODULE_FEATURE_FLAG_REQUIREMENTS.every(
    (flagName) => typeof flags[flagName] === "boolean"
  );
}
