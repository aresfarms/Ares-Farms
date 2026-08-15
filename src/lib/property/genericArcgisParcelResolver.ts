/**
 * genericArcgisParcelResolver — ONE resolver that turns any registry entry
 * (parcelSourceRegistry) into a governed parcel lookup. This is the engine that
 * makes national coverage a data problem, not a code problem: add a verified
 * ArcGIS parcel service to the registry and this resolves addresses against it.
 *
 * Strategy: build an address WHERE from the source's street-number/name fields
 * and query the layer. Deterministic, governed egress (governedFetch enforces the
 * allowlist the registry feeds), and audit-safe — a bad/empty response returns
 * null so the brief states the absence rather than fabricating a record.
 *
 * Building square footage is taken as an ESTIMATE (never a measured footprint),
 * consistent with the platform-wide sqft doctrine.
 */

import { governedFetch } from "@/lib/security/outboundRequestPolicy";
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

async function queryFeatures(src: ArcgisParcelSource, where: string): Promise<Array<Record<string, unknown>>> {
  const outFields = [...new Set([
    ...(Object.values(src.fields).filter(Boolean) as string[]),
    src.streetNumberField, src.streetNameField, src.addressMatchField, src.cityField,
  ].filter(Boolean) as string[])].join(",");
  const params = new URLSearchParams({ f: "json", where, outFields, returnGeometry: "false", resultRecordCount: "5" });
  const res = await governedFetch(`${src.queryUrl}?${params.toString()}`, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(12_000) });
  if (!res.ok) return [];
  const body = (await res.json()) as { features?: Array<{ attributes?: Record<string, unknown> }> };
  return (body.features ?? []).map((f) => f.attributes ?? {});
}

function pick(attrs: Record<string, unknown>, map: ArcgisFieldMap, key: keyof ArcgisFieldMap): unknown {
  const field = map[key];
  return field ? attrs[field] : undefined;
}

export async function resolveArcgisParcel(src: ArcgisParcelSource, input: AddressInput): Promise<JurisdictionParcelRecord | null> {
  const parsed = parseStreet(input.street);
  if (!parsed) return null;

  // Two address-matching modes: a single combined address-string field (E911 /
  // site-location, anchored on the number to avoid 10 matching 110), or a split
  // number + name pair. A source must declare one; otherwise it can't be queried.
  const addressClause: string | null = src.addressMatchField
    ? `UPPER(${src.addressMatchField}) LIKE '${esc(parsed.number)} %' AND UPPER(${src.addressMatchField}) LIKE '%${esc(parsed.name)}%'`
    : src.streetNumberField && src.streetNameField
      ? `${src.streetNumberField}='${esc(parsed.number)}' AND UPPER(${src.streetNameField}) LIKE '%${esc(parsed.name)}%'`
      : null;
  if (!addressClause) return null;

  const cityClause = src.cityField && clean(input.city)
    ? ` AND UPPER(${src.cityField}) LIKE '%${esc(input.city.trim().toUpperCase())}%'`
    : "";

  let rows = await queryFeatures(src, addressClause + cityClause);
  // Retry without the city constraint if nothing matched (municipality naming
  // often differs from the mailing city).
  if (!rows.length && cityClause) rows = await queryFeatures(src, addressClause);
  if (!rows.length) return null;
  const a = rows[0];

  const f = src.fields;
  const assessedLand = num(pick(a, f, "assessedLand"));
  const assessedImprovement = num(pick(a, f, "assessedImprovement"));
  let assessedTotal = num(pick(a, f, "assessedTotal"));
  if (assessedTotal == null && (assessedLand != null || assessedImprovement != null)) assessedTotal = (assessedLand ?? 0) + (assessedImprovement ?? 0);
  const acres = num(pick(a, f, "acres"));
  const parcelId = clean(pick(a, f, "parcelId"));

  return {
    sourceName: src.sourceName,
    sourceAsOf: src.assessmentAsOf ?? null,
    assessmentAsOf: src.assessmentAsOf ?? null,
    sourceUrl: src.sourceUrl,
    accountId: parcelId ?? clean(pick(a, f, "address")) ?? `${parsed.number} ${parsed.name}`,
    parcelRefs: parcelId ? [parcelId] : [],
    acreageText: acres != null ? `${acres.toLocaleString("en-US", { maximumFractionDigits: 3 })} acres (${src.state} statewide parcel source; the recorded plat governs)` : null,
    landUse: clean(pick(a, f, "landUse")),
    zoning: clean(pick(a, f, "zoning")),
    deedReference: null,
    legalDescription: clean(pick(a, f, "legal")),
    yearBuilt: num(pick(a, f, "yearBuilt")),
    // Building area is a STRUCTURE estimate, never a measured footprint.
    squareFeet: src.buildingSqftIsLotArea ? null : num(pick(a, f, "buildingSqft")),
    lotSquareFeet: num(pick(a, f, "lotSqft")) ?? (src.buildingSqftIsLotArea ? num(pick(a, f, "buildingSqft")) : null),
    buildingStyle: clean(pick(a, f, "buildingStyle")),
    buildingType: null,
    assessedLandValue: assessedLand,
    assessedImprovementValue: assessedImprovement ?? (assessedTotal != null && assessedLand != null ? assessedTotal - assessedLand : null),
    assessedTotalValue: assessedTotal,
    publicWater: null, publicSewer: null, waterfront: null,
    resolvedParcelCount: 1,
  };
}
