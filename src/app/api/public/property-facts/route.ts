import { NextRequest, NextResponse } from "next/server";

import { verifyPropertyPrograms } from "@/lib/capital-graph/programVerification";
import { sfhaForProperty, historicForProperty } from "@/lib/property/propertyFloodHistoric";
import { verifyImportedPropertyAddress } from "@/lib/property/importedPropertyVerification";
import { designatedHubzoneForProperty } from "@/lib/property/propertyHubzones";
import { nmtcForProperty } from "@/lib/property/propertyNmtc";
import { designatedOzForProperty } from "@/lib/property/propertyOpportunityZones";
import { findCanonicalPropertyById } from "@/lib/property/propertyData";

/**
 * Property facts API — PUBLIC, verified snapshot reads only.
 *
 * Used by the property evaluation workspace so the property-driven advisory view
 * can render the same snapshot-backed place-facts and verified program matches
 * as the listing hub, without downgrading into illustrative language.
 */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as {
    propertyId?: string | null;
    exactAddress?: string | null;
    location?: string | null;
    stateCode?: string | null;
    rawInput?: string | null;
    notes?: string | null;
  };
  const propertyId = body.propertyId ? String(body.propertyId) : null;

  if (propertyId?.startsWith("imported:") || (!propertyId && (body.exactAddress || body.location))) {
    const imported = await verifyImportedPropertyAddress({
      propertyId: propertyId ?? "imported:place-facts",
      exactAddress: body.exactAddress ?? null,
      location: body.location ?? null,
      stateCode: body.stateCode ?? null,
      rawInput: body.rawInput ?? null,
      notes: body.notes ?? null,
    });
    return NextResponse.json({
      ok: true,
      propertyId,
      placeFacts: imported.placeFacts,
      verifiedPrograms: imported.verifiedPrograms,
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
