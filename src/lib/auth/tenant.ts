import { v4 as uuidv4 } from "uuid";

/**
 * ENSURE EVERY USER HAS A TENANT ID
 */
export function ensureTenantId(user: any) {
  if (user?.tenantId) {
    return user.tenantId;
  }

  return uuidv4();
}
