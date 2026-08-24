/**
 * verify:parcel-robustness — adversarial address matching.
 *
 * The round-trip test feeds each source an address in the source's OWN
 * formatting, so by construction it cannot catch the thing that actually
 * breaks customer lookups: a real person types "222 Saint Louis Street" when
 * the county recorded "222 ST LOUIS ST", and gets silence.
 *
 * This harness takes a real address from a source, establishes the baseline
 * parcel it resolves to, then re-runs DELIBERATELY MISTYPED variants of the
 * same address. Any variant that returns nothing — or worse, a DIFFERENT
 * parcel — is a hole a customer can fall into.
 *
 * A variant returning a different parcel id is reported separately and is far
 * more serious than returning nothing: silence is honest, wrong data is not.
 */

import { resolveJurisdictionParcel } from "@/lib/property/jurisdictionParcelResolver";
import { governedFetch } from "@/lib/security/outboundRequestPolicy";
import { geocodeToCensusTract } from "@/lib/scrapers/adapters/censusGeocoder";
import { ARCGIS_PARCEL_SOURCES, type ArcgisParcelSource } from "@/lib/property/parcelSourceRegistry";

const SUFFIXES: Array<[string, string]> = [
  ["ST", "STREET"], ["AVE", "AVENUE"], ["RD", "ROAD"], ["DR", "DRIVE"],
  ["LN", "LANE"], ["CT", "COURT"], ["PL", "PLACE"], ["BLVD", "BOULEVARD"],
  ["HWY", "HIGHWAY"], ["TER", "TERRACE"], ["CIR", "CIRCLE"], ["PKWY", "PARKWAY"],
  ["TRL", "TRAIL"],
];
const DIRECTIONALS: Array<[string, string]> = [
  ["N", "NORTH"], ["S", "SOUTH"], ["E", "EAST"], ["W", "WEST"],
  ["NE", "NORTHEAST"], ["NW", "NORTHWEST"], ["SE", "SOUTHEAST"], ["SW", "SOUTHWEST"],
];
const ORDINALS: Array<[string, string]> = [
  ["1ST", "FIRST"], ["2ND", "SECOND"], ["3RD", "THIRD"], ["4TH", "FOURTH"],
  ["5TH", "FIFTH"], ["6TH", "SIXTH"], ["7TH", "SEVENTH"], ["8TH", "EIGHTH"],
  ["9TH", "NINTH"], ["10TH", "TENTH"],
];

/** Word-boundary match that will NOT fire inside a possessive: plain \b treats
 *  the S of "HAROLD'S" as its own word and produced "HAROLD'SOUTH", a string no
 *  human would ever type. A test that invents impossible input reports bugs
 *  that aren't real. */
const rx = (w: string) => new RegExp(`(?<![\\w'\u2019])${w}(?![\\w'\u2019])`, "gi");

/** Realistic ways a person's typing differs from the county's record. */
function variants(street: string): Array<{ label: string; value: string }> {
  const out: Array<{ label: string; value: string }> = [];
  const push = (label: string, value: string) => {
    if (value.trim().toUpperCase() !== street.trim().toUpperCase()) out.push({ label, value });
  };

  push("lowercase", street.toLowerCase());
  push("extra spaces", street.replace(/\s+/g, "  "));

  // "St." / "Ave." with a period.
  let dotted = street;
  for (const [abbr] of [...SUFFIXES, ...DIRECTIONALS]) dotted = dotted.replace(rx(abbr), `${abbr}.`);
  push("periods on abbreviations", dotted);

  for (const [abbr, full] of SUFFIXES) {
    if (rx(abbr).test(street)) { push(`suffix ${abbr}->${full}`, street.replace(rx(abbr), full)); break; }
    if (rx(full).test(street)) { push(`suffix ${full}->${abbr}`, street.replace(rx(full), abbr)); break; }
  }
  for (const [abbr, full] of DIRECTIONALS) {
    if (rx(abbr).test(street)) { push(`dir ${abbr}->${full}`, street.replace(rx(abbr), full)); break; }
    if (rx(full).test(street)) { push(`dir ${full}->${abbr}`, street.replace(rx(full), abbr)); break; }
  }
  for (const [num, word] of ORDINALS) {
    if (rx(num).test(street)) { push(`ordinal ${num}->${word}`, street.replace(rx(num), word)); break; }
    if (rx(word).test(street)) { push(`ordinal ${word}->${num}`, street.replace(rx(word), num)); break; }
  }
  for (const [abbr, full] of [["CR", "COUNTY ROAD"], ["CO RD", "COUNTY ROAD"], ["SR", "STATE ROAD"], ["US", "US HIGHWAY"]] as Array<[string, string]>) {
    if (rx(abbr).test(street)) { push(`rural ${abbr}->${full}`, street.replace(rx(abbr), full)); break; }
    if (rx(full).test(street)) { push(`rural ${full}->${abbr}`, street.replace(rx(full), abbr)); break; }
  }

  push("unit suffix appended", `${street} APT 2`);
  push("# unit appended", `${street} #2`);
  return out;
}

async function query(url: string, params: Record<string, string>): Promise<Array<Record<string, unknown>>> {
  const qs = new URLSearchParams({ f: "json", returnGeometry: "false", ...params });
  const res = await governedFetch(`${url}?${qs.toString()}`, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(25_000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const body = (await res.json()) as { features?: Array<{ attributes?: Record<string, unknown> }>; error?: { message?: string } };
  if (body.error) throw new Error(body.error.message ?? "ArcGIS error");
  return (body.features ?? []).map((f) => f.attributes ?? {});
}
const txt = (v: unknown): string => String(v ?? "").trim();

/** Several layers pack city/state/zip INTO the address field. Split it back
 *  out, or the baseline never resolves and the source silently gets ZERO
 *  adversarial coverage — which is how TX, OH, CA, VA and Maricopa were being
 *  skipped rather than tested. */
function splitEmbedded(raw: string, knownCity: string): { street: string; city: string } {
  let v = raw.trim();
  let city = knownCity;
  const stZip = v.match(/[,\s]+([A-Z .]+?)[,\s]+[A-Z]{2}\s+\d{5}(-\d{4})?$/i);
  if (stZip) { if (!city) city = stZip[1].trim(); v = v.slice(0, stZip.index).trim(); }
  v = v.replace(/\s*,?\s*[A-Z]{2}\s+\d{5}(-\d{4})?$/i, "").trim();
  v = v.replace(/\s+\d{5}(-\d{4})?$/, "").trim();
  v = v.replace(/\s*,\s*$/, "").trim();
  const gap = v.split(/\s{2,}/).map((x) => x.trim()).filter(Boolean);
  if (gap.length > 1) {
    const tail = gap[gap.length - 1].replace(/\s+\d{5}(-\d{4})?$/, "").trim();
    const head = gap.slice(0, -1).join(" ").trim();
    if (tail && !/\d/.test(tail) && /^\d+\s+\S/.test(head)) { if (!city) city = tail; v = head; }
    else v = gap.join(" ").trim();
  }
  return { street: v.replace(/\s+/g, " "), city };
}

/** Prefer an address with the most mutable features, so each source exercises
 *  as many variant families as possible. */
function score(a: string): number {
  let s = 0;
  for (const [abbr, full] of [...SUFFIXES, ...DIRECTIONALS, ...ORDINALS]) {
    if (rx(abbr).test(a) || rx(full).test(a)) s++;
  }
  return s;
}

async function sample(src: ArcgisParcelSource): Promise<{ street: string; city: string } | null> {
  const helper = src.addressKeyJoin ?? src.addressPointsSource;
  const cityField = src.cityField;
  let rows: Array<Record<string, unknown>>; let f: string; let cf: string | null;
  if (helper) { f = helper.addressMatchField; cf = null; rows = await query(helper.queryUrl, { where: "1=1", outFields: f, resultRecordCount: "300" }); }
  else if (src.streetNumberField && src.streetNameField) {
    const n = src.streetNumberField, sname = src.streetNameField;
    const out = [n, sname, cityField].filter(Boolean).join(",");
    const pick = (rs: Array<Record<string, unknown>>) => rs
      .map((r) => splitEmbedded(`${txt(r[n]).replace(/\.0+$/, "")} ${txt(r[sname])}`.trim(), cityField ? txt(r[cityField]) : ""))
      .filter((x) => /^\d+\s+\S/.test(x.street))
      .sort((a, b) => score(b.street) - score(a.street))[0] ?? null;
    rows = await query(src.queryUrl, { where: "1=1", outFields: out, resultRecordCount: "300" });
    let got = pick(rows);
    // Same fallback the round-trip harness needs: some layers lead with
    // hundreds of unaddressed parcels.
    if (!got) {
      try { got = pick(await query(src.queryUrl, { where: `${sname} <> ''`, outFields: out, resultRecordCount: "300" })); } catch { /* keep first pass */ }
    }
    return got;
  } else { f = src.addressMatchField ?? src.fields.address!; cf = cityField ?? null; rows = await query(src.queryUrl, { where: "1=1", outFields: [f, cf].filter(Boolean).join(","), resultRecordCount: "300" }); }
  if (!f!) return null;
  const pick = (rs: Array<Record<string, unknown>>) => rs
    .map((r) => splitEmbedded(txt(r[f]), cf ? txt(r[cf]) : ""))
    .filter((x) => /^\d+\s+\S/.test(x.street))
    .sort((a, b) => score(b.street) - score(a.street))[0] ?? null;
  let got = pick(rows);
  if (!got && !helper) {
    try { got = pick(await query(src.queryUrl, { where: `${f} <> ''`, outFields: [f, cf].filter(Boolean).join(","), resultRecordCount: "300" })); } catch { /* keep first pass */ }
  }
  return got;
}

async function resolve(street: string, city: string, state: string): Promise<string | null> {
  let lat: number | null = null, lon: number | null = null;
  try { const g = await geocodeToCensusTract(street, city, state, undefined); if (g) { lat = Number(g.lat); lon = Number(g.lon); } } catch { /* best effort */ }
  const r = await resolveJurisdictionParcel({ street, city, state, zip: null, lat, lon } as never);
  return r ? String(r.accountId) : null;
}

async function main() {
  const only = process.argv[2]?.toUpperCase().split(",").filter(Boolean) ?? null;
  const holes: string[] = [];
  const wrong: string[] = [];
  let tested = 0, passed = 0;

  for (const src of ARCGIS_PARCEL_SOURCES) {
    if (only && !only.includes(src.state.toUpperCase())) continue;
    const label = `${src.state}${src.county ? " · " + src.county : ""}`;
    let s: { street: string; city: string } | null = null;
    try { s = await sample(src); } catch { /* fall through */ }
    if (!s) { console.log(`[skip] ${label} — no sample`); continue; }

    const baseline = await resolve(s.street, s.city, src.state);
    if (!baseline) { console.log(`[skip] ${label} — baseline "${s.street}" did not resolve`); continue; }

    const vs = variants(s.street);
    const fails: string[] = [];
    for (const v of vs) {
      tested++;
      const got = await resolve(v.value, s.city, src.state);
      if (got === baseline) { passed++; continue; }
      if (got === null) { fails.push(`MISS ${v.label}`); holes.push(`${label} | ${v.label} | "${v.value}"`); }
      else { fails.push(`WRONG ${v.label}`); wrong.push(`${label} | ${v.label} | "${v.value}" -> ${got} (expected ${baseline})`); }
    }
    console.log(`${fails.length ? "[HOLE]" : "[ ok ]"} ${label} · base "${s.street}" -> ${baseline}${fails.length ? `\n        ${fails.join(", ")}` : ""}`);
  }

  console.log(`\nvariants tested: ${tested} · matched baseline: ${passed} · missed: ${holes.length} · WRONG PARCEL: ${wrong.length}`);
  if (wrong.length) { console.log("\n*** WRONG PARCEL (most serious) ***"); for (const w of wrong) console.log("  " + w); }
  if (holes.length) { console.log("\nMISSES (returned nothing):"); for (const h of holes) console.log("  " + h); }
}

main().catch((e) => { console.error(e); process.exit(1); });
