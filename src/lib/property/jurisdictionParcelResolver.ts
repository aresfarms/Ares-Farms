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
  resolvedParcelCount: number;
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

async function queryMaryland(where: string, count = 20): Promise<Array<Record<string, unknown>>> {
  const params = new URLSearchParams({
    f: "json", where,
    outFields: "ACCTID,ADDRESS,PREMSNUM,PREMSNAM,PREMSTYP,PREMCITY,PREMZIP,LEGAL1,LEGAL2,LEGAL3,DR1LIBER,DR1FOLIO,MAP,GRID,PARCEL,LOT,ZONING,DESCLU,ACRES,LANDAREA,LUOM,PFUW,PFUS,PFLW,YEARBLT,SQFTSTRC,DESCSTYL,DESCBLDG,NFMLNDVL,NFMIMPVL,NFMTTLVL,SDATWEBADR,SDATDATE",
    returnGeometry: "false", resultRecordCount: String(count),
  });
  const endpoint = `https://mdgeodata.md.gov/imap/rest/services/PlanningCadastre/MD_PropertyData/MapServer/0/query?${params.toString()}`;
  const response = await governedFetch(endpoint, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(12_000) });
  if (!response.ok) return [];
  const body = await response.json() as { features?: Array<{ attributes?: Record<string, unknown> }> };
  return (body.features ?? []).map((item) => item.attributes ?? {}).filter((item) => clean(item.ACCTID));
}

async function resolveMaryland(input: AddressInput): Promise<JurisdictionParcelRecord | null> {
  const match = input.street.trim().match(/^(\d+[A-Za-z]?)\s+(.+?)(?:\s+(?:RD|ROAD|ST|STREET|AVE|AVENUE|LN|LANE|DR|DRIVE|CT|COURT|HWY|HIGHWAY|BLVD|BOULEVARD|WAY|PIKE|TRL|TRAIL))?$/i);
  if (!match) return null;
  const streetNumber = match[1].replace(/[^0-9A-Za-z]/g, "");
  const streetName = match[2].trim().replace(/\s+/g, " ");
  const addressWhere = `PREMSNUM='${escapeSql(streetNumber)}' AND UPPER(PREMSNAM) LIKE '%${escapeSql(streetName.toUpperCase())}%' AND UPPER(PREMCITY) LIKE '%${escapeSql(input.city.toUpperCase())}%'`;
  const direct = await queryMaryland(addressWhere);
  if (!direct.length) return null;
  const first = direct[0];
  const liber = clean(first.DR1LIBER);
  const folio = clean(first.DR1FOLIO);
  const deedGroup = liber && folio ? await queryMaryland(`DR1LIBER='${escapeSql(liber)}' AND DR1FOLIO='${escapeSql(folio)}'`, 50) : [];
  const byAccount = new Map<string, Record<string, unknown>>();
  for (const attrs of [...direct, ...deedGroup]) { const id = clean(attrs.ACCTID); if (id) byAccount.set(id, attrs); }
  const rows = [...byAccount.values()];
  const primary = rows.find((attrs) => clean(attrs.YEARBLT) || number(attrs.SQFTSTRC)) ?? first;
  const refs = rows.map((attrs) => {
    const id = clean(attrs.ACCTID)!;
    const mapParcel = clean(attrs.MAP) && clean(attrs.PARCEL) ? `Map ${clean(attrs.MAP)} · Parcel ${clean(attrs.PARCEL)}${clean(attrs.GRID) ? ` · Grid ${clean(attrs.GRID)}` : ""}${clean(attrs.LOT) ? ` · Lot ${clean(attrs.LOT)}` : ""}` : null;
    return mapParcel ? `${id} · ${mapParcel}` : id;
  });
  const legal = rows.map((attrs) => [attrs.LEGAL1, attrs.LEGAL2, attrs.LEGAL3].map(clean).filter(Boolean).join(" · ")).filter(Boolean).join(" | ") || null;
  const deed = liber || folio ? `Liber ${liber ?? "—"} · Folio ${folio ?? "—"}` : null;
  const totalAcres = rows.reduce((sum, attrs) => sum + (number(attrs.ACRES) ?? (String(attrs.LUOM ?? "").toUpperCase() === "A" ? number(attrs.LANDAREA) ?? 0 : 0)), 0);
  const sum = (field: string) => { const value = rows.reduce((total, attrs) => total + (number(attrs[field]) ?? 0), 0); return value || null; };
  return {
    sourceName: "Maryland SDAT / MD iMAP Property Data", sourceAsOf: clean(primary.SDATDATE), sourceUrl: clean(primary.SDATWEBADR),
    accountId: clean(primary.ACCTID)!, parcelRefs: refs, acreageText: totalAcres ? `${totalAcres.toLocaleString("en-US", { maximumFractionDigits: 3 })} acres across ${rows.length} resolved parcel${rows.length === 1 ? "" : "s"}` : null,
    landUse: [...new Set(rows.map((attrs) => clean(attrs.DESCLU)).filter(Boolean))].join(" / ") || null, zoning: [...new Set(rows.map((attrs) => clean(attrs.ZONING)).filter(Boolean))].join(" / ") || null,
    deedReference: deed, legalDescription: legal, yearBuilt: number(primary.YEARBLT), squareFeet: number(primary.SQFTSTRC), buildingStyle: clean(primary.DESCSTYL), buildingType: clean(primary.DESCBLDG),
    assessedLandValue: sum("NFMLNDVL"), assessedImprovementValue: sum("NFMIMPVL"), assessedTotalValue: sum("NFMTTLVL"),
    publicWater: flag(primary.PFUW), publicSewer: flag(primary.PFUS), waterfront: flag(primary.PFLW), resolvedParcelCount: rows.length,
  };
}

export async function resolveJurisdictionParcel(input: AddressInput): Promise<JurisdictionParcelRecord | null> {
  if (input.state.toUpperCase() === "MD") return resolveMaryland(input);
  return null;
}
