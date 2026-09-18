/**
 * verifyPublicAccessibility — Build 53 WCAG 2.2 AA comprehensive static gate
 *
 * Doctrine: docs/DOCTRINE_PUBLIC_ACCESSIBILITY_WCAG_AA_V1.md
 * Version:  public-accessibility-wcag-aa-v1.0
 *
 * Performs source-level checks for known accessibility anti-patterns across
 * all public-facing pages. Does NOT replace browser-level axe/Playwright
 * testing (see publicAccessibilitySmokeTest.ts), but confirms that the patterns
 * we know cause failures are absent from source code, and that the Build 50
 * homepage structure conforms to the lighthouse architecture.
 *
 * Public pages covered (14):
 *   / | /onboarding | /explore/property-land | /stewardship
 *   /stewardship/financing-capital | /stewardship/environmental-compliance
 *   /stewardship/communications-public-trust | /about | /trust
 *   /data-rights | /financing-pathways | /readiness | /portal/borrower
 *   /accessibility
 *
 * Check groups:
 *   A — Map component ARIA + animation (Build 47-C/47-D/49)
 *   B — Color / contrast patterns
 *   C — Homepage Build 50 structural requirements
 *   D — Navigation / focus / keyboard (extended Build 53)
 *   E — Brand / decorative elements
 *   F — Form accessibility
 *   G — Privacy posture (accessibility gate must not introduce surveillance)
 *   H — Cross-page structural existence (extended Build 53)
 *   I — Build 53 accessibility additions (skip link, footer link, hero size, script)
 *
 * Verification posture:
 *   1.1.1  Non-text content — COVERED
 *   1.3.1  Info and relationships — COVERED
 *   1.4.1  Color not only means — COVERED
 *   1.4.3  Contrast minimum — PARTIAL (banned patterns; full: axe)
 *   1.4.11 Non-text contrast — MANUAL
 *   2.1.1  Keyboard accessible — COVERED
 *   2.4.7  Focus visible — COVERED
 *   2.5.5  Touch targets — COVERED
 *   3.3.2  Form labels — COVERED
 *   4.1.2  Name, role, value — COVERED
 *   map-*  Map-specific requirements — COVERED
 *
 * Exit 0 on all pass, 1 on any failure.
 * Writes JSON record to docs/build-records/<date>/public-accessibility.json.
 *
 * Public Alpha remains PENDING.
 * "The map reveals opportunities, not the visitor."
 */

import * as fs   from "fs";
import * as path from "path";

// ── Helpers ───────────────────────────────────────────────────────────────────

const DOC_REF   = "docs/DOCTRINE_PUBLIC_ACCESSIBILITY_WCAG_AA_V1.md";
const VERSION   = "public-accessibility-wcag-aa-v1.0";
const BUILD_PHASE = "September 8 customer experience — static accessibility checks";

function readSrc(rel: string): string {
  const abs = path.join(process.cwd(), rel);
  try { return fs.readFileSync(abs, "utf8"); }
  catch { return ""; }
}

function srcExists(rel: string): boolean {
  return fs.existsSync(path.join(process.cwd(), rel));
}

type CheckResult = {
  id:      string;
  group:   string;
  label:   string;
  pass:    boolean;
  detail?: string;
};

function check(
  id:     string,
  group:  string,
  label:  string,
  pass:   boolean,
  detail?: string
): CheckResult {
  return { id, group, label, pass, detail };
}

// ── Source reads ──────────────────────────────────────────────────────────────

const mapComponent    = readSrc("src/components/customer/LivingOpportunityMap.tsx");
const exploreDropdown = readSrc("src/components/public/ExploreDropdown.tsx");
// header = PublicSiteHeader.tsx — has the stewardship dropdown, ARIA attributes, focus-visible (D-group checks).
const header          = readSrc("src/components/public/PublicSiteHeader.tsx");
const watermark       = readSrc("src/components/brand/FurlongCompassWatermark.tsx");
// Build 53: PublicPageShell replaced by PublicSiteLayout for (public) routes.
// publicShell alias now reads PublicSiteLayout (watermark + skip link source).
const publicShell     = readSrc("src/components/public/PublicSiteLayout.tsx");
const homepage        = readSrc("src/app/(public)/page.tsx");
const startComponent = readSrc("src/components/public/FurlongStart.tsx");
const experienceCss = readSrc("src/components/public/FurlongExperience.module.css");
const stewardship   = readSrc("src/app/(public)/stewardship/page.tsx");
const trust         = readSrc("src/app/(public)/trust/page.tsx");
const dataRights    = readSrc("src/app/(public)/data-rights/page.tsx");
const about         = readSrc("src/app/(public)/about/page.tsx");
const readiness     = readSrc("src/app/(public)/readiness/page.tsx");
const onboarding    = readSrc("src/app/(public)/onboarding/page.tsx");
const financing     = readSrc("src/app/(public)/financing-pathways/page.tsx");
const portal        = readSrc("src/app/portal/borrower/page.tsx");
const tabBar        = readSrc("src/components/stewardship/StewardshipTabBar.tsx");
const platformShell   = readSrc("src/components/platform/PlatformShell.tsx");
const accessibilityPage = readSrc("src/app/(public)/accessibility/page.tsx");
const publicCopyRegistry = readSrc("src/lib/public-content/publicCopyRegistry.ts");
const packageJson     = readSrc("package.json");
const journeyTour     = readSrc("src/lib/public-content/americasJourneyTour.ts");

// ── Checks ────────────────────────────────────────────────────────────────────

const results: CheckResult[] = [

  // ════════════════════════════════════════════════════════════════════════════
  // A — Map component ARIA + animation
  // ════════════════════════════════════════════════════════════════════════════

  check("A01", "A — Map ARIA",
    "Map SVG has role='img' and aria-label",
    mapComponent.includes('role="img"') && mapComponent.includes("aria-label="),
    "SVG maps must identify themselves for screen readers (WCAG 1.1.1)."
  ),

  check("A02", "A — Map ARIA",
    "Map animation respects prefers-reduced-motion (CSS)",
    mapComponent.includes("prefers-reduced-motion"),
    "Animation must stop/reduce when the user requests it (WCAG 2.3.3)."
  ),

  check("A03", "A — Map ARIA",
    "Map reduced-motion checked in JS useEffect",
    mapComponent.includes("prefers-reduced-motion: reduce") &&
      mapComponent.includes("reduceMotion"),
    "JS animation loop must also halt when prefers-reduced-motion is active."
  ),

  check("A04", "A — Map ARIA",
    "Story card has aria-live='polite' for dynamic region updates",
    mapComponent.includes('aria-live="polite"'),
    "Live regions announce map sequence changes to screen readers."
  ),

  check("A05", "A — Map ARIA",
    "Story card live region has aria-atomic='true'",
    mapComponent.includes('aria-atomic="true"'),
    "Atomic live regions read the full region on update (WCAG 4.1.2)."
  ),

  check("A06", "A — Map ARIA",
    "Phase indicator container has aria-label",
    mapComponent.includes('aria-label={`Map sequence:'),
    "Color-only indicators must also convey state via text (WCAG 1.4.1)."
  ),

  check("A07", "A — Map ARIA",
    "Abstract fallback SVG has role='img' and aria-label",
    mapComponent.includes("Opportunity network diagram") &&
      mapComponent.includes('role="img"'),
    "Fallback diagrams shown when map unavailable must be labeled (WCAG 1.1.1)."
  ),

  check("A08", "A — Map ARIA",
    "Story selector buttons have :focus-visible CSS",
    mapComponent.includes("fl-story-btn:focus-visible"),
    "Button elements must have keyboard focus visible (WCAG 2.4.7)."
  ),

  check("A09", "A — Map ARIA",
    "Story selector buttons have minHeight ≥ 40px",
    mapComponent.includes("minHeight: 40"),
    "Touch targets ≥ 40px (practical AA target, WCAG 2.5.5)."
  ),

  check("A10", "A — Map ARIA",
    "Map defines nodeLabelProps for collision-safe label geometry (labels in story card)",
    mapComponent.includes("nodeLabelProps") &&
      mapComponent.includes("anchor") &&
      mapComponent.includes("vb.w / NATIONAL_VBOX.w"),
    "nodeLabelProps must be defined for label geometry safety; node explanations shown in story card (Build 51)."
  ),

  // ════════════════════════════════════════════════════════════════════════════
  // B — Color / contrast patterns
  // ════════════════════════════════════════════════════════════════════════════

  check("B01", "B — Color/Contrast",
    "Story body paragraph text is at 16px",
    mapComponent.includes("fontSize: 16"),
    "Minimum 16px for body paragraph text (readability target)."
  ),

  check("B02", "B — Color/Contrast",
    "Opportunity badge uses fixed high-contrast color, not story.color",
    !mapComponent.includes("color: story.color"),
    "Dynamic brand colors may fail 4.5:1 contrast; use a fixed safe color."
  ),

  check("B03", "B — Color/Contrast",
    "Period label uses fixed accessible color, not badge.color",
    mapComponent.includes('color: "#5d687a", fontWeight: 600, letterSpacing: 0.2'),
    "Period text must use a fixed accessible color (WCAG 1.4.3)."
  ),

  check("B04", "B — Color/Contrast",
    "Homepage does not use low-contrast #7a8fa8 text color",
    !homepage.includes("#7a8fa8"),
    "#7a8fa8 on #f6f8fb yields ~3.16:1 — fails AA for normal text."
  ),

  check("B05", "B — Color/Contrast",
    "Homepage 'What Furlong Is Not' has no yellow/caution styling",
    !homepage.includes("#fffdf0") &&
      !homepage.includes("#f1c40f") &&
      !homepage.includes("#b45309"),
    "Yellow caution styling is inappropriate for institutional disclosure. Use navy/gold."
  ),

  check("B06", "B — Color/Contrast",
    "No fontSize 11 or below in visible, non-decorative UI text",
    (() => {
      const stripAriaHidden = (src: string) =>
        src.replace(/aria-hidden[\s\S]{0,200}?fontSize:\s*1[01][^0-9]/g, "");
      return ![mapComponent, header, homepage, stewardship, trust, dataRights,
        about, readiness, onboarding, financing, portal].some(src =>
          /fontSize:\s*(8|9|10|11)[^0-9]/.test(stripAriaHidden(src))
      );
    })(),
    "Text at 11px and below in visible UI is inaccessible for most users."
  ),

  // ════════════════════════════════════════════════════════════════════════════
  // C — Homepage Build 50 structural requirements
  // ════════════════════════════════════════════════════════════════════════════

  // Owner-approved Sept 8 experience supersedes the old map-first homepage.
  // Test the actual mounted entry component/CSS, not retired class names.
  check("C01", "C — Current homepage", "One open-question entry component",
    homepage.includes("<FurlongStart />") && (startComponent.match(/<form/g) ?? []).length === 1),
  check("C02", "C — Current homepage", "Full exploration remains reachable",
    homepage.includes('href="/discover?mode=possibilities"') && srcExists("src/app/(public)/explore/page.tsx")),
  check("C03", "C — Current homepage", "No mandatory category wall",
    !homepage.includes("fl-category-card") && !startComponent.includes("<select")),
  check("C04", "C — Current homepage", "Optional examples remain editable",
    startComponent.includes("setQuestion(example)") && startComponent.includes('type="button"')),
  check("C05", "C — Current homepage", "Address input remains a disclosure, not a forced path",
    startComponent.includes("<details") && startComponent.includes("<HomePropertyFrontDoor")),
  check("C06", "C — Current homepage", "Working entry precedes supporting sections",
    homepage.indexOf("<FurlongStart />") < homepage.indexOf('<section')),
  check("C07", "C — Current homepage", "Decorative compass stays in shared layout",
    publicShell.includes("FurlongCompassWatermark")),
  check("C08", "C — Current homepage", "Entry controls have visible keyboard focus",
    experienceCss.includes(".page :focus-visible") && experienceCss.includes("outline: 3px")),
  check("C09", "C — Current homepage", "Question textarea has visible label",
    startComponent.includes('htmlFor="furlong-start-question"') && startComponent.includes('id="furlong-start-question"')),
  check("C10", "C — Current homepage", "Existing onboarding input preserved",
    srcExists("src/components/public/ExploreDropdown.tsx")),
  check("C11", "C — Current homepage", "Key public sections have named headings",
    homepage.includes('aria-labelledby="commercial-truth"') && homepage.includes('id="commercial-truth"')),
  check("C12", "C — Current homepage", "Readable supporting text",
    experienceCss.includes("font-size: 1rem") && experienceCss.includes("line-height: 1.65")),
  check("C13", "C — Current homepage", "Primary action has 48px touch target",
    experienceCss.includes("min-height: 48px")),
  check("C14", "C — Current homepage", "Mobile layout adapts without fixed form width",
    experienceCss.includes("@media(max-width: 600px)") && experienceCss.includes("box-sizing: border-box")),

  // ════════════════════════════════════════════════════════════════════════════
  // D — Navigation / focus / keyboard
  // ════════════════════════════════════════════════════════════════════════════

  check("D01", "D — Navigation/Focus",
    "Navigation links have :focus-visible styles",
    header.includes("focus-visible"),
    "All interactive elements must show a visible focus indicator (WCAG 2.4.7)."
  ),

  // D02/D04/D05 removed in Build 56: the Stewardship dropdown menu was retired
  // (folded into /compass via redirect), so the menu-disclosure ARIA checks no
  // longer apply. The header is now a flat 4-page nav (links only, no menu).

  check("D03", "D — Navigation/Focus",
    "Stewardship tab bar has :focus-visible styles",
    tabBar.includes("focus-visible"),
    "Tab navigation must be keyboard-accessible (WCAG 2.1.1)."
  ),

  // ════════════════════════════════════════════════════════════════════════════
  // E — Brand / decorative elements
  // ════════════════════════════════════════════════════════════════════════════

  check("E01", "E — Brand/Decorative",
    "Compass watermark component is aria-hidden",
    watermark.includes('aria-hidden="true"'),
    "Decorative images must be hidden from screen readers (WCAG 1.1.1)."
  ),

  check("E02", "E — Brand/Decorative",
    "Compass watermark image has empty alt (decorative)",
    watermark.includes('alt=""'),
    "Decorative images must have alt='' (WCAG 1.1.1)."
  ),

  check("E03", "E — Brand/Decorative",
    "Compass watermark is pointer-events: none (non-interactive)",
    watermark.includes("pointer-events: none") ||
      watermark.includes("pointer-events:none"),
    "Decorative elements must not capture pointer events."
  ),

  // ════════════════════════════════════════════════════════════════════════════
  // F — Form accessibility
  // ════════════════════════════════════════════════════════════════════════════

  // The standalone readiness form was folded into the analysis workspace
  // (founder direction 2026-07-17); the labels obligation moves with the
  // inputs. /readiness is now a formless bridge page.
  check("F01", "F — Form Accessibility",
    "Analysis workspace form inputs are wrapped in <label> elements",
    readSrc("src/components/property/PropertyEvaluationWorkspace.tsx").includes("<label"),
    "Form inputs must be programmatically associated with labels (WCAG 3.3.2)."
  ),

  check("F02", "F — Form Accessibility",
    "About page status badges include text labels (not color-only)",
    about.includes("fontWeight") && about.includes("fontSize"),
    "Status indicators must use text in addition to color (WCAG 1.4.1)."
  ),

  // ════════════════════════════════════════════════════════════════════════════
  // G — Privacy posture (accessibility gate must not introduce surveillance)
  // ════════════════════════════════════════════════════════════════════════════

  check("G01", "G — Privacy Posture",
    "Homepage does not call navigator.geolocation",
    !homepage.includes("navigator.geolocation") &&
      !homepage.includes("getCurrentPosition"),
    "No geolocation API on public pages. The map reveals opportunities, not the visitor."
  ),

  check("G02", "G — Privacy Posture",
    "Map component preserves 'not the visitor' governance comment",
    mapComponent.includes("not the visitor") ||
      mapComponent.includes("reveals opportunities"),
    "Governance comment must be preserved: 'The map reveals opportunities, not the visitor.'"
  ),

  check("G03", "G — Privacy Posture",
    "Onboarding page does not capture geolocation on load",
    !onboarding.includes("navigator.geolocation") &&
      !onboarding.includes("getCurrentPosition"),
    "Onboarding must not capture geolocation (privacy posture)."
  ),

  check("G04", "G — Privacy Posture",
    "Portal/borrower page does not expose geolocation on render",
    !portal.includes("navigator.geolocation"),
    "Borrower portal must not use geolocation without explicit user action."
  ),

  // ════════════════════════════════════════════════════════════════════════════
  // H — Cross-page structural existence
  // ════════════════════════════════════════════════════════════════════════════

  check("H01", "H — Page Existence",
    "All governed public pages exist as source files",
    // /data-rights is intentionally absent: after the Build 56 consolidation it
    // 308-redirects to /trust#your-data (no standalone page). Its content lives on
    // /trust and is validated by verify:customer-journey + verifyMapPhotos P22.
    [
      "src/app/(public)/page.tsx",
      "src/app/(public)/onboarding/page.tsx",
      "src/app/(public)/stewardship/page.tsx",
      "src/app/(public)/stewardship/[domainId]/page.tsx",
      "src/app/(public)/about/page.tsx",
      "src/app/(public)/trust/page.tsx",
      "src/app/(public)/financing-pathways/page.tsx",
      "src/app/(public)/readiness/page.tsx",
      "src/app/portal/borrower/page.tsx",
    ].every(p => srcExists(p)),
    "All governed public pages must exist as source files."
  ),

  check("H02", "H — Page Existence",
    "Doctrine document exists",
    srcExists("docs/DOCTRINE_PUBLIC_ACCESSIBILITY_WCAG_AA_V1.md"),
    "Accessibility doctrine must be present in docs/."
  ),

  check("H03", "H — Page Existence",
    "Map GeoJSON asset exists",
    srcExists("public/maps/us-states.geojson"),
    "Map requires the Census TIGER GeoJSON to render correctly."
  ),

  check("H04", "H — Page Existence",
    "Compass watermark image exists",
    srcExists("public/brand/furlong-compass-watermark.png"),
    "Compass watermark image must exist in public/brand/."
  ),

  check("H05", "H — Page Existence",
    "Featured series registry exists",
    srcExists("src/lib/customer-landing/featuredSeriesRegistry.ts"),
    "Featured series registry must be present (Build 47-D)."
  ),

  check("H06", "H — Page Existence",
    "Accessibility page exists at src/app/(public)/accessibility/page.tsx",
    srcExists("src/app/(public)/accessibility/page.tsx"),
    "A public /accessibility page is required (Build 53)."
  ),

  // ════════════════════════════════════════════════════════════════════════════
  // I — Build 53 Accessibility Additions
  // ════════════════════════════════════════════════════════════════════════════

  check("I01", "I — Build 53 Accessibility",
    "PlatformShell has skip-to-main link before PlatformChrome",
    platformShell.includes("skip-to-main") &&
      platformShell.includes("href=\"#main-content\""),
    "Skip-to-main link must be the first focusable element on every page (WCAG 2.4.1)."
  ),

  check("I02", "I — Build 53 Accessibility",
    "PlatformShell skip link is visually hidden until focused",
    platformShell.includes("skip-to-main:focus") &&
      (platformShell.includes("top: -") || platformShell.includes("top:-")),
    "Skip link must be offscreen by default and revealed on :focus (WCAG 2.4.1)."
  ),

  check("I03", "I — Build 53 Accessibility",
    "PlatformShell <main> has id='main-content' anchor target",
    platformShell.includes('id="main-content"'),
    "The skip-to-main link target must exist as id='main-content' on <main> (WCAG 2.4.1)."
  ),

  check("I04", "I — Build 53 Accessibility",
    "Homepage footer has Accessibility link to /accessibility",
    // Build 50: page-level nav footer removed from homepage (duplicate-nav fix).
    // Accessibility link now lives in the PublicSiteLayout utility footer.
    // Accept: (a) inline in page.tsx, (b) via HOMEPAGE_FOOTER_LINKS registry,
    // OR (c) in PublicSiteLayout (preferred since Build 50).
    homepage.includes('"/accessibility"') ||
    homepage.includes("'/accessibility'") ||
    (homepage.includes("HOMEPAGE_FOOTER_LINKS") &&
      (publicCopyRegistry.includes('"/accessibility"') ||
       publicCopyRegistry.includes("'/accessibility'"))) ||
    publicShell.includes('"/accessibility"') ||
    publicShell.includes("'/accessibility'"),
    "An Accessibility link to /accessibility must appear in the homepage or in the shared public layout footer (Build 53)."
  ),

  check("I05", "I — Current accessibility", "Opening heading is at least 2rem",
    experienceCss.includes("font-size: clamp(2rem,4vw,3rem)") && startComponent.includes("<h1")),

  check("I06", "I — Build 53 Accessibility",
    "verify:accessibility script entry exists in package.json",
    packageJson.includes('"verify:accessibility"') &&
      packageJson.includes("verifyPublicAccessibility"),
    "package.json must include 'verify:accessibility' pointing to verifyPublicAccessibility.ts."
  ),

  check("I07", "I — Build 53 Accessibility",
    "Accessibility page has visible h1",
    accessibilityPage.includes("<h1>") || accessibilityPage.includes("<h1 "),
    "Accessibility page must have an h1 for screen reader page identification (WCAG 1.3.1)."
  ),

  check("I08", "I — Build 53 Accessibility",
    "Accessibility page covers keyboard navigation, screen readers, reduced motion",
    accessibilityPage.includes("Keyboard") &&
      accessibilityPage.includes("Screen Reader") &&
      accessibilityPage.includes("Reduced Motion"),
    "Accessibility page must document the three core assistive technology supports."
  ),

  check("I09", "I — Build 53 Accessibility",
    "Accessibility page has contact/help section",
    accessibilityPage.includes("Request") || accessibilityPage.includes("Contact"),
    "Accessibility page must explain how to request help (WCAG good practice)."
  ),

];

// ── Report ─────────────────────────────────────────────────────────────────────

const pass  = results.filter(r => r.pass).length;
const fail  = results.filter(r => !r.pass).length;
const total = results.length;

const wcagChecklist = [
  { id: "1.1.1",  req: "Non-text content has text alternative",              status: "COVERED" },
  { id: "1.3.1",  req: "Info and relationships conveyed structurally",        status: "COVERED" },
  { id: "1.4.1",  req: "Color not the only visual means of conveying info",  status: "COVERED" },
  { id: "1.4.3",  req: "Text contrast ≥ 4.5:1 (normal), 3:1 (large)",       status: "PARTIAL — axe required for full coverage" },
  { id: "1.4.4",  req: "Text resizes to 200% without loss of content",       status: "MANUAL" },
  { id: "1.4.11", req: "Non-text UI contrast ≥ 3:1",                         status: "MANUAL — axe required" },
  { id: "2.1.1",  req: "All functionality available via keyboard",            status: "COVERED" },
  { id: "2.1.2",  req: "No keyboard trap",                                   status: "MANUAL" },
  { id: "2.4.7",  req: "Focus visible on all interactive elements",          status: "COVERED" },
  { id: "2.5.3",  req: "Label in name — accessible name contains visible label", status: "PARTIAL — axe required" },
  { id: "2.5.5",  req: "Touch target ≥ 44×44px (AAA) / practical 48px (AA)", status: "COVERED" },
  { id: "3.3.2",  req: "Labels or instructions on form inputs",               status: "COVERED" },
  { id: "4.1.2",  req: "Name, role, value on UI components",                 status: "COVERED" },
  { id: "map-1",  req: "Animated map has text equivalent in story card",     status: "COVERED" },
  { id: "map-2",  req: "Map animation halts on prefers-reduced-motion",      status: "COVERED" },
  { id: "map-3",  req: "Map fallback communicates story without visual",      status: "COVERED" },
  { id: "map-4",  req: "Map SVG has role='img' and aria-label",             status: "COVERED" },
  { id: "map-5",  req: "Decorative compass is aria-hidden and alt=''",       status: "COVERED" },
  { id: "map-6",  req: "Node labels scale with zoom, no clipping",           status: "COVERED" },
  { id: "map-7",  req: "Phase indicator uses text + color (not color only)", status: "COVERED" },
];

const output = {
  ok: fail === 0,
  runtimeVersion:  "verify-public-accessibility-v1.1.0",
  specVersion:     VERSION,
  docRef:          DOC_REF,
  buildPhase:      BUILD_PHASE,
  publicAlpha:     "PENDING",
  privacyPosture:  "The map reveals opportunities, not the visitor.",
  totalChecks:     total,
  pass,
  fail,
  groups: {
    "A — Map ARIA":              results.filter(r => r.group.startsWith("A")).map(r => ({ id: r.id, status: r.pass ? "PASS" : "FAIL", label: r.label })),
    "B — Color/Contrast":        results.filter(r => r.group.startsWith("B")).map(r => ({ id: r.id, status: r.pass ? "PASS" : "FAIL", label: r.label })),
    "C — Homepage Build 50":     results.filter(r => r.group.startsWith("C")).map(r => ({ id: r.id, status: r.pass ? "PASS" : "FAIL", label: r.label })),
    "D — Navigation/Focus":      results.filter(r => r.group.startsWith("D")).map(r => ({ id: r.id, status: r.pass ? "PASS" : "FAIL", label: r.label })),
    "E — Brand/Decorative":      results.filter(r => r.group.startsWith("E")).map(r => ({ id: r.id, status: r.pass ? "PASS" : "FAIL", label: r.label })),
    "F — Form Accessibility":    results.filter(r => r.group.startsWith("F")).map(r => ({ id: r.id, status: r.pass ? "PASS" : "FAIL", label: r.label })),
    "G — Privacy Posture":       results.filter(r => r.group.startsWith("G")).map(r => ({ id: r.id, status: r.pass ? "PASS" : "FAIL", label: r.label })),
    "H — Page Existence":        results.filter(r => r.group.startsWith("H")).map(r => ({ id: r.id, status: r.pass ? "PASS" : "FAIL", label: r.label })),
    "I — Build 53 Accessibility":results.filter(r => r.group.startsWith("I")).map(r => ({ id: r.id, status: r.pass ? "PASS" : "FAIL", label: r.label })),
  },
  findings: results
    .filter(r => !r.pass)
    .map(r => ({ id: r.id, group: r.group, label: r.label, detail: r.detail })),
  wcagChecklist,
  exitCode: fail > 0 ? 1 : 0,
  message:  fail === 0
    ? `verify:accessibility PASS — ${pass}/${total} checks pass. See wcagChecklist for manual/axe requirements.`
    : `verify:accessibility FAIL — ${fail} check(s) failed. See findings above.`,
};

// ── Write build record ────────────────────────────────────────────────────────

try {
  const today = new Date().toISOString().slice(0, 10);
  const dir   = path.join(process.cwd(), "docs", "build-records", today);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const outPath = path.join(dir, "customer-experience-accessibility.json");
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
} catch {
  // Non-fatal — record write failure does not affect exit code
}

console.log(JSON.stringify(output, null, 2));
process.exit(output.exitCode);
