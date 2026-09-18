/**
 * treasuryGenerated — GENERATED FILE. Do not edit by hand.
 *
 * SERVER-ONLY: U.S. Treasury (TEOAF) seized real-property AUCTION listings,
 * parsed from the official treasury.gov page (public domain). PENDING Module
 * 22/23 — not shown until a human approves it (sourceActivation.ts).
 *
 * Written by src/scripts/ingestTreasuryRealProperty.ts. Re-run `npm run ingest:treasury`.
 * Ingested at: 2026-07-17T16:15:58.006Z
 */

import type { CanonicalProperty } from "./propertyTypes";

export const TREASURY_INGEST_PROVENANCE = {
  "fetchedAt": "2026-07-17T16:15:58.006Z",
  "feedUrl": "https://www.treasury.gov/auctions/treasury/rp/realprop.shtml",
  "listed": 11,
  "current": 11,
  "license": "Public domain (U.S. Government work) — U.S. Treasury TEOAF",
  "scraperVersion": "treasury-rp-ingest-v0.1.0"
} as const;

export const TREASURY_PROPERTIES: CanonicalProperty[] = [
  {
    "canonical_property_id": "treasury-26-66-876",
    "source_records": [
      {
        "sourceId": "treasury",
        "listingId": "26-66-876",
        "listingDate": null,
        "auctionDate": "2026-07-24",
        "state": "GA",
        "county": "Unknown",
        "town": "Lawrenceville",
        "propertyType": "home",
        "rawPropertyStyle": "SINGLE FAMILY HOME",
        "exactAddress": "1925 Severbrook Place",
        "zip": "30043",
        "price": null,
        "bedrooms": null,
        "yearBuilt": null,
        "squareFeet": null,
        "acreageText": null,
        "program": null,
        "description": "3,556 +/- sq. ft. home with 5 bedrooms, 4 baths, 2nd floor loft, study, deck, and 3-car garage. \n Basement includes 2 additional bedrooms, bath, media and rec room. · Online auction: Friday, July 24, 2026 · Sale #26-66-876",
        "photoFile": null,
        "listingUrl": "https://www.treasury.gov/auctions/treasury/rp/realprop.shtml",
        "isCurrent": true,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "treasury",
        "source_url": "https://www.treasury.gov/auctions/treasury/rp/realprop.shtml",
        "fetched_at": "2026-07-17T16:15:58.006Z",
        "content_hash": "d0530ea9e46142d483134f45f9dd1c8b0792f3f53a2a3256147964f03ae3c986"
      }
    ],
    "listing_status": "AUCTION",
    "listing_history": [
      "Treasury TEOAF auctions 2026-07-17"
    ],
    "confidence_score": 80,
    "source_id": "treasury",
    "source_name": "U.S. Treasury — Seized Real Property Auctions (TEOAF)",
    "source_url": "https://www.treasury.gov/auctions/treasury/rp/realprop.shtml",
    "fetched_at": "2026-07-17T16:15:58.006Z",
    "content_hash": "d0530ea9e46142d483134f45f9dd1c8b0792f3f53a2a3256147964f03ae3c986",
    "classification_level": "PUBLIC",
    "replay_ref": "treasury-26-66-876",
    "connector_id": "treasury-rp-connector",
    "jurisdiction_scope": "federal",
    "scraper_version": "treasury-rp-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "treasury-26-66-885",
    "source_records": [
      {
        "sourceId": "treasury",
        "listingId": "26-66-885",
        "listingDate": null,
        "auctionDate": "2026-08-20",
        "state": "GA",
        "county": "Unknown",
        "town": "Atlanta",
        "propertyType": "home",
        "rawPropertyStyle": "SINGLE FAMILY HOME",
        "exactAddress": "5645 Whitner Drive",
        "zip": "30327",
        "price": null,
        "bedrooms": null,
        "yearBuilt": null,
        "squareFeet": null,
        "acreageText": null,
        "program": null,
        "description": "7,012 +/- sq. ft. home with 4 bedrooms, 4.1 baths, loft, fireplaces, and attached 3 and 1-car garages. \n Property has unfinished basement and in-ground pool with deck and patio. · Online auction: Thursday, August 20, 2026 · Sale #26-66-885",
        "photoFile": null,
        "listingUrl": "https://www.treasury.gov/auctions/treasury/rp/realprop.shtml",
        "isCurrent": true,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "treasury",
        "source_url": "https://www.treasury.gov/auctions/treasury/rp/realprop.shtml",
        "fetched_at": "2026-07-17T16:15:58.006Z",
        "content_hash": "5721ff52da6c16d34eaa8f6aba6bdd1d97d93bd6d4ea9f3cd0e5b8a7a0f153db"
      }
    ],
    "listing_status": "AUCTION",
    "listing_history": [
      "Treasury TEOAF auctions 2026-07-17"
    ],
    "confidence_score": 80,
    "source_id": "treasury",
    "source_name": "U.S. Treasury — Seized Real Property Auctions (TEOAF)",
    "source_url": "https://www.treasury.gov/auctions/treasury/rp/realprop.shtml",
    "fetched_at": "2026-07-17T16:15:58.006Z",
    "content_hash": "5721ff52da6c16d34eaa8f6aba6bdd1d97d93bd6d4ea9f3cd0e5b8a7a0f153db",
    "classification_level": "PUBLIC",
    "replay_ref": "treasury-26-66-885",
    "connector_id": "treasury-rp-connector",
    "jurisdiction_scope": "federal",
    "scraper_version": "treasury-rp-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "treasury-26-66-842",
    "source_records": [
      {
        "sourceId": "treasury",
        "listingId": "26-66-842",
        "listingDate": null,
        "auctionDate": "2026-08-13",
        "state": "KS",
        "county": "Unknown",
        "town": "Overland Park",
        "propertyType": "home",
        "rawPropertyStyle": "SINGLE FAMILY HOME",
        "exactAddress": "6909 W. 129th Court",
        "zip": "66209",
        "price": null,
        "bedrooms": null,
        "yearBuilt": null,
        "squareFeet": null,
        "acreageText": null,
        "program": null,
        "description": "2,531 +/- sq. ft. home with 3 bedrooms, 3 baths, hearth room, fireplaces, and attached 2-car garage. \n Property has an unfinished basement on a cul-de-sac lot in Deer Creek Courts. · Online auction: Thursday, August 13, 2026 · Sale #26-66-842",
        "photoFile": null,
        "listingUrl": "https://www.treasury.gov/auctions/treasury/rp/realprop.shtml",
        "isCurrent": true,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "treasury",
        "source_url": "https://www.treasury.gov/auctions/treasury/rp/realprop.shtml",
        "fetched_at": "2026-07-17T16:15:58.006Z",
        "content_hash": "42d815c5f5b5d61f66afa3d55c4973c1928ac25e8950f012acf09b8fac12f2c8"
      }
    ],
    "listing_status": "AUCTION",
    "listing_history": [
      "Treasury TEOAF auctions 2026-07-17"
    ],
    "confidence_score": 80,
    "source_id": "treasury",
    "source_name": "U.S. Treasury — Seized Real Property Auctions (TEOAF)",
    "source_url": "https://www.treasury.gov/auctions/treasury/rp/realprop.shtml",
    "fetched_at": "2026-07-17T16:15:58.006Z",
    "content_hash": "42d815c5f5b5d61f66afa3d55c4973c1928ac25e8950f012acf09b8fac12f2c8",
    "classification_level": "PUBLIC",
    "replay_ref": "treasury-26-66-842",
    "connector_id": "treasury-rp-connector",
    "jurisdiction_scope": "federal",
    "scraper_version": "treasury-rp-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "treasury-26-66-882",
    "source_records": [
      {
        "sourceId": "treasury",
        "listingId": "26-66-882",
        "listingDate": null,
        "auctionDate": "2026-08-12",
        "state": "MS",
        "county": "Unknown",
        "town": "Olive Branch",
        "propertyType": "home",
        "rawPropertyStyle": "SINGLE FAMILY HOME",
        "exactAddress": "4615 Forest Hill Road S",
        "zip": "38654",
        "price": null,
        "bedrooms": null,
        "yearBuilt": null,
        "squareFeet": null,
        "acreageText": null,
        "program": null,
        "description": "3,522 +/- sq. ft. home with 5 bedrooms, 3 baths, 2nd floor rec room, balcony, and attached 2-car garage. \n Walk-out basement includes additional bed, bath, and kitchen on +/- 2.2 acres. · Online auction: Wednesday, August 12, 2026 · Sale #26-66-882",
        "photoFile": null,
        "listingUrl": "https://www.treasury.gov/auctions/treasury/rp/realprop.shtml",
        "isCurrent": true,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "treasury",
        "source_url": "https://www.treasury.gov/auctions/treasury/rp/realprop.shtml",
        "fetched_at": "2026-07-17T16:15:58.006Z",
        "content_hash": "e708b11aa605baf9db1e203372d7a5fc7945ff68a6b3c7fb03642a8395c784e4"
      }
    ],
    "listing_status": "AUCTION",
    "listing_history": [
      "Treasury TEOAF auctions 2026-07-17"
    ],
    "confidence_score": 80,
    "source_id": "treasury",
    "source_name": "U.S. Treasury — Seized Real Property Auctions (TEOAF)",
    "source_url": "https://www.treasury.gov/auctions/treasury/rp/realprop.shtml",
    "fetched_at": "2026-07-17T16:15:58.006Z",
    "content_hash": "e708b11aa605baf9db1e203372d7a5fc7945ff68a6b3c7fb03642a8395c784e4",
    "classification_level": "PUBLIC",
    "replay_ref": "treasury-26-66-882",
    "connector_id": "treasury-rp-connector",
    "jurisdiction_scope": "federal",
    "scraper_version": "treasury-rp-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "treasury-26-66-855",
    "source_records": [
      {
        "sourceId": "treasury",
        "listingId": "26-66-855",
        "listingDate": null,
        "auctionDate": "2026-07-22",
        "state": "NC",
        "county": "Unknown",
        "town": "Merry Hill",
        "propertyType": "commercial",
        "rawPropertyStyle": "COMMERCIAL PROPERTY",
        "exactAddress": "2135 US 17 North",
        "zip": "27957",
        "price": null,
        "bedrooms": null,
        "yearBuilt": null,
        "squareFeet": null,
        "acreageText": null,
        "program": null,
        "description": "2,574 +/- sq. ft. vacant motel with 7 guest rooms, covered front patio, and parking lot. Includes \n a lobby and owner's residential unit. Located on 1.01 +/- acres. · Online auction: Wednesday, July 22, 2026 · Sale #26-66-855",
        "photoFile": null,
        "listingUrl": "https://www.treasury.gov/auctions/treasury/rp/realprop.shtml",
        "isCurrent": true,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "treasury",
        "source_url": "https://www.treasury.gov/auctions/treasury/rp/realprop.shtml",
        "fetched_at": "2026-07-17T16:15:58.006Z",
        "content_hash": "aa079d5549ef8cd60542a341a2e11cff238380ae94f0572220caacd266d95014"
      }
    ],
    "listing_status": "AUCTION",
    "listing_history": [
      "Treasury TEOAF auctions 2026-07-17"
    ],
    "confidence_score": 80,
    "source_id": "treasury",
    "source_name": "U.S. Treasury — Seized Real Property Auctions (TEOAF)",
    "source_url": "https://www.treasury.gov/auctions/treasury/rp/realprop.shtml",
    "fetched_at": "2026-07-17T16:15:58.006Z",
    "content_hash": "aa079d5549ef8cd60542a341a2e11cff238380ae94f0572220caacd266d95014",
    "classification_level": "PUBLIC",
    "replay_ref": "treasury-26-66-855",
    "connector_id": "treasury-rp-connector",
    "jurisdiction_scope": "federal",
    "scraper_version": "treasury-rp-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "treasury-26-66-867",
    "source_records": [
      {
        "sourceId": "treasury",
        "listingId": "26-66-867",
        "listingDate": null,
        "auctionDate": "2026-08-26",
        "state": "NJ",
        "county": "Unknown",
        "town": "Franklin Lakes",
        "propertyType": "home",
        "rawPropertyStyle": "ESTATE HOME",
        "exactAddress": "21 Shinnecock Trail",
        "zip": "07417",
        "price": null,
        "bedrooms": null,
        "yearBuilt": null,
        "squareFeet": null,
        "acreageText": null,
        "program": null,
        "description": "12,023 +/- sq. ft. estate home with 5 bedrooms, 5.3 baths, indoor pool, and attached 3-car garage. \n Located on 3.58 +/- acres with reservoir and mountain views. · Online auction: Wednesday, August 26, 2026 · Sale #26-66-867",
        "photoFile": null,
        "listingUrl": "https://www.treasury.gov/auctions/treasury/rp/realprop.shtml",
        "isCurrent": true,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "treasury",
        "source_url": "https://www.treasury.gov/auctions/treasury/rp/realprop.shtml",
        "fetched_at": "2026-07-17T16:15:58.006Z",
        "content_hash": "dbf1a31cea249b6721df82e6d682a34da57be3077f08d06f6029e5f2c837bec0"
      }
    ],
    "listing_status": "AUCTION",
    "listing_history": [
      "Treasury TEOAF auctions 2026-07-17"
    ],
    "confidence_score": 80,
    "source_id": "treasury",
    "source_name": "U.S. Treasury — Seized Real Property Auctions (TEOAF)",
    "source_url": "https://www.treasury.gov/auctions/treasury/rp/realprop.shtml",
    "fetched_at": "2026-07-17T16:15:58.006Z",
    "content_hash": "dbf1a31cea249b6721df82e6d682a34da57be3077f08d06f6029e5f2c837bec0",
    "classification_level": "PUBLIC",
    "replay_ref": "treasury-26-66-867",
    "connector_id": "treasury-rp-connector",
    "jurisdiction_scope": "federal",
    "scraper_version": "treasury-rp-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "treasury-26-66-195",
    "source_records": [
      {
        "sourceId": "treasury",
        "listingId": "26-66-195",
        "listingDate": null,
        "auctionDate": "2026-08-21",
        "state": "OH",
        "county": "Unknown",
        "town": "Valley City",
        "propertyType": "home",
        "rawPropertyStyle": "SINGLE FAMILY HOME",
        "exactAddress": "2281 Marks Road",
        "zip": "44280",
        "price": null,
        "bedrooms": null,
        "yearBuilt": null,
        "squareFeet": null,
        "acreageText": null,
        "program": null,
        "description": "4,458 +/- sq. ft. home with 4 bedrooms, 3.1 baths, loft, decks, and attached 3-car garage. \n Located on 9.5 +/- acres with in-ground swimming pool and pond. · Online auction: Friday, August 21, 2026 · Sale #26-66-195",
        "photoFile": null,
        "listingUrl": "https://www.treasury.gov/auctions/treasury/rp/realprop.shtml",
        "isCurrent": true,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "treasury",
        "source_url": "https://www.treasury.gov/auctions/treasury/rp/realprop.shtml",
        "fetched_at": "2026-07-17T16:15:58.006Z",
        "content_hash": "ba94766d1dd0206ef57a226d2d1c82f72b2b674dc55d902978702e35c85b75bf"
      }
    ],
    "listing_status": "AUCTION",
    "listing_history": [
      "Treasury TEOAF auctions 2026-07-17"
    ],
    "confidence_score": 80,
    "source_id": "treasury",
    "source_name": "U.S. Treasury — Seized Real Property Auctions (TEOAF)",
    "source_url": "https://www.treasury.gov/auctions/treasury/rp/realprop.shtml",
    "fetched_at": "2026-07-17T16:15:58.006Z",
    "content_hash": "ba94766d1dd0206ef57a226d2d1c82f72b2b674dc55d902978702e35c85b75bf",
    "classification_level": "PUBLIC",
    "replay_ref": "treasury-26-66-195",
    "connector_id": "treasury-rp-connector",
    "jurisdiction_scope": "federal",
    "scraper_version": "treasury-rp-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "treasury-26-66-190",
    "source_records": [
      {
        "sourceId": "treasury",
        "listingId": "26-66-190",
        "listingDate": null,
        "auctionDate": "2026-07-15",
        "state": "PR",
        "county": "Unknown",
        "town": "San Juan",
        "propertyType": "home",
        "rawPropertyStyle": "SINGLE FAMILY HOME",
        "exactAddress": "326-B & C Calle 28",
        "zip": "00924",
        "price": null,
        "bedrooms": null,
        "yearBuilt": null,
        "squareFeet": null,
        "acreageText": null,
        "program": null,
        "description": "958 +/- sq. ft. home with 2 bedrooms, 1 bath, and balcony sitting atop a 2-car carport. Property includes \n a 1,521 +/- sq. ft 1-level home with 4 bedrooms, 2 baths, and covered patio. · Online auction: Wednesday, July 15, 2026 · Sale #26-66-190",
        "photoFile": null,
        "listingUrl": "https://www.treasury.gov/auctions/treasury/rp/realprop.shtml",
        "isCurrent": false,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "treasury",
        "source_url": "https://www.treasury.gov/auctions/treasury/rp/realprop.shtml",
        "fetched_at": "2026-07-17T16:15:58.006Z",
        "content_hash": "02bc765f930033b71f91af0eafa191f605b87efa7402bb5718a972b17daa6186"
      }
    ],
    "listing_status": "AUCTION",
    "listing_history": [
      "Treasury TEOAF auctions 2026-07-17"
    ],
    "confidence_score": 80,
    "source_id": "treasury",
    "source_name": "U.S. Treasury — Seized Real Property Auctions (TEOAF)",
    "source_url": "https://www.treasury.gov/auctions/treasury/rp/realprop.shtml",
    "fetched_at": "2026-07-17T16:15:58.006Z",
    "content_hash": "02bc765f930033b71f91af0eafa191f605b87efa7402bb5718a972b17daa6186",
    "classification_level": "PUBLIC",
    "replay_ref": "treasury-26-66-190",
    "connector_id": "treasury-rp-connector",
    "jurisdiction_scope": "federal",
    "scraper_version": "treasury-rp-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "treasury-26-66-189",
    "source_records": [
      {
        "sourceId": "treasury",
        "listingId": "26-66-189",
        "listingDate": null,
        "auctionDate": "2026-07-17",
        "state": "TX",
        "county": "Unknown",
        "town": "Bruni",
        "propertyType": "commercial",
        "rawPropertyStyle": "COMMERCIAL BUILDING",
        "exactAddress": "112 North Avenue E",
        "zip": "78344",
        "price": null,
        "bedrooms": null,
        "yearBuilt": null,
        "squareFeet": null,
        "acreageText": null,
        "program": null,
        "description": "2,800 +/- sq. ft. vacant metal commercial building on a 7,526 +/- sq. ft. lot in Webb County. \n Property is unzoned and has water and electric. · Online auction: Friday, July 17, 2026 · Sale #26-66-189",
        "photoFile": null,
        "listingUrl": "https://www.treasury.gov/auctions/treasury/rp/realprop.shtml",
        "isCurrent": true,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "treasury",
        "source_url": "https://www.treasury.gov/auctions/treasury/rp/realprop.shtml",
        "fetched_at": "2026-07-17T16:15:58.006Z",
        "content_hash": "a070fb7e3d6f68ad4bc784535f3a91cdee968b2175f0dabf677669e002e12b14"
      }
    ],
    "listing_status": "AUCTION",
    "listing_history": [
      "Treasury TEOAF auctions 2026-07-17"
    ],
    "confidence_score": 80,
    "source_id": "treasury",
    "source_name": "U.S. Treasury — Seized Real Property Auctions (TEOAF)",
    "source_url": "https://www.treasury.gov/auctions/treasury/rp/realprop.shtml",
    "fetched_at": "2026-07-17T16:15:58.006Z",
    "content_hash": "a070fb7e3d6f68ad4bc784535f3a91cdee968b2175f0dabf677669e002e12b14",
    "classification_level": "PUBLIC",
    "replay_ref": "treasury-26-66-189",
    "connector_id": "treasury-rp-connector",
    "jurisdiction_scope": "federal",
    "scraper_version": "treasury-rp-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "treasury-26-66-196",
    "source_records": [
      {
        "sourceId": "treasury",
        "listingId": "26-66-196",
        "listingDate": null,
        "auctionDate": "2026-07-31",
        "state": "TX",
        "county": "Unknown",
        "town": "Rusk",
        "propertyType": "home",
        "rawPropertyStyle": "LAND WITH DWELLINGS",
        "exactAddress": "445 County Road 1316",
        "zip": "75785",
        "price": null,
        "bedrooms": null,
        "yearBuilt": null,
        "squareFeet": null,
        "acreageText": null,
        "program": null,
        "description": "4.20 +/- acres of rural land with dwellings, barn, shed, and gated driveway near Davy Crockett \n National Forest. The property has electric and water available. · Online auction: Friday, July 31, 2026 · Sale #26-66-196",
        "photoFile": null,
        "listingUrl": "https://www.treasury.gov/auctions/treasury/rp/realprop.shtml",
        "isCurrent": true,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "treasury",
        "source_url": "https://www.treasury.gov/auctions/treasury/rp/realprop.shtml",
        "fetched_at": "2026-07-17T16:15:58.006Z",
        "content_hash": "843a6a899e01c10422123a46af747f020b3a387b757311ecc772ce1d985d9876"
      }
    ],
    "listing_status": "AUCTION",
    "listing_history": [
      "Treasury TEOAF auctions 2026-07-17"
    ],
    "confidence_score": 80,
    "source_id": "treasury",
    "source_name": "U.S. Treasury — Seized Real Property Auctions (TEOAF)",
    "source_url": "https://www.treasury.gov/auctions/treasury/rp/realprop.shtml",
    "fetched_at": "2026-07-17T16:15:58.006Z",
    "content_hash": "843a6a899e01c10422123a46af747f020b3a387b757311ecc772ce1d985d9876",
    "classification_level": "PUBLIC",
    "replay_ref": "treasury-26-66-196",
    "connector_id": "treasury-rp-connector",
    "jurisdiction_scope": "federal",
    "scraper_version": "treasury-rp-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "treasury-26-66-874",
    "source_records": [
      {
        "sourceId": "treasury",
        "listingId": "26-66-874",
        "listingDate": null,
        "auctionDate": "2026-08-06",
        "state": "TX",
        "county": "Unknown",
        "town": "Sherman",
        "propertyType": "other",
        "rawPropertyStyle": "ESTATE PROPERTY",
        "exactAddress": "177 Angel Ridge Lane",
        "zip": "75090",
        "price": null,
        "bedrooms": null,
        "yearBuilt": null,
        "squareFeet": null,
        "acreageText": null,
        "program": null,
        "description": "44.38 +/- acres of land with 2 residential structures with over 11,000 +/- sq. ft., theater, gym, tennis court, \n outbuildings, and indoor and outdoor pool. Potential commercial/residential uses. · Online auction: Thursday, August 6, 2026 · Sale #26-66-874",
        "photoFile": null,
        "listingUrl": "https://www.treasury.gov/auctions/treasury/rp/realprop.shtml",
        "isCurrent": true,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "treasury",
        "source_url": "https://www.treasury.gov/auctions/treasury/rp/realprop.shtml",
        "fetched_at": "2026-07-17T16:15:58.006Z",
        "content_hash": "6fbb04d54d9b634fd431ee01faa8f8e0df600384e33c6841c7da799d95944076"
      }
    ],
    "listing_status": "AUCTION",
    "listing_history": [
      "Treasury TEOAF auctions 2026-07-17"
    ],
    "confidence_score": 80,
    "source_id": "treasury",
    "source_name": "U.S. Treasury — Seized Real Property Auctions (TEOAF)",
    "source_url": "https://www.treasury.gov/auctions/treasury/rp/realprop.shtml",
    "fetched_at": "2026-07-17T16:15:58.006Z",
    "content_hash": "6fbb04d54d9b634fd431ee01faa8f8e0df600384e33c6841c7da799d95944076",
    "classification_level": "PUBLIC",
    "replay_ref": "treasury-26-66-874",
    "connector_id": "treasury-rp-connector",
    "jurisdiction_scope": "federal",
    "scraper_version": "treasury-rp-ingest-v0.1.0"
  }
];
