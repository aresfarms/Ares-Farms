/**
 * treasuryGenerated — GENERATED FILE. Do not edit by hand.
 *
 * SERVER-ONLY: U.S. Treasury (TEOAF) seized real-property AUCTION listings,
 * parsed from the official treasury.gov page (public domain). PENDING Module
 * 22/23 — not shown until a human approves it (sourceActivation.ts).
 *
 * Written by src/scripts/ingestTreasuryRealProperty.ts. Re-run `npm run ingest:treasury`.
 * Ingested at: 2026-06-10T23:40:00.586Z
 */

import type { CanonicalProperty } from "./propertyTypes";

export const TREASURY_INGEST_PROVENANCE = {
  "fetchedAt": "2026-06-10T23:40:00.586Z",
  "feedUrl": "https://www.treasury.gov/auctions/treasury/rp/realprop.shtml",
  "listed": 18,
  "current": 18,
  "license": "Public domain (U.S. Government work) — U.S. Treasury TEOAF",
  "scraperVersion": "treasury-rp-ingest-v0.1.0"
} as const;

export const TREASURY_PROPERTIES: CanonicalProperty[] = [
  {
    "canonical_property_id": "treasury-26-66-877",
    "source_records": [
      {
        "sourceId": "treasury",
        "listingId": "26-66-877",
        "listingDate": null,
        "auctionDate": "2026-07-30",
        "state": "CO",
        "county": "Unknown",
        "town": "Penrose",
        "propertyType": "home",
        "rawPropertyStyle": "SINGLE FAMILY HOME",
        "exactAddress": "1593 Top Notch Trail",
        "zip": "81240",
        "price": null,
        "bedrooms": null,
        "yearBuilt": null,
        "squareFeet": null,
        "acreageText": null,
        "program": null,
        "description": "6,848 +/- sq. ft. home with 4 bedrooms, 4 baths, office, deck, and 3-car garage on 3 +/- acres. \n Basement includes 2 additional bedrooms, bath, media room. · Online auction: Thursday, July 30, 2026 · Sale #26-66-877",
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
        "fetched_at": "2026-06-10T23:40:00.586Z",
        "content_hash": "b950fe16e294910094ceb74ec4454baf362f4684e03ffa96e417b3e41c40b949"
      }
    ],
    "listing_status": "AUCTION",
    "listing_history": [
      "Treasury TEOAF auctions 2026-06-10"
    ],
    "confidence_score": 80,
    "source_id": "treasury",
    "source_name": "U.S. Treasury — Seized Real Property Auctions (TEOAF)",
    "source_url": "https://www.treasury.gov/auctions/treasury/rp/realprop.shtml",
    "fetched_at": "2026-06-10T23:40:00.586Z",
    "content_hash": "b950fe16e294910094ceb74ec4454baf362f4684e03ffa96e417b3e41c40b949",
    "classification_level": "PUBLIC",
    "replay_ref": "treasury-26-66-877",
    "connector_id": "treasury-rp-connector",
    "jurisdiction_scope": "federal",
    "scraper_version": "treasury-rp-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "treasury-26-66-878",
    "source_records": [
      {
        "sourceId": "treasury",
        "listingId": "26-66-878",
        "listingDate": null,
        "auctionDate": "2026-07-30",
        "state": "CO",
        "county": "Unknown",
        "town": "Penrose",
        "propertyType": "land",
        "rawPropertyStyle": "RURAL LAND",
        "exactAddress": "48 Tumbleweed Trail",
        "zip": "81240",
        "price": null,
        "bedrooms": null,
        "yearBuilt": null,
        "squareFeet": null,
        "acreageText": null,
        "program": null,
        "description": "2.64 +/- acres of rural land on a corner lot in Top Rail Ranch Estates with mountain views. \n The area has electric and water available. · Online auction: Thursday, July 30, 2026 · Sale #26-66-878",
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
        "fetched_at": "2026-06-10T23:40:00.586Z",
        "content_hash": "416c21bf5131aa15fdcc74c481e3cc7110ede9214262c76dc0182e067fcace51"
      }
    ],
    "listing_status": "AUCTION",
    "listing_history": [
      "Treasury TEOAF auctions 2026-06-10"
    ],
    "confidence_score": 80,
    "source_id": "treasury",
    "source_name": "U.S. Treasury — Seized Real Property Auctions (TEOAF)",
    "source_url": "https://www.treasury.gov/auctions/treasury/rp/realprop.shtml",
    "fetched_at": "2026-06-10T23:40:00.586Z",
    "content_hash": "416c21bf5131aa15fdcc74c481e3cc7110ede9214262c76dc0182e067fcace51",
    "classification_level": "PUBLIC",
    "replay_ref": "treasury-26-66-878",
    "connector_id": "treasury-rp-connector",
    "jurisdiction_scope": "federal",
    "scraper_version": "treasury-rp-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "treasury-26-66-847",
    "source_records": [
      {
        "sourceId": "treasury",
        "listingId": "26-66-847",
        "listingDate": null,
        "auctionDate": "2026-06-12",
        "state": "FL",
        "county": "Unknown",
        "town": "Panama City Beach",
        "propertyType": "land",
        "rawPropertyStyle": "RESIDENTIAL LAND",
        "exactAddress": "429 Paradise Blvd",
        "zip": "32413",
        "price": null,
        "bedrooms": null,
        "yearBuilt": null,
        "squareFeet": null,
        "acreageText": null,
        "program": null,
        "description": "3,200 +/- sq. ft. residential lot (lot 13) located in the gated community of Paradise Cove \n with utilites available and community pool and amenities. · Online auction: Friday, June 12, 2026 · Sale #26-66-847",
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
        "fetched_at": "2026-06-10T23:40:00.586Z",
        "content_hash": "f63280fd1100a89410b3b123b44944cb9b48bbf712b80d0ffd139577ca20b9fb"
      }
    ],
    "listing_status": "AUCTION",
    "listing_history": [
      "Treasury TEOAF auctions 2026-06-10"
    ],
    "confidence_score": 80,
    "source_id": "treasury",
    "source_name": "U.S. Treasury — Seized Real Property Auctions (TEOAF)",
    "source_url": "https://www.treasury.gov/auctions/treasury/rp/realprop.shtml",
    "fetched_at": "2026-06-10T23:40:00.586Z",
    "content_hash": "f63280fd1100a89410b3b123b44944cb9b48bbf712b80d0ffd139577ca20b9fb",
    "classification_level": "PUBLIC",
    "replay_ref": "treasury-26-66-847",
    "connector_id": "treasury-rp-connector",
    "jurisdiction_scope": "federal",
    "scraper_version": "treasury-rp-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "treasury-26-66-848",
    "source_records": [
      {
        "sourceId": "treasury",
        "listingId": "26-66-848",
        "listingDate": null,
        "auctionDate": "2026-06-12",
        "state": "FL",
        "county": "Unknown",
        "town": "Panama City Beach",
        "propertyType": "land",
        "rawPropertyStyle": "RESIDENTIAL LAND",
        "exactAddress": "433 Paradise Blvd",
        "zip": "32413",
        "price": null,
        "bedrooms": null,
        "yearBuilt": null,
        "squareFeet": null,
        "acreageText": null,
        "program": null,
        "description": "3,200 +/- sq. ft. residential lot (lot 15) located in the gated community of Paradise Cove \n with utilites available and community pool and amenities. · Online auction: Friday, June 12, 2026 · Sale #26-66-848",
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
        "fetched_at": "2026-06-10T23:40:00.586Z",
        "content_hash": "4814605a778c19a4c21f3e7165861d03f122a2de72e8cdf747a762ba41d91d57"
      }
    ],
    "listing_status": "AUCTION",
    "listing_history": [
      "Treasury TEOAF auctions 2026-06-10"
    ],
    "confidence_score": 80,
    "source_id": "treasury",
    "source_name": "U.S. Treasury — Seized Real Property Auctions (TEOAF)",
    "source_url": "https://www.treasury.gov/auctions/treasury/rp/realprop.shtml",
    "fetched_at": "2026-06-10T23:40:00.586Z",
    "content_hash": "4814605a778c19a4c21f3e7165861d03f122a2de72e8cdf747a762ba41d91d57",
    "classification_level": "PUBLIC",
    "replay_ref": "treasury-26-66-848",
    "connector_id": "treasury-rp-connector",
    "jurisdiction_scope": "federal",
    "scraper_version": "treasury-rp-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "treasury-26-66-849",
    "source_records": [
      {
        "sourceId": "treasury",
        "listingId": "26-66-849",
        "listingDate": null,
        "auctionDate": "2026-06-12",
        "state": "FL",
        "county": "Unknown",
        "town": "Panama City Beach",
        "propertyType": "land",
        "rawPropertyStyle": "RESIDENTIAL LAND",
        "exactAddress": "439 Paradise Blvd",
        "zip": "32413",
        "price": null,
        "bedrooms": null,
        "yearBuilt": null,
        "squareFeet": null,
        "acreageText": null,
        "program": null,
        "description": "3,200 +/- sq. ft. residential lot (lot 18) located in the gated community of Paradise Cove \n with utilites available and community pool and amenities. · Online auction: Friday, June 12, 2026 · Sale #26-66-849",
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
        "fetched_at": "2026-06-10T23:40:00.586Z",
        "content_hash": "1230a213ab6ec30a80e6a2cc86fc1a0ec5a08b3e339e540870cb2888fb1515a9"
      }
    ],
    "listing_status": "AUCTION",
    "listing_history": [
      "Treasury TEOAF auctions 2026-06-10"
    ],
    "confidence_score": 80,
    "source_id": "treasury",
    "source_name": "U.S. Treasury — Seized Real Property Auctions (TEOAF)",
    "source_url": "https://www.treasury.gov/auctions/treasury/rp/realprop.shtml",
    "fetched_at": "2026-06-10T23:40:00.586Z",
    "content_hash": "1230a213ab6ec30a80e6a2cc86fc1a0ec5a08b3e339e540870cb2888fb1515a9",
    "classification_level": "PUBLIC",
    "replay_ref": "treasury-26-66-849",
    "connector_id": "treasury-rp-connector",
    "jurisdiction_scope": "federal",
    "scraper_version": "treasury-rp-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "treasury-26-66-832",
    "source_records": [
      {
        "sourceId": "treasury",
        "listingId": "26-66-832",
        "listingDate": null,
        "auctionDate": "2026-06-25",
        "state": "FL",
        "county": "Unknown",
        "town": "Miramar",
        "propertyType": "home",
        "rawPropertyStyle": "CONDO UNIT",
        "exactAddress": "12421 SW 50th Court, Unit 327",
        "zip": "33027",
        "price": null,
        "bedrooms": null,
        "yearBuilt": null,
        "squareFeet": null,
        "acreageText": null,
        "program": null,
        "description": "1,474 +/- sq. ft. 2-level condo with 3 bedrooms, 2.1 baths, 2nd floor laundry, and parking. \n Located at Boardwalk at Vizcaya with community pool and clubhouse. · Online auction: Thursday, June 25, 2026 · Sale #26-66-832",
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
        "fetched_at": "2026-06-10T23:40:00.586Z",
        "content_hash": "058781f89e92a660c1b71b3383268bd306c176959060090e1eeed3268c2eb95f"
      }
    ],
    "listing_status": "AUCTION",
    "listing_history": [
      "Treasury TEOAF auctions 2026-06-10"
    ],
    "confidence_score": 80,
    "source_id": "treasury",
    "source_name": "U.S. Treasury — Seized Real Property Auctions (TEOAF)",
    "source_url": "https://www.treasury.gov/auctions/treasury/rp/realprop.shtml",
    "fetched_at": "2026-06-10T23:40:00.586Z",
    "content_hash": "058781f89e92a660c1b71b3383268bd306c176959060090e1eeed3268c2eb95f",
    "classification_level": "PUBLIC",
    "replay_ref": "treasury-26-66-832",
    "connector_id": "treasury-rp-connector",
    "jurisdiction_scope": "federal",
    "scraper_version": "treasury-rp-ingest-v0.1.0"
  },
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
        "fetched_at": "2026-06-10T23:40:00.586Z",
        "content_hash": "d0530ea9e46142d483134f45f9dd1c8b0792f3f53a2a3256147964f03ae3c986"
      }
    ],
    "listing_status": "AUCTION",
    "listing_history": [
      "Treasury TEOAF auctions 2026-06-10"
    ],
    "confidence_score": 80,
    "source_id": "treasury",
    "source_name": "U.S. Treasury — Seized Real Property Auctions (TEOAF)",
    "source_url": "https://www.treasury.gov/auctions/treasury/rp/realprop.shtml",
    "fetched_at": "2026-06-10T23:40:00.586Z",
    "content_hash": "d0530ea9e46142d483134f45f9dd1c8b0792f3f53a2a3256147964f03ae3c986",
    "classification_level": "PUBLIC",
    "replay_ref": "treasury-26-66-876",
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
        "fetched_at": "2026-06-10T23:40:00.586Z",
        "content_hash": "aa079d5549ef8cd60542a341a2e11cff238380ae94f0572220caacd266d95014"
      }
    ],
    "listing_status": "AUCTION",
    "listing_history": [
      "Treasury TEOAF auctions 2026-06-10"
    ],
    "confidence_score": 80,
    "source_id": "treasury",
    "source_name": "U.S. Treasury — Seized Real Property Auctions (TEOAF)",
    "source_url": "https://www.treasury.gov/auctions/treasury/rp/realprop.shtml",
    "fetched_at": "2026-06-10T23:40:00.586Z",
    "content_hash": "aa079d5549ef8cd60542a341a2e11cff238380ae94f0572220caacd266d95014",
    "classification_level": "PUBLIC",
    "replay_ref": "treasury-26-66-855",
    "connector_id": "treasury-rp-connector",
    "jurisdiction_scope": "federal",
    "scraper_version": "treasury-rp-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "treasury-26-66-866",
    "source_records": [
      {
        "sourceId": "treasury",
        "listingId": "26-66-866",
        "listingDate": null,
        "auctionDate": "2026-06-24",
        "state": "NJ",
        "county": "Unknown",
        "town": "East Orange",
        "propertyType": "home",
        "rawPropertyStyle": "SINGLE FAMILY HOME",
        "exactAddress": "39 Amherst Street",
        "zip": "07018",
        "price": null,
        "bedrooms": null,
        "yearBuilt": null,
        "squareFeet": null,
        "acreageText": null,
        "program": null,
        "description": "2,055 +/- sq. ft. 3-level home with 6 bedrooms, 3 baths, enclosed porch, and unfinished basement. \n The property has a fenced yard and was built in 1925. · Online auction: Wednesday, June 24, 2026 · Sale #26-66-866",
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
        "fetched_at": "2026-06-10T23:40:00.586Z",
        "content_hash": "e4c8a9a56756a8ad9e26296a5197e388e6829dc0b61e05aa3ffab62426c7470f"
      }
    ],
    "listing_status": "AUCTION",
    "listing_history": [
      "Treasury TEOAF auctions 2026-06-10"
    ],
    "confidence_score": 80,
    "source_id": "treasury",
    "source_name": "U.S. Treasury — Seized Real Property Auctions (TEOAF)",
    "source_url": "https://www.treasury.gov/auctions/treasury/rp/realprop.shtml",
    "fetched_at": "2026-06-10T23:40:00.586Z",
    "content_hash": "e4c8a9a56756a8ad9e26296a5197e388e6829dc0b61e05aa3ffab62426c7470f",
    "classification_level": "PUBLIC",
    "replay_ref": "treasury-26-66-866",
    "connector_id": "treasury-rp-connector",
    "jurisdiction_scope": "federal",
    "scraper_version": "treasury-rp-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "treasury-26-66-166",
    "source_records": [
      {
        "sourceId": "treasury",
        "listingId": "26-66-166",
        "listingDate": null,
        "auctionDate": "2026-06-25",
        "state": "OR",
        "county": "Unknown",
        "town": "Salem",
        "propertyType": "home",
        "rawPropertyStyle": "SINGLE FAMILY HOME",
        "exactAddress": "4705 Battle Creek Road",
        "zip": "97302",
        "price": null,
        "bedrooms": null,
        "yearBuilt": null,
        "squareFeet": null,
        "acreageText": null,
        "program": null,
        "description": "2,623 +/- sq. ft. home with 3 bedrooms, 2 baths, fireplace, patio, and unfinished basement. \n Located on 2.07 +/- acres with a detached workshop/garage. · Online auction: Thursday, June 25, 2026 · Sale #26-66-166",
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
        "fetched_at": "2026-06-10T23:40:00.586Z",
        "content_hash": "f795bd4b053916e10a18c8b8b27e6abbc54266b8ab7029352491202b4a3e0c22"
      }
    ],
    "listing_status": "AUCTION",
    "listing_history": [
      "Treasury TEOAF auctions 2026-06-10"
    ],
    "confidence_score": 80,
    "source_id": "treasury",
    "source_name": "U.S. Treasury — Seized Real Property Auctions (TEOAF)",
    "source_url": "https://www.treasury.gov/auctions/treasury/rp/realprop.shtml",
    "fetched_at": "2026-06-10T23:40:00.586Z",
    "content_hash": "f795bd4b053916e10a18c8b8b27e6abbc54266b8ab7029352491202b4a3e0c22",
    "classification_level": "PUBLIC",
    "replay_ref": "treasury-26-66-166",
    "connector_id": "treasury-rp-connector",
    "jurisdiction_scope": "federal",
    "scraper_version": "treasury-rp-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "treasury-26-66-171",
    "source_records": [
      {
        "sourceId": "treasury",
        "listingId": "26-66-171",
        "listingDate": null,
        "auctionDate": "2026-07-17",
        "state": "OR",
        "county": "Unknown",
        "town": "Silverton",
        "propertyType": "home",
        "rawPropertyStyle": "SINGLE FAMILYHOME",
        "exactAddress": "879 Railway Avenue NE",
        "zip": "97381",
        "price": null,
        "bedrooms": null,
        "yearBuilt": null,
        "squareFeet": null,
        "acreageText": null,
        "program": null,
        "description": "1,468 +/- sq. ft. 1-level home with 3 bedrooms and 1 bath on a 0.83 +/- acre lot. \n Built in 1925 and located in Marion County. · Online auction: Friday, July 17, 2026 · Sale #26-66-171",
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
        "fetched_at": "2026-06-10T23:40:00.586Z",
        "content_hash": "a530b8a5d5b2dda83fb3a77a91c79bdfde96ccea091805f8dadd694ea1722fe7"
      }
    ],
    "listing_status": "AUCTION",
    "listing_history": [
      "Treasury TEOAF auctions 2026-06-10"
    ],
    "confidence_score": 80,
    "source_id": "treasury",
    "source_name": "U.S. Treasury — Seized Real Property Auctions (TEOAF)",
    "source_url": "https://www.treasury.gov/auctions/treasury/rp/realprop.shtml",
    "fetched_at": "2026-06-10T23:40:00.586Z",
    "content_hash": "a530b8a5d5b2dda83fb3a77a91c79bdfde96ccea091805f8dadd694ea1722fe7",
    "classification_level": "PUBLIC",
    "replay_ref": "treasury-26-66-171",
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
        "fetched_at": "2026-06-10T23:40:00.586Z",
        "content_hash": "02bc765f930033b71f91af0eafa191f605b87efa7402bb5718a972b17daa6186"
      }
    ],
    "listing_status": "AUCTION",
    "listing_history": [
      "Treasury TEOAF auctions 2026-06-10"
    ],
    "confidence_score": 80,
    "source_id": "treasury",
    "source_name": "U.S. Treasury — Seized Real Property Auctions (TEOAF)",
    "source_url": "https://www.treasury.gov/auctions/treasury/rp/realprop.shtml",
    "fetched_at": "2026-06-10T23:40:00.586Z",
    "content_hash": "02bc765f930033b71f91af0eafa191f605b87efa7402bb5718a972b17daa6186",
    "classification_level": "PUBLIC",
    "replay_ref": "treasury-26-66-190",
    "connector_id": "treasury-rp-connector",
    "jurisdiction_scope": "federal",
    "scraper_version": "treasury-rp-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "treasury-26-66-168",
    "source_records": [
      {
        "sourceId": "treasury",
        "listingId": "26-66-168",
        "listingDate": null,
        "auctionDate": "2026-06-25",
        "state": "TX",
        "county": "Unknown",
        "town": "San Benito",
        "propertyType": "land",
        "rawPropertyStyle": "RURAL LAND",
        "exactAddress": "Parcel 192566, FM 2520",
        "zip": "78586",
        "price": null,
        "bedrooms": null,
        "yearBuilt": null,
        "squareFeet": null,
        "acreageText": null,
        "program": null,
        "description": "9.95 +/- acres of rural land in a mixed-use area of Cameron County that is not zoned. \n The area has electric, water, and sewer available. · Online auction: Thursday, June 25, 2026 · Sale #26-66-168",
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
        "fetched_at": "2026-06-10T23:40:00.586Z",
        "content_hash": "fec3040327e453d322c516228861e61771fdac4d3731458a6a0a7559cb9d5680"
      }
    ],
    "listing_status": "AUCTION",
    "listing_history": [
      "Treasury TEOAF auctions 2026-06-10"
    ],
    "confidence_score": 80,
    "source_id": "treasury",
    "source_name": "U.S. Treasury — Seized Real Property Auctions (TEOAF)",
    "source_url": "https://www.treasury.gov/auctions/treasury/rp/realprop.shtml",
    "fetched_at": "2026-06-10T23:40:00.586Z",
    "content_hash": "fec3040327e453d322c516228861e61771fdac4d3731458a6a0a7559cb9d5680",
    "classification_level": "PUBLIC",
    "replay_ref": "treasury-26-66-168",
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
        "fetched_at": "2026-06-10T23:40:00.586Z",
        "content_hash": "a070fb7e3d6f68ad4bc784535f3a91cdee968b2175f0dabf677669e002e12b14"
      }
    ],
    "listing_status": "AUCTION",
    "listing_history": [
      "Treasury TEOAF auctions 2026-06-10"
    ],
    "confidence_score": 80,
    "source_id": "treasury",
    "source_name": "U.S. Treasury — Seized Real Property Auctions (TEOAF)",
    "source_url": "https://www.treasury.gov/auctions/treasury/rp/realprop.shtml",
    "fetched_at": "2026-06-10T23:40:00.586Z",
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
        "fetched_at": "2026-06-10T23:40:00.586Z",
        "content_hash": "843a6a899e01c10422123a46af747f020b3a387b757311ecc772ce1d985d9876"
      }
    ],
    "listing_status": "AUCTION",
    "listing_history": [
      "Treasury TEOAF auctions 2026-06-10"
    ],
    "confidence_score": 80,
    "source_id": "treasury",
    "source_name": "U.S. Treasury — Seized Real Property Auctions (TEOAF)",
    "source_url": "https://www.treasury.gov/auctions/treasury/rp/realprop.shtml",
    "fetched_at": "2026-06-10T23:40:00.586Z",
    "content_hash": "843a6a899e01c10422123a46af747f020b3a387b757311ecc772ce1d985d9876",
    "classification_level": "PUBLIC",
    "replay_ref": "treasury-26-66-196",
    "connector_id": "treasury-rp-connector",
    "jurisdiction_scope": "federal",
    "scraper_version": "treasury-rp-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "treasury-26-66-177",
    "source_records": [
      {
        "sourceId": "treasury",
        "listingId": "26-66-177",
        "listingDate": null,
        "auctionDate": "2026-06-17",
        "state": "WA",
        "county": "Unknown",
        "town": "Vashon",
        "propertyType": "home",
        "rawPropertyStyle": "LAND WITH DWELLING",
        "exactAddress": "6113 SW 240th Street",
        "zip": "98070",
        "price": null,
        "bedrooms": null,
        "yearBuilt": null,
        "squareFeet": null,
        "acreageText": null,
        "program": null,
        "description": "9.7 +/- acre lot in King County with a 1,100 +/- sq. ft. home with 3 bedrooms, 2 baths, and carport. \n Property includes an unfinished accessory dwelling and detached garage. · Online auction: Wednesday, June 17, 2026 · Sale #26-66-177",
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
        "fetched_at": "2026-06-10T23:40:00.586Z",
        "content_hash": "70c218e61fe9bd515d04af42b6847305581360899e4312dee7e2b24e138a994f"
      }
    ],
    "listing_status": "AUCTION",
    "listing_history": [
      "Treasury TEOAF auctions 2026-06-10"
    ],
    "confidence_score": 80,
    "source_id": "treasury",
    "source_name": "U.S. Treasury — Seized Real Property Auctions (TEOAF)",
    "source_url": "https://www.treasury.gov/auctions/treasury/rp/realprop.shtml",
    "fetched_at": "2026-06-10T23:40:00.586Z",
    "content_hash": "70c218e61fe9bd515d04af42b6847305581360899e4312dee7e2b24e138a994f",
    "classification_level": "PUBLIC",
    "replay_ref": "treasury-26-66-177",
    "connector_id": "treasury-rp-connector",
    "jurisdiction_scope": "federal",
    "scraper_version": "treasury-rp-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "treasury-26-66-175",
    "source_records": [
      {
        "sourceId": "treasury",
        "listingId": "26-66-175",
        "listingDate": null,
        "auctionDate": "2026-06-17",
        "state": "WA",
        "county": "Unknown",
        "town": "Vashon",
        "propertyType": "land",
        "rawPropertyStyle": "RESIDENTIAL LAND",
        "exactAddress": "12726 SW Cemetery Road",
        "zip": "98070",
        "price": null,
        "bedrooms": null,
        "yearBuilt": null,
        "squareFeet": null,
        "acreageText": null,
        "program": null,
        "description": "5.62 +/- acres of residential land with a 2,688 +/- sq. ft. metal shop and fencing. \n Located near Puget Sound in a growth ring of Eatonville. · Online auction: Wednesday, June 17, 2026 · Sale #26-66-175",
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
        "fetched_at": "2026-06-10T23:40:00.586Z",
        "content_hash": "39968afe4f04dbf896140216cfb769fc7b47fc545876763086d9d7efed58eda1"
      }
    ],
    "listing_status": "AUCTION",
    "listing_history": [
      "Treasury TEOAF auctions 2026-06-10"
    ],
    "confidence_score": 80,
    "source_id": "treasury",
    "source_name": "U.S. Treasury — Seized Real Property Auctions (TEOAF)",
    "source_url": "https://www.treasury.gov/auctions/treasury/rp/realprop.shtml",
    "fetched_at": "2026-06-10T23:40:00.586Z",
    "content_hash": "39968afe4f04dbf896140216cfb769fc7b47fc545876763086d9d7efed58eda1",
    "classification_level": "PUBLIC",
    "replay_ref": "treasury-26-66-175",
    "connector_id": "treasury-rp-connector",
    "jurisdiction_scope": "federal",
    "scraper_version": "treasury-rp-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "treasury-26-66-176",
    "source_records": [
      {
        "sourceId": "treasury",
        "listingId": "26-66-176",
        "listingDate": null,
        "auctionDate": "2026-06-17",
        "state": "WA",
        "county": "Unknown",
        "town": "Carnation",
        "propertyType": "land",
        "rawPropertyStyle": "RESIDENTIAL LAND",
        "exactAddress": "8801 W. Snoqualmie Valley Rd NE",
        "zip": "98014",
        "price": null,
        "bedrooms": null,
        "yearBuilt": null,
        "squareFeet": null,
        "acreageText": null,
        "program": null,
        "description": "0.63 +/- of an acre wooded lot in King County that is zoned residential with mountain views. \n Located near Lake Sammamish in a growth ring of Carnation/Redmond. · Online auction: Wednesday, June 17, 2026 · Sale #26-66-176",
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
        "fetched_at": "2026-06-10T23:40:00.586Z",
        "content_hash": "c615df3f683bfcbab782a7c327b4fbe7428949363635a73871c93ebf70dd77c3"
      }
    ],
    "listing_status": "AUCTION",
    "listing_history": [
      "Treasury TEOAF auctions 2026-06-10"
    ],
    "confidence_score": 80,
    "source_id": "treasury",
    "source_name": "U.S. Treasury — Seized Real Property Auctions (TEOAF)",
    "source_url": "https://www.treasury.gov/auctions/treasury/rp/realprop.shtml",
    "fetched_at": "2026-06-10T23:40:00.586Z",
    "content_hash": "c615df3f683bfcbab782a7c327b4fbe7428949363635a73871c93ebf70dd77c3",
    "classification_level": "PUBLIC",
    "replay_ref": "treasury-26-66-176",
    "connector_id": "treasury-rp-connector",
    "jurisdiction_scope": "federal",
    "scraper_version": "treasury-rp-ingest-v0.1.0"
  }
];
