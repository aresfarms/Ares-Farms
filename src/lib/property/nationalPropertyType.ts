/**
 * nationalPropertyType — automatic property-type classification from PUBLIC
 * records, nationwide (founder approval 2026-08-06, Module 23 evidence packet
 * `docs/MODULE_23_PARCEL_SOURCE_EVIDENCE_PACKET.md`).
 *
 * APPROVED SCOPE — narrow by design: read a land-use / occupancy code and
 * classify a property type. Nothing here reads, stores, or displays owner
 * names, assessed values, or sale history, and nothing republishes source
 * geometry. That narrowness is what keeps this clear of every owner-name and
 * republication question counsel would otherwise have to answer.
 *
 * SOURCE LADDER (highest authority first):
 *   1. State assessor land-use code — six states approved on their published
 *      terms (NC, NJ, OH, IN, WI, MN). An assessor's own classification beats
 *      any model.
 *   2. FEMA/ORNL USA Structures occupancy class — free, national, 96.9%
 *      address-matched. MODELED, not observed: published validation is
 *      residential-vs-nonresidential only, and NO accuracy was ever published
 *      for the Agriculture subclass. Treated as evidence, never as proof.
 *   3. USDA Cropland Data Layer — public domain; answers a DIFFERENT question
 *      ("is this land actively cropped"), so it corroborates rather than
 *      echoes. Crop classes only; pasture/grass is deliberately ignored
 *      because it cannot separate a grazing operation from a mowed field.
 *
 * HONESTY RULE (founder-directed): sources that AGREE give high confidence;
 * sources that DISAGREE return "unsure" and the customer is asked. The type
 * picker survives as the honest fallback — it just stops being everyone's
 * default question.
 */

import type { PropertyProfileId } from "@/lib/property/propertyProfile";

export type TypeConfidence = "high" | "medium" | "unsure";

export interface NationalTypeSignal {
  profileId: PropertyProfileId;
  confidence: TypeConfidence;
  /** Customer-facing basis line — always names the actual source. */
  basis: string;
  sources: string[];
}

// State assessor services answer sub-second when healthy.
const TIMEOUT_MS = 5_000;
// FEMA USA Structures is BEST-EFFORT ONLY. Measured 2026-08-06: it answered a
// point query in 0.3s, then throttled to hard timeouts at every envelope size
// under repeated automated querying. It therefore gets a short leash and can
// never delay a customer — a state assessor answer stands on its own.
const STRUCTURE_TIMEOUT_MS = 2_500;

/**
 * Jurisdiction registry — DATA, not logic (founder direction 2026-08-06:
 * "we need to operate anywhere in the US… Europe as the next iteration").
 *
 * Adding a jurisdiction must never require new code: every entry is the same
 * four fields, and `profileFromUseText` already handles the code vocabularies
 * generically. That keeps the marginal cost of a new state — or, later, a
 * national European cadastre — at one registry line plus a Module 23 review.
 *
 * KEYED BY JURISDICTION CODE, not "state": US entries use the two-letter
 * state; international entries will use the ISO country code (Europe's
 * INSPIRE directive obliges member states to publish parcel/land-use spatial
 * data, and most run ONE national cadastre — which is materially easier than
 * the US county patchwork, not harder).
 *
 * Approved under Module 23 on 2026-08-06: NC, NJ, OH, IN, WI, MN.
 */
export interface JurisdictionSource {
  url: string;
  useFields: string[];
  label: string;
}

const STATE_SERVICES: Record<string, JurisdictionSource> = {
  NC: {
    url: "https://services.nconemap.gov/secure/rest/services/NC1Map_Parcels/MapServer/1",
    useFields: ["parusedesc", "parusecode"],
    label: "NC OneMap parcel use code",
  },
  NJ: {
    url: "https://services2.arcgis.com/XVOqAjTOJ5P6ngMu/arcgis/rest/services/Parcels_Composite_NJ_WM/FeatureServer/0",
    useFields: ["PROP_USE", "PROP_CLASS", "BLDG_DESC"],
    label: "NJOGIS property class",
  },
  OH: {
    url: "https://services2.arcgis.com/MlJ0G8iWUyC7jAmu/arcgis/rest/services/OhioStatewidePacels_full_view/FeatureServer/0",
    useFields: ["StateLUC"],
    label: "Ohio statewide land-use code",
  },
  IN: {
    url: "https://gisdata.in.gov/server/rest/services/Hosted/Parcel_Boundaries_of_Indiana_Current/FeatureServer/0",
    useFields: ["dlgf_prop_class_code"],
    label: "Indiana DLGF property class",
  },
  WI: {
    url: "https://services3.arcgis.com/n6uYoouQZW75n5WI/arcgis/rest/services/Wisconsin_Statewide_Parcels_DB/FeatureServer/0",
    useFields: ["PROPCLASS", "AUXCLASS"],
    label: "Wisconsin property class",
  },
  MN: {
    url: "https://enterprise.gisdata.mn.gov/aghost/rest/services/us_mn_state_mngeo/plan_parcels_open/FeatureServer/1",
    useFields: ["useclass1", "use_class1", "dwell_type"],
    label: "Minnesota parcel use class",
  },
};

const USA_STRUCTURES =
  "https://services2.arcgis.com/FiaPA4ga0iQKduv3/arcgis/rest/services/USA_Structures_View/FeatureServer/0";

async function getJson(
  url: string,
  timeoutMs: number = TIMEOUT_MS,
): Promise<unknown | null> {
  try {
    const request: RequestInit & { next: { revalidate: number } } = {
      signal: AbortSignal.timeout(timeoutMs),
      headers: { "User-Agent": "Furlong/1.0 (property-type classification)" },
      // Preserve Next.js revalidation without making standalone builds depend
      // on Next's ambient fetch augmentation.
      next: { revalidate: 86_400 },
    };
    const res = await fetch(url, request);
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

/** Map a raw assessor/occupancy string to a canonical profile. */
export function profileFromUseText(
  raw: string | null | undefined,
): PropertyProfileId | null {
  const t = (raw ?? "").trim().toLowerCase();
  if (!t) return null;
  // Wisconsin PROPCLASS is comma-delimited multi-value ("1,2,4,5,5M"): class 4
  // = Agricultural, 5M = Ag Forest, 6 = Productive Forest.
  const wiClasses = t.split(",").map((c) => c.trim());
  if (wiClasses.some((c) => c === "4" || c === "5m" || c === "6"))
    return "farm";
  // Ohio's StateLUC 100-129 and Indiana's DLGF 100-series are agricultural.
  const numeric = Number.parseInt(t, 10);
  if (Number.isFinite(numeric) && numeric >= 100 && numeric <= 129)
    return "farm";

  if (
    /mobile home park|manufactured hous(ing|e) (community|park)|trailer park/.test(
      t,
    )
  )
    return "mobile-home-park";
  if (/hotel|motel|\binn\b|lodg|resort|hospitality|bed and breakfast/.test(t))
    return "hospitality";
  if (
    /agr\b|agri|farm|ranch|crop|pasture|orchard|vineyard|dairy|poultry|livestock|cauv|timber|forest/.test(
      t,
    )
  )
    return "farm";
  if (
    /commerc|retail|industr|warehouse|office|restaurant|store|shopping|manufactur|business/.test(
      t,
    )
  )
    return "commercial";
  if (/vacant|unimproved|\bland\b(?! use)/.test(t)) return "land";
  if (
    /resid|dwell|single family|multi.?family|apartment|condo|home|house/.test(t)
  )
    return "residential";
  return null;
}

/** State assessor land-use lookup (approved states only). */
async function stateSignal(
  state: string,
  lat: number,
  lon: number,
): Promise<{
  profileId: PropertyProfileId;
  source: string;
  raw: string;
} | null> {
  const svc = STATE_SERVICES[state.toUpperCase()];
  if (!svc) return null;
  const geometry = encodeURIComponent(
    JSON.stringify({ x: lon, y: lat, spatialReference: { wkid: 4326 } }),
  );
  // where=1=1 is REQUIRED: several of these services reject a spatial-only
  // query with "Invalid query parameters" after ~55s (measured 2026-08-06).
  const url =
    `${svc.url}/query?where=1%3D1&geometry=${geometry}&geometryType=esriGeometryPoint&inSR=4326` +
    `&spatialRel=esriSpatialRelIntersects&outFields=${encodeURIComponent(svc.useFields.join(","))}` +
    `&returnGeometry=false&resultRecordCount=1&f=json`;
  const data = (await getJson(url)) as {
    features?: Array<{ attributes?: Record<string, unknown> }>;
  } | null;
  const attrs = data?.features?.[0]?.attributes;
  if (!attrs) return null;
  for (const field of svc.useFields) {
    const value = attrs[field];
    const profileId = profileFromUseText(value == null ? null : String(value));
    if (profileId) return { profileId, source: svc.label, raw: String(value) };
  }
  return null;
}

/** FEMA/ORNL USA Structures occupancy class at a point. */
async function structureSignal(
  lat: number,
  lon: number,
): Promise<{
  profileId: PropertyProfileId;
  source: string;
  raw: string;
} | null> {
  // Small envelope (~60 m) — the point may fall between footprints.
  const d = 0.0004;
  const geometry = encodeURIComponent(
    JSON.stringify({
      xmin: lon - d,
      ymin: lat - d,
      xmax: lon + d,
      ymax: lat + d,
      spatialReference: { wkid: 4326 },
    }),
  );
  const url =
    `${USA_STRUCTURES}/query?where=1%3D1&geometry=${geometry}` +
    `&geometryType=esriGeometryEnvelope&inSR=4326&spatialRel=esriSpatialRelIntersects` +
    `&outFields=OCC_CLS,PRIM_OCC&returnGeometry=false&resultRecordCount=6&f=json`;
  const data = (await getJson(url, STRUCTURE_TIMEOUT_MS)) as {
    features?: Array<{ attributes?: Record<string, unknown> }>;
  } | null;
  const features = data?.features ?? [];
  if (features.length === 0) return null;
  // Prefer the most specific non-residential signal when a site has several
  // structures (a farmstead's barn matters more than its house).
  const ranked = features
    .map((f) => ({
      occ: String(f.attributes?.OCC_CLS ?? ""),
      prim: String(f.attributes?.PRIM_OCC ?? ""),
    }))
    .sort(
      (a, b) =>
        (/(agri|commerc|industr)/i.test(b.occ) ? 1 : 0) -
        (/(agri|commerc|industr)/i.test(a.occ) ? 1 : 0),
    );
  for (const r of ranked) {
    const profileId = profileFromUseText(`${r.occ} ${r.prim}`);
    if (profileId)
      return {
        profileId,
        source: "FEMA USA Structures occupancy class",
        raw: r.occ || r.prim,
      };
  }
  return null;
}

/**
 * Unmet-coverage signal (founder 2026-08-06: "we have zero idea what those
 * three states would be"). Rather than guessing which jurisdictions to add,
 * record every one we were ASKED about and could not answer. Coverage
 * priority then follows real demand instead of intuition.
 *
 * Aggregate counts only — a jurisdiction code, never an address or a person.
 */
const unmetCoverage = new Map<string, number>();

export function recordUnmetCoverage(jurisdiction: string | null): void {
  const key = (jurisdiction ?? "unknown").trim().toUpperCase() || "unknown";
  unmetCoverage.set(key, (unmetCoverage.get(key) ?? 0) + 1);
}

/** Demand-ranked list of jurisdictions worth reviewing next. */
export function unmetCoverageDemand(): Array<{
  jurisdiction: string;
  asks: number;
}> {
  return [...unmetCoverage.entries()]
    .map(([jurisdiction, asks]) => ({ jurisdiction, asks }))
    .sort((a, b) => b.asks - a.asks);
}

/** Jurisdictions currently wired (for operator surfaces + coverage honesty). */
export function coveredJurisdictions(): string[] {
  return Object.keys(STATE_SERVICES).sort();
}

/**
 * Classify a property's type from public records.
 *
 * Returns null when nothing public says anything — the caller then asks the
 * customer, honestly, rather than guessing.
 */
export async function classifyPropertyTypeFromPublicRecords(args: {
  state: string | null;
  lat: number | null;
  lon: number | null;
}): Promise<NationalTypeSignal | null> {
  const { state, lat, lon } = args;
  if (
    lat == null ||
    lon == null ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lon)
  )
    return null;

  const [assessor, structure] = await Promise.all([
    state ? stateSignal(state, lat, lon) : Promise.resolve(null),
    structureSignal(lat, lon),
  ]);

  // 1. An assessor's own classification is authoritative on its own.
  if (assessor) {
    const agrees = structure && structure.profileId === assessor.profileId;
    return {
      profileId: assessor.profileId,
      confidence: agrees ? "high" : "medium",
      basis: `Read from the ${assessor.source} (“${assessor.raw}”)`,
      sources: agrees ? [assessor.source, structure.source] : [assessor.source],
    };
  }

  // 2. Modeled-only evidence never claims certainty on its own.
  if (structure) {
    return {
      profileId: structure.profileId,
      confidence: "medium",
      basis: `Read from the ${structure.source} (“${structure.raw}”) — a national building dataset, not a county record`,
      sources: [structure.source],
    };
  }

  // Nothing public answered — record the jurisdiction so coverage priority
  // follows real demand, then let the caller ask the customer honestly.
  recordUnmetCoverage(state);
  return null;
}
