/**
 * ingestListhubListings — ListHub Syndication API ingest (founder direction
 * 2026-07-18: publisher application submitted; build the integration against
 * the public sandbox so go-live is a credential swap).
 *
 * Source: ListHub Syndication API (api.listhub.com) — RESO Web API. Per the
 * ListHub docs this API is for PUBLISHERS to download and STORE listing data
 * on their own systems (not live-query) — which is exactly this platform's
 * committed-snapshot architecture.
 *
 * Credentials (env; .env is gitignored, owner-managed):
 *   LISTHUB_CLIENT_ID / LISTHUB_CLIENT_SECRET — defaults to the documented
 *   public sandbox (public_sandbox/public_sandbox), which serves openly FAKE
 *   listings (ListingKey "3yd-FAKE1-…") for integration testing.
 *
 * HARD GUARD: sample/FAKE records NEVER enter a production snapshot.
 *   - Sandbox credentials → snapshot written with sandbox:true and records
 *     EXCLUDED (structure + counts only), so fake listings cannot leak into
 *     the app even by accident.
 *   - Real credentials + any FAKE-keyed record → hard abort (data problem).
 *
 * Display additionally requires the ListHub publisher agreement in force and
 * Module 23 (legal) + Module 22 (activation) review, like every source.
 *
 *     npm run ingest:listhub
 */

import * as fs from "node:fs";
import * as path from "node:path";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "src/lib/property/listhubListingsGenerated.ts");
const TOKEN_URL = "https://api.listhub.com/oauth2/token";
const ODATA_URL = "https://api.listhub.com/odata/Property";
const UA = "FurlongPropertyIngest/1.0 (ListHub publisher integration; contact chudson@aresfarmsinc.com)";

const CLIENT_ID = process.env.LISTHUB_CLIENT_ID ?? "public_sandbox";
const CLIENT_SECRET = process.env.LISTHUB_CLIENT_SECRET ?? "public_sandbox";
const IS_SANDBOX = CLIENT_ID === "public_sandbox";
/** Sandbox pages are capped (fake data — we only need structure proof). */
const MAX_PAGES = IS_SANDBOX ? 3 : 500;
const PAGE_SIZE = 200;

/** Compact RESO projection — the fields the platform's pipeline consumes. */
export interface ListhubListing {
  listingKey: string;
  propertyType: string | null;
  propertySubType: string | null;
  standardStatus: string | null;
  listPrice: number | null;
  city: string | null;
  stateOrProvince: string | null;
  postalCode: string | null;
  county: string | null;
  unparsedAddress: string | null;
  lotSizeAcres: number | null;
  livingArea: number | null;
  bedroomsTotal: number | null;
  yearBuilt: number | null;
  latitude: number | null;
  longitude: number | null;
  listingUrl: string | null;
  modificationTimestamp: string | null;
}

type ResoRecord = Record<string, unknown>;

const s = (v: unknown): string | null => (typeof v === "string" && v.trim() !== "" ? v.trim() : null);
const n = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);

function toListing(r: ResoRecord): ListhubListing {
  return {
    listingKey: s(r.ListingKey) ?? "unknown",
    propertyType: s(r.PropertyType),
    propertySubType: s(r.PropertySubType),
    standardStatus: s(r.StandardStatus),
    listPrice: n(r.ListPrice),
    city: s(r.City),
    stateOrProvince: s(r.StateOrProvince),
    postalCode: s(r.PostalCode),
    county: s(r.CountyOrParish),
    unparsedAddress: s(r.UnparsedAddress),
    lotSizeAcres: n(r.LotSizeAcres),
    livingArea: n(r.LivingArea),
    bedroomsTotal: n(r.BedroomsTotal),
    yearBuilt: n(r.YearBuilt),
    latitude: n(r.Latitude),
    longitude: n(r.Longitude),
    listingUrl: s(r.ListingURL) ?? s(r.ListingUrl),
    modificationTimestamp: s(r.ModificationTimestamp),
  };
}

const FAKE = /FAKE/i;

async function getToken(): Promise<string> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": UA },
    body: new URLSearchParams({ grant_type: "client_credentials", client_id: CLIENT_ID, client_secret: CLIENT_SECRET }).toString(),
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) throw new Error(`ListHub token HTTP ${res.status}`);
  const json = (await res.json()) as { access_token?: string };
  if (!json.access_token) throw new Error("ListHub token response missing access_token");
  return json.access_token;
}

async function main(): Promise<void> {
  console.log("\n━━━ ingest:listhub ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  mode: ${IS_SANDBOX ? "SANDBOX (public_sandbox — fake data, structure test only)" : "PUBLISHER (live credentials)"}`);
  const fetchedAt = new Date().toISOString();
  const token = await getToken();

  const listings: ListhubListing[] = [];
  let url: string | null = `${ODATA_URL}?$top=${PAGE_SIZE}`;
  let pages = 0;
  while (url && pages < MAX_PAGES) {
    const res: Response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, "Accept-Encoding": "gzip", "User-Agent": UA },
      signal: AbortSignal.timeout(60000),
    });
    if (!res.ok) throw new Error(`ListHub odata HTTP ${res.status}`);
    const json = (await res.json()) as { value?: ResoRecord[]; ["@odata.nextLink"]?: string };
    for (const r of json.value ?? []) listings.push(toListing(r));
    url = json["@odata.nextLink"] ?? null;
    pages++;
  }
  console.log(`  pulled ${listings.length} records over ${pages} page(s)`);

  const fakeCount = listings.filter((l) => FAKE.test(l.listingKey)).length;
  if (!IS_SANDBOX && fakeCount > 0) {
    // Real credentials must never yield FAKE records — abort, do not write.
    throw new Error(`HARD GUARD: ${fakeCount} FAKE-keyed record(s) under live credentials — snapshot NOT written.`);
  }

  // Structure summary (what the pipeline cares about), safe in both modes.
  const byType: Record<string, number> = {};
  for (const l of listings) {
    const k = `${l.propertyType ?? "?"} / ${l.propertySubType ?? "?"}`;
    byType[k] = (byType[k] ?? 0) + 1;
  }

  // Sandbox: counts + field structure ONLY — fake listings never reach a
  // committed snapshot. Live: full compact records (display still gated).
  const records = IS_SANDBOX ? [] : listings;

  fs.writeFileSync(
    OUT,
    `/**
 * listhubListingsGenerated — GENERATED FILE. Do not edit by hand.
 *
 * ListHub Syndication API snapshot (RESO Web API; publishers store data on
 * their own systems per ListHub docs). Re-run: npm run ingest:listhub
 *
 * ${IS_SANDBOX ? "SANDBOX RUN — fake data excluded by the hard guard; counts/structure only." : "LIVE PUBLISHER RUN."}
 * Display requires the publisher agreement + Module 23 + Module 22. Snapshot only.
 */

export const LISTHUB_PROVENANCE = {
  fetchedAt: ${JSON.stringify(fetchedAt)},
  sandbox: ${IS_SANDBOX},
  source: "ListHub Syndication API (api.listhub.com/odata/Property)",
  pulled: ${listings.length},
  committed: ${records.length},
  byType: ${JSON.stringify(byType, null, 2)},
} as const;

export interface ListhubListing {
  listingKey: string;
  propertyType: string | null;
  propertySubType: string | null;
  standardStatus: string | null;
  listPrice: number | null;
  city: string | null;
  stateOrProvince: string | null;
  postalCode: string | null;
  county: string | null;
  unparsedAddress: string | null;
  lotSizeAcres: number | null;
  livingArea: number | null;
  bedroomsTotal: number | null;
  yearBuilt: number | null;
  latitude: number | null;
  longitude: number | null;
  listingUrl: string | null;
  modificationTimestamp: string | null;
}

export const LISTHUB_LISTINGS: ListhubListing[] = JSON.parse(${JSON.stringify(JSON.stringify(records))});
`,
    "utf8",
  );
  console.log(`  byType sample: ${Object.entries(byType).slice(0, 5).map(([k, v]) => `${k}=${v}`).join(" · ")}`);
  console.log(`  wrote → ${path.relative(ROOT, OUT)} (committed records: ${records.length}${IS_SANDBOX ? " — sandbox guard" : ""})\n`);
}

main().catch((error) => { console.error("ingest:listhub FAILED —", error); process.exit(1); });
