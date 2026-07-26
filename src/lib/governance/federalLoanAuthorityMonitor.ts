import { createHash, randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { runtimeStatePath } from "@/lib/property/runtimeStatePath";

export const FEDERAL_LOAN_AUTHORITY_MONITOR_RULE =
  "FEDERAL-LOAN-AUTHORITY-CONTINUOUS-MONITOR-001" as const;

export type FederalLoanAgency = "SBA" | "FSA" | "USDA_RD" | "ECFR" | "FEDERAL_REGISTER";
export type FederalAuthorityKind =
  | "PROGRAM_CATALOG"
  | "PROGRAM_TERMS"
  | "FORM"
  | "HANDBOOK"
  | "NOTICE"
  | "RATE"
  | "REGULATION"
  | "OTHER_AUTHORITY";

export interface FederalLoanAuthoritySeed {
  agency: FederalLoanAgency;
  url: string;
  kind: FederalAuthorityKind;
  discoverLinks: boolean;
  required: boolean;
}

export interface FederalLoanAuthorityDocument {
  documentId: string;
  agency: FederalLoanAgency;
  kind: FederalAuthorityKind;
  url: string;
  contentType: string;
  contentHash: string;
  etag: string | null;
  lastModified: string | null;
  title: string | null;
  normalizedText: string | null;
  fetchedAt: string;
  firstObservedAt: string;
  changedAt: string | null;
  previousContentHash: string | null;
  status: "CURRENT" | "CHANGED_REVIEW_REQUIRED" | "FETCH_FAILED";
  error: string | null;
}

export interface FederalLoanAuthorityChangeReceipt {
  receiptId: string;
  documentId: string;
  agency: FederalLoanAgency;
  url: string;
  detectedAt: string;
  previousContentHash: string;
  nextContentHash: string;
  status: "REVIEW_REQUIRED";
  reason: string;
}

export interface FederalLoanAuthorityMonitorState {
  schemaVersion: "federal-loan-authority-monitor-v1";
  lastRunAt: string | null;
  documents: FederalLoanAuthorityDocument[];
  changes: FederalLoanAuthorityChangeReceipt[];
  runReceipts: Array<{
    runId: string;
    startedAt: string;
    completedAt: string;
    fetched: number;
    changed: number;
    failed: number;
    discovered: number;
    snapshotSha256: string;
  }>;
}

export interface FederalLoanAuthorityReviewBinding {
  reviewedAt: string;
  officialSourceRefs: readonly string[];
  reviewedContentHashes: Readonly<Record<string, string>>;
}

const STATE_FILE = runtimeStatePath("federal-loan-authority", "monitor-state.json");
const MAX_DISCOVERED_PER_AGENCY = 125;
const FETCH_TIMEOUT_MS = 25_000;
const MAX_BODY_BYTES = 20 * 1024 * 1024;

export const FEDERAL_LOAN_AUTHORITY_SEEDS: readonly FederalLoanAuthoritySeed[] = Object.freeze([
  { agency: "SBA", kind: "PROGRAM_CATALOG", discoverLinks: true, required: true, url: "https://www.sba.gov/funding-programs/loans" },
  { agency: "SBA", kind: "PROGRAM_TERMS", discoverLinks: true, required: true, url: "https://www.sba.gov/partners/lenders/7a-loan-program/terms-conditions-eligibility" },
  { agency: "SBA", kind: "FORM", discoverLinks: true, required: true, url: "https://www.sba.gov/document/sba-form-1919-borrower-information-form" },
  { agency: "SBA", kind: "OTHER_AUTHORITY", discoverLinks: true, required: true, url: "https://www.sba.gov/partners/lenders/7a-loan-program/operate-7a-lender" },
  { agency: "FSA", kind: "PROGRAM_CATALOG", discoverLinks: true, required: true, url: "https://www.fsa.usda.gov/about-fsa/structure-organization/farm-loan-programs" },
  { agency: "FSA", kind: "HANDBOOK", discoverLinks: true, required: true, url: "https://www.fsa.usda.gov/news-events/laws-regulations/fsa-handbooks" },
  { agency: "FSA", kind: "FORM", discoverLinks: true, required: true, url: "https://www.fsa.usda.gov/resources/programs/farm-loan-programs" },
  { agency: "USDA_RD", kind: "PROGRAM_CATALOG", discoverLinks: true, required: true, url: "https://www.rd.usda.gov/programs-services/all-programs" },
  { agency: "USDA_RD", kind: "PROGRAM_CATALOG", discoverLinks: true, required: true, url: "https://www.rd.usda.gov/programs-services/business-programs" },
  { agency: "USDA_RD", kind: "PROGRAM_TERMS", discoverLinks: true, required: true, url: "https://www.rd.usda.gov/onerdguarantee" },
  { agency: "USDA_RD", kind: "OTHER_AUTHORITY", discoverLinks: true, required: true, url: "https://www.rd.usda.gov/programs-services/services" },
  { agency: "ECFR", kind: "REGULATION", discoverLinks: true, required: true, url: "https://www.ecfr.gov/current/title-13/chapter-I/part-120" },
  { agency: "ECFR", kind: "REGULATION", discoverLinks: true, required: true, url: "https://www.ecfr.gov/current/title-7" },
  { agency: "FEDERAL_REGISTER", kind: "NOTICE", discoverLinks: true, required: false, url: "https://www.federalregister.gov/agencies/small-business-administration" },
  { agency: "FEDERAL_REGISTER", kind: "NOTICE", discoverLinks: true, required: false, url: "https://www.federalregister.gov/agencies/farm-service-agency" },
  { agency: "FEDERAL_REGISTER", kind: "NOTICE", discoverLinks: true, required: false, url: "https://www.federalregister.gov/agencies/rural-business-cooperative-service" },
]);

const ALLOWED_HOSTS = new Set([
  "www.sba.gov",
  "sba.gov",
  "www.fsa.usda.gov",
  "fsa.usda.gov",
  "www.rd.usda.gov",
  "rd.usda.gov",
  "www.ecfr.gov",
  "ecfr.gov",
  "www.federalregister.gov",
  "federalregister.gov",
]);

const RELEVANT_LINK = /(?:loan|guarantee|guaranty|credit|borrow|lender|eligib|require|form|sop|handbook|notice|regulation|rate|fee|servic|program|farm-ownership|operating-loan|business-industry|community-facilities|rural-energy|water-waste|telecom|electric)/i;
const EXCLUDED_LINK = /(?:facebook|twitter|linkedin|youtube|instagram|mailto:|javascript:|\/news\/|\/events\/|\/contact-us(?:$|\?))/i;

function sha(value: string | Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}

function documentId(url: string): string {
  return `federal-authority-${sha(url).slice(0, 24)}`;
}

function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, child]) => `${JSON.stringify(key)}:${stable(child)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function readState(): FederalLoanAuthorityMonitorState {
  try {
    const parsed = JSON.parse(fs.readFileSync(STATE_FILE, "utf8")) as FederalLoanAuthorityMonitorState;
    if (parsed.schemaVersion === "federal-loan-authority-monitor-v1") return parsed;
  } catch {
    // First run or corrupt state; fail closed through an empty state.
  }
  return { schemaVersion: "federal-loan-authority-monitor-v1", lastRunAt: null, documents: [], changes: [], runReceipts: [] };
}

function writeState(state: FederalLoanAuthorityMonitorState): void {
  fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
  const tmp = `${STATE_FILE}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(state, null, 2) + "\n", "utf8");
  fs.renameSync(tmp, STATE_FILE);
}

function cleanMonitorText(html: string): string {
  return html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ").replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&nbsp;|&#160;/gi, " ").replace(/&amp;/gi, "&").replace(/\s+/g, " ").trim();
}

function normalizeHtml(html: string): string {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--([\s\S]*?)-->/g, " ")
    .replace(/\s(?:nonce|integrity|data-drupal-selector|data-once|csrf-token)=(?:"[^"]*"|'[^']*')/gi, "")
    .replace(/>\s+</g, "><")
    .replace(/\s+/g, " ")
    .trim();
}

function titleFromHtml(html: string): string | null {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? match[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() : null;
}

function inferAgency(url: URL): FederalLoanAgency | null {
  if (url.hostname.endsWith("sba.gov")) return "SBA";
  if (url.hostname.endsWith("fsa.usda.gov")) return "FSA";
  if (url.hostname.endsWith("rd.usda.gov")) return "USDA_RD";
  if (url.hostname.endsWith("ecfr.gov")) return "ECFR";
  if (url.hostname.endsWith("federalregister.gov")) return "FEDERAL_REGISTER";
  return null;
}

function inferKind(url: URL): FederalAuthorityKind {
  const p = url.pathname.toLowerCase();
  if (/form|document/.test(p)) return "FORM";
  if (/handbook|sop/.test(p)) return "HANDBOOK";
  if (/notice|federalregister/.test(p)) return "NOTICE";
  if (/rate|fee/.test(p)) return "RATE";
  if (/ecfr|regulation|rules/.test(p)) return "REGULATION";
  if (/all-programs|programs-services|funding-programs\/loans/.test(p)) return "PROGRAM_CATALOG";
  if (/terms|eligib|require/.test(p)) return "PROGRAM_TERMS";
  return "OTHER_AUTHORITY";
}

function canonicalUrl(base: string, href: string): string | null {
  try {
    const url = new URL(href, base);
    url.hash = "";
    for (const key of [...url.searchParams.keys()]) {
      if (/^(utm_|fbclid|gclid|_gl)/i.test(key)) url.searchParams.delete(key);
    }
    if (!ALLOWED_HOSTS.has(url.hostname.toLowerCase())) return null;
    if (!/^https:$/.test(url.protocol)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

function discoverLinks(html: string, base: string): string[] {
  const urls = new Set<string>();
  for (const match of html.matchAll(/href\s*=\s*(?:"([^"]+)"|'([^']+)')/gi)) {
    const href = match[1] ?? match[2] ?? "";
    if (!href || EXCLUDED_LINK.test(href)) continue;
    const url = canonicalUrl(base, href);
    if (!url || !RELEVANT_LINK.test(url)) continue;
    urls.add(url);
  }
  return [...urls].sort();
}

async function fetchBounded(url: string, previous?: FederalLoanAuthorityDocument, fetchImpl: typeof fetch = fetch): Promise<{
  status: number;
  contentType: string;
  body: Buffer;
  etag: string | null;
  lastModified: string | null;
}> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const headers: Record<string, string> = { "user-agent": "FurlongOfficialAuthorityMonitor/1.0 (+governance; official-sources-only)" };
    if (previous?.etag) headers["if-none-match"] = previous.etag;
    if (previous?.lastModified) headers["if-modified-since"] = previous.lastModified;
    const response = await fetchImpl(url, { headers, redirect: "follow", signal: controller.signal });
    if (response.status === 304 && previous) {
      return { status: 304, contentType: previous.contentType, body: Buffer.alloc(0), etag: previous.etag, lastModified: previous.lastModified };
    }
    if (!response.ok) throw new Error(`Official source returned HTTP ${response.status}.`);
    const declared = Number(response.headers.get("content-length") ?? "0");
    if (declared > MAX_BODY_BYTES) throw new Error("Official source exceeds the monitor body-size limit.");
    const body = Buffer.from(await response.arrayBuffer());
    if (body.length > MAX_BODY_BYTES) throw new Error("Official source exceeds the monitor body-size limit.");
    return {
      status: response.status,
      contentType: response.headers.get("content-type") ?? "application/octet-stream",
      body,
      etag: response.headers.get("etag"),
      lastModified: response.headers.get("last-modified"),
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function refreshFederalLoanAuthorities(input: {
  now?: string;
  fetchImpl?: typeof fetch;
  seeds?: readonly FederalLoanAuthoritySeed[];
  persist?: boolean;
  previousState?: FederalLoanAuthorityMonitorState;
} = {}): Promise<{
  rule: typeof FEDERAL_LOAN_AUTHORITY_MONITOR_RULE;
  runId: string;
  fetched: number;
  changed: number;
  failed: number;
  discovered: number;
  snapshotSha256: string;
  changes: readonly FederalLoanAuthorityChangeReceipt[];
  state: FederalLoanAuthorityMonitorState;
}> {
  const now = input.now ?? new Date().toISOString();
  const runId = `federal-loan-authority-${randomUUID()}`;
  const previous = input.previousState ?? readState();
  const previousByUrl = new Map(previous.documents.map((doc) => [doc.url, doc]));
  const queue = [...(input.seeds ?? FEDERAL_LOAN_AUTHORITY_SEEDS)];
  const queued = new Set(queue.map((seed) => seed.url));
  const discoveredCount = new Map<FederalLoanAgency, number>();
  const nextByUrl = new Map(previous.documents.map((doc) => [doc.url, doc]));
  const changes: FederalLoanAuthorityChangeReceipt[] = [];
  let fetched = 0;
  let failed = 0;
  let discovered = 0;

  for (let index = 0; index < queue.length; index += 1) {
    const seed = queue[index];
    const prior = previousByUrl.get(seed.url);
    try {
      const response = await fetchBounded(seed.url, prior, input.fetchImpl ?? fetch);
      fetched += 1;
      if (response.status === 304 && prior) {
        nextByUrl.set(seed.url, { ...prior, fetchedAt: now, status: prior.changedAt ? "CHANGED_REVIEW_REQUIRED" : "CURRENT", error: null });
        continue;
      }
      const html = /(?:text\/html|application\/xhtml\+xml)/i.test(response.contentType)
        ? response.body.toString("utf8")
        : null;
      const normalized = html ? normalizeHtml(html) : response.body;
      const contentHash = sha(normalized);
      const changed = Boolean(prior && prior.contentHash !== contentHash);
      const doc: FederalLoanAuthorityDocument = {
        documentId: prior?.documentId ?? documentId(seed.url),
        agency: seed.agency,
        kind: seed.kind,
        url: seed.url,
        contentType: response.contentType,
        contentHash,
        etag: response.etag,
        lastModified: response.lastModified,
        title: html ? titleFromHtml(html) : prior?.title ?? null,
        normalizedText: html ? cleanMonitorText(html).slice(0, 2_000_000) : null,
        fetchedAt: now,
        firstObservedAt: prior?.firstObservedAt ?? now,
        changedAt: changed ? now : prior?.changedAt ?? null,
        previousContentHash: changed ? prior!.contentHash : prior?.previousContentHash ?? null,
        status: changed || prior?.changedAt ? "CHANGED_REVIEW_REQUIRED" : "CURRENT",
        error: null,
      };
      nextByUrl.set(seed.url, doc);
      if (changed) {
        changes.push({
          receiptId: randomUUID(), documentId: doc.documentId, agency: doc.agency, url: doc.url,
          detectedAt: now, previousContentHash: prior!.contentHash, nextContentHash: contentHash,
          status: "REVIEW_REQUIRED", reason: "Official loan authority content changed; dependent guidance is review-stale until rebound to this content hash.",
        });
      }
      if (seed.discoverLinks && html) {
        for (const url of discoverLinks(html, seed.url)) {
          if (queued.has(url)) continue;
          const parsed = new URL(url);
          const agency = inferAgency(parsed);
          if (!agency) continue;
          const count = discoveredCount.get(agency) ?? 0;
          if (count >= MAX_DISCOVERED_PER_AGENCY) continue;
          queued.add(url);
          discoveredCount.set(agency, count + 1);
          queue.push({ agency, url, kind: inferKind(parsed), discoverLinks: false, required: false });
          discovered += 1;
        }
      }
    } catch (error) {
      failed += 1;
      const priorDoc = prior;
      nextByUrl.set(seed.url, {
        documentId: priorDoc?.documentId ?? documentId(seed.url), agency: seed.agency, kind: seed.kind, url: seed.url,
        contentType: priorDoc?.contentType ?? "unknown", contentHash: priorDoc?.contentHash ?? "",
        etag: priorDoc?.etag ?? null, lastModified: priorDoc?.lastModified ?? null, title: priorDoc?.title ?? null, normalizedText: priorDoc?.normalizedText ?? null,
        fetchedAt: now, firstObservedAt: priorDoc?.firstObservedAt ?? now, changedAt: priorDoc?.changedAt ?? null,
        previousContentHash: priorDoc?.previousContentHash ?? null, status: "FETCH_FAILED", error: (error as Error).message,
      });
      if (seed.required && !priorDoc) {
        // Required first-run failures remain visible and make authority resolution fail closed.
      }
    }
  }

  const documents = [...nextByUrl.values()].sort((a, b) => a.url.localeCompare(b.url));
  const snapshotSha256 = sha(stable(documents.map((doc) => ({ url: doc.url, contentHash: doc.contentHash, status: doc.status }))));
  const completedAt = new Date().toISOString();
  const state: FederalLoanAuthorityMonitorState = {
    schemaVersion: "federal-loan-authority-monitor-v1",
    lastRunAt: completedAt,
    documents,
    changes: [...previous.changes, ...changes],
    runReceipts: [...previous.runReceipts, { runId, startedAt: now, completedAt, fetched, changed: changes.length, failed, discovered, snapshotSha256 }].slice(-365),
  };
  if (input.persist !== false) writeState(state);
  return { rule: FEDERAL_LOAN_AUTHORITY_MONITOR_RULE, runId, fetched, changed: changes.length, failed, discovered, snapshotSha256, changes, state };
}

export function inspectFederalLoanAuthorityBinding(binding: FederalLoanAuthorityReviewBinding, providedState?: FederalLoanAuthorityMonitorState): {
  current: boolean;
  blockers: string[];
  snapshotSha256: string;
} {
  const state = providedState ?? readState();
  const byUrl = new Map(state.documents.map((doc) => [doc.url, doc]));
  const blockers: string[] = [];
  const reviewedAt = Date.parse(binding.reviewedAt);
  if (!Number.isFinite(reviewedAt)) blockers.push("AUTHORITY_REVIEW_DATE_INVALID");
  for (const ref of binding.officialSourceRefs) {
    const doc = byUrl.get(ref);
    if (!doc) { blockers.push(`AUTHORITY_SOURCE_NOT_MONITORED:${ref}`); continue; }
    if (doc.status === "FETCH_FAILED") blockers.push(`AUTHORITY_SOURCE_FETCH_FAILED:${ref}`);
    if (!doc.contentHash) blockers.push(`AUTHORITY_SOURCE_HAS_NO_BASELINE:${ref}`);
    if (doc.changedAt && Date.parse(doc.changedAt) > reviewedAt) blockers.push(`AUTHORITY_CHANGED_AFTER_REVIEW:${ref}`);
    const boundHash = binding.reviewedContentHashes[ref];
    if (!boundHash) blockers.push(`AUTHORITY_HASH_BINDING_REQUIRED:${ref}`);
    else if (boundHash !== doc.contentHash) blockers.push(`AUTHORITY_HASH_MISMATCH:${ref}`);
  }
  if (binding.officialSourceRefs.length === 0) blockers.push("OFFICIAL_PROGRAM_SOURCE_REQUIRED");
  return { current: blockers.length === 0, blockers, snapshotSha256: sha(stable(binding)) };
}

export function readFederalLoanAuthorityMonitorState(): FederalLoanAuthorityMonitorState {
  return readState();
}
