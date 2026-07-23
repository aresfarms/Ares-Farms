import annex from "../../../docs/governance/VOL_VII_OPERATIONAL_ANNEX.json";

import { launchAuthorizationRequirements } from "@/lib/governance/consolidatedLaunchAuthorizationLedger";

export const LAUNCH_AUTHORITY_ASSIGNMENT_VERSION =
  "p6-launch-authority-assignment-registry-v1";

export type LaunchAuthorityAssignmentStatus =
  | "ASSIGNED"
  | "EXTERNAL_AUTHORITY"
  | "HELD_FOR_LATER_PHASE"
  | "UNFILLED_BY_DESIGN";

export type LaunchAuthorityAssignment = Readonly<{
  authorityRole: string;
  status: LaunchAuthorityAssignmentStatus;
  holderName: string | null;
  holderId: string | null;
  identities: readonly string[];
  sourceRef: string;
  reason: string;
}>;

const identityByHolderId: Readonly<Record<string, readonly string[]>> = {
  "caitlin-hudson": ["chudson@aresfarmsinc.com"],
  "stuart-fraass": ["stuart@aresfarmsinc.com"],
};

const activeByRole = new Map(
  annex.activeFillAuthorities.flatMap((authority) =>
    authority.clearsModule45Roles.map((role) => [role, authority] as const)
  )
);

const assigned = (
  authorityRole: string,
  holderId: "caitlin-hudson" | "stuart-fraass",
  sourceRef: string,
  reason: string
): LaunchAuthorityAssignment => {
  const authority = [...annex.activeFillAuthorities].find(
    (candidate) => candidate.holderId === holderId
  );
  if (!authority) throw new Error(`Annex holder is missing: ${holderId}`);
  return {
    authorityRole,
    status: "ASSIGNED",
    holderName: authority.holder,
    holderId,
    identities: identityByHolderId[holderId] ?? [],
    sourceRef,
    reason,
  };
};

const explicitAssignments: readonly LaunchAuthorityAssignment[] = [
  assigned(
    "CAITLIN_NAMED_TESTER",
    "caitlin-hudson",
    "named-tester-acceptance",
    "Named tester identity is explicitly recorded for Caitlin Hudson."
  ),
  assigned(
    "STUART_NAMED_TESTER",
    "stuart-fraass",
    "named-tester-acceptance",
    "Named tester identity is explicitly recorded for Stuart Fraass."
  ),
  assigned(
    "DATA_RIGHTS_OFFICER",
    "caitlin-hudson",
    "VOL_VII_OPERATIONAL_ANNEX:A3",
    "The Operational Annex canonically assigns DATA_RIGHTS_OFFICER to Caitlin Hudson."
  ),
];

const externalRoles = new Set(["CREDIT_ELIGIBILITY_AUTHORITY"]);
const heldRoles = new Set([
  "SOURCE_LEGAL_AUTHORITY",
  "CONNECTOR_ACTIVATION_AUTHORITY",
  "QUALIFIED_REPORT_AUTHORITY",
  "TREASURY_AUTHORITY",
  "RELEASE_MANAGER",
  "RELEASE_BOARD",
  "FINAL_LAUNCH_AUTHORITY",
]);

const allRoleSlots = launchAuthorizationRequirements.flatMap((item) => [
  ...item.authorityRoles,
]);
const uniqueRoles = [...new Set(allRoleSlots)];

export const launchAuthorityAssignments: readonly LaunchAuthorityAssignment[] =
  uniqueRoles.map((authorityRole) => {
    const explicit = explicitAssignments.find(
      (entry) => entry.authorityRole === authorityRole
    );
    if (explicit) return explicit;

    const annexAuthority = activeByRole.get(authorityRole);
    if (annexAuthority) {
      return {
        authorityRole,
        status: "UNFILLED_BY_DESIGN",
        holderName: null,
        holderId: null,
        identities: [],
        sourceRef: `VOL_VII_OPERATIONAL_ANNEX:${annexAuthority.id}`,
        reason:
          "An Alpha authority exists, but no launch-authority identity mapping is approved for this distinct production role.",
      };
    }

    if (externalRoles.has(authorityRole)) {
      return {
        authorityRole,
        status: "EXTERNAL_AUTHORITY",
        holderName: "Lender / agency",
        holderId: null,
        identities: [],
        sourceRef: "VOL_VII_OPERATIONAL_ANNEX:E1",
        reason: "This decision belongs to an external lender or agency authority.",
      };
    }

    if (heldRoles.has(authorityRole)) {
      return {
        authorityRole,
        status: "HELD_FOR_LATER_PHASE",
        holderName: null,
        holderId: null,
        identities: [],
        sourceRef: "production-authority-gate-chain",
        reason: "This production authority remains held pending its later activation gate.",
      };
    }

    return {
      authorityRole,
      status: "UNFILLED_BY_DESIGN",
      holderName: null,
      holderId: null,
      identities: [],
      sourceRef: "VIA-AUDIT-EXCEPTION-001",
      reason: "No qualified holder has been approved for this production authority.",
    };
  });

export function launchAuthorityAssignmentFor(
  authorityRole: string
): LaunchAuthorityAssignment | null {
  return (
    launchAuthorityAssignments.find(
      (assignment) => assignment.authorityRole === authorityRole
    ) ?? null
  );
}

export function validateLaunchAuthorityAssignments(): string[] {
  const issues: string[] = [];
  if (launchAuthorityAssignments.length !== uniqueRoles.length) {
    issues.push("Every distinct launch authority role must have an assignment posture.");
  }
  for (const authorityRole of allRoleSlots) {
    if (!launchAuthorityAssignmentFor(authorityRole)) {
      issues.push(`Launch authority slot lacks an assignment posture: ${authorityRole}`);
    }
  }
  for (const assignment of launchAuthorityAssignments) {
    if (assignment.status === "ASSIGNED" && assignment.identities.length === 0) {
      issues.push(`Assigned authority lacks an identity: ${assignment.authorityRole}`);
    }
    if (assignment.status !== "ASSIGNED" && assignment.identities.length > 0) {
      issues.push(`Unassigned authority exposes an identity: ${assignment.authorityRole}`);
    }
  }
  return issues;
}
