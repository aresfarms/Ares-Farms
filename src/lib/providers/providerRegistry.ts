/**
 * Provider registry — the neutral-directory / license-to-operate model.
 *
 * Furlong is a neutral directory + gateway, NOT a lender/broker/agency. Each
 * licensed provider gets a Provider Page (their branding + claims, under THEIR
 * license) with a single portal-out CTA to the provider's OWN site/intake.
 * Furlong passes NO personal data (no silent submission). Providers pay a flat
 * license-to-operate fee — never a referral/lead/commission fee — so Furlong has
 * zero incentive to steer visitors, and "Furlong sells your data" is structurally
 * false.
 *
 * Technical pathway = LINK-OUT (option A): the CTA opens the provider's own
 * website. No embedded intake, no backend data conduit. Edge-safe (pure data).
 */

export interface Provider {
  slug: string;
  name: string;
  lane: string; // explore lane id, e.g. "financing-capital"
  tagline: string;
  /** "<Name> is a separate company" — always shown. */
  separateCompanyLabel: string;
  /** Honesty note when a provider is founder-affiliated (no financial-incentive concern: equal terms, no referral fee). */
  affiliationNote?: string;
  /** The provider's own description of what they do (their words, under their brand). */
  whatTheyDo: string[];
  whoTheyServe: string;
  /** The provider's licensing (verified at onboarding — Module 10). */
  licenseStatement: string;
  /** The provider's OWN claims — attributed to them, never made on a Furlong surface. */
  providerClaims: string[];
  /** The provider's OWN disclosures (their claims are theirs, under their regulation). */
  providerDisclosures: string[];
  /** Portal-out target: the provider's own website / intake. Furlong passes no data. */
  portalOutUrl: string;
  portalOutLabel: string;
}

/**
 * The public license-model statement shown verbatim on every Provider Page.
 * The MODEL is transparent; the FEE AMOUNT is private (never published; appears
 * only in aggregate in Furlong's yearly financial disclosures).
 */
export function licenseModelStatement(providerName: string): string {
  return (
    `${providerName} pays Furlong a license fee to be listed here. Furlong does not take referral fees, ` +
    `does not earn a commission on your deal, and does not sell or submit your information. ` +
    `Providers pay to belong — never the other way around.`
  );
}

export const PROVIDERS: Provider[] = [
  {
    slug: "five-borough-capital",
    name: "Five Borough Capital",
    lane: "financing-capital",
    tagline: "SBA & USDA financing brokerage — structuring and consultation for borrowers.",
    separateCompanyLabel: "Five Borough Capital is a separate company.",
    affiliationNote:
      "Five Borough Capital is affiliated with Furlong. It is listed on the same license terms as every " +
      "other provider — no referral fee, no special placement.",
    whatTheyDo: [
      "Helps borrowers pursue SBA and USDA financing pathways.",
      "Loan structuring and packaging support.",
      "One-on-one consultation on options and readiness.",
    ],
    whoTheyServe: "Small businesses, farmers, and property buyers exploring SBA / USDA financing.",
    licenseStatement: "Licensed commercial loan broker (verified at onboarding — Module 10 certification).",
    // These claims belong to the licensed broker, under its own brand + disclosures.
    // PLACEHOLDER copy pending Stuart's PDF — to be polished separately for accuracy.
    providerClaims: [
      "100% SBA / USDA financing structures for eligible projects.",
      "Deal structuring and lender packaging.",
      "Borrower consultation from a licensed broker.",
    ],
    providerDisclosures: [
      "Five Borough Capital is a licensed commercial loan broker; these statements are its own, made under its license and regulation — not Furlong's.",
      "Financing is subject to lender approval, eligibility, and underwriting. Nothing here is a commitment to lend or a guarantee of funding.",
    ],
    // PLACEHOLDER — confirm the real intake URL with Stuart before launch.
    portalOutUrl: "https://www.fiveboroughcapital.com",
    portalOutLabel: "Go to Five Borough Capital",
  },
];

export function providerBySlug(slug: string): Provider | null {
  return PROVIDERS.find((p) => p.slug === slug) ?? null;
}

export function providersForLane(lane: string): Provider[] {
  return PROVIDERS.filter((p) => p.lane === lane);
}
