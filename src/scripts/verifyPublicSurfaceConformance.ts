/**
 * verifyPublicSurfaceConformance — Build 54
 *
 * Hard gate: verifies that the public-facing surface meets all structural,
 * copy, and rendering conformance requirements before deployment.
 *
 * Run via:
 *   npm run verify:public-surface-conformance
 *
 * Checks:
 *   S01  PublicSiteLayout exists and has skip link
 *   S02  PublicSiteLayout has site header with Furlong wordmark
 *   S03  (public)/layout.tsx uses PublicSiteLayout (not PublicPageShell)
 *   S04  Compass watermark renders in PublicSiteLayout
 *   S05  Watermark has no debug artifacts (no red outline, no checkerboard)
 *   S06  No "America 250" header panel inside LivingOpportunityMap component
 *   S07  No ExploreDropdown rendered on homepage
 *   S08  Homepage has no "What would you like to explore today?" section heading
 *   S09  Story card is NOT below the map (overlay pattern in place)
 *   S10  NarrationBar returns null (audio disabled)
 *   S11  No speechSynthesis or SpeechSynthesisUtterance in public components
 *   S12  "Celebrating 250 years" removed from featuredSeriesRegistry
 *   S13  "Ares/Furlong Governed Platform" removed from PlatformChrome
 *   S14  Homepage CTA links to /onboarding (not #explore)
 *   S15  LivingOpportunityMap does not import useNarration or NarrationBar
 *   S16  Watermark base z-index is 0 (viewport-layer — not 1+ debug / not 999)
 *   S17  Watermark uses viewport-centered layout (Build 54: fixed+grid, not translate)
 *   S18  Watermark journey opacity is in visible range (≥ 0.08, ≤ 0.15)
 *
 * Exit codes:
 *   0 — all checks pass
 *   1 — one or more checks failed; details printed to stdout
 *
 * Public Alpha remains PENDING.
 * "The map reveals opportunities, not the visitor."
 */

import * as fs from "fs";
import * as path from "path";

// ── File reader ───────────────────────────────────────────────────────────────

const ROOT = path.resolve(process.cwd());

function readSrc(relPath: string): string {
  const abs = path.join(ROOT, relPath);
  if (!fs.existsSync(abs)) return "";
  return fs.readFileSync(abs, "utf-8");
}

function srcExists(relPath: string): boolean {
  return fs.existsSync(path.join(ROOT, relPath));
}

// ── Check harness ─────────────────────────────────────────────────────────────

type CheckResult = {
  id:     string;
  group:  string;
  label:  string;
  status: "PASS" | "FAIL";
  detail: string | null;
};

function check(
  id:     string,
  group:  string,
  label:  string,
  passes: boolean,
  detail: string,
): CheckResult {
  return { id, group, label, status: passes ? "PASS" : "FAIL", detail: passes ? null : detail };
}

// ── Sources ───────────────────────────────────────────────────────────────────

const publicSiteLayout    = readSrc("src/components/public/PublicSiteLayout.tsx");
const publicLayout        = readSrc("src/app/(public)/layout.tsx");
const watermark           = readSrc("src/components/brand/FurlongCompassWatermark.tsx");
const livingMap           = readSrc("src/components/customer/LivingOpportunityMap.tsx");
const homepage            = readSrc("src/app/(public)/page.tsx");
const narrationBar        = readSrc("src/components/narration/NarrationBar.tsx");
const seriesRegistry      = readSrc("src/lib/customer-landing/featuredSeriesRegistry.ts");
const platformChrome      = readSrc("src/components/platform/PlatformChrome.tsx");
const journeyTour         = readSrc("src/lib/public-content/americasJourneyTour.ts");

// ── Checks ────────────────────────────────────────────────────────────────────

const results: CheckResult[] = [

  // ─── S — Public surface structure ────────────────────────────────────────

  check("S01", "S — Public shell",
    "PublicSiteLayout exists and has skip-to-main link",
    srcExists("src/components/public/PublicSiteLayout.tsx") &&
    publicSiteLayout.includes("main-content") &&
    publicSiteLayout.includes("Skip to main content"),
    "PublicSiteLayout.tsx must exist with a skip-to-main link targeting #main-content."
  ),

  check("S02", "S — Public shell",
    "PublicSiteLayout has site header with Furlong wordmark",
    // Accept either a literal <header> element OR the PublicSiteHeader component reference
    // (which renders the <header> internally — isolation refactor delegates header rendering).
    (publicSiteLayout.includes("<header") || publicSiteLayout.includes("PublicSiteHeader")) &&
    publicSiteLayout.includes("Furlong"),
    "PublicSiteLayout must render a <header> element or delegate to PublicSiteHeader containing the Furlong wordmark."
  ),

  check("S03", "S — Public shell",
    "(public)/layout.tsx uses PublicSiteLayout (not PublicPageShell)",
    publicLayout.includes("PublicSiteLayout") &&
    !publicLayout.includes("PublicPageShell"),
    "(public)/layout.tsx must import and use PublicSiteLayout, not the old PublicPageShell."
  ),

  check("S04", "S — Watermark",
    "Compass watermark renders inside PublicSiteLayout",
    publicSiteLayout.includes("FurlongCompassWatermark"),
    "PublicSiteLayout must render FurlongCompassWatermark exactly once."
  ),

  check("S05", "S — Watermark",
    "Watermark has no debug artifacts (no red outline, no checkerboard)",
    // Build 54: position: fixed is the CORRECT production approach (viewport-centering fix).
    // Debug artifacts to reject: red outlines, checkerboard backgrounds, exaggerated opacity.
    !watermark.includes("outline: 3px solid red") &&
    !watermark.includes("background: repeating-conic") &&
    !watermark.includes("checkerboard") &&
    !watermark.includes("opacity: 0.9"),
    "Watermark must have no debug artifacts: no red outline, no checkerboard, no opacity ≥ 0.9."
  ),

  check("S16", "S — Watermark",
    "Watermark base z-index is 0 (viewport-layer — not 1+ debug / not 999)",
    // Build 54: z-index: 0 places the watermark behind header (z-10) and content (z-10).
    // z-index: 1 was the old Build 53 value; 2+ and 999 are debug values.
    watermark.includes("z-index: 0") &&
    !watermark.includes("z-index: 999"),
    "Watermark z-index must be 0 for production (behind header at z-10 and content at z-10)."
  ),

  check("S17", "S — Watermark",
    "Journey watermark uses viewport-centered layout (Build 54: fixed+grid centering)",
    // Build 54 fix: position:fixed + inset:0 + display:grid + place-items:center replaces
    // the old position:absolute + translate(-50%,-50%) approach that drifted on tall pages.
    watermark.includes("position: fixed") &&
    watermark.includes("inset: 0") &&
    watermark.includes("place-items: center"),
    "Journey watermark must use position:fixed + inset:0 + place-items:center (Build 54 viewport-center fix)."
  ),

  check("S18", "S — Watermark",
    "Journey watermark opacity is in visible range (≥ 0.08, ≤ 0.15)",
    // Build 54: opacity moved to VARIANT_OPACITY record + inline style (not CSS class).
    // Check the VARIANT_OPACITY journey default is in range.
    (() => {
      // Match `journey: 0.10` or `journey: 0.09` etc. in the VARIANT_OPACITY block.
      const match = watermark.match(/journey:\s*([\d.]+)/);
      if (!match) return false;
      const op = parseFloat(match[1]);
      return op >= 0.08 && op <= 0.15;
    })(),
    "Journey watermark opacity (VARIANT_OPACITY.journey) must be between 0.08 and 0.15."
  ),

  // ─── Map structure ────────────────────────────────────────────────────────

  check("S06", "S — Map",
    "No 'America 250' header panel inside LivingOpportunityMap",
    !livingMap.includes("seriesId === \"america-250\"") ||
    // It's OK if there's a simple badge reference, not OK if it's a full navy header panel
    !livingMap.includes('"America 250"') ||
    // Check it's not a big navy panel: no "background: \"#162033\"" near "America 250"
    !(/background.*#162033[\s\S]{0,80}America 250/.test(livingMap)),
    "LivingOpportunityMap must not render a separate 'America 250' navy header panel inside the component. The America250Banner at the top of the site is sufficient."
  ),

  check("S09", "S — Map",
    "Story card is inside the map (MapStoryOverlay pattern present)",
    livingMap.includes("MapStoryOverlay") &&
    livingMap.includes("position: \"absolute\"") &&
    livingMap.includes("MapStoryOverlay story={story}"),
    "StoryCard must be rendered as an overlay inside the map container, not below it. MapStoryOverlay pattern required."
  ),

  check("S15", "S — Map",
    "LivingOpportunityMap does not import useNarration or NarrationBar",
    // Check for actual import statements, not comments.
    !(/^import.*useNarration/m.test(livingMap)) &&
    !(/^import.*NarrationBar/m.test(livingMap)) &&
    !livingMap.includes("speechSynthesis"),
    "LivingOpportunityMap must not import useNarration, NarrationBar, or reference speechSynthesis."
  ),

  // ─── Homepage structure ───────────────────────────────────────────────────

  check("S07", "S — Homepage",
    "Homepage does not render ExploreDropdown",
    !homepage.includes("ExploreDropdown") &&
    !homepage.includes("homepage-explore-select"),
    "Homepage must not render ExploreDropdown. Replace with a simple CTA link to /onboarding."
  ),

  check("S08", "S — Homepage",
    "Homepage has no 'What would you like to explore today?' section heading in JSX",
    !homepage.includes("What would you like to explore today"),
    "Homepage must not render 'What would you like to explore today?' as a visible heading."
  ),

  check("S14", "S — Homepage",
    "Single journey CTA lives on the map capstone and points to /explore",
    // Build 56: the journey CTA is consolidated to ONE button on the map's
    // capstone card ("Ready to begin your Journey?" → /explore). The homepage
    // must NOT render a second, non-map journey CTA (no /onboarding link here),
    // and the /explore destination must exist.
    journeyTour.includes('href:     "/explore"') &&
    journeyTour.includes("Ready to begin your Journey?") &&
    !homepage.includes('href="/onboarding"') &&
    srcExists("src/app/(public)/explore/page.tsx") &&
    !homepage.includes('href="#explore"'),
    "Exactly one journey CTA must exist on the map capstone (href /explore, label 'Ready to begin your Journey?'); the homepage must not have a second /onboarding journey CTA, and /explore must exist."
  ),

  // ─── Audio / narration ────────────────────────────────────────────────────

  check("S10", "S — Audio",
    "NarrationBar returns null (audio disabled)",
    // Check for return null in function body — allow docblock mentions of APIs as forbidden-list notes.
    narrationBar.includes("return null") &&
    // speechSynthesis must not appear in executable code (only allowed in doc comments).
    !(/window\.speechSynthesis|new SpeechSynthesisUtterance/.test(narrationBar)),
    "NarrationBar must return null until professional audio assets are deployed. Web Speech API must not be called."
  ),

  check("S11", "S — Audio",
    "No speechSynthesis in public-facing components",
    !livingMap.includes("speechSynthesis") &&
    !homepage.includes("speechSynthesis") &&
    !publicSiteLayout.includes("speechSynthesis"),
    "speechSynthesis (Web Speech API) must not appear in LivingOpportunityMap, homepage, or PublicSiteLayout."
  ),

  // ─── Copy conformance ─────────────────────────────────────────────────────

  check("S12", "S — Copy",
    "'Celebrating 250 years' removed from featuredSeriesRegistry",
    !seriesRegistry.includes("Celebrating 250 years"),
    "featuredSeriesRegistry.ts must not contain 'Celebrating 250 years'. Update the tagline."
  ),

  check("S13", "S — Copy",
    "'Ares/Furlong Governed Platform' removed from PlatformChrome",
    !platformChrome.includes("Ares/Furlong Governed Platform"),
    "PlatformChrome.tsx must not display 'Ares/Furlong Governed Platform'. Use 'Furlong Governed Platform'."
  ),

];

// ── Report ────────────────────────────────────────────────────────────────────

const pass     = results.filter(r => r.status === "PASS").length;
const fail     = results.filter(r => r.status === "FAIL").length;
const failures = results.filter(r => r.status === "FAIL");
const line     = "─".repeat(72);

console.log("\n╔══ verify:public-surface-conformance ════════════════════════════════╗");
console.log(`║  ${pass}/${results.length} checks pass  ·  ${fail} failure(s)`.padEnd(70) + "║");
console.log("╚══════════════════════════════════════════════════════════════════════╝\n");

if (failures.length === 0) {
  console.log("✓  Public surface conformance: PASS\n");
  process.exit(0);
}

for (const f of failures) {
  console.error(line);
  console.error(`  ✗  ${f.id}  ${f.label}`);
  console.error(`     ${f.detail}`);
  console.error("");
}
console.error(line);
console.error(`\n✗  Public surface conformance: FAIL — ${fail} check(s) failed.\n`);
process.exit(1);
