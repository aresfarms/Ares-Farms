/**
 * Current listing-price evidence, not market valuation. TECH-PROV-001 /
 * CANON-EXPL-001. Replay uses an explicit asOf; no substring address matching.
 */
export const LISTING_PRICE_VERSION = "listing-price-evidence-v1.0.0";
export const LISTING_MAX_AGE_DAYS = 7;
export function normalizedListingAddress(value: string): string {
  const abbreviations: Record<string,string> = { road: "rd", street: "st", avenue: "ave", boulevard: "blvd", lane: "ln", drive: "dr", court: "ct", highway: "hwy", apartment: "unit", apt: "unit", suite: "unit" };
  return value.toLowerCase().replace(/#/g, " unit ").replace(/\b[a-z]+\b/g, token => abbreviations[token] ?? token).replace(/[^a-z0-9]+/g, " ").trim();
}
export interface ListingPriceEvidence {
  version: typeof LISTING_PRICE_VERSION;
  status: "current-asking-price" | "price-pending";
  amountUsd: number | null;
  historicalAmountUsd: number | null;
  listingStatus: string | null;
  sourceName: string | null;
  sourceUrl: string | null;
  observedAt: string | null;
  reason: string;
}
export function resolveListingPrice(input: {
  subjectAddress: string; sourceAddress: string; sourceName?: string | null;
  sourceUrl?: string | null; observedAt?: string | null; asOf: string;
  price?: number | null; status?: string | null; approved: boolean;
  priceKind: "asking" | "auction-bid" | "assessment" | "unknown";
}): ListingPriceEvidence {
  const amount = typeof input.price === "number" && Number.isFinite(input.price) && input.price > 0 ? input.price : null;
  const observed = Date.parse(input.observedAt ?? ""), asOf = Date.parse(input.asOf);
  const exact = Boolean(input.subjectAddress.trim() && normalizedListingAddress(input.subjectAddress) === normalizedListingAddress(input.sourceAddress));
  const current = Number.isFinite(observed) && Number.isFinite(asOf) && observed <= asOf && asOf - observed <= LISTING_MAX_AGE_DAYS * 86400000;
  const active = /^(active|for[_ -]sale|available)$/i.test(input.status?.trim() ?? "");
  const reason = !input.approved ? "Source approval is pending." : !exact ? "Exact full-address match is not established." :
    !current ? "Current listing recheck is pending; an old observation is not a current asking price." :
    !active ? "The source does not establish an active asking price; pending or sold status does not verify a contract amount." :
    input.priceKind !== "asking" ? "Starting bids, assessments and unclassified prices are not asking prices." :
    !amount ? "The approved source does not publish a usable asking price." :
    !/^https:\/\//.test(input.sourceUrl ?? "") ? "Source provenance is missing." :
    "Current asking price from the approved, exact-address source; not proof of market value.";
  const usable = input.approved && exact && current && active && input.priceKind === "asking" && amount != null && /^https:\/\//.test(input.sourceUrl ?? "");
  return { version: LISTING_PRICE_VERSION, status: usable ? "current-asking-price" : "price-pending",
    amountUsd: usable ? amount : null, historicalAmountUsd: exact && input.approved && input.priceKind === "asking" ? amount : null,
    listingStatus: exact && input.approved && current ? input.status ?? null : null,
    sourceName: input.sourceName ?? null, sourceUrl: input.sourceUrl ?? null, observedAt: input.observedAt ?? null, reason };
}

/** Some feeds store a full address in exactAddress; others store street only. */
export function fullListingAddress(row: {exactAddress?: string | null; town?: string | null; state?: string | null; zip?: string | null}): string {
  const street = row.exactAddress?.trim() ?? "";
  const suffix = [row.state, row.zip].filter(Boolean).join(" ");
  if (suffix && normalizedListingAddress(street).endsWith(normalizedListingAddress(suffix))) return street;
  return [street, row.town, row.state, row.zip].filter(Boolean).join(" ");
}
