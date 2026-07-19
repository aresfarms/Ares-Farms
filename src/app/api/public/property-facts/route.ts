import { NextRequest, NextResponse } from "next/server";

import { verifyPropertyPrograms } from "@/lib/capital-graph/programVerification";
import { sfhaForProperty, historicForProperty } from "@/lib/property/propertyFloodHistoric";
import { verifyImportedPropertyAddress } from "@/lib/property/importedPropertyVerification";
import { buildLocationBriefIntelligence } from "@/lib/property/propertyBriefIntelligence";
import { designatedHubzoneForProperty } from "@/lib/property/propertyHubzones";
import { nmtcForProperty } from "@/lib/property/propertyNmtc";
import { designatedOzForProperty } from "@/lib/property/propertyOpportunityZones";
import { findCanonicalPropertyById } from "@/lib/property/propertyData";
import { readJsonBodyWithLimit } from "@/lib/security/requestGuards";

/**
 * Property facts API — PUBLIC, verified snapshot reads only.
 *
 * Used by the property evaluation workspace so the property-driven advisory view
 * can render the same snapshot-backed place-facts and verified program matches
 * as the listing hub, without downgrading into illustrative language.
 */
export async function POST(req: NextRequest) {
  const parsed = await readJsonBodyWithLimit<{
    propertyId?: string | null;
    exactAddress?: string | null;
    location?: string | null;
    stateCode?: string | null;
    rawInput?: string | null;
    notes?: string | null;
    /** Visitor's "what is this property?" declaration (imported addresses
        carry no type; the owner knows — founder-caught 2026-07-18). */
    declaredPropertyType?: string | null;
  }>(req, {
    maxBytes: 24 * 1024,
  });
  if (!parsed.ok) {
    return NextResponse.json({ ok: false, error: parsed.error }, { status: parsed.status });
  }

  const body = parsed.body;
  const propertyId = body.propertyId ? String(body.propertyId) : null;
  // Allowlisted profile ids only — never free text into the classifier.
  const DECLARABLE = new Set(["residential", "farm", "commercial", "hospitality", "mobile-home-park", "land"]);
  const declaredPropertyType =
    body.declaredPropertyType && DECLARABLE.has(String(body.declaredPropertyType))
      ? String(body.declaredPropertyType)
      : null;

  if (propertyId?.startsWith("imported:") || (!propertyId && (body.exactAddress || body.location))) {
    const imported = await verifyImportedPropertyAddress({
      propertyId: propertyId ?? "imported:place-facts",
      exactAddress: body.exactAddress ?? null,
      location: body.location ?? null,
      stateCode: body.stateCode ?? null,
      rawInput: body.rawInput ?? null,
      notes: body.notes ?? null,
    });
    // Same living-here Place Brief a map-selected property gets, resolved from
    // the geocode: county/FMR/schools by county FIPS, OZ/NMTC/flood/historic
    // from the live verification, amenities via the gated live lookup.
    const placeIntelligence = await buildLocationBriefIntelligence({
      geocode: imported.geocode,
      placeFacts: imported.placeFacts,
      parsed: imported.parsedAddress,
      propertyType: declaredPropertyType,
    });
    return NextResponse.json({
      ok: true,
      propertyId,
      placeFacts: imported.placeFacts,
      verifiedPrograms: verifyPropertyPrograms(imported.placeFactsForPrograms),
      placeIntelligence,
      verification: {
        status: imported.status,
        normalizedAddress: imported.normalizedAddress,
        parsedAddress: imported.parsedAddress,
        restrictions: imported.restrictions,
        warnings: imported.warnings,
        liveChecks: imported.liveChecks,
        lookupOutcomes: imported.lookupOutcomes,
      },
    });
  }

  if (!propertyId) {
    return NextResponse.json(
      { ok: false, error: "propertyId or a verifiable address/location is required." },
      { status: 400 }
    );
  }

  const oz = designatedOzForProperty(propertyId);
  const hubzone = designatedHubzoneForProperty(propertyId);
  const flood = sfhaForProperty(propertyId);
  const historic = historicForProperty(propertyId);
  const nmtc = nmtcForProperty(propertyId);
  const verifiedPrograms = verifyPropertyPrograms({
    propertyId,
    ozTractId: oz?.tractId ?? null,
    ozAsOf: oz?.asOf ?? null,
    hubzone: hubzone
      ? {
        hubzoneType: hubzone.hubzoneType,
        geoid: hubzone.geoid,
        effective: hubzone.effective,
        expiration: hubzone.expiration,
        isCurrent: hubzone.isCurrent,
      }
      : null,
    hubzoneAsOf: hubzone?.asOf ?? null,
  });
  const property = findCanonicalPropertyById(propertyId);
  const sourceRecord = property?.source_records[0] ?? null;

  return NextResponse.json({
    ok: true,
    propertyId,
    propertyRecord: sourceRecord
      ? {
          exactAddress: sourceRecord.exactAddress,
          zip: sourceRecord.zip,
          rawPropertyStyle: sourceRecord.rawPropertyStyle,
          bedrooms: sourceRecord.bedrooms,
          yearBuilt: sourceRecord.yearBuilt,
          squareFeet: sourceRecord.squareFeet,
          acreageText: sourceRecord.acreageText,
          listingId: sourceRecord.listingId,
          listingStatus: property?.listing_status ?? null,
        }
      : null,
    placeFacts: {
      opportunityZone: oz,
      hubzone,
      flood,
      historic,
      nmtc,
    },
    verifiedPrograms,
  });
}
