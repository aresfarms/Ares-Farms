import {
  ClassificationMetadata,
  createClassificationMetadata,
} from "@/lib/runtime/classificationRuntime";

/**
 * Shared Case Context Layer
 *
 * Master Volume Governance:
 * - Vol I: provides a single accountable case context across vertical modules.
 * - Vol II: preserves borrower, application, property, and audit boundaries.
 * - Vol III: supports canonical identifiers and replay-safe coordination.
 * - Vol III-B: keeps classification and runtime status visible.
 * - Vol IV: supports operational handoff, escalation, and case recovery.
 * - Vol V: preserves controlled disclosure, classification, replay, and
 *   explainability context.
 */

export type SharedCaseContext = {
  case_id: string;
  borrower_id: string | null;
  application_id: string | null;
  property_id: string | null;
  current_stage: string;
  active_holds: string[];
  related_modules: string[];
  audit_refs: string[];
  replay_refs: string[];
  classification: ClassificationMetadata;
};

export const SHARED_CASE_CONTEXT_REQUIRED_FIELDS = [
  "case_id",
  "borrower_id",
  "application_id",
  "property_id",
  "current_stage",
  "active_holds",
  "related_modules",
  "audit_refs",
] as const;

export function createSharedCaseContext(input: {
  caseId: string;
  borrowerId?: string | null;
  applicationId?: string | null;
  propertyId?: string | null;
  currentStage?: string;
  activeHolds?: string[];
  relatedModules?: string[];
  auditRefs?: string[];
  replayRefs?: string[];
}): SharedCaseContext {
  return {
    case_id: input.caseId,
    borrower_id: input.borrowerId ?? null,
    application_id: input.applicationId ?? null,
    property_id: input.propertyId ?? null,
    current_stage: input.currentStage ?? "GOVERNED_REVIEW",
    active_holds: input.activeHolds ?? [
      "production-live-blocked",
      "human-review-required",
    ],
    related_modules: input.relatedModules ?? [],
    audit_refs: input.auditRefs ?? [],
    replay_refs: input.replayRefs ?? [],
    classification: createClassificationMetadata({
      classificationLevel: "CONFIDENTIAL",
      sensitivityScope: "borrower",
      classificationSource: "shared-case-context",
      classificationVersion: "shared-case-context-v0.1.0",
      replayRef: input.replayRefs?.[0] ?? input.caseId,
      disclosureAudience: ["authorized-operator", "governance"],
      exportRestrictions: [
        "requires-governed-export-context",
        "requires-redaction-before-public-surface-use",
      ],
    }),
  };
}

export function caseContextHasRequiredFields(
  context: SharedCaseContext
): boolean {
  return SHARED_CASE_CONTEXT_REQUIRED_FIELDS.every((field) => field in context);
}
