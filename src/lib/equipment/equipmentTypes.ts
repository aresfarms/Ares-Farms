/**
 * Equipment data contract — GSA Auctions (federal personal property).
 *
 * Separate domain from the property lane: GSA Auctions sells federal PERSONAL
 * property (vehicles, machinery, aircraft/vessels, equipment, furniture, scrap),
 * NOT real estate. Source = the official GSA Auctions API (api.gsa.gov, U.S.
 * Government work = public domain). Intended for a FUTURE Farms / Equipment lane;
 * no display surface is built yet, and the source ships gated (SOURCE_LIVE off)
 * pending Module 22/23 human approval.
 *
 * Framing (same discipline as property): an item "may fit" an equipment/financing
 * need — never "you qualify / approved / eligible / guaranteed."
 *
 * Edge-safe: types + pure functions only.
 */

export type EquipmentCategory =
  | "vehicle" | "aircraft" | "vessel" | "machinery" | "equipment"
  | "furniture" | "scrap" | "other";

export interface GsaAuctionItem {
  sourceId: "gsa-auctions";
  saleNo: string;
  lotNo: string;
  itemName: string;
  category: EquipmentCategory; // derived from itemName (best-effort)
  agencyName: string | null;
  bureauName: string | null;
  city: string | null;
  state: string | null; // 2-letter where available
  zip: string | null;
  auctionStart: string | null; // ISO
  auctionEnd: string | null; // ISO
  auctionStatus: string | null; // e.g. "preview", "active", "closed"
  highBid: number | null;
  reserve: number | null;
  itemUrl: string | null; // public GSA Auctions item page
  imageUrl: string | null; // captured; not rendered yet
  isCurrent: boolean; // active/preview auction = current
  // provenance
  contentHash: string;
  fetchedAt: string;
  sourceUrl: string;
}

/** public-safe projection for a future Farms/Equipment lane (no CO contact info). */
export interface EquipmentPublicSafe {
  id: string;
  itemName: string;
  category: EquipmentCategory;
  city: string | null;
  state: string | null;
  agencyName: string | null;
  auctionEnd: string | null;
  auctionStatus: string | null;
  highBidBand: string;
  whyMayFit: string;
  sourceCitation: string;
  isCurrent: boolean;
}

export function categorize(itemName: string): EquipmentCategory {
  const s = (itemName || "").toLowerCase();
  if (/\b(truck|car|van|sedan|suv|trailer|vehicle|forklift)\b/.test(s)) return "vehicle";
  if (/\b(aircraft|airplane|plane|helicopter)\b/.test(s)) return "aircraft";
  if (/\b(boat|vessel|ship|barge|marine)\b/.test(s)) return "vessel";
  if (/\b(tractor|excavator|loader|backhoe|generator|compressor|machinery|machine|mower)\b/.test(s)) return "machinery";
  if (/\b(furniture|desk|chair|cabinet)\b/.test(s)) return "furniture";
  if (/\b(scrap|residue|salvage)\b/.test(s)) return "scrap";
  if (/\b(equipment|tool|kit|lot of)\b/.test(s)) return "equipment";
  return "other";
}

export function highBidBand(v: number | null): string {
  if (v == null || !Number.isFinite(v) || v <= 0) return "No bids yet";
  if (v < 1_000) return "Under $1k";
  if (v < 10_000) return "$1k–$10k";
  if (v < 50_000) return "$10k–$50k";
  return "$50k+";
}

export function toEquipmentPublicSafe(it: GsaAuctionItem): EquipmentPublicSafe {
  return {
    id: `${it.saleNo}-${it.lotNo}`,
    itemName: it.itemName,
    category: it.category,
    city: it.city,
    state: it.state,
    agencyName: it.agencyName,
    auctionEnd: it.auctionEnd,
    auctionStatus: it.auctionStatus,
    highBidBand: highBidBand(it.highBid),
    whyMayFit: `Federal surplus ${it.category} offered at public auction by ${it.agencyName ?? "a federal agency"} — may fit an equipment need.`,
    sourceCitation: "Source: GSA Auctions",
    isCurrent: it.isCurrent,
  };
}
