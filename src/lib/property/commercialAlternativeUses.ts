/**
 * commercialAlternativeUses — the commercial analog of the farm best-use
 * screen (founder direction 2026-07-29: "some buildings are suited for more
 * than one purpose that might be a higher value than it's currently
 * marketed for").
 *
 * A building is usually marketed for its LAST use, not its highest. This
 * deterministic screen lists the plausible alternative uses the building's
 * verified facts (zoning text, land use, square footage) do not rule out —
 * each with why it can out-earn the marketed purpose and what still governs.
 * Honesty rules: zoning verification is always step one; nothing here is a
 * value opinion, an appraisal, or a permitted-use determination.
 */

export interface AlternativeUse {
  use: string;
  why: string;
  watch: string;
}

export function commercialAlternativeUses(args: {
  zoning: string | null;
  landUse: string | null;
  squareFeet: number | null;
  town: string | null;
}): { uses: AlternativeUse[]; note: string } {
  const zoningText = `${args.zoning ?? ""} ${args.landUse ?? ""}`.toLowerCase();
  const zoningKnown = Boolean(args.zoning?.trim());
  const sqft = args.squareFeet;
  const industrialish = /industrial|warehouse|flex|manufactur/i.test(zoningText);
  const mainStreetish = /mixed|central business|village|town center|downtown|main street|\bcbd\b/i.test(zoningText);

  const uses: AlternativeUse[] = [];

  uses.push({
    use: "Professional / medical office",
    why: "Office and medical tenants pay for location stability rather than foot traffic, and often out-earn marginal retail in the same shell with modest fit-out.",
    watch: "Parking ratios, ADA access, and zoning use tables govern; medical adds plumbing and ventilation fit-out.",
  });
  uses.push({
    use: "Retail / service storefront",
    why: "Ground-floor visibility monetizes traffic the marketed use may be ignoring — service retail (salon, tax, clinic-adjacent) needs less foot traffic than shops.",
    watch: "Traffic counts and co-tenancy decide rent; signage and parking rules apply.",
  });
  if (sqft == null || sqft >= 2500 || industrialish) {
    uses.push({
      use: "Flex / light industrial",
      why: "Trades, fabrication, and last-mile users routinely out-bid retail for plain square footage — the cheapest conversion when ceilings and access doors cooperate.",
      watch: "Zoning use table, ceiling height, door/loading access, and power service govern.",
    });
    uses.push({
      use: "Warehouse / self-storage",
      why: "Storage monetizes otherwise-hard-to-lease depth with minimal staffing; demand tracks households, not retail cycles.",
      watch: "Zoning, sprinkler/fire code by storage type, and local saturation govern.",
    });
  }
  if (mainStreetish || !zoningKnown) {
    uses.push({
      use: "Mixed-use with upper-floor residential",
      why: "Many main-street buildings out-earn single-use retail by putting apartments above — housing demand is steadier than storefront demand.",
      watch: "Zoning must permit residential above commercial; separate egress, fire separation, and utilities drive the conversion budget.",
    });
  }
  uses.push({
    use: "Food service / commissary",
    why: "Kitchens capture delivery-era demand (restaurant, ghost kitchen, shared commissary) at rents plain retail rarely reaches.",
    watch: "Hood/ventilation and grease infrastructure are the big capex; health permits and parking govern.",
  });

  return {
    uses: uses.slice(0, 5),
    note:
      `A building is often marketed for its last use, not its highest${args.town ? ` — in ${args.town}, ` : " — "}the screen above lists uses the verified record does not rule out. ` +
      `${zoningKnown ? `Recorded zoning ("${args.zoning}") was used to filter; the municipal use table is the authority.` : "No zoning is recorded for this parcel — zoning verification is step one before any of these."} ` +
      "This is a screening lens, not a value opinion, appraisal, or permitted-use determination — parking, ADA, fire/life-safety, and permitting govern every conversion.",
  };
}
