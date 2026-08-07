/**
 * Unified public-safe accessor — CLIENT-SAFE (pure; no fs, no runtime store).
 *
 * Imports only public-safe projections (no exact address, no lat/long). Liveness
 * is passed IN (the homepage server component reads the runtime activation store
 * and hands the client map a `liveSources` map) — this keeps fs/Edge concerns out
 * of the client bundle. A CURRENT source (HUD) is preferred over a HISTORICAL one
 * (USDA) for a state's "Possible" card.
 */

import type { PropertySourceId, PublicSafeProperty } from "./propertyTypes";
import { GSA_RE_PUBLIC_SAFE_BY_STATE } from "./gsaRealEstatePublicSafeGenerated";
import { HUD_PUBLIC_SAFE_BY_STATE } from "./hudPublicSafeGenerated";
import { TREASURY_PUBLIC_SAFE_BY_STATE } from "./treasuryPublicSafeGenerated";
import { USDA_PUBLIC_SAFE_BY_STATE } from "./usdaPublicSafeGenerated";

export type LiveSources = Partial<Record<PropertySourceId, boolean>>;
export type PublicSafeInventoryByState = Partial<Record<string, PublicSafeProperty[]>>;

function fallbackPublicSafeForState(stateAbbr: string, live: LiveSources): PublicSafeProperty | null {
  const st = stateAbbr?.toUpperCase();
  if (!st) return null;
  if (live.hud && HUD_PUBLIC_SAFE_BY_STATE[st]) return HUD_PUBLIC_SAFE_BY_STATE[st];
  if (live["gsa-realestate"] && GSA_RE_PUBLIC_SAFE_BY_STATE[st]) return GSA_RE_PUBLIC_SAFE_BY_STATE[st];
  if (live.treasury && TREASURY_PUBLIC_SAFE_BY_STATE[st]) return TREASURY_PUBLIC_SAFE_BY_STATE[st];
  if (live.usda && USDA_PUBLIC_SAFE_BY_STATE[st]) return USDA_PUBLIC_SAFE_BY_STATE[st];
  return null;
}

function stableHash(input: string): number {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) >>> 0;
  }
  return hash;
}

export function publicSafePoolForState(
  stateAbbr: string,
  inventory: PublicSafeInventoryByState | undefined,
  live: LiveSources,
): PublicSafeProperty[] {
  const st = stateAbbr?.toUpperCase();
  if (!st) return [];
  const pool = inventory?.[st] ?? [];
  if (pool.length > 0) return pool;
  const fallback = fallbackPublicSafeForState(st, live);
  return fallback ? [fallback] : [];
}

/**
 * One public-safe property for a state's map "Possible" card, given which sources
 * are live. Prefers a current HUD listing, else a historical USDA example.
 */
export function publicSafeForState(
  stateAbbr: string,
  live: LiveSources,
  inventory?: PublicSafeInventoryByState,
  rotationSeed = 0,
): PublicSafeProperty | null {
  const pool = publicSafePoolForState(stateAbbr, inventory, live);
  if (pool.length === 0) return null;
  const index = stableHash(`${stateAbbr}:${rotationSeed}`) % pool.length;
  return pool[index] ?? pool[0] ?? null;
}
