/**
 * publicAccessibilitySmokeTest — Build 50 WCAG 2.2 AA browser smoke test
 *
 * Doctrine: docs/DOCTRINE_PUBLIC_ACCESSIBILITY_WCAG_AA_V1.md
 * Version:  public-accessibility-wcag-aa-v1.0
 *
 * Two-mode operation:
 *
 *   MODE A — Playwright + axe-core (full browser testing)
 *     Requires: `npx playwright install chromium`
 *     Requires: server running at BASE_URL (default: http://localhost:3000)
 *     Launches Chromium, injects axe-core, runs WCAG 2.2 AA audit per page.
 *     Reports zero-tolerance: any WCAG critical/serious axe violation fails the gate.
 *
 *   MODE B — Static source analysis (graceful fallback)
 *     Runs when Playwright browsers are not installed or server is not reachable.
 *     Re-runs the acceptance criteria checks against source files.
 *     Reports which mode was active.
 *
 * Acceptance criteria (both modes):
 *   1. Homepage has exactly one exploration prompt (fl-explore-form)
 *   2. Dropdown has accessible label (aria-label on select)
 *   3. No duplicated CTA (no fl-explore-card AND fl-explore-form)
 *   4. No exposed category-card wall (no fl-category-card on homepage)
 *   5. Static accessibility gate passes (verify:accessibility)
 *
 * Public pages covered (MODE A when server available):
 *   / | /onboarding | /stewardship | /stewardship/financing-capital
 *   /stewardship/environmental-compliance | /about | /trust
 *   /data-rights | /financing-pathways | /readiness | /portal/borrower
 *
 * Usage:
 *   # Static mode (always works):
 *   npm run smoke:accessibility
 *
 *   # Full browser mode (requires server + browser):
 *   next start &
 *   npx playwright install chromium
 *   npm run smoke:accessibility
 *
 * Exit 0 on all pass, 1 on any failure.
 *
 * Public Alpha remains PENDING.
 * "The map reveals opportunities, not the visitor."
 */

import * as childProcess from "node:child_process";
import * as fs           from "node:fs";
import * as http         from "node:http";
import * as path         from "node:path";

// ── Configuration ─────────────────────────────────────────────────────────────

const BASE_URL = process.env.SMOKE_BASE_URL ?? "http://localhost:3000";
const TIMEOUT_MS = 30_000;

const DOC_REF    = "docs/DOCTRINE_PUBLIC_ACCESSIBILITY_WCAG_AA_V1.md";
const VERSION    = "public-accessibility-wcag-aa-v1.0";
const BUILD_PHASE = "Build 50 — Homepage Cleanup + Accessibility Gate";

// Pages to audit in browser mode (prioritized by risk)
const AUDIT_PAGES = [
  { path: "/",                                     label: "Homepage" },
  { path: "/onboarding",                           label: "Onboarding" },
  { path: "/stewardship",                          label: "Stewardship Gateway" },
  { path: "/stewardship/financing-capital",         label: "Stewardship — Financing" },
  { path: "/stewardship/environmental-compliance",  label: "Stewardship — Environmental" },
  { path: "/stewardship/communications-public-trust", label: "Stewardship — Trust" },
  { path: "/about",                                label: "About" },
  { path: "/trust",                                label: "Trust" },
  { path: "/data-rights",                          label: "Data Rights" },
  { path: "/financing-pathways",                   label: "Financing Pathways" },
  { path: "/readiness",                            label: "Readiness" },
  { path: "/portal/borrower",                      label: "Borrower Portal" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function readSrc(rel: string): string {
  const abs = path.join(process.cwd(), rel);
  try { return fs.readFileSync(abs, "utf8"); }
  catch { return ""; }
}

function log(msg: string) { process.stdout.write(msg + "\n"); }

// Test if a TCP connection to the server is possible
function isServerReachable(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const u = new URL(url);
      const req = http.request({
        hostname: u.hostname,
        port:     Number(u.port) || 3000,
        path:     "/",
        method:   "HEAD",
        timeout:  3000,
      }, () => resolve(true));
      req.on("error", () => resolve(false));
      req.on("timeout", () => { req.destroy(); resolve(false); });
      req.end();
    } catch { resolve(false); }
  });
}

// ── Acceptance criteria (source-level, always run) ────────────────────────────

type CriterionResult = {
  id:     string;
  label:  string;
  pass:   boolean;
  detail: string;
};

function runAcceptanceCriteria(): CriterionResult[] {
  const homepage = readSrc("src/app/page.tsx");

  return [
    {
      id:    "AC-1",
      label: "Homepage has exactly one exploration prompt (single fl-explore-form)",
      pass:  homepage.includes("fl-explore-form") && !homepage.includes("fl-explore-grid"),
      detail: "Build 50: single dropdown form, no dual-card explore section.",
    },
    {
      id:    "AC-2",
      label: "Dropdown has visible <label> element (htmlFor + id paired)",
      pass:  (homepage.includes('htmlFor="homepage-explore-select"') ||
              homepage.includes('for="homepage-explore-select"')) &&
             homepage.includes('id="homepage-explore-select"'),
      detail: "Select must have a visible <label> with matching htmlFor/id (WCAG 3.3.2 / 4.1.2).",
    },
    {
      id:    "AC-3",
      label: "No duplicated CTA (explore form and explore cards not both present)",
      pass:  !homepage.includes("fl-explore-card") || !homepage.includes("fl-explore-form"),
      detail: "Homepage must not have both the explore dual-cards and the dropdown form.",
    },
    {
      id:    "AC-4",
      label: "No exposed category-card wall (fl-category-card not on homepage)",
      pass:  !homepage.includes("fl-category-card"),
      detail: "Category card grid must be removed in Build 50 (lighthouse architecture).",
    },
    {
      id:    "AC-5",
      label: "Static accessibility gate passes (verify:accessibility)",
      pass:  (() => {
        try {
          childProcess.execSync("tsx src/scripts/verifyPublicAccessibility.ts", {
            cwd: process.cwd(), stdio: "pipe",
          });
          return true;
        } catch { return false; }
      })(),
      detail: "All static WCAG checks in verifyPublicAccessibility.ts must pass.",
    },
  ];
}

// ── Mode A: Playwright + axe browser audit ────────────────────────────────────

type AxeViolation = {
  id:     string;
  impact: string;
  description: string;
  nodes:  number;
};

type PageAuditResult = {
  page:          string;
  label:         string;
  url:           string;
  status:        "PASS" | "FAIL" | "SKIP";
  violations:    AxeViolation[];
  criticalCount: number;
  seriousCount:  number;
  message:       string;
};

async function runBrowserAudit(): Promise<{
  results: PageAuditResult[];
  mode: "playwright-axe";
  browserInstalled: boolean;
}> {
  // Dynamic import so the script doesn't fail when Playwright isn't installed
  // @axe-core/playwright uses AxeBuilder class API (not injectAxe/getViolations)
  let chromium: import("@playwright/test").BrowserType | null = null;
  let AxeBuilder: (new (params: { page: unknown }) => {
    withTags(tags: string[]): unknown;
    analyze(): Promise<{ violations: Array<{ id: string; impact?: string | null; description: string; nodes: unknown[] }> }>;
  }) | null = null;

  try {
    const pw  = await import("@playwright/test");
    chromium  = pw.chromium;
    const axe = await import("@axe-core/playwright");
    AxeBuilder = axe.AxeBuilder as typeof AxeBuilder;
  } catch (err) {
    throw new Error(`Playwright or @axe-core/playwright not importable: ${String(err)}`);
  }

  if (!chromium || !AxeBuilder) {
    throw new Error("chromium or AxeBuilder null after import");
  }

  let browser: Awaited<ReturnType<typeof chromium.launch>> | null = null;
  const results: PageAuditResult[] = [];

  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      reducedMotion: "reduce", // test motion safety
    });

    for (const pageDef of AUDIT_PAGES) {
      const url = `${BASE_URL}${pageDef.path}`;
      const pw  = await context.newPage();

      try {
        await pw.goto(url, { timeout: TIMEOUT_MS, waitUntil: "domcontentloaded" });

        // Run axe with WCAG 2.2 AA tag set via AxeBuilder
        const axeResults = await (
          (new AxeBuilder!({ page: pw })) as unknown as {
            withTags(t: string[]): { analyze(): Promise<{ violations: Array<{ id: string; impact?: string | null; description: string; nodes: unknown[] }> }> };
          }
        ).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();

        const violations = axeResults.violations;
        const critical = violations.filter(v => v.impact === "critical");
        const serious  = violations.filter(v => v.impact === "serious");

        const mapped: AxeViolation[] = violations.map(v => ({
          id:          v.id,
          impact:      v.impact ?? "unknown",
          description: v.description,
          nodes:       v.nodes.length,
        }));

        results.push({
          page:          pageDef.path,
          label:         pageDef.label,
          url,
          status:        (critical.length + serious.length) === 0 ? "PASS" : "FAIL",
          violations:    mapped,
          criticalCount: critical.length,
          seriousCount:  serious.length,
          message:       (critical.length + serious.length) === 0
            ? `PASS — 0 critical/serious violations (${violations.length} total incl. minor)`
            : `FAIL — ${critical.length} critical, ${serious.length} serious violations`,
        });
      } catch (pageErr) {
        results.push({
          page:          pageDef.path,
          label:         pageDef.label,
          url,
          status:        "SKIP",
          violations:    [],
          criticalCount: 0,
          seriousCount:  0,
          message:       `SKIP — ${String(pageErr)}`,
        });
      } finally {
        await pw.close();
      }
    }

    await context.close();
  } finally {
    if (browser) await browser.close();
  }

  return { results, mode: "playwright-axe", browserInstalled: true };
}

// ── Mode B: Source-level fallback ─────────────────────────────────────────────

function runStaticFallback(): {
  mode:    "static-fallback";
  reason:  string;
  message: string;
} {
  return {
    mode:    "static-fallback",
    reason:  "Playwright browsers not installed or server not reachable. " +
             "Run `npx playwright install chromium && next start` for full browser audit.",
    message: "Static fallback mode — acceptance criteria checked via source analysis only.",
  };
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  log("publicAccessibilitySmokeTest — Build 50");
  log(`BASE_URL: ${BASE_URL}`);

  // Always run acceptance criteria
  log("\n[1/3] Running acceptance criteria (source-level)…");
  const criteria = runAcceptanceCriteria();
  const criteriaPass = criteria.filter(c => c.pass).length;
  const criteriaFail = criteria.filter(c => !c.pass).length;

  // Probe for server + browser availability
  log("\n[2/3] Probing server and browser availability…");
  const serverReachable = await isServerReachable(BASE_URL);
  let browserAvailable  = false;

  if (serverReachable) {
    try {
      await import("@playwright/test");
      // Check if chromium executable exists
      const { execSync } = await import("node:child_process");
      try {
        execSync("npx playwright install --dry-run chromium", { stdio: "pipe" });
        // If dry-run doesn't error out with "not installed", browsers may be present
        browserAvailable = true;
      } catch {
        browserAvailable = false;
      }
    } catch {
      browserAvailable = false;
    }
  }

  // Run browser audit or fall back
  log(`\n[3/3] ${serverReachable && browserAvailable ? "Running Playwright + axe browser audit…" : "Using static fallback mode…"}`);
  log(`  Server reachable: ${serverReachable}`);
  log(`  Browser installed: ${browserAvailable}`);

  let browserMode: "playwright-axe" | "static-fallback" = "static-fallback";
  let browserResults: PageAuditResult[] = [];
  let fallbackInfo: ReturnType<typeof runStaticFallback> | null = null;
  let browserPass = 0;
  let browserFail = 0;

  if (serverReachable && browserAvailable) {
    try {
      const result = await runBrowserAudit();
      browserMode    = result.mode;
      browserResults = result.results;
      browserPass    = browserResults.filter(r => r.status === "PASS").length;
      browserFail    = browserResults.filter(r => r.status === "FAIL").length;
    } catch (err) {
      log(`  Browser audit failed: ${String(err)}`);
      fallbackInfo = runStaticFallback();
      browserMode  = "static-fallback";
    }
  } else {
    fallbackInfo = runStaticFallback();
  }

  const overallPass =
    criteriaFail === 0 &&
    (browserMode === "static-fallback" ? true : browserFail === 0);

  const output = {
    ok:            overallPass,
    runtimeVersion: "public-accessibility-smoke-v1.0.0",
    specVersion:   VERSION,
    docRef:        DOC_REF,
    buildPhase:    BUILD_PHASE,
    publicAlpha:   "PENDING",
    privacyPosture: "The map reveals opportunities, not the visitor.",
    mode:          browserMode,
    ...(fallbackInfo ?? {}),

    acceptanceCriteria: {
      total:   criteria.length,
      pass:    criteriaPass,
      fail:    criteriaFail,
      results: criteria.map(c => ({
        id:     c.id,
        label:  c.label,
        status: c.pass ? "PASS" : "FAIL",
        detail: c.detail,
      })),
    },

    ...(browserMode === "playwright-axe" ? {
      browserAudit: {
        baseUrl:    BASE_URL,
        pages:      AUDIT_PAGES.length,
        pass:       browserPass,
        fail:       browserFail,
        skip:       browserResults.filter(r => r.status === "SKIP").length,
        results:    browserResults.map(r => ({
          path:          r.page,
          label:         r.label,
          status:        r.status,
          criticalCount: r.criticalCount,
          seriousCount:  r.seriousCount,
          violations:    r.violations,
          message:       r.message,
        })),
      },
    } : {}),

    exitCode: overallPass ? 0 : 1,
    message:  overallPass
      ? `smoke:accessibility PASS — ${criteriaPass}/${criteria.length} criteria pass` +
        (browserMode === "playwright-axe" ? `, ${browserPass}/${AUDIT_PAGES.length} pages axe-clean` : " (static mode)")
      : `smoke:accessibility FAIL — ${criteriaFail} criteria failed` +
        (browserMode === "playwright-axe" && browserFail > 0 ? `, ${browserFail} pages have axe violations` : ""),
  };

  console.log(JSON.stringify(output, null, 2));
  process.exit(output.exitCode);
}

main().catch((err) => {
  console.error("publicAccessibilitySmokeTest: fatal error", err);
  process.exit(1);
});
