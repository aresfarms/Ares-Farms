/**
 * NMTC low-income-community adapter (CORE leaf — global fetch only).
 *
 * Resolves a single Census tract GEOID against the public NMTC Qualified Tracts
 * 2020 layer. This is a place-fact about the tract, not a person-side
 * determination or allocation approval.
 */

export const NMTC_URL =
  "https://services6.arcgis.com/BAJNi3EgCdtQ1BCG/arcgis/rest/services/NMTC_Qualified_Tracts_2020/FeatureServer/3/query";

export const NMTC_ADAPTER_VERSION = "nmtc-adapter-v0.1.0";

export interface NmtcFact {
  tractId: string;
  designated: boolean;
}

export async function lookupNmtcQualifiedTract(tractId: string): Promise<NmtcFact | null> {
  const normalized = tractId.trim();
  if (!/^\d{11}$/.test(normalized)) {
    return null;
  }

  const params = new URLSearchParams({
    where: `FIPS='${normalized}' AND Does_Census_Tract_Qualify_For_N='YES'`,
    outFields: "FIPS",
    returnGeometry: "false",
    f: "pjson",
  });

  const res = await fetch(NMTC_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    throw new Error(`NMTC HTTP ${res.status}`);
  }

  const body = await res.json();
  const feature = (body?.features ?? [])[0];
  const match = feature?.attributes?.FIPS ? String(feature.attributes.FIPS) : null;
  if (!match) {
    return null;
  }

  return {
    tractId: match,
    designated: true,
  };
}
