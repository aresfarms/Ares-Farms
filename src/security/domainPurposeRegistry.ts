/**
 * DOMAIN-GOVERNANCE-002 — Domain Purpose Registry (2026-06-12).
 *
 * Records the OWNED domain portfolio with intended purpose, module alignment,
 * and redirect posture — WITHOUT activating any DNS. Prevents domain drift:
 * Furlong is the public decision-intelligence hub; Compass to Capital is the
 * capital/financing pathway and Five Borough/Stuart professional-module
 * surface; typo domains are defensive redirects, never separate brands.
 *
 * Composes with (does NOT replace) DOMAIN-ASSET-001
 * (domainAssetManifest.ts) — that contract stays exactly the two Furlong
 * domains. This registry is the broader PURPOSE inventory including the
 * Compass portfolio.
 *
 * BOUNDARY LOCK (§4): Five Borough Capital is Stuart Fraass's professional
 * financing module; Compass to Capital is the clearer user-facing capital
 * pathway brand/surface. Furlong may route to Compass/Five Borough ONLY
 * through explicit professional-module handoff. Furlong Core must not
 * silently become Five Borough Capital; Five Borough may be absorbed
 * operationally as a CONNECTED professional module, never collapsed into
 * Furlong Core. "Furlong informs. Compass/Five Borough performs professional
 * financing work when separately activated."
 *
 * HARD RULES: no DNS cutover; no domain marked live; SEC-DNS-001 stays OPEN;
 * canonical selection requires Caitlin's approval.
 */

export type DnsStatus = "unverified" | "verified" | "configured" | "live";

export interface DomainPurposeRecord {
  domain: string;
  owned: boolean;
  intendedRole: string;
  moduleAlignment: string[];
  canonicalCandidate: boolean;
  redirectTarget?: string;
  redirectOnly: boolean;
  dnsStatus: DnsStatus;
  productionApproved: boolean;
  securityCritical: boolean;
  notes: string[];
}

export const DOMAIN_PURPOSE_DOCTRINE_ID = "DOMAIN-GOVERNANCE-002";

export const FURLONG_COMPASS_BOUNDARY_LOCK =
  "Furlong informs. Compass/Five Borough performs professional financing work when separately activated.";

/** §5 — typo-domain rules (locked). */
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
    domain: "furlonghub.com",
    owned: true,
    intendedRole: "primary Furlong platform candidate — public decision-intelligence hub; likely canonical production domain, pending Caitlin approval",
    moduleAlignment: [
      "Furlong Core", "property intelligence", "ownership intelligence", "pathway discovery",
      "transaction reality", "life-event resilience", "professional module routing",
    ],
    canonicalCandidate: true,
    redirectOnly: false,
    dnsStatus: "unverified",
    productionApproved: false,
    securityCritical: true,
    notes: ["production use not approved", "SEC-DNS-001 remains open", "canonical selection is Caitlin's call at DNS sign-off"],
  },
  {
    domain: "furlongpathways.com",
    owned: true,
    intendedRole: "Furlong marketing / education / campaign domain ('find your pathway'); possible redirect to furlonghub.com or landing-page surface",
    moduleAlignment: ["Furlong Core / pathways education"],
    canonicalCandidate: false,
    redirectTarget: "furlonghub.com",
    redirectOnly: false,
    dnsStatus: "unverified",
    productionApproved: false,
    securityCritical: true,
    notes: ["not canonical unless separately approved", "likely redirect or marketing alias", "current public alpha references this host — role shift needs Caitlin sign-off"],
  },
  {
    domain: "compasstocapital.com",
    owned: true,
    intendedRole: "capital / financing pathway domain — public surface for Compass to Capital, connected to Five Borough Capital / Stuart Fraass professional financing module; NOT Furlong Core; separate but connected",
    moduleAlignment: [
      "Financing Intelligence handoff", "Five Borough Capital licensed/professional module",
      "Compass to Capital user-facing capital pathway surface",
    ],
    canonicalCandidate: false,
    redirectOnly: false,
    dnsStatus: "unverified",
    productionApproved: false,
    securityCritical: true,
    notes: ["professional-module surface candidate", "not canonical Furlong domain", "explicit-handoff-only from Furlong Core"],
  },
  {
    domain: "comapss2capital.com",
    owned: true,
    intendedRole: "defensive typo registration for Compass to Capital — captures common misspelling/misentry; redirect candidate to compasstocapital.com",
    moduleAlignment: ["Compass to Capital / Five Borough defensive routing"],
    canonicalCandidate: false,
    redirectTarget: "compasstocapital.com",
    redirectOnly: true,
    dnsStatus: "unverified",
    productionApproved: false,
    securityCritical: false,
    notes: ["redirect-only", "must not host separate product"],
  },
  {
    domain: "comapss2capital.org",
    owned: true,
    intendedRole: "defensive typo / alternate-extension registration; possible educational or nonprofit-facing future use ONLY if approved; initial posture redirect-only",
    moduleAlignment: ["Compass to Capital / Five Borough defensive routing"],
    canonicalCandidate: false,
    redirectTarget: "compasstocapital.com",
    redirectOnly: true,
    dnsStatus: "unverified",
    productionApproved: false,
    securityCritical: false,
    notes: ["redirect-only unless Caitlin approves separate use"],
  },
];

export function domainPurpose(domain: string): DomainPurposeRecord | undefined {
  return DOMAIN_PURPOSE_REGISTRY.find((d) => d.domain === domain);
}
