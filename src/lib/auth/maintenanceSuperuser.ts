const SOLE_MAINTENANCE_SUPERUSER_EMAIL = "chudson@aresfarmsinc.com";

function normalize(email: string | null | undefined): string {
  return (email ?? "").trim().toLowerCase();
}

/**
 * Caitlin-only maintenance override. This is intentionally an identity check,
 * not an assignable role or database flag. No other founder/operator inherits it.
 */
export function isSoleMaintenanceSuperuser(email: string | null | undefined): boolean {
  return normalize(email) === SOLE_MAINTENANCE_SUPERUSER_EMAIL;
}

export function maintenanceSuperuserAuditContext(email: string | null | undefined) {
  return {
    active: isSoleMaintenanceSuperuser(email),
    policy: "SOLE-MAINTENANCE-SUPERUSER-001",
    purpose: "platform-debug-repair-validation",
  } as const;
}
