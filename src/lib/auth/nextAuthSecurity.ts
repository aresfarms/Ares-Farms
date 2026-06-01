/**
 * Governed NextAuth Runtime Configuration
 *
 * Master Volume Governance:
 * - Vol I: Preserves accountable session authority.
 * - Vol II: Protects regulated borrower/operator identity context.
 * - Vol III: Makes auth runtime posture deterministic across local and
 *   production environments.
 * - Vol IV: Supports security review, incident response, and deployment
 *   readiness checks.
 * - Vol V: Preserves source authority, controlled disclosure, and
 *   audit-ready identity governance.
 */

const LOCAL_NEXTAUTH_SECRET =
  "ares-farms-local-development-nextauth-secret-do-not-use-in-production";

export function ensureLocalNextAuthUrl(): void {
  if (process.env.NEXTAUTH_URL || process.env.NODE_ENV === "production") {
    return;
  }

  process.env.NEXTAUTH_URL =
    process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") ??
    "http://localhost:3000";
}

export function resolveNextAuthSecret(): string | undefined {
  if (process.env.NEXTAUTH_SECRET) {
    return process.env.NEXTAUTH_SECRET;
  }

  if (process.env.NODE_ENV === "production") {
    return undefined;
  }

  return LOCAL_NEXTAUTH_SECRET;
}

export function isLocalDevelopmentNextAuthSecret(secret: string | undefined) {
  return secret === LOCAL_NEXTAUTH_SECRET;
}
