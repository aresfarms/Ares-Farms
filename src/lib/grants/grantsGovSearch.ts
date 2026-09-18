/**
 * grantsGovSearch — live federal grant opportunities (SERVER-ONLY).
 *
 * Tier-2 activation 2026-07-28: the Grants & Programs lane carried only the
 * curated briefs while the Grants.gov integration sat unbuilt. This module
 * queries the official Grants.gov Search2 API (api.grants.gov — U.S.
 * government work, public domain; the basic search endpoint is public, and
 * GRANTS_GOV_API_KEY remains provisioned for any future authenticated
 * endpoints).
 *
 * Same live-feed class as the FRED capital rates and USDM drought pulls: a
 * public-domain federal data feed rendered as FACTS WITH SOURCE + link-out.
 * Doctrine held in code:
 *   - metadata only (title, agency, dates, status) — every item links to its
 *     own grants.gov detail page; Furlong never restates award terms;
 *   - no eligibility language — whether a program fits a PERSON is for the
 *     agency and licensed professionals;
 *   - honest degradation — a failed or empty fetch renders the curated briefs
 *     alone plus a plain link-out; nothing fabricated, nothing cached-stale
 *     beyond the hour.
 */

export interface GrantOpportunity {
  id: string;
  number: string;
  title: string;
  agency: string;
  openDate: string | null;
  closeDate: string | null;
  status: "posted" | "forecasted";
  detailUrl: string;
}

export interface GrantsGovResult {
  opportunities: GrantOpportunity[];
  searchedKeywords: string[];
  fetchedAt: string;
  source: string;
}

const API = "https://api.grants.gov/v1/api/search2";

/** Furlong-audience default sweeps — the lane's people, not the whole register. */
const DEFAULT_KEYWORDS = ["farm", "rural development", "conservation", "small business"];

interface Search2Hit {
  id?: string | number;
  number?: string;
  title?: string;
  agencyName?: string;
  agency?: string;
  openDate?: string;
  closeDate?: string;
  oppStatus?: string;
}

async function searchOne(keyword: string, rows: number): Promise<GrantOpportunity[]> {
  const res = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ keyword, oppStatuses: "posted", rows, sortBy: "openDate|desc" }),
    // Revalidate hourly — polite to the API, fresh enough for a daily register.
    next: { revalidate: 3600 },
  }).catch(() => null);
  if (!res || !res.ok) return [];
  const body = (await res.json().catch(() => null)) as
    | { data?: { oppHits?: Search2Hit[] } }
    | null;
  const hits = body?.data?.oppHits ?? [];
  return hits
    .map((h): GrantOpportunity | null => {
      const id = String(h.id ?? "").trim();
      const title = String(h.title ?? "").trim();
      if (!id || !title) return null;
      return {
        id,
        number: String(h.number ?? "").trim(),
        title,
        agency: String(h.agencyName ?? h.agency ?? "").trim() || "Federal agency",
        openDate: h.openDate ? String(h.openDate) : null,
        closeDate: h.closeDate ? String(h.closeDate) : null,
        status: (h.oppStatus ?? "posted").toLowerCase() === "forecasted" ? "forecasted" : "posted",
        detailUrl: `https://www.grants.gov/search-results-detail/${id}`,
      };
    })
    .filter((o): o is GrantOpportunity => o !== null);
}

/**
 * Fetch a deduplicated sweep of currently-posted opportunities across the
 * lane's default keywords. Never throws; empty list on total failure.
 */
export async function fetchGrantOpportunities(limit = 8): Promise<GrantsGovResult> {
  const perKeyword = Math.max(3, Math.ceil(limit / DEFAULT_KEYWORDS.length) + 1);
  const batches = await Promise.all(DEFAULT_KEYWORDS.map((k) => searchOne(k, perKeyword)));
  const seen = new Set<string>();
  const opportunities: GrantOpportunity[] = [];
  // Interleave keyword batches so one broad keyword can't crowd out the rest.
  for (let i = 0; i < perKeyword && opportunities.length < limit; i += 1) {
    for (const batch of batches) {
      const item = batch[i];
      if (!item || seen.has(item.id)) continue;
      seen.add(item.id);
      opportunities.push(item);
      if (opportunities.length >= limit) break;
    }
  }
  return {
    opportunities,
    searchedKeywords: [...DEFAULT_KEYWORDS],
    fetchedAt: new Date().toISOString(),
    source: "Grants.gov (api.grants.gov Search2) — U.S. government work, public domain",
  };
}
