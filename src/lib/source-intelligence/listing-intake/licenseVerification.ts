/**
 * Broker / realtor license verification — HARD pre-render gate (SOURCE-INTELLIGENCE unit).
 *
 * The public listing asserts "licensed broker"; an unverified/lapsed license
 * makes Furlong the fall guy. So: NO broker listing renders without a recorded,
 * dated verification that the license is ACTIVE and UNEXPIRED — and expiration
 * is enforced at EVERY render (an expired license is off the day it lapses,
 * regardless of job cadence).
 *
 * Two verification paths (per-state reality — 50 heterogeneous systems):
 *   - MACHINE: where a state offers a lookup API, an adapter registers through
 *     Module 22/23 like every external source. NONE WIRED YET (honest boundary);
 *     the "state-re-license" source is registered PENDING in the source registry.
 *   - OPERATOR: human verification with recorded evidence (license #, name match,
 *     status, expiration, source reference). This is the live path today.
 * Either path produces the same recorded, dated verification on the credential.
 *
 * Cadence is DATA-DRIVEN off each license's real expiration (state terms vary,
 * commonly 1–4 years): expiration enforced continuously at render; STATUS
 * re-verification (suspension/revocation can happen mid-term) rides the weekly
 * job, which also schedules a renewal re-check at each license's own expiration.
 */

import { appendAuditEvent } from "@/lib/property/auditLedger";
import type { LicenseStatus, ListerCredential } from "./listingTypes";

export const LICENSE_AUDIT_DOMAIN = "listing-license-verification";

/** verifiedAsOf must be within this window (weekly tick + slack) to keep rendering. */
export const LICENSE_RECHECK_WINDOW_DAYS = 14;

/**
 * Is the credential's license valid FOR RENDER right now?
 *  active status AND unexpired (checked against `now` — continuous enforcement)
 *  AND verified recently enough (within the re-check window).
 */
export function isLicenseRenderValid(c: ListerCredential, now: Date = new Date()): {
  valid: boolean;
  reason: string | null;
} {
  const status = c.licenseStatus ?? "unverified";
  if (status !== "active") return { valid: false, reason: `license status is "${status}" — verified-active required` };
  if (!c.licenseExpiration) return { valid: false, reason: "license expiration not recorded" };
  if (new Date(`${c.licenseExpiration}T23:59:59Z`).getTime() < now.getTime())
    return { valid: false, reason: `license expired ${c.licenseExpiration}` };
  if (!c.verifiedAsOf) return { valid: false, reason: "no recorded verification date" };
  const ageDays = (now.getTime() - Date.parse(c.verifiedAsOf)) / 86_400_000;
  if (ageDays > LICENSE_RECHECK_WINDOW_DAYS)
    return { valid: false, reason: `verification stale (${Math.floor(ageDays)}d old > ${LICENSE_RECHECK_WINDOW_DAYS}d window)` };
  return { valid: true, reason: null };
}

/** Does this credential CLAIM a license at all (broker always; bank only when a
 *  listing agent is named via licenseNumber)? The rule applies when claimed. */
export function licenseRuleApplies(c: ListerCredential): boolean {
  return c.listerType === "broker" || !!c.licenseNumber;
}

/**
 * Record a license verification (operator path today; a machine adapter would
 * call this too). Appends the ledger event; the caller persists the credential.
 */
export function buildLicenseVerification(input: {
  listerId: string;
  licenseStatus: LicenseStatus;
  licenseNumber: string;
  licenseExpiration: string | null; // ISO date from the state record
  verificationSource: string; // lookup URL / evidence reference — REQUIRED
  actorId: string;
  actorName: string;
  now?: Date;
}): Pick<ListerCredential, "licenseStatus" | "licenseNumber" | "licenseExpiration" | "verifiedAsOf" | "verificationSource"> {
  if (!input.verificationSource.trim()) {
    throw new Error("Refused: a license verification requires a recorded verification source/evidence reference.");
  }
  const verifiedAsOf = (input.now ?? new Date()).toISOString().slice(0, 10);
  appendAuditEvent({
    actorId: input.actorId,
    actorName: input.actorName,
    domain: LICENSE_AUDIT_DOMAIN,
    subject: `lister:${input.listerId}`,
    decision: "LICENSE_VERIFIED",
    reason: `status=${input.licenseStatus} #${input.licenseNumber} exp=${input.licenseExpiration ?? "?"}`,
    detail: {
      licenseStatus: input.licenseStatus,
      licenseNumber: input.licenseNumber,
      licenseExpiration: input.licenseExpiration,
      verifiedAsOf,
      verificationSource: input.verificationSource,
    },
  });
  return {
    licenseStatus: input.licenseStatus,
    licenseNumber: input.licenseNumber,
    licenseExpiration: input.licenseExpiration,
    verifiedAsOf,
    verificationSource: input.verificationSource,
  };
}

/** Public wording — built ONLY from a render-valid verification; never before. */
export function licensePublicLine(c: ListerCredential): string | null {
  if (!licenseRuleApplies(c)) return null;
  if (!isLicenseRenderValid(c).valid) return null;
  return `licensed ${c.listerType === "broker" ? "broker" : "agent"} · license #${c.licenseNumber}, verified ${c.verifiedAsOf}`;
}
