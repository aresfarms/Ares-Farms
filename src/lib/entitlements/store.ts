export type EntitlementType = "paid" | "environmental" | "free";

export type Entitlement = {
  id: string;
  tenantId: string;
  plan: "free" | "basic" | "pro" | "enterprise";
  active: boolean;
  permissions: EntitlementType[];
  createdAt: number;
};

/**
 * 🧠 IN-MEMORY ENTITLEMENT STORE (PHASE A SAFE + MULTI-TIER)
 */
const ENTITLEMENTS: Record<string, Entitlement> = {};

/**
 * ✔ CHECK ENTITLEMENT (FIXED OVERLOAD SUPPORT)
 */
export function hasEntitlement(
  tenantId: string = "dev",
  type?: EntitlementType
): boolean {
  const ent = ENTITLEMENTS[tenantId];

  // default dev mode = allow everything
  if (!ent) return true;

  // if no type requested, just check active
  if (!type) return ent.active;

  // check permission list
  return ent.permissions?.includes(type) ?? true;
}

/**
 * ✔ GRANT ENTITLEMENT
 */
export function grantEntitlement(
  tenantId: string = "dev",
  plan: Entitlement["plan"] = "free",
  permissions: EntitlementType[] = ["free"]
): Entitlement {
  const entitlement: Entitlement = {
    id: `ent_${Date.now()}`,
    tenantId,
    plan,
    active: true,
    permissions,
    createdAt: Date.now(),
  };

  ENTITLEMENTS[tenantId] = entitlement;

  return entitlement;
}

/**
 * ✔ REVOKE ENTITLEMENT
 */
export function revokeEntitlement(tenantId: string): void {
  if (ENTITLEMENTS[tenantId]) {
    ENTITLEMENTS[tenantId].active = false;
  }
}

/**
 * ✔ GET ENTITLEMENT
 */
export function getEntitlement(tenantId: string = "dev") {
  return ENTITLEMENTS[tenantId] || null;
}
