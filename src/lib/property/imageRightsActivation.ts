/**
 * Property Image-Rights Activation — Module 23-style legal records (per source).
 *
 * Mirrors placeFactActivation.ts, but governs whether a source's property PHOTOS
 * are cleared to capture + display. Ships PENDING_HUMAN_APPROVAL with
 * conclusion NOT_CLEARED. The build NEVER self-clears; a qualified reviewer
 * (Module 45) records the go/no-go on the Source Review screen, audit-logged via
 * imageRightsActivationStore.ts.
 *
 * HARD RULES baked into this record:
 *   - Default conservative: CONTRACTOR_UNCLEAR (or THIRD_PARTY_COURTESY) = NOT
 *     eligible. Only FEDERAL_PD (or an explicit reuse license) can be cleared.
 *   - Download-and-rehost with attribution via the journey-image-credit registry
 *     — NEVER hotlink the source host.
 *   - PII / identifiable-content review is required per image before display.
 *   - as-of labeling on every displayed image (auctions/listings are transient).
 *
 * Evidence below was gathered read-only on the retrieval date (no image bytes
 * downloaded, no EXIF read — that is a capture step deferred to the human go
 * decision). Archived ToS pages live under docs/image-rights-evidence/.
 */

export type ImageRightsStatus = "PENDING_HUMAN_APPROVAL" | "CLEARED_FOR_DISPLAY" | "NOT_CLEARED" | "NEEDS_LEGAL";

export type ImageProvenanceClass =
  | "FEDERAL_PD" // U.S. Government work (17 U.S.C. §105) — eligible
  | "CONTRACTOR_UNCLEAR" // produced by/for a contractor or agent; IP unconfirmed — NOT eligible (default)
  | "THIRD_PARTY_COURTESY"; // explicit third-party/courtesy/licensed — NOT eligible without permission

export interface ImageEvidenceItem {
  url: string;
  host: string;
  /** Conservative provenance classification with the reason it is not yet FEDERAL_PD. */
  provenance: ImageProvenanceClass;
  note: string;
}

export interface ImageRightsRecord {
  sourceId: string;
  sourceName: string;
  /** Where the source's images are hosted. */
  imageHosts: string[];
  /** Retrieval date for all evidence in this record (ISO date). */
  evidenceAsOf: string;
  /** A1 — per-image provenance findings (representative sample of the live feed). */
  provenanceFindings: ImageEvidenceItem[];
  /** Default classification applied to the source's images pending verification. */
  defaultProvenance: ImageProvenanceClass;
  /** A2 — terms-of-use finding + archived evidence file. */
  termsOfUse: {
    pages: string[];
    archived: string[]; // files under docs/image-rights-evidence/
    finding: string;
  };
  /** A3 — credit / courtesy / © notice finding. */
  creditNotice: string;
  /** B — operational requirements (always true for any future display). */
  requirements: {
    rehostRequired: true; // never hotlink
    attributionVia: "journey-image-credit-registry";
    piiReviewRequired: true;
    asOfLabelingRequired: true;
    noExactAddressPublic: true;
  };
  /** The recorded legal conclusion. Stays NOT_CLEARED until a human clears it. */
  conclusion: "CLEARED_FOR_DISPLAY" | "NOT_CLEARED" | "NEEDS_LEGAL";
  status: ImageRightsStatus;
  reviewedBy: string | null;
  reviewedAt: string | null;
}

const EVIDENCE_AS_OF = "2026-06-10";

export const IMAGE_RIGHTS_ACTIVATION: Record<string, ImageRightsRecord> = {
  "gsa-realestate": {
    sourceId: "gsa-realestate",
    sourceName: "GSA — Federal surplus real property (realestatesales.gov)",
    imageHosts: ["d2m3yrz4x1yefr.cloudfront.net"],
    evidenceAsOf: EVIDENCE_AS_OF,
    provenanceFindings: [
      {
        url: "https://d2m3yrz4x1yefr.cloudfront.net/property_image/1772734458.2249608_DJI_0116.png",
        host: "d2m3yrz4x1yefr.cloudfront.net",
        provenance: "CONTRACTOR_UNCLEAR",
        note: "Filename 'DJI_0116' indicates drone capture — likely a contractor/operator photo; federal authorship unconfirmed.",
      },
      {
        url: "https://d2m3yrz4x1yefr.cloudfront.net/property_image/1779395419.1464438_520_W_700_N_Hobart_IN-2.jpg",
        host: "d2m3yrz4x1yefr.cloudfront.net",
        provenance: "CONTRACTOR_UNCLEAR",
        note: "Address-named agent-style photo; originator unconfirmed (selling agency vs federal).",
      },
      {
        url: "https://d2m3yrz4x1yefr.cloudfront.net/property_image/1780507010.2054641_IMG_3148.jpg",
        host: "d2m3yrz4x1yefr.cloudfront.net",
        provenance: "CONTRACTOR_UNCLEAR",
        note: "Generic camera filename (IMG_3148); originator unconfirmed.",
      },
    ],
    defaultProvenance: "CONTRACTOR_UNCLEAR",
    termsOfUse: {
      pages: ["https://realestatesales.gov/terms/", "https://www.gsa.gov/website-information/website-policies"],
      archived: [
        "docs/image-rights-evidence/gsa-terms-2026-06-10.html",
        "docs/image-rights-evidence/gsa-website-policies-2026-06-10.html",
      ],
      finding:
        "GSA policy: GSA-employee works are 'generally not protected by copyright and are in the public domain in the U.S.' — BUT it EXPLICITLY warns 'We sometimes use photos or graphics that we licensed or that a [third party supplied]' and 'reproduction of protected items beyond fair use requires written permission from the copyright holder.' Property listing photos (agent/drone filenames) fall under this third-party carve-out → not assumable as PD. No explicit redistribution ban found, but the copyright carve-out governs.",
    },
    creditNotice:
      "No copyright/courtesy/© notice found on realestatesales.gov/our-listing/ as of 2026-06-10 (absence does not prove PD; GSA policy warns some images are third-party).",
    requirements: {
      rehostRequired: true,
      attributionVia: "journey-image-credit-registry",
      piiReviewRequired: true,
      asOfLabelingRequired: true,
      noExactAddressPublic: true,
    },
    conclusion: "NOT_CLEARED",
    status: "PENDING_HUMAN_APPROVAL",
    reviewedBy: null,
    reviewedAt: null,
  },

  treasury: {
    sourceId: "treasury",
    sourceName: "U.S. Treasury — Seized Real Property Auctions (TEOAF)",
    imageHosts: ["www.treasury.gov"],
    evidenceAsOf: EVIDENCE_AS_OF,
    provenanceFindings: [
      {
        url: "https://www.treasury.gov/auctions/treasury/rp/images/429paradise02.gif",
        host: "www.treasury.gov",
        provenance: "CONTRACTOR_UNCLEAR",
        note: ".gov-hosted, but TEOAF auctions are administered by a private contractor (historically CWS Marketing Group); whether the auction photos are federal works or contractor-supplied is unconfirmed. Hosting on treasury.gov does not by itself confer public domain.",
      },
      {
        url: "https://www.treasury.gov/auctions/treasury/rp/images/6113vashon01.gif",
        host: "www.treasury.gov",
        provenance: "CONTRACTOR_UNCLEAR",
        note: "Same: federal-vs-contractor authorship unconfirmed.",
      },
    ],
    defaultProvenance: "CONTRACTOR_UNCLEAR",
    termsOfUse: {
      pages: ["https://home.treasury.gov/footer/privacy-act", "https://www.treasury.gov (site policies / copyright — to be archived)"],
      archived: ["docs/image-rights-evidence/treasury-privacy-2026-06-10.html"],
      finding:
        "Treasury privacy-act page carries no copyright/redistribution/public-domain clause; the TEOAF realprop listing page itself carries no notice. Treasury's specific copyright/site-use policy page was not located/archived this pass — to be archived before any clearance. Contractor-origin of the auction photos is the governing uncertainty.",
    },
    creditNotice:
      "No copyright/courtesy/© notice found on treasury.gov/.../rp/realprop.shtml as of 2026-06-10. Note: 'photocomingsoon.gif' placeholder is present (not a property photo).",
    requirements: {
      rehostRequired: true,
      attributionVia: "journey-image-credit-registry",
      piiReviewRequired: true,
      asOfLabelingRequired: true,
      noExactAddressPublic: true,
    },
    conclusion: "NOT_CLEARED",
    status: "PENDING_HUMAN_APPROVAL",
    reviewedBy: null,
    reviewedAt: null,
  },
};

export const IMAGE_RIGHTS_SOURCE_IDS = Object.keys(IMAGE_RIGHTS_ACTIVATION);
