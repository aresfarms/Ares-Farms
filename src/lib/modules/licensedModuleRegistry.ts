/**
 * Licensed Module + Partner Registry
 *
 * The single, extensible source of truth for the platform's LICENSED modules
 * (where a licensed professional performs regulated work) and the PARTNERS that
 * fulfill under each. Adding a new partner lender (e.g. Chamois Bank) or a new
 * PE firm is a CONFIG entry here — not code. Each licensed module is its own
 * page; partners sit under their module and are routed to through the licensed
 * spoke.
 *
 * Master Volume Governance:
 * - Vol I (FACILITATION-001): the platform routes to a licensed party; it never
 *   performs the regulated act itself.
 * - Vol II (REG-TPRM-001 / TECH-CONN-001): a partner is only surfaced/eligible
 *   for live routing once its connector is certified and its data agreement
 *   (DPA) is in place. `status: "pending-certification"` partners are NOT live
 *   and are not shown on public surfaces.
 * - Bright line: Furlong takes no transaction-tied compensation from any partner.
 */

export type LicensedPartnerKind = "lender" | "environmental-firm";

export type LicensedPartnerStatus =
  // Live: certified connector + DPA in place; may fulfill and be shown publicly.
  | "active"
  // In the registry but NOT live: connector certification / DPA pending.
  | "pending-certification";

export interface LicensedPartner {
  slug: string;
  name: string;
  kind: LicensedPartnerKind;
  status: LicensedPartnerStatus;
  /** Short public-safe description (only shown for active partners). */
  blurb: string;
  /** Governance note (internal): what must be true before going live. */
  gate?: string;
}

export interface LicensedModule {
  slug: string;
  label: string;
  /** Light-theme accent (see laneThemes). */
  accent: string;
  /** The licensed spoke this module routes to. */
  routedTo: string;
  requestType: "environmental_report_order" | "financing_deal_intake";
  partners: LicensedPartner[];
}

export const LICENSED_MODULES: LicensedModule[] = [
  {
    slug: "environmental-compliance",
    label: "Environmental & Compliance",
    accent: "#127a4f",
    routedTo: "environmental-engineering-spoke",
    requestType: "environmental_report_order",
    partners: [
      {
        slug: "furlong-pe",
        name: "In-house licensed PE",
        kind: "environmental-firm",
        status: "active",
        blurb:
          "Phase I / II / III assessments and PE reviews performed by a licensed professional engineer.",
      },
    ],
  },
  {
    slug: "financing-capital",
    label: "Financing & Capital",
    accent: "#534AB7",
    routedTo: "furlong-capital-desk",
    requestType: "financing_deal_intake",
    // Step 3 lender candidates live in lenderNetworkRegistry.ts and remain
    // non-routable until certified. The retained external broker workspace is
    // not a public/active financing partner.
    partners: [],
  },
];

export function licensedModule(slug: string): LicensedModule | undefined {
  return LICENSED_MODULES.find((m) => m.slug === slug);
}

/** Partners safe to surface publicly + eligible for live routing. */
export function activePartners(slug: string): LicensedPartner[] {
  return (licensedModule(slug)?.partners ?? []).filter(
    (p) => p.status === "active"
  );
}
