/**
 * parcelSourceHealthCheck — live reachability probe for every entry in
 * parcelSourceRegistry (ARCGIS_PARCEL_SOURCES). Government ArcGIS services can be
 * renamed, retired, or re-hosted without notice; this is the automated check that
 * catches that instead of a customer hitting a silent null result first.
 *
 * Probe strategy: `returnCountOnly=true&where=1=1&f=json` against each layer.
 * This is the cheapest valid ArcGIS query — it works on every layer regardless of
 * field names and never scans/returns row data — so it proves the service is up
 * and the query URL is still correct without doing a real parcel lookup.
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

async function probeEndpoint(label: string, url: string, timeoutMs: number): Promise<ParcelEndpointHealth> {
  const started = Date.now();
  const params = new URLSearchParams({ f: "json", where: "1=1", returnCountOnly: "true" });
  try {
    const res = await governedFetch(`${url}?${params.toString()}`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(timeoutMs),
    });
    const latencyMs = Date.now() - started;
    if (!res.ok) return { label, url, ok: false, httpStatus: res.status, latencyMs, error: `HTTP ${res.status}` };
    const body = (await res.json()) as { count?: number; error?: { message?: string } };
    if (body.error) return { label, url, ok: false, httpStatus: res.status, latencyMs, error: body.error.message ?? "ArcGIS error response" };
    if (typeof body.count !== "number") return { label, url, ok: false, httpStatus: res.status, latencyMs, error: "response missing count field" };
    return { label, url, ok: true, httpStatus: res.status, latencyMs, error: null };
  } catch (error) {
    return { label, url, ok: false, httpStatus: null, latencyMs: Date.now() - started, error: (error as Error).message };
  }
}

/** Checks one registry entry's query endpoint(s), including its assessor-table
 *  join when the source has one — both must respond for the source to be "ok". */
export async function checkParcelSourceHealth(src: ArcgisParcelSource, timeoutMs = 10_000): Promise<ParcelSourceHealth> {
  const endpoints: ParcelEndpointHealth[] = [await probeEndpoint("parcel layer", src.queryUrl, timeoutMs)];
  if (src.assessJoin) endpoints.push(await probeEndpoint("assessor table", src.assessJoin.tableUrl, timeoutMs));
  return {
    state: src.state,
    county: src.county ?? null,
    sourceName: src.sourceName,
    ok: endpoints.every((e) => e.ok),
    endpoints,
  };
}

/** Checks every registry entry concurrently and returns a full report. */
export async function checkAllParcelSources(timeoutMs = 10_000): Promise<ParcelSourceHealthReport> {
  const sources = await Promise.all(ARCGIS_PARCEL_SOURCES.map((src) => checkParcelSourceHealth(src, timeoutMs)));
  const healthy = sources.filter((s) => s.ok).length;
  return {
    checkedAt: new Date().toISOString(),
    total: sources.length,
    healthy,
    unhealthy: sources.length - healthy,
    sources,
  };
}
