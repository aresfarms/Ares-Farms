/**
 * verify:public-reset-route-isolation — Build 50
 *
 * Checks TWO things for every public-facing route in the Build 50 reset:
 *
 *   A. ISOLATION — No page file renders its own header, watermark, or
 *      visual shell. These must appear ONLY in the public layout.
 *      Forbidden imports in page files (not layout files):
 *        - PublicSiteHeader
 *        - FurlongCompassWatermark
 *        - PublicSiteLayout
 *        - PublicPageShell
 *      Also flags own-shell pattern: page defines background + fontFamily +
 *      minHeight on a wrapping element.
 *
 *   B. CONTENT IDENTITY — Each route's page file contains the required
 *      identity phrase confirming its page-specific content is present.
 *      This is a belt-and-suspenders check that complements
 *      verify:customer-journey (which checks full token/disclosure sets).
 *
 * Routes covered (13):
 *   /  /about  /trust  /data-rights  /stewardship
 *   /stewardship/financing-capital  /stewardship/environmental-compliance
 *   /stewardship/communications-public-trust  /about/furlong-story
 *   /financing-pathways  /readiness  /onboarding  /portal/borrower
 *
 * Governance:
 *   - Does NOT replace verify:customer-journey or verify:disclosures.
 *   - Does NOT check approval/guarantee/determination language
 *     (that is verify:public-surface-no-internal-leak's job).
 *   - DOES fail fast if a page reintroduces its own shell or header.
 *
 * Public Alpha remains PENDING.
 */

import fs   from "fs";
import path from "path";

// ── Types ──────────────────────────────────────────────────────────────────────

type IsolationCheck = {
  /** Forbidden string or regex pattern — must NOT appear in page source. */
  pattern: string | RegExp;
  /** Human-readable description of what the violation means. */
  violation: string;
};

type RouteSpec = {
  route: string;
  /** Path relative to repo root. Stewardship sub-domains share [domainId]/page.tsx. */
  filePath: string;
  /** Additional page-specific isolation patterns beyond the global set. */
  extraForbidden?: IsolationCheck[];
  /** Required identity phrase(s) — at least ONE must be present. */
  requiredIdentity: Array<string | RegExp>;
  /** Short label for the identity token used in error messages. */
  identityLabel: string;
};

// ── Global isolation rules ─────────────────────────────────────────────────────
// Applied to EVERY route's page file (not layout files).

const GLOBAL_ISOLATION_CHECKS: IsolationCheck[] = [
  {
    pattern:   /from\s+["']@\/components\/public\/PublicSiteHeader["']/,
    violation: "Page imports PublicSiteHeader directly — header must come from the layout only.",
  },
  {
    pattern:   /from\s+["']@\/components\/brand\/FurlongCompassWatermark["']/,
    violation: "Page imports FurlongCompassWatermark directly — watermark must come from the layout only.",
  },
  {
    pattern:   /from\s+["']@\/components\/public\/PublicSiteLayout["']/,
    violation: "Page imports PublicSiteLayout directly — layout wrapping must come from layout.tsx only.",
  },
  {
    pattern:   /from\s+["']@\/components\/public\/PublicPageShell["']/,
    violation: "Page imports PublicPageShell directly — shell must come from layout.tsx only.",
  },
  {
    // Own shell: background + fontFamily + minHeight on the same element within a page file
    // This pattern catches: background: "#f6f8fb"  AND  fontFamily:  AND  minHeight: "100vh"
    pattern:   /shellStyle\s*=\s*\{[^}]*background[^}]*fontFamily[^}]*minHeight/,
    violation: "Page defines own visual shell (background + fontFamily + minHeight). Shell is provided by the layout.",
  },

  // ── Operational Roster Clause — founder names must NOT appear on public pages ──
  // Per Volume VII Annex: operational role-holder names live in the internal Annex,
  // not on public surfaces. Show role/domain titles only (stewardTitle, not currentSteward).
  {
    pattern:   "Stuart Fraass",
    violation: "Founder name 'Stuart Fraass' must not appear on public page surfaces. Use role/domain title instead (Operational Roster Clause, Volume VII Annex).",
  },
  {
    pattern:   "Caitlin Hudson",
    violation: "Founder name 'Caitlin Hudson' must not appear on public page surfaces. Use role/domain title instead (Operational Roster Clause, Volume VII Annex).",
  },
  {
    pattern:   "Frances Fraass",
    violation: "Founder name 'Frances Fraass' must not appear on public page surfaces. Use role/domain title instead (Operational Roster Clause, Volume VII Annex).",
  },
];

// ── Route registry ─────────────────────────────────────────────────────────────

const ROUTES: RouteSpec[] = [
  {
    route:            "/",
    filePath:         "src/app/(public)/page.tsx",
    requiredIdentity: [
      /HOMEPAGE_HERO/,
      /HOMEPAGE_CLEAR_WATERS/,
    ],
    identityLabel:    "homepage hero (HOMEPAGE_HERO) + clear-waters section",
  },
  {
    route:            "/about",
    filePath:         "src/app/(public)/about/page.tsx",
    requiredIdentity: [
      /Our Story/,
      /FurlongStoryTimeline/,
    ],
    identityLabel:    "\"Our Story\" founding narrative + founding-thread map",
  },
  {
    route:            "/compass",
    filePath:         "src/app/(public)/compass/page.tsx",
    requiredIdentity: [
      /Compass to Capital/,
    ],
    identityLabel:    "\"Compass to Capital\" value proposition (What We Do)",
  },
  {
    route:            "/trust",
    filePath:         "src/app/(public)/trust/page.tsx",
    requiredIdentity: [
      /No BS, Just Facts/,
      /The Furlong Promise/,
    ],
    identityLabel:    "\"No BS, Just Facts\" trust page identity",
  },
  // /data-rights is not listed: after the Build 56 consolidation it 308-redirects
  // to /trust#your-data (no page to isolate). The data-rights content + identity
  // ("Your Data Rights" / the five rights) now lives on /trust and is validated
  // there by verify:customer-journey (Route 3 → trust/page.tsx) and verifyMapPhotos P22.
  {
    route:            "/stewardship",
    filePath:         "src/app/(public)/stewardship/page.tsx",
    requiredIdentity: [
      /Furlong Stewardship/,
      /STEWARDSHIP_DOMAINS/,
    ],
    identityLabel:    "stewardship index identity",
  },
  {
    // All three sub-domains use the same file
    route:            "/stewardship/[financing-capital|environmental-compliance|communications-public-trust]",
    filePath:         "src/app/(public)/stewardship/[domainId]/page.tsx",
    requiredIdentity: [
      /stewardshipDomainById/,
      /Pathways this steward/,
    ],
    identityLabel:    "stewardship domain page identity",
  },
  {
    route:            "/about/furlong-story",
    filePath:         "src/app/(public)/about/furlong-story/page.tsx",
    requiredIdentity: [
      /The Furlong Story/,
      /Amber Thread/,
    ],
    identityLabel:    "\"The Furlong Story\" + \"Amber Thread\"",
  },
  {
    route:            "/financing-pathways",
    filePath:         "src/app/(public)/financing-pathways/page.tsx",
    requiredIdentity: [
      /[Pp]athway\s+discovery/,
      /FinancingPathwayInput/,
    ],
    identityLabel:    "financing pathway discovery identity",
  },
  {
    route:            "/readiness",
    filePath:         "src/app/(public)/readiness/page.tsx",
    requiredIdentity: [
      /[Rr]eadiness\s+review/,
      /ReadinessAssessmentInput/,
    ],
    identityLabel:    "readiness assessment identity",
  },
  {
    route:            "/onboarding",
    filePath:         "src/app/(public)/onboarding/page.tsx",
    requiredIdentity: [
      /EXPLORATION_CATEGORIES/,
      /four questions/i,
    ],
    identityLabel:    "onboarding categories + four questions",
  },
  {
    route:            "/portal/borrower",
    filePath:         "src/app/portal/borrower/page.tsx",
    requiredIdentity: [
      /pending Alpha activation/,
      /Borrower Portal/,
    ],
    identityLabel:    "\"Borrower Portal\" + \"pending Alpha activation\"",
  },
];

// ── Runner ─────────────────────────────────────────────────────────────────────

type Finding = {
  route:    string;
  filePath: string;
  type:     "ISOLATION" | "IDENTITY";
  message:  string;
};

const REPO_ROOT = path.resolve(process.cwd());

function readFile(relPath: string): string | null {
  const abs = path.join(REPO_ROOT, relPath);
  try {
    return fs.readFileSync(abs, "utf8");
  } catch {
    return null;
  }
}

function check(pattern: string | RegExp, source: string): boolean {
  if (typeof pattern === "string") return source.includes(pattern);
  return pattern.test(source);
}

function run(): void {
  const findings: Finding[] = [];
  const results: Array<{ route: string; ok: boolean; checks: string[] }> = [];

  for (const spec of ROUTES) {
    const source = readFile(spec.filePath);
    const routeFindings: string[] = [];

    if (source === null) {
      findings.push({
        route:    spec.route,
        filePath: spec.filePath,
        type:     "ISOLATION",
        message:  `File not found: ${spec.filePath}`,
      });
      results.push({ route: spec.route, ok: false, checks: [`file not found: ${spec.filePath}`] });
      continue;
    }

    // ── A. Isolation checks ──────────────────────────────────────────────────
    const allIsolation = [
      ...GLOBAL_ISOLATION_CHECKS,
      ...(spec.extraForbidden ?? []),
    ];

    for (const iso of allIsolation) {
      if (check(iso.pattern, source)) {
        findings.push({
          route:    spec.route,
          filePath: spec.filePath,
          type:     "ISOLATION",
          message:  iso.violation,
        });
        routeFindings.push(`ISOLATION: ${iso.violation}`);
      }
    }

    // ── B. Content identity checks ───────────────────────────────────────────
    const hasIdentity = spec.requiredIdentity.some((p) => check(p, source));
    if (!hasIdentity) {
      const msg = `IDENTITY: Required identity token not found — expected ${spec.identityLabel}.`;
      findings.push({
        route:    spec.route,
        filePath: spec.filePath,
        type:     "IDENTITY",
        message:  msg,
      });
      routeFindings.push(msg);
    }

    results.push({
      route: spec.route,
      ok:    routeFindings.length === 0,
      checks: routeFindings,
    });
  }

  // ── Summary output ─────────────────────────────────────────────────────────
  const passCount = results.filter((r) => r.ok).length;
  const failCount = results.filter((r) => !r.ok).length;

  console.log("");
  console.log("╔══ verify:public-reset-route-isolation ══════════════════════════════╗");
  console.log(`║  ${String(ROUTES.length).padStart(2)} routes checked  ·  ${passCount} pass  ·  ${failCount} fail${" ".repeat(Math.max(0, 24 - String(passCount).length - String(failCount).length))}║`);
  console.log("╚═════════════════════════════════════════════════════════════════════╝");
  console.log("");

  for (const r of results) {
    const icon = r.ok ? "✓" : "✗";
    console.log(`  ${icon}  ${r.route}`);
    for (const c of r.checks) {
      console.log(`        → ${c}`);
    }
  }

  if (findings.length > 0) {
    console.log("");
    console.log(`✗  ${findings.length} finding(s) — verify:public-reset-route-isolation FAIL`);
    console.log("");
    process.exit(1);
  }

  console.log("");
  console.log(`✓  All ${ROUTES.length} routes isolated and identified — verify:public-reset-route-isolation PASS`);
  console.log("");
  process.exit(0);
}

run();
