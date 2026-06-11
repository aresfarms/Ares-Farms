/**
 * Listing render gate (SOURCE-INTELLIGENCE unit) — the single authority for
 * whether a Furlong-originated listing may render publicly.
 *
 * Defaults to FALSE. A listing renders ONLY when ALL hold:
 *   1. Operator-APPROVED (human gate; runtime overlay).
 *   2. The listing's state is COUNSEL-CLEARED (free-venue posture confirmed).
 *   3. Fair-housing guard passed. HONESTY NOTE: the FHA guard is a FIRST LAYER
 *      only — explicit discriminatory terms. It does not catch every violation;
 *      the human PENDING review (gate 1) is the real backstop. Never oversold.
 *   4. Lister identity verified (Module 10-style; operator-recorded).
 *   5. BY LISTER TYPE (explicit branch — the accountable-party check differs):
 *      - broker:   owner-of-record match must have PASSED (true — not merely
 *                  attested; anti-poaching) AND authority attested+evidenced.
 *                  ownerOfRecordMatch null (not machine-verifiable) is NOT a
 *                  pass — it routes to listing-agreement + human review, and the
 *                  operator records the match result before approval.
 *      - bank-reo: institutional authority (ownership of the REO asset is
 *                  inherent; no third-party owner to verify).
 *   6. PHOTOS render only when the poster granted display rights
 *      (photoDisplayRightsGranted === true) — rights-clean by construction.
 *      `renderablePhotoRefs` is the ONLY photo accessor surfaces may use.
 *
 * AUDIT (CONST-DATA-001): all decisions feeding this gate are recorded via the
 * append-only NDJSON audit ledger (appendAuditEvent) — the overlay holds current
 * STATE; the ledger is the immutable LOG. No unrecorded state changes.
 */

import type { Listing } from "./listingTypes";
import { getListingState, isStateCounselCleared } from "./listingSourceActivationStore";
import { fairHousingScan } from "./fairHousingGuard";
import { isLicenseRenderValid, licenseRuleApplies } from "./licenseVerification";

export interface RenderEligibility {
  canRender: boolean;
  reasons: string[]; // why NOT (empty when canRender)
  /** Photos a surface may show — EMPTY unless display rights were granted. */
  renderablePhotoRefs: string[];
  checks: {
    operatorApproved: boolean;
    counselCleared: boolean;
    fairHousingClear: boolean;
    identityVerified: boolean;
    accountablePartyOk: boolean; // broker owner-match OR bank institutional authority
    photoRightsGranted: boolean;
    licenseOk: boolean; // verified-active + unexpired + fresh re-check (when claimed)
  };
}

export function listingRenderEligibility(listing: Listing): RenderEligibility {
  const state = getListingState(listing.listingId);
  const operatorApproved = state.status === "APPROVED";
  const counselCleared = isStateCounselCleared(listing.state);
  const fairHousingClear =
    listing.fairHousingClear ?? fairHousingScan(`${listing.description} ${listing.listerDisplayName}`).clear;
  const identityVerified = listing.credential.identityVerified === true;

  // Explicit accountable-party branch by lister type.
  let accountablePartyOk = false;
  let accountablePartyReason: string | null = null;
  if (listing.listerType === "broker") {
    // Owner-of-record match must have PASSED — attestation alone is not enough.
    accountablePartyOk =
      listing.credential.authorityAttested === true &&
      listing.credential.ownerOfRecordMatch === true;
    if (!accountablePartyOk) {
      accountablePartyReason =
        listing.credential.ownerOfRecordMatch === false
          ? "broker authority could not be squared with owner-of-record (shelve PENDING-provenance)"
          : listing.credential.ownerOfRecordMatch === null
            ? "owner-of-record match not yet verified (listing-agreement + human review required)"
            : "broker listing-authority not attested";
    }
  } else {
    // bank-reo: institutional authority — ownership of the REO asset is inherent.
    accountablePartyOk = true;
  }

  const photoRightsGranted = listing.credential.photoDisplayRightsGranted === true;

  // LICENSE — HARD pre-render gate. Applies to brokers always, and to a bank
  // listing when a licensed agent is named. Verified-active AND unexpired
  // (compared to NOW — expired is off the day it lapses) AND fresh re-check.
  let licenseOk = true;
  let licenseReason: string | null = null;
  if (licenseRuleApplies(listing.credential)) {
    const v = isLicenseRenderValid(listing.credential);
    licenseOk = v.valid;
    licenseReason = v.reason;
  }

  // Auctions hard-expire on their own date at render time (independent of jobs).
  const auctionExpired =
    listing.listingKind === "auction" &&
    !!listing.auctionDate &&
    new Date(`${listing.auctionDate}T23:59:59Z`).getTime() < Date.now();

  const reasons: string[] = [];
  if (!operatorApproved) reasons.push(`not operator-approved (${state.status})`);
  if (!counselCleared) reasons.push(`state ${listing.state} not counsel-cleared (free-venue posture unconfirmed)`);
  if (!fairHousingClear) reasons.push("fair-housing guard not clear (human review required)");
  if (!identityVerified) reasons.push("lister identity not verified");
  if (!accountablePartyOk && accountablePartyReason) reasons.push(accountablePartyReason);
  if (!licenseOk && licenseReason) reasons.push(`license gate: ${licenseReason}`);
  if (auctionExpired) reasons.push(`auction date ${listing.auctionDate} has passed — expired`);

  return {
    canRender: reasons.length === 0,
    reasons,
    // Photos never leak without rights — even on an otherwise-renderable listing.
    renderablePhotoRefs: photoRightsGranted ? listing.photoRefs : [],
    checks: { operatorApproved, counselCleared, fairHousingClear, identityVerified, accountablePartyOk, photoRightsGranted, licenseOk },
  };
}

/** Convenience boolean — defaults false until every gate is cleared. */
export function canListingRender(listing: Listing): boolean {
  return listingRenderEligibility(listing).canRender;
}
