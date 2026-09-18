/**
 * Provider registry — the neutral-directory / license-to-operate model.
 *
 * Furlong is a neutral directory + gateway. Public providers are optional. Each
 * licensed provider gets a Provider Page (their branding + claims, under THEIR
 * license) with a single portal-out CTA to the provider's OWN site/intake.
 * Furlong passes NO personal data (no silent submission). Institutions may pay
 * for platform infrastructure, integrations, workflow tooling, support, or an
 * enterprise environment — never for public rank, placement, a lead, a referral,
 * or a commission — so Furlong has no economic reason to steer a customer.
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
 * The public institutional-economics statement shown verbatim on every Provider
 * Page. Verification determines whether a provider may appear; payment never buys
 * inclusion, placement, rank, or access to a customer file.
 */
export function licenseModelStatement(providerName: string): string {
  return (
    `${providerName} may pay Furlong for institutional platform infrastructure, integrations, or support. ` +
    `That payment never buys this listing, a better rank, a lead, or access to your file. Furlong does not take ` +
    `referral fees or a commission on your deal, and does not sell or submit your information.`
  );
}

export const PROVIDERS: Provider[] = [];

/**
 * No public financing provider is currently listed. The retained external
 * broker workspace is an authenticated transition workspace only; keeping that
 * portal open does not make the broker a public Furlong provider, affiliate,
 * preferred recipient, or automatic routing destination.
 */

export function providerBySlug(slug: string): Provider | null {
  return PROVIDERS.find((p) => p.slug === slug) ?? null;
}

export function providersForLane(lane: string): Provider[] {
  return PROVIDERS.filter((p) => p.lane === lane);
}
