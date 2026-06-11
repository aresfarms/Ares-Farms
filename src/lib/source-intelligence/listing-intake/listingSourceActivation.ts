/**
 * Listing-source activation — Module 22/23-style gate for Furlong-originated
 * direct listings (SOURCE-INTELLIGENCE unit).
 *
 * Mirrors sourceActivation / placeFactActivation: a listing source (broker /
 * bank-REO lister type) ships PENDING; an operator approves a listing before it
 * goes live. PLUS a hard COUNSEL precondition: no listing renders in any state
 * until a real estate attorney has confirmed Furlong's free-venue posture for
 * THAT state. `COUNSEL_CLEARED_STATES` ships EMPTY — so nothing can go live
 * anywhere until counsel clears it (recorded by a human; the build never
 * self-clears).
 */

import type { ListerType } from "./listingTypes";

export type ListingReviewStatus = "PENDING_HUMAN_APPROVAL" | "APPROVED" | "BLOCKED";

/** Per-lister-type review record (the "source" being activated). */
export interface ListingSourceRecord {
  listerType: ListerType;
  listerTypeName: string;
  module: "Listing-Source Review (Module 22/23-style)";
  status: ListingReviewStatus;
  /** Verification required before any listing of this type is approvable. */
  verificationRequired: string[];
  facts: string[];
  reviewedBy: string | null;
  reviewedAt: string | null;
}

/**
 * COUNSEL GATE — states where a real estate attorney has confirmed the free
 * advertising-venue posture. EMPTY by default: until a human records a cleared
 * state here (or in the runtime overlay), NO listing renders anywhere. This is
 * the precondition that keeps Furlong out of brokerage-licensing exposure.
 */
export const COUNSEL_CLEARED_STATES: readonly string[] = [];

export const LISTING_SOURCE_ACTIVATION: Record<ListerType, ListingSourceRecord> = {
  broker: {
    listerType: "broker",
    listerTypeName: "Licensed broker / realtor (direct)",
    module: "Listing-Source Review (Module 22/23-style)",
    status: "PENDING_HUMAN_APPROVAL",
    verificationRequired: [
      "State real estate license number + identity verification (Module 10 / Provider onboarding).",
      "Broker attests AND evidences listing authority from the owner of record (e.g., listing agreement).",
      "Owner-of-record cross-check via place-facts/geocode where machine-queryable; else broker-supplied listing agreement + human review.",
      "Photo display rights granted by the broker (rights-clean path; rehost, never hotlink).",
    ],
    facts: [
      "Licensed broker is the accountable party — professional duty for listing accuracy + owner authorization.",
      "Furlong relies on the licensed broker; it does NOT independently contract with or verify the owner (that line keeps Furlong from vouching).",
      "Furlong is a neutral, free advertising venue — no representation, negotiation, advice, or per-deal fee.",
    ],
    reviewedBy: null,
    reviewedAt: null,
  },
  "bank-reo": {
    listerType: "bank-reo",
    listerTypeName: "Bank / lender REO (institutional)",
    module: "Listing-Source Review (Module 22/23-style)",
    status: "PENDING_HUMAN_APPROVAL",
    verificationRequired: [
      "Institutional identity / authorized-contact verification.",
      "Evidence the institution holds the real-estate-owned property it is advertising (owner-of-record match where available).",
      "Photo display rights granted by the institution (rehost, never hotlink).",
    ],
    facts: [
      "Institution sells its own REO inventory — it is the accountable posting party.",
      "Furlong is a neutral, free advertising venue — no representation, negotiation, advice, or per-deal fee.",
      "Open point: bank/REO inclusion pending Caitlin + counsel confirmation per state (same free-venue precondition).",
    ],
    reviewedBy: null,
    reviewedAt: null,
  },
};

export const LISTER_TYPES = Object.keys(LISTING_SOURCE_ACTIVATION) as ListerType[];
