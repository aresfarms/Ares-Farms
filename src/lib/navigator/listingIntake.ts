/**
 * External-listing-as-universal-input (spec §4) — ISOMORPHIC, pure.
 *
 * A visitor may paste any external listing URL (Crexi / Zillow / Redfin /
 * LoopNet) or a plain address. The pasted text is the INPUT ONLY:
 *
 *  LAWFUL SEAM (G-4, enforced here architecturally): this module NEVER fetches
 *  the listing URL and NEVER stores/renders source-listing content. It parses
 *  the URL/address TEXT the visitor pasted, resolves it to a property reference
 *  (address-ish slug + jurisdiction guess), and Furlong's OWN analysis runs on
 *  the PROPERTY from public + licensed data. Photos, copy, and compiled listing
 *  data from the source site are out of reach by construction — there is no
 *  network call in this module at all.
 *
 * Parcel-grade resolution (geocoder → APN) is a gated live capability (Module
 * 22/23 pattern); until activated, the reference carries resolution:"address-
 * text" and downstream checks degrade honestly to CAN'T-DETERMINE.
 */

export const LISTING_INTAKE_VERSION = "listing-intake-v0.1.0";

export type ListingSource = "crexi" | "zillow" | "redfin" | "loopnet" | "other-url" | "plain-address";

export interface PropertyReference {
  /** Address text recovered from the input (never person-keyed). */
  addressText: string;
  /** Two-letter state code when recoverable. */
  state: string | null;
  /** City/locality when recoverable. */
  locality: string | null;
  /** Where the input came from — the HOST ONLY; no listing content. */
  source: ListingSource;
  /** How far we resolved: address-text now; "parcel" once live geocode activates. */
  resolution: "address-text" | "parcel";
  /** Always null until the gated live resolver is activated. */
  parcelId: null;
}

const HOSTS: [string, ListingSource][] = [
  ["crexi.com", "crexi"],
  ["zillow.com", "zillow"],
  ["redfin.com", "redfin"],
  ["loopnet.com", "loopnet"],
];

const STATE_RE = /\b(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY|DC|PR)\b/;

/** Does the text look like a pasted URL? */
export function looksLikeListingUrl(text: string): boolean {
  return /^https?:\/\//i.test(text.trim()) || /\b(?:crexi|zillow|redfin|loopnet)\.com\//i.test(text);
}

/** Does the text look like a street address? (number + words + optional state) */
export function looksLikeAddress(text: string): boolean {
  return /\d{1,6}\s+[A-Za-z][A-Za-z .'-]{2,}\b(?:st|street|ave|avenue|rd|road|ln|lane|dr|drive|blvd|way|ct|court|pl|place|hwy|highway|pike|terrace|trail)\b/i.test(text)
    || (/\d{1,6}\s+\S+/.test(text) && STATE_RE.test(text.toUpperCase()));
}

function stripListingArtifacts(text: string): string {
  let cleaned = text;
  const tokens = cleaned.split(/\s+/).filter(Boolean);
  const stateIndex = tokens.findIndex((token) => STATE_RE.test(token.toUpperCase()));
  if (stateIndex >= 0) {
    const next = tokens[stateIndex + 1] ?? "";
    const endIndex = /^\d{5}(?:-\d{4})?$/.test(next) ? stateIndex + 1 : stateIndex;
    cleaned = tokens.slice(0, endIndex + 1).join(" ");
  }

  cleaned = cleaned
    .replace(/\bM\d{4,}\s+\d{4,}\b/gi, "")
    .replace(/\b(?:zpid|mls)\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  return cleaned;
}

/** Turn a URL path slug into address-ish text: "123-Main-St-Beckley-WV-25801" → "123 Main St Beckley WV 25801". */
function slugToAddress(slug: string): string {
  return stripListingArtifacts(
    decodeURIComponent(slug)
    .replace(/[_-]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .replace(/\b(\d{5})(?:\s*\d{4})?\b\s*$/, "$1")
    .trim()
  );
}

/**
 * Resolve pasted input (URL or address text) to a PropertyReference.
 * NO network access — the URL string itself is parsed and discarded; only the
 * recovered ADDRESS TEXT + the host name are kept. Returns null when nothing
 * address-shaped is recoverable (the conversation then asks for the address).
 */
export function resolveListingInput(raw: string): PropertyReference | null {
  const text = raw.trim();
  if (!text) return null;

  if (looksLikeListingUrl(text)) {
    let url: URL | null = null;
    try { url = new URL(text.startsWith("http") ? text : `https://${text}`); } catch { url = null; }
    if (!url) return null;
    const hostname = url.hostname.toLowerCase();
    const source = HOSTS.find(([domain]) =>
      hostname === domain || hostname.endsWith(`.${domain}`)
    )?.[1] ?? "other-url";
    // Address-ish slug is usually the longest path segment containing a number.
    const segs = url.pathname.split("/").filter(Boolean);
    const addrSeg = segs
      .map(slugToAddress)
      .filter((s) => /\d/.test(s) && /[A-Za-z]/.test(s))
      .sort((a, b) => b.length - a.length)[0];
    if (!addrSeg) {
      // URL recognized but no address recoverable from its text → ask for it.
      return { addressText: "", state: null, locality: null, source, resolution: "address-text", parcelId: null };
    }
    const stateMatch = addrSeg.toUpperCase().match(STATE_RE);
    return {
      addressText: addrSeg,
      state: stateMatch ? stateMatch[1] : null,
      locality: null,
      source,
      resolution: "address-text",
      parcelId: null,
    };
  }

  if (looksLikeAddress(text)) {
    const stateMatch = text.toUpperCase().match(STATE_RE);
    return {
      addressText: stripListingArtifacts(text.replace(/\s{2,}/g, " ")),
      state: stateMatch ? stateMatch[1] : null,
      locality: null,
      source: "plain-address",
      resolution: "address-text",
      parcelId: null,
    };
  }

  return null;
}
