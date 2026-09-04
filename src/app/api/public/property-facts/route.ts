import { NextRequest, NextResponse } from "next/server";

import { verifyPropertyPrograms } from "@/lib/capital-graph/programVerification";
import { sfhaForProperty, historicForProperty } from "@/lib/property/propertyFloodHistoric";
import { verifyImportedPropertyAddress } from "@/lib/property/importedPropertyVerification";
import { buildLocationBriefIntelligence, startEnvironmentalLookups } from "@/lib/property/propertyBriefIntelligence";
import { designatedHubzoneForProperty } from "@/lib/property/propertyHubzones";
import { nmtcForProperty } from "@/lib/property/propertyNmtc";
import { designatedOzForProperty } from "@/lib/property/propertyOpportunityZones";
import { findCanonicalPropertyByExactAddress, findCanonicalPropertyById } from "@/lib/property/propertyData";
import { readJsonBodyWithLimit } from "@/lib/security/requestGuards";
import { indicateMarketValue } from "@/lib/property/marketValueIndication";
import { officialPropertyEvidenceRecords } from "@/lib/property/officialPropertySourceAdapters";
import { resolveJurisdictionParcel } from "@/lib/property/jurisdictionParcelResolver";
import { findGovernedListingSnapshot } from "@/lib/property/governedListingSnapshot";


/**
 * Short-TTL in-process response cache for the imported-address flow (Tier 3b).
 * The address-check surface prefetches this route the moment an address
 * verifies; the workspace request that follows seconds later — including
 * across a full document navigation — lands on the warm entry instead of
 * re-running geocoding, parcel resolution, and place intelligence.
 * Deterministic inputs → identical payload inside the TTL, so replay safety
 * is unchanged; snapshot-backed sources make a 2-minute window honest.
 */
// 10 minutes: place facts are snapshot/dated anyway, and a visitor's
// back-and-forth (tabs, type correction, PDF) should never re-pay the
// full federal round-trip (founder-reported slowness 2026-07-29).
// One hour: every fact here is public data that changes on quarterly-to-annual
// cadences — a longer window just spares repeat visitors the cold rebuild
// (founder-reported lag 2026-07-29; was 10 minutes).
const FACTS_CACHE_TTL_MS = 60 * 60_000;
const FACTS_CACHE_MAX_ENTRIES = 50;
const factsCache = new Map<string, { at: number; payload: unknown }>();

function factsCacheGet(key: string): unknown | null {
  const entry = factsCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.at >= FACTS_CACHE_TTL_MS) {
    factsCache.delete(key);
    return null;
  }
  return entry.payload;
}

function factsCacheSet(key: string, payload: unknown): void {
  factsCache.set(key, { at: Date.now(), payload });
  if (factsCache.size > FACTS_CACHE_MAX_ENTRIES) {
    const oldest = factsCache.keys().next().value;
    if (oldest !== undefined) factsCache.delete(oldest);
  }
}

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
    const factsCacheKey = JSON.stringify([
      propertyId, body.exactAddress ?? null, body.location ?? null, body.stateCode ?? null,
      body.town ?? null, body.county ?? null, body.rawInput ?? null, body.notes ?? null,
      body.startingLens ?? null, declaredPropertyType,
    ]);
    const cached = factsCacheGet(factsCacheKey);
    if (cached) return NextResponse.json(cached);
    // The environmental bundle (soils/climate/solar/wetlands/EPA/amenities)
    // needs only the coordinate — start it the moment the geocode resolves so
    // it runs CONCURRENTLY with the federal checks instead of after them
    // (founder-reported lag 2026-07-29: the two ~12s phases were serial).
    let envPrefetch: ReturnType<typeof startEnvironmentalLookups> | null = null;
    const imported = await verifyImportedPropertyAddress({
      propertyId: propertyId ?? "imported:place-facts",
      exactAddress: body.exactAddress ?? null,
      location: body.location ?? null,
      stateCode: body.stateCode ?? null,
      rawInput: body.rawInput ?? null,
      notes: body.notes ?? null,
      onGeocode: (g) => {
        const lat = g?.lat ? Number(g.lat) : NaN;
        const lon = g?.lon ? Number(g.lon) : NaN;
        if (Number.isFinite(lat) && Number.isFinite(lon)) {
          envPrefetch = startEnvironmentalLookups(lat, lon);
        }
      },
    });
    const canonicalMatch = imported.normalizedAddress
      ? findCanonicalPropertyByExactAddress(imported.normalizedAddress)
      : null;
    const matchedSourceRecord = canonicalMatch?.source_records[0] ?? null;
    const listingSnapshot = findGovernedListingSnapshot(imported.normalizedAddress);
    // The county parcel resolver and the Place Brief are independent — run
    // them CONCURRENTLY (founder-reported slowness 2026-07-29: the parcel
    // service was serially blocking the whole intelligence build).
    const jurisdictionParcelPromise = imported.parsedAddress
      ? resolveJurisdictionParcel({
          street: imported.parsedAddress.street,
          city: imported.parsedAddress.city,
          state: imported.parsedAddress.state,
          zip: imported.parsedAddress.zip || null,
          parcelId: listingSnapshot?.parcelId ?? null,
          lat: imported.geocode?.lat ?? null,
          lon: imported.geocode?.lon ?? null,
        }).catch(() => null)
      : Promise.resolve(null);
    // Same living-here Place Brief a map-selected property gets, resolved from
    // the geocode and the strongest available asset evidence. An exact address
    // match carries its canonical property style into classification; a visitor
    // correction remains secondary and never replaces available parcel facts.
    const [jurisdictionParcel, placeIntelligence] = await Promise.all([
      jurisdictionParcelPromise,
      buildLocationBriefIntelligence({
        geocode: imported.geocode,
        placeFacts: imported.placeFacts,
        parsed: imported.parsedAddress,
        propertyType: lanePropertyType ?? matchedSourceRecord?.rawPropertyStyle ?? null,
        ownerNotes: body.notes ?? null,
        envPrefetch,
      }),
    ]);
    if (matchedSourceRecord || jurisdictionParcel || listingSnapshot) {
      const sizeBits = [
        matchedSourceRecord?.squareFeet ? `${matchedSourceRecord.squareFeet.toLocaleString("en-US")} sq ft` : jurisdictionParcel?.squareFeet ? `${jurisdictionParcel.squareFeet.toLocaleString("en-US")} sq ft` : null,
        listingSnapshot?.offeredAcreage ? `${listingSnapshot.offeredAcreage.toLocaleString("en-US")} acres offered` : derivedAcreageText(matchedSourceRecord) ?? jurisdictionParcel?.acreageText ?? null,
      ].filter((value): value is string => Boolean(value));
      // A deed/plat-based land fact (e.g. a curated "Land, lots, and
      // tax-parcel profile" carrying the RECORDED area) outranks the GIS
      // geometry figure — never render both (founder-caught 0.38 vs 0.4091
      // conflict, 2026-07-29: the recorded plat governs).
      if (sizeBits.length && !placeIntelligence.verifiedFacts.some((fact) => /\bsize\b|land area|acreage|land, lots|tax-parcel profile|parcel and conveyance/i.test(fact.label))) {
        placeIntelligence.verifiedFacts.unshift({
          label: "Size",
          value: sizeBits.join(" · "),
          text: `The matched canonical property record publishes ${sizeBits.join(" and ")}. County parcel geometry remains the authority for official dimensions.`,
          provenance: matchedSourceRecord ? "Source: matched canonical property record" : `Source: ${jurisdictionParcel?.sourceName ?? "official jurisdiction parcel source"}`,
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
    const payload = {
      ok: true,
      propertyId: canonicalMatch?.canonical_property_id ?? propertyId,
      canonicalMatch: canonicalMatch
        ? { propertyId: canonicalMatch.canonical_property_id, matchedBy: "normalized-exact-address" }
        : null,
      propertyRecord: matchedSourceRecord || jurisdictionParcel || listingSnapshot
        ? {
            exactAddress: matchedSourceRecord?.exactAddress ?? imported.normalizedAddress,
            zip: matchedSourceRecord?.zip ?? imported.parsedAddress?.zip ?? null,
            rawPropertyStyle: matchedSourceRecord?.rawPropertyStyle ?? listingSnapshot?.propertyType ?? jurisdictionParcel?.landUse ?? (lanePropertyType === "farm" ? "Farm / agricultural property" : lanePropertyType),
            propertyType: matchedSourceRecord?.propertyType ?? listingSnapshot?.propertyType ?? lanePropertyType,
            price: matchedSourceRecord?.price ?? listingSnapshot?.askingPrice ?? null,
            county: matchedSourceRecord?.county ?? body.county ?? null,
            town: matchedSourceRecord?.town ?? body.town ?? imported.parsedAddress?.city ?? null,
            state: matchedSourceRecord?.state ?? imported.parsedAddress?.state ?? body.stateCode ?? null,
            description: matchedSourceRecord?.description ?? listingSnapshot?.description ?? jurisdictionParcel?.legalDescription ?? null,
            parcelRefs: canonicalMatch?.parcel_refs?.length ? canonicalMatch.parcel_refs : jurisdictionParcel?.parcelRefs ?? [],
            bedrooms: matchedSourceRecord?.bedrooms ?? listingSnapshot?.bedrooms ?? null,
            bathrooms: listingSnapshot?.bathrooms ?? null,
            yearBuilt: matchedSourceRecord?.yearBuilt ?? listingSnapshot?.yearBuilt ?? jurisdictionParcel?.yearBuilt ?? null,
            squareFeet: matchedSourceRecord?.squareFeet ?? listingSnapshot?.squareFeet ?? jurisdictionParcel?.squareFeet ?? null,
            acreageText: listingSnapshot?.offeredAcreage ? `${listingSnapshot.offeredAcreage.toLocaleString("en-US")} acres offered across ${listingSnapshot.offeredParcelCount ?? "multiple"} parcels` : derivedAcreageText(matchedSourceRecord) ?? jurisdictionParcel?.acreageText ?? null,
            listingId: matchedSourceRecord?.listingId ?? listingSnapshot?.listingId ?? jurisdictionParcel?.accountId ?? null,
            // MARKET STATUS ONLY. Matching a parcel record says nothing about
            // whether the property is for sale, under contract, or sold — it
            // used to fill this field with "Official parcel record matched",
            // which read as a sale status and told the visitor nothing
            // (founder-caught 2026-08-06 on a property already under contract
            // at $2.5M). Null here means "no listing feed covers this address",
            // and the brief must say exactly that.
            listingStatus: canonicalMatch?.listing_status ?? listingSnapshot?.status ?? null,
            recordBasis: matchedSourceRecord ? "matched-approved-source-record" : listingSnapshot ? "matched-governed-listing-and-parcel-record" : "matched-jurisdiction-parcel-record",
            parcelSourceName: jurisdictionParcel?.sourceName ?? null,
            parcelSourceAsOf: jurisdictionParcel?.sourceAsOf ?? null,
            assessmentAsOf: jurisdictionParcel?.assessmentAsOf ?? null,
            parcelSourceUrl: jurisdictionParcel?.sourceUrl ?? null,
            landUse: jurisdictionParcel?.landUse ?? null,
            zoning: jurisdictionParcel?.zoning ?? null,
            deedReference: jurisdictionParcel?.deedReference ?? null,
            legalDescription: jurisdictionParcel?.legalDescription ?? null,
            assessedLandValue: jurisdictionParcel?.assessedLandValue ?? null,
            assessedImprovementValue: jurisdictionParcel?.assessedImprovementValue ?? null,
            assessedTotalValue: jurisdictionParcel?.assessedTotalValue ?? null,
            propertyValueScreen: indicateMarketValue({
              assessedTotalValue: jurisdictionParcel?.assessedTotalValue ?? null,
              assessmentAsOf: jurisdictionParcel?.assessmentAsOf ?? null,
              stateCode: matchedSourceRecord?.state ?? imported.parsedAddress?.state ?? body.stateCode ?? null,
              county: matchedSourceRecord?.county ?? body.county ?? null,
              knownPriceUsd: matchedSourceRecord?.price ?? listingSnapshot?.askingPrice ?? null,
              knownPriceLabel: canonicalMatch?.listing_status ?? listingSnapshot?.status ?? "Asking price",
              propertyType: matchedSourceRecord?.rawPropertyStyle ?? matchedSourceRecord?.propertyType ?? listingSnapshot?.propertyType ?? lanePropertyType,
              landUse: jurisdictionParcel?.landUse ?? null,
              acreage: listingSnapshot?.offeredAcreage ?? null,
              acreageText: listingSnapshot?.offeredAcreage ? `${listingSnapshot.offeredAcreage} acres` : derivedAcreageText(matchedSourceRecord) ?? jurisdictionParcel?.acreageText ?? null,
            }),
            publicWater: jurisdictionParcel?.publicWater ?? null,
            publicSewer: jurisdictionParcel?.publicSewer ?? null,
            waterfront: jurisdictionParcel?.waterfront ?? null,
            resolvedParcelCount: jurisdictionParcel?.resolvedParcelCount ?? 0,
            offeredParcelCount: listingSnapshot?.offeredParcelCount ?? null,
            offeredAcreage: listingSnapshot?.offeredAcreage ?? null,
            listingSourceName: listingSnapshot?.sourceName ?? null,
            listingSourceAsOf: listingSnapshot?.sourceAsOf ?? null,
            listingSourceUrl: listingSnapshot?.sourceUrl ?? null,
            listingAgent: listingSnapshot?.listingAgent ?? null,
            listingBrokerage: listingSnapshot?.listingBrokerage ?? null,
            listingPhone: listingSnapshot?.listingPhone ?? null,
            listingEmail: listingSnapshot?.listingEmail ?? null,
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
              bathrooms: null,
              yearBuilt: null,
              squareFeet: null,
              acreageText: null,
              listingId: null,
              listingStatus: "Address verified · no governed listing match",
              recordBasis: "verified-address-only",
              parcelSourceName: null, parcelSourceAsOf: null, assessmentAsOf: null, parcelSourceUrl: null, landUse: null, zoning: null, deedReference: null, legalDescription: null, assessedLandValue: null, assessedImprovementValue: null, assessedTotalValue: null, propertyValueScreen: null, publicWater: null, publicSewer: null, waterfront: null,
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
    };
    factsCacheSet(factsCacheKey, payload);
    return NextResponse.json(payload);
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
