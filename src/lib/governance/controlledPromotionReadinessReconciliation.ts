import { createHash } from "node:crypto";

export type ReadinessStatus = "PASS" | "PENDING_SIGNOFF" | "BLOCKED";

export interface ControlledPromotionReadinessInput {
  masterVolumeConformancePassed: boolean;
  buildSelfReportPassed: boolean;
  buildSelfReportFailedModules: number;
  buildSelfReportConflicts: number;
  humanAuthorityPassed: boolean;
  publicAlphaStatus: "PASS" | "PENDING_SIGNOFF" | "FAIL";
  publicAlphaPendingDecisions: number;
  controlledPromotionRequirements: number;
  developmentSecurityBlocks: string[];
  productionSecurityBlocks: string[];
  externalEvidenceBlocks: string[];
  commit: string;
  checkedAt: string;
}

export interface ControlledPromotionReadinessPacket {
  schemaVersion: "controlled-promotion-readiness-v1";
  action: "RECONCILE_CONTROLLED_PROMOTION_READINESS";
  engineeringStatus: ReadinessStatus;
  publicAlphaStatus: ReadinessStatus;
  productionStatus: ReadinessStatus;
  productionAuthorized: false;
  masterVolumeConformancePassed: boolean;
  buildSelfReportPassed: boolean;
  buildSelfReportFailedModules: number;
  buildSelfReportConflicts: number;
  humanAuthorityPassed: boolean;
  publicAlphaPendingDecisions: number;
  controlledPromotionRequirements: number;
  developmentSecurityBlocks: string[];
  productionSecurityBlocks: string[];
  externalEvidenceBlocks: string[];
  commit: string;
  checkedAt: string;
  evidenceSnapshotHash: string;
}

export function reconcileControlledPromotionReadiness(
  input: ControlledPromotionReadinessInput,
): ControlledPromotionReadinessPacket {
  const engineeringPassed =
    input.masterVolumeConformancePassed &&
    input.buildSelfReportPassed &&
    input.buildSelfReportFailedModules === 0 &&
    input.buildSelfReportConflicts === 0 &&
    input.humanAuthorityPassed;

  const engineeringStatus: ReadinessStatus = engineeringPassed ? "PASS" : "BLOCKED";
  const publicAlphaStatus: ReadinessStatus =
    input.publicAlphaStatus === "PASS" && input.publicAlphaPendingDecisions === 0
      ? "PASS"
      : input.publicAlphaStatus === "FAIL"
        ? "BLOCKED"
        : "PENDING_SIGNOFF";
  const productionStatus: ReadinessStatus =
    engineeringPassed &&
    publicAlphaStatus === "PASS" &&
    input.controlledPromotionRequirements === 0 &&
    input.productionSecurityBlocks.length === 0 &&
    input.externalEvidenceBlocks.length === 0
      ? "PASS"
      : "BLOCKED";

  const snapshot = {
    ...input,
    engineeringStatus,
    publicAlphaStatus,
    productionStatus,
    productionAuthorized: false as const,
  };
  return {
    schemaVersion: "controlled-promotion-readiness-v1",
    action: "RECONCILE_CONTROLLED_PROMOTION_READINESS",
    ...snapshot,
    evidenceSnapshotHash: createHash("sha256")
      .update(JSON.stringify(snapshot))
      .digest("hex"),
  };
}
