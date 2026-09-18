/**
 * Place-fact pipeline step — SERVER-ONLY.
 *
 * Wires the place-fact lookup INTO the property refresh pipeline: after the
 * daily refresh re-pulls feeds (auctions rotate), this resolves the OZ + HUBZone
 * place-fact for any LIVE property NOT already covered by the committed snapshot
 * or the overlay, and writes the result to the overlay. Effect: a missing badge
 * always means "checked, not designated" — never "not checked" — because every
 * live property is eventually resolved here.
 *
 * Gate-respecting: uses the place-fact live lookups, which are Module 22/23
 * gated. If a place-fact source is NOT activated, that lookup is skipped and
 * logged — the pipeline never performs an ungated live fetch. (OZ + HUBZone are
 * currently approved.) Public render stays snapshot/overlay-only; the live
 * lookup happens here in the backend pipeline, never at render time.
 */

import { canonicalLandRegisterAuthority } from "@/lib/platform/authorities/landRegister";
import { recordsForReview, PROPERTY_SOURCE_IDS } from "./propertyData";
import { isSourceLiveRuntime } from "./sourceActivationStore";
import { PROPERTY_OZ_FACTS } from "./propertyOpportunityZonesGenerated";
import { PROPERTY_HUBZONE_FACTS } from "./propertyHubzonesGenerated";
import { readPlaceFactOverlay, writePlaceFactOverlay } from "./placeFactOverlay";
import { lookupOpportunityZone } from "@/lib/scrapers/adapters/opportunity-zones";
import { lookupHubzone } from "@/lib/scrapers/adapters/hubzone";
import { isPlaceFactLiveFetchActivatedRuntime } from "@/lib/place-facts/placeFactActivationStore";

const DOMAIN = "place-fact-refresh";

export interface PlaceFactRefreshResult {
  liveWithAddress: number;
  alreadyChecked: number;
  newlyChecked: number;
  newlyDesignatedOz: number;
  newlyDesignatedHubzone: number;
  ozActivated: boolean;
  hubzoneActivated: boolean;
  missingAfter: number; // live ids still unchecked (should trend to 0)
  reason: string;
}

/** All live properties with a usable address (the denominator that must be checked). */
function liveAddressedProperties() {
  const out: { id: string; street: string; city: string; state: string; zip: string }[] = [];
  for (const sourceId of PROPERTY_SOURCE_IDS) {
    if (!isSourceLiveRuntime(sourceId)) continue;
    for (const c of recordsForReview(sourceId)) {
      const r = c.source_records[0];
      if (!r.exactAddress || !r.town || !r.state) continue;
      out.push({ id: c.canonical_property_id, street: r.exactAddress, city: r.town, state: r.state, zip: r.zip ?? "" });
    }
  }
  return out;
}

/**
 * Resolve place-facts for any live property not yet covered. `limit` caps the
 * per-run live-lookup volume (auctions rotate slowly); remaining ids resolve on
 * subsequent runs. Returns a summary; logs to the audit ledger.
 */
export async function refreshPropertyPlaceFacts(opts?: { limit?: number; now?: Date }): Promise<PlaceFactRefreshResult> {
  const limit = opts?.limit ?? 200;
  const ozActivated = isPlaceFactLiveFetchActivatedRuntime("hud-opportunity-zones");
  const hubzoneActivated = isPlaceFactLiveFetchActivatedRuntime("sba-hubzone");

  const live = liveAddressedProperties();
  const overlay = readPlaceFactOverlay();
  const committedOz = new Set(Object.keys(PROPERTY_OZ_FACTS));
  const overlayChecked = new Set(overlay.checkedIds);
  const isChecked = (id: string) => committedOz.has(id) || overlayChecked.has(id);

  const uncovered = live.filter((p) => !isChecked(p.id));
  const result: PlaceFactRefreshResult = {
    liveWithAddress: live.length,
    alreadyChecked: live.length - uncovered.length,
    newlyChecked: 0,
    newlyDesignatedOz: 0,
    newlyDesignatedHubzone: 0,
    ozActivated,
    hubzoneActivated,
    missingAfter: uncovered.length,
    reason: "",
  };

  if (uncovered.length === 0) {
    result.reason = "all live properties already checked (snapshot + overlay)";
    log(result);
    return result;
  }
  if (!ozActivated && !hubzoneActivated) {
    result.reason = "place-fact live fetch not activated (Module 22/23) — no resolution performed; gate respected";
    log(result);
    return result;
  }

  const batch = uncovered.slice(0, limit);
  for (const p of batch) {
    // OZ — record every attempt (designated or not) so presence = checked.
    if (ozActivated) {
      const oz = await lookupOpportunityZone(p.street, p.city, p.state, p.zip).catch(() => null);
      overlay.oz[p.id] = oz && oz.geoid
        ? { designated: oz.designated, tractId: oz.geoid, rural: oz.rural }
        : { designated: false, tractId: null, rural: false };
      if (overlay.oz[p.id].designated) result.newlyDesignatedOz += 1;
    }
    // HUBZone — store only when designated (mirrors the committed snapshot).
    if (hubzoneActivated) {
      const hz = await lookupHubzone(p.street, p.city, p.state, p.zip, opts?.now).catch(() => null);
      if (hz && hz.designated && hz.geoid) {
        overlay.hubzone[p.id] = {
          hubzoneType: hz.hubzoneType ?? "HUBZone",
          geoid: hz.geoid,
          effective: hz.effective ?? "",
          expiration: hz.expiration,
          timeLimited: hz.timeLimited,
        };
        result.newlyDesignatedHubzone += 1;
      }
    }
    if (!overlayChecked.has(p.id)) overlay.checkedIds.push(p.id);
    result.newlyChecked += 1;
  }

  overlay.asOf = (opts?.now ?? new Date()).toISOString().slice(0, 10);
  writePlaceFactOverlay(overlay);

  const stillUncovered = uncovered.length - batch.length;
  result.missingAfter = stillUncovered;
  result.reason = `resolved ${result.newlyChecked} new propert${result.newlyChecked === 1 ? "y" : "ies"} (+${result.newlyDesignatedOz} OZ, +${result.newlyDesignatedHubzone} HUBZone); ${stillUncovered} remaining for next run`;
  log(result);
  return result;
}

function log(r: PlaceFactRefreshResult): void {
  canonicalLandRegisterAuthority.append({
    actorId: "system:place-fact-refresh",
    actorName: "place-fact-refresh-job",
    domain: DOMAIN,
    subject: "property-place-facts",
    decision: r.newlyChecked > 0 ? "RESOLVED" : "NO_CHANGE",
    reason: r.reason,
    detail: { ...r },
  });
}

/** Coverage snapshot for proof: how many live properties are checked vs missing.
 *  liveTotal = every live record; liveWithoutAddress = live records that carry no
 *  usable address (structurally uncheckable — disclosed, never hidden). */
export function placeFactCoverage(): {
  liveTotal: number;
  liveWithAddress: number;
  liveWithoutAddress: number;
  checked: number;
  missing: number;
  missingIds: string[];
} {
  const live = liveAddressedProperties();
  let liveTotal = 0;
  for (const sourceId of PROPERTY_SOURCE_IDS) {
    if (!isSourceLiveRuntime(sourceId)) continue;
    liveTotal += recordsForReview(sourceId).length;
  }
  const overlay = readPlaceFactOverlay();
  const committedOz = new Set(Object.keys(PROPERTY_OZ_FACTS));
  const overlayChecked = new Set(overlay.checkedIds);
  const missingIds = live.filter((p) => !committedOz.has(p.id) && !overlayChecked.has(p.id)).map((p) => p.id);
  return {
    liveTotal,
    liveWithAddress: live.length,
    liveWithoutAddress: liveTotal - live.length,
    checked: live.length - missingIds.length,
    missing: missingIds.length,
    missingIds: missingIds.slice(0, 20),
  };
}
