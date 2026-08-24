/**
 * genericArcgisParcelResolver — ONE resolver that turns any registry entry
 * (parcelSourceRegistry) into a governed parcel lookup. This is the engine that
 * makes national coverage a data problem, not a code problem.
 *
 * Three matching strategies, all config-selected:
 *   - address WHERE (NY/VT/CT/NJ): text match on the source's address field(s).
 *   - geocode → point query (FL and any huge/slow layer): geocode the address with
 *     the Census geocoder, then an INDEXED spatial point-in-parcel query — fast
 *     where a text scan over millions of rows times out.
 *   - related-table join (MassGIS L3 and the common county pattern): find the
 *     parcel (by address or point), then look up the assessor TABLE by a shared
 *     key and merge its values.
 *
 * Deterministic, governed egress (governedFetch enforces the registry-fed
 * allowlist), audit-safe (empty/bad response → null so the brief states the
 * absence). Building square footage is an ESTIMATE, never a measured footprint.
 */

import { governedFetch } from "@/lib/security/outboundRequestPolicy";
import { geocodeToCensusTract } from "@/lib/scrapers/adapters/censusGeocoder";
import type { ArcgisParcelSource, ArcgisFieldMap } from "./parcelSourceRegistry";
import type { AddressInput, JurisdictionParcelRecord } from "./jurisdictionParcelResolver";

const clean = (v: unknown): string | null => { const t = String(v ?? "").trim(); return t || null; };
// Some sources store numeric values as comma-formatted, whitespace-padded
// TEXT fields (confirmed on Maricopa County, AZ: "  29,514,527") rather than
// a numeric type — strip thousands separators/whitespace before parsing so
// real values aren't silently lost to a formatting quirk. A no-op for
// sources that already return clean numeric types.
const num = (v: unknown): number | null => {
  const n = typeof v === "string" ? Number(v.replace(/[,\s]/g, "")) : Number(v);
  return Number.isFinite(n) && n !== 0 ? n : null;
};
const esc = (v: string): string => v.replace(/'/g, "''");

/** Split "10 South Arm Road" → { number: "10", name: "SOUTH ARM" } — strips the
 *  street-type suffix so a LIKE match survives Rd/Road/St/Street variance. */
function parseStreet(street: string): { number: string; name: string } | null {
  const m = street.trim().match(/^(\d+[A-Za-z]?)\s+(.+?)(?:\s+(?:RD|ROAD|ST|STREET|AVE|AVENUE|LN|LANE|DR|DRIVE|CT|COURT|HWY|HIGHWAY|BLVD|BOULEVARD|WAY|PIKE|TRL|TRAIL|PL|PLACE|CIR|CIRCLE|TER|TERRACE|LOOP|RUN|PATH|ROW))?$/i);
  if (!m) return null;
  let name = m[2].trim().replace(/\s+/g, " ").toUpperCase();
  // Numbered-street grids (e.g. "6314 29th Ave") sometimes store the name as
  // the bare number ("29") rather than the ordinal form ("29TH") — strip the
  // ordinal suffix so LIKE '%29%'/.includes("29") still matches either
  // storage convention. Safe because it only widens a substring match.
  name = name.replace(/^(\d+)(ST|ND|RD|TH)$/, "$1");
  return { number: m[1].replace(/[^0-9A-Za-z]/g, ""), name };
}

/** Word pairs jurisdictions record inconsistently INSIDE a street name. The
 *  street-TYPE suffix (St/Rd/Ave) is already stripped by parseStreet; these
 *  are the ones that survive into the name we match on. */
const NAME_EQUIVALENTS: Array<[RegExp, string]> = [
  [/\bSAINT\b/g, "ST"], [/\bST\b/g, "SAINT"],
  [/\bMOUNT\b/g, "MT"], [/\bMT\b/g, "MOUNT"],
  [/\bFORT\b/g, "FT"], [/\bFT\b/g, "FORT"],
  [/\bNORTH\b/g, "N"], [/\bSOUTH\b/g, "S"], [/\bEAST\b/g, "E"], [/\bWEST\b/g, "W"],
];

/**
 * Alternate spellings of a street NAME to match against, because sources
 * record these differently and a single LIKE silently misses.
 *
 * Found live: East Baton Rouge stores "ST LOUIS ST", so a search for
 * "222 Saint Louis St" returned nothing at all — no error, just an empty
 * result the customer would read as "no such property".
 *
 * Capped deliberately: each variant becomes another OR in the WHERE clause,
 * and these run against multi-million-row layers. The original spelling is
 * always first so the common case is unaffected.
 */
function streetNameVariants(name: string): string[] {
  const out = [name];
  for (const [pattern, replacement] of NAME_EQUIVALENTS) {
    if (out.length >= 4) break;
    for (const base of [...out]) {
      if (out.length >= 4) break;
      const swapped = base.replace(pattern, replacement);
      if (swapped !== base && !out.includes(swapped)) out.push(swapped);
    }
  }
  return out;
}

async function runQuery(url: string, params: URLSearchParams): Promise<Array<Record<string, unknown>>> {
  const res = await governedFetch(`${url}?${params.toString()}`, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(12_000) });
  if (!res.ok) return [];
  const body = (await res.json()) as { features?: Array<{ attributes?: Record<string, unknown> }> };
  return (body.features ?? []).map((f) => f.attributes ?? {});
}

function parcelOutFields(src: ArcgisParcelSource): string {
  return [...new Set([
    ...(Object.values(src.fields).filter(Boolean) as string[]),
    src.streetNumberField, src.streetNameField, src.addressMatchField, src.cityField,
    src.assessJoin?.parcelKeyField,
  ].filter(Boolean) as string[])].join(",");
}

/** Significant tokens of a place name — drops the filler words that differ
 *  between how a person writes a place and how a jurisdiction records it
 *  ("Wisconsin Dells" vs "TOWN OF DELL PRAIRIE"). */
function placeTokens(value: string): string[] {
  return value.toUpperCase().replace(/[^A-Z0-9 ]/g, " ").split(/\s+/)
    .filter((t) => t.length > 2 && !["TOWN", "CITY", "OF", "THE", "VILLAGE", "TWP", "TOWNSHIP", "BORO", "BOROUGH", "COUNTY", "UNINCORPORATED"].includes(t));
}

/**
 * Guard for the city-less retry below. Returns false when the row is clearly
 * somewhere else entirely.
 *
 * Without this, dropping the city filter accepts ANY parcel with the same
 * street number and name anywhere the source covers: a Rochester MN address
 * matched a parcel in Hennepin County (Minneapolis) during testing, which
 * would attach a completely unrelated property's assessed value to an
 * address. That is the worst failure this resolver can produce.
 *
 * Deliberately permissive in the ambiguous direction: if the source publishes
 * no city for the row, or the names share any significant token, or either
 * contains the other, the match stands. Only a clear conflict is rejected, so
 * genuinely messy-but-correct naming still resolves.
 */
function cityPlausiblyMatches(src: ArcgisParcelSource, row: Record<string, unknown>, inputCity: string): boolean {
  if (!src.cityField) return true;
  const rowCity = clean(row[src.cityField]);
  const wanted = clean(inputCity);
  if (!rowCity || !wanted) return true;
  const a = rowCity.toUpperCase(), b = wanted.toUpperCase();
  if (a.includes(b) || b.includes(a)) return true;
  const rowTokens = placeTokens(rowCity), wantTokens = placeTokens(wanted);
  if (!rowTokens.length || !wantTokens.length) return true;
  // Prefix-tolerant so singular/plural and shortened forms of the same place
  // still count as agreement — "Wisconsin Dells" against a parcel recorded in
  // "TOWN OF DELL PRAIRIE" is the same area, and rejecting it would trade one
  // wrong answer for a different wrong answer. The 4-character floor keeps
  // this from matching on incidental short fragments.
  return rowTokens.some((a) => wantTokens.some((b) => {
    const [short, long] = a.length <= b.length ? [a, b] : [b, a];
    return short.length >= 4 && long.startsWith(short);
  }));
}

async function findByAddress(src: ArcgisParcelSource, input: AddressInput): Promise<Record<string, unknown> | null> {
  const parsed = parseStreet(input.street);
  if (!parsed) return null;
  const nameMatch = (field: string) => streetNameVariants(parsed.name)
    .map((v) => `UPPER(${field}) LIKE '%${esc(v)}%'`).join(" OR ");
  const addressClause = src.addressMatchField
    ? src.addressNumberPosition === "trailing"
      ? `(${nameMatch(src.addressMatchField)}) AND UPPER(${src.addressMatchField}) LIKE '% ${esc(parsed.number)}'`
      : `UPPER(${src.addressMatchField}) LIKE '${esc(parsed.number)} %' AND (${nameMatch(src.addressMatchField)})`
    : src.streetNumberField && src.streetNameField
      ? `${src.streetNumberField}=${src.streetNumberFieldType === "numeric" ? esc(parsed.number) : `'${esc(parsed.number)}'`} AND (${nameMatch(src.streetNameField)})`
      : null;
  if (!addressClause) return null;
  const cityClause = src.cityField && clean(input.city) ? ` AND UPPER(${src.cityField}) LIKE '%${esc(input.city.trim().toUpperCase())}%'` : "";
  const base = new URLSearchParams({ f: "json", outFields: parcelOutFields(src), returnGeometry: "false", resultRecordCount: "5" });
  const withCity = new URLSearchParams(base); withCity.set("where", addressClause + cityClause);
  const cityRows = await runQuery(src.queryUrl, withCity);
  // A city-filtered hit is already qualified — take it as-is.
  if (cityRows.length) return cityRows[0];
  if (!cityClause) return null;
  const noCity = new URLSearchParams(base); noCity.set("where", addressClause);
  const rows = await runQuery(src.queryUrl, noCity);
  return rows.find((r) => cityPlausiblyMatches(src, r, input.city)) ?? null;
}

/** Point-mode sources that ALSO define an address field use the buffer purely
 *  as a fast spatial pre-filter (indexed, not a text scan) and then pick the
 *  candidate whose own address text-matches the input — same "starts with
 *  the number, contains the name" check the address-mode path uses via SQL,
 *  applied client-side here instead. Without an address field (e.g. a
 *  cadastral layer with no address column at all), behavior is unchanged:
 *  take the first spatial hit. */

/** Geocode via a jurisdiction's own NG911/E911 address-point layer — rooftop
 *  precision, unlike the Census geocoder's street-interpolated estimate.
 *  Reuses the same "starts with the number, contains the name" text match as
 *  address mode. Returns null on no match (caller falls back to Census). */
async function geocodeViaAddressPoints(
  src: NonNullable<ArcgisParcelSource["addressPointsSource"]>,
  input: AddressInput,
): Promise<{ lat: number; lon: number } | null> {
  const parsed = parseStreet(input.street);
  if (!parsed) return null;
  const params = new URLSearchParams({
    f: "json",
    where: `UPPER(${src.addressMatchField}) LIKE '${esc(parsed.number)} %' AND UPPER(${src.addressMatchField}) LIKE '%${esc(parsed.name)}%'`,
    outFields: `${src.latField},${src.lonField}`,
    returnGeometry: "false",
    resultRecordCount: "1",
  });
  const rows = await runQuery(src.queryUrl, params);
  const lat = Number(rows[0]?.[src.latField]);
  const lon = Number(rows[0]?.[src.lonField]);
  return Number.isFinite(lat) && Number.isFinite(lon) ? { lat, lon } : null;
}

/** Two-step lookup for parcel layers with no usable address field of their
 *  own: resolve the address to a parcel key via the jurisdiction's published
 *  crosswalk, then fetch the parcel by that key. Deterministic (a published
 *  key match, not a spatial approximation). */
async function findByAddressKeyJoin(
  src: ArcgisParcelSource & { addressKeyJoin: NonNullable<ArcgisParcelSource["addressKeyJoin"]> },
  input: AddressInput,
): Promise<Record<string, unknown> | null> {
  const join = src.addressKeyJoin;
  const parsed = parseStreet(input.street);
  if (!parsed) return null;
  const keyRows = await runQuery(join.queryUrl, new URLSearchParams({
    f: "json",
    where: `UPPER(${join.addressMatchField}) LIKE '${esc(parsed.number)} %' AND UPPER(${join.addressMatchField}) LIKE '%${esc(parsed.name)}%'`,
    outFields: join.keyField,
    returnGeometry: "false",
    resultRecordCount: "1",
  }));
  const rawKey = clean(keyRows[0]?.[join.keyField]);
  if (!rawKey) return null;
  // Truncate only when the config says the two layers publish the same key at
  // different precisions (see keyTruncateLength). A truncation that would
  // empty the key is ignored rather than sent as a bogus match.
  const key = join.keyTruncateLength && rawKey.length > join.keyTruncateLength
    ? rawKey.slice(0, join.keyTruncateLength)
    : rawKey;
  const literal = join.parcelKeyFieldType === "numeric" ? esc(key) : `'${esc(key)}'`;
  const rows = await runQuery(src.queryUrl, new URLSearchParams({
    f: "json",
    where: `${join.parcelKeyField}=${literal}`,
    outFields: parcelOutFields(src),
    returnGeometry: "false",
    resultRecordCount: "1",
  }));
  return rows[0] ?? null;
}

async function findByPoint(src: ArcgisParcelSource, input: AddressInput): Promise<Record<string, unknown> | null> {
  let lat = input.lat != null ? Number(input.lat) : NaN;
  let lon = input.lon != null ? Number(input.lon) : NaN;
  if ((!Number.isFinite(lat) || !Number.isFinite(lon)) && src.addressPointsSource) {
    const precise = await geocodeViaAddressPoints(src.addressPointsSource, input);
    if (precise) { lat = precise.lat; lon = precise.lon; }
  }
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    const geo = await geocodeToCensusTract(input.street, input.city, input.state, input.zip ?? undefined);
    lat = Number(geo?.lat); lon = Number(geo?.lon);
  }
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  const addressField = src.addressMatchField ?? src.streetNameField;
  const params = new URLSearchParams({
    f: "json", geometry: `${lon},${lat}`, geometryType: "esriGeometryPoint", inSR: "4326",
    spatialRel: "esriSpatialRelIntersects", outFields: parcelOutFields(src), returnGeometry: "false",
  });
  // NEVER send resultRecordCount on a spatial query. Two large production
  // layers time out pathologically when it is combined with point/spatial
  // params, while the identical query without it answers in well under a
  // second — measured, not inferred:
  //   Ohio OGRIP        55s+ (also returned an outright query error)
  //   Florida Cadastral 45s+ timeout vs 0.3-0.8s without
  // It buys nothing either: we take rows[0], or filter the server's default
  // page client-side. An earlier version of this fix only dropped the param
  // when an address field existed, which left every point source WITHOUT one
  // (Florida) still broken.
  if (src.pointBufferMeters) { params.set("distance", String(src.pointBufferMeters)); params.set("units", "esriSRUnit_Meter"); }
  const rows = await runQuery(src.queryUrl, params);
  if (!addressField) return rows[0] ?? null;

  const parsed = parseStreet(input.street);
  if (!parsed) return rows[0] ?? null;
  const match = rows.find((r) => {
    const val = String(r[addressField] ?? "").trim().toUpperCase();
    return src.addressNumberPosition === "trailing"
      ? val.endsWith(` ${parsed.number}`) && val.includes(parsed.name)
      : val.startsWith(`${parsed.number} `) && val.includes(parsed.name);
  });
  return match ?? rows[0] ?? null;
}

export async function resolveArcgisParcel(src: ArcgisParcelSource, input: AddressInput): Promise<JurisdictionParcelRecord | null> {
  const parcel = src.addressKeyJoin
    ? await findByAddressKeyJoin(src as ArcgisParcelSource & { addressKeyJoin: NonNullable<ArcgisParcelSource["addressKeyJoin"]> }, input)
    : src.queryMode === "point"
      ? await findByPoint(src, input)
      : await findByAddress(src, input);
  if (!parcel) return null;

  // Optional assessor-table join: look up values by the shared parcel key.
  let assessor: Record<string, unknown> | null = null;
  if (src.assessJoin) {
    const key = clean(parcel[src.assessJoin.parcelKeyField]);
    if (key) {
      const params = new URLSearchParams({
        f: "json", where: `${src.assessJoin.tableKeyField}='${esc(key)}'`,
        outFields: [...new Set(Object.values(src.assessJoin.fields).filter(Boolean) as string[])].join(","),
        returnGeometry: "false", resultRecordCount: "1",
      });
      assessor = (await runQuery(src.assessJoin.tableUrl, params))[0] ?? null;
    }
  }

  // Field lookup: joined assessor table wins, else the parcel layer.
  const get = (k: keyof ArcgisFieldMap): unknown => {
    if (assessor && src.assessJoin?.fields[k]) { const v = assessor[src.assessJoin.fields[k]!]; if (v != null && String(v).trim() !== "") return v; }
    return src.fields[k] ? parcel[src.fields[k]!] : undefined;
  };

  const assessedLand = num(get("assessedLand"));
  const assessedImprovement = num(get("assessedImprovement"));
  let assessedTotal = num(get("assessedTotal"));
  if (assessedTotal == null && (assessedLand != null || assessedImprovement != null)) assessedTotal = (assessedLand ?? 0) + (assessedImprovement ?? 0);
  const acres = num(get("acres"));
  const parcelId = clean(get("parcelId"));
  const addr = clean(get("address"));

  return {
    sourceName: src.sourceName,
    sourceAsOf: src.assessmentAsOf ?? null,
    assessmentAsOf: src.assessmentAsOf ?? null,
    sourceUrl: src.sourceUrl,
    accountId: parcelId ?? addr ?? `${src.state} parcel`,
    parcelRefs: parcelId ? [parcelId] : [],
    acreageText: acres != null ? `${acres.toLocaleString("en-US", { maximumFractionDigits: 3 })} acres (${src.state} statewide parcel source; the recorded plat governs)` : null,
    landUse: clean(get("landUse")),
    zoning: clean(get("zoning")),
    deedReference: null,
    legalDescription: clean(get("legal")),
    yearBuilt: num(get("yearBuilt")),
    squareFeet: src.buildingSqftIsLotArea ? null : num(get("buildingSqft")),
    lotSquareFeet: num(get("lotSqft")) ?? (src.buildingSqftIsLotArea ? num(get("buildingSqft")) : null),
    buildingStyle: clean(get("buildingStyle")),
    buildingType: null,
    assessedLandValue: assessedLand,
    assessedImprovementValue: assessedImprovement ?? (assessedTotal != null && assessedLand != null ? assessedTotal - assessedLand : null),
    assessedTotalValue: assessedTotal,
    publicWater: null, publicSewer: null, waterfront: null,
    resolvedParcelCount: 1,
  };
}
