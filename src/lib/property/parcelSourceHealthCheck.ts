/**
 * parcelSourceHealthCheck — live reachability probe for every entry in
 * parcelSourceRegistry (ARCGIS_PARCEL_SOURCES). Government ArcGIS services can be
 * renamed, retired, or re-hosted without notice; this is the automated check that
 * catches that instead of a customer hitting a silent null result first.
 *
 * Probe strategy: `where=1=1&returnIdsOnly=true&resultRecordCount=1`. Works on
 * every layer regardless of field names, returns at most one object id, and
 * proves the service is up AND the query path still functions — without doing a
 * real parcel lookup.
 *
 * Deliberately NOT `returnCountOnly=true`: counting every row forces a full
 * scan on large layers. Measured against East Baton Rouge (205,820 parcels) a
 * count took 7.9s while this probe takes 0.5s — the count version produced
 * intermittent false "down" reports for a source whose real address lookups
 * answer in under half a second.
 *
 * Governed egress only: reuses governedFetch, so a health check can never reach a
 * host outside the same PARCEL_SOURCE_HOSTS allowlist the resolver itself uses.
 */

import { governedFetch } from "@/lib/security/outboundRequestPolicy";
import { ARCGIS_PARCEL_SOURCES, type ArcgisParcelSource } from "./parcelSourceRegistry";

export interface ParcelEndpointHealth {
  label: string;
  url: string;
  ok: boolean;
  httpStatus: number | null;
  latencyMs: number;
  error: string | null;
}

export interface ParcelSourceHealth {
  state: string;
  county: string | null;
  sourceName: string;
  ok: boolean;
  endpoints: ParcelEndpointHealth[];
}

export interface ParcelSourceHealthReport {
  checkedAt: string;
  total: number;
  healthy: number;
  unhealthy: number;
  sources: ParcelSourceHealth[];
}

/** Probe once, and on failure probe ONE more time before calling a source
 *  down. Some government endpoints are legitimately slow (East Baton Rouge
 *  answers correctly but takes ~7.6s every time) and a single timeout under
 *  load is not evidence of an outage. A health check that reports false
 *  failures trains people to ignore it, which is worse than not having one. */
async function probeEndpointWithRetry(label: string, url: string, timeoutMs: number): Promise<ParcelEndpointHealth> {
  const first = await probeEndpoint(label, url, timeoutMs);
  if (first.ok) return first;
  const retry = await probeEndpoint(label, url, timeoutMs);
  return retry.ok
    ? retry
    : { ...retry, error: `${retry.error} (failed twice; first attempt: ${first.error})` };
}

async function probeEndpoint(label: string, url: string, timeoutMs: number): Promise<ParcelEndpointHealth> {
  const started = Date.now();
  const params = new URLSearchParams({ f: "json", where: "1=1", returnIdsOnly: "true", resultRecordCount: "1" });
  try {
    const res = await governedFetch(`${url}?${params.toString()}`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(timeoutMs),
    });
    const latencyMs = Date.now() - started;
    if (!res.ok) return { label, url, ok: false, httpStatus: res.status, latencyMs, error: `HTTP ${res.status}` };
    const body = (await res.json()) as { objectIds?: unknown; objectIdFieldName?: string; error?: { message?: string } };
    if (body.error) return { label, url, ok: false, httpStatus: res.status, latencyMs, error: body.error.message ?? "ArcGIS error response" };
    // A healthy layer answers with an objectIds array. An empty array is still
    // healthy (the layer responded and has an id field); a MISSING array means
    // this wasn't a real ArcGIS query response.
    if (!Array.isArray(body.objectIds)) {
      return { label, url, ok: false, httpStatus: res.status, latencyMs, error: "response missing objectIds array" };
    }
    return { label, url, ok: true, httpStatus: res.status, latencyMs, error: null };
  } catch (error) {
    return { label, url, ok: false, httpStatus: null, latencyMs: Date.now() - started, error: (error as Error).message };
  }
}

/** Checks every endpoint one registry entry depends on — the parcel layer plus
 *  any assessor-table join, address-point source, or address→key crosswalk.
 *  ALL of them must respond for the source to be "ok": a source whose helper
 *  layer is down is broken in practice even if its parcel layer answers. */
export async function checkParcelSourceHealth(src: ArcgisParcelSource, timeoutMs = 12_000): Promise<ParcelSourceHealth> {
  const endpoints: ParcelEndpointHealth[] = [await probeEndpointWithRetry("parcel layer", src.queryUrl, timeoutMs)];
  if (src.assessJoin) endpoints.push(await probeEndpointWithRetry("assessor table", src.assessJoin.tableUrl, timeoutMs));
  if (src.addressPointsSource) endpoints.push(await probeEndpointWithRetry("address points", src.addressPointsSource.queryUrl, timeoutMs));
  if (src.addressKeyJoin) endpoints.push(await probeEndpointWithRetry("address→key crosswalk", src.addressKeyJoin.queryUrl, timeoutMs));
  return {
    state: src.state,
    county: src.county ?? null,
    sourceName: src.sourceName,
    ok: endpoints.every((e) => e.ok),
    endpoints,
  };
}

/**
 * Checks every registry entry and returns a full report.
 *
 * Runs in BOUNDED batches rather than firing all ~60 sources at once: doing
 * them all simultaneously starved slow-but-healthy endpoints of local sockets
 * and reported them as down (East Baton Rouge, a genuine ~7.6s responder,
 * failed this way). The cap keeps the run honest; it is still fast because the
 * work is almost entirely network wait.
 *
 * The 12s budget matches the resolver's own query timeout, so "healthy here"
 * means "usable by a real lookup" rather than a laxer standard the product
 * itself would not tolerate.
 */
export async function checkAllParcelSources(timeoutMs = 12_000, concurrency = 8): Promise<ParcelSourceHealthReport> {
  const sources: ParcelSourceHealth[] = [];
  for (let i = 0; i < ARCGIS_PARCEL_SOURCES.length; i += concurrency) {
    const batch = ARCGIS_PARCEL_SOURCES.slice(i, i + concurrency);
    sources.push(...await Promise.all(batch.map((src) => checkParcelSourceHealth(src, timeoutMs))));
  }
  const healthy = sources.filter((s) => s.ok).length;
  return {
    checkedAt: new Date().toISOString(),
    total: sources.length,
    healthy,
    unhealthy: sources.length - healthy,
    sources,
  };
}
