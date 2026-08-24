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

/** Street-TYPE words, in every spelling a jurisdiction or a person might use.
 *  Matching must survive "St" vs "Street" vs "St." in either direction. */
const TYPE_WORDS = new Set([
  "RD", "ROAD", "ST", "STREET", "AVE", "AVENUE", "AV", "LN", "LANE", "DR", "DRIVE",
  "CT", "COURT", "HWY", "HIGHWAY", "BLVD", "BOULEVARD", "WAY", "PIKE", "TRL", "TRAIL",
  "PL", "PLACE", "CIR", "CIRCLE", "TER", "TERRACE", "TERR", "LOOP", "RUN", "PATH", "ROW",
  "PKWY", "PARKWAY", "SQ", "SQUARE", "XING", "CROSSING", "BND", "BEND", "CV", "COVE",
]);
const DIRECTION_WORDS = new Set([
  "N", "NORTH", "S", "SOUTH", "E", "EAST", "W", "WEST",
  "NE", "NORTHEAST", "NW", "NORTHWEST", "SE", "SOUTHEAST", "SW", "SOUTHWEST",
]);
/** Secondary-unit designators. A person pastes "APT 2" or "#2" onto the end of
 *  an address constantly; the parcel layer records the parcel, not the unit. */
const UNIT_WORDS = "APT|APARTMENT|UNIT|STE|SUITE|BLDG|BUILDING|FL|FLOOR|RM|ROOM|LOT|SPC|SPACE|TRLR";
const ORDINAL_WORDS: Record<string, string> = {
  FIRST: "1", SECOND: "2", THIRD: "3", FOURTH: "4", FIFTH: "5",
  SIXTH: "6", SEVENTH: "7", EIGHTH: "8", NINTH: "9", TENTH: "10",
};

/**
 * Reduce a street string to comparable tokens.
 *
 * Everything here is driven by holes found with deliberately mistyped input
 * (verify:parcel-robustness), not by guesswork:
 *   - periods:  "78TH ST. E."      never matched "78TH ST E"
 *   - units:    "... ST APT 2"     never matched anything
 *   - ordinals: "THIRD" vs "3RD"   are the same street to a person
 */
function normalizeStreetTokens(value: string): string[] {
  const cleaned = canonicalizeRoadPhrases(value.toUpperCase())
    // Drop a trailing unit designator, with or without a number ("APT 2", "#2").
    .replace(new RegExp(`(?:\\s+(?:${UNIT_WORDS})\\.?\\s*[-#]?\\s*[A-Z0-9-]*)+\\s*$`), " ")
    .replace(/(?:\s+#\s*[A-Z0-9-]+)+\s*$/, " ")
    // Punctuation a person adds or a clerk left in the record. Hyphens and
    // apostrophes are load-bearing in real names ("CR E-076", "HAROLD'S LN")
    // so they stay; parentheses appear around alternate addresses in some
    // rolls ("2 PINES CT (5 WOODRIDGE ST)") and must not fuse to a token.
    .replace(/[.,()/]/g, " ")
    // Apostrophes are dropped from TOKENS so "HAROLD'S" and a customer's
    // "HAROLDS" compare equal when ranking. The stored text keeps its
    // apostrophe, so the SQL side is handled by a stem variant below.
    .replace(/['\u2019]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned.split(" ").filter(Boolean).map((t) => {
    if (ORDINAL_WORDS[t]) return ORDINAL_WORDS[t];
    // "29TH" and a bare "29" are the same street across storage conventions.
    const ord = t.match(/^(\d+)(ST|ND|RD|TH)$/);
    return ord ? ord[1] : t;
  });
}

/**
 * Split "10 South Arm Road" into the house number, the full normalized token
 * list, and the distinctive CORE (name minus street-type and directional
 * words).
 *
 * The core is what the server-side LIKE matches on, because that is the part
 * both sides always agree about — "78TH STREET E", "78TH ST. E" and "78TH ST E"
 * all reduce to core "78". Directionals and type words are then used to RANK
 * candidates client-side rather than to filter server-side, so a person who
 * omits or expands them still finds the parcel without us silently accepting
 * a different one.
 */
function parseStreet(street: string): { number: string; name: string; core: string; tokens: string[] } | null {
  const tokens = normalizeStreetTokens(street);
  if (tokens.length < 2) return null;
  const first = tokens[0];
  if (!/^\d+[A-Z]?$/.test(first)) return null;
  const rest = tokens.slice(1);
  const core = rest.filter((t) => !TYPE_WORDS.has(t) && !DIRECTION_WORDS.has(t));
  // Some streets ARE named after a direction or a type word — "W NORTH AVE",
  // "3311 SOUTH AVE". Stripping both leaves nothing to match on, and falling
  // back to the raw name would re-introduce the exact abbreviation
  // sensitivity the core exists to remove ("SOUTH AVE" would stop matching
  // "SOUTH AVENUE"). Drop only the type words in that case, so the
  // directional survives as the distinctive part and stays abbreviation-safe.
  const fallback = rest.filter((t) => !TYPE_WORDS.has(t));
  return {
    number: first.replace(/[^0-9A-Za-z]/g, ""),
    name: rest.join(" "),
    core: (core.length ? core : fallback.length ? fallback : rest).join(" "),
    tokens: rest,
  };
}

/** Word pairs jurisdictions record inconsistently INSIDE a street name. The
 *  street-TYPE suffix (St/Rd/Ave) is already stripped by parseStreet; these
 *  are the ones that survive into the name we match on. */
const NAME_EQUIVALENTS: Array<[RegExp, string]> = [
  [/\bSAINT\b/g, "ST"], [/\bST\b/g, "SAINT"],
  [/\bMOUNT\b/g, "MT"], [/\bMT\b/g, "MOUNT"],
  [/\bFORT\b/g, "FT"], [/\bFT\b/g, "FORT"],
  [/\bNORTH\b/g, "N"], [/\bSOUTH\b/g, "S"], [/\bEAST\b/g, "E"], [/\bWEST\b/g, "W"],
  // ...and the reverse, for the customer who types "W N AVE" against a county
  // that recorded "W NORTH AVE".
  [/\bN\b/g, "NORTH"], [/\bS\b/g, "SOUTH"], [/\bE\b/g, "EAST"], [/\bW\b/g, "WEST"],
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
  // "HAROLDS" must still find a record written "HAROLD'S". We cannot know
  // where an apostrophe belongs, so match the stem instead — the trailing S
  // is dropped and '%HAROLD%' matches either spelling. Length-guarded so this
  // never turns a short token into a near-wildcard.
  if (/S$/.test(name) && name.length >= 5) out.push(name.slice(0, -1));
  for (const [pattern, replacement] of NAME_EQUIVALENTS) {
    if (out.length >= 6) break;
    for (const base of [...out]) {
      if (out.length >= 6) break;
      const swapped = base.replace(pattern, replacement);
      if (swapped !== base && !out.includes(swapped)) out.push(swapped);
    }
  }
  return out;
}

/**
 * Multi-word road designations that rural jurisdictions write inconsistently.
 * These matter disproportionately here: farm and land parcels are overwhelmingly
 * on county roads, state routes and farm-to-market roads, and "205 County Road
 * E-057" vs the recorded "205 CR E-057" is the same property.
 *
 * Handled at PHRASE level rather than per token, because the forms differ in
 * word count ("COUNTY ROAD" is two tokens, "CR" is one) and no per-token
 * substitution can bridge that.
 */
const ROAD_PHRASE_GROUPS: Array<{ canon: string; forms: string[] }> = [
  { canon: "CR", forms: ["COUNTY ROAD", "CO RD", "CR"] },
  { canon: "SR", forms: ["STATE ROAD", "STATE ROUTE", "ST RT", "SR"] },
  { canon: "USHWY", forms: ["US HIGHWAY", "US HWY"] },
  { canon: "FM", forms: ["FARM TO MARKET", "FM"] },
  { canon: "TWPRD", forms: ["TOWNSHIP ROAD", "TWP RD"] },
];

const phraseRx = (form: string) => new RegExp(`\\b${form.replace(/ /g, "\\s+")}\\b`, "g");

/**
 * Collapse a road phrase to ONE canonical token before anything else runs.
 *
 * This has to happen first: "ROAD" is a street-type word, so stripping type
 * words would tear "COUNTY ROAD" in half and leave a bare "COUNTY" that
 * matches neither "CO RD" nor "COUNTY ROAD" reliably. Indiana stores both
 * forms as genuinely different parcels on the same road, so getting this
 * wrong means missing real property.
 *
 * Longest forms are tried first so "STATE ROAD" is not partly consumed by a
 * shorter member of its own group.
 */
function canonicalizeRoadPhrases(value: string): string {
  let out = value;
  for (const { canon, forms } of ROAD_PHRASE_GROUPS) {
    for (const form of [...forms].sort((a, b) => b.length - a.length)) {
      out = out.replace(phraseRx(form), canon);
    }
  }
  return out;
}

/** Expand a canonicalised road token back into every spelling a jurisdiction
 *  might have recorded. Original first; capped so the WHERE stays small. */
function coreVariants(core: string): string[] {
  const out = [core];
  for (const { canon, forms } of ROAD_PHRASE_GROUPS) {
    if (!new RegExp(`\\b${canon}\\b`).test(core)) continue;
    for (const form of forms) {
      if (out.length >= 4) break;
      const swapped = core.replace(new RegExp(`\\b${canon}\\b`, "g"), form);
      if (!out.includes(swapped)) out.push(swapped);
    }
    break;
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

/**
 * Rank candidate rows against the full input, so widening the server-side
 * query never means silently accepting a worse match. Rows whose own house
 * number disagrees are discarded outright; among the rest, the row sharing the
 * most tokens with the input (directionals and type words included) wins.
 */
function bestAddressMatch(
  rows: Array<Record<string, unknown>>,
  src: ArcgisParcelSource,
  parsed: { number: string; tokens: string[] },
): Record<string, unknown> | null {
  const field = src.addressMatchField ?? src.fields.address ?? src.streetNameField;
  if (!field || rows.length <= 1) return rows[0] ?? null;
  const wanted = new Set(parsed.tokens);
  let best: Record<string, unknown> | null = null;
  let bestScore = -1;
  for (const row of rows) {
    const rowTokens = normalizeStreetTokens(String(row[field] ?? ""));
    // The row's own number must agree when it publishes one.
    const rowNumber = rowTokens.find((t) => /^\d+[A-Z]?$/.test(t));
    if (src.addressMatchField && rowNumber && rowNumber !== parsed.number) continue;
    const score = rowTokens.filter((t) => wanted.has(t)).length;
    if (score > bestScore) { bestScore = score; best = row; }
  }
  return best;
}

async function findByAddress(src: ArcgisParcelSource, input: AddressInput): Promise<Record<string, unknown> | null> {
  const parsed = parseStreet(input.street);
  if (!parsed) return null;
  // Match each CORE TOKEN separately (AND), never the core as one contiguous
  // string. Removing an intervening word makes a contiguous match fail
  // against the raw stored text: core "8 LUTHER" would never match a record
  // reading "307 SE 8TH ST LUTHER", because "ST" still sits between them.
  // Per-token keeps the same precision (all tokens must appear) without
  // assuming they are adjacent, and each token still ORs its spelling
  // variants.
  const nameMatch = (field: string) => coreVariants(parsed.core)
    .map((variant) => `(${variant.split(" ").filter(Boolean)
      .map((token) => `(${streetNameVariants(token).map((v) => `UPPER(${field}) LIKE '%${esc(v)}%'`).join(" OR ")})`)
      .join(" AND ")})`)
    .join(" OR ");
  // `loose` drops the anchor that requires the house number at the very START
  // of the stored string. Some rolls store a LEADING SPACE (" 2 HAROLD'S LN"
  // in Middletown RI), which defeats the anchored form entirely. Used only as
  // a fallback, and every loose hit is still checked client-side by
  // bestAddressMatch, which discards rows whose own number disagrees.
  const buildClause = (loose: boolean): string | null => {
    if (src.addressMatchField) {
      const f = src.addressMatchField;
      if (src.addressNumberPosition === "trailing") return `(${nameMatch(f)}) AND UPPER(${f}) LIKE '% ${esc(parsed.number)}'`;
      const numberClause = loose
        ? `(UPPER(${f}) LIKE '${esc(parsed.number)} %' OR UPPER(${f}) LIKE '% ${esc(parsed.number)} %')`
        : `UPPER(${f}) LIKE '${esc(parsed.number)} %'`;
      return `${numberClause} AND (${nameMatch(f)})`;
    }
    if (src.streetNumberField && src.streetNameField) {
      return `${src.streetNumberField}=${src.streetNumberFieldType === "numeric" ? esc(parsed.number) : `'${esc(parsed.number)}'`} AND (${nameMatch(src.streetNameField)})`;
    }
    return null;
  };
  const addressClause = buildClause(false);
  if (!addressClause) return null;
  const cityClause = src.cityField && clean(input.city) ? ` AND UPPER(${src.cityField}) LIKE '%${esc(input.city.trim().toUpperCase())}%'` : "";
  // Matching on the core can return several neighbours (N vs S Main, or a
  // whole numbered-street grid), so pull a few and rank rather than trusting
  // arrival order — 25 rather than 5 because widening the query widens the
  // candidate set too.
  const base = new URLSearchParams({ f: "json", outFields: parcelOutFields(src), returnGeometry: "false", resultRecordCount: "25" });
  const withCity = new URLSearchParams(base); withCity.set("where", addressClause + cityClause);
  const cityRows = await runQuery(src.queryUrl, withCity);
  // City-filtered hits are already qualified on location; still rank them so
  // the closest street match wins.
  if (cityRows.length) {
    const ranked = bestAddressMatch(cityRows, src, parsed);
    if (ranked) return ranked;
  }
  // Retry without the city filter — but only when there WAS one to drop.
  if (cityClause) {
    const noCity = new URLSearchParams(base); noCity.set("where", addressClause);
    const rows = await runQuery(src.queryUrl, noCity);
    const plausible = rows.filter((r) => cityPlausiblyMatches(src, r, input.city));
    const hit = bestAddressMatch(plausible, src, parsed);
    if (hit) return hit;
  }

  // Last resort: retry with the un-anchored number, for sources whose stored
  // address has leading whitespace.
  const looseClause = buildClause(true);
  if (!looseClause || looseClause === addressClause) return null;
  const loose = new URLSearchParams(base); loose.set("where", looseClause + cityClause);
  let looseRows = await runQuery(src.queryUrl, loose);
  if (!looseRows.length && cityClause) {
    const looseNoCity = new URLSearchParams(base); looseNoCity.set("where", looseClause);
    looseRows = (await runQuery(src.queryUrl, looseNoCity)).filter((r) => cityPlausiblyMatches(src, r, input.city));
  }
  return bestAddressMatch(looseRows, src, parsed);
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
    where: `UPPER(${src.addressMatchField}) LIKE '${esc(parsed.number)} %' AND (${streetNameVariants(parsed.core).map((v) => `UPPER(${src.addressMatchField}) LIKE '%${esc(v)}%'`).join(" OR ")})`,
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
    where: `UPPER(${join.addressMatchField}) LIKE '${esc(parsed.number)} %' AND (${streetNameVariants(parsed.core).map((v) => `UPPER(${join.addressMatchField}) LIKE '%${esc(v)}%'`).join(" OR ")})`,
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
  // Token-based rather than raw substring: the spatial pre-filter returns
  // every parcel near the point, and the customer's spelling of the street
  // ("78TH STREET E" vs the recorded "78TH ST E") must not decide the match.
  const wanted = new Set(parsed.tokens);
  let best: Record<string, unknown> | null = null;
  let bestScore = 0;
  for (const r of rows) {
    const rowTokens = normalizeStreetTokens(String(r[addressField] ?? ""));
    const numberOk = src.addressNumberPosition === "trailing"
      ? rowTokens[rowTokens.length - 1] === parsed.number
      : rowTokens[0] === parsed.number;
    if (!numberOk) continue;
    const score = rowTokens.filter((t) => wanted.has(t)).length;
    if (score > bestScore) { bestScore = score; best = r; }
  }
  return best ?? rows[0] ?? null;
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
