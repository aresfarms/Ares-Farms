/**
 * Weekly direct-listing freshness job (SOURCE-INTELLIGENCE unit).
 *
 * Self-posted listings must not become the new stale-data problem (the HUD
 * "sold homes shown as current" failure). One weekly job for ALL direct
 * (broker + bank/REO) listings:
 *
 *   1. AUCTIONS — auto-expire any listing whose auction date has passed
 *      (dates make this exact; the render gate also enforces it continuously).
 *   2. RECONFIRMATION — a listing not re-confirmed within the window is
 *      SUSPENDED ("verify current availability") until the lister reconfirms.
 *   3. LICENSE STATUS — re-verify each lister's license status to catch
 *      MID-TERM suspension/revocation, AND run a targeted renewal re-check
 *      at/just before each license's own stored expiration (DATA-DRIVEN cadence
 *      per Caitlin — state terms vary 1–4 years; never a fixed guess). Any
 *      non-active status or passed expiration → AUTO-SUSPEND that lister's
 *      listings until re-verified. Expiration is ALSO enforced at every render.
 *   4. AUDIT — one ledger event per run (counts confirmed/expired/suspended,
 *      licenses re-checked) per TECH-LEDGER-001.
 *
 * Weekly cadence is Caitlin's call — lighter than the daily government refresh,
 * acceptable because brokers self-maintain and the public "updated weekly"
 * notice sets expectations. Counts stay honest: suspended/expired listings drop
 * out of renderableListings and therefore out of the per-type counts feed.
 *
 * NOTE on license re-checks: with no machine lookup wired ("state-re-license"
 * is registered but PENDING Module 22/23), the job cannot itself re-query a
 * state registry — it ENFORCES what is recorded (stale verification, passed
 * expiration, non-active status) and flags listers due for operator
 * re-verification. It never invents a verification.
 */

import { canonicalLandRegisterAuthority } from "@/lib/platform/authorities/landRegister";
import { isLicenseRenderValid, licenseRuleApplies, LICENSE_RECHECK_WINDOW_DAYS } from "./licenseVerification";
import { allListers, allListings, setListingStatusInternal } from "./listingStore";

const DOMAIN = "listing-freshness";
const ACTOR = { actorId: "system:listing-freshness", actorName: "direct-listing-freshness-job" };

/** Not reconfirmed within this window → suspend until the lister reconfirms. */
export const RECONFIRM_WINDOW_DAYS = 14; // weekly tick + one missed week of grace

export interface FreshnessRunResult {
  checked: number;
  confirmedCurrent: number;
  auctionsExpired: number;
  suspendedStale: number;
  suspendedLicense: number;
  listersDueForReverification: string[];
  reason: string;
}

export function runDirectListingFreshness(now: Date = new Date()): FreshnessRunResult {
  const r: FreshnessRunResult = {
    checked: 0, confirmedCurrent: 0, auctionsExpired: 0,
    suspendedStale: 0, suspendedLicense: 0, listersDueForReverification: [], reason: "",
  };

  // License posture per lister (status re-check enforcement + renewal scheduling).
  const listerLicenseBad = new Map<string, string>();
  for (const lister of allListers()) {
    if (!licenseRuleApplies(lister.credential)) continue;
    const v = isLicenseRenderValid(lister.credential, now);
    if (!v.valid) {
      listerLicenseBad.set(lister.listerId, v.reason ?? "license not render-valid");
      r.listersDueForReverification.push(lister.listerId);
    } else if (lister.credential.licenseExpiration) {
      // Targeted renewal re-check: flag when the license's own expiration is
      // inside the next re-check window (renewal due — data-driven, per state).
      const daysToExp = (Date.parse(lister.credential.licenseExpiration) - now.getTime()) / 86_400_000;
      if (daysToExp <= LICENSE_RECHECK_WINDOW_DAYS) r.listersDueForReverification.push(lister.listerId);
    }
  }

  for (const l of allListings()) {
    if (l.status !== "APPROVED" && l.status !== "PENDING_HUMAN_APPROVAL") continue;
    r.checked += 1;

    // 1. Auction hard-expiry — exact, date-driven.
    if (l.listingKind === "auction" && l.auctionDate && Date.parse(`${l.auctionDate}T23:59:59Z`) < now.getTime()) {
      setListingStatusInternal({ listingId: l.listingId, status: "EXPIRED", reason: `auction date ${l.auctionDate} passed — auto-expired`, ...ACTOR });
      r.auctionsExpired += 1;
      continue;
    }

    // 3. Lister license no longer render-valid → suspend their listings.
    if (l.listerId && listerLicenseBad.has(l.listerId)) {
      setListingStatusInternal({ listingId: l.listingId, status: "SUSPENDED", reason: `lister license: ${listerLicenseBad.get(l.listerId)} — suspended until re-verified`, ...ACTOR });
      r.suspendedLicense += 1;
      continue;
    }

    // 2. Not reconfirmed within the window → suspend (verify current availability).
    const anchor = l.lastConfirmedAt ?? l.submittedAt;
    const ageDays = (now.getTime() - Date.parse(anchor)) / 86_400_000;
    if (ageDays > RECONFIRM_WINDOW_DAYS) {
      setListingStatusInternal({ listingId: l.listingId, status: "SUSPENDED", reason: `not reconfirmed in ${Math.floor(ageDays)}d (> ${RECONFIRM_WINDOW_DAYS}d) — verify current availability`, ...ACTOR });
      r.suspendedStale += 1;
      continue;
    }

    r.confirmedCurrent += 1;
  }

  r.reason = `weekly freshness: ${r.confirmedCurrent} current · ${r.auctionsExpired} auctions expired · ${r.suspendedStale} stale-suspended · ${r.suspendedLicense} license-suspended · ${r.listersDueForReverification.length} lister(s) due for license re-verification`;
  canonicalLandRegisterAuthority.append({ ...ACTOR, domain: DOMAIN, subject: "direct-listings", decision: "FRESHNESS_RUN", reason: r.reason, detail: { ...r, asOf: now.toISOString() } });
  return r;
}
