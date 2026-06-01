/**
 * Billing Plan Registry
 *
 * Master Volume Governance:
 * - Vol I: keeps payment authority separate from platform governance.
 * - Vol II: prevents billing from implying credit, financing, permitting,
 *   legal, regulatory, approval, or eligibility decisions.
 * - Vol III: preserves deterministic entitlement mapping.
 * - Vol IV: supports controlled payment promotion and operator review.
 * - Vol V: keeps borrower-free access, portability, and disclosure limits
 *   separate from institutional billing.
 *
 * Customer-facing rule:
 * Borrowers pay nothing. These plan labels are for institution-funded or
 * operator-controlled workflows only.
 */

export const PLANS = {
  free: {
    name: "Borrower Baseline Readiness",
    price: 0,
    borrowerCharged: false,
    payer: "none",
    reports: ["free"],
  },

  paid: {
    name: "Institutional Operations Plan",
    price: 49.99,
    borrowerCharged: false,
    payer: "institution",
    reports: ["free", "paid"],
  },

  environmental: {
    name: "Institutional Environmental Review Support",
    price: 1499.0,
    borrowerCharged: false,
    payer: "institution",
    reports: ["free", "paid", "environmental"],
  },
};
