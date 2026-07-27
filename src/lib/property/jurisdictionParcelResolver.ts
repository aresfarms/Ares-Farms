import { governedFetch } from "@/lib/security/outboundRequestPolicy";

export type JurisdictionParcelRecord = {
  sourceName: string;
  sourceAsOf: string | null;
  sourceUrl: string | null;
  accountId: string;
  parcelRefs: string[];
  acreageText: string | null;
  landUse: string | null;
  zoning: string | null;
  deedReference: string | null;
  legalDescription: string | null;
  yearBuilt: number | null;
  squareFeet: number | null;
  buildingStyle: string | null;
  buildingType: string | null;
  assessedLandValue: number | null;
  assessedImprovementValue: number | null;
  assessedTotalValue: number | null;
  publicWater: boolean | null;
  publicSewer: boolean | null;
  waterfront: boolean | null;
};

type AddressInput = { street: string; city: string; state: string; zip?: string | null };

function clean(value: unknown): string | null {
  const text = String(value ?? "").trim();
  return text || null;
}
function number(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed !== 0 ? parsed : null;
}
function flag(value: unknown): boolean | null {
  const text = String(value ?? "").trim();
  if (!text) return null;
  if (["1", "Y", "YES"].includes(text.toUpperCase())) return true;
  if (["0", "2", "N", "NO"].includes(text.toUpperCase())) return false;
  return null;
}
function escapeSql(value: string): string { return value.replace(/'/g, "''"); }

async function resolveMaryland(input: AddressInput): Promise<JurisdictionParcelRecord | null> {
  const match = input.street.trim().match(/^(\d+[A-Za-z]?)\s+(.+?)(?:\s+(?:RD|ROAD|ST|STREET|AVE|AVENUE|LN|LANE|DR|DRIVE|CT|COURT|HWY|HIGHWAY|BLVD|BOULEVARD|WAY|PIKE|TRL|TRAIL))?$/i);
  if (!match) return null;
  const streetNumber = match[1].replace(/[^0-9A-Za-z]/g, "");
  const streetName = match[2].trim().replace(/\s+/g, " ");
  const where = `PREMSNUM='${escapeSql(streetNumber)}' AND UPPER(PREMSNAM) LIKE '%${escapeSql(streetName.toUpperCase())}%' AND UPPER(PREMCITY) LIKE '%${escapeSql(input.city.toUpperCase())}%'`;
  const params = new URLSearchParams({
    f: "json", where,
    outFields: "ACCTID,ADDRESS,PREMSNUM,PREMSNAM,PREMSTYP,PREMCITY,PREMZIP,LEGAL1,LEGAL2,LEGAL3,DR1LIBER,DR1FOLIO,MAP,GRID,PARCEL,LOT,ZONING,DESCLU,ACRES,LANDAREA,LUOM,PFUW,PFUS,PFLW,YEARBLT,SQFTSTRC,DESCSTYL,DESCBLDG,NFMLNDVL,NFMIMPVL,NFMTTLVL,SDATWEBADR,SDATDATE",
    returnGeometry: "false",
    resultRecordCount: "5",
  });
  const endpoint = `https://mdgeodata.md.gov/imap/rest/services/PlanningCadastre/MD_PropertyData/MapServer/0/query?${params.toString()}`;
  const response = await governedFetch(endpoint, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(12_000) });
  if (!response.ok) return null;
  const body = await response.json() as { features?: Array<{ attributes?: Record<string, unknown> }> };
  const attrs = body.features?.[0]?.attributes;
  if (!attrs || !clean(attrs.ACCTID)) return null;
  const refs = [clean(attrs.ACCTID), clean(attrs.MAP) && clean(attrs.PARCEL) ? `Map ${clean(attrs.MAP)} · Parcel ${clean(attrs.PARCEL)}${clean(attrs.GRID) ? ` · Grid ${clean(attrs.GRID)}` : ""}${clean(attrs.LOT) ? ` · Lot ${clean(attrs.LOT)}` : ""}` : null].filter((v): v is string => Boolean(v));
  const legal = [attrs.LEGAL1, attrs.LEGAL2, attrs.LEGAL3].map(clean).filter(Boolean).join(" · ") || null;
  const deed = clean(attrs.DR1LIBER) || clean(attrs.DR1FOLIO) ? `Liber ${clean(attrs.DR1LIBER) ?? "—"} · Folio ${clean(attrs.DR1FOLIO) ?? "—"}` : null;
  const acres = number(attrs.ACRES) ?? (String(attrs.LUOM ?? "").toUpperCase() === "A" ? number(attrs.LANDAREA) : null);
  return {
    sourceName: "Maryland SDAT / MD iMAP Property Data",
    sourceAsOf: clean(attrs.SDATDATE), sourceUrl: clean(attrs.SDATWEBADR), accountId: clean(attrs.ACCTID)!, parcelRefs: refs,
    acreageText: acres == null ? null : `${acres.toLocaleString("en-US", { maximumFractionDigits: 3 })} acres`, landUse: clean(attrs.DESCLU), zoning: clean(attrs.ZONING), deedReference: deed, legalDescription: legal,
    yearBuilt: number(attrs.YEARBLT), squareFeet: number(attrs.SQFTSTRC), buildingStyle: clean(attrs.DESCSTYL), buildingType: clean(attrs.DESCBLDG),
    assessedLandValue: number(attrs.NFMLNDVL), assessedImprovementValue: number(attrs.NFMIMPVL), assessedTotalValue: number(attrs.NFMTTLVL),
    publicWater: flag(attrs.PFUW), publicSewer: flag(attrs.PFUS), waterfront: flag(attrs.PFLW),
  };
}

export async function resolveJurisdictionParcel(input: AddressInput): Promise<JurisdictionParcelRecord | null> {
  if (input.state.toUpperCase() === "MD") return resolveMaryland(input);
  return null;
}
