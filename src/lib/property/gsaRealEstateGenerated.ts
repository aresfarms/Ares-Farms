/**
 * gsaRealEstateGenerated — GENERATED FILE. Do not edit by hand.
 *
 * SERVER-ONLY: GSA federal surplus real-property AUCTION listings, parsed from
 * the official realestatesales.gov page (public domain). PENDING Module 22/23.
 *
 * Written by src/scripts/ingestGsaRealEstate.ts. Re-run `npm run ingest:gsa-realestate`.
 * Ingested at: 2026-06-10T23:40:10.092Z
 */

import type { CanonicalProperty } from "./propertyTypes";

export const GSA_RE_INGEST_PROVENANCE = {
  "fetchedAt": "2026-06-10T23:40:10.092Z",
  "feedUrl": "https://realestatesales.gov/our-listing/",
  "listed": 12,
  "current": 12,
  "license": "Public domain (U.S. Government work) — GSA realestatesales.gov",
  "scraperVersion": "gsa-realestate-ingest-v0.1.0"
} as const;

export const GSA_RE_PROPERTIES: CanonicalProperty[] = [
  {
    "canonical_property_id": "gsa-re-63",
    "source_records": [
      {
        "sourceId": "gsa-realestate",
        "listingId": "63",
        "listingDate": null,
        "auctionDate": null,
        "state": "IN",
        "county": "Unknown",
        "town": "Hobart",
        "propertyType": "land",
        "rawPropertyStyle": "Land/Lots",
        "exactAddress": "000 Now Bidding Hobart NIKE Site 520 W 700 North Hobart",
        "zip": "46342",
        "price": 15000,
        "bedrooms": null,
        "yearBuilt": null,
        "squareFeet": null,
        "acreageText": null,
        "program": null,
        "description": "Land/Lots · Online Auction · GSA listing #63",
        "photoFile": null,
        "listingUrl": "https://realestatesales.gov/asset-details/?property_id=63",
        "isCurrent": true,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "gsa-realestate",
        "source_url": "https://realestatesales.gov/our-listing/",
        "fetched_at": "2026-06-10T23:40:10.092Z",
        "content_hash": "152e261ec27d3cdf266f8674728f615b755d906261b60c8b3939cabd0abac1f0"
      }
    ],
    "listing_status": "AUCTION",
    "listing_history": [
      "GSA realestatesales.gov 2026-06-10"
    ],
    "confidence_score": 80,
    "source_id": "gsa-realestate",
    "source_name": "GSA — Federal surplus real property (realestatesales.gov)",
    "source_url": "https://realestatesales.gov/our-listing/",
    "fetched_at": "2026-06-10T23:40:10.092Z",
    "content_hash": "152e261ec27d3cdf266f8674728f615b755d906261b60c8b3939cabd0abac1f0",
    "classification_level": "PUBLIC",
    "replay_ref": "gsa-re-63",
    "connector_id": "gsa-realestate-connector",
    "jurisdiction_scope": "federal",
    "scraper_version": "gsa-realestate-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "gsa-re-46",
    "source_records": [
      {
        "sourceId": "gsa-realestate",
        "listingId": "46",
        "listingDate": null,
        "auctionDate": null,
        "state": "MI",
        "county": "Unknown",
        "town": "Grand Rapids",
        "propertyType": "commercial",
        "rawPropertyStyle": "Commercial",
        "exactAddress": "000 Now Bidding 1863 Monroe 1863 Monroe Ave NW Grand Rapids",
        "zip": "49505",
        "price": 1500000,
        "bedrooms": null,
        "yearBuilt": null,
        "squareFeet": null,
        "acreageText": null,
        "program": null,
        "description": "Commercial · Online Auction · GSA listing #46",
        "photoFile": null,
        "listingUrl": "https://realestatesales.gov/asset-details/?property_id=46",
        "isCurrent": true,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "gsa-realestate",
        "source_url": "https://realestatesales.gov/our-listing/",
        "fetched_at": "2026-06-10T23:40:10.092Z",
        "content_hash": "6cef6fd1dd23b3b4cc5a1a8f30425d9ee19785c9a212901d9b4514e1dfa25502"
      }
    ],
    "listing_status": "AUCTION",
    "listing_history": [
      "GSA realestatesales.gov 2026-06-10"
    ],
    "confidence_score": 80,
    "source_id": "gsa-realestate",
    "source_name": "GSA — Federal surplus real property (realestatesales.gov)",
    "source_url": "https://realestatesales.gov/our-listing/",
    "fetched_at": "2026-06-10T23:40:10.092Z",
    "content_hash": "6cef6fd1dd23b3b4cc5a1a8f30425d9ee19785c9a212901d9b4514e1dfa25502",
    "classification_level": "PUBLIC",
    "replay_ref": "gsa-re-46",
    "connector_id": "gsa-realestate-connector",
    "jurisdiction_scope": "federal",
    "scraper_version": "gsa-realestate-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "gsa-re-54",
    "source_records": [
      {
        "sourceId": "gsa-realestate",
        "listingId": "54",
        "listingDate": null,
        "auctionDate": null,
        "state": "NJ",
        "county": "Unknown",
        "town": "Somerville",
        "propertyType": "commercial",
        "rawPropertyStyle": "Commercial",
        "exactAddress": "Now Bidding The Depot at Somerville Roycefield Rd. Somerville",
        "zip": "08876",
        "price": null,
        "bedrooms": null,
        "yearBuilt": null,
        "squareFeet": null,
        "acreageText": null,
        "program": null,
        "description": "Commercial · Sealed Bid Auction · GSA listing #54",
        "photoFile": null,
        "listingUrl": "https://realestatesales.gov/asset-details/?property_id=54",
        "isCurrent": true,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "gsa-realestate",
        "source_url": "https://realestatesales.gov/our-listing/",
        "fetched_at": "2026-06-10T23:40:10.092Z",
        "content_hash": "eaa9523443710c2ee9c44371f5e22a27b742739e86d059aec5316fffa70f9c54"
      }
    ],
    "listing_status": "AUCTION",
    "listing_history": [
      "GSA realestatesales.gov 2026-06-10"
    ],
    "confidence_score": 80,
    "source_id": "gsa-realestate",
    "source_name": "GSA — Federal surplus real property (realestatesales.gov)",
    "source_url": "https://realestatesales.gov/our-listing/",
    "fetched_at": "2026-06-10T23:40:10.092Z",
    "content_hash": "eaa9523443710c2ee9c44371f5e22a27b742739e86d059aec5316fffa70f9c54",
    "classification_level": "PUBLIC",
    "replay_ref": "gsa-re-54",
    "connector_id": "gsa-realestate-connector",
    "jurisdiction_scope": "federal",
    "scraper_version": "gsa-realestate-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "gsa-re-62",
    "source_records": [
      {
        "sourceId": "gsa-realestate",
        "listingId": "62",
        "listingDate": null,
        "auctionDate": null,
        "state": "TX",
        "county": "Unknown",
        "town": "Port Lavaca",
        "propertyType": "home",
        "rawPropertyStyle": "Residential",
        "exactAddress": "121 Brookhollow Dr - USCG Port Lavaca Housing 1121 Brookhollow Drive Port Lavaca",
        "zip": "77979",
        "price": 35000,
        "bedrooms": null,
        "yearBuilt": null,
        "squareFeet": null,
        "acreageText": null,
        "program": null,
        "description": "Residential · Online Auction · GSA listing #62",
        "photoFile": null,
        "listingUrl": "https://realestatesales.gov/asset-details/?property_id=62",
        "isCurrent": true,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "gsa-realestate",
        "source_url": "https://realestatesales.gov/our-listing/",
        "fetched_at": "2026-06-10T23:40:10.092Z",
        "content_hash": "d4547dc6fe8276f030e64533fdc6c6471ebd684ab3b2750240d5e30acffe953a"
      }
    ],
    "listing_status": "AUCTION",
    "listing_history": [
      "GSA realestatesales.gov 2026-06-10"
    ],
    "confidence_score": 80,
    "source_id": "gsa-realestate",
    "source_name": "GSA — Federal surplus real property (realestatesales.gov)",
    "source_url": "https://realestatesales.gov/our-listing/",
    "fetched_at": "2026-06-10T23:40:10.092Z",
    "content_hash": "d4547dc6fe8276f030e64533fdc6c6471ebd684ab3b2750240d5e30acffe953a",
    "classification_level": "PUBLIC",
    "replay_ref": "gsa-re-62",
    "connector_id": "gsa-realestate-connector",
    "jurisdiction_scope": "federal",
    "scraper_version": "gsa-realestate-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "gsa-re-55",
    "source_records": [
      {
        "sourceId": "gsa-realestate",
        "listingId": "55",
        "listingDate": null,
        "auctionDate": null,
        "state": "TX",
        "county": "Unknown",
        "town": "Port Lavaca",
        "propertyType": "home",
        "rawPropertyStyle": "Residential",
        "exactAddress": "dding 1711 Jackson St - USCG Port Lavaca Housing 1711 Jackson Street Port Lavaca",
        "zip": "77979",
        "price": 30000,
        "bedrooms": null,
        "yearBuilt": null,
        "squareFeet": null,
        "acreageText": null,
        "program": null,
        "description": "Residential · Online Auction · GSA listing #55",
        "photoFile": null,
        "listingUrl": "https://realestatesales.gov/asset-details/?property_id=55",
        "isCurrent": true,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "gsa-realestate",
        "source_url": "https://realestatesales.gov/our-listing/",
        "fetched_at": "2026-06-10T23:40:10.092Z",
        "content_hash": "20af916bbf5724b9dbeb613b16d47915c55c5af7cc843ee780e4cf84d89d329a"
      }
    ],
    "listing_status": "AUCTION",
    "listing_history": [
      "GSA realestatesales.gov 2026-06-10"
    ],
    "confidence_score": 80,
    "source_id": "gsa-realestate",
    "source_name": "GSA — Federal surplus real property (realestatesales.gov)",
    "source_url": "https://realestatesales.gov/our-listing/",
    "fetched_at": "2026-06-10T23:40:10.092Z",
    "content_hash": "20af916bbf5724b9dbeb613b16d47915c55c5af7cc843ee780e4cf84d89d329a",
    "classification_level": "PUBLIC",
    "replay_ref": "gsa-re-55",
    "connector_id": "gsa-realestate-connector",
    "jurisdiction_scope": "federal",
    "scraper_version": "gsa-realestate-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "gsa-re-59",
    "source_records": [
      {
        "sourceId": "gsa-realestate",
        "listingId": "59",
        "listingDate": null,
        "auctionDate": null,
        "state": "TX",
        "county": "Unknown",
        "town": "Port Lavaca",
        "propertyType": "home",
        "rawPropertyStyle": "Residential",
        "exactAddress": "dding 2107 Jackson St - USCG Port Lavaca Housing 2107 Jackson Street Port Lavaca",
        "zip": "77979",
        "price": 30000,
        "bedrooms": null,
        "yearBuilt": null,
        "squareFeet": null,
        "acreageText": null,
        "program": null,
        "description": "Residential · Online Auction · GSA listing #59",
        "photoFile": null,
        "listingUrl": "https://realestatesales.gov/asset-details/?property_id=59",
        "isCurrent": true,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "gsa-realestate",
        "source_url": "https://realestatesales.gov/our-listing/",
        "fetched_at": "2026-06-10T23:40:10.092Z",
        "content_hash": "50e63461ccde33c308744e7a4d636e2f3a706e9c93a85a1ef5b08e5e99e69dab"
      }
    ],
    "listing_status": "AUCTION",
    "listing_history": [
      "GSA realestatesales.gov 2026-06-10"
    ],
    "confidence_score": 80,
    "source_id": "gsa-realestate",
    "source_name": "GSA — Federal surplus real property (realestatesales.gov)",
    "source_url": "https://realestatesales.gov/our-listing/",
    "fetched_at": "2026-06-10T23:40:10.092Z",
    "content_hash": "50e63461ccde33c308744e7a4d636e2f3a706e9c93a85a1ef5b08e5e99e69dab",
    "classification_level": "PUBLIC",
    "replay_ref": "gsa-re-59",
    "connector_id": "gsa-realestate-connector",
    "jurisdiction_scope": "federal",
    "scraper_version": "gsa-realestate-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "gsa-re-60",
    "source_records": [
      {
        "sourceId": "gsa-realestate",
        "listingId": "60",
        "listingDate": null,
        "auctionDate": null,
        "state": "TX",
        "county": "Unknown",
        "town": "Port Lavaca",
        "propertyType": "home",
        "rawPropertyStyle": "Residential",
        "exactAddress": "idding 817 Westwood Dr - USCG Port Lavaca Housing 817 Westwood Drive Port Lavaca",
        "zip": "77979",
        "price": 30000,
        "bedrooms": null,
        "yearBuilt": null,
        "squareFeet": null,
        "acreageText": null,
        "program": null,
        "description": "Residential · Online Auction · GSA listing #60",
        "photoFile": null,
        "listingUrl": "https://realestatesales.gov/asset-details/?property_id=60",
        "isCurrent": true,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "gsa-realestate",
        "source_url": "https://realestatesales.gov/our-listing/",
        "fetched_at": "2026-06-10T23:40:10.092Z",
        "content_hash": "ab52d945c555a95fc874c47f54340d23317e6fba00741cdc10936b372f5c6be5"
      }
    ],
    "listing_status": "AUCTION",
    "listing_history": [
      "GSA realestatesales.gov 2026-06-10"
    ],
    "confidence_score": 80,
    "source_id": "gsa-realestate",
    "source_name": "GSA — Federal surplus real property (realestatesales.gov)",
    "source_url": "https://realestatesales.gov/our-listing/",
    "fetched_at": "2026-06-10T23:40:10.092Z",
    "content_hash": "ab52d945c555a95fc874c47f54340d23317e6fba00741cdc10936b372f5c6be5",
    "classification_level": "PUBLIC",
    "replay_ref": "gsa-re-60",
    "connector_id": "gsa-realestate-connector",
    "jurisdiction_scope": "federal",
    "scraper_version": "gsa-realestate-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "gsa-re-56",
    "source_records": [
      {
        "sourceId": "gsa-realestate",
        "listingId": "56",
        "listingDate": null,
        "auctionDate": null,
        "state": "TX",
        "county": "Unknown",
        "town": "Port Lavaca",
        "propertyType": "home",
        "rawPropertyStyle": "Residential",
        "exactAddress": "dding 1712 Jackson St - USCG Port Lavaca Housing 1712 Jackson Street Port Lavaca",
        "zip": "77979",
        "price": 30000,
        "bedrooms": null,
        "yearBuilt": null,
        "squareFeet": null,
        "acreageText": null,
        "program": null,
        "description": "Residential · Online Auction · GSA listing #56",
        "photoFile": null,
        "listingUrl": "https://realestatesales.gov/asset-details/?property_id=56",
        "isCurrent": true,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "gsa-realestate",
        "source_url": "https://realestatesales.gov/our-listing/",
        "fetched_at": "2026-06-10T23:40:10.092Z",
        "content_hash": "ca5cc3db62c070a00e0225246b4c3de69beee0aaa81f735d1433370c9536f007"
      }
    ],
    "listing_status": "AUCTION",
    "listing_history": [
      "GSA realestatesales.gov 2026-06-10"
    ],
    "confidence_score": 80,
    "source_id": "gsa-realestate",
    "source_name": "GSA — Federal surplus real property (realestatesales.gov)",
    "source_url": "https://realestatesales.gov/our-listing/",
    "fetched_at": "2026-06-10T23:40:10.092Z",
    "content_hash": "ca5cc3db62c070a00e0225246b4c3de69beee0aaa81f735d1433370c9536f007",
    "classification_level": "PUBLIC",
    "replay_ref": "gsa-re-56",
    "connector_id": "gsa-realestate-connector",
    "jurisdiction_scope": "federal",
    "scraper_version": "gsa-realestate-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "gsa-re-61",
    "source_records": [
      {
        "sourceId": "gsa-realestate",
        "listingId": "61",
        "listingDate": null,
        "auctionDate": null,
        "state": "TX",
        "county": "Unknown",
        "town": "Port Lavaca",
        "propertyType": "home",
        "rawPropertyStyle": "Residential",
        "exactAddress": "ding 1002 Westwood Dr - USCG Port Lavaca Housing 1002 Westwood Drive Port Lavaca",
        "zip": "77979",
        "price": 35000,
        "bedrooms": null,
        "yearBuilt": null,
        "squareFeet": null,
        "acreageText": null,
        "program": null,
        "description": "Residential · Online Auction · GSA listing #61",
        "photoFile": null,
        "listingUrl": "https://realestatesales.gov/asset-details/?property_id=61",
        "isCurrent": true,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "gsa-realestate",
        "source_url": "https://realestatesales.gov/our-listing/",
        "fetched_at": "2026-06-10T23:40:10.092Z",
        "content_hash": "d571c123272f89c37a62be74737b9b9d67d56d6a39e2c1dc3ee3d0a1bf2a1b30"
      }
    ],
    "listing_status": "AUCTION",
    "listing_history": [
      "GSA realestatesales.gov 2026-06-10"
    ],
    "confidence_score": 80,
    "source_id": "gsa-realestate",
    "source_name": "GSA — Federal surplus real property (realestatesales.gov)",
    "source_url": "https://realestatesales.gov/our-listing/",
    "fetched_at": "2026-06-10T23:40:10.092Z",
    "content_hash": "d571c123272f89c37a62be74737b9b9d67d56d6a39e2c1dc3ee3d0a1bf2a1b30",
    "classification_level": "PUBLIC",
    "replay_ref": "gsa-re-61",
    "connector_id": "gsa-realestate-connector",
    "jurisdiction_scope": "federal",
    "scraper_version": "gsa-realestate-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "gsa-re-57",
    "source_records": [
      {
        "sourceId": "gsa-realestate",
        "listingId": "57",
        "listingDate": null,
        "auctionDate": null,
        "state": "TX",
        "county": "Unknown",
        "town": "Port Lavaca",
        "propertyType": "home",
        "rawPropertyStyle": "Residential",
        "exactAddress": "dding 2105 Jackson St - USCG Port Lavaca Housing 2105 Jackson Street Port Lavaca",
        "zip": "77979",
        "price": 30000,
        "bedrooms": null,
        "yearBuilt": null,
        "squareFeet": null,
        "acreageText": null,
        "program": null,
        "description": "Residential · Online Auction · GSA listing #57",
        "photoFile": null,
        "listingUrl": "https://realestatesales.gov/asset-details/?property_id=57",
        "isCurrent": true,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "gsa-realestate",
        "source_url": "https://realestatesales.gov/our-listing/",
        "fetched_at": "2026-06-10T23:40:10.092Z",
        "content_hash": "9aeac15d3647750261d0d9190fbc8aea765490a2d2a5b775f6e5a3c12a16027f"
      }
    ],
    "listing_status": "AUCTION",
    "listing_history": [
      "GSA realestatesales.gov 2026-06-10"
    ],
    "confidence_score": 80,
    "source_id": "gsa-realestate",
    "source_name": "GSA — Federal surplus real property (realestatesales.gov)",
    "source_url": "https://realestatesales.gov/our-listing/",
    "fetched_at": "2026-06-10T23:40:10.092Z",
    "content_hash": "9aeac15d3647750261d0d9190fbc8aea765490a2d2a5b775f6e5a3c12a16027f",
    "classification_level": "PUBLIC",
    "replay_ref": "gsa-re-57",
    "connector_id": "gsa-realestate-connector",
    "jurisdiction_scope": "federal",
    "scraper_version": "gsa-realestate-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "gsa-re-64",
    "source_records": [
      {
        "sourceId": "gsa-realestate",
        "listingId": "64",
        "listingDate": null,
        "auctionDate": null,
        "state": "UT",
        "county": "Unknown",
        "town": "Perry",
        "propertyType": "land",
        "rawPropertyStyle": "Land/Lots",
        "exactAddress": "Now Bidding 1.24 Acres of the Bear River Bird Refuge 3425 South 1700 West Perry",
        "zip": "84302",
        "price": 10000,
        "bedrooms": null,
        "yearBuilt": null,
        "squareFeet": null,
        "acreageText": null,
        "program": null,
        "description": "Land/Lots · Online Auction · GSA listing #64",
        "photoFile": null,
        "listingUrl": "https://realestatesales.gov/asset-details/?property_id=64",
        "isCurrent": true,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "gsa-realestate",
        "source_url": "https://realestatesales.gov/our-listing/",
        "fetched_at": "2026-06-10T23:40:10.092Z",
        "content_hash": "5377f0bc52840c9f8d36a5a1053a00aabc3e0191517ac04cd88d52bc3f50e69c"
      }
    ],
    "listing_status": "AUCTION",
    "listing_history": [
      "GSA realestatesales.gov 2026-06-10"
    ],
    "confidence_score": 80,
    "source_id": "gsa-realestate",
    "source_name": "GSA — Federal surplus real property (realestatesales.gov)",
    "source_url": "https://realestatesales.gov/our-listing/",
    "fetched_at": "2026-06-10T23:40:10.092Z",
    "content_hash": "5377f0bc52840c9f8d36a5a1053a00aabc3e0191517ac04cd88d52bc3f50e69c",
    "classification_level": "PUBLIC",
    "replay_ref": "gsa-re-64",
    "connector_id": "gsa-realestate-connector",
    "jurisdiction_scope": "federal",
    "scraper_version": "gsa-realestate-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "gsa-re-53",
    "source_records": [
      {
        "sourceId": "gsa-realestate",
        "listingId": "53",
        "listingDate": null,
        "auctionDate": null,
        "state": "VT",
        "county": "Unknown",
        "town": "Montpelier",
        "propertyType": "commercial",
        "rawPropertyStyle": "Commercial",
        "exactAddress": "000 Coming Soon 87 State Street 87 State Street Montpelier",
        "zip": "05602",
        "price": 500000,
        "bedrooms": null,
        "yearBuilt": null,
        "squareFeet": null,
        "acreageText": null,
        "program": null,
        "description": "Commercial · Online Auction · GSA listing #53",
        "photoFile": null,
        "listingUrl": "https://realestatesales.gov/asset-details/?property_id=53",
        "isCurrent": true,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "gsa-realestate",
        "source_url": "https://realestatesales.gov/our-listing/",
        "fetched_at": "2026-06-10T23:40:10.092Z",
        "content_hash": "4044df5ea2e34f695140f7b09f555b139f04d7d7a758608e0b2ec653c642396e"
      }
    ],
    "listing_status": "AUCTION",
    "listing_history": [
      "GSA realestatesales.gov 2026-06-10"
    ],
    "confidence_score": 80,
    "source_id": "gsa-realestate",
    "source_name": "GSA — Federal surplus real property (realestatesales.gov)",
    "source_url": "https://realestatesales.gov/our-listing/",
    "fetched_at": "2026-06-10T23:40:10.092Z",
    "content_hash": "4044df5ea2e34f695140f7b09f555b139f04d7d7a758608e0b2ec653c642396e",
    "classification_level": "PUBLIC",
    "replay_ref": "gsa-re-53",
    "connector_id": "gsa-realestate-connector",
    "jurisdiction_scope": "federal",
    "scraper_version": "gsa-realestate-ingest-v0.1.0"
  }
];
