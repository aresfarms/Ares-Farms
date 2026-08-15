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
const num = (v: unknown): number | null => { const n = Number(v); return Number.isFinite(n) && n !== 0 ? n : null; };
const esc = (v: string): string => v.replace(/'/g, "''");

/** Split "10 South Arm Road" → { number: "10", name: "SOUTH ARM" } — strips the
 *  street-type suffix so a LIKE match survives Rd/Road/St/Street variance. */
function parseStreet(street: string): { number: string; name: string } | null {
  const m = street.trim().match(/^(\d+[A-Za-z]?)\s+(.+?)(?:\s+(?:RD|ROAD|ST|STREET|AVE|AVENUE|LN|LANE|DR|DRIVE|CT|COURT|HWY|HIGHWAY|BLVD|BOULEVARD|WAY|PIKE|TRL|TRAIL|PL|PLACE|CIR|CIRCLE|TER|TERRACE|LOOP|RUN|PATH|ROW))?$/i);
  if (!m) return null;
  return { number: m[1].replace(/[^0-9A-Za-z]/g, ""), name: m[2].trim().replace(/\s+/g, " ").toUpperCase() };
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

async function findByAddress(src: ArcgisParcelSource, input: AddressInput): Promise<Record<string, unknown> | null> {
  const parsed = parseStreet(input.street);
  if (!parsed) return null;
  const addressClause = src.addressMatchField
    ? `UPPER(${src.addressMatchField}) LIKE '${esc(parsed.number)} %' AND UPPER(${src.addressMatchField}) LIKE '%${esc(parsed.name)}%'`
    : src.streetNumberField && src.streetNameField
      ? `${src.streetNumberField}='${esc(parsed.number)}' AND UPPER(${src.streetNameField}) LIKE '%${esc(parsed.name)}%'`
      : null;
  if (!addressClause) return null;
  const cityClause = src.cityField && clean(input.city) ? ` AND UPPER(${src.cityField}) LIKE '%${esc(input.city.trim().toUpperCase())}%'` : "";
  const base = new URLSearchParams({ f: "json", outFields: parcelOutFields(src), returnGeometry: "false", resultRecordCount: "5" });
  const withCity = new URLSearchParams(base); withCity.set("where", addressClause + cityClause);
  let rows = await runQuery(src.queryUrl, withCity);
  if (!rows.length && cityClause) { const noCity = new URLSearchParams(base); noCity.set("where", addressClause); rows = await runQuery(src.queryUrl, noCity); }
  return rows[0] ?? null;
}

async function findByPoint(src: ArcgisParcelSource, input: AddressInput): Promise<Record<string, unknown> | null> {
  let lat = input.lat != null ? Number(input.lat) : NaN;
  let lon = input.lon != null ? Number(input.lon) : NaN;
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    const geo = await geocodeToCensusTract(input.street, input.city, input.state, input.zip ?? undefined);
    lat = Number(geo?.lat); lon = Number(geo?.lon);
  }
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  const params = new URLSearchParams({
    f: "json", geometry: `${lon},${lat}`, geometryType: "esriGeometryPoint", inSR: "4326",
    spatialRel: "esriSpatialRelIntersects", outFields: parcelOutFields(src), returnGeometry: "false", resultRecordCount: "5",
  });
  if (src.pointBufferMeters) { params.set("distance", String(src.pointBufferMeters)); params.set("units", "esriSRUnit_Meter"); }
  const rows = await runQuery(src.queryUrl, params);
  return rows[0] ?? null;
}

export async function resolveArcgisParcel(src: ArcgisParcelSource, input: AddressInput): Promise<JurisdictionParcelRecord | null> {
  const parcel = src.queryMode === "point" ? await findByPoint(src, input) : await findByAddress(src, input);
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
