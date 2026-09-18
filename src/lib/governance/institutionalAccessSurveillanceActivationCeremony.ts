import { createHash } from "node:crypto";

export const INSTITUTIONAL_SURVEILLANCE_ACTIVATION_CEREMONY_RULE =
  "INSTITUTIONAL-SURVEILLANCE-ACTIVATION-CEREMONY-001" as const;

export type SurveillanceActivationInput = Readonly<{
  schedulerName: string;
  schedulerIdentity: string;
  cadenceMinutes: number;
  route: string;
  authenticationMode: "DEDICATED_SECRET" | "OIDC_SERVICE_IDENTITY";
  authenticationConfigured: boolean;
  canaryRunId: string | null;
  canaryPassed: boolean;
  canaryEvaluatedGrantCount: number;
  rollbackAction: string;
  alertOwner: string;
  legalOrGovernanceApproverId: string | null;
  securityOrOperationsApproverId: string | null;
  evidenceRecomputationRemainsPaused: boolean;
  requestedAt: string;
}>;

export type SurveillanceActivationPacket = Readonly<{
  rule: typeof INSTITUTIONAL_SURVEILLANCE_ACTIVATION_CEREMONY_RULE;
  status: "READY_FOR_ACTIVATION" | "BLOCKED";
  blockers: readonly string[];
  activationPermitted: boolean;
  schedulerCreationPerformed: false;
  schedulerEnablementPerformed: false;
  input: SurveillanceActivationInput;
  packetSha256: string;
}>;

function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, child]) => `${JSON.stringify(key)}:${stable(child)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

export function composeInstitutionalSurveillanceActivationPacket(
  input: SurveillanceActivationInput,
): SurveillanceActivationPacket {
  const blockers: string[] = [];
  if (!input.schedulerName.trim()) blockers.push("SCHEDULER_NAME_REQUIRED");
  if (!input.schedulerIdentity.trim()) blockers.push("SCHEDULER_IDENTITY_REQUIRED");
  if (input.cadenceMinutes < 5 || input.cadenceMinutes > 60)
    blockers.push("CADENCE_OUTSIDE_APPROVED_RANGE");
  if (input.route !== "/api/internal/institutional-access-surveillance")
    blockers.push("CANONICAL_ROUTE_REQUIRED");
  if (!input.authenticationConfigured)
    blockers.push("ROUTE_AUTHENTICATION_NOT_CONFIGURED");
  if (!input.canaryRunId || !input.canaryPassed)
    blockers.push("CLEAN_CANARY_REQUIRED");
  if (input.canaryEvaluatedGrantCount < 0)
    blockers.push("INVALID_CANARY_GRANT_COUNT");
  if (!input.rollbackAction.trim()) blockers.push("ROLLBACK_ACTION_REQUIRED");
  if (!input.alertOwner.trim()) blockers.push("ALERT_OWNER_REQUIRED");
  if (!input.legalOrGovernanceApproverId)
    blockers.push("GOVERNANCE_APPROVER_REQUIRED");
  if (!input.securityOrOperationsApproverId)
    blockers.push("SECURITY_OPERATIONS_APPROVER_REQUIRED");
  if (
    input.legalOrGovernanceApproverId &&
    input.legalOrGovernanceApproverId === input.securityOrOperationsApproverId
  ) blockers.push("DUAL_CONTROL_REQUIRED");
  if (!input.evidenceRecomputationRemainsPaused)
    blockers.push("UNRELATED_SCHEDULER_BOUNDARY_VIOLATION");

  const activationPermitted = blockers.length === 0;
  const status: SurveillanceActivationPacket["status"] = activationPermitted ? "READY_FOR_ACTIVATION" : "BLOCKED";
  const packetCore = {
    rule: INSTITUTIONAL_SURVEILLANCE_ACTIVATION_CEREMONY_RULE,
    status,
    blockers,
    activationPermitted,
    schedulerCreationPerformed: false as const,
    schedulerEnablementPerformed: false as const,
    input,
  };
  return {
    ...packetCore,
    packetSha256: createHash("sha256").update(stable(packetCore)).digest("hex"),
  };
}
