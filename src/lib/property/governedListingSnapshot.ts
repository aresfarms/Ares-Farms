export type GovernedListingSnapshot = {
  normalizedAddress: string;
  status: "Active" | "Pending" | "Sold" | "Off market";
  askingPrice: number | null;
  listingId: string | null;
  sourceName: string;
  sourceAsOf: string | null;
  sourceUrl: string | null;
  offeredParcelCount: number | null;
  offeredAcreage: number | null;
  parcelId?: string | null;
  propertyType?: string | null;
  squareFeet?: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  yearBuilt: number | null;
  listingAgent: string | null;
  listingBrokerage: string | null;
  listingPhone: string | null;
  listingEmail: string | null;
  description: string | null;
};

function key(value: string): string {
  return value.toLowerCase().replace(/\broad\b/g, "rd").replace(/[^a-z0-9]+/g, " ").trim();
}

const SNAPSHOTS: GovernedListingSnapshot[] = [
  {
    normalizedAddress: "18885 sand hill rd georgetown de 19947",
    status: "Active",
    askingPrice: 669_000,
    listingId: "DESU2102862",
    sourceName: "Bright MLS broker-reciprocity listing",
    sourceAsOf: "2026-06-19",
    sourceUrl: "https://www.redfin.com/DE/Georgetown/18885-Sand-Hill-Rd-19947/home/179443926",
    offeredParcelCount: 1,
    offeredAcreage: 13.07,
    parcelId: "135-10.00-56.00",
    propertyType: "Residential acreage estate",
    squareFeet: 2411,
    bedrooms: 4,
    bathrooms: 3.5,
    yearBuilt: 2000,
    listingAgent: "Matt Brittingham",
    listingBrokerage: "Patterson-Schwartz-Rehoboth",
    listingPhone: "302-703-6987",
    listingEmail: "jgiles@psre.com",
    description: "Active Sussex County residential acreage listing with a four-bedroom residence, private road, garage, pool, and outbuilding. Listing acreage and official parcel geometry require reconciliation before reliance.",
  },
  {
    normalizedAddress: "10870 river rd denton md 21629",
    status: "Active",
    askingPrice: 4_250_000,
    listingId: "MDCM2007072",
    sourceName: "Bright MLS broker-reciprocity listing",
    sourceAsOf: "2026-04-22",
    sourceUrl: "https://www.coldwellbanker.com/md/denton/10870-river-rd/lid-P00800000H9ncSq7OZSq3YMSqNk15pmBzBFQ8zpe",
    offeredParcelCount: 4,
    offeredAcreage: 340,
    bedrooms: 3,
    bathrooms: 2.5,
    yearBuilt: 1989,
    listingAgent: "James C Corson",
    listingBrokerage: "Benson & Mangold, LLC",
    listingPhone: "410-822-6665",
    listingEmail: "info@bensonandmangold.com",
    description: "Productive Caroline County grain farm offered as approximately 340 acres in four parcels, including about 270 tillable acres, about 200 acres under pivot, three large machine sheds, a former milking-parlor footprint, and a ranch residence overlooking the Choptank River.",
  },
];

export function findGovernedListingSnapshot(address: string | null | undefined): GovernedListingSnapshot | null {
  const target = key(address ?? "");
  if (!target) return null;
  return SNAPSHOTS.find((item) => target.includes(key(item.normalizedAddress)) || key(item.normalizedAddress).includes(target)) ?? null;
}
