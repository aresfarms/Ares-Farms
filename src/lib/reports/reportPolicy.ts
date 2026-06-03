/**
 * Report Policy Registry
 *
 * Master Volume Governance:
 * - Vol I: report products must stay inside constitutional authority.
 * - Vol II: report language must not imply approval, underwriting,
 *   eligibility, permitting, financing, legal, or regulatory determination.
 * - Vol III: report types must be deterministic and safe for replay.
 * - Vol IV: human-review and operator escalation requirements stay explicit.
 * - Vol V: report output remains classified, explainable, export-governed,
 *   advisory-only, and controlled-disclosure by default.
 *
 * Supplemental governing inputs:
 * - Furlong_Customer_Version.pdf
 * - Furlong_Governance_Doctrines_Master_Series.pdf
 */

export const reportPolicy = {
  free: {
    name: "Baseline Readiness Report",
    gated: false,
    humanReview: false,
    borrowerCharged: false,
    officialUseAllowed: false,
    description:
      "Borrower-facing baseline intake visibility, missing-document guidance, pathway context, rights notices, and export support.",
  },

  paid: {
    name: "Institutional Coordination Report",
    gated: true,
    humanReview: true,
    borrowerCharged: false,
    payer: "institution",
    officialUseAllowed: false,
    description:
      "Institution-funded operational coordination summary for authorized review, not a borrower charge, approval, credit decision, or financing commitment.",
  },

  environmental: {
    name: "Environmental Documentation Readiness Checklist",
    gated: true,
    humanReview: true,
    borrowerCharged: false,
    licensedProfessionalReviewRequired: true,
    officialUseAllowed: false,
    description:
      "Advisory-only environmental documentation readiness support. It is not valid for permitting, financing, legal, or regulatory reliance without independent licensed professional review.",
  },
};
