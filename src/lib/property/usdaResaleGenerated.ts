/**
 * usdaResaleGenerated — GENERATED FILE. Do not edit by hand.
 *
 * SERVER-ONLY: contains exact addresses. Import only from server code (the
 * Property hub detail view). The homepage map imports usdaPublicSafeGenerated.ts.
 *
 * Written by src/scripts/ingestUsdaResale.ts from the official USDA Rural
 * Development resale open dataset on data.gov (CC0 1.0 public domain). The live
 * HTML portal is NOT scraped. Re-run `npm run ingest:usda-resale` to refresh.
 *
 * Ingested at: 2026-07-17T16:15:57.094Z
 * Vintage: USDA last refreshed these feeds in 2022 (listings dated 2014–2018);
 * each record keeps its own listingDate so display shows vintage honestly.
 *
 * NOT shown publicly until Module 22 + Module 23 are APPROVED
 * (src/lib/property/sourceActivation.ts). Until then sourceLive=false.
 */

import type { CanonicalProperty } from "./propertyTypes";

export const USDA_INGEST_PROVENANCE = {
  "fetchedAt": "2026-07-17T16:15:57.094Z",
  "feeds": [
    {
      "feed": "REO",
      "url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
      "lastModified": "Tue, 24 May 2022 18:30:58 GMT",
      "rows": 103,
      "parsed": 103
    }
  ],
  "deferredFeeds": [
    {
      "kind": "FCL",
      "url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHFOREData9-7-18.txt",
      "reason": "fixed-width columnar with no published column spec — deferred to avoid corrupt parsing"
    }
  ],
  "license": "CC0 1.0",
  "scraperVersion": "usda-resale-ingest-v0.1.0"
} as const;

export const USDA_RESALE_PROPERTIES: CanonicalProperty[] = [
  {
    "canonical_property_id": "usda-9080197194",
    "source_records": [
      {
        "sourceId": "usda",
        "listingId": "9080197194",
        "listingDate": "2018-08-24",
        "state": "AZ",
        "county": "Mohave",
        "town": "Fredonia",
        "propertyType": "home",
        "rawPropertyStyle": "Ranch-Frame",
        "exactAddress": "285 E Pratt St",
        "zip": "86022",
        "price": 103950,
        "bedrooms": 3,
        "yearBuilt": 9,
        "squareFeet": 1383,
        "acreageText": "21363",
        "program": "Direct",
        "description": "Questions regarding the sale of this property should be directed to Ryan Kocher at ryan.kocher@ut.usda.gov or 435-868-3949",
        "photoFile": "9080197194A.jpg",
        "listingUrl": "https://www.resales.usda.gov/resales/public/home",
        "isCurrent": false,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "usda",
        "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
        "fetched_at": "2026-07-17T16:15:57.094Z",
        "content_hash": "2a0262aee5c0af2812d7df6b6f82ea99505f1d212b31a60191285c30967612ad"
      }
    ],
    "listing_status": "FOR_SALE",
    "listing_history": [
      "REO snapshot 2018-08-24"
    ],
    "confidence_score": 100,
    "source_id": "usda",
    "source_name": "USDA Rural Development / FSA",
    "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
    "fetched_at": "2026-07-17T16:15:57.094Z",
    "content_hash": "2a0262aee5c0af2812d7df6b6f82ea99505f1d212b31a60191285c30967612ad",
    "classification_level": "PUBLIC",
    "replay_ref": "usda-replay-p9080197194",
    "connector_id": "usda-connector",
    "jurisdiction_scope": "federal,state,county",
    "scraper_version": "usda-resale-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "usda-9080197178",
    "source_records": [
      {
        "sourceId": "usda",
        "listingId": "9080197178",
        "listingDate": "2018-08-24",
        "state": "AZ",
        "county": "Mohave",
        "town": "Fredonia",
        "propertyType": "home",
        "rawPropertyStyle": "Manufactured Home",
        "exactAddress": "760 Riddle",
        "zip": "86022",
        "price": 65450,
        "bedrooms": 4,
        "yearBuilt": 9,
        "squareFeet": 1512,
        "acreageText": "12520",
        "program": "Direct",
        "description": "Questions regarding the sale of this property should be directed to Ryan Kocher at ryan.kocher@ut.usda.gov or 435-868-3949.",
        "photoFile": "9080197178A.jpg",
        "listingUrl": "https://www.resales.usda.gov/resales/public/home",
        "isCurrent": false,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "usda",
        "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
        "fetched_at": "2026-07-17T16:15:57.094Z",
        "content_hash": "c0f30a4cac63dc7277102ec43ee59c49b80ee0fe05fbf6101153c178d4ec8692"
      }
    ],
    "listing_status": "FOR_SALE",
    "listing_history": [
      "REO snapshot 2018-08-24"
    ],
    "confidence_score": 100,
    "source_id": "usda",
    "source_name": "USDA Rural Development / FSA",
    "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
    "fetched_at": "2026-07-17T16:15:57.094Z",
    "content_hash": "c0f30a4cac63dc7277102ec43ee59c49b80ee0fe05fbf6101153c178d4ec8692",
    "classification_level": "PUBLIC",
    "replay_ref": "usda-replay-p9080197178",
    "connector_id": "usda-connector",
    "jurisdiction_scope": "federal,state,county",
    "scraper_version": "usda-resale-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "usda-9035588172",
    "source_records": [
      {
        "sourceId": "usda",
        "listingId": "9035588172",
        "listingDate": "2018-05-10",
        "state": "AZ",
        "county": "Cochise",
        "town": "Douglas",
        "propertyType": "home",
        "rawPropertyStyle": "Ranch-Frame",
        "exactAddress": "2700 E 6th Street",
        "zip": "85607",
        "price": 91887,
        "bedrooms": 3,
        "yearBuilt": 12,
        "squareFeet": 1403,
        "acreageText": "6098",
        "program": "Direct",
        "description": "for information contact Willcox RD office at 520-384-3529 ext. 4",
        "photoFile": null,
        "listingUrl": "https://www.resales.usda.gov/resales/public/home",
        "isCurrent": false,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "usda",
        "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
        "fetched_at": "2026-07-17T16:15:57.094Z",
        "content_hash": "78ce9622621e339dc5fe8d1573aac169e3718637bfc1c114d68f1a8bae6ccc71"
      }
    ],
    "listing_status": "FOR_SALE",
    "listing_history": [
      "REO snapshot 2018-05-10"
    ],
    "confidence_score": 100,
    "source_id": "usda",
    "source_name": "USDA Rural Development / FSA",
    "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
    "fetched_at": "2026-07-17T16:15:57.094Z",
    "content_hash": "78ce9622621e339dc5fe8d1573aac169e3718637bfc1c114d68f1a8bae6ccc71",
    "classification_level": "PUBLIC",
    "replay_ref": "usda-replay-p9035588172",
    "connector_id": "usda-connector",
    "jurisdiction_scope": "federal,state,county",
    "scraper_version": "usda-resale-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "usda-9040509382",
    "source_records": [
      {
        "sourceId": "usda",
        "listingId": "9040509382",
        "listingDate": "2018-03-08",
        "state": "AZ",
        "county": "Graham",
        "town": "Douglas",
        "propertyType": "home",
        "rawPropertyStyle": "Ranch-Frame",
        "exactAddress": "2326 E 14th Street",
        "zip": "85607",
        "price": 82180,
        "bedrooms": 3,
        "yearBuilt": 58,
        "squareFeet": 1584,
        "acreageText": "10650",
        "program": "Direct",
        "description": "there will be Deed Restrictions on property till all health and safely hazards have been deemed corrected. please contact the RD Willcox office at 520-384-3529 for any questions.",
        "photoFile": null,
        "listingUrl": "https://www.resales.usda.gov/resales/public/home",
        "isCurrent": false,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "usda",
        "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
        "fetched_at": "2026-07-17T16:15:57.094Z",
        "content_hash": "8c2b5cdfcd5f738c21871eee36dbad6818203c8e3ed18be204cdcb3cbed43e91"
      }
    ],
    "listing_status": "FOR_SALE",
    "listing_history": [
      "REO snapshot 2018-03-08"
    ],
    "confidence_score": 100,
    "source_id": "usda",
    "source_name": "USDA Rural Development / FSA",
    "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
    "fetched_at": "2026-07-17T16:15:57.094Z",
    "content_hash": "8c2b5cdfcd5f738c21871eee36dbad6818203c8e3ed18be204cdcb3cbed43e91",
    "classification_level": "PUBLIC",
    "replay_ref": "usda-replay-p9040509382",
    "connector_id": "usda-connector",
    "jurisdiction_scope": "federal,state,county",
    "scraper_version": "usda-resale-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "usda-9003045663",
    "source_records": [
      {
        "sourceId": "usda",
        "listingId": "9003045663",
        "listingDate": "2015-06-18",
        "state": "CA",
        "county": "Riverside",
        "town": "Blythe",
        "propertyType": "home",
        "rawPropertyStyle": "Ranch-Frame",
        "exactAddress": "629 Arroyo Vista",
        "zip": "92225",
        "price": 84000,
        "bedrooms": 3,
        "yearBuilt": 22,
        "squareFeet": 1399,
        "acreageText": "6534",
        "program": "Direct",
        "description": "call 760-347-3675 Ext 4. Single Family Housing",
        "photoFile": "9003045663A.jpg",
        "listingUrl": "https://www.resales.usda.gov/resales/public/home",
        "isCurrent": false,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "usda",
        "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
        "fetched_at": "2026-07-17T16:15:57.094Z",
        "content_hash": "3367ff27a382a84aca30ab02c2f39aa6701b63442d26c95a4a45cb65dd05eb5d"
      }
    ],
    "listing_status": "FOR_SALE",
    "listing_history": [
      "REO snapshot 2015-06-18"
    ],
    "confidence_score": 100,
    "source_id": "usda",
    "source_name": "USDA Rural Development / FSA",
    "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
    "fetched_at": "2026-07-17T16:15:57.094Z",
    "content_hash": "3367ff27a382a84aca30ab02c2f39aa6701b63442d26c95a4a45cb65dd05eb5d",
    "classification_level": "PUBLIC",
    "replay_ref": "usda-replay-p9003045663",
    "connector_id": "usda-connector",
    "jurisdiction_scope": "federal,state,county",
    "scraper_version": "usda-resale-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "usda-9001997289",
    "source_records": [
      {
        "sourceId": "usda",
        "listingId": "9001997289",
        "listingDate": "2017-09-26",
        "state": "FL",
        "county": "Escambia",
        "town": "Walnut Hill",
        "propertyType": "home",
        "rawPropertyStyle": "Ranch-Frame",
        "exactAddress": "47 N Cypress",
        "zip": "32568",
        "price": 54209,
        "bedrooms": 3,
        "yearBuilt": 1994,
        "squareFeet": 1260,
        "acreageText": ".5 acre",
        "program": "Direct",
        "description": "Contact Realtor Elisabeth Romanik 305-205-4538",
        "photoFile": "9001997289A.jpg",
        "listingUrl": "https://www.resales.usda.gov/resales/public/home",
        "isCurrent": false,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "usda",
        "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
        "fetched_at": "2026-07-17T16:15:57.094Z",
        "content_hash": "c7bfa686227e8e62ccaf8502008e5325e8508cd25fcf7a0abaed2c9a86af7c78"
      }
    ],
    "listing_status": "FOR_SALE",
    "listing_history": [
      "REO snapshot 2017-09-26"
    ],
    "confidence_score": 100,
    "source_id": "usda",
    "source_name": "USDA Rural Development / FSA",
    "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
    "fetched_at": "2026-07-17T16:15:57.094Z",
    "content_hash": "c7bfa686227e8e62ccaf8502008e5325e8508cd25fcf7a0abaed2c9a86af7c78",
    "classification_level": "PUBLIC",
    "replay_ref": "usda-replay-p9001997289",
    "connector_id": "usda-connector",
    "jurisdiction_scope": "federal,state,county",
    "scraper_version": "usda-resale-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "usda-9082091573",
    "source_records": [
      {
        "sourceId": "usda",
        "listingId": "9082091573",
        "listingDate": "2018-08-28",
        "state": "FL",
        "county": "Lake",
        "town": "Eustis",
        "propertyType": "home",
        "rawPropertyStyle": "Ranch",
        "exactAddress": "1703 Hollywood Ave",
        "zip": "32726",
        "price": 62662,
        "bedrooms": 3,
        "yearBuilt": 2006,
        "squareFeet": 1177,
        "acreageText": "13039",
        "program": "Direct",
        "description": "Block home; Average condition; Property sold \"as-is\". Please contact Elisabeth Romanik at 305.205.4538 for more information",
        "photoFile": null,
        "listingUrl": "https://www.resales.usda.gov/resales/public/home",
        "isCurrent": false,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "usda",
        "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
        "fetched_at": "2026-07-17T16:15:57.094Z",
        "content_hash": "b9bb82ea54b445538a0567f5bd3421e10085782f081847b11897313742d8ba82"
      }
    ],
    "listing_status": "SALE_PENDING",
    "listing_history": [
      "REO snapshot 2018-08-28"
    ],
    "confidence_score": 100,
    "source_id": "usda",
    "source_name": "USDA Rural Development / FSA",
    "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
    "fetched_at": "2026-07-17T16:15:57.094Z",
    "content_hash": "b9bb82ea54b445538a0567f5bd3421e10085782f081847b11897313742d8ba82",
    "classification_level": "PUBLIC",
    "replay_ref": "usda-replay-p9082091573",
    "connector_id": "usda-connector",
    "jurisdiction_scope": "federal,state,county",
    "scraper_version": "usda-resale-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "usda-9032769428",
    "source_records": [
      {
        "sourceId": "usda",
        "listingId": "9032769428",
        "listingDate": "2017-03-13",
        "state": "FL",
        "county": "Gadsden",
        "town": "Havana",
        "propertyType": "home",
        "rawPropertyStyle": "Ranch-Frame",
        "exactAddress": "115 Louis Street",
        "zip": "32333",
        "price": 70000,
        "bedrooms": 3,
        "yearBuilt": 16,
        "squareFeet": 1152,
        "acreageText": "14018",
        "program": "Direct",
        "description": "Listed 3/14/2017 for $70,000.00. Contact Elisabeth Romanik, Licensed RE Broker Sourcing & Asset Management, LLC - Phone: (305)205-4538 Email: Elisabeth@SourcingAndAssetManagement. com.\n\nFor program eligibility requirements to finance through USDA or for more specific information, please contact your local USDA/Rural Development Office.",
        "photoFile": "9032769428A.jpg",
        "listingUrl": "https://www.resales.usda.gov/resales/public/home",
        "isCurrent": false,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "usda",
        "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
        "fetched_at": "2026-07-17T16:15:57.094Z",
        "content_hash": "b84539240f26ef08a93b1b6ae9c7881ada32f2531421f9ac1baf8aae43f9aae6"
      }
    ],
    "listing_status": "FOR_SALE",
    "listing_history": [
      "REO snapshot 2017-03-13"
    ],
    "confidence_score": 100,
    "source_id": "usda",
    "source_name": "USDA Rural Development / FSA",
    "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
    "fetched_at": "2026-07-17T16:15:57.094Z",
    "content_hash": "b84539240f26ef08a93b1b6ae9c7881ada32f2531421f9ac1baf8aae43f9aae6",
    "classification_level": "PUBLIC",
    "replay_ref": "usda-replay-p9032769428",
    "connector_id": "usda-connector",
    "jurisdiction_scope": "federal,state,county",
    "scraper_version": "usda-resale-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "usda-02432000",
    "source_records": [
      {
        "sourceId": "usda",
        "listingId": "02432000",
        "listingDate": "2018-08-06",
        "state": "FL",
        "county": "Taylor",
        "town": "Perry",
        "propertyType": "home",
        "rawPropertyStyle": "Ranch",
        "exactAddress": "778 Sam Poppell Road",
        "zip": "32347",
        "price": 69660,
        "bedrooms": 2,
        "yearBuilt": 8,
        "squareFeet": 960,
        "acreageText": "21,632",
        "program": "Direct",
        "description": "If you are interested in seeing the house please contact Charles Caldwell @ USDA, Ph. # 386-719-5590, Ext. 3523",
        "photoFile": "02432000A.jpg",
        "listingUrl": "https://www.resales.usda.gov/resales/public/home",
        "isCurrent": false,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "usda",
        "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
        "fetched_at": "2026-07-17T16:15:57.094Z",
        "content_hash": "a1750b34b569e242b13d677e736e4168b2d02bb27d5740e6105e6a2927d87646"
      }
    ],
    "listing_status": "FOR_SALE",
    "listing_history": [
      "REO snapshot 2018-08-06"
    ],
    "confidence_score": 100,
    "source_id": "usda",
    "source_name": "USDA Rural Development / FSA",
    "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
    "fetched_at": "2026-07-17T16:15:57.094Z",
    "content_hash": "a1750b34b569e242b13d677e736e4168b2d02bb27d5740e6105e6a2927d87646",
    "classification_level": "PUBLIC",
    "replay_ref": "usda-replay-p02432000",
    "connector_id": "usda-connector",
    "jurisdiction_scope": "federal,state,county",
    "scraper_version": "usda-resale-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "usda-6779000",
    "source_records": [
      {
        "sourceId": "usda",
        "listingId": "6779000",
        "listingDate": "2018-08-01",
        "state": "FL",
        "county": "Hamilton",
        "town": "Jasper",
        "propertyType": "home",
        "rawPropertyStyle": "Ranch",
        "exactAddress": "422 Vickers Court",
        "zip": "32052",
        "price": 29160,
        "bedrooms": 3,
        "yearBuilt": 47,
        "squareFeet": 1351,
        "acreageText": "11,746",
        "program": "Direct",
        "description": "If you are interested in seeing the house please contact Charles Caldwell @ 386-719-5590, Ext. 3523",
        "photoFile": "6779000A.jpg",
        "listingUrl": "https://www.resales.usda.gov/resales/public/home",
        "isCurrent": false,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "usda",
        "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
        "fetched_at": "2026-07-17T16:15:57.094Z",
        "content_hash": "a41d0195bc7a20b003ddb2ab9010e19f321fd4f99468d1747d856324c56d42ae"
      }
    ],
    "listing_status": "FOR_SALE",
    "listing_history": [
      "REO snapshot 2018-08-01"
    ],
    "confidence_score": 100,
    "source_id": "usda",
    "source_name": "USDA Rural Development / FSA",
    "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
    "fetched_at": "2026-07-17T16:15:57.094Z",
    "content_hash": "a41d0195bc7a20b003ddb2ab9010e19f321fd4f99468d1747d856324c56d42ae",
    "classification_level": "PUBLIC",
    "replay_ref": "usda-replay-p6779000",
    "connector_id": "usda-connector",
    "jurisdiction_scope": "federal,state,county",
    "scraper_version": "usda-resale-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "usda-9082156573",
    "source_records": [
      {
        "sourceId": "usda",
        "listingId": "9082156573",
        "listingDate": "2018-03-16",
        "state": "FL",
        "county": "Jackson",
        "town": "Greenwood",
        "propertyType": "home",
        "rawPropertyStyle": "Ranch-Frame",
        "exactAddress": "5579 Willis Road",
        "zip": "32443",
        "price": 37667,
        "bedrooms": 3,
        "yearBuilt": 11,
        "squareFeet": 1139,
        "acreageText": "100x",
        "program": "Direct",
        "description": "Contact Elisabeth Romanik, Licensed RE Broker Sourcing & Asset Management LLC Phone: (305)205-4538 Email: Elisabeth@SourcingAndManagement.com.",
        "photoFile": "9082156573A.jpg",
        "listingUrl": "https://www.resales.usda.gov/resales/public/home",
        "isCurrent": false,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "usda",
        "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
        "fetched_at": "2026-07-17T16:15:57.094Z",
        "content_hash": "1ef97df8667f4fb7aa5697318cade38d68bd78cfad4a95318c377f40ac43c5fb"
      }
    ],
    "listing_status": "FOR_SALE",
    "listing_history": [
      "REO snapshot 2018-03-16"
    ],
    "confidence_score": 100,
    "source_id": "usda",
    "source_name": "USDA Rural Development / FSA",
    "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
    "fetched_at": "2026-07-17T16:15:57.094Z",
    "content_hash": "1ef97df8667f4fb7aa5697318cade38d68bd78cfad4a95318c377f40ac43c5fb",
    "classification_level": "PUBLIC",
    "replay_ref": "usda-replay-p9082156573",
    "connector_id": "usda-connector",
    "jurisdiction_scope": "federal,state,county",
    "scraper_version": "usda-resale-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "usda-26040705157025",
    "source_records": [
      {
        "sourceId": "usda",
        "listingId": "26040705157025",
        "listingDate": "2017-11-30",
        "state": "FL",
        "county": "Taylor",
        "town": "Perry",
        "propertyType": "home",
        "rawPropertyStyle": "Ranch-Brick",
        "exactAddress": "305 Sandra Street",
        "zip": "32347",
        "price": 41923,
        "bedrooms": 3,
        "yearBuilt": 29,
        "squareFeet": 1337,
        "acreageText": "12197",
        "program": "Direct",
        "description": "This property has special use restrictions or other covenants or notice.",
        "photoFile": "26040705157025A.jpg",
        "listingUrl": "https://www.resales.usda.gov/resales/public/home",
        "isCurrent": false,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "usda",
        "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
        "fetched_at": "2026-07-17T16:15:57.094Z",
        "content_hash": "3049208c93098916aff3ce76227a50887d689d22433fe8fed2516ddfbcca344b"
      }
    ],
    "listing_status": "FOR_SALE",
    "listing_history": [
      "REO snapshot 2017-11-30"
    ],
    "confidence_score": 100,
    "source_id": "usda",
    "source_name": "USDA Rural Development / FSA",
    "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
    "fetched_at": "2026-07-17T16:15:57.094Z",
    "content_hash": "3049208c93098916aff3ce76227a50887d689d22433fe8fed2516ddfbcca344b",
    "classification_level": "PUBLIC",
    "replay_ref": "usda-replay-p26040705157025",
    "connector_id": "usda-connector",
    "jurisdiction_scope": "federal,state,county",
    "scraper_version": "usda-resale-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "usda-1870080760000",
    "source_records": [
      {
        "sourceId": "usda",
        "listingId": "1870080760000",
        "listingDate": "2017-06-16",
        "state": "HI",
        "county": "Honolulu",
        "town": "Waianae",
        "propertyType": "home",
        "rawPropertyStyle": "Single-family home",
        "exactAddress": "Portion Lot 5 - Nanakuli",
        "zip": "96729",
        "price": 3183300,
        "bedrooms": null,
        "yearBuilt": null,
        "squareFeet": null,
        "acreageText": "539621",
        "program": "Direct",
        "description": "PRICE REDUCED:  12.388 acres available for sale.  Property shall not exceed 144 dwelling units; participate w/ City Depart of Hsg & Comm Dev affordable housing prog; subject to \"10-Year Buy-Back\" & \"1st Option & Shared Appreciation in Value\" provisions & provide a fair share contribution for the dev of public school facilities.  Deposit 10% of purchase price.  Assessed value $9,639,600.  Mail offer:  USDA RD ATTN:  REO, 154 Waianuenue Ave #311, Hilo, HI 96720.  Questions contact 808-933-8330.  OFFER  DUE:  08/21/2017",
        "photoFile": "1870080760000A.jpg",
        "listingUrl": "https://www.resales.usda.gov/resales/public/home",
        "isCurrent": false,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "usda",
        "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
        "fetched_at": "2026-07-17T16:15:57.094Z",
        "content_hash": "a56bdc123c136fcddb73f75a9480a433f6dff95e982d2db3343d9c1e7cc34e04"
      }
    ],
    "listing_status": "FOR_SALE",
    "listing_history": [
      "REO snapshot 2017-06-16"
    ],
    "confidence_score": 100,
    "source_id": "usda",
    "source_name": "USDA Rural Development / FSA",
    "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
    "fetched_at": "2026-07-17T16:15:57.094Z",
    "content_hash": "a56bdc123c136fcddb73f75a9480a433f6dff95e982d2db3343d9c1e7cc34e04",
    "classification_level": "PUBLIC",
    "replay_ref": "usda-replay-p1870080760000",
    "connector_id": "usda-connector",
    "jurisdiction_scope": "federal,state,county",
    "scraper_version": "usda-resale-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "usda-9037752171",
    "source_records": [
      {
        "sourceId": "usda",
        "listingId": "9037752171",
        "listingDate": "2018-03-20",
        "state": "ID",
        "county": "Elmore",
        "town": "Glenns Ferry",
        "propertyType": "home",
        "rawPropertyStyle": "Manufactured Home",
        "exactAddress": "511 E 5th Ave",
        "zip": "83623",
        "price": 49770,
        "bedrooms": 3,
        "yearBuilt": 22,
        "squareFeet": 1040,
        "acreageText": "8400",
        "program": "Direct",
        "description": "Handicap Access Ramp",
        "photoFile": "9037752171A.jpg",
        "listingUrl": "https://www.resales.usda.gov/resales/public/home",
        "isCurrent": false,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "usda",
        "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
        "fetched_at": "2026-07-17T16:15:57.094Z",
        "content_hash": "ad95d885bf75f95269f8c031d7c4aaae3d808235564f887c281e59f035c30a1b"
      }
    ],
    "listing_status": "FOR_SALE",
    "listing_history": [
      "REO snapshot 2018-03-20"
    ],
    "confidence_score": 100,
    "source_id": "usda",
    "source_name": "USDA Rural Development / FSA",
    "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
    "fetched_at": "2026-07-17T16:15:57.094Z",
    "content_hash": "ad95d885bf75f95269f8c031d7c4aaae3d808235564f887c281e59f035c30a1b",
    "classification_level": "PUBLIC",
    "replay_ref": "usda-replay-p9037752171",
    "connector_id": "usda-connector",
    "jurisdiction_scope": "federal,state,county",
    "scraper_version": "usda-resale-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "usda-9030108256",
    "source_records": [
      {
        "sourceId": "usda",
        "listingId": "9030108256",
        "listingDate": "2014-10-16",
        "state": "IN",
        "county": "Scott",
        "town": "Austin",
        "propertyType": "home",
        "rawPropertyStyle": "Ranch-Brick",
        "exactAddress": "3378 N Thomastown Rd",
        "zip": "47102",
        "price": 52600,
        "bedrooms": 3,
        "yearBuilt": 38,
        "squareFeet": 1108,
        "acreageText": "13050",
        "program": "Direct",
        "description": null,
        "photoFile": "9030108256A.jpg",
        "listingUrl": "https://www.resales.usda.gov/resales/public/home",
        "isCurrent": false,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "usda",
        "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
        "fetched_at": "2026-07-17T16:15:57.094Z",
        "content_hash": "6883a15b8454fb1d5aa4b784ff00683f7ac0df37b0d366911267eefccee450e7"
      }
    ],
    "listing_status": "FOR_SALE",
    "listing_history": [
      "REO snapshot 2014-10-16"
    ],
    "confidence_score": 100,
    "source_id": "usda",
    "source_name": "USDA Rural Development / FSA",
    "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
    "fetched_at": "2026-07-17T16:15:57.094Z",
    "content_hash": "6883a15b8454fb1d5aa4b784ff00683f7ac0df37b0d366911267eefccee450e7",
    "classification_level": "PUBLIC",
    "replay_ref": "usda-replay-p9030108256",
    "connector_id": "usda-connector",
    "jurisdiction_scope": "federal,state,county",
    "scraper_version": "usda-resale-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "usda-9033561285",
    "source_records": [
      {
        "sourceId": "usda",
        "listingId": "9033561285",
        "listingDate": "2013-10-22",
        "state": "IN",
        "county": "Whitley",
        "town": "Columbia",
        "propertyType": "home",
        "rawPropertyStyle": "Ranch-Frame",
        "exactAddress": "1590 South SR 9",
        "zip": "46725",
        "price": 60000,
        "bedrooms": 3,
        "yearBuilt": 25,
        "squareFeet": 1436,
        "acreageText": "30780",
        "program": "Direct",
        "description": null,
        "photoFile": "9033561285A.jpg",
        "listingUrl": "https://www.resales.usda.gov/resales/public/home",
        "isCurrent": false,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "usda",
        "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
        "fetched_at": "2026-07-17T16:15:57.094Z",
        "content_hash": "ea62d2d5fdff36f647c3a75cd35ae7c0686b5aab1a877afe293f046efaa2b8e4"
      }
    ],
    "listing_status": "FOR_SALE",
    "listing_history": [
      "REO snapshot 2013-10-22"
    ],
    "confidence_score": 100,
    "source_id": "usda",
    "source_name": "USDA Rural Development / FSA",
    "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
    "fetched_at": "2026-07-17T16:15:57.094Z",
    "content_hash": "ea62d2d5fdff36f647c3a75cd35ae7c0686b5aab1a877afe293f046efaa2b8e4",
    "classification_level": "PUBLIC",
    "replay_ref": "usda-replay-p9033561285",
    "connector_id": "usda-connector",
    "jurisdiction_scope": "federal,state,county",
    "scraper_version": "usda-resale-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "usda-60000",
    "source_records": [
      {
        "sourceId": "usda",
        "listingId": "60000",
        "listingDate": "2015-04-16",
        "state": "IN",
        "county": "Cass",
        "town": "Logansport",
        "propertyType": "home",
        "rawPropertyStyle": "2 Story-Frame",
        "exactAddress": "1801 E Market St",
        "zip": "46947",
        "price": 60000,
        "bedrooms": 3,
        "yearBuilt": 45,
        "squareFeet": 972,
        "acreageText": "6765",
        "program": "Direct",
        "description": null,
        "photoFile": null,
        "listingUrl": "https://www.resales.usda.gov/resales/public/home",
        "isCurrent": false,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "usda",
        "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
        "fetched_at": "2026-07-17T16:15:57.094Z",
        "content_hash": "1aa9a52056006cf94806b910bd72630e7272206503b1110a6d8ac9bf93a3ffd1"
      }
    ],
    "listing_status": "SALE_PENDING",
    "listing_history": [
      "REO snapshot 2015-04-16"
    ],
    "confidence_score": 100,
    "source_id": "usda",
    "source_name": "USDA Rural Development / FSA",
    "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
    "fetched_at": "2026-07-17T16:15:57.094Z",
    "content_hash": "1aa9a52056006cf94806b910bd72630e7272206503b1110a6d8ac9bf93a3ffd1",
    "classification_level": "PUBLIC",
    "replay_ref": "usda-replay-p60000",
    "connector_id": "usda-connector",
    "jurisdiction_scope": "federal,state,county",
    "scraper_version": "usda-resale-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "usda-9037620452",
    "source_records": [
      {
        "sourceId": "usda",
        "listingId": "9037620452",
        "listingDate": "2018-07-05",
        "state": "KS",
        "county": "Sherman",
        "town": "Goodland",
        "propertyType": "home",
        "rawPropertyStyle": "Ranch-Frame",
        "exactAddress": "810 Washington",
        "zip": "67735",
        "price": 47975,
        "bedrooms": 3,
        "yearBuilt": 52,
        "squareFeet": 975,
        "acreageText": "65x105",
        "program": "Direct",
        "description": "Contact Homeland Realty & Auction (785-899-3060) or Richardson's Homestead Realty (785-899-2328) to view the property. Sold As-Is. Repairs needed. Contact our office with any additional questions.",
        "photoFile": "9037620452A.jpg",
        "listingUrl": "https://www.resales.usda.gov/resales/public/home",
        "isCurrent": false,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "usda",
        "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
        "fetched_at": "2026-07-17T16:15:57.094Z",
        "content_hash": "e6b13ffef6271d5ad69fdd56b9539326a86b1adbe91aa75bda8f10d12c4e2255"
      }
    ],
    "listing_status": "FOR_SALE",
    "listing_history": [
      "REO snapshot 2018-07-05"
    ],
    "confidence_score": 100,
    "source_id": "usda",
    "source_name": "USDA Rural Development / FSA",
    "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
    "fetched_at": "2026-07-17T16:15:57.094Z",
    "content_hash": "e6b13ffef6271d5ad69fdd56b9539326a86b1adbe91aa75bda8f10d12c4e2255",
    "classification_level": "PUBLIC",
    "replay_ref": "usda-replay-p9037620452",
    "connector_id": "usda-connector",
    "jurisdiction_scope": "federal,state,county",
    "scraper_version": "usda-resale-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "usda-9040508192",
    "source_records": [
      {
        "sourceId": "usda",
        "listingId": "9040508192",
        "listingDate": "2018-02-12",
        "state": "MO",
        "county": "St. Francois",
        "town": "Desloge",
        "propertyType": "home",
        "rawPropertyStyle": "Ranch-Frame",
        "exactAddress": "303 S School St",
        "zip": "63601",
        "price": 42000,
        "bedrooms": 3,
        "yearBuilt": 78,
        "squareFeet": 1012,
        "acreageText": "50x150",
        "program": "Direct",
        "description": "The property is being sold as-is via a sealed bid process. Sealed bids will be accepted until 3pm local time on June 28, 2018. For additional information about the property or questions about the bidding process, please contact Pam Scott by phone at (573) 888-2536, Ext. 4 or by email at pam.scott@mo.usda.gov.",
        "photoFile": "9040508192A.jpg",
        "listingUrl": "https://www.resales.usda.gov/resales/public/home",
        "isCurrent": false,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "usda",
        "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
        "fetched_at": "2026-07-17T16:15:57.094Z",
        "content_hash": "7819e9137fd037551cea1f6a05a40101e8c3e067aaeec24c56a9f6eff904854c"
      }
    ],
    "listing_status": "FOR_SALE",
    "listing_history": [
      "REO snapshot 2018-02-12"
    ],
    "confidence_score": 100,
    "source_id": "usda",
    "source_name": "USDA Rural Development / FSA",
    "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
    "fetched_at": "2026-07-17T16:15:57.094Z",
    "content_hash": "7819e9137fd037551cea1f6a05a40101e8c3e067aaeec24c56a9f6eff904854c",
    "classification_level": "PUBLIC",
    "replay_ref": "usda-replay-p9040508192",
    "connector_id": "usda-connector",
    "jurisdiction_scope": "federal,state,county",
    "scraper_version": "usda-resale-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "usda-9080233867",
    "source_records": [
      {
        "sourceId": "usda",
        "listingId": "9080233867",
        "listingDate": "2018-04-09",
        "state": "MT",
        "county": "Hill",
        "town": "Havre",
        "propertyType": "home",
        "rawPropertyStyle": "Ranch-Frame",
        "exactAddress": "608 14th Place West",
        "zip": "59501",
        "price": null,
        "bedrooms": 3,
        "yearBuilt": 11,
        "squareFeet": 988,
        "acreageText": "10,200",
        "program": "Direct",
        "description": "Servicing Office is no longer the Great Falls Area Office. Servicing Office is: Montana State Office Rural Development USDA 2229 Boot Hill Court Bozeman, MT 59715-7914 Phone: (406) 585-2553 Fax: (855) 576-2678 Contact: Kim Maines Phone: (406) 585-2553 Fax: 855-576-2674 Email: kim.maines@mt.usda.gov",
        "photoFile": "9080233867A.jpg",
        "listingUrl": "https://www.resales.usda.gov/resales/public/home",
        "isCurrent": false,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "usda",
        "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
        "fetched_at": "2026-07-17T16:15:57.094Z",
        "content_hash": "f827666e584991de61ac984e1c2a3ec12b13d071258015885177bb43570694b0"
      }
    ],
    "listing_status": "FOR_SALE",
    "listing_history": [
      "REO snapshot 2018-04-09"
    ],
    "confidence_score": 88,
    "source_id": "usda",
    "source_name": "USDA Rural Development / FSA",
    "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
    "fetched_at": "2026-07-17T16:15:57.094Z",
    "content_hash": "f827666e584991de61ac984e1c2a3ec12b13d071258015885177bb43570694b0",
    "classification_level": "PUBLIC",
    "replay_ref": "usda-replay-p9080233867",
    "connector_id": "usda-connector",
    "jurisdiction_scope": "federal,state,county",
    "scraper_version": "usda-resale-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "usda-009002001",
    "source_records": [
      {
        "sourceId": "usda",
        "listingId": "009002001",
        "listingDate": "2017-05-19",
        "state": "NV",
        "county": "Elko",
        "town": "Jackpot",
        "propertyType": "home",
        "rawPropertyStyle": "Ranch-Frame",
        "exactAddress": "1977 Piersant",
        "zip": "89825",
        "price": 55000,
        "bedrooms": 3,
        "yearBuilt": 43,
        "squareFeet": 1714,
        "acreageText": "75x100",
        "program": "Direct",
        "description": null,
        "photoFile": null,
        "listingUrl": "https://www.resales.usda.gov/resales/public/home",
        "isCurrent": false,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "usda",
        "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
        "fetched_at": "2026-07-17T16:15:57.094Z",
        "content_hash": "ae386e9a24945b8d90e3d49c267abfbfb0d677388e07167787fe3190152046da"
      }
    ],
    "listing_status": "SALE_PENDING",
    "listing_history": [
      "REO snapshot 2017-05-19"
    ],
    "confidence_score": 100,
    "source_id": "usda",
    "source_name": "USDA Rural Development / FSA",
    "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
    "fetched_at": "2026-07-17T16:15:57.094Z",
    "content_hash": "ae386e9a24945b8d90e3d49c267abfbfb0d677388e07167787fe3190152046da",
    "classification_level": "PUBLIC",
    "replay_ref": "usda-replay-p009002001",
    "connector_id": "usda-connector",
    "jurisdiction_scope": "federal,state,county",
    "scraper_version": "usda-resale-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "usda-9037370634",
    "source_records": [
      {
        "sourceId": "usda",
        "listingId": "9037370634",
        "listingDate": "2018-05-30",
        "state": "OR",
        "county": "Jackson",
        "town": "Eagle Point",
        "propertyType": "home",
        "rawPropertyStyle": "Ranch-Frame",
        "exactAddress": "811 Mesa Dr.",
        "zip": "97524",
        "price": 115212,
        "bedrooms": 3,
        "yearBuilt": 45,
        "squareFeet": 1440,
        "acreageText": "12197",
        "program": "Direct",
        "description": "SALE PENDING.  Your Real Estate Broker can show you this home.  For additional information, please call 541-801-2681.",
        "photoFile": "9037370634A.jpg",
        "listingUrl": "https://www.resales.usda.gov/resales/public/home",
        "isCurrent": false,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "usda",
        "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
        "fetched_at": "2026-07-17T16:15:57.094Z",
        "content_hash": "1135ceac19979fb6cfe69cb72cf41d6a9423cb0ed631e57d1d0b49a241ac41f1"
      }
    ],
    "listing_status": "SALE_PENDING",
    "listing_history": [
      "REO snapshot 2018-05-30"
    ],
    "confidence_score": 100,
    "source_id": "usda",
    "source_name": "USDA Rural Development / FSA",
    "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
    "fetched_at": "2026-07-17T16:15:57.094Z",
    "content_hash": "1135ceac19979fb6cfe69cb72cf41d6a9423cb0ed631e57d1d0b49a241ac41f1",
    "classification_level": "PUBLIC",
    "replay_ref": "usda-replay-p9037370634",
    "connector_id": "usda-connector",
    "jurisdiction_scope": "federal,state,county",
    "scraper_version": "usda-resale-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "usda-9034676137",
    "source_records": [
      {
        "sourceId": "usda",
        "listingId": "9034676137",
        "listingDate": "2017-09-22",
        "state": "OR",
        "county": "Malheur",
        "town": "Ontario",
        "propertyType": "home",
        "rawPropertyStyle": "Ranch-Frame",
        "exactAddress": "794 Fortner ST.",
        "zip": "97914",
        "price": 77000,
        "bedrooms": 2,
        "yearBuilt": 1930,
        "squareFeet": 1005,
        "acreageText": "`15130",
        "program": "Direct",
        "description": "Your Real Estate Broker can show you this home.  Property is sold subject to a LBP Deed Restriction.  For additional information, please call 541-801-2681.",
        "photoFile": "9034676137A.jpg",
        "listingUrl": "https://www.resales.usda.gov/resales/public/home",
        "isCurrent": false,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "usda",
        "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
        "fetched_at": "2026-07-17T16:15:57.094Z",
        "content_hash": "9218f19c3cff15c1cc61802e4b18b898121e816693ce1e2c84b31e7c6ab14b4b"
      }
    ],
    "listing_status": "FOR_SALE",
    "listing_history": [
      "REO snapshot 2017-09-22"
    ],
    "confidence_score": 100,
    "source_id": "usda",
    "source_name": "USDA Rural Development / FSA",
    "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
    "fetched_at": "2026-07-17T16:15:57.094Z",
    "content_hash": "9218f19c3cff15c1cc61802e4b18b898121e816693ce1e2c84b31e7c6ab14b4b",
    "classification_level": "PUBLIC",
    "replay_ref": "usda-replay-p9034676137",
    "connector_id": "usda-connector",
    "jurisdiction_scope": "federal,state,county",
    "scraper_version": "usda-resale-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "usda-9030311690",
    "source_records": [
      {
        "sourceId": "usda",
        "listingId": "9030311690",
        "listingDate": "2018-07-26",
        "state": "OR",
        "county": "Josephine",
        "town": "Cave Junction",
        "propertyType": "home",
        "rawPropertyStyle": "Single-family home",
        "exactAddress": "5212 Holland Loop Road",
        "zip": "97523",
        "price": 45600,
        "bedrooms": null,
        "yearBuilt": 41,
        "squareFeet": null,
        "acreageText": "43560",
        "program": "Direct",
        "description": "Your Real Estate Broker can help you with the purchase of this property.  If additional information, please call 541-801-2681.",
        "photoFile": "9030311690A.jpg",
        "listingUrl": "https://www.resales.usda.gov/resales/public/home",
        "isCurrent": false,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "usda",
        "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
        "fetched_at": "2026-07-17T16:15:57.094Z",
        "content_hash": "5e36edce942eb09852a094a09bf755b27810b80b80b4d9e9f5ac500172965683"
      }
    ],
    "listing_status": "FOR_SALE",
    "listing_history": [
      "REO snapshot 2018-07-26"
    ],
    "confidence_score": 100,
    "source_id": "usda",
    "source_name": "USDA Rural Development / FSA",
    "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
    "fetched_at": "2026-07-17T16:15:57.094Z",
    "content_hash": "5e36edce942eb09852a094a09bf755b27810b80b80b4d9e9f5ac500172965683",
    "classification_level": "PUBLIC",
    "replay_ref": "usda-replay-p9030311690",
    "connector_id": "usda-connector",
    "jurisdiction_scope": "federal,state,county",
    "scraper_version": "usda-resale-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "usda-9012032751",
    "source_records": [
      {
        "sourceId": "usda",
        "listingId": "9012032751",
        "listingDate": "2018-03-08",
        "state": "OR",
        "county": "Tillamook",
        "town": "Tillamook",
        "propertyType": "home",
        "rawPropertyStyle": "Manufactured Home-Frame",
        "exactAddress": "8055 Long Prairie Rd.",
        "zip": "97141",
        "price": 135000,
        "bedrooms": 3,
        "yearBuilt": 19,
        "squareFeet": 1296,
        "acreageText": "20038",
        "program": "Direct",
        "description": "Your Real Estate Broker can show you this home.  For additional information, please call 541-801-2681.",
        "photoFile": "9012032751A.jpg",
        "listingUrl": "https://www.resales.usda.gov/resales/public/home",
        "isCurrent": false,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "usda",
        "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
        "fetched_at": "2026-07-17T16:15:57.094Z",
        "content_hash": "5e23824ed267b69ab5e8103d7c71b3e5848c127de19ac3b423d4a9a2fb3061ee"
      }
    ],
    "listing_status": "FOR_SALE",
    "listing_history": [
      "REO snapshot 2018-03-08"
    ],
    "confidence_score": 100,
    "source_id": "usda",
    "source_name": "USDA Rural Development / FSA",
    "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
    "fetched_at": "2026-07-17T16:15:57.094Z",
    "content_hash": "5e23824ed267b69ab5e8103d7c71b3e5848c127de19ac3b423d4a9a2fb3061ee",
    "classification_level": "PUBLIC",
    "replay_ref": "usda-replay-p9012032751",
    "connector_id": "usda-connector",
    "jurisdiction_scope": "federal,state,county",
    "scraper_version": "usda-resale-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "usda-9033110555",
    "source_records": [
      {
        "sourceId": "usda",
        "listingId": "9033110555",
        "listingDate": "2017-06-23",
        "state": "OR",
        "county": "Clatsop",
        "town": "Westport",
        "propertyType": "home",
        "rawPropertyStyle": "2 Story-Frame",
        "exactAddress": "49229 Highway 30",
        "zip": "97016",
        "price": 102000,
        "bedrooms": 4,
        "yearBuilt": 1937,
        "squareFeet": 1413,
        "acreageText": "9148",
        "program": "Direct",
        "description": "Your Real Estate Broker can show you this home.  Property will be sold subject to a Deed Restriction for Lead-Based Paint.  For additional information, please call 541-967-5925 ext. 128.",
        "photoFile": "9033110555A.jpg",
        "listingUrl": "https://www.resales.usda.gov/resales/public/home",
        "isCurrent": false,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "usda",
        "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
        "fetched_at": "2026-07-17T16:15:57.094Z",
        "content_hash": "f0ec04a780fcaefe07ca9d8c24c74d59519010c66df0c1656c60603639e5fe6f"
      }
    ],
    "listing_status": "FOR_SALE",
    "listing_history": [
      "REO snapshot 2017-06-23"
    ],
    "confidence_score": 100,
    "source_id": "usda",
    "source_name": "USDA Rural Development / FSA",
    "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
    "fetched_at": "2026-07-17T16:15:57.094Z",
    "content_hash": "f0ec04a780fcaefe07ca9d8c24c74d59519010c66df0c1656c60603639e5fe6f",
    "classification_level": "PUBLIC",
    "replay_ref": "usda-replay-p9033110555",
    "connector_id": "usda-connector",
    "jurisdiction_scope": "federal,state,county",
    "scraper_version": "usda-resale-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "usda-9033114467",
    "source_records": [
      {
        "sourceId": "usda",
        "listingId": "9033114467",
        "listingDate": "2017-06-01",
        "state": "OR",
        "county": "Douglas",
        "town": "Dillard",
        "propertyType": "home",
        "rawPropertyStyle": "2 Story-Frame",
        "exactAddress": "206 Church Street",
        "zip": "97432",
        "price": 72800,
        "bedrooms": 3,
        "yearBuilt": 36,
        "squareFeet": 1376,
        "acreageText": "6534",
        "program": "Direct",
        "description": "Sealed Bids will be accepted until 2:00 pm on August 21, 2018.  For information and a bid form, please call 541-801-2681.",
        "photoFile": "9033114467A.jpg",
        "listingUrl": "https://www.resales.usda.gov/resales/public/home",
        "isCurrent": false,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "usda",
        "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
        "fetched_at": "2026-07-17T16:15:57.094Z",
        "content_hash": "8161e96de3535335693608e7889ac53bb031edd23922e17fb7fbfc45b7020478"
      }
    ],
    "listing_status": "FOR_SALE",
    "listing_history": [
      "REO snapshot 2017-06-01"
    ],
    "confidence_score": 100,
    "source_id": "usda",
    "source_name": "USDA Rural Development / FSA",
    "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
    "fetched_at": "2026-07-17T16:15:57.094Z",
    "content_hash": "8161e96de3535335693608e7889ac53bb031edd23922e17fb7fbfc45b7020478",
    "classification_level": "PUBLIC",
    "replay_ref": "usda-replay-p9033114467",
    "connector_id": "usda-connector",
    "jurisdiction_scope": "federal,state,county",
    "scraper_version": "usda-resale-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "usda-9007204086",
    "source_records": [
      {
        "sourceId": "usda",
        "listingId": "9007204086",
        "listingDate": "2018-07-24",
        "state": "PR",
        "county": "Caguas",
        "town": "Humacao",
        "propertyType": "home",
        "rawPropertyStyle": "Single-family home",
        "exactAddress": "365 14st Verdemar",
        "zip": "00741",
        "price": 17000,
        "bedrooms": 3,
        "yearBuilt": 38,
        "squareFeet": 858,
        "acreageText": "230sm",
        "program": "Direct",
        "description": "365 14st Verdemar, Humacao, PR  00741  Real Estate tax ID 281-079-390-09-001",
        "photoFile": "9007204086A.jpg",
        "listingUrl": "https://www.resales.usda.gov/resales/public/home",
        "isCurrent": false,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "usda",
        "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
        "fetched_at": "2026-07-17T16:15:57.094Z",
        "content_hash": "eb3326616cf6832dcee673c3138a1a920de57d1d19da94c481e7c37a1248f297"
      }
    ],
    "listing_status": "FOR_SALE",
    "listing_history": [
      "REO snapshot 2018-07-24"
    ],
    "confidence_score": 100,
    "source_id": "usda",
    "source_name": "USDA Rural Development / FSA",
    "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
    "fetched_at": "2026-07-17T16:15:57.094Z",
    "content_hash": "eb3326616cf6832dcee673c3138a1a920de57d1d19da94c481e7c37a1248f297",
    "classification_level": "PUBLIC",
    "replay_ref": "usda-replay-p9007204086",
    "connector_id": "usda-connector",
    "jurisdiction_scope": "federal,state,county",
    "scraper_version": "usda-resale-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "usda-9036688194",
    "source_records": [
      {
        "sourceId": "usda",
        "listingId": "9036688194",
        "listingDate": "2016-12-19",
        "state": "PR",
        "county": "Morovis",
        "town": "Morovis",
        "propertyType": "home",
        "rawPropertyStyle": "-Frame",
        "exactAddress": "Urb Montellanos G-6",
        "zip": "00687",
        "price": 90000,
        "bedrooms": 3,
        "yearBuilt": 26,
        "squareFeet": 879,
        "acreageText": "325x10764",
        "program": "Direct",
        "description": "BROKER:  HMP PROPERTIES INC.\nAddress: Caparra Heights\n1481 Elida St. \nSan Juan, PR 00920\nOffice 787-781-2446\nFax 1-888-267-7802\nemail: info@hogarespr.com\nweb: www.hogarespr.com",
        "photoFile": "9036688194A.jpg",
        "listingUrl": "https://www.resales.usda.gov/resales/public/home",
        "isCurrent": false,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "usda",
        "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
        "fetched_at": "2026-07-17T16:15:57.094Z",
        "content_hash": "681694c4407f632e1d6c40de08318df3441a2f95cd6fca1a3210046540b33d83"
      }
    ],
    "listing_status": "SALE_PENDING",
    "listing_history": [
      "REO snapshot 2016-12-19"
    ],
    "confidence_score": 100,
    "source_id": "usda",
    "source_name": "USDA Rural Development / FSA",
    "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
    "fetched_at": "2026-07-17T16:15:57.094Z",
    "content_hash": "681694c4407f632e1d6c40de08318df3441a2f95cd6fca1a3210046540b33d83",
    "classification_level": "PUBLIC",
    "replay_ref": "usda-replay-p9036688194",
    "connector_id": "usda-connector",
    "jurisdiction_scope": "federal,state,county",
    "scraper_version": "usda-resale-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "usda-9019732177",
    "source_records": [
      {
        "sourceId": "usda",
        "listingId": "9019732177",
        "listingDate": "2017-10-30",
        "state": "PR",
        "county": "Caguas",
        "town": "Rio Grande",
        "propertyType": "home",
        "rawPropertyStyle": "Single-family home",
        "exactAddress": "Lot 128 #10st. Eugenio So",
        "zip": "00745",
        "price": 63000,
        "bedrooms": 3,
        "yearBuilt": 37,
        "squareFeet": 942,
        "acreageText": "378sm",
        "program": "Direct",
        "description": "LOT 128 10st. EUGENIO SOSA COMM, GUZMAN ABAJO WD., RIO GRANDE, PR  00745;  RECORDED FARM 10599, PAGE 176, BOOK 222; REAL ESTATE TAXES ID 118-035-227-18-000",
        "photoFile": "9019732177A.jpg",
        "listingUrl": "https://www.resales.usda.gov/resales/public/home",
        "isCurrent": false,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "usda",
        "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
        "fetched_at": "2026-07-17T16:15:57.094Z",
        "content_hash": "7f2d0c2bbc1d1751b1361ae1efe08fd91e333a0a9e1cd82919c7d7c5024ecc8e"
      }
    ],
    "listing_status": "FOR_SALE",
    "listing_history": [
      "REO snapshot 2017-10-30"
    ],
    "confidence_score": 100,
    "source_id": "usda",
    "source_name": "USDA Rural Development / FSA",
    "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
    "fetched_at": "2026-07-17T16:15:57.094Z",
    "content_hash": "7f2d0c2bbc1d1751b1361ae1efe08fd91e333a0a9e1cd82919c7d7c5024ecc8e",
    "classification_level": "PUBLIC",
    "replay_ref": "usda-replay-p9019732177",
    "connector_id": "usda-connector",
    "jurisdiction_scope": "federal,state,county",
    "scraper_version": "usda-resale-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "usda-9022212833",
    "source_records": [
      {
        "sourceId": "usda",
        "listingId": "9022212833",
        "listingDate": "2015-01-27",
        "state": "PR",
        "county": "Caguas",
        "town": "Gurabo",
        "propertyType": "home",
        "rawPropertyStyle": "Single-family home",
        "exactAddress": "Reparto San Jose B-15",
        "zip": "00778",
        "price": 47500,
        "bedrooms": 3,
        "yearBuilt": 37,
        "squareFeet": 998,
        "acreageText": "253 sm",
        "program": "Direct",
        "description": "Property located at Urb. Reparto San Jose B-15 5 St. Gurabo, P.R. R/E Taxes ID: 200-095-121-15-001.",
        "photoFile": "9022212833A.jpg",
        "listingUrl": "https://www.resales.usda.gov/resales/public/home",
        "isCurrent": false,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "usda",
        "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
        "fetched_at": "2026-07-17T16:15:57.094Z",
        "content_hash": "f7016a52defefb6fe76c67d899faa83783482563043936994a33fd393654d2d6"
      }
    ],
    "listing_status": "SALE_PENDING",
    "listing_history": [
      "REO snapshot 2015-01-27"
    ],
    "confidence_score": 100,
    "source_id": "usda",
    "source_name": "USDA Rural Development / FSA",
    "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
    "fetched_at": "2026-07-17T16:15:57.094Z",
    "content_hash": "f7016a52defefb6fe76c67d899faa83783482563043936994a33fd393654d2d6",
    "classification_level": "PUBLIC",
    "replay_ref": "usda-replay-p9022212833",
    "connector_id": "usda-connector",
    "jurisdiction_scope": "federal,state,county",
    "scraper_version": "usda-resale-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "usda-9007439916",
    "source_records": [
      {
        "sourceId": "usda",
        "listingId": "9007439916",
        "listingDate": "2014-03-06",
        "state": "PR",
        "county": "Camuy",
        "town": "Arecibo",
        "propertyType": "home",
        "rawPropertyStyle": "Single-family home",
        "exactAddress": "Lot #4 PR 681 Km 6.2",
        "zip": "00612",
        "price": 50000,
        "bedrooms": 3,
        "yearBuilt": 29,
        "squareFeet": 841,
        "acreageText": "600",
        "program": "Direct",
        "description": "PROPERTY LOCATED AT LOT 4 PR 681 KM 6.2 INT VILLA MARITZA BO ISLOTE ARECIBO PR. REC AT FARM 41703 BOOK 20 PAGE 953. R/E TAXES 013-087-635-41-000.",
        "photoFile": "9007439916A.jpg",
        "listingUrl": "https://www.resales.usda.gov/resales/public/home",
        "isCurrent": false,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "usda",
        "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
        "fetched_at": "2026-07-17T16:15:57.094Z",
        "content_hash": "519f91e6aff2db73d855a88c991f23cc33cb42428222235804dd19efcc6f3f94"
      }
    ],
    "listing_status": "SALE_PENDING",
    "listing_history": [
      "REO snapshot 2014-03-06"
    ],
    "confidence_score": 100,
    "source_id": "usda",
    "source_name": "USDA Rural Development / FSA",
    "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
    "fetched_at": "2026-07-17T16:15:57.094Z",
    "content_hash": "519f91e6aff2db73d855a88c991f23cc33cb42428222235804dd19efcc6f3f94",
    "classification_level": "PUBLIC",
    "replay_ref": "usda-replay-p9007439916",
    "connector_id": "usda-connector",
    "jurisdiction_scope": "federal,state,county",
    "scraper_version": "usda-resale-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "usda-9007373674",
    "source_records": [
      {
        "sourceId": "usda",
        "listingId": "9007373674",
        "listingDate": "2014-07-17",
        "state": "PR",
        "county": "Camuy",
        "town": "Isabela",
        "propertyType": "home",
        "rawPropertyStyle": "Single-family home",
        "exactAddress": "URB MEDINA F31",
        "zip": "00662",
        "price": 54900,
        "bedrooms": 3,
        "yearBuilt": 30,
        "squareFeet": 737,
        "acreageText": "312",
        "program": "Direct",
        "description": "PROPERTY LOCATED AT URB MEDINA F-31 WITH 312.00 SM IN ISABELA PR. REC AT FARM 7015, BOOK 294, PAGE168. R/E TAXES 007-017-117-31-000.",
        "photoFile": "9007373674A.jpg",
        "listingUrl": "https://www.resales.usda.gov/resales/public/home",
        "isCurrent": false,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "usda",
        "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
        "fetched_at": "2026-07-17T16:15:57.094Z",
        "content_hash": "c53c2d7381af748f80e2f6a78091054856e7845449d92063fc196c960df095c5"
      }
    ],
    "listing_status": "SALE_PENDING",
    "listing_history": [
      "REO snapshot 2014-07-17"
    ],
    "confidence_score": 100,
    "source_id": "usda",
    "source_name": "USDA Rural Development / FSA",
    "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
    "fetched_at": "2026-07-17T16:15:57.094Z",
    "content_hash": "c53c2d7381af748f80e2f6a78091054856e7845449d92063fc196c960df095c5",
    "classification_level": "PUBLIC",
    "replay_ref": "usda-replay-p9007373674",
    "connector_id": "usda-connector",
    "jurisdiction_scope": "federal,state,county",
    "scraper_version": "usda-resale-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "usda-9081003290",
    "source_records": [
      {
        "sourceId": "usda",
        "listingId": "9081003290",
        "listingDate": "2014-01-13",
        "state": "PR",
        "county": "Morovis",
        "town": "Toa Alta",
        "propertyType": "home",
        "rawPropertyStyle": "2 Story-Frame",
        "exactAddress": "Brisas del Plata # 3",
        "zip": "00953",
        "price": 87000,
        "bedrooms": 5,
        "yearBuilt": 25,
        "squareFeet": 2682,
        "acreageText": "1869.633",
        "program": "Direct",
        "description": "Parcel # 08300001055901\nBroker:  HMP PROPERTIES INC.\nAddress: Caparra Heights\n1481 Elida St. \nSan Juan, PR 00920\nOffice 787-781-2446\nFax 1-888-267-7802\nemail: info@hogarespr.com\nweb: www.hogarespr.com",
        "photoFile": "90081003290A.jpg",
        "listingUrl": "https://www.resales.usda.gov/resales/public/home",
        "isCurrent": false,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "usda",
        "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
        "fetched_at": "2026-07-17T16:15:57.094Z",
        "content_hash": "0e277c91f3f6137814d6c8057f22732323288847896c8367f5d5ae3ea4b61593"
      }
    ],
    "listing_status": "FOR_SALE",
    "listing_history": [
      "REO snapshot 2014-01-13"
    ],
    "confidence_score": 100,
    "source_id": "usda",
    "source_name": "USDA Rural Development / FSA",
    "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
    "fetched_at": "2026-07-17T16:15:57.094Z",
    "content_hash": "0e277c91f3f6137814d6c8057f22732323288847896c8367f5d5ae3ea4b61593",
    "classification_level": "PUBLIC",
    "replay_ref": "usda-replay-p9081003290",
    "connector_id": "usda-connector",
    "jurisdiction_scope": "federal,state,county",
    "scraper_version": "usda-resale-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "usda-9007358563",
    "source_records": [
      {
        "sourceId": "usda",
        "listingId": "9007358563",
        "listingDate": "2014-11-19",
        "state": "PR",
        "county": "Camuy",
        "town": "San Sebastian",
        "propertyType": "home",
        "rawPropertyStyle": "Single-family home",
        "exactAddress": "Colinas Verdes R-28",
        "zip": "00685",
        "price": 38000,
        "bedrooms": 3,
        "yearBuilt": 40,
        "squareFeet": 1002,
        "acreageText": "233 sm",
        "program": "Direct",
        "description": "Property located at Urb. Colinas Verdes R-28 1 St. San Sebastian, P.R. Recorded at farm 10,042, page 25, book 216. R/E Taxes ID: 128-040-224-28-001.",
        "photoFile": "9007358563A.jpg",
        "listingUrl": "https://www.resales.usda.gov/resales/public/home",
        "isCurrent": false,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "usda",
        "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
        "fetched_at": "2026-07-17T16:15:57.094Z",
        "content_hash": "b1196d61e8e84558a6269fdd530b6c4b47862a4feffeb13e25ce090858e82f4b"
      }
    ],
    "listing_status": "SALE_PENDING",
    "listing_history": [
      "REO snapshot 2014-11-19"
    ],
    "confidence_score": 100,
    "source_id": "usda",
    "source_name": "USDA Rural Development / FSA",
    "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
    "fetched_at": "2026-07-17T16:15:57.094Z",
    "content_hash": "b1196d61e8e84558a6269fdd530b6c4b47862a4feffeb13e25ce090858e82f4b",
    "classification_level": "PUBLIC",
    "replay_ref": "usda-replay-p9007358563",
    "connector_id": "usda-connector",
    "jurisdiction_scope": "federal,state,county",
    "scraper_version": "usda-resale-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "usda-9019672318",
    "source_records": [
      {
        "sourceId": "usda",
        "listingId": "9019672318",
        "listingDate": "2017-05-04",
        "state": "PR",
        "county": "Juana Diaz",
        "town": "Guayama",
        "propertyType": "home",
        "rawPropertyStyle": "Single-family home",
        "exactAddress": "Vistasdel Sol B-9",
        "zip": "00784",
        "price": 73000,
        "bedrooms": 3,
        "yearBuilt": 17,
        "squareFeet": 848,
        "acreageText": "299.8710",
        "program": "Direct",
        "description": "# catastro: 442-022-608-36-000",
        "photoFile": "9019672318A.jpg",
        "listingUrl": "https://www.resales.usda.gov/resales/public/home",
        "isCurrent": false,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "usda",
        "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
        "fetched_at": "2026-07-17T16:15:57.094Z",
        "content_hash": "535b3bf45a3060590093341e548756e2157ba417d6d663df392a14f15a302c11"
      }
    ],
    "listing_status": "SALE_PENDING",
    "listing_history": [
      "REO snapshot 2017-05-04"
    ],
    "confidence_score": 100,
    "source_id": "usda",
    "source_name": "USDA Rural Development / FSA",
    "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
    "fetched_at": "2026-07-17T16:15:57.094Z",
    "content_hash": "535b3bf45a3060590093341e548756e2157ba417d6d663df392a14f15a302c11",
    "classification_level": "PUBLIC",
    "replay_ref": "usda-replay-p9019672318",
    "connector_id": "usda-connector",
    "jurisdiction_scope": "federal,state,county",
    "scraper_version": "usda-resale-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "usda-9007198532",
    "source_records": [
      {
        "sourceId": "usda",
        "listingId": "9007198532",
        "listingDate": "2017-01-26",
        "state": "PR",
        "county": "Caguas",
        "town": "Humacao",
        "propertyType": "home",
        "rawPropertyStyle": "Single-family home",
        "exactAddress": "268 calle 11 Verdemar",
        "zip": "00741",
        "price": 69000,
        "bedrooms": 3,
        "yearBuilt": 36,
        "squareFeet": 828,
        "acreageText": "300sm",
        "program": "Direct",
        "description": "#268 11st. Verdemar Dev., Humacao, PR  00791; Recorded farm 12012, page 110, book 299 ; Real Estate ID 281-089-387-49-000.",
        "photoFile": "9007198532A.jpg",
        "listingUrl": "https://www.resales.usda.gov/resales/public/home",
        "isCurrent": false,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "usda",
        "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
        "fetched_at": "2026-07-17T16:15:57.094Z",
        "content_hash": "c7ba77b6160629b30de5f21e1ca6949655aedcbba08f43350cd6774f274411f1"
      }
    ],
    "listing_status": "SALE_PENDING",
    "listing_history": [
      "REO snapshot 2017-01-26"
    ],
    "confidence_score": 100,
    "source_id": "usda",
    "source_name": "USDA Rural Development / FSA",
    "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
    "fetched_at": "2026-07-17T16:15:57.094Z",
    "content_hash": "c7ba77b6160629b30de5f21e1ca6949655aedcbba08f43350cd6774f274411f1",
    "classification_level": "PUBLIC",
    "replay_ref": "usda-replay-p9007198532",
    "connector_id": "usda-connector",
    "jurisdiction_scope": "federal,state,county",
    "scraper_version": "usda-resale-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "usda-9007205690",
    "source_records": [
      {
        "sourceId": "usda",
        "listingId": "9007205690",
        "listingDate": "2017-01-26",
        "state": "PR",
        "county": "Caguas",
        "town": "Naguabo",
        "propertyType": "home",
        "rawPropertyStyle": "Single-family home",
        "exactAddress": "E-10 calle 5 Reparto Stgo",
        "zip": "00718",
        "price": 58000,
        "bedrooms": 3,
        "yearBuilt": 37,
        "squareFeet": 837,
        "acreageText": "350.63sm",
        "program": "Direct",
        "description": "E-10 calle 5  Reparto Santiago, Naguabo, PR  00718; Recorded farm 6916, page-270, book-129; Real Estate Taxes ID 256-003-098-10-001",
        "photoFile": "9007205690A.jpg",
        "listingUrl": "https://www.resales.usda.gov/resales/public/home",
        "isCurrent": false,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "usda",
        "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
        "fetched_at": "2026-07-17T16:15:57.094Z",
        "content_hash": "1c3ef6b8a9c8cd4f7e7398f83d86e9b82676625edf484276b48e22b309814969"
      }
    ],
    "listing_status": "FOR_SALE",
    "listing_history": [
      "REO snapshot 2017-01-26"
    ],
    "confidence_score": 100,
    "source_id": "usda",
    "source_name": "USDA Rural Development / FSA",
    "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
    "fetched_at": "2026-07-17T16:15:57.094Z",
    "content_hash": "1c3ef6b8a9c8cd4f7e7398f83d86e9b82676625edf484276b48e22b309814969",
    "classification_level": "PUBLIC",
    "replay_ref": "usda-replay-p9007205690",
    "connector_id": "usda-connector",
    "jurisdiction_scope": "federal,state,county",
    "scraper_version": "usda-resale-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "usda-9022218439",
    "source_records": [
      {
        "sourceId": "usda",
        "listingId": "9022218439",
        "listingDate": "2014-11-04",
        "state": "PR",
        "county": "Caguas",
        "town": "Aguas Buenas",
        "propertyType": "home",
        "rawPropertyStyle": "Single-family home",
        "exactAddress": "PR #174 Km 20.8 Mulas Wd",
        "zip": "00703",
        "price": 51000,
        "bedrooms": 4,
        "yearBuilt": 34,
        "squareFeet": 1393,
        "acreageText": "762.4956",
        "program": "Direct",
        "description": "Property located at PR #174 Km 20.8 Mulas Ward Aguas Buenas, P.R. Recorded at farm 3,786, page 68, book 87. R/E Taxes ID: 197-060-166-13-000.",
        "photoFile": "9022218439A.jpg",
        "listingUrl": "https://www.resales.usda.gov/resales/public/home",
        "isCurrent": false,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "usda",
        "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
        "fetched_at": "2026-07-17T16:15:57.094Z",
        "content_hash": "d2784c0141c907c1b02c4568741ae30e332f3b3328e0145fadc9ff3a72f4bab2"
      }
    ],
    "listing_status": "SALE_PENDING",
    "listing_history": [
      "REO snapshot 2014-11-04"
    ],
    "confidence_score": 100,
    "source_id": "usda",
    "source_name": "USDA Rural Development / FSA",
    "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
    "fetched_at": "2026-07-17T16:15:57.094Z",
    "content_hash": "d2784c0141c907c1b02c4568741ae30e332f3b3328e0145fadc9ff3a72f4bab2",
    "classification_level": "PUBLIC",
    "replay_ref": "usda-replay-p9022218439",
    "connector_id": "usda-connector",
    "jurisdiction_scope": "federal,state,county",
    "scraper_version": "usda-resale-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "usda-9007177362",
    "source_records": [
      {
        "sourceId": "usda",
        "listingId": "9007177362",
        "listingDate": "2014-11-04",
        "state": "PR",
        "county": "Caguas",
        "town": "Loiza",
        "propertyType": "home",
        "rawPropertyStyle": "Single-family home",
        "exactAddress": "Palmarenas B-7 1 St.",
        "zip": "00772",
        "price": 30000,
        "bedrooms": 3,
        "yearBuilt": 30,
        "squareFeet": 871,
        "acreageText": "373.250",
        "program": "Direct",
        "description": "Property located at Urb. Palmarenas B-7 1 St. Loiza, P.R. Recorded at farm 8,699, page 191, book 170. R/E Taxes ID: 066-011-246-07-000.",
        "photoFile": "9007177362A.jpg",
        "listingUrl": "https://www.resales.usda.gov/resales/public/home",
        "isCurrent": false,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "usda",
        "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
        "fetched_at": "2026-07-17T16:15:57.094Z",
        "content_hash": "7aacb061ad7a8e0ac457a540c4b75f56c2c031e8b402c728ff1d6d504d1e320e"
      }
    ],
    "listing_status": "SALE_PENDING",
    "listing_history": [
      "REO snapshot 2014-11-04"
    ],
    "confidence_score": 100,
    "source_id": "usda",
    "source_name": "USDA Rural Development / FSA",
    "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
    "fetched_at": "2026-07-17T16:15:57.094Z",
    "content_hash": "7aacb061ad7a8e0ac457a540c4b75f56c2c031e8b402c728ff1d6d504d1e320e",
    "classification_level": "PUBLIC",
    "replay_ref": "usda-replay-p9007177362",
    "connector_id": "usda-connector",
    "jurisdiction_scope": "federal,state,county",
    "scraper_version": "usda-resale-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "usda-9007512642",
    "source_records": [
      {
        "sourceId": "usda",
        "listingId": "9007512642",
        "listingDate": "2014-11-04",
        "state": "PR",
        "county": "Caguas",
        "town": "Ceiba",
        "propertyType": "home",
        "rawPropertyStyle": "Single-family home",
        "exactAddress": "II Ext. Santa Maria A-11",
        "zip": "00735",
        "price": 26000,
        "bedrooms": 3,
        "yearBuilt": 38,
        "squareFeet": 938,
        "acreageText": "224.89 sm",
        "program": "Direct",
        "description": "Property located at 2nd Extension Santa Maria A-11 A St. Ceiba, P.R. Recorded at farm 4,895, page 135, book 79. R/E Taxes ID: 205-027-120-53-001.",
        "photoFile": "9007512642A.jpg",
        "listingUrl": "https://www.resales.usda.gov/resales/public/home",
        "isCurrent": false,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "usda",
        "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
        "fetched_at": "2026-07-17T16:15:57.094Z",
        "content_hash": "e31f3457e631bf1f4bbc12092f7109f782ef928e2d738b923e472dcbbde518d0"
      }
    ],
    "listing_status": "SALE_PENDING",
    "listing_history": [
      "REO snapshot 2014-11-04"
    ],
    "confidence_score": 100,
    "source_id": "usda",
    "source_name": "USDA Rural Development / FSA",
    "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
    "fetched_at": "2026-07-17T16:15:57.094Z",
    "content_hash": "e31f3457e631bf1f4bbc12092f7109f782ef928e2d738b923e472dcbbde518d0",
    "classification_level": "PUBLIC",
    "replay_ref": "usda-replay-p9007512642",
    "connector_id": "usda-connector",
    "jurisdiction_scope": "federal,state,county",
    "scraper_version": "usda-resale-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "usda-9082149797",
    "source_records": [
      {
        "sourceId": "usda",
        "listingId": "9082149797",
        "listingDate": "2015-05-13",
        "state": "PR",
        "county": "Morovis",
        "town": "Toa Alta",
        "propertyType": "home",
        "rawPropertyStyle": "-Frame",
        "exactAddress": "RD 825 Km 1.8 Wd. Qda",
        "zip": "00953",
        "price": 56000,
        "bedrooms": 3,
        "yearBuilt": 20,
        "squareFeet": 909,
        "acreageText": "10764",
        "program": "Direct",
        "description": "Parcel # 104-040-192-28-001\n Broker: HMP PROPERTIES INC.\nAddress: Caparra Heights\n1481 Elida St. \nSan Juan, PR 00920\nOffice 787-781-2446          Fax 1-888-267-7802\nemail: info@hogarespr.com        web: www.hogarespr.com",
        "photoFile": "9082149797A.jpg",
        "listingUrl": "https://www.resales.usda.gov/resales/public/home",
        "isCurrent": false,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "usda",
        "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
        "fetched_at": "2026-07-17T16:15:57.094Z",
        "content_hash": "2a10ed2ebc8d6b175e64a8ebf973af2dcea7eed31f199a655d632024f6c2bb1d"
      }
    ],
    "listing_status": "FOR_SALE",
    "listing_history": [
      "REO snapshot 2015-05-13"
    ],
    "confidence_score": 100,
    "source_id": "usda",
    "source_name": "USDA Rural Development / FSA",
    "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
    "fetched_at": "2026-07-17T16:15:57.094Z",
    "content_hash": "2a10ed2ebc8d6b175e64a8ebf973af2dcea7eed31f199a655d632024f6c2bb1d",
    "classification_level": "PUBLIC",
    "replay_ref": "usda-replay-p9082149797",
    "connector_id": "usda-connector",
    "jurisdiction_scope": "federal,state,county",
    "scraper_version": "usda-resale-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "usda-9038444996",
    "source_records": [
      {
        "sourceId": "usda",
        "listingId": "9038444996",
        "listingDate": "2018-06-11",
        "state": "PR",
        "county": "Caguas",
        "town": "Humacao",
        "propertyType": "home",
        "rawPropertyStyle": "Single-family home",
        "exactAddress": "832 Ext. Verdemar 32st",
        "zip": "00741",
        "price": 31000,
        "bedrooms": 3,
        "yearBuilt": 42,
        "squareFeet": 826,
        "acreageText": "305.50 sm",
        "program": "Direct",
        "description": "Ext. Verdemar 32st. Lot 832, Punta Santiago, Humacao, PR  00741; Recorded farm 13476, page-180, book 324;  RE Taxes ID 281-099-454-18-001",
        "photoFile": "9038444996A.jpg",
        "listingUrl": "https://www.resales.usda.gov/resales/public/home",
        "isCurrent": false,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "usda",
        "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
        "fetched_at": "2026-07-17T16:15:57.094Z",
        "content_hash": "a7c8505a4291092c31febf550ee2bbd6dd14be2d88487cce5b0c5e8cbe9b9cb0"
      }
    ],
    "listing_status": "FOR_SALE",
    "listing_history": [
      "REO snapshot 2018-06-11"
    ],
    "confidence_score": 100,
    "source_id": "usda",
    "source_name": "USDA Rural Development / FSA",
    "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
    "fetched_at": "2026-07-17T16:15:57.094Z",
    "content_hash": "a7c8505a4291092c31febf550ee2bbd6dd14be2d88487cce5b0c5e8cbe9b9cb0",
    "classification_level": "PUBLIC",
    "replay_ref": "usda-replay-p9038444996",
    "connector_id": "usda-connector",
    "jurisdiction_scope": "federal,state,county",
    "scraper_version": "usda-resale-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "usda-9007315881",
    "source_records": [
      {
        "sourceId": "usda",
        "listingId": "9007315881",
        "listingDate": "2016-01-29",
        "state": "PR",
        "county": "Mayaguez",
        "town": "Yauco",
        "propertyType": "home",
        "rawPropertyStyle": "Single-family home",
        "exactAddress": "Alturas de Yauco S-15",
        "zip": "00698",
        "price": 54000,
        "bedrooms": 3,
        "yearBuilt": 29,
        "squareFeet": 950,
        "acreageText": "344.50",
        "program": "Direct",
        "description": "Property located at Urb. Alturas de Yauco S-15 5 St. Yauco, P.R. Recorded at farm 10,772, page 10, book 305. R/E Taxes ID: 385-025-254-15-001.",
        "photoFile": "9007315881A.jpg",
        "listingUrl": "https://www.resales.usda.gov/resales/public/home",
        "isCurrent": false,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "usda",
        "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
        "fetched_at": "2026-07-17T16:15:57.094Z",
        "content_hash": "2fe3210f25dd4cd7a824ada01a1fafd43eecf3d722038934c6c2638f15958867"
      }
    ],
    "listing_status": "SALE_PENDING",
    "listing_history": [
      "REO snapshot 2016-01-29"
    ],
    "confidence_score": 100,
    "source_id": "usda",
    "source_name": "USDA Rural Development / FSA",
    "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
    "fetched_at": "2026-07-17T16:15:57.094Z",
    "content_hash": "2fe3210f25dd4cd7a824ada01a1fafd43eecf3d722038934c6c2638f15958867",
    "classification_level": "PUBLIC",
    "replay_ref": "usda-replay-p9007315881",
    "connector_id": "usda-connector",
    "jurisdiction_scope": "federal,state,county",
    "scraper_version": "usda-resale-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "usda-9007251932",
    "source_records": [
      {
        "sourceId": "usda",
        "listingId": "9007251932",
        "listingDate": "2017-01-24",
        "state": "PR",
        "county": "Morovis",
        "town": "Toa Alta",
        "propertyType": "home",
        "rawPropertyStyle": "-Frame",
        "exactAddress": "3R-45 Alt.Bucarrabones",
        "zip": "00953",
        "price": 81000,
        "bedrooms": 3,
        "yearBuilt": 29,
        "squareFeet": 1041,
        "acreageText": "234.60",
        "program": "Direct",
        "description": "Parcel # 112-056-271-30-001\nBroker:  HMP PROPERTIES INC.\nAddress: Caparra Heights\n1481 Elida St. \nSan Juan, PR 00920\nOffice 787-781-2446\nFax 1-888-267-7802\nemail: info@hogarespr.com\nweb: www.hogarespr.com",
        "photoFile": "9007251932A.jpg",
        "listingUrl": "https://www.resales.usda.gov/resales/public/home",
        "isCurrent": false,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "usda",
        "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
        "fetched_at": "2026-07-17T16:15:57.094Z",
        "content_hash": "68cf779d714a43f37d630779385e2e924c7bdfedbf45d8e46526e407995ae825"
      }
    ],
    "listing_status": "SALE_PENDING",
    "listing_history": [
      "REO snapshot 2017-01-24"
    ],
    "confidence_score": 100,
    "source_id": "usda",
    "source_name": "USDA Rural Development / FSA",
    "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
    "fetched_at": "2026-07-17T16:15:57.094Z",
    "content_hash": "68cf779d714a43f37d630779385e2e924c7bdfedbf45d8e46526e407995ae825",
    "classification_level": "PUBLIC",
    "replay_ref": "usda-replay-p9007251932",
    "connector_id": "usda-connector",
    "jurisdiction_scope": "federal,state,county",
    "scraper_version": "usda-resale-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "usda-9019726455",
    "source_records": [
      {
        "sourceId": "usda",
        "listingId": "9019726455",
        "listingDate": "2017-01-24",
        "state": "PR",
        "county": "Morovis",
        "town": "Morovis",
        "propertyType": "home",
        "rawPropertyStyle": "-Frame",
        "exactAddress": "G-4 Urb. Villas del Norte",
        "zip": "00687",
        "price": 52000,
        "bedrooms": 3,
        "yearBuilt": 36,
        "squareFeet": 860,
        "acreageText": "327.93",
        "program": "Direct",
        "description": "Broker:  HMP PROPERTIES INC.\nAddress: Caparra Heights\n1481 Elida St. \nSan Juan, PR 00920\nOffice 787-781-2446\nFax 1-888-267-7802\nemail: info@hogarespr.com\nweb: www.hogarespr.com\nParcel # 138-026-127-04-000",
        "photoFile": "9019726455A.jpg",
        "listingUrl": "https://www.resales.usda.gov/resales/public/home",
        "isCurrent": false,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "usda",
        "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
        "fetched_at": "2026-07-17T16:15:57.094Z",
        "content_hash": "d8e3fbc5186247e991f9a66d5d9b6fe04b9c432b180b668f9cb02d6580e3fc81"
      }
    ],
    "listing_status": "FOR_SALE",
    "listing_history": [
      "REO snapshot 2017-01-24"
    ],
    "confidence_score": 100,
    "source_id": "usda",
    "source_name": "USDA Rural Development / FSA",
    "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
    "fetched_at": "2026-07-17T16:15:57.094Z",
    "content_hash": "d8e3fbc5186247e991f9a66d5d9b6fe04b9c432b180b668f9cb02d6580e3fc81",
    "classification_level": "PUBLIC",
    "replay_ref": "usda-replay-p9019726455",
    "connector_id": "usda-connector",
    "jurisdiction_scope": "federal,state,county",
    "scraper_version": "usda-resale-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "usda-9035912476",
    "source_records": [
      {
        "sourceId": "usda",
        "listingId": "9035912476",
        "listingDate": "2017-01-24",
        "state": "PR",
        "county": "Morovis",
        "town": "Corozal",
        "propertyType": "home",
        "rawPropertyStyle": "-Frame",
        "exactAddress": "B-4 Calle 8 Urb. Sylvia",
        "zip": "00783",
        "price": 84000,
        "bedrooms": 3,
        "yearBuilt": 35,
        "squareFeet": 923,
        "acreageText": "338.79",
        "program": "Direct",
        "description": "Parcel # 110-098-070-14-001\nBroker:  HMP PROPERTIES INC.\nAddress: Caparra Heights\n1481 Elida St. \nSan Juan, PR 00920\nOffice 787-781-2446\nFax 1-888-267-7802\nemail: info@hogarespr.com\nweb: www.hogarespr.com",
        "photoFile": "9035912476A.jpg",
        "listingUrl": "https://www.resales.usda.gov/resales/public/home",
        "isCurrent": false,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "usda",
        "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
        "fetched_at": "2026-07-17T16:15:57.094Z",
        "content_hash": "da13984118c2f7739de888c069873c57bda330136cf41f280f527d231270344c"
      }
    ],
    "listing_status": "FOR_SALE",
    "listing_history": [
      "REO snapshot 2017-01-24"
    ],
    "confidence_score": 100,
    "source_id": "usda",
    "source_name": "USDA Rural Development / FSA",
    "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
    "fetched_at": "2026-07-17T16:15:57.094Z",
    "content_hash": "da13984118c2f7739de888c069873c57bda330136cf41f280f527d231270344c",
    "classification_level": "PUBLIC",
    "replay_ref": "usda-replay-p9035912476",
    "connector_id": "usda-connector",
    "jurisdiction_scope": "federal,state,county",
    "scraper_version": "usda-resale-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "usda-9033316511",
    "source_records": [
      {
        "sourceId": "usda",
        "listingId": "9033316511",
        "listingDate": "2015-12-09",
        "state": "PR",
        "county": "Caguas",
        "town": "Las Piedras, Pr",
        "propertyType": "home",
        "rawPropertyStyle": "Single-family home",
        "exactAddress": "15st. K-3 April Garden",
        "zip": "00771",
        "price": 52000,
        "bedrooms": 3,
        "yearBuilt": 32,
        "squareFeet": 945,
        "acreageText": "252sm",
        "program": "Direct",
        "description": "k-3 15st. April Garden Dev., Las Piedras, PR ; Recorded farm 7208, page 246, book 141 ; ID tax: 279-050-180-03-000",
        "photoFile": "9033316511A.jpg",
        "listingUrl": "https://www.resales.usda.gov/resales/public/home",
        "isCurrent": false,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "usda",
        "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
        "fetched_at": "2026-07-17T16:15:57.094Z",
        "content_hash": "760d716166e3f76647dee6bfc0f93c7068f3e1e4036861e3185fdaa2fffc5391"
      }
    ],
    "listing_status": "FOR_SALE",
    "listing_history": [
      "REO snapshot 2015-12-09"
    ],
    "confidence_score": 100,
    "source_id": "usda",
    "source_name": "USDA Rural Development / FSA",
    "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
    "fetched_at": "2026-07-17T16:15:57.094Z",
    "content_hash": "760d716166e3f76647dee6bfc0f93c7068f3e1e4036861e3185fdaa2fffc5391",
    "classification_level": "PUBLIC",
    "replay_ref": "usda-replay-p9033316511",
    "connector_id": "usda-connector",
    "jurisdiction_scope": "federal,state,county",
    "scraper_version": "usda-resale-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "usda-9032806996",
    "source_records": [
      {
        "sourceId": "usda",
        "listingId": "9032806996",
        "listingDate": "2016-08-16",
        "state": "PR",
        "county": "Morovis",
        "town": "Morovis",
        "propertyType": "home",
        "rawPropertyStyle": "-Frame",
        "exactAddress": "C-12 Villas del Norte",
        "zip": "00687",
        "price": 87000,
        "bedrooms": 3,
        "yearBuilt": 28,
        "squareFeet": 826,
        "acreageText": "354x10764",
        "program": "Direct",
        "description": "Parcel# 138-016-124-12-000\nBroker:  HMP Propeties Phone # 787-781-2446\nemail: info@hogarespr.com / web=www.hogarespr.com",
        "photoFile": "9032806996A.jpg",
        "listingUrl": "https://www.resales.usda.gov/resales/public/home",
        "isCurrent": false,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "usda",
        "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
        "fetched_at": "2026-07-17T16:15:57.094Z",
        "content_hash": "08b56157897e724cb7d1bc36d450b584ee5fec299d4ce1b294889710ac8383c8"
      }
    ],
    "listing_status": "SALE_PENDING",
    "listing_history": [
      "REO snapshot 2016-08-16"
    ],
    "confidence_score": 100,
    "source_id": "usda",
    "source_name": "USDA Rural Development / FSA",
    "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
    "fetched_at": "2026-07-17T16:15:57.094Z",
    "content_hash": "08b56157897e724cb7d1bc36d450b584ee5fec299d4ce1b294889710ac8383c8",
    "classification_level": "PUBLIC",
    "replay_ref": "usda-replay-p9032806996",
    "connector_id": "usda-connector",
    "jurisdiction_scope": "federal,state,county",
    "scraper_version": "usda-resale-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "usda-9007410456",
    "source_records": [
      {
        "sourceId": "usda",
        "listingId": "9007410456",
        "listingDate": "2014-11-19",
        "state": "PR",
        "county": "Camuy",
        "town": "Hatillo",
        "propertyType": "home",
        "rawPropertyStyle": "Single-family home",
        "exactAddress": "CORALES HATILLO E9",
        "zip": "00659",
        "price": 54000,
        "bedrooms": 3,
        "yearBuilt": 37,
        "squareFeet": 1057,
        "acreageText": "323",
        "program": "Direct",
        "description": "PROPERTY LOCATED AT URB CORALES DE HATILLO E9 WITH 325.15 IN HATILLO, PR.  REC AT FARM 17697 BOOK 35 PAGE 272. R/E TAXES 011-024-125-09-001.",
        "photoFile": "9007410456A.jpg",
        "listingUrl": "https://www.resales.usda.gov/resales/public/home",
        "isCurrent": false,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "usda",
        "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
        "fetched_at": "2026-07-17T16:15:57.094Z",
        "content_hash": "593a6a3cce816919ac0f307f3fbf763194baa88484ef0b0f7dadc2e97b8ba577"
      }
    ],
    "listing_status": "SALE_PENDING",
    "listing_history": [
      "REO snapshot 2014-11-19"
    ],
    "confidence_score": 100,
    "source_id": "usda",
    "source_name": "USDA Rural Development / FSA",
    "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
    "fetched_at": "2026-07-17T16:15:57.094Z",
    "content_hash": "593a6a3cce816919ac0f307f3fbf763194baa88484ef0b0f7dadc2e97b8ba577",
    "classification_level": "PUBLIC",
    "replay_ref": "usda-replay-p9007410456",
    "connector_id": "usda-connector",
    "jurisdiction_scope": "federal,state,county",
    "scraper_version": "usda-resale-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "usda-9007406871",
    "source_records": [
      {
        "sourceId": "usda",
        "listingId": "9007406871",
        "listingDate": "2014-11-19",
        "state": "PR",
        "county": "Camuy",
        "town": "Hatillo",
        "propertyType": "home",
        "rawPropertyStyle": "Single-family home",
        "exactAddress": "CORALES HATILLO C10",
        "zip": "00659",
        "price": 44700,
        "bedrooms": 3,
        "yearBuilt": 37,
        "squareFeet": 842,
        "acreageText": "282.67",
        "program": "Direct",
        "description": "PROPERTY LOCATED AT URB CORALES DE HATILLO C10 WITH 282.67 IN HATILLO, PR.  REC AT FARM 16159 BOOK 35 PAGE 245. R/E TAXES 011-024-122-10-001.",
        "photoFile": "9007406871A.jpg",
        "listingUrl": "https://www.resales.usda.gov/resales/public/home",
        "isCurrent": false,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "usda",
        "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
        "fetched_at": "2026-07-17T16:15:57.094Z",
        "content_hash": "6106b0e0d00842fdd422c381f85975d8e012bd9895256858dc7b30040199c479"
      }
    ],
    "listing_status": "SALE_PENDING",
    "listing_history": [
      "REO snapshot 2014-11-19"
    ],
    "confidence_score": 100,
    "source_id": "usda",
    "source_name": "USDA Rural Development / FSA",
    "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
    "fetched_at": "2026-07-17T16:15:57.094Z",
    "content_hash": "6106b0e0d00842fdd422c381f85975d8e012bd9895256858dc7b30040199c479",
    "classification_level": "PUBLIC",
    "replay_ref": "usda-replay-p9007406871",
    "connector_id": "usda-connector",
    "jurisdiction_scope": "federal,state,county",
    "scraper_version": "usda-resale-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "usda-90023365064",
    "source_records": [
      {
        "sourceId": "usda",
        "listingId": "90023365064",
        "listingDate": "2011-03-02",
        "state": "PR",
        "county": "Morovis",
        "town": "Manati",
        "propertyType": "home",
        "rawPropertyStyle": "2 Story-Frame",
        "exactAddress": "LOT-183 PINZON COMM.",
        "zip": "00674",
        "price": 77000,
        "bedrooms": 3,
        "yearBuilt": 15,
        "squareFeet": 963,
        "acreageText": "5650.45416",
        "program": "Direct",
        "description": "Property in bad conditions.  Tax ID 080-067-025-01-000\nNon-Program property",
        "photoFile": "90023365064A.jpg",
        "listingUrl": "https://www.resales.usda.gov/resales/public/home",
        "isCurrent": false,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "usda",
        "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
        "fetched_at": "2026-07-17T16:15:57.094Z",
        "content_hash": "01b09b54758e454dc3a98c3f2c6972a21925f459c2e6866656ffc07715d2fdc9"
      }
    ],
    "listing_status": "FOR_SALE",
    "listing_history": [
      "REO snapshot 2011-03-02"
    ],
    "confidence_score": 100,
    "source_id": "usda",
    "source_name": "USDA Rural Development / FSA",
    "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
    "fetched_at": "2026-07-17T16:15:57.094Z",
    "content_hash": "01b09b54758e454dc3a98c3f2c6972a21925f459c2e6866656ffc07715d2fdc9",
    "classification_level": "PUBLIC",
    "replay_ref": "usda-replay-p90023365064",
    "connector_id": "usda-connector",
    "jurisdiction_scope": "federal,state,county",
    "scraper_version": "usda-resale-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "usda-9019732601",
    "source_records": [
      {
        "sourceId": "usda",
        "listingId": "9019732601",
        "listingDate": "2017-03-09",
        "state": "PR",
        "county": "Caguas",
        "town": "Canovanas",
        "propertyType": "home",
        "rawPropertyStyle": "Single-family home",
        "exactAddress": "VILLAS DE LOIZA MM-19 39s",
        "zip": "00720",
        "price": 70000,
        "bedrooms": 3,
        "yearBuilt": 36,
        "squareFeet": 849,
        "acreageText": "238SM",
        "program": "Direct",
        "description": "VILLAS DE LOIZA M-19 39st., CANOVANAS, PR 00720; RECORDED FARM 10523, PAGE 246, BOOK 227;  REAL ESTATE TAXES ID 090-041-317-19-001",
        "photoFile": "9019732601A.jpg",
        "listingUrl": "https://www.resales.usda.gov/resales/public/home",
        "isCurrent": false,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "usda",
        "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
        "fetched_at": "2026-07-17T16:15:57.094Z",
        "content_hash": "bcf9b4ad4a219166e26587c2bdeb89dff1d9cbef2c948830a0764ba2684dba3b"
      }
    ],
    "listing_status": "SALE_PENDING",
    "listing_history": [
      "REO snapshot 2017-03-09"
    ],
    "confidence_score": 100,
    "source_id": "usda",
    "source_name": "USDA Rural Development / FSA",
    "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
    "fetched_at": "2026-07-17T16:15:57.094Z",
    "content_hash": "bcf9b4ad4a219166e26587c2bdeb89dff1d9cbef2c948830a0764ba2684dba3b",
    "classification_level": "PUBLIC",
    "replay_ref": "usda-replay-p9019732601",
    "connector_id": "usda-connector",
    "jurisdiction_scope": "federal,state,county",
    "scraper_version": "usda-resale-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "usda-9007514530",
    "source_records": [
      {
        "sourceId": "usda",
        "listingId": "9007514530",
        "listingDate": "2015-07-23",
        "state": "PR",
        "county": "Caguas",
        "town": "Caiba",
        "propertyType": "home",
        "rawPropertyStyle": "Single-family home",
        "exactAddress": "Jardines Avila # 69",
        "zip": "00757",
        "price": 57000,
        "bedrooms": 3,
        "yearBuilt": 11,
        "squareFeet": 811,
        "acreageText": "280sqm",
        "program": "Direct",
        "description": "Urb. Jardines Avila # 69, Ceiba, P. R. Lot 280 Sq. mts.  Recorded at Book 80; page 175; Farm Number 4,985.  R/E Taxes ID205-036-132-12-001",
        "photoFile": "9007514530A.jpg",
        "listingUrl": "https://www.resales.usda.gov/resales/public/home",
        "isCurrent": false,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "usda",
        "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
        "fetched_at": "2026-07-17T16:15:57.094Z",
        "content_hash": "7f1b0793580b618634f0e87f3c52dc27d84f3fe03f96f4b7f8bba9083cd12e7e"
      }
    ],
    "listing_status": "SALE_PENDING",
    "listing_history": [
      "REO snapshot 2015-07-23"
    ],
    "confidence_score": 100,
    "source_id": "usda",
    "source_name": "USDA Rural Development / FSA",
    "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
    "fetched_at": "2026-07-17T16:15:57.094Z",
    "content_hash": "7f1b0793580b618634f0e87f3c52dc27d84f3fe03f96f4b7f8bba9083cd12e7e",
    "classification_level": "PUBLIC",
    "replay_ref": "usda-replay-p9007514530",
    "connector_id": "usda-connector",
    "jurisdiction_scope": "federal,state,county",
    "scraper_version": "usda-resale-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "usda-9019718586",
    "source_records": [
      {
        "sourceId": "usda",
        "listingId": "9019718586",
        "listingDate": "2015-07-20",
        "state": "PR",
        "county": "Mayaguez",
        "town": "Cabo Rojo",
        "propertyType": "home",
        "rawPropertyStyle": "Single-family home",
        "exactAddress": "Ana Maria I-41",
        "zip": "00623",
        "price": 45000,
        "bedrooms": 3,
        "yearBuilt": 34,
        "squareFeet": 1081,
        "acreageText": "230sqm",
        "program": "Direct",
        "description": "Urb. Ana Maria I-41, Cabo Rojo, P. R.Recorded at Book 317, Page 165 Farm Number 10402.  R/E Taxes ID 332-007-185-44-001.",
        "photoFile": "9019718586A.jpg",
        "listingUrl": "https://www.resales.usda.gov/resales/public/home",
        "isCurrent": false,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "usda",
        "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
        "fetched_at": "2026-07-17T16:15:57.094Z",
        "content_hash": "d38c522a13bd8f43d38c905df0b3fb8b8303be5284f26d1328ebcb10305d5d50"
      }
    ],
    "listing_status": "SALE_PENDING",
    "listing_history": [
      "REO snapshot 2015-07-20"
    ],
    "confidence_score": 100,
    "source_id": "usda",
    "source_name": "USDA Rural Development / FSA",
    "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
    "fetched_at": "2026-07-17T16:15:57.094Z",
    "content_hash": "d38c522a13bd8f43d38c905df0b3fb8b8303be5284f26d1328ebcb10305d5d50",
    "classification_level": "PUBLIC",
    "replay_ref": "usda-replay-p9019718586",
    "connector_id": "usda-connector",
    "jurisdiction_scope": "federal,state,county",
    "scraper_version": "usda-resale-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "usda-9033334140",
    "source_records": [
      {
        "sourceId": "usda",
        "listingId": "9033334140",
        "listingDate": "2016-02-26",
        "state": "PR",
        "county": "Caguas",
        "town": "Fajardo",
        "propertyType": "home",
        "rawPropertyStyle": "Single-family home",
        "exactAddress": "Lot 120 10st. Luis M Cint",
        "zip": "00738",
        "price": 36000,
        "bedrooms": 3,
        "yearBuilt": 40,
        "squareFeet": 1676,
        "acreageText": "1067sm",
        "program": "Direct",
        "description": "Lot 120 10st. Luis M Cintron Community, Fajardo, PR  00738; Recorded farm-14486, page-190, book-459 ; Real estate Taxes ID 178-037-009-01-000",
        "photoFile": "9033334140A.jpg",
        "listingUrl": "https://www.resales.usda.gov/resales/public/home",
        "isCurrent": false,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "usda",
        "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
        "fetched_at": "2026-07-17T16:15:57.094Z",
        "content_hash": "8149a414ffbd6774eb145b135cb0f1f31e48eb08614ea9558e31d55b71c2cb96"
      }
    ],
    "listing_status": "SALE_PENDING",
    "listing_history": [
      "REO snapshot 2016-02-26"
    ],
    "confidence_score": 100,
    "source_id": "usda",
    "source_name": "USDA Rural Development / FSA",
    "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
    "fetched_at": "2026-07-17T16:15:57.094Z",
    "content_hash": "8149a414ffbd6774eb145b135cb0f1f31e48eb08614ea9558e31d55b71c2cb96",
    "classification_level": "PUBLIC",
    "replay_ref": "usda-replay-p9033334140",
    "connector_id": "usda-connector",
    "jurisdiction_scope": "federal,state,county",
    "scraper_version": "usda-resale-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "usda-9007435473",
    "source_records": [
      {
        "sourceId": "usda",
        "listingId": "9007435473",
        "listingDate": "2015-03-25",
        "state": "PR",
        "county": "Camuy",
        "town": "Arecibo",
        "propertyType": "home",
        "rawPropertyStyle": "Single-family home",
        "exactAddress": "Lot 6 PR 664 Sabana Hoy",
        "zip": "00612",
        "price": 42100,
        "bedrooms": 3,
        "yearBuilt": 27,
        "squareFeet": 830,
        "acreageText": "652",
        "program": "Direct",
        "description": "PROPERTY LOCATED AT LOT 6 PR 664 KM 3.3 SABANA HOYOS WARD WITH 652 SM IN ARECIBO PR.  REC AT FARM 35636 BOOK 285 PAGE 853.  R/E TAXES 054-095-925-02-000",
        "photoFile": "9007435473A.jpg",
        "listingUrl": "https://www.resales.usda.gov/resales/public/home",
        "isCurrent": false,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "usda",
        "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
        "fetched_at": "2026-07-17T16:15:57.094Z",
        "content_hash": "8cbcfb94b40543ff0e792e8afe43368535b71b896e12ff14be39cd9c17c69601"
      }
    ],
    "listing_status": "SALE_PENDING",
    "listing_history": [
      "REO snapshot 2015-03-25"
    ],
    "confidence_score": 100,
    "source_id": "usda",
    "source_name": "USDA Rural Development / FSA",
    "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
    "fetched_at": "2026-07-17T16:15:57.094Z",
    "content_hash": "8cbcfb94b40543ff0e792e8afe43368535b71b896e12ff14be39cd9c17c69601",
    "classification_level": "PUBLIC",
    "replay_ref": "usda-replay-p9007435473",
    "connector_id": "usda-connector",
    "jurisdiction_scope": "federal,state,county",
    "scraper_version": "usda-resale-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "usda-9007517533",
    "source_records": [
      {
        "sourceId": "usda",
        "listingId": "9007517533",
        "listingDate": "2015-05-20",
        "state": "PR",
        "county": "Caguas",
        "town": "Ceiba",
        "propertyType": "home",
        "rawPropertyStyle": "Single-family home",
        "exactAddress": "Vegas de Ceiba C-19",
        "zip": "00735",
        "price": 32000,
        "bedrooms": 3,
        "yearBuilt": 37,
        "squareFeet": 768,
        "acreageText": "277.96",
        "program": "Direct",
        "description": "Property located at Urb. Vegas de Ceiba C-19  #1 St. Ceiba, P.R. Recorded at farm 4,019, page 95, book 64. R/E Taxes ID: 205-028-111-08-001.",
        "photoFile": "9007517533A.jpg",
        "listingUrl": "https://www.resales.usda.gov/resales/public/home",
        "isCurrent": false,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "usda",
        "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
        "fetched_at": "2026-07-17T16:15:57.094Z",
        "content_hash": "3db8cf6c120510343a31aed1500e1abc1d4d8c9bd7cd6edb4f83f59fb89208fd"
      }
    ],
    "listing_status": "SALE_PENDING",
    "listing_history": [
      "REO snapshot 2015-05-20"
    ],
    "confidence_score": 100,
    "source_id": "usda",
    "source_name": "USDA Rural Development / FSA",
    "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
    "fetched_at": "2026-07-17T16:15:57.094Z",
    "content_hash": "3db8cf6c120510343a31aed1500e1abc1d4d8c9bd7cd6edb4f83f59fb89208fd",
    "classification_level": "PUBLIC",
    "replay_ref": "usda-replay-p9007517533",
    "connector_id": "usda-connector",
    "jurisdiction_scope": "federal,state,county",
    "scraper_version": "usda-resale-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "usda-9037885213",
    "source_records": [
      {
        "sourceId": "usda",
        "listingId": "9037885213",
        "listingDate": "2014-04-10",
        "state": "PR",
        "county": "Morovis",
        "town": "Corozal",
        "propertyType": "home",
        "rawPropertyStyle": "-Frame",
        "exactAddress": "Lot 3 Rd 568 Magueyes Wd",
        "zip": "00783",
        "price": 90000,
        "bedrooms": 3,
        "yearBuilt": 8,
        "squareFeet": 1180,
        "acreageText": "2505.2677",
        "program": "Direct",
        "description": "Cat # 194-000-001-05-000\nBroker:  HMP Propeties  (787) 781-2446",
        "photoFile": "9037885213A.jpg",
        "listingUrl": "https://www.resales.usda.gov/resales/public/home",
        "isCurrent": false,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "usda",
        "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
        "fetched_at": "2026-07-17T16:15:57.094Z",
        "content_hash": "5ab0d486b83698873ca050b7153daaf3d49e3d751b0b0f7b9cfa21c8ed55b757"
      }
    ],
    "listing_status": "FOR_SALE",
    "listing_history": [
      "REO snapshot 2014-04-10"
    ],
    "confidence_score": 100,
    "source_id": "usda",
    "source_name": "USDA Rural Development / FSA",
    "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
    "fetched_at": "2026-07-17T16:15:57.094Z",
    "content_hash": "5ab0d486b83698873ca050b7153daaf3d49e3d751b0b0f7b9cfa21c8ed55b757",
    "classification_level": "PUBLIC",
    "replay_ref": "usda-replay-p9037885213",
    "connector_id": "usda-connector",
    "jurisdiction_scope": "federal,state,county",
    "scraper_version": "usda-resale-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "usda-9007238447",
    "source_records": [
      {
        "sourceId": "usda",
        "listingId": "9007238447",
        "listingDate": "2014-04-10",
        "state": "PR",
        "county": "Morovis",
        "town": "Toa Alta",
        "propertyType": "home",
        "rawPropertyStyle": "-Frame",
        "exactAddress": "Jardines Toa Alta #7",
        "zip": "00953",
        "price": 67500,
        "bedrooms": 3,
        "yearBuilt": 10,
        "squareFeet": 850,
        "acreageText": "357",
        "program": "Direct",
        "description": "Parcel # 083-040-064-07-001\nBroker:HMP PROPERTIES INC.\nAddress: Caparra Heights\n1481 Elida St. \nSan Juan, PR 00920\nOffice 787-781-2446  Fax 1-888-267-7802\nemail: info@hogarespr.com    web: www.hogarespr.com",
        "photoFile": "9007238447A.jpg",
        "listingUrl": "https://www.resales.usda.gov/resales/public/home",
        "isCurrent": false,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "usda",
        "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
        "fetched_at": "2026-07-17T16:15:57.094Z",
        "content_hash": "a00965f66cab49f2755e37fcdf43bcb5843c969015814e1d2d301f65199dca8b"
      }
    ],
    "listing_status": "FOR_SALE",
    "listing_history": [
      "REO snapshot 2014-04-10"
    ],
    "confidence_score": 100,
    "source_id": "usda",
    "source_name": "USDA Rural Development / FSA",
    "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
    "fetched_at": "2026-07-17T16:15:57.094Z",
    "content_hash": "a00965f66cab49f2755e37fcdf43bcb5843c969015814e1d2d301f65199dca8b",
    "classification_level": "PUBLIC",
    "replay_ref": "usda-replay-p9007238447",
    "connector_id": "usda-connector",
    "jurisdiction_scope": "federal,state,county",
    "scraper_version": "usda-resale-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "usda-9007383910",
    "source_records": [
      {
        "sourceId": "usda",
        "listingId": "9007383910",
        "listingDate": "2015-02-10",
        "state": "PR",
        "county": "Caguas",
        "town": "San Lorenzo",
        "propertyType": "home",
        "rawPropertyStyle": "Single-family home",
        "exactAddress": "Ward Quebrada Honda",
        "zip": "00754",
        "price": 43000,
        "bedrooms": 4,
        "yearBuilt": 30,
        "squareFeet": 1090,
        "acreageText": "205 sm",
        "program": "Direct",
        "description": "Lot of 205 sq. mts located at Ward Quebrada, San Lorenzo, P. R.  Recorded at book-198, page 210 Farm Number 10414.  R/E Taxes ID 302-000001-92-001",
        "photoFile": "9007383910A.jpg",
        "listingUrl": "https://www.resales.usda.gov/resales/public/home",
        "isCurrent": false,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "usda",
        "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
        "fetched_at": "2026-07-17T16:15:57.094Z",
        "content_hash": "66fc01d1c87d5e14e14147d4e219ce83bb1754c3550556db6dd2b055a0294409"
      }
    ],
    "listing_status": "SALE_PENDING",
    "listing_history": [
      "REO snapshot 2015-02-10"
    ],
    "confidence_score": 100,
    "source_id": "usda",
    "source_name": "USDA Rural Development / FSA",
    "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
    "fetched_at": "2026-07-17T16:15:57.094Z",
    "content_hash": "66fc01d1c87d5e14e14147d4e219ce83bb1754c3550556db6dd2b055a0294409",
    "classification_level": "PUBLIC",
    "replay_ref": "usda-replay-p9007383910",
    "connector_id": "usda-connector",
    "jurisdiction_scope": "federal,state,county",
    "scraper_version": "usda-resale-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "usda-9001009867",
    "source_records": [
      {
        "sourceId": "usda",
        "listingId": "9001009867",
        "listingDate": "2016-01-14",
        "state": "PR",
        "county": "Caguas",
        "town": "Las Piedras",
        "propertyType": "home",
        "rawPropertyStyle": "Single-family home",
        "exactAddress": "LOT 3 JOAQUIN VEGA st. CO",
        "zip": "00771",
        "price": 63500,
        "bedrooms": 3,
        "yearBuilt": 30,
        "squareFeet": 960,
        "acreageText": "1434.38 SM",
        "program": "Direct",
        "description": "LOT 3 JOAQUIN VEGA st. COLLORES WD, LAS PIEDRAS, PR  RECORDED FARM-12,577, PAGE-200, BOOK-237 ; REAL ESTATE TAXES ID 280-092-499-03-000",
        "photoFile": "9001009867A.jpg",
        "listingUrl": "https://www.resales.usda.gov/resales/public/home",
        "isCurrent": false,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "usda",
        "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
        "fetched_at": "2026-07-17T16:15:57.094Z",
        "content_hash": "9029b908cc0eaf6f97ebbc6889a1e789f5280466e68159fbd50b8846f26f57f5"
      }
    ],
    "listing_status": "FOR_SALE",
    "listing_history": [
      "REO snapshot 2016-01-14"
    ],
    "confidence_score": 100,
    "source_id": "usda",
    "source_name": "USDA Rural Development / FSA",
    "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
    "fetched_at": "2026-07-17T16:15:57.094Z",
    "content_hash": "9029b908cc0eaf6f97ebbc6889a1e789f5280466e68159fbd50b8846f26f57f5",
    "classification_level": "PUBLIC",
    "replay_ref": "usda-replay-p9001009867",
    "connector_id": "usda-connector",
    "jurisdiction_scope": "federal,state,county",
    "scraper_version": "usda-resale-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "usda-9007407207",
    "source_records": [
      {
        "sourceId": "usda",
        "listingId": "9007407207",
        "listingDate": "2015-02-26",
        "state": "PR",
        "county": "Camuy",
        "town": "Camuy",
        "propertyType": "home",
        "rawPropertyStyle": "Single-family home",
        "exactAddress": "VISTAS DE CAMUY G16",
        "zip": "00627",
        "price": 76000,
        "bedrooms": 3,
        "yearBuilt": 30,
        "squareFeet": 957,
        "acreageText": "291.08",
        "program": "Direct",
        "description": "PROPERTY LOCATED AT URB VISTAS DE CAMUY G16 WITH 291.08 SM IN CAMUY PR. REC AT FARM 14309, BOOK 254, PAGE 265. R/E TAXES 010-000-008-99-901.",
        "photoFile": "9007407207A.jpg",
        "listingUrl": "https://www.resales.usda.gov/resales/public/home",
        "isCurrent": false,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "usda",
        "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
        "fetched_at": "2026-07-17T16:15:57.094Z",
        "content_hash": "4822b42f8dd64eb03fdf3496dab143395462b9e3619e8c3f5c9de916fd272e99"
      }
    ],
    "listing_status": "SALE_PENDING",
    "listing_history": [
      "REO snapshot 2015-02-26"
    ],
    "confidence_score": 100,
    "source_id": "usda",
    "source_name": "USDA Rural Development / FSA",
    "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
    "fetched_at": "2026-07-17T16:15:57.094Z",
    "content_hash": "4822b42f8dd64eb03fdf3496dab143395462b9e3619e8c3f5c9de916fd272e99",
    "classification_level": "PUBLIC",
    "replay_ref": "usda-replay-p9007407207",
    "connector_id": "usda-connector",
    "jurisdiction_scope": "federal,state,county",
    "scraper_version": "usda-resale-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "usda-9007212515",
    "source_records": [
      {
        "sourceId": "usda",
        "listingId": "9007212515",
        "listingDate": "2016-04-21",
        "state": "PR",
        "county": "Caguas",
        "town": "Naguabo",
        "propertyType": "home",
        "rawPropertyStyle": "Single-family home",
        "exactAddress": "Q-7 19st RAMON RIVERO DIP",
        "zip": "00718",
        "price": 41300,
        "bedrooms": 3,
        "yearBuilt": 32,
        "squareFeet": 826,
        "acreageText": "325sm",
        "program": "Direct",
        "description": "Q-7 19 ST. RAMON RIVERO DIPLO DEV., NAGUABO, PR  00718. RECORDED INF. FARM-8251, PAGE-2, BOOK-146;   REAL ESTATE TAXES ID 256-042-107-05-001",
        "photoFile": "9007212515A.jpg",
        "listingUrl": "https://www.resales.usda.gov/resales/public/home",
        "isCurrent": false,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "usda",
        "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
        "fetched_at": "2026-07-17T16:15:57.094Z",
        "content_hash": "ca581c37f540beb7fc4d56758d048a3df2a93f176b1851f1b0736e178867b8c2"
      }
    ],
    "listing_status": "SALE_PENDING",
    "listing_history": [
      "REO snapshot 2016-04-21"
    ],
    "confidence_score": 100,
    "source_id": "usda",
    "source_name": "USDA Rural Development / FSA",
    "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
    "fetched_at": "2026-07-17T16:15:57.094Z",
    "content_hash": "ca581c37f540beb7fc4d56758d048a3df2a93f176b1851f1b0736e178867b8c2",
    "classification_level": "PUBLIC",
    "replay_ref": "usda-replay-p9007212515",
    "connector_id": "usda-connector",
    "jurisdiction_scope": "federal,state,county",
    "scraper_version": "usda-resale-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "usda-9082056602",
    "source_records": [
      {
        "sourceId": "usda",
        "listingId": "9082056602",
        "listingDate": "2014-12-03",
        "state": "PR",
        "county": "Caguas",
        "town": "Yabucoa",
        "propertyType": "home",
        "rawPropertyStyle": "Single-family home",
        "exactAddress": "URB. SANTA MARIA  H-6",
        "zip": "00781",
        "price": 51000,
        "bedrooms": 3,
        "yearBuilt": 35,
        "squareFeet": 888,
        "acreageText": "225SQ",
        "program": "Direct",
        "description": "URB. SANTA MARIA H-6, YABUCOA, P. R.  RECORDED AT PAGE 280; BOOK 240 FARM NUMBER 15096.  R/E TAXES ID 376-000-009-04-000.",
        "photoFile": "9082056602A.jpg",
        "listingUrl": "https://www.resales.usda.gov/resales/public/home",
        "isCurrent": false,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "usda",
        "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
        "fetched_at": "2026-07-17T16:15:57.094Z",
        "content_hash": "deca83cd8d3c9cbfecbe3cf4f74d323e9eb10c226e4a6430dccf77985b96062b"
      }
    ],
    "listing_status": "SALE_PENDING",
    "listing_history": [
      "REO snapshot 2014-12-03"
    ],
    "confidence_score": 100,
    "source_id": "usda",
    "source_name": "USDA Rural Development / FSA",
    "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
    "fetched_at": "2026-07-17T16:15:57.094Z",
    "content_hash": "deca83cd8d3c9cbfecbe3cf4f74d323e9eb10c226e4a6430dccf77985b96062b",
    "classification_level": "PUBLIC",
    "replay_ref": "usda-replay-p9082056602",
    "connector_id": "usda-connector",
    "jurisdiction_scope": "federal,state,county",
    "scraper_version": "usda-resale-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "usda-9081003203",
    "source_records": [
      {
        "sourceId": "usda",
        "listingId": "9081003203",
        "listingDate": "2016-02-02",
        "state": "PR",
        "county": "Morovis",
        "town": "Toa Alta",
        "propertyType": "home",
        "rawPropertyStyle": "-Frame",
        "exactAddress": "Lot # 2 Urb. Los Pinos",
        "zip": "00954",
        "price": 72000,
        "bedrooms": 3,
        "yearBuilt": 12,
        "squareFeet": 1003,
        "acreageText": "2045",
        "program": "Direct",
        "description": "Broker:  HMP Properties     Tel:  787-781-2446\nFax: 1-888-267-7802 \ne-mail:  info@hogarespr.com   Web: www.hogarespr.com",
        "photoFile": "9081003203A.jpg",
        "listingUrl": "https://www.resales.usda.gov/resales/public/home",
        "isCurrent": false,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "usda",
        "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
        "fetched_at": "2026-07-17T16:15:57.094Z",
        "content_hash": "20ef1ce86e6cc1efe72c6ec934bb32ca7d6124c03c1a803413c0773e53757b02"
      }
    ],
    "listing_status": "FOR_SALE",
    "listing_history": [
      "REO snapshot 2016-02-02"
    ],
    "confidence_score": 100,
    "source_id": "usda",
    "source_name": "USDA Rural Development / FSA",
    "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
    "fetched_at": "2026-07-17T16:15:57.094Z",
    "content_hash": "20ef1ce86e6cc1efe72c6ec934bb32ca7d6124c03c1a803413c0773e53757b02",
    "classification_level": "PUBLIC",
    "replay_ref": "usda-replay-p9081003203",
    "connector_id": "usda-connector",
    "jurisdiction_scope": "federal,state,county",
    "scraper_version": "usda-resale-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "usda-9007459310",
    "source_records": [
      {
        "sourceId": "usda",
        "listingId": "9007459310",
        "listingDate": "2018-01-31",
        "state": "PR",
        "county": "Juana Diaz",
        "town": "Juana Diaz",
        "propertyType": "home",
        "rawPropertyStyle": "Single-family home",
        "exactAddress": "UrbTomascarrionMaduro#94",
        "zip": "00795",
        "price": 73000,
        "bedrooms": 3,
        "yearBuilt": 21,
        "squareFeet": 919,
        "acreageText": "300",
        "program": "Direct",
        "description": "# catastro: 366-049-115-12-001",
        "photoFile": "9007459310A.jpg",
        "listingUrl": "https://www.resales.usda.gov/resales/public/home",
        "isCurrent": false,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "usda",
        "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
        "fetched_at": "2026-07-17T16:15:57.094Z",
        "content_hash": "d9c8bb074ab000b2f1a1d1ee9cbdb00ff315ed30dcd96a40f0b1e4014e135343"
      }
    ],
    "listing_status": "SALE_PENDING",
    "listing_history": [
      "REO snapshot 2018-01-31"
    ],
    "confidence_score": 100,
    "source_id": "usda",
    "source_name": "USDA Rural Development / FSA",
    "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
    "fetched_at": "2026-07-17T16:15:57.094Z",
    "content_hash": "d9c8bb074ab000b2f1a1d1ee9cbdb00ff315ed30dcd96a40f0b1e4014e135343",
    "classification_level": "PUBLIC",
    "replay_ref": "usda-replay-p9007459310",
    "connector_id": "usda-connector",
    "jurisdiction_scope": "federal,state,county",
    "scraper_version": "usda-resale-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "usda-9007472876",
    "source_records": [
      {
        "sourceId": "usda",
        "listingId": "9007472876",
        "listingDate": "2018-02-05",
        "state": "PR",
        "county": "Lares",
        "town": "Lares",
        "propertyType": "home",
        "rawPropertyStyle": "Ranch",
        "exactAddress": "Urb. Brisas de Lares B-18",
        "zip": "00669",
        "price": 78000,
        "bedrooms": 3,
        "yearBuilt": 30,
        "squareFeet": 876,
        "acreageText": "300",
        "program": "Direct",
        "description": "# Catastro: 158-222-010-15-001. Para mas inf. contactar a HPM properties al 787-781-2446 / 627-5737 / fax 1-888-267-7802",
        "photoFile": "9007472876A.jpg",
        "listingUrl": "https://www.resales.usda.gov/resales/public/home",
        "isCurrent": false,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "usda",
        "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
        "fetched_at": "2026-07-17T16:15:57.094Z",
        "content_hash": "fc947bf407c2a2ac971912e70136fb92bcd4979e0a470c3e0750f3d20e1febaa"
      }
    ],
    "listing_status": "SALE_PENDING",
    "listing_history": [
      "REO snapshot 2018-02-05"
    ],
    "confidence_score": 100,
    "source_id": "usda",
    "source_name": "USDA Rural Development / FSA",
    "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
    "fetched_at": "2026-07-17T16:15:57.094Z",
    "content_hash": "fc947bf407c2a2ac971912e70136fb92bcd4979e0a470c3e0750f3d20e1febaa",
    "classification_level": "PUBLIC",
    "replay_ref": "usda-replay-p9007472876",
    "connector_id": "usda-connector",
    "jurisdiction_scope": "federal,state,county",
    "scraper_version": "usda-resale-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "usda-9007469452",
    "source_records": [
      {
        "sourceId": "usda",
        "listingId": "9007469452",
        "listingDate": "2018-02-05",
        "state": "PR",
        "county": "Lares",
        "town": "Lares",
        "propertyType": "home",
        "rawPropertyStyle": "Ranch",
        "exactAddress": "Urb. Brisad de Lares A-1",
        "zip": "00669",
        "price": 84000,
        "bedrooms": 3,
        "yearBuilt": 30,
        "squareFeet": 1100,
        "acreageText": "374.8",
        "program": "Direct",
        "description": "Catastro: 158-098-315-01-000. Para más información pueden contactar a HPM properties: 781-2446 / 627-5737 / fax 1-888-267-7802",
        "photoFile": "9007469452A.jpg",
        "listingUrl": "https://www.resales.usda.gov/resales/public/home",
        "isCurrent": false,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "usda",
        "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
        "fetched_at": "2026-07-17T16:15:57.094Z",
        "content_hash": "ea41c140718324eb6bf278ed0d853c26e5f0100b3a3c4725481782e898270ee6"
      }
    ],
    "listing_status": "SALE_PENDING",
    "listing_history": [
      "REO snapshot 2018-02-05"
    ],
    "confidence_score": 100,
    "source_id": "usda",
    "source_name": "USDA Rural Development / FSA",
    "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
    "fetched_at": "2026-07-17T16:15:57.094Z",
    "content_hash": "ea41c140718324eb6bf278ed0d853c26e5f0100b3a3c4725481782e898270ee6",
    "classification_level": "PUBLIC",
    "replay_ref": "usda-replay-p9007469452",
    "connector_id": "usda-connector",
    "jurisdiction_scope": "federal,state,county",
    "scraper_version": "usda-resale-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "usda-9019671539",
    "source_records": [
      {
        "sourceId": "usda",
        "listingId": "9019671539",
        "listingDate": "2018-07-30",
        "state": "PR",
        "county": "Juana Diaz",
        "town": "Guayama",
        "propertyType": "home",
        "rawPropertyStyle": "Single-family home",
        "exactAddress": "Urb. Vistas delSol C-20",
        "zip": "00784",
        "price": 62000,
        "bedrooms": 3,
        "yearBuilt": 18,
        "squareFeet": 865,
        "acreageText": "299",
        "program": "Direct",
        "description": "# catastro: 442-012-608-75-000",
        "photoFile": "9019671539A.jpg",
        "listingUrl": "https://www.resales.usda.gov/resales/public/home",
        "isCurrent": false,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "usda",
        "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
        "fetched_at": "2026-07-17T16:15:57.094Z",
        "content_hash": "35164b0023c24f0f60bd37f1e31482bb8dd3aa6260f67b3b8bc8d2a5f954ad51"
      }
    ],
    "listing_status": "SALE_PENDING",
    "listing_history": [
      "REO snapshot 2018-07-30"
    ],
    "confidence_score": 100,
    "source_id": "usda",
    "source_name": "USDA Rural Development / FSA",
    "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
    "fetched_at": "2026-07-17T16:15:57.094Z",
    "content_hash": "35164b0023c24f0f60bd37f1e31482bb8dd3aa6260f67b3b8bc8d2a5f954ad51",
    "classification_level": "PUBLIC",
    "replay_ref": "usda-replay-p9019671539",
    "connector_id": "usda-connector",
    "jurisdiction_scope": "federal,state,county",
    "scraper_version": "usda-resale-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "usda-9035951945",
    "source_records": [
      {
        "sourceId": "usda",
        "listingId": "9035951945",
        "listingDate": "2016-04-25",
        "state": "PR",
        "county": "Morovis",
        "town": "Manati",
        "propertyType": "home",
        "rawPropertyStyle": "-Frame",
        "exactAddress": "184 Parcelas Pinzon",
        "zip": "00674",
        "price": 68000,
        "bedrooms": 3,
        "yearBuilt": 40,
        "squareFeet": 666,
        "acreageText": "5649.70",
        "program": "Direct",
        "description": "Broker:  HMP Properties  Phone# 787-781-2446\nemail:  info@hogarespr.com\nWeb: www.hogarespr.com",
        "photoFile": "9035951945A.jpg",
        "listingUrl": "https://www.resales.usda.gov/resales/public/home",
        "isCurrent": false,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "usda",
        "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
        "fetched_at": "2026-07-17T16:15:57.094Z",
        "content_hash": "3d130559628e8278516da6cc608dadc3e254c7b408d629b7fc660c2deb7f9cf7"
      }
    ],
    "listing_status": "FOR_SALE",
    "listing_history": [
      "REO snapshot 2016-04-25"
    ],
    "confidence_score": 100,
    "source_id": "usda",
    "source_name": "USDA Rural Development / FSA",
    "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
    "fetched_at": "2026-07-17T16:15:57.094Z",
    "content_hash": "3d130559628e8278516da6cc608dadc3e254c7b408d629b7fc660c2deb7f9cf7",
    "classification_level": "PUBLIC",
    "replay_ref": "usda-replay-p9035951945",
    "connector_id": "usda-connector",
    "jurisdiction_scope": "federal,state,county",
    "scraper_version": "usda-resale-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "usda-907228185",
    "source_records": [
      {
        "sourceId": "usda",
        "listingId": "907228185",
        "listingDate": "2018-07-30",
        "state": "PR",
        "county": "Juana Diaz",
        "town": "Patillas",
        "propertyType": "home",
        "rawPropertyStyle": "Single-family home",
        "exactAddress": "UrbSan Martin #45 St3",
        "zip": "00723",
        "price": 55000,
        "bedrooms": 3,
        "yearBuilt": 38,
        "squareFeet": 1029,
        "acreageText": "276",
        "program": "Direct",
        "description": "# catastro 398-079-058-11-001",
        "photoFile": "907228185A.jpg",
        "listingUrl": "https://www.resales.usda.gov/resales/public/home",
        "isCurrent": false,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "usda",
        "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
        "fetched_at": "2026-07-17T16:15:57.094Z",
        "content_hash": "78a57b9ab3c7e48db689be484ec8947abf8eac3b757bfe69f5510816acc5d221"
      }
    ],
    "listing_status": "SALE_PENDING",
    "listing_history": [
      "REO snapshot 2018-07-30"
    ],
    "confidence_score": 100,
    "source_id": "usda",
    "source_name": "USDA Rural Development / FSA",
    "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
    "fetched_at": "2026-07-17T16:15:57.094Z",
    "content_hash": "78a57b9ab3c7e48db689be484ec8947abf8eac3b757bfe69f5510816acc5d221",
    "classification_level": "PUBLIC",
    "replay_ref": "usda-replay-p907228185",
    "connector_id": "usda-connector",
    "jurisdiction_scope": "federal,state,county",
    "scraper_version": "usda-resale-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "usda-9007412438",
    "source_records": [
      {
        "sourceId": "usda",
        "listingId": "9007412438",
        "listingDate": "2014-09-11",
        "state": "PR",
        "county": "Camuy",
        "town": "Camuy",
        "propertyType": "home",
        "rawPropertyStyle": "Single-family home",
        "exactAddress": "VISTAS DE CAMUY E5",
        "zip": "00627",
        "price": 45500,
        "bedrooms": 3,
        "yearBuilt": 27,
        "squareFeet": 880,
        "acreageText": "210",
        "program": "Direct",
        "description": "PROPERTY LOCATED AT URB VISTAS DE CAMUY E5 WITH 211 SM IN CAMUY PR. REC AT FARM 14374, BOOK 251, PAGE 255. R/E TAXES 010-075-563-21-000.",
        "photoFile": "9007412438A.jpg",
        "listingUrl": "https://www.resales.usda.gov/resales/public/home",
        "isCurrent": false,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "usda",
        "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
        "fetched_at": "2026-07-17T16:15:57.094Z",
        "content_hash": "be77aa6017e7c96705f877a01e0eafe190457d6b7d214b84748539f2d61d4df1"
      }
    ],
    "listing_status": "SALE_PENDING",
    "listing_history": [
      "REO snapshot 2014-09-11"
    ],
    "confidence_score": 100,
    "source_id": "usda",
    "source_name": "USDA Rural Development / FSA",
    "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
    "fetched_at": "2026-07-17T16:15:57.094Z",
    "content_hash": "be77aa6017e7c96705f877a01e0eafe190457d6b7d214b84748539f2d61d4df1",
    "classification_level": "PUBLIC",
    "replay_ref": "usda-replay-p9007412438",
    "connector_id": "usda-connector",
    "jurisdiction_scope": "federal,state,county",
    "scraper_version": "usda-resale-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "usda-9007418788",
    "source_records": [
      {
        "sourceId": "usda",
        "listingId": "9007418788",
        "listingDate": "2014-09-11",
        "state": "PR",
        "county": "Camuy",
        "town": "Quebradillas",
        "propertyType": "home",
        "rawPropertyStyle": "Single-family home",
        "exactAddress": "TERRANOVA COMM 171",
        "zip": "00678",
        "price": 38700,
        "bedrooms": 3,
        "yearBuilt": 37,
        "squareFeet": 853,
        "acreageText": "368",
        "program": "Direct",
        "description": "PROPERTY LOCATED AT TERRANOVA COMM LOT 171 WITH 368 SM IN QUEBRADILLAS PR. REC AT FARM 5626 BOOK 108 PAGE 265. R/E TAXES 008-099-362-15-001.",
        "photoFile": "9007418788A.jpg",
        "listingUrl": "https://www.resales.usda.gov/resales/public/home",
        "isCurrent": false,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "usda",
        "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
        "fetched_at": "2026-07-17T16:15:57.094Z",
        "content_hash": "8aa34934e5f0319bbfdf8c05e4697eb8ec52925724b0839868665a42ef286de6"
      }
    ],
    "listing_status": "SALE_PENDING",
    "listing_history": [
      "REO snapshot 2014-09-11"
    ],
    "confidence_score": 100,
    "source_id": "usda",
    "source_name": "USDA Rural Development / FSA",
    "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
    "fetched_at": "2026-07-17T16:15:57.094Z",
    "content_hash": "8aa34934e5f0319bbfdf8c05e4697eb8ec52925724b0839868665a42ef286de6",
    "classification_level": "PUBLIC",
    "replay_ref": "usda-replay-p9007418788",
    "connector_id": "usda-connector",
    "jurisdiction_scope": "federal,state,county",
    "scraper_version": "usda-resale-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "usda-9007475187",
    "source_records": [
      {
        "sourceId": "usda",
        "listingId": "9007475187",
        "listingDate": "2016-07-01",
        "state": "PR",
        "county": "Adjuntas",
        "town": "Adjuntas",
        "propertyType": "home",
        "rawPropertyStyle": "Ranch",
        "exactAddress": "Limani Ward SR 525 R 5525",
        "zip": "00601",
        "price": 70000,
        "bedrooms": 3,
        "yearBuilt": 35,
        "squareFeet": 1080,
        "acreageText": "28 cdas",
        "program": "Direct",
        "description": "Concrete property with 28 acres (cdas). \n# de Catastro: 265-000-007-13-001",
        "photoFile": "9007475187A.jpg",
        "listingUrl": "https://www.resales.usda.gov/resales/public/home",
        "isCurrent": false,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "usda",
        "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
        "fetched_at": "2026-07-17T16:15:57.094Z",
        "content_hash": "6022169bc1cc451de60863a2a09bc64900932f2059db973a8cc14a622c67b427"
      }
    ],
    "listing_status": "FOR_SALE",
    "listing_history": [
      "REO snapshot 2016-07-01"
    ],
    "confidence_score": 100,
    "source_id": "usda",
    "source_name": "USDA Rural Development / FSA",
    "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
    "fetched_at": "2026-07-17T16:15:57.094Z",
    "content_hash": "6022169bc1cc451de60863a2a09bc64900932f2059db973a8cc14a622c67b427",
    "classification_level": "PUBLIC",
    "replay_ref": "usda-replay-p9007475187",
    "connector_id": "usda-connector",
    "jurisdiction_scope": "federal,state,county",
    "scraper_version": "usda-resale-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "usda-9031090059",
    "source_records": [
      {
        "sourceId": "usda",
        "listingId": "9031090059",
        "listingDate": "2017-07-05",
        "state": "PR",
        "county": "Florida",
        "town": "Florida",
        "propertyType": "home",
        "rawPropertyStyle": "Ranch",
        "exactAddress": "#174 Ramon Torres St, Fog",
        "zip": "00650",
        "price": 57000,
        "bedrooms": 2,
        "yearBuilt": 32,
        "squareFeet": 725,
        "acreageText": "314",
        "program": "Direct",
        "description": "# catastro:106-049-014-43-015. For more information please call to HPM Properties at 787-781-2446,787-627-5737",
        "photoFile": "9031090059A.jpg",
        "listingUrl": "https://www.resales.usda.gov/resales/public/home",
        "isCurrent": false,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "usda",
        "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
        "fetched_at": "2026-07-17T16:15:57.094Z",
        "content_hash": "93587acce722a16c5dd62de919c3635ec075e25ad9560f46e24934ccaebe669c"
      }
    ],
    "listing_status": "FOR_SALE",
    "listing_history": [
      "REO snapshot 2017-07-05"
    ],
    "confidence_score": 100,
    "source_id": "usda",
    "source_name": "USDA Rural Development / FSA",
    "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
    "fetched_at": "2026-07-17T16:15:57.094Z",
    "content_hash": "93587acce722a16c5dd62de919c3635ec075e25ad9560f46e24934ccaebe669c",
    "classification_level": "PUBLIC",
    "replay_ref": "usda-replay-p9031090059",
    "connector_id": "usda-connector",
    "jurisdiction_scope": "federal,state,county",
    "scraper_version": "usda-resale-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "usda-9007245838",
    "source_records": [
      {
        "sourceId": "usda",
        "listingId": "9007245838",
        "listingDate": "2014-11-04",
        "state": "PR",
        "county": "Caguas",
        "town": "Bayamon",
        "propertyType": "home",
        "rawPropertyStyle": "Single-family home",
        "exactAddress": "PR 879 Km 2.3 Int.",
        "zip": "00956",
        "price": 95000,
        "bedrooms": 3,
        "yearBuilt": 30,
        "squareFeet": 1308,
        "acreageText": "27014.1434",
        "program": "Direct",
        "description": "Property located at PR #879 Km 2.3 Int. Guaraguao Ward Bayamon, P.R. Recorded at farm 11,759, page 217, book 130. R/E Taxes ID: 197-000-002-55-998.",
        "photoFile": "9007245838A.jpg",
        "listingUrl": "https://www.resales.usda.gov/resales/public/home",
        "isCurrent": false,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "usda",
        "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
        "fetched_at": "2026-07-17T16:15:57.094Z",
        "content_hash": "0bd53d710684a6fb17e14397d81e7e4dac16ab3439f0ef2b3b948310c7661e90"
      }
    ],
    "listing_status": "FOR_SALE",
    "listing_history": [
      "REO snapshot 2014-11-04"
    ],
    "confidence_score": 100,
    "source_id": "usda",
    "source_name": "USDA Rural Development / FSA",
    "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
    "fetched_at": "2026-07-17T16:15:57.094Z",
    "content_hash": "0bd53d710684a6fb17e14397d81e7e4dac16ab3439f0ef2b3b948310c7661e90",
    "classification_level": "PUBLIC",
    "replay_ref": "usda-replay-p9007245838",
    "connector_id": "usda-connector",
    "jurisdiction_scope": "federal,state,county",
    "scraper_version": "usda-resale-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "usda-9082089718",
    "source_records": [
      {
        "sourceId": "usda",
        "listingId": "9082089718",
        "listingDate": "2014-11-04",
        "state": "PR",
        "county": "Caguas",
        "town": "Juncos",
        "propertyType": "home",
        "rawPropertyStyle": "Single-family home",
        "exactAddress": "#48 Daniel Flores",
        "zip": "00777",
        "price": 26000,
        "bedrooms": 3,
        "yearBuilt": 49,
        "squareFeet": 614,
        "acreageText": "123.00",
        "program": "Direct",
        "description": "Property located at #48 Daniel Flores Fraternidad St. Juncos Town Juncos, P.R. Recorded at farm 4,909, page 26, book 131. R/E Taxes ID: 227-062-050-18-001.",
        "photoFile": "9082089718A.jpg",
        "listingUrl": "https://www.resales.usda.gov/resales/public/home",
        "isCurrent": false,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "usda",
        "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
        "fetched_at": "2026-07-17T16:15:57.094Z",
        "content_hash": "b5db47cca52082c5964f74aa42d8166f609814987e2d4529b3d4cc50078b89f9"
      }
    ],
    "listing_status": "SALE_PENDING",
    "listing_history": [
      "REO snapshot 2014-11-04"
    ],
    "confidence_score": 100,
    "source_id": "usda",
    "source_name": "USDA Rural Development / FSA",
    "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
    "fetched_at": "2026-07-17T16:15:57.094Z",
    "content_hash": "b5db47cca52082c5964f74aa42d8166f609814987e2d4529b3d4cc50078b89f9",
    "classification_level": "PUBLIC",
    "replay_ref": "usda-replay-p9082089718",
    "connector_id": "usda-connector",
    "jurisdiction_scope": "federal,state,county",
    "scraper_version": "usda-resale-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "usda-9022212820",
    "source_records": [
      {
        "sourceId": "usda",
        "listingId": "9022212820",
        "listingDate": "2014-11-04",
        "state": "PR",
        "county": "Caguas",
        "town": "Gurabo",
        "propertyType": "home",
        "rawPropertyStyle": "Single-family home",
        "exactAddress": "Villa Alegre Comm. A-38",
        "zip": "00778",
        "price": 50000,
        "bedrooms": 3,
        "yearBuilt": 36,
        "squareFeet": 1094,
        "acreageText": "292.98 sm",
        "program": "Direct",
        "description": "Property located at Villa Alegre Community A-38 1 St. Rincon Ward Gurabo, P.R. Recorded at farm 8,338, page 129, book 216. R/E Taxes ID: 200-074-165-25-001.",
        "photoFile": "9022212820A.jpg",
        "listingUrl": "https://www.resales.usda.gov/resales/public/home",
        "isCurrent": false,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "usda",
        "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
        "fetched_at": "2026-07-17T16:15:57.094Z",
        "content_hash": "bc66e7d972bdb480bca03e4d8eb56526c7de00d1f8f612e08ad12828280a2f78"
      }
    ],
    "listing_status": "SALE_PENDING",
    "listing_history": [
      "REO snapshot 2014-11-04"
    ],
    "confidence_score": 100,
    "source_id": "usda",
    "source_name": "USDA Rural Development / FSA",
    "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
    "fetched_at": "2026-07-17T16:15:57.094Z",
    "content_hash": "bc66e7d972bdb480bca03e4d8eb56526c7de00d1f8f612e08ad12828280a2f78",
    "classification_level": "PUBLIC",
    "replay_ref": "usda-replay-p9022212820",
    "connector_id": "usda-connector",
    "jurisdiction_scope": "federal,state,county",
    "scraper_version": "usda-resale-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "usda-9007231295",
    "source_records": [
      {
        "sourceId": "usda",
        "listingId": "9007231295",
        "listingDate": "2014-05-27",
        "state": "PR",
        "county": "Juana Diaz",
        "town": "Arroyo",
        "propertyType": "home",
        "rawPropertyStyle": "Single-family home",
        "exactAddress": "Urb.SanAntonioB-41StE",
        "zip": "00714",
        "price": 35000,
        "bedrooms": 3,
        "yearBuilt": 16,
        "squareFeet": 848,
        "acreageText": "315",
        "program": "Direct",
        "description": "Catastro:421-081-121-16-001\nTomo 80 Folio 90 Finca # 2982",
        "photoFile": "9007231295A.jpg",
        "listingUrl": "https://www.resales.usda.gov/resales/public/home",
        "isCurrent": false,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "usda",
        "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
        "fetched_at": "2026-07-17T16:15:57.094Z",
        "content_hash": "28e0d30b7c0ea7376c4b0fad524c150c536479736558632691b1cf6bc9bf4edd"
      }
    ],
    "listing_status": "SALE_PENDING",
    "listing_history": [
      "REO snapshot 2014-05-27"
    ],
    "confidence_score": 100,
    "source_id": "usda",
    "source_name": "USDA Rural Development / FSA",
    "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
    "fetched_at": "2026-07-17T16:15:57.094Z",
    "content_hash": "28e0d30b7c0ea7376c4b0fad524c150c536479736558632691b1cf6bc9bf4edd",
    "classification_level": "PUBLIC",
    "replay_ref": "usda-replay-p9007231295",
    "connector_id": "usda-connector",
    "jurisdiction_scope": "federal,state,county",
    "scraper_version": "usda-resale-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "usda-9081008185",
    "source_records": [
      {
        "sourceId": "usda",
        "listingId": "9081008185",
        "listingDate": "2015-04-21",
        "state": "PR",
        "county": "Morovis",
        "town": "Corozal",
        "propertyType": "home",
        "rawPropertyStyle": "-Frame",
        "exactAddress": "RD 802 KM 4.2 Mana WD",
        "zip": "00783",
        "price": 65000,
        "bedrooms": 3,
        "yearBuilt": 30,
        "squareFeet": 921,
        "acreageText": "10764",
        "program": "Direct",
        "description": "Parcel #: 195-000-001-11-901\nBroker:  HMP PROPERTIES INC.\nAddress: Caparra Heights  1481 Elida St. \nSan Juan, PR 00920     Office 787-781-2446\nFax 1-888-267-7802   email: info@hogarespr.com\nweb: www.hogarespr.com",
        "photoFile": "9081008185A.jpg",
        "listingUrl": "https://www.resales.usda.gov/resales/public/home",
        "isCurrent": false,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "usda",
        "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
        "fetched_at": "2026-07-17T16:15:57.094Z",
        "content_hash": "410f1ea932facad7426d13781cba053b562e2881f15d65fb310878e435d6b587"
      }
    ],
    "listing_status": "SALE_PENDING",
    "listing_history": [
      "REO snapshot 2015-04-21"
    ],
    "confidence_score": 100,
    "source_id": "usda",
    "source_name": "USDA Rural Development / FSA",
    "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
    "fetched_at": "2026-07-17T16:15:57.094Z",
    "content_hash": "410f1ea932facad7426d13781cba053b562e2881f15d65fb310878e435d6b587",
    "classification_level": "PUBLIC",
    "replay_ref": "usda-replay-p9081008185",
    "connector_id": "usda-connector",
    "jurisdiction_scope": "federal,state,county",
    "scraper_version": "usda-resale-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "usda-9030378646",
    "source_records": [
      {
        "sourceId": "usda",
        "listingId": "9030378646",
        "listingDate": "2017-06-06",
        "state": "PR",
        "county": "Juana Diaz",
        "town": "Arroyo",
        "propertyType": "home",
        "rawPropertyStyle": "Single-family home",
        "exactAddress": "Jardines Arroyo F-18",
        "zip": "00714",
        "price": 70000,
        "bedrooms": 3,
        "yearBuilt": 37,
        "squareFeet": 769,
        "acreageText": "325",
        "program": "Direct",
        "description": "# catastro=421-071-124-18-001\nFarm 2771 book 85 page 244",
        "photoFile": "9030378646A.jpg",
        "listingUrl": "https://www.resales.usda.gov/resales/public/home",
        "isCurrent": false,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "usda",
        "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
        "fetched_at": "2026-07-17T16:15:57.094Z",
        "content_hash": "a2abe37b438d058c4d8bf74b2f63c9025b50ab77a83735225653fc4734dd197a"
      }
    ],
    "listing_status": "SALE_PENDING",
    "listing_history": [
      "REO snapshot 2017-06-06"
    ],
    "confidence_score": 100,
    "source_id": "usda",
    "source_name": "USDA Rural Development / FSA",
    "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
    "fetched_at": "2026-07-17T16:15:57.094Z",
    "content_hash": "a2abe37b438d058c4d8bf74b2f63c9025b50ab77a83735225653fc4734dd197a",
    "classification_level": "PUBLIC",
    "replay_ref": "usda-replay-p9030378646",
    "connector_id": "usda-connector",
    "jurisdiction_scope": "federal,state,county",
    "scraper_version": "usda-resale-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "usda-9031622715",
    "source_records": [
      {
        "sourceId": "usda",
        "listingId": "9031622715",
        "listingDate": "2014-04-25",
        "state": "PR",
        "county": "Florida",
        "town": "Florida",
        "propertyType": "home",
        "rawPropertyStyle": "Ranch",
        "exactAddress": "Rd. 667 Pajonal Wd. Seoan",
        "zip": "00650",
        "price": 52000,
        "bedrooms": 3,
        "yearBuilt": 10,
        "squareFeet": 901,
        "acreageText": "650",
        "program": "Direct",
        "description": "# de Catastro: 079-033-111-20-000. Para mas inf. favor de comunicarse con HMP Properties al 787-781-2446/888-267-7802. mplaca@hogarespr.com/hpineiro@hogarespr.com",
        "photoFile": "9031622715A.jpg",
        "listingUrl": "https://www.resales.usda.gov/resales/public/home",
        "isCurrent": false,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "usda",
        "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
        "fetched_at": "2026-07-17T16:15:57.094Z",
        "content_hash": "727008a76dd426280ff7d1bf6d5c4e8555b7308319fc81ce985b62a19ee6934f"
      }
    ],
    "listing_status": "FOR_SALE",
    "listing_history": [
      "REO snapshot 2014-04-25"
    ],
    "confidence_score": 100,
    "source_id": "usda",
    "source_name": "USDA Rural Development / FSA",
    "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
    "fetched_at": "2026-07-17T16:15:57.094Z",
    "content_hash": "727008a76dd426280ff7d1bf6d5c4e8555b7308319fc81ce985b62a19ee6934f",
    "classification_level": "PUBLIC",
    "replay_ref": "usda-replay-p9031622715",
    "connector_id": "usda-connector",
    "jurisdiction_scope": "federal,state,county",
    "scraper_version": "usda-resale-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "usda-9007201005",
    "source_records": [
      {
        "sourceId": "usda",
        "listingId": "9007201005",
        "listingDate": "2014-11-04",
        "state": "PR",
        "county": "Caguas",
        "town": "Humacao",
        "propertyType": "home",
        "rawPropertyStyle": "Single-family home",
        "exactAddress": "Verdemar #483 27 St.",
        "zip": "00791",
        "price": 40000,
        "bedrooms": 3,
        "yearBuilt": 34,
        "squareFeet": 840,
        "acreageText": "356.12 sm",
        "program": "Direct",
        "description": "Property located at Urb. Verdemar Lot #483 27 St. Humacao, P.R. Recorded at farm 11,200, page 275, book 284. R/E Taxes ID: 281-069-398-01-001.",
        "photoFile": "9007201005A.jpg",
        "listingUrl": "https://www.resales.usda.gov/resales/public/home",
        "isCurrent": false,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "usda",
        "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
        "fetched_at": "2026-07-17T16:15:57.094Z",
        "content_hash": "dced84fcb3957d096cfc26a08db01dd1350102df277848ecf434a3d12940140e"
      }
    ],
    "listing_status": "SALE_PENDING",
    "listing_history": [
      "REO snapshot 2014-11-04"
    ],
    "confidence_score": 100,
    "source_id": "usda",
    "source_name": "USDA Rural Development / FSA",
    "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
    "fetched_at": "2026-07-17T16:15:57.094Z",
    "content_hash": "dced84fcb3957d096cfc26a08db01dd1350102df277848ecf434a3d12940140e",
    "classification_level": "PUBLIC",
    "replay_ref": "usda-replay-p9007201005",
    "connector_id": "usda-connector",
    "jurisdiction_scope": "federal,state,county",
    "scraper_version": "usda-resale-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "usda-9007374518",
    "source_records": [
      {
        "sourceId": "usda",
        "listingId": "9007374518",
        "listingDate": "2014-11-19",
        "state": "PR",
        "county": "Camuy",
        "town": "Isabela",
        "propertyType": "home",
        "rawPropertyStyle": "Single-family home",
        "exactAddress": "Jardines de Miramar D-3",
        "zip": "00662",
        "price": 38000,
        "bedrooms": 4,
        "yearBuilt": 41,
        "squareFeet": 1413,
        "acreageText": "137 sm",
        "program": "Direct",
        "description": "Property located at Urb. Jardines de Miramar D-3 Isabela, P.R. Recorded at farm 8,877, page 26, book 214. R/E Taxes ID: 003-087-295-10-001.",
        "photoFile": "9007374518A.jpg",
        "listingUrl": "https://www.resales.usda.gov/resales/public/home",
        "isCurrent": false,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "usda",
        "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
        "fetched_at": "2026-07-17T16:15:57.094Z",
        "content_hash": "51d4acafb79938fcd6f9d0b463a9abf7a7ca11979c40b502fd230d70b4c2453d"
      }
    ],
    "listing_status": "SALE_PENDING",
    "listing_history": [
      "REO snapshot 2014-11-19"
    ],
    "confidence_score": 100,
    "source_id": "usda",
    "source_name": "USDA Rural Development / FSA",
    "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
    "fetched_at": "2026-07-17T16:15:57.094Z",
    "content_hash": "51d4acafb79938fcd6f9d0b463a9abf7a7ca11979c40b502fd230d70b4c2453d",
    "classification_level": "PUBLIC",
    "replay_ref": "usda-replay-p9007374518",
    "connector_id": "usda-connector",
    "jurisdiction_scope": "federal,state,county",
    "scraper_version": "usda-resale-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "usda-9007277631",
    "source_records": [
      {
        "sourceId": "usda",
        "listingId": "9007277631",
        "listingDate": "2017-04-21",
        "state": "PR",
        "county": "Morovis",
        "town": "Corozal",
        "propertyType": "home",
        "rawPropertyStyle": "-Frame",
        "exactAddress": "807 Palos Blanco Ward",
        "zip": "00783",
        "price": 74000,
        "bedrooms": 3,
        "yearBuilt": 36,
        "squareFeet": 908,
        "acreageText": "1899x",
        "program": "Direct",
        "description": "Broker:  HMP PROPERTIES INC.\nAddress: Caparra Heights\n1481 Elida St. \nSan Juan, PR 00920\nOffice 787-781-2446   Fax 1-888-267-7802\nemail: info@hogarespr.com  web: www.hogarespr.com\nParcel # 167-000-005-59-000",
        "photoFile": "9007277631A.jpg",
        "listingUrl": "https://www.resales.usda.gov/resales/public/home",
        "isCurrent": false,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "usda",
        "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
        "fetched_at": "2026-07-17T16:15:57.094Z",
        "content_hash": "a812be42c106f36ce7968a9e4ac682d271f3d6067eb800bb4c976f0621858c87"
      }
    ],
    "listing_status": "SALE_PENDING",
    "listing_history": [
      "REO snapshot 2017-04-21"
    ],
    "confidence_score": 100,
    "source_id": "usda",
    "source_name": "USDA Rural Development / FSA",
    "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
    "fetched_at": "2026-07-17T16:15:57.094Z",
    "content_hash": "a812be42c106f36ce7968a9e4ac682d271f3d6067eb800bb4c976f0621858c87",
    "classification_level": "PUBLIC",
    "replay_ref": "usda-replay-p9007277631",
    "connector_id": "usda-connector",
    "jurisdiction_scope": "federal,state,county",
    "scraper_version": "usda-resale-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "usda-9040768550",
    "source_records": [
      {
        "sourceId": "usda",
        "listingId": "9040768550",
        "listingDate": "2018-04-26",
        "state": "PR",
        "county": "Juana Diaz",
        "town": "Patillas",
        "propertyType": "home",
        "rawPropertyStyle": "Single-family home",
        "exactAddress": "Valle de Providencia J-5",
        "zip": "00723",
        "price": 53000,
        "bedrooms": 3,
        "yearBuilt": 21,
        "squareFeet": 850,
        "acreageText": "300",
        "program": "Direct",
        "description": "Catastro 421-030-316-76-000",
        "photoFile": "9040768550A.jpg",
        "listingUrl": "https://www.resales.usda.gov/resales/public/home",
        "isCurrent": false,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "usda",
        "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
        "fetched_at": "2026-07-17T16:15:57.094Z",
        "content_hash": "a4243ab0f6bfdf26dec764747dcc6099444e0620cf2bb160756574ff5566cf5b"
      }
    ],
    "listing_status": "SALE_PENDING",
    "listing_history": [
      "REO snapshot 2018-04-26"
    ],
    "confidence_score": 100,
    "source_id": "usda",
    "source_name": "USDA Rural Development / FSA",
    "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
    "fetched_at": "2026-07-17T16:15:57.094Z",
    "content_hash": "a4243ab0f6bfdf26dec764747dcc6099444e0620cf2bb160756574ff5566cf5b",
    "classification_level": "PUBLIC",
    "replay_ref": "usda-replay-p9040768550",
    "connector_id": "usda-connector",
    "jurisdiction_scope": "federal,state,county",
    "scraper_version": "usda-resale-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "usda-9007408099",
    "source_records": [
      {
        "sourceId": "usda",
        "listingId": "9007408099",
        "listingDate": "2015-02-26",
        "state": "PR",
        "county": "Camuy",
        "town": "Hatillo",
        "propertyType": "home",
        "rawPropertyStyle": "Single-family home",
        "exactAddress": "Corales de Hatillo F3",
        "zip": "00659",
        "price": 39600,
        "bedrooms": 3,
        "yearBuilt": 37,
        "squareFeet": 830,
        "acreageText": "302",
        "program": "Direct",
        "description": "PROPERTY LOCATED AT URB CORALES DE HATILLO F3 WITH 302 SM IN HATILLO PR.  REC AT FARM 17472, BOOK 136, PAGE 268.  R/E TAXES 05-011-024-126-03-01.",
        "photoFile": "9007408099A.jpg",
        "listingUrl": "https://www.resales.usda.gov/resales/public/home",
        "isCurrent": false,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "usda",
        "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
        "fetched_at": "2026-07-17T16:15:57.094Z",
        "content_hash": "0464744e935ac8d6b7bc76d9a469b221e74650adfac94e516a72e13a96564f5b"
      }
    ],
    "listing_status": "SALE_PENDING",
    "listing_history": [
      "REO snapshot 2015-02-26"
    ],
    "confidence_score": 100,
    "source_id": "usda",
    "source_name": "USDA Rural Development / FSA",
    "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
    "fetched_at": "2026-07-17T16:15:57.094Z",
    "content_hash": "0464744e935ac8d6b7bc76d9a469b221e74650adfac94e516a72e13a96564f5b",
    "classification_level": "PUBLIC",
    "replay_ref": "usda-replay-p9007408099",
    "connector_id": "usda-connector",
    "jurisdiction_scope": "federal,state,county",
    "scraper_version": "usda-resale-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "usda-9007379979",
    "source_records": [
      {
        "sourceId": "usda",
        "listingId": "9007379979",
        "listingDate": "2018-02-08",
        "state": "PR",
        "county": "Camuy",
        "town": "Isabela",
        "propertyType": "home",
        "rawPropertyStyle": "Single-family home",
        "exactAddress": "Costa Brava B-25",
        "zip": "00662",
        "price": 89000,
        "bedrooms": 3,
        "yearBuilt": 33,
        "squareFeet": 1056,
        "acreageText": "319.96",
        "program": "Direct",
        "description": "PROPERTY LOCATED AT URB VISTAS DE CAMUY L14 WITH319.96 SM IN CAMUY PR  R/E TAXES 003-075-279-15-000",
        "photoFile": null,
        "listingUrl": "https://www.resales.usda.gov/resales/public/home",
        "isCurrent": false,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "usda",
        "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
        "fetched_at": "2026-07-17T16:15:57.094Z",
        "content_hash": "d0b4b20f2e07d01139c3d3046a776080bb594810b4ac23ce0dbee0e127db48f7"
      }
    ],
    "listing_status": "SALE_PENDING",
    "listing_history": [
      "REO snapshot 2018-02-08"
    ],
    "confidence_score": 100,
    "source_id": "usda",
    "source_name": "USDA Rural Development / FSA",
    "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
    "fetched_at": "2026-07-17T16:15:57.094Z",
    "content_hash": "d0b4b20f2e07d01139c3d3046a776080bb594810b4ac23ce0dbee0e127db48f7",
    "classification_level": "PUBLIC",
    "replay_ref": "usda-replay-p9007379979",
    "connector_id": "usda-connector",
    "jurisdiction_scope": "federal,state,county",
    "scraper_version": "usda-resale-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "usda-9007452126",
    "source_records": [
      {
        "sourceId": "usda",
        "listingId": "9007452126",
        "listingDate": "2018-02-08",
        "state": "PR",
        "county": "Juana Diaz",
        "town": "Santa Isabel",
        "propertyType": "home",
        "rawPropertyStyle": "Single-family home",
        "exactAddress": "El Flamboyan F-6",
        "zip": "00757",
        "price": 68000,
        "bedrooms": 3,
        "yearBuilt": 42,
        "squareFeet": 851,
        "acreageText": "343",
        "program": "Direct",
        "description": "# catastro 415-095-165-06-001",
        "photoFile": "9007452126A.jpg",
        "listingUrl": "https://www.resales.usda.gov/resales/public/home",
        "isCurrent": false,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "usda",
        "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
        "fetched_at": "2026-07-17T16:15:57.094Z",
        "content_hash": "7550fbcfc1d9b2cd4ebdf84f0894adca0319936651f9f2115a5f774973d2bb42"
      }
    ],
    "listing_status": "SALE_PENDING",
    "listing_history": [
      "REO snapshot 2018-02-08"
    ],
    "confidence_score": 100,
    "source_id": "usda",
    "source_name": "USDA Rural Development / FSA",
    "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
    "fetched_at": "2026-07-17T16:15:57.094Z",
    "content_hash": "7550fbcfc1d9b2cd4ebdf84f0894adca0319936651f9f2115a5f774973d2bb42",
    "classification_level": "PUBLIC",
    "replay_ref": "usda-replay-p9007452126",
    "connector_id": "usda-connector",
    "jurisdiction_scope": "federal,state,county",
    "scraper_version": "usda-resale-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "usda-9007283735",
    "source_records": [
      {
        "sourceId": "usda",
        "listingId": "9007283735",
        "listingDate": "2014-11-06",
        "state": "PR",
        "county": "Caguas",
        "town": "Barranquitas",
        "propertyType": "home",
        "rawPropertyStyle": "Single-family home",
        "exactAddress": "Road 152 Km 2.9 Int.",
        "zip": "00794",
        "price": 61000,
        "bedrooms": 3,
        "yearBuilt": 25,
        "squareFeet": 973,
        "acreageText": "350.003",
        "program": "Direct",
        "description": "Property located at PR #152 Km 2.9 Interior Collao's Sector Barrancas Ward Barranquitas, P.R. Recorded at farm 11,700, page 189, book 202. R/E Taxes ID: 220-000-010-76-000.",
        "photoFile": "9007283735A.jpg",
        "listingUrl": "https://www.resales.usda.gov/resales/public/home",
        "isCurrent": false,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "usda",
        "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
        "fetched_at": "2026-07-17T16:15:57.094Z",
        "content_hash": "de384ae9ed4c28bb5f9fbb996826c89265ef2891b5e549589986ecaf3fd0f047"
      }
    ],
    "listing_status": "SALE_PENDING",
    "listing_history": [
      "REO snapshot 2014-11-06"
    ],
    "confidence_score": 100,
    "source_id": "usda",
    "source_name": "USDA Rural Development / FSA",
    "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
    "fetched_at": "2026-07-17T16:15:57.094Z",
    "content_hash": "de384ae9ed4c28bb5f9fbb996826c89265ef2891b5e549589986ecaf3fd0f047",
    "classification_level": "PUBLIC",
    "replay_ref": "usda-replay-p9007283735",
    "connector_id": "usda-connector",
    "jurisdiction_scope": "federal,state,county",
    "scraper_version": "usda-resale-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "usda-9022835359",
    "source_records": [
      {
        "sourceId": "usda",
        "listingId": "9022835359",
        "listingDate": "2015-03-31",
        "state": "PR",
        "county": "Mayaguez",
        "town": "Maricao",
        "propertyType": "home",
        "rawPropertyStyle": "Single-family home",
        "exactAddress": "Estancias del Cafetal F-9",
        "zip": "00606",
        "price": 45000,
        "bedrooms": 3,
        "yearBuilt": 14,
        "squareFeet": 811,
        "acreageText": "210.00",
        "program": "Direct",
        "description": "Property located at Urb. Estancias del Cafetal F-9 Calle 5 Maricao, P.R. Recorded at farm 3,124, page 204, book 107. R/E Taxes ID: 262-003-055-34-000.",
        "photoFile": "9022835359A.jpg",
        "listingUrl": "https://www.resales.usda.gov/resales/public/home",
        "isCurrent": false,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "usda",
        "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
        "fetched_at": "2026-07-17T16:15:57.094Z",
        "content_hash": "e483d87a7b3763291efbc486f841966a23d3417b5683703a6f781c642f721809"
      }
    ],
    "listing_status": "SALE_PENDING",
    "listing_history": [
      "REO snapshot 2015-03-31"
    ],
    "confidence_score": 100,
    "source_id": "usda",
    "source_name": "USDA Rural Development / FSA",
    "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
    "fetched_at": "2026-07-17T16:15:57.094Z",
    "content_hash": "e483d87a7b3763291efbc486f841966a23d3417b5683703a6f781c642f721809",
    "classification_level": "PUBLIC",
    "replay_ref": "usda-replay-p9022835359",
    "connector_id": "usda-connector",
    "jurisdiction_scope": "federal,state,county",
    "scraper_version": "usda-resale-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "usda-9007373221",
    "source_records": [
      {
        "sourceId": "usda",
        "listingId": "9007373221",
        "listingDate": "2015-04-01",
        "state": "PR",
        "county": "Camuy",
        "town": "Isabela",
        "propertyType": "home",
        "rawPropertyStyle": "Single-family home",
        "exactAddress": "Jard de Miramar B11",
        "zip": "00662",
        "price": 48900,
        "bedrooms": 4,
        "yearBuilt": 37,
        "squareFeet": 1442,
        "acreageText": "137",
        "program": "Direct",
        "description": "Property located at Urb Jardines de Miramar B11 with 136.70 sm in Isabela, PR.  R/E Taxes 003-087-294-05-001.",
        "photoFile": "9007373221A.jpg",
        "listingUrl": "https://www.resales.usda.gov/resales/public/home",
        "isCurrent": false,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "usda",
        "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
        "fetched_at": "2026-07-17T16:15:57.094Z",
        "content_hash": "6786ba187a9f031c8b7afb97ccc7b1d5e18950686399d8180d71ff14cd2b461f"
      }
    ],
    "listing_status": "SALE_PENDING",
    "listing_history": [
      "REO snapshot 2015-04-01"
    ],
    "confidence_score": 100,
    "source_id": "usda",
    "source_name": "USDA Rural Development / FSA",
    "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
    "fetched_at": "2026-07-17T16:15:57.094Z",
    "content_hash": "6786ba187a9f031c8b7afb97ccc7b1d5e18950686399d8180d71ff14cd2b461f",
    "classification_level": "PUBLIC",
    "replay_ref": "usda-replay-p9007373221",
    "connector_id": "usda-connector",
    "jurisdiction_scope": "federal,state,county",
    "scraper_version": "usda-resale-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "usda-9022838929",
    "source_records": [
      {
        "sourceId": "usda",
        "listingId": "9022838929",
        "listingDate": "2015-04-06",
        "state": "PR",
        "county": "Mayaguez",
        "town": "Maricao",
        "propertyType": "home",
        "rawPropertyStyle": "Single-family home",
        "exactAddress": "Estancias del Cafetal F-4",
        "zip": "00606",
        "price": 45000,
        "bedrooms": 3,
        "yearBuilt": 34,
        "squareFeet": 825,
        "acreageText": "210",
        "program": "Direct",
        "description": "Property located at Urb. Estancias del Cafetal F-4 Maricao, P.R. Recorded at farm 3,130, page 11, book 109. R/E Taxes ID: 262-003-055-39-000.",
        "photoFile": "9022838929A.jpg",
        "listingUrl": "https://www.resales.usda.gov/resales/public/home",
        "isCurrent": false,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "usda",
        "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
        "fetched_at": "2026-07-17T16:15:57.094Z",
        "content_hash": "eda11f367828872ac59e84467bc6dd5ed9bf98cefcbd42ad48a0a8a9c4d406c6"
      }
    ],
    "listing_status": "SALE_PENDING",
    "listing_history": [
      "REO snapshot 2015-04-06"
    ],
    "confidence_score": 100,
    "source_id": "usda",
    "source_name": "USDA Rural Development / FSA",
    "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
    "fetched_at": "2026-07-17T16:15:57.094Z",
    "content_hash": "eda11f367828872ac59e84467bc6dd5ed9bf98cefcbd42ad48a0a8a9c4d406c6",
    "classification_level": "PUBLIC",
    "replay_ref": "usda-replay-p9022838929",
    "connector_id": "usda-connector",
    "jurisdiction_scope": "federal,state,county",
    "scraper_version": "usda-resale-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "usda-9037657535",
    "source_records": [
      {
        "sourceId": "usda",
        "listingId": "9037657535",
        "listingDate": "2017-06-29",
        "state": "PR",
        "county": "Juana Diaz",
        "town": "Patillas",
        "propertyType": "home",
        "rawPropertyStyle": "Single-family home",
        "exactAddress": "Valle de Patillas L-9St10",
        "zip": "00723",
        "price": 80000,
        "bedrooms": 3,
        "yearBuilt": 7,
        "squareFeet": 933,
        "acreageText": "389",
        "program": "Direct",
        "description": "# catastro 398-056-287-11-000",
        "photoFile": "9037657535A.jpg",
        "listingUrl": "https://www.resales.usda.gov/resales/public/home",
        "isCurrent": false,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "usda",
        "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
        "fetched_at": "2026-07-17T16:15:57.094Z",
        "content_hash": "f3e5daa9a19319ffdb48e488440826ad3a1a0648708dd3a0382c499c9c6a2c1a"
      }
    ],
    "listing_status": "SALE_PENDING",
    "listing_history": [
      "REO snapshot 2017-06-29"
    ],
    "confidence_score": 100,
    "source_id": "usda",
    "source_name": "USDA Rural Development / FSA",
    "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
    "fetched_at": "2026-07-17T16:15:57.094Z",
    "content_hash": "f3e5daa9a19319ffdb48e488440826ad3a1a0648708dd3a0382c499c9c6a2c1a",
    "classification_level": "PUBLIC",
    "replay_ref": "usda-replay-p9037657535",
    "connector_id": "usda-connector",
    "jurisdiction_scope": "federal,state,county",
    "scraper_version": "usda-resale-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "usda-9007446970",
    "source_records": [
      {
        "sourceId": "usda",
        "listingId": "9007446970",
        "listingDate": "2017-04-04",
        "state": "PR",
        "county": "Morovis",
        "town": "Manati",
        "propertyType": "home",
        "rawPropertyStyle": "-Frame",
        "exactAddress": "Jar Monaco II Francia #13",
        "zip": "00674",
        "price": 98000,
        "bedrooms": 3,
        "yearBuilt": 34,
        "squareFeet": 943,
        "acreageText": "417x",
        "program": "Direct",
        "description": "Parcel # 05605324401001\nBroker:  HMP Properties     Tel:  787-781-2446\nFax: 1-888-267-7802 \ne-mail:  info@hogarespr.com   Web: www.hogarespr.com",
        "photoFile": "9007446970A.jpg",
        "listingUrl": "https://www.resales.usda.gov/resales/public/home",
        "isCurrent": false,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "usda",
        "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
        "fetched_at": "2026-07-17T16:15:57.094Z",
        "content_hash": "6d27b079d4057cff21e4aadcaf2ddae423f37fe9f04fa4c377f2c8bf9ee54e51"
      }
    ],
    "listing_status": "SALE_PENDING",
    "listing_history": [
      "REO snapshot 2017-04-04"
    ],
    "confidence_score": 100,
    "source_id": "usda",
    "source_name": "USDA Rural Development / FSA",
    "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
    "fetched_at": "2026-07-17T16:15:57.094Z",
    "content_hash": "6d27b079d4057cff21e4aadcaf2ddae423f37fe9f04fa4c377f2c8bf9ee54e51",
    "classification_level": "PUBLIC",
    "replay_ref": "usda-replay-p9007446970",
    "connector_id": "usda-connector",
    "jurisdiction_scope": "federal,state,county",
    "scraper_version": "usda-resale-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "usda-9007394103",
    "source_records": [
      {
        "sourceId": "usda",
        "listingId": "9007394103",
        "listingDate": "2018-04-12",
        "state": "PR",
        "county": "Juana Diaz",
        "town": "Coamo",
        "propertyType": "home",
        "rawPropertyStyle": "Single-family home",
        "exactAddress": "Urb. Jardines CoamoF-11",
        "zip": "00769",
        "price": 85000,
        "bedrooms": 3,
        "yearBuilt": 35,
        "squareFeet": 845,
        "acreageText": "358.95",
        "program": "Direct",
        "description": "# catastro : 345-032-304-12-001",
        "photoFile": "9007394103A.jpg",
        "listingUrl": "https://www.resales.usda.gov/resales/public/home",
        "isCurrent": false,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "usda",
        "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
        "fetched_at": "2026-07-17T16:15:57.094Z",
        "content_hash": "bb1628ba319c87dc36bdb891cfbf74f09f71153cafd95fab75fe3590b658c606"
      }
    ],
    "listing_status": "SALE_PENDING",
    "listing_history": [
      "REO snapshot 2018-04-12"
    ],
    "confidence_score": 100,
    "source_id": "usda",
    "source_name": "USDA Rural Development / FSA",
    "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
    "fetched_at": "2026-07-17T16:15:57.094Z",
    "content_hash": "bb1628ba319c87dc36bdb891cfbf74f09f71153cafd95fab75fe3590b658c606",
    "classification_level": "PUBLIC",
    "replay_ref": "usda-replay-p9007394103",
    "connector_id": "usda-connector",
    "jurisdiction_scope": "federal,state,county",
    "scraper_version": "usda-resale-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "usda-9034497675",
    "source_records": [
      {
        "sourceId": "usda",
        "listingId": "9034497675",
        "listingDate": "2017-04-25",
        "state": "PR",
        "county": "Caguas",
        "town": "Juncos",
        "propertyType": "home",
        "rawPropertyStyle": "Single-family home",
        "exactAddress": "#38 ALGARIN st. PUEBLO WD",
        "zip": "00777",
        "price": 52000,
        "bedrooms": 3,
        "yearBuilt": 42,
        "squareFeet": 1193,
        "acreageText": "260sm",
        "program": "Direct",
        "description": "#38 Algarin St. Pueblo Wd., Juncos, P. R.  00777;  RECORDE-FAR2933, PAGE-45, BOOK-90; R/E Taxes ID-227-062-050-06-901",
        "photoFile": "9034497675A.jpg",
        "listingUrl": "https://www.resales.usda.gov/resales/public/home",
        "isCurrent": false,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "usda",
        "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
        "fetched_at": "2026-07-17T16:15:57.094Z",
        "content_hash": "b34ea93f93f88bf388d8a7430c00118892e8ed066041ce3a7a8d8e0bd30b9a00"
      }
    ],
    "listing_status": "FOR_SALE",
    "listing_history": [
      "REO snapshot 2017-04-25"
    ],
    "confidence_score": 100,
    "source_id": "usda",
    "source_name": "USDA Rural Development / FSA",
    "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
    "fetched_at": "2026-07-17T16:15:57.094Z",
    "content_hash": "b34ea93f93f88bf388d8a7430c00118892e8ed066041ce3a7a8d8e0bd30b9a00",
    "classification_level": "PUBLIC",
    "replay_ref": "usda-replay-p9034497675",
    "connector_id": "usda-connector",
    "jurisdiction_scope": "federal,state,county",
    "scraper_version": "usda-resale-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "usda-9082193756",
    "source_records": [
      {
        "sourceId": "usda",
        "listingId": "9082193756",
        "listingDate": "2017-05-11",
        "state": "PR",
        "county": "Morovis",
        "town": "Corozal",
        "propertyType": "home",
        "rawPropertyStyle": "-Frame",
        "exactAddress": "Rd 159 km. 18.0 Wd Abras",
        "zip": "00783",
        "price": 73000,
        "bedrooms": 3,
        "yearBuilt": 10,
        "squareFeet": 1083,
        "acreageText": "1000x",
        "program": "Direct",
        "description": "Parcel Number: 111-000-007-23. \nBrocker: HMP Properties Inc.  Caparra Heights 1481 Elida St. San Juan PR 00920. (787) 781-2446 Fax 1-888-267-7802 E-Mail: info@hogarespr.com Web: wwwhogarespr.com",
        "photoFile": "9082193756A.jpg",
        "listingUrl": "https://www.resales.usda.gov/resales/public/home",
        "isCurrent": false,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "usda",
        "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
        "fetched_at": "2026-07-17T16:15:57.094Z",
        "content_hash": "08db7473abbded68b32a6b01cb974276c1269a26cf071f55b5e0bc134346d7ce"
      }
    ],
    "listing_status": "SALE_PENDING",
    "listing_history": [
      "REO snapshot 2017-05-11"
    ],
    "confidence_score": 100,
    "source_id": "usda",
    "source_name": "USDA Rural Development / FSA",
    "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
    "fetched_at": "2026-07-17T16:15:57.094Z",
    "content_hash": "08db7473abbded68b32a6b01cb974276c1269a26cf071f55b5e0bc134346d7ce",
    "classification_level": "PUBLIC",
    "replay_ref": "usda-replay-p9082193756",
    "connector_id": "usda-connector",
    "jurisdiction_scope": "federal,state,county",
    "scraper_version": "usda-resale-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "usda-9032954369",
    "source_records": [
      {
        "sourceId": "usda",
        "listingId": "9032954369",
        "listingDate": "2018-08-21",
        "state": "UT",
        "county": "Sevier",
        "town": "Sigurd",
        "propertyType": "home",
        "rawPropertyStyle": "Ranch-Brick",
        "exactAddress": "1485 North State St.",
        "zip": "84657",
        "price": 74428.2,
        "bedrooms": 2,
        "yearBuilt": 65,
        "squareFeet": 1008,
        "acreageText": "20378",
        "program": "Direct",
        "description": null,
        "photoFile": "9032954369A.jpg",
        "listingUrl": "https://www.resales.usda.gov/resales/public/home",
        "isCurrent": false,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "usda",
        "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
        "fetched_at": "2026-07-17T16:15:57.094Z",
        "content_hash": "db41bf5c7fdbdbe9389d085aba82aaf5d61ad3b926b9c563fd32eec09a60b1e4"
      }
    ],
    "listing_status": "FOR_SALE",
    "listing_history": [
      "REO snapshot 2018-08-21"
    ],
    "confidence_score": 100,
    "source_id": "usda",
    "source_name": "USDA Rural Development / FSA",
    "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
    "fetched_at": "2026-07-17T16:15:57.094Z",
    "content_hash": "db41bf5c7fdbdbe9389d085aba82aaf5d61ad3b926b9c563fd32eec09a60b1e4",
    "classification_level": "PUBLIC",
    "replay_ref": "usda-replay-p9032954369",
    "connector_id": "usda-connector",
    "jurisdiction_scope": "federal,state,county",
    "scraper_version": "usda-resale-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "usda-9037075890",
    "source_records": [
      {
        "sourceId": "usda",
        "listingId": "9037075890",
        "listingDate": "2018-08-09",
        "state": "UT",
        "county": "Carbon",
        "town": "Price",
        "propertyType": "home",
        "rawPropertyStyle": "Ranch-Frame",
        "exactAddress": "359 N 100 E",
        "zip": "84501",
        "price": 50820,
        "bedrooms": 2,
        "yearBuilt": 88,
        "squareFeet": 1190,
        "acreageText": "7841",
        "program": "Direct",
        "description": "Questions regarding the sale of this property should be directed to Ryan Kocher at ryan.kocher@ut.usda.gov.",
        "photoFile": "9037075890A.jpg",
        "listingUrl": "https://www.resales.usda.gov/resales/public/home",
        "isCurrent": false,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "usda",
        "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
        "fetched_at": "2026-07-17T16:15:57.094Z",
        "content_hash": "c98b7c68ddb6d81d41b5f5da03e341947ea9481073226fd66af6039343d91b74"
      }
    ],
    "listing_status": "FOR_SALE",
    "listing_history": [
      "REO snapshot 2018-08-09"
    ],
    "confidence_score": 100,
    "source_id": "usda",
    "source_name": "USDA Rural Development / FSA",
    "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
    "fetched_at": "2026-07-17T16:15:57.094Z",
    "content_hash": "c98b7c68ddb6d81d41b5f5da03e341947ea9481073226fd66af6039343d91b74",
    "classification_level": "PUBLIC",
    "replay_ref": "usda-replay-p9037075890",
    "connector_id": "usda-connector",
    "jurisdiction_scope": "federal,state,county",
    "scraper_version": "usda-resale-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "usda-9082301331",
    "source_records": [
      {
        "sourceId": "usda",
        "listingId": "9082301331",
        "listingDate": "2018-08-09",
        "state": "UT",
        "county": "Sanpete",
        "town": "Ephraim",
        "propertyType": "home",
        "rawPropertyStyle": "Ranch-Frame",
        "exactAddress": "796 S 10 E",
        "zip": "84727",
        "price": 150150,
        "bedrooms": 3,
        "yearBuilt": 7,
        "squareFeet": 1566,
        "acreageText": "10977",
        "program": "Direct",
        "description": "Questions regarding the sale of this property should be directed to Ryan Kocher at ryan.kocher@ut.usda.gov or 435-868-3949",
        "photoFile": "9082301331A.jpg",
        "listingUrl": "https://www.resales.usda.gov/resales/public/home",
        "isCurrent": false,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "usda",
        "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
        "fetched_at": "2026-07-17T16:15:57.094Z",
        "content_hash": "f7a2ef43ec13c0c1e38cee00bf2272d3432fbe7ccf3b2ad396156082fb4a39a9"
      }
    ],
    "listing_status": "FOR_SALE",
    "listing_history": [
      "REO snapshot 2018-08-09"
    ],
    "confidence_score": 100,
    "source_id": "usda",
    "source_name": "USDA Rural Development / FSA",
    "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
    "fetched_at": "2026-07-17T16:15:57.094Z",
    "content_hash": "f7a2ef43ec13c0c1e38cee00bf2272d3432fbe7ccf3b2ad396156082fb4a39a9",
    "classification_level": "PUBLIC",
    "replay_ref": "usda-replay-p9082301331",
    "connector_id": "usda-connector",
    "jurisdiction_scope": "federal,state,county",
    "scraper_version": "usda-resale-ingest-v0.1.0"
  },
  {
    "canonical_property_id": "usda-9080298132",
    "source_records": [
      {
        "sourceId": "usda",
        "listingId": "9080298132",
        "listingDate": "2018-07-05",
        "state": "UT",
        "county": "Kane",
        "town": "Kanab",
        "propertyType": "home",
        "rawPropertyStyle": "1.5 Story-Frame",
        "exactAddress": "831 E Rocky Rd",
        "zip": "84741",
        "price": 155540,
        "bedrooms": 3,
        "yearBuilt": 10,
        "squareFeet": 2115,
        "acreageText": "8509",
        "program": "Direct",
        "description": "Questions regarding the sale of this property should be directed to Ryan Kocher at ryan.kocher@ut.usda.gov or 435-868-3949",
        "photoFile": null,
        "listingUrl": "https://www.resales.usda.gov/resales/public/home",
        "isCurrent": false,
        "latitude": null,
        "longitude": null
      }
    ],
    "parcel_refs": [],
    "geospatial_refs": [],
    "provenance_chain": [
      {
        "source_id": "usda",
        "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
        "fetched_at": "2026-07-17T16:15:57.094Z",
        "content_hash": "556cb4d91c9b5d3e02c3d279251f8bef115531fc3c1770c78b554e7966d56d15"
      }
    ],
    "listing_status": "FOR_SALE",
    "listing_history": [
      "REO snapshot 2018-07-05"
    ],
    "confidence_score": 100,
    "source_id": "usda",
    "source_name": "USDA Rural Development / FSA",
    "source_url": "https://www.sc.egov.usda.gov/data/files/Property/FSASFHREOData9-7-18.txt",
    "fetched_at": "2026-07-17T16:15:57.094Z",
    "content_hash": "556cb4d91c9b5d3e02c3d279251f8bef115531fc3c1770c78b554e7966d56d15",
    "classification_level": "PUBLIC",
    "replay_ref": "usda-replay-p9080298132",
    "connector_id": "usda-connector",
    "jurisdiction_scope": "federal,state,county",
    "scraper_version": "usda-resale-ingest-v0.1.0"
  }
];
