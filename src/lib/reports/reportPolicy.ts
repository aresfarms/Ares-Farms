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
    name: "Furlong Property Snapshot",
    gated: false,
    humanReview: false,
    borrowerCharged: false,
    officialUseAllowed: false,
    description:
      "Free property identity, material-warning, evidence-coverage, and next-action screen. Known hazards and uncertainty are never hidden behind payment.",
    includes: [
      "matched property identity and current-use context",
      "material warnings and constraints already known",
      "source coverage, confidence, and missing evidence",
      "customer rights and advisory-only boundary",
      "a specific next action",
    ],
  },

  paid: {
    name: "Furlong Property Report",
    gated: true,
    humanReview: false,
    borrowerCharged: true,
    payer: "customer",
    officialUseAllowed: false,
    description:
      "One-time automated property and enterprise report with version-frozen sources, assumptions, preliminary economics, financing paths, and evidence gaps.",
    includes: [
      "everything in the free snapshot",
      "preliminary single-use, mixed-use, and selected-vision comparison",
      "preliminary economics and financing calculations when inputs support them",
      "sources, assumptions, confidence, and unresolved evidence",
      "downloadable version-frozen report artifact",
    ],
  },

  environmental: {
    name: "Furlong Property Decision Report",
    gated: true,
    humanReview: true,
    borrowerCharged: true,
    payer: "customer",
    licensedProfessionalReviewRequired: false,
    officialUseAllowed: false,
    description:
      "Human-reviewed acquisition decision report with ranked scenarios, price boundaries, sensitivities, projections, and a clear next action. Professional field services remain separate.",
    includes: [
      "everything in the automated Property Report",
      "human review of evidence and calculations",
      "acquisition and offer boundaries",
      "scenario sensitivities and long-range projections",
      "proceed, renegotiate, investigate, or walk-away verdict",
    ],
  },
};
