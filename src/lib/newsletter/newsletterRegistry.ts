/**
 * newsletterRegistry — the list of CURRENT newsletters (founder direction
 * 2026-07-18: the Dispatch renders as a LINK under "Current Newsletters", and
 * every subsequent newsletter — and podcasts, once running — auto-populates
 * under that heading; the full letter lives on its own page).
 *
 * Adding an edition = one entry here; every surface that lists newsletters
 * reads this registry. Podcasts join with kind: "podcast" when they exist.
 */

import type { NewsletterAudience } from "./newsletterEditions";

export interface NewsletterListing {
  /** URL key — /newsletters/<key>. */
  key: string;
  kind: "newsletter" | "podcast";
  audience: NewsletterAudience;
  regionKey: string;
  title: string;
}

export const CURRENT_NEWSLETTERS: NewsletterListing[] = [
  {
    key: "farm-delmarva",
    kind: "newsletter",
    audience: "farm",
    regionKey: "delmarva",
    title: "The Furlong Compass — Farms & Ranches · the Delmarva",
  },
  // Subsequent editions (commercial, finance, environmental…) append here as
  // their letters are written; podcasts append with kind: "podcast".
];

export function newsletterByKey(key: string): NewsletterListing | null {
  return CURRENT_NEWSLETTERS.find((n) => n.key === key) ?? null;
}
