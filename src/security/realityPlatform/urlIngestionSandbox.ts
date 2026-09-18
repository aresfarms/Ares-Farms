/**
 * REALITY-SEC-001 §3.3 — URL ingestion sandbox (ISOMORPHIC, pure).
 *
 * Every pasted link is judged here BEFORE any use. The current intake layer
 * (listingIntake) makes ZERO network calls — it parses the URL text only — so
 * SSRF, cookie, and credential exposure are impossible by construction TODAY.
 * This sandbox makes those guarantees explicit and load-bearing for the day a
 * live fetcher is activated: normalization, allow/denylist, internal-IP and
 * credential blocking, and the source-content rules (address/parcel extraction
 * only; proprietary copy/photos/compiled data never stored or rendered).
 */

import { resolveListingInput, type PropertyReference } from "@/lib/navigator/listingIntake";

export type SandboxVerdictKind = "RESOLVED" | "QUARANTINED" | "BLOCKED";

export interface SandboxVerdict {
  verdict: SandboxVerdictKind;
  reasons: string[];
  /** Normalized URL (scheme lowercased, credentials stripped check applied). */
  normalizedUrl: string | null;
  /** Address/parcel extraction ONLY — never listing content. */
  reference: PropertyReference | null;
  sourceCategory: string | null;
}

/** Supported initial source categories (spec §3.3). */
const ALLOWLIST: [RegExp, string][] = [
  [/(^|\.)zillow\.com$/i, "zillow"],
  [/(^|\.)redfin\.com$/i, "redfin"],
  [/(^|\.)crexi\.com$/i, "crexi"],
  [/(^|\.)loopnet\.com$/i, "loopnet"],
  [/(^|\.)realtor\.com$/i, "realtor"],
  [/(^|\.)landwatch\.com$/i, "landwatch"],
  [/(^|\.)land\.com$/i, "land.com"],
];

/** SSRF / internal targets — always BLOCKED. */
const INTERNAL_HOST = /^(localhost|127\.|0\.0\.0\.0|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|169\.254\.|\[::1\]|metadata\.google\.internal)/i;

export function sandboxUrl(raw: string): SandboxVerdict {
  let url: URL;
  try { url = new URL(raw.trim()); } catch {
    return { verdict: "QUARANTINED", reasons: ["unparseable URL"], normalizedUrl: null, reference: null, sourceCategory: null };
  }
  const reasons: string[] = [];

  // protocol: http(s) only — no file:, ftp:, data:, javascript:.
  if (!/^https?:$/.test(url.protocol)) {
    return { verdict: "BLOCKED", reasons: [`unsupported protocol ${url.protocol}`], normalizedUrl: null, reference: null, sourceCategory: null };
  }
  // SSRF: localhost / internal IP / cloud metadata — blocked.
  if (INTERNAL_HOST.test(url.hostname)) {
    return { verdict: "BLOCKED", reasons: ["internal/localhost target (SSRF protection)"], normalizedUrl: null, reference: null, sourceCategory: null };
  }
  // credentials in the URL — never forwarded; blocked outright.
  if (url.username || url.password) {
    return { verdict: "BLOCKED", reasons: ["credentials embedded in URL — never forwarded"], normalizedUrl: null, reference: null, sourceCategory: null };
  }

  const normalizedUrl = `${url.protocol}//${url.hostname.toLowerCase()}${url.pathname}`;
  const allow = ALLOWLIST.find(([re]) => re.test(url.hostname));
  const reference = resolveListingInput(raw); // TEXT parse only — no fetch, no cookies, no auth.

  if (!allow) {
    // Generic address URLs: allowed only as quarantined sources — the address
    // text may be used; the page is never fetched or trusted.
    return {
      verdict: "QUARANTINED",
      reasons: ["unsupported domain — source content quarantined; address text only"],
      normalizedUrl,
      reference,
      sourceCategory: "generic-url",
    };
  }
  return {
    verdict: "RESOLVED",
    reasons: reasons.length ? reasons : ["allowlisted source; address/parcel extraction only"],
    normalizedUrl,
    reference,
    sourceCategory: allow[1],
  };
}

/** Structural invariants the verifier asserts. */
export const SANDBOX_RULES = [
  "URL normalization", "domain allowlist/denylist", "SSRF protection",
  "no localhost/internal IP fetches", "no credential forwarding",
  "no cookies from the user's browser", "no authenticated scraping unless separately licensed and governed",
  "robots/rate-limit compliance where applicable", "source-content quarantine",
  "address/parcel extraction only", "proprietary listing copy/photos/compiled data never stored or rendered",
] as const;
