/**
 * gsaRealEstateGenerated — GENERATED FILE. Do not edit by hand.
 *
 * SERVER-ONLY: GSA federal surplus real-property AUCTION listings, parsed from
 * the official realestatesales.gov page (public domain). PENDING Module 22/23.
 *
 * Written by src/scripts/ingestGsaRealEstate.ts. Re-run `npm run ingest:gsa-realestate`.
 * Ingested at: 2026-07-17T16:15:54.771Z
 */

import type { CanonicalProperty } from "./propertyTypes";

export const GSA_RE_INGEST_PROVENANCE = {
  "fetchedAt": "2026-07-17T16:15:54.771Z",
  "feedUrl": "https://realestatesales.gov/our-listing/",
  "listed": 12,
  "current": 12,
  "license": "Public domain (U.S. Government work) — GSA realestatesales.gov",
  "scraperVersion": "gsa-realestate-ingest-v0.1.0"
} as const;

export const GSA_RE_PROPERTIES: CanonicalProperty[] = [
  {
    "canonical_property_id": "gsa-re-68",
    "source_records": [
      {
        "sourceId": "gsa-realestate",
        "listingId": "68",
        "listingDate": null,
        "auctionDate": null,
        "state": "CO",
        "county": "Unknown",
        "town": "Denver",
        "propertyType": "commercial",
        "rawPropertyStyle": "Commercial",
        "exactAddress": "dding Five Points Historic Garage Collection - Welton St. 2101 Welton St. Denver",
        "zip": "80205",
        "price": 120000,
        "bedrooms": null,
        "yearBuilt": null,
        "squareFeet": null,
        "acreageText": null,
        "program": null,
        "description": "Commercial · Online Auction · GSA listing #68",
        "photoFile": null,
        "listingUrl": "https://realestatesales.gov/asset-details/?property_id=68",
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
        "fetched_at": "2026-07-17T16:15:54.771Z",
        "content_hash": "a853bf89fa51dd3734b5880cd208e7db50144b1babce9a76a4462f8aaec4e26d"
      }
    ],
    "listing_status": "AUCTION",
    "listing_history": [
      "GSA realestatesales.gov 2026-07-17"
    ],
    "confidence_score": 80,
    "source_id": "gsa-realestate",
    "source_name": "GSA — Federal surplus real property (realestatesales.gov)",
    "source_url": "https://realestatesales.gov/our-listing/",
    "fetched_at": "2026-07-17T16:15:54.771Z",
    "content_hash": "a853bf89fa51dd3734b5880cd208e7db50144b1babce9a76a4462f8aaec4e26d",
    "classification_level": "PUBLIC",
    "replay_ref": "gsa-re-68",
    "connector_id": "gsa-realestate-connector",
    "jurisdiction_scope": "federal",
    "scraper_version": "gsa-realestate-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "gsa-re-67",
    "source_records": [
      {
        "sourceId": "gsa-realestate",
        "listingId": "67",
        "listingDate": null,
        "auctionDate": null,
        "state": "CO",
        "county": "Unknown",
        "town": "Denver",
        "propertyType": "commercial",
        "rawPropertyStyle": "Commercial",
        "exactAddress": "ve Points Historic Garage Collection - California St. 2106 California St. Denver",
        "zip": "80205",
        "price": 120000,
        "bedrooms": null,
        "yearBuilt": null,
        "squareFeet": null,
        "acreageText": null,
        "program": null,
        "description": "Commercial · Online Auction · GSA listing #67",
        "photoFile": null,
        "listingUrl": "https://realestatesales.gov/asset-details/?property_id=67",
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
        "fetched_at": "2026-07-17T16:15:54.771Z",
        "content_hash": "759fe5b23d2d06109c8ed9cbcbf65d5ab959eea30429f10622883673f5e77731"
      }
    ],
    "listing_status": "AUCTION",
    "listing_history": [
      "GSA realestatesales.gov 2026-07-17"
    ],
    "confidence_score": 80,
    "source_id": "gsa-realestate",
    "source_name": "GSA — Federal surplus real property (realestatesales.gov)",
    "source_url": "https://realestatesales.gov/our-listing/",
    "fetched_at": "2026-07-17T16:15:54.771Z",
    "content_hash": "759fe5b23d2d06109c8ed9cbcbf65d5ab959eea30429f10622883673f5e77731",
    "classification_level": "PUBLIC",
    "replay_ref": "gsa-re-67",
    "connector_id": "gsa-realestate-connector",
    "jurisdiction_scope": "federal",
    "scraper_version": "gsa-realestate-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "gsa-re-66",
    "source_records": [
      {
        "sourceId": "gsa-realestate",
        "listingId": "66",
        "listingDate": null,
        "auctionDate": null,
        "state": "DE",
        "county": "Unknown",
        "town": "Townsend",
        "propertyType": "other",
        "rawPropertyStyle": "GSA real property",
        "exactAddress": "ow Bidding Reedy Island Rear Range Light 1171 Taylor&#x27;s Bridge Road Townsend",
        "zip": "19734",
        "price": 5000,
        "bedrooms": null,
        "yearBuilt": null,
        "squareFeet": null,
        "acreageText": null,
        "program": null,
        "description": "Online Auction · GSA listing #66",
        "photoFile": null,
        "listingUrl": "https://realestatesales.gov/asset-details/?property_id=66",
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
        "fetched_at": "2026-07-17T16:15:54.771Z",
        "content_hash": "01342c9ad22cda076458072c3e14c3038c6f6ba8563634ec578100d8ad8ab235"
      }
    ],
    "listing_status": "AUCTION",
    "listing_history": [
      "GSA realestatesales.gov 2026-07-17"
    ],
    "confidence_score": 80,
    "source_id": "gsa-realestate",
    "source_name": "GSA — Federal surplus real property (realestatesales.gov)",
    "source_url": "https://realestatesales.gov/our-listing/",
    "fetched_at": "2026-07-17T16:15:54.771Z",
    "content_hash": "01342c9ad22cda076458072c3e14c3038c6f6ba8563634ec578100d8ad8ab235",
    "classification_level": "PUBLIC",
    "replay_ref": "gsa-re-66",
    "connector_id": "gsa-realestate-connector",
    "jurisdiction_scope": "federal",
    "scraper_version": "gsa-realestate-ingest-v0.1.0"
  },
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
        "price": 140000,
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
        "fetched_at": "2026-07-17T16:15:54.771Z",
        "content_hash": "f82ce8f23f26138bc83a0a45aa5dbaf818e60762ce01374ff9522d0bc6e3fe59"
      }
    ],
    "listing_status": "AUCTION",
    "listing_history": [
      "GSA realestatesales.gov 2026-07-17"
    ],
    "confidence_score": 80,
    "source_id": "gsa-realestate",
    "source_name": "GSA — Federal surplus real property (realestatesales.gov)",
    "source_url": "https://realestatesales.gov/our-listing/",
    "fetched_at": "2026-07-17T16:15:54.771Z",
    "content_hash": "f82ce8f23f26138bc83a0a45aa5dbaf818e60762ce01374ff9522d0bc6e3fe59",
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
        "price": 2325000,
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
        "fetched_at": "2026-07-17T16:15:54.771Z",
        "content_hash": "ef8e2e33097e5641b6a93f337f3c1c14be1b70ed071c7a78705bab5ebc16b40c"
      }
    ],
    "listing_status": "AUCTION",
    "listing_history": [
      "GSA realestatesales.gov 2026-07-17"
    ],
    "confidence_score": 80,
    "source_id": "gsa-realestate",
    "source_name": "GSA — Federal surplus real property (realestatesales.gov)",
    "source_url": "https://realestatesales.gov/our-listing/",
    "fetched_at": "2026-07-17T16:15:54.771Z",
    "content_hash": "ef8e2e33097e5641b6a93f337f3c1c14be1b70ed071c7a78705bab5ebc16b40c",
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
        "fetched_at": "2026-07-17T16:15:54.771Z",
        "content_hash": "eaa9523443710c2ee9c44371f5e22a27b742739e86d059aec5316fffa70f9c54"
      }
    ],
    "listing_status": "AUCTION",
    "listing_history": [
      "GSA realestatesales.gov 2026-07-17"
    ],
    "confidence_score": 80,
    "source_id": "gsa-realestate",
    "source_name": "GSA — Federal surplus real property (realestatesales.gov)",
    "source_url": "https://realestatesales.gov/our-listing/",
    "fetched_at": "2026-07-17T16:15:54.771Z",
    "content_hash": "eaa9523443710c2ee9c44371f5e22a27b742739e86d059aec5316fffa70f9c54",
    "classification_level": "PUBLIC",
    "replay_ref": "gsa-re-54",
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
        "exactAddress": "Today 2107 Jackson St - USCG Port Lavaca Housing 2107 Jackson Street Port Lavaca",
        "zip": "77979",
        "price": 115000,
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
        "fetched_at": "2026-07-17T16:15:54.771Z",
        "content_hash": "472d4c33ee9cec32962c1186ea4b5109ee64af18fbb29759d6d4498a92e60653"
      }
    ],
    "listing_status": "AUCTION",
    "listing_history": [
      "GSA realestatesales.gov 2026-07-17"
    ],
    "confidence_score": 80,
    "source_id": "gsa-realestate",
    "source_name": "GSA — Federal surplus real property (realestatesales.gov)",
    "source_url": "https://realestatesales.gov/our-listing/",
    "fetched_at": "2026-07-17T16:15:54.771Z",
    "content_hash": "472d4c33ee9cec32962c1186ea4b5109ee64af18fbb29759d6d4498a92e60653",
    "classification_level": "PUBLIC",
    "replay_ref": "gsa-re-59",
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
        "exactAddress": "Today 1712 Jackson St - USCG Port Lavaca Housing 1712 Jackson Street Port Lavaca",
        "zip": "77979",
        "price": 115000,
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
        "fetched_at": "2026-07-17T16:15:54.771Z",
        "content_hash": "1a443bf28405db827733e05572e3db0751adfe92ea67bac23d363157d1ee2554"
      }
    ],
    "listing_status": "AUCTION",
    "listing_history": [
      "GSA realestatesales.gov 2026-07-17"
    ],
    "confidence_score": 80,
    "source_id": "gsa-realestate",
    "source_name": "GSA — Federal surplus real property (realestatesales.gov)",
    "source_url": "https://realestatesales.gov/our-listing/",
    "fetched_at": "2026-07-17T16:15:54.771Z",
    "content_hash": "1a443bf28405db827733e05572e3db0751adfe92ea67bac23d363157d1ee2554",
    "classification_level": "PUBLIC",
    "replay_ref": "gsa-re-56",
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
        "price": 125000,
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
        "fetched_at": "2026-07-17T16:15:54.771Z",
        "content_hash": "48c39101e4f77b10e7c2b5d2d1290986b22a0338c2cc1fa88bb7363f3e776759"
      }
    ],
    "listing_status": "AUCTION",
    "listing_history": [
      "GSA realestatesales.gov 2026-07-17"
    ],
    "confidence_score": 80,
    "source_id": "gsa-realestate",
    "source_name": "GSA — Federal surplus real property (realestatesales.gov)",
    "source_url": "https://realestatesales.gov/our-listing/",
    "fetched_at": "2026-07-17T16:15:54.771Z",
    "content_hash": "48c39101e4f77b10e7c2b5d2d1290986b22a0338c2cc1fa88bb7363f3e776759",
    "classification_level": "PUBLIC",
    "replay_ref": "gsa-re-57",
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
        "price": 145000,
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
        "fetched_at": "2026-07-17T16:15:54.771Z",
        "content_hash": "3378bfd9503b7c6647759377c1ef293cc7e2233e44c63347ba97f09c3dd85bc3"
      }
    ],
    "listing_status": "AUCTION",
    "listing_history": [
      "GSA realestatesales.gov 2026-07-17"
    ],
    "confidence_score": 80,
    "source_id": "gsa-realestate",
    "source_name": "GSA — Federal surplus real property (realestatesales.gov)",
    "source_url": "https://realestatesales.gov/our-listing/",
    "fetched_at": "2026-07-17T16:15:54.771Z",
    "content_hash": "3378bfd9503b7c6647759377c1ef293cc7e2233e44c63347ba97f09c3dd85bc3",
    "classification_level": "PUBLIC",
    "replay_ref": "gsa-re-62",
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
        "price": 12000,
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
        "fetched_at": "2026-07-17T16:15:54.771Z",
        "content_hash": "bbcb71f0a7f943a59d30f43db6f30c584d7a3375af692088378e77efb73f00de"
      }
    ],
    "listing_status": "AUCTION",
    "listing_history": [
      "GSA realestatesales.gov 2026-07-17"
    ],
    "confidence_score": 80,
    "source_id": "gsa-realestate",
    "source_name": "GSA — Federal surplus real property (realestatesales.gov)",
    "source_url": "https://realestatesales.gov/our-listing/",
    "fetched_at": "2026-07-17T16:15:54.771Z",
    "content_hash": "bbcb71f0a7f943a59d30f43db6f30c584d7a3375af692088378e77efb73f00de",
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
        "exactAddress": "000 Now Bidding 87 State Street 87 State Street Montpelier",
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
        "fetched_at": "2026-07-17T16:15:54.771Z",
        "content_hash": "e237e767b3740450844d5bf2f60d3da7fbc9df13505f93098cc4f5fc693722b4"
      }
    ],
    "listing_status": "AUCTION",
    "listing_history": [
      "GSA realestatesales.gov 2026-07-17"
    ],
    "confidence_score": 80,
    "source_id": "gsa-realestate",
    "source_name": "GSA — Federal surplus real property (realestatesales.gov)",
    "source_url": "https://realestatesales.gov/our-listing/",
    "fetched_at": "2026-07-17T16:15:54.771Z",
    "content_hash": "e237e767b3740450844d5bf2f60d3da7fbc9df13505f93098cc4f5fc693722b4",
    "classification_level": "PUBLIC",
    "replay_ref": "gsa-re-53",
    "connector_id": "gsa-realestate-connector",
    "jurisdiction_scope": "federal",
    "scraper_version": "gsa-realestate-ingest-v0.1.0"
  }
];
