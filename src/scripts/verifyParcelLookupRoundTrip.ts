/**
 * verify:parcel-roundtrip — proves each registry source ACTUALLY RESOLVES a
 * real address end to end, not merely that its endpoint answers a ping.
 *
 * Why this exists separately from verify:parcel-source-health: the health
 * check proves the government endpoint is still up. It does NOT prove our
 * resolver can turn a street address into a parcel through that source —
 * which is what a customer actually does. Sources have passed the health
 * check while being completely unusable (address stored in reverse order, a
 * text scan that times out, an owner's mailing address where the property
 * address should be).
 *
 * Method, per source:
 *   1. Pull a REAL row out of that source's own data and read its address.
 *   2. Feed that address back through resolveJurisdictionParcel — the same
 *      entry point the API route uses, including the bespoke MD/DE paths and
 *      the multi-source fallthrough for a state.
 *   3. Report whether a parcel came back, and what fields it carried.
 *
 * HONEST LIMIT: an address sampled from the source is a FAVOURABLE test — we
 * know it exists in that dataset, and it is already in the source's own
 * formatting. A pass here means the plumbing works; it does not prove a
 * customer's hand-typed, differently-abbreviated address will match. A
 * FAILURE here, though, is unambiguous: the source cannot resolve even its
 * own data.
 */

import { resolveJurisdictionParcel } from "@/lib/property/jurisdictionParcelResolver";
import { governedFetch } from "@/lib/security/outboundRequestPolicy";
import { geocodeToCensusTract } from "@/lib/scrapers/adapters/censusGeocoder";
import { ARCGIS_PARCEL_SOURCES, type ArcgisParcelSource } from "@/lib/property/parcelSourceRegistry";

type Outcome = "RESOLVED" | "NO_MATCH" | "NO_SAMPLE" | "ERROR";

interface Result {
  state: string;
  area: string;
  outcome: Outcome;
  sampledAddress: string | null;
  detail: string;
}

async function query(url: string, params: Record<string, string>): Promise<Array<Record<string, unknown>>> {
  const qs = new URLSearchParams({ f: "json", returnGeometry: "false", ...params });
  const res = await governedFetch(`${url}?${qs.toString()}`, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(25_000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const body = (await res.json()) as { features?: Array<{ attributes?: Record<string, unknown> }>; error?: { message?: string } };
  if (body.error) throw new Error(body.error.message ?? "ArcGIS error");
  return (body.features ?? []).map((f) => f.attributes ?? {});
}

const txt = (v: unknown): string => String(v ?? "").trim();

/**
 * Several layers pack the city and zip INTO the address field
 * ("100 S 76TH DR   TOLLESON  85353", "1815 TREADWELL ST , TX 78704").
 * Passing that whole string as the street defeats matching, so split it back
 * apart. The production route never sees this — it receives an already-parsed
 * street/city from the address importer — so this is squarely a test-harness
 * concern, not a resolver fix.
 */
function splitEmbeddedCity(raw: string, knownCity: string): { street: string; city: string } {
  let s = raw.trim();
  let city = knownCity;
  // Trailing ", ST 12345" / " ST 12345" / bare trailing zip.
  s = s.replace(/\s*,?\s*[A-Z]{2}\s+\d{5}(-\d{4})?$/i, "").trim();
  s = s.replace(/\s*,\s*$/, "").trim();
  // A run of 2+ spaces usually separates street from an embedded city.
  const gap = s.split(/\s{2,}/).map((x) => x.trim()).filter(Boolean);
  if (gap.length > 1) {
    const tail = gap[gap.length - 1].replace(/\s+\d{5}(-\d{4})?$/, "").trim();
    const head = gap.slice(0, -1).join(" ").trim();
    // Treat the tail as a city ONLY if it has no digits AND the head still
    // looks like a complete street address on its own. St. Louis pads with
    // spaces ("2227   ARSENAL ST "), so a naive split turned "ARSENAL ST"
    // into the city and left "2227" as the whole street.
    if (tail && !/\d/.test(tail) && /^\d+\s+\S/.test(head)) {
      if (!city) city = tail;
      s = head;
    } else s = gap.join(" ").trim();
  }
  return { street: s.replace(/\s+/g, " "), city };
}

/** Sampling uses `where=1=1` and filters CLIENT-SIDE rather than pushing
 *  `field <> ''` into the WHERE clause: several layers (NY, MA) silently
 *  returned zero rows for that comparison, which looked like "this source has
 *  no addresses" when it has millions. Never let a query-dialect quirk
 *  masquerade as missing data. */
const SAMPLE_ROWS = "300";

/**
 * Point-mode sources (queryMode "point") resolve by GEOCODING the address, so
 * they need a clean street PLUS a city. Sampling can't reliably produce that:
 * these layers store the city inside the address string ("24  CENTER ST
 * SPRINGFIELD 45505") or carry no city column at all. For those, use a fixed
 * known-real address instead of a sampled one. Each was verified by hand when
 * the source was added, so a failure here is a real regression.
 */
const FIXED_CASES: Record<string, { street: string; city: string }> = {
  OH: { street: "84 W Dodridge St", city: "Columbus" },
  TX: { street: "1815 Treadwell St", city: "Austin" },
  TN: { street: "419 Duncan Ln", city: "Andersonville" },
};

/** Test-only: a city column to feed the geocoder for point-mode sources whose
 *  registry entry configures no cityField (the resolver doesn't need one for
 *  its WHERE clause, but the geocode step is far more reliable with a city). */
const POINT_MODE_CITY_FIELD: Record<string, string> = {
  FL: "PHY_CITY",
};

/** Some layers' first N rows are dominated by unaddressed parcels (vacant
 *  land, right-of-way), so `1=1` yields no usable sample. Narrow the sample
 *  for those rather than concluding the source has no addresses. */
const SAMPLE_WHERE: Record<string, string> = {
  MS: "siteadd LIKE '1%' OR siteadd LIKE '2%' OR siteadd LIKE '3%'",
  ME: "PROPLOCNUM > 0",
};

/** Pull one real, usable address out of a source's own data. */
async function sampleAddress(src: ArcgisParcelSource): Promise<{ street: string; city: string } | null> {
  const fixed = FIXED_CASES[src.state.toUpperCase()];
  if (fixed) return fixed;

  // addressKeyJoin (AK, HI) and addressPointsSource (ND) both keep the address
  // in a SEPARATE layer from the parcel geometry — sample it there.
  const helper = src.addressKeyJoin ?? src.addressPointsSource;
  if (helper) {
    const f = helper.addressMatchField;
    const rows = await query(helper.queryUrl, {
      where: "1=1", outFields: f, resultRecordCount: SAMPLE_ROWS,
    });
    for (const r of rows) {
      const a = txt(r[f]);
      if (/^\d+\s+\S/.test(a)) return splitEmbeddedCity(a, "");
    }
    return null;
  }

  const cityField = src.cityField;
  // Split number + name is checked FIRST: sources that split the address
  // (NY, ME, Hennepin) ALSO populate fields.address with just the street
  // NAME, so preferring the combined field would sample "ELLSWORTH RD" with
  // no house number and wrongly conclude the source has no usable addresses.
  const combined = src.streetNumberField && src.streetNameField
    ? null
    : src.addressMatchField ?? src.fields.address;
  if (combined) {
    const f = combined;
    // Point-mode sources resolve by GEOCODING the address, which needs a city
    // or zip to be reliable. Where the registry configures no cityField, pull
    // a plausible city column opportunistically so the test isn't handicapped
    // by a gap in the test harness rather than in the source.
    const extraCity = cityField ?? POINT_MODE_CITY_FIELD[src.state.toUpperCase()] ?? null;
    const out = [f, extraCity].filter(Boolean).join(",");
    // Two passes: the plain sample first, then a non-empty filter if the head
    // of the table is dominated by unaddressed parcels. Doña Ana County NM has
    // 81,784 populated addresses but the first 300 rows are all blank — the
    // fallback is what stops that looking like "this source has no addresses".
    let rows = await query(src.queryUrl, {
      where: SAMPLE_WHERE[src.state.toUpperCase()] ?? "1=1", outFields: out, resultRecordCount: SAMPLE_ROWS,
    });
    if (!rows.some((r) => /^\d+\s+\S/.test(txt(r[f])))) {
      try {
        rows = await query(src.queryUrl, { where: `${f} <> ''`, outFields: out, resultRecordCount: SAMPLE_ROWS });
      } catch { /* some layers reject the comparison; keep the first pass */ }
    }
    for (const r of rows) {
      const a = txt(r[f]);
      const city = extraCity ? txt(r[extraCity]) : "";
      // Trailing-number sources store "STREET NAME 123".
      if (src.addressNumberPosition === "trailing") {
        const m = a.match(/^(.*\S)\s+(\d+)$/);
        if (m) return splitEmbeddedCity(`${m[2]} ${m[1]}`, city);
        continue;
      }
      if (/^\d+\s+\S/.test(a)) return splitEmbeddedCity(a, city);
    }
    return null;
  }

  // Split number + name fields.
  if (src.streetNumberField && src.streetNameField) {
    const n = src.streetNumberField, s = src.streetNameField;
    const out = [n, s, cityField].filter(Boolean).join(",");
    const rows = await query(src.queryUrl, {
      where: SAMPLE_WHERE[src.state.toUpperCase()] ?? "1=1", outFields: out, resultRecordCount: SAMPLE_ROWS,
    });
    for (const r of rows) {
      const num = txt(r[n]).replace(/\.0+$/, "");
      const name = txt(r[s]);
      const city = cityField ? txt(r[cityField]) : "";
      if (num && name) return { street: `${num} ${name}`, city };
    }
    return null;
  }
  return null;
}

/** Bespoke resolvers aren't in the registry array; test them with a known
 *  real address each (these two states have no sampleable layer here). */
const BESPOKE_CASES: Array<{ state: string; area: string; street: string; city: string }> = [
  { state: "MD", area: "statewide (SDAT)", street: "18214 Bauer", city: "Saint Mary's City" },
  { state: "DE", area: "Sussex (bespoke)", street: "22215 Dupont Blvd", city: "Georgetown" },
];

async function runOne(state: string, area: string, street: string, city: string, attempt = 1): Promise<Result> {
  try {
    // Geocode and pass lat/lon, because the real API route does exactly that
    // (imported.geocode). It matters: Delaware's Sussex resolver has NO
    // address path at all — it needs a parcel id or coordinates — so a test
    // that omits coordinates would report a working source as broken.
    let lat: number | null = null, lon: number | null = null;
    try {
      const geo = await geocodeToCensusTract(street, city, state, undefined);
      if (geo) { lat = Number(geo.lat); lon = Number(geo.lon); }
    } catch { /* geocode is best-effort here, same as production */ }
    const rec = await resolveJurisdictionParcel({ street, city, state, zip: null, lat, lon } as never);
    // A null can be a genuine non-match OR a transient timeout under load —
    // an early run of this harness reported Wisconsin broken when the same
    // address resolved fine moments later. Retry once before calling it a
    // failure, so this harness does not cry wolf.
    if (!rec && attempt === 1) return runOne(state, area, street, city, 2);
    if (!rec) return { state, area, outcome: "NO_MATCH", sampledAddress: `${street}${city ? `, ${city}` : ""}`, detail: `resolver returned null on two attempts (geocode ${lat != null ? "ok" : "FAILED"})` };
    const bits = [
      rec.assessedTotalValue != null ? `$${rec.assessedTotalValue.toLocaleString("en-US")}` : null,
      rec.acreageText ? rec.acreageText.split(" (")[0] : null,
      rec.yearBuilt ? `built ${rec.yearBuilt}` : null,
    ].filter(Boolean);
    return {
      state, area, outcome: "RESOLVED",
      sampledAddress: `${street}${city ? `, ${city}` : ""}`,
      // Name the source that ANSWERED. resolveJurisdictionParcel tries every
      // source for a state in order, so in a multi-source state the answer can
      // come from a different source than the one sampled — without this the
      // report would credit the wrong one.
      detail: `id=${rec.accountId}${bits.length ? ` · ${bits.join(" · ")}` : " · no values"}\n        answered by: ${rec.sourceName}`,
    };
  } catch (e) {
    return { state, area, outcome: "ERROR", sampledAddress: `${street}${city ? `, ${city}` : ""}`, detail: (e as Error).message };
  }
}

/** Print each result the moment it lands. A full run now covers ~100 sources
 *  and takes many minutes; batching all output to the end makes it impossible
 *  to tell a slow run from a hung one. */
function report(r: Result): void {
  const tag = r.outcome === "RESOLVED" ? "PASS" : r.outcome === "NO_MATCH" ? "FAIL" : r.outcome;
  console.log(`[${tag}] ${r.state} · ${r.area}`);
  console.log(`        tried: ${r.sampledAddress ?? "—"}`);
  console.log(`        ${r.detail}`);
}

async function main() {
  const only = process.argv[2]?.toUpperCase().split(",").filter(Boolean) ?? null;
  const results: Result[] = [];

  for (const src of ARCGIS_PARCEL_SOURCES) {
    if (only && !only.includes(src.state.toUpperCase())) continue;
    const area = src.coverageArea ?? src.county ?? "statewide";
    let sample: { street: string; city: string } | null = null;
    try {
      sample = await sampleAddress(src);
    } catch (e) {
      const r: Result = { state: src.state, area, outcome: "ERROR", sampledAddress: null, detail: `sampling failed: ${(e as Error).message}` };
      results.push(r); report(r);
      continue;
    }
    if (!sample) {
      const r: Result = { state: src.state, area, outcome: "NO_SAMPLE", sampledAddress: null, detail: "no usable address found in source data" };
      results.push(r); report(r);
      continue;
    }
    const r = await runOne(src.state, area, sample.street, sample.city);
    results.push(r);
    report(r);
  }

  for (const b of BESPOKE_CASES) {
    if (only && !only.includes(b.state)) continue;
    const r = await runOne(b.state, b.area, b.street, b.city);
    results.push(r);
    report(r);
  }

  const counts = results.reduce<Record<string, number>>((a, r) => ({ ...a, [r.outcome]: (a[r.outcome] ?? 0) + 1 }), {});
  console.log(`\n${JSON.stringify(counts)}`);
  const broken = results.filter((r) => r.outcome !== "RESOLVED");
  if (broken.length) {
    console.log(`\nNOT WORKING (${broken.length}):`);
    for (const b of broken) console.log(`  ${b.state} · ${b.area} — ${b.outcome}: ${b.detail}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
