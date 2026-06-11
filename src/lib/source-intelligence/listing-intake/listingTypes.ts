/**
 * Listing intake — types (SOURCE-INTELLIGENCE unit; separable, PII-bearing).
 *
 * Furlong-originated direct listings. Per the 2026-06-10 DECISION:
 *   - Owner / FSBO = NO-GO (legal exposure; excluded at the type level below).
 *   - Surviving lister types: licensed broker/realtor + bank/lender REO.
 *
 * The licensed broker (or the institution's authorized contact) is the
 * ACCOUNTABLE party — Furlong is a neutral advertising venue, does NOT represent
 * the seller, negotiate, advise, or take a per-deal fee. Listing is free.
 *
 * SEPARABILITY: lister contact PII lives in THIS unit. Furlong core must never
 * import these PII-bearing types/records. Nothing here renders on any surface
 * until the listing is operator-approved AND counsel has cleared the free-venue
 * posture for the listing's state (listingRenderGate).
 */

/** Owner/FSBO is intentionally NOT a member — it is a NO-GO. */
export type ListerType = "broker" | "bank-reo";

export type ListingStatus =
  | "PENDING_HUMAN_APPROVAL"
  | "APPROVED"
  | "REJECTED"
  | "SHELVED_PENDING_PROVENANCE" // broker authority could not be squared with owner-of-record
  | "EXPIRED" // takedown / auction-date passed / freshness-expired
  | "SUSPENDED"; // lister license lapsed/non-active, or listing not reconfirmed

/** License verification result recorded on a broker/realtor credential. */
export type LicenseStatus =
  | "active"
  | "expired"
  | "suspended"
  | "revoked"
  | "not-found"
  | "unverified"; // default — nothing renders on an unverified license

/** Lister contact PII — owned by this unit; never exposed to Furlong core. */
export interface ListerContactPII {
  contactName: string;
  email: string;
  phone: string | null;
}

/** Verified credential per lister type (broker license / institutional authority). */
export interface ListerCredential {
  listerType: ListerType;
  /** Broker: state license number. Bank/REO: institutional identifier. */
  credentialId: string;
  credentialState: string | null; // licensing state (broker)
  identityVerified: boolean; // Module 10 / Provider onboarding result
  /** Broker attests + evidences listing authority from the owner of record. */
  authorityAttested: boolean;
  /** Owner-of-record cross-check (place-facts/geocode). null = not machine-verifiable. */
  ownerOfRecordMatch: boolean | null;
  /** Broker grants Furlong display rights to listing photos (rights-clean path). */
  photoDisplayRightsGranted: boolean;

  // ── License verification (HARD pre-render gate for brokers; also applies to a
  //    named listing agent on a bank/REO listing). Recorded via
  //    licenseVerification.ts — machine adapter where a state offers one (none
  //    wired yet; Module 22/23-gated), else operator human verification with
  //    recorded evidence. No "licensed" claim renders without a verification. ──
  /** Defaults "unverified" — broker listings cannot render in that state. */
  licenseStatus?: LicenseStatus;
  /** Real-estate license number as verified (renders publicly once verified). */
  licenseNumber?: string | null;
  /** License's own expiration (ISO date) — enforced at EVERY render. */
  licenseExpiration?: string | null;
  /** When the verification was performed (ISO date) — must be within the re-check window. */
  verifiedAsOf?: string | null;
  /** Where it was verified (state lookup URL / operator evidence reference). */
  verificationSource?: string | null;
}

/** A submitted listing. PUBLIC-safe display fields + the venue framing live here;
 *  lister PII is referenced separately so projections can omit it. */
export interface Listing {
  listingId: string;
  /** The registered lister this listing belongs to (license re-checks propagate by this). */
  listerId?: string;
  listerType: ListerType;
  listerDisplayName: string; // e.g. "Acme Realty" / "First National Bank" — shown in "Listed by"
  credential: ListerCredential;
  /** Property facts (coarse public geography; exact address gated to Explore detail). */
  propertyType: string;
  state: string;
  town: string;
  priceLabelInput: number | null; // feeds the existing honest price label
  description: string;
  photoRefs: string[]; // local rehosted refs only (never hotlink); empty until rights-cleared
  status: ListingStatus;
  /** Fair-housing advertising guard result (must pass before approval). */
  fairHousingClear: boolean | null; // null = not yet checked
  /** "sale" (default) or "auction" — auctions carry a date and hard-expire on it. */
  listingKind?: "sale" | "auction";
  /** Auction date (ISO) — past this date the listing auto-expires (weekly job + render-time). */
  auctionDate?: string | null;
  /** Last time the lister/operator re-confirmed the listing is still active (weekly freshness). */
  lastConfirmedAt?: string | null;
  submittedAt: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  expiresAt: string | null;
}

/** The venue disclaimer rendered on every listing (no representation / no verification). */
export function venueDisclaimer(listerDisplayName: string, listerType: ListerType): string {
  const who = listerType === "bank-reo" ? "a bank / lender (REO)" : "a licensed broker";
  return (
    `Listed by ${listerDisplayName} — a third party (${who}). Furlong is an advertising venue and ` +
    `does not represent the seller, negotiate, or verify this listing. Listing accuracy is the posting ` +
    `party's responsibility.`
  );
}
