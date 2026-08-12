/**
 * DOMAIN-GOVERNANCE-002 — Domain Purpose Registry.
 * FOUNDER DECISION PATCH (2026-06-14): inferred assignments replaced with
 * founder-approved roles. The registry now reflects ACTUAL ownership and
 * INTENDED architecture, not inference.
 *
 * Records the OWNED domain portfolio (six domains) with intended purpose,
 * module alignment, and redirect posture — WITHOUT activating any DNS.
 *
 * Composes with (does NOT replace) DOMAIN-ASSET-001 (domainAssetManifest.ts) —
 * that contract stays exactly the two Furlong domains. This registry is the
 * broader PURPOSE inventory including the Compass to Capital portfolio.
 *
 * CONSTITUTIONAL LOCK (§5 of the patch — DOMAIN_ROLE_CONSTITUTIONAL_LOCK):
 *   Furlong Pathways is the public front door.
 *   Furlong Hub is the ecosystem hub.
 *   Compass to Capital is the capital-navigation brand.
 *   Five Borough Capital remains a professional financing module inside the
 *   ecosystem. The domains must not collapse these roles into one identity.
 *
 * BOUNDARY LOCK (FURLONG_COMPASS_BOUNDARY_LOCK): Compass to Capital is the
 * user-facing capital-navigation brand and a Furlong-OWNED asset — NOT
 * automatically Five Borough Capital. It MAY route to Five Borough and future
 * capital providers, and MUST preserve the financing-neutrality doctrine.
 * Five Borough Capital is Stuart Fraass's professional financing module,
 * absorbed only as a CONNECTED module, never collapsed into Furlong Core.
 * "Furlong informs. Compass/Five Borough performs professional financing work
 * when separately activated."
 *
 * HARD RULES: governance decision only; no DNS cutover; no domain marked live;
 * no redirect activated; SEC-DNS-001 stays OPEN; production not approved;
 * canonical/redirect activation requires founder approval at launch planning.
 */

export type DnsStatus = "unverified" | "verified" | "configured" | "live";

export interface DomainPurposeRecord {
  domain: string;
  owned: boolean;
  intendedRole: string;
  moduleAlignment: string[];
  /** Canonical PUBLIC production-domain candidate (Furlong Pathways). */
  canonicalCandidate: boolean;
  /** Ecosystem HUB-domain candidate (Furlong Hub). */
  hubCandidate: boolean;
  /** Capital-navigation BRAND candidate (Compass to Capital .com). */
  capitalBrandCandidate: boolean;
  /** Defensive / typo / alternate-extension registration. */
  defensiveRegistration: boolean;
  redirectTarget?: string;
  redirectOnly: boolean;
  dnsStatus: DnsStatus;
  productionApproved: boolean;
  securityCritical: boolean;
  notes: string[];
}

export const DOMAIN_PURPOSE_DOCTRINE_ID = "DOMAIN-GOVERNANCE-002";

/** §5 — role constitutional lock (verbatim, founder-approved). */
export const DOMAIN_ROLE_CONSTITUTIONAL_LOCK =
  "Furlong Pathways is the public front door. Furlong Hub is the ecosystem hub. " +
  "Compass to Capital is the capital-navigation brand. Five Borough Capital remains " +
  "a professional financing module inside the ecosystem. The domains must not " +
  "collapse these roles into a single identity.";

export const FURLONG_COMPASS_BOUNDARY_LOCK =
  "Furlong informs. Compass/Five Borough performs professional financing work when separately activated.";

/** Domains that are NOT owned and must never appear in planning. */
export const NON_OWNED_EXCLUDED_DOMAINS = [
  "compass2capital.com", // not owned, not governed, not in DNS/redirect planning
] as const;

/** Typo / defensive-domain rules (locked). */
export const TYPO_DOMAIN_RULES = [
  "typo domains must not become independent brands",
  "typo domains must not host separate application logic",
  "typo domains must not bypass module boundaries",
  "typo domains must redirect only to approved canonical module surface",
  "redirects must preserve HTTPS once DNS is live",
  "redirects must be documented in SEC-DNS-001 sign-off",
] as const;

export const DOMAIN_PURPOSE_REGISTRY: DomainPurposeRecord[] = [
  {
    domain: "furlongpathways.com",
    owned: true,
    intendedRole:
      "PRIMARY public-facing Furlong brand — Discovery Engine front door, newsletter destination, membership destination, Curated Opportunity Pipeline destination, consumer-facing experience",
    moduleAlignment: [
      "Furlong Core", "Discovery Engine", "newsletter", "membership",
      "Curated Opportunity Pipeline", "consumer-facing experience",
    ],
    canonicalCandidate: true,
    hubCandidate: false,
    capitalBrandCandidate: false,
    defensiveRegistration: false,
    redirectOnly: false,
    dnsStatus: "configured",
    productionApproved: false,
    securityCritical: true,
    notes: [
      "founder-approved primary public-domain candidate",
      "production not approved", "Squarespace DNS active with Coming Soon parking; application production not activated", "SEC-DNS-001 remains open",
    ],
  },
  {
    domain: "furlonghub.com",
    owned: true,
    intendedRole:
      "ecosystem HUB — provider access, future broker module, future lender module, future partner module, administrative and platform surfaces",
    moduleAlignment: [
      "ecosystem hub", "provider access", "future broker module",
      "future lender module", "future partner module", "administrative / platform surfaces",
    ],
    canonicalCandidate: false,
    hubCandidate: true,
    capitalBrandCandidate: false,
    defensiveRegistration: false,
    redirectOnly: false,
    dnsStatus: "unverified",
    productionApproved: false,
    securityCritical: true,
    notes: [
      "founder-approved hub-domain candidate",
      "production not approved", "DNS not activated",
    ],
  },
  {
    domain: "compasstocapital.com",
    owned: true,
    intendedRole:
      "capital-navigation brand — Financing Intelligence surface, capital-pathway education, future financing module destination",
    moduleAlignment: [
      "Compass to Capital capital-navigation brand", "Financing Intelligence surface",
      "capital-pathway education", "future financing module destination",
    ],
    canonicalCandidate: false,
    hubCandidate: false,
    capitalBrandCandidate: true,
    defensiveRegistration: false,
    redirectOnly: false,
    dnsStatus: "configured",
    productionApproved: false,
    securityCritical: true,
    notes: [
      "Furlong-owned asset — NOT automatically Five Borough Capital",
      "may route to Five Borough and future capital providers",
      "must preserve financing-neutrality doctrine",
      "production not approved",
    ],
  },
  {
    domain: "compasstocapital.org",
    owned: true,
    intendedRole:
      "alternate extension for Compass to Capital — redirect candidate / defensive registration",
    moduleAlignment: ["Compass to Capital alternate-extension / defensive routing"],
    canonicalCandidate: false,
    hubCandidate: false,
    capitalBrandCandidate: false,
    defensiveRegistration: true,
    redirectTarget: "compasstocapital.com",
    redirectOnly: true,
    dnsStatus: "unverified",
    productionApproved: false,
    securityCritical: false,
    notes: ["redirect-only", "defensive registration", "no redirect activated until founder approval"],
  },
  {
    domain: "comapss2capital.com",
    owned: true,
    intendedRole:
      "defensive typo registration for Compass to Capital — captures common misspelling; redirect candidate to compasstocapital.com",
    moduleAlignment: ["Compass to Capital defensive routing"],
    canonicalCandidate: false,
    hubCandidate: false,
    capitalBrandCandidate: false,
    defensiveRegistration: true,
    redirectTarget: "compasstocapital.com",
    redirectOnly: true,
    dnsStatus: "unverified",
    productionApproved: false,
    securityCritical: false,
    notes: ["redirect-only", "defensive typo registration", "must not host separate product"],
  },
  {
    domain: "comapss2capital.org",
    owned: true,
    intendedRole:
      "defensive typo registration (alternate extension) for Compass to Capital — redirect candidate to compasstocapital.com",
    moduleAlignment: ["Compass to Capital defensive routing"],
    canonicalCandidate: false,
    hubCandidate: false,
    capitalBrandCandidate: false,
    defensiveRegistration: true,
    redirectTarget: "compasstocapital.com",
    redirectOnly: true,
    dnsStatus: "unverified",
    productionApproved: false,
    securityCritical: false,
    notes: ["redirect-only", "defensive typo registration", "must not host separate product"],
  },
];

export function domainPurpose(domain: string): DomainPurposeRecord | undefined {
  return DOMAIN_PURPOSE_REGISTRY.find((d) => d.domain === domain);
}
