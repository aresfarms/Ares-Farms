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
import { HUD_PUBLIC_SAFE_BY_STATE } from "./hudPublicSafeGenerated";
import { USDA_PUBLIC_SAFE_BY_STATE } from "./usdaPublicSafeGenerated";

export type LiveSources = Partial<Record<PropertySourceId, boolean>>;

/**
 * One public-safe property for a state's map "Possible" card, given which sources
 * are live. Prefers a current HUD listing, else a historical USDA example.
 */
export function publicSafeForState(stateAbbr: string, live: LiveSources): PublicSafeProperty | null {
  const st = stateAbbr?.toUpperCase();
  if (!st) return null;
  if (live.hud && HUD_PUBLIC_SAFE_BY_STATE[st]) return HUD_PUBLIC_SAFE_BY_STATE[st];
  if (live.usda && USDA_PUBLIC_SAFE_BY_STATE[st]) return USDA_PUBLIC_SAFE_BY_STATE[st];
  return null;
}
