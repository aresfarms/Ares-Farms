"use client";

/**
 * propertyFactsPrefetch — warm-start for the property workspace (Tier 3b,
 * founder speed complaint 2026-07-28: "it seems to be taking quite a while
 * to get to the answers").
 *
 * The address-check surface (PlaceFirstDiscovery) fires the exact
 * /api/public/property-facts request the workspace would make — at the moment
 * verification succeeds, BEFORE router.push. Client-side navigation keeps the
 * same JS context, so the workspace picks up the in-flight promise and the
 * "still gathering" window shrinks to whatever work remains, often none.
 *
 * Privacy posture matches the existing draft mechanism: nothing leaves the
 * tab. The in-flight promise lives in module scope; no storage is written.
 * The prefetch is an optimization only — if it is missing, stale, or failed,
 * the workspace falls back to its normal fetch with its own timeout.
 */

export type PropertyFactsRequestBody = {
  propertyId: string | null;
  exactAddress: string | null;
  location: string | null;
  stateCode: string | null;
  town: string | null;
  county: string | null;
  startingLens: string | null;
  declaredPropertyType: string | null;
};

type PrefetchEntry = {
  key: string;
  startedAt: number;
  promise: Promise<unknown>;
};

const PREFETCH_TTL_MS = 5 * 60_000;
const PREFETCH_TIMEOUT_MS = 30_000;

let current: PrefetchEntry | null = null;

export function propertyFactsPrefetchKey(body: PropertyFactsRequestBody): string {
  return [
    body.propertyId ?? "",
    body.exactAddress ?? "",
    body.location ?? "",
    body.stateCode ?? "",
    body.town ?? "",
    body.county ?? "",
    body.startingLens ?? "",
    body.declaredPropertyType ?? "",
  ].join("|");
}

/** Fire the workspace's facts request early. Failures are swallowed here and
 *  surface through the workspace's own fallback fetch instead. */
export function startPropertyFactsPrefetch(body: PropertyFactsRequestBody): void {
  if (typeof window === "undefined") return;
  const key = propertyFactsPrefetchKey(body);
  if (current && current.key === key && Date.now() - current.startedAt < PREFETCH_TTL_MS) return;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PREFETCH_TIMEOUT_MS);
  const promise = fetch("/api/public/property-facts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: controller.signal,
    body: JSON.stringify(body),
  })
    .then((res) => res.json())
    .finally(() => clearTimeout(timeout));
  // Attach a no-op catch so an early failure never becomes an unhandled
  // rejection; the consumer re-awaits the original promise and handles errors.
  promise.catch(() => undefined);
  current = { key, startedAt: Date.now(), promise };
}

/** Return the in-flight/completed prefetch for this exact request, or null.
 *  Consuming clears the slot so a later re-fetch (e.g. after a type
 *  correction) always hits the server with the corrected body. */
export function consumePropertyFactsPrefetch(body: PropertyFactsRequestBody): Promise<unknown> | null {
  if (typeof window === "undefined") return null;
  if (!current) return null;
  if (current.key !== propertyFactsPrefetchKey(body)) return null;
  if (Date.now() - current.startedAt >= PREFETCH_TTL_MS) {
    current = null;
    return null;
  }
  const { promise } = current;
  current = null;
  return promise;
}
