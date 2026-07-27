import { NextRequest, NextResponse } from "next/server";

import { verifyPropertyPrograms } from "@/lib/capital-graph/programVerification";
import { sfhaForProperty, historicForProperty } from "@/lib/property/propertyFloodHistoric";
import { verifyImportedPropertyAddress } from "@/lib/property/importedPropertyVerification";
import { buildLocationBriefIntelligence } from "@/lib/property/propertyBriefIntelligence";
import { designatedHubzoneForProperty } from "@/lib/property/propertyHubzones";
import { nmtcForProperty } from "@/lib/property/propertyNmtc";
import { designatedOzForProperty } from "@/lib/property/propertyOpportunityZones";
import { findCanonicalPropertyByExactAddress, findCanonicalPropertyById } from "@/lib/property/propertyData";
import { readJsonBodyWithLimit } from "@/lib/security/requestGuards";
import { officialPropertyEvidenceRecords } from "@/lib/property/officialPropertySourceAdapters";


function derivedAcreageText(record: { acreageText?: string | null; description?: string | null } | null): string | null {
  if (!record) return null;
  if (record.acreageText?.trim()) return record.acreageText.trim();
  const text = record.description ?? "";
  const acre = text.match(/(?:^|\b)([0-9]+(?:\.[0-9]+)?)\s*(?:\+\/-\s*)?(?:acres?|ac\.?)(?:\b|$)/i);
  if (acre) return `${acre[1]} acres`;
  const lotSqFt = text.match(/(?:lot|land|parcel)[^0-9]{0,20}([0-9][0-9,]*)\s*(?:sq\.?\s*ft\.?|square feet)/i);
  if (lotSqFt) {
    const sqFt = Number(lotSqFt[1].replace(/,/g, ""));
    if (Number.isFinite(sqFt) && sqFt > 0) {
      const acres = sqFt / 43560;
      return `${acres.toFixed(acres < 1 ? 3 : 2)} acres · ${sqFt.toLocaleString("en-US")} sq ft lot`;
    }
  }
  return null;
}

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
    startingLens?: string | null;
    town?: string | null;
    county?: string | null;
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
  const lanePropertyType = declaredPropertyType ??
    (/farm|agric/i.test(String(body.startingLens ?? "")) ? "farm" :
      /commercial|business/i.test(String(body.startingLens ?? "")) ? "commercial" : null);

  if (propertyId?.startsWith("imported:") || (!propertyId && (body.exactAddress || body.location))) {
    const imported = await verifyImportedPropertyAddress({
      propertyId: propertyId ?? "imported:place-facts",
      exactAddress: body.exactAddress ?? null,
      location: body.location ?? null,
      stateCode: body.stateCode ?? null,
      rawInput: body.rawInput ?? null,
      notes: body.notes ?? null,
    });
    const canonicalMatch = imported.normalizedAddress
      ? findCanonicalPropertyByExactAddress(imported.normalizedAddress)
      : null;
    const matchedSourceRecord = canonicalMatch?.source_records[0] ?? null;
    // Same living-here Place Brief a map-selected property gets, resolved from
    // the geocode and the strongest available asset evidence. An exact address
    // match carries its canonical property style into classification; a visitor
    // correction remains secondary and never replaces available parcel facts.
    const placeIntelligence = await buildLocationBriefIntelligence({
      geocode: imported.geocode,
      placeFacts: imported.placeFacts,
      parsed: imported.parsedAddress,
      propertyType: lanePropertyType ?? matchedSourceRecord?.rawPropertyStyle ?? null,
      ownerNotes: body.notes ?? null,
    });
    if (matchedSourceRecord) {
      const sizeBits = [
        matchedSourceRecord.squareFeet ? `${matchedSourceRecord.squareFeet.toLocaleString("en-US")} sq ft` : null,
        derivedAcreageText(matchedSourceRecord),
      ].filter((value): value is string => Boolean(value));
      if (sizeBits.length && !placeIntelligence.verifiedFacts.some((fact) => fact.label === "Size")) {
        placeIntelligence.verifiedFacts.unshift({
          label: "Size",
          value: sizeBits.join(" · "),
          text: `The matched canonical property record publishes ${sizeBits.join(" and ")}. County parcel geometry remains the authority for official dimensions.`,
          provenance: "Source: matched canonical property record",
          tone: "neutral",
        });
      }
    }
    if (canonicalMatch?.parcel_refs?.length) {
      placeIntelligence.verifiedFacts.unshift({
        label: "Associated parcels",
        value: `${canonicalMatch.parcel_refs.length} parcel${canonicalMatch.parcel_refs.length === 1 ? "" : "s"} identified`,
        text: `Furlong matched ${canonicalMatch.parcel_refs.length} county parcel reference${canonicalMatch.parcel_refs.length === 1 ? "" : "s"} to this canonical property. The purchase contract and recorded deed still control which parcels convey.`,
        provenance: "Source: canonical parcel-reference registry",
        tone: "neutral",
      });
    }
    const evidenceRecords = canonicalMatch ? officialPropertyEvidenceRecords(canonicalMatch) : [];
    for (const record of evidenceRecords.filter((item) => item.domain === "title")) {
      placeIntelligence.verifiedFacts.push({
        label: "Recorded deed",
        value: `${record.reference}${record.effectiveDate ? ` · ${record.effectiveDate}` : ""}`,
        text: (record.notes ?? []).filter((note) => !note.startsWith("Restricted deed document reference:")).join(" ") || "A county recorder deed-index record matched this parcel.",
        provenance: `Source: ${record.sourceName}, ${record.jurisdiction}, retrieved ${record.retrievedAt}`,
        tone: record.parcelMatchConfidence === "review-required" ? "caution" : "neutral",
      });
    }
    return NextResponse.json({
      ok: true,
      propertyId: canonicalMatch?.canonical_property_id ?? propertyId,
      canonicalMatch: canonicalMatch
        ? { propertyId: canonicalMatch.canonical_property_id, matchedBy: "normalized-exact-address" }
        : null,
      propertyRecord: matchedSourceRecord
        ? {
            exactAddress: matchedSourceRecord.exactAddress,
            zip: matchedSourceRecord.zip,
            rawPropertyStyle: matchedSourceRecord.rawPropertyStyle,
            propertyType: matchedSourceRecord.propertyType,
            price: matchedSourceRecord.price,
            county: matchedSourceRecord.county,
            town: matchedSourceRecord.town,
            state: matchedSourceRecord.state,
            description: matchedSourceRecord.description,
            parcelRefs: canonicalMatch?.parcel_refs ?? [],
            bedrooms: matchedSourceRecord.bedrooms,
            yearBuilt: matchedSourceRecord.yearBuilt,
            squareFeet: matchedSourceRecord.squareFeet,
            acreageText: derivedAcreageText(matchedSourceRecord),
            listingId: matchedSourceRecord.listingId,
            listingStatus: canonicalMatch?.listing_status ?? null,
            recordBasis: "matched-approved-source-record",
          }
        : imported.normalizedAddress
          ? {
              exactAddress: imported.normalizedAddress,
              zip: imported.parsedAddress?.zip || null,
              rawPropertyStyle: lanePropertyType === "farm" ? "Farm / agricultural property" : lanePropertyType === "commercial" ? "Commercial property" : "Verified property address",
              propertyType: lanePropertyType,
              price: null,
              county: body.county ?? null,
              town: body.town ?? imported.parsedAddress?.city ?? null,
              state: imported.parsedAddress?.state ?? body.stateCode ?? null,
              description: "Address verified through the public property-facts intake. Parcel-level attributes appear when an approved jurisdiction record is available.",
              parcelRefs: [],
              bedrooms: null,
              yearBuilt: null,
              squareFeet: null,
              acreageText: null,
              listingId: null,
              listingStatus: "Address verified · no governed listing match",
              recordBasis: "verified-address-only",
            }
          : null,
      placeFacts: imported.placeFacts,
      verifiedPrograms: verifyPropertyPrograms(imported.placeFactsForPrograms),
      placeIntelligence,
      propertyEvidenceRecords: evidenceRecords,
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
  const propertyEvidenceRecords = property ? officialPropertyEvidenceRecords(property) : [];

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
          acreageText: derivedAcreageText(sourceRecord),
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
    propertyEvidenceRecords: [],
  });
}
