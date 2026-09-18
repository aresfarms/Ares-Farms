/**
 * ingestBlmRealtyNotices — BLM public-land sale notices via the Federal
 * Register API (founder direction 2026-07-17: fill the land gap with legal
 * sources). BLM publishes no listing feed, but every land sale legally requires
 * a published Notice of Realty Action — and the Federal Register API is
 * public-domain, documented-for-programmatic-use JSON.
 *
 * Source: federalregister.gov/api/v1 (U.S. government work, public domain).
 * We pull sale-relevant BLM notices from the last 24 months. These are SALE
 * ANNOUNCEMENTS (parcel descriptions, acreage, appraised values, auction
 * dates), not listing pages; bidding runs through BLM's contractor, which we
 * do not touch.
 *
 * NOT displayed anywhere until Module 23 + Module 22 clear. Snapshot only.
 *
 *     npm run ingest:blm-realty-notices
 */

import * as fs from "node:fs";
import * as path from "node:path";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "src/lib/property/blmRealtyNoticesGenerated.ts");
const UA = "FurlongDataIngest/1.0 (Federal Register API; contact chudson@aresfarmsinc.com)";
const API = "https://www.federalregister.gov/api/v1/documents.json";

/** Sale-relevant title phrases (skip pure classifications/leases/exchanges). */
const SALE_HINT = /\bsale\b|\bauction\b|\bdirect sale\b|\bcompetitive sale\b/i;

export interface BlmRealtyNotice {
  documentNumber: string;
  publicationDate: string;
  title: string;
  abstract: string | null;
  htmlUrl: string;
  pdfUrl: string | null;
  /** True when the title reads as an actual land SALE (vs classification etc.). */
  isSale: boolean;
}

type FrDoc = {
  document_number: string;
  publication_date: string;
  title: string;
  abstract: string | null;
  html_url: string;
  pdf_url: string | null;
};

async function fetchPage(page: number, gteDate: string): Promise<{ results: FrDoc[]; totalPages: number }> {
  const params = new URLSearchParams();
  params.append("conditions[agencies][]", "land-management-bureau");
  params.append("conditions[type][]", "NOTICE");
  params.append("conditions[term]", `"realty action"`);
  params.append("conditions[publication_date][gte]", gteDate);
  params.append("order", "newest");
  params.append("per_page", "100");
  params.append("page", String(page));
  for (const f of ["document_number", "publication_date", "title", "abstract", "html_url", "pdf_url"]) {
    params.append("fields[]", f);
  }
  const res = await fetch(`${API}?${params.toString()}`, {
    headers: { "User-Agent": UA },
    signal: AbortSignal.timeout(60000),
  });
  if (!res.ok) throw new Error(`Federal Register API HTTP ${res.status}`);
  const json = (await res.json()) as { results?: FrDoc[]; total_pages?: number };
  return { results: json.results ?? [], totalPages: json.total_pages ?? 1 };
}

async function main(): Promise<void> {
  console.log("\n━━━ ingest:blm-realty-notices ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  const fetchedAt = new Date().toISOString();
  // 24-month window, derived from the run date.
  const gte = new Date(Date.now() - 730 * 24 * 3600 * 1000).toISOString().slice(0, 10);

  const docs: FrDoc[] = [];
  let page = 1;
  for (;;) {
    const { results, totalPages } = await fetchPage(page, gte);
    docs.push(...results);
    if (page >= totalPages || results.length === 0) break;
    page++;
  }

  const notices: BlmRealtyNotice[] = docs.map((d) => ({
    documentNumber: d.document_number,
    publicationDate: d.publication_date,
    title: d.title,
    abstract: d.abstract ?? null,
    htmlUrl: d.html_url,
    pdfUrl: d.pdf_url ?? null,
    isSale: SALE_HINT.test(d.title),
  }));
  const saleCount = notices.filter((x) => x.isSale).length;
  console.log(`  ${notices.length} realty-action notices since ${gte} · ${saleCount} read as sales`);

  fs.writeFileSync(
    OUT,
    `/**
 * blmRealtyNoticesGenerated — GENERATED FILE. Do not edit by hand.
 *
 * BLM Notices of Realty Action from the Federal Register API (public domain),
 * last 24 months. Sale announcements for public land — parcel descriptions,
 * acreage, appraised values, auction dates. Not listings; the notice is the
 * substance. Re-run: npm run ingest:blm-realty-notices
 *
 * NOT displayed anywhere until Module 23 + Module 22 clear. Snapshot only.
 */

export const BLM_REALTY_PROVENANCE = {
  fetchedAt: ${JSON.stringify(fetchedAt)},
  windowStart: ${JSON.stringify(gte)},
  source: "Federal Register API (federalregister.gov/api/v1), agency=land-management-bureau",
  license: "U.S. government work — public domain",
} as const;

export interface BlmRealtyNotice {
  documentNumber: string;
  publicationDate: string;
  title: string;
  abstract: string | null;
  htmlUrl: string;
  pdfUrl: string | null;
  isSale: boolean;
}

export const BLM_REALTY_NOTICES: BlmRealtyNotice[] = ${JSON.stringify(notices, null, 2)};
`,
    "utf8",
  );
  console.log(`  wrote → ${path.relative(ROOT, OUT)}\n`);
}

main().catch((error) => { console.error("ingest:blm-realty-notices FAILED —", error); process.exit(1); });
