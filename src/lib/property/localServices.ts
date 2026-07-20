/**
 * localServices — the "utilities, public safety & diligence links" block for the
 * property analysis (founder direction 2026-07-20: #38 utility providers + #39
 * public-safety and planned-construction). Honest by construction:
 *
 *   - We show what public data actually resolves (electric COST by state, FCC
 *     broadband COVERAGE by county) and, for everything that has no clean
 *     national by-address feed (the serving utility, water/sewer/trash, gas), we
 *     point to the authoritative place to confirm it for THIS address — never a
 *     fabricated provider name.
 *   - PUBLIC SAFETY IS LINK-OUT ONLY (founder decision 2026-07-20). Furlong does
 *     not embed, rank, or map neighborhoods by crime — that invites fair-housing
 *     steering (the reason Realtor.com/Trulia pulled their crime maps). We link
 *     to the official FBI Crime Data Explorer + the local sheriff so a buyer can
 *     look it up themselves, with plain framing.
 *   - Planned construction: there is no single national by-address DOT feed; each
 *     state DOT publishes its own. We route the buyer to the state DOT + county
 *     planning office rather than invent a projects list.
 *
 * Deterministic + pure. Facts and authoritative links only; never advice.
 */

export interface ServiceLine {
  category: string;
  /** What we know / what the buyer should do to confirm it for this address. */
  detail: string;
  /** An authoritative lookup, when a real one exists (else null → confirm-in-text). */
  url: string | null;
  urlLabel: string | null;
}

export interface LocalServices {
  utilities: ServiceLine[];
  publicSafety: ServiceLine[];
  plannedConstruction: ServiceLine[];
}

export interface LocalServicesFacts {
  stateCode: string | null;
  stateName: string | null;
  county: string | null;
  /** State-average residential ¢/kWh (EIA), when resolved. */
  electricCentsPerKwh: number | null;
  /** County broadband coverage (FCC BDC), when resolved. */
  broadbandPctServed: number | null;
  broadbandPctWired: number | null;
}

const FCC_MAP = "https://broadbandmap.fcc.gov/";
const FBI_CDE = "https://cde.ucr.cjis.gov/";

function countyLabel(county: string | null): string {
  return county && county !== "Unknown" ? `${county} County` : "the county";
}

/** Build the utilities + public-safety + planned-construction link block. */
export function buildLocalServices(f: LocalServicesFacts): LocalServices {
  const where = countyLabel(f.county);
  const localGov = `${where}${f.stateName ? `, ${f.stateName}` : ""}`;

  // ── Utilities ───────────────────────────────────────────────────────────
  const utilities: ServiceLine[] = [];

  utilities.push({
    category: "Electricity",
    detail:
      (f.electricCentsPerKwh != null
        ? `Power runs about ${f.electricCentsPerKwh.toFixed(1)}¢/kWh on the state average (EIA). `
        : "") +
      "The serving utility for this exact address isn't in a national dataset — confirm it on the seller's utility disclosure, or call the local electric provider to open service.",
    url: null,
    urlLabel: null,
  });

  utilities.push({
    category: "Internet / broadband",
    detail:
      (f.broadbandPctServed != null
        ? `About ${Math.round(f.broadbandPctServed)}% of ${where}'s locations are served, ${
            f.broadbandPctWired != null ? `${Math.round(f.broadbandPctWired)}% by a wired provider` : "some wired"
          } (FCC). `
        : "") + "Look up the actual providers and speeds for THIS address on the FCC's official map.",
    url: FCC_MAP,
    urlLabel: "FCC National Broadband Map",
  });

  utilities.push({
    category: "Water, sewer & trash",
    detail:
      `These are municipal — set by ${localGov}, not any national by-address feed. Confirm whether the parcel is on public water/sewer or a well/septic, who hauls trash, and the connection or hookup fees with the local government before you buy.`,
    url: null,
    urlLabel: null,
  });

  utilities.push({
    category: "Natural gas",
    detail:
      "Gas service isn't universal — many rural parcels are propane or all-electric. Confirm whether piped natural gas reaches this address with the local gas utility.",
    url: null,
    urlLabel: null,
  });

  // ── Public safety (LINK-OUT ONLY — no embedded crime numbers) ───────────
  const publicSafety: ServiceLine[] = [
    {
      category: "Public safety",
      detail:
        "Furlong doesn't rank or map neighborhoods by crime — that data invites unfair steering. Look up reported crime for this area yourself on the official FBI source, and the local sheriff's office is the authority on this address.",
      url: FBI_CDE,
      urlLabel: "FBI Crime Data Explorer",
    },
  ];

  // ── Planned construction (no national by-address feed) ──────────────────
  const plannedConstruction: ServiceLine[] = [
    {
      category: "Planned road & construction",
      detail:
        `A new interchange, road widening, or utility project nearby can change access, noise, and value. There's no single national by-address feed — check planned projects with ${
          f.stateName ? `the ${f.stateName} DOT` : "the state DOT"
        } and the ${where} planning office before you commit.`,
      url: null,
      urlLabel: null,
    },
  ];

  return { utilities, publicSafety, plannedConstruction };
}
