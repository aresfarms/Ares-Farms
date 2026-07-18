/**
 * verify:brief-copy — customer-surface copy gate for the Place Brief redesign
 * (founder-approved memo + refinements, 2026-07-16).
 *
 * Master Volume Governance:
 * - Vol II (fair housing / non-discrimination): customer surfaces use
 *   distances, sources, and official directories ONLY — no neighborhood
 *   "vibe", no safety implication, no family-targeted persuasion, no
 *   demographic steering.
 * - Redesign voice rules: no internal/system language on customer surfaces —
 *   no engine talk, no unexplained scores, no spec text about what the page
 *   "should" do, no raw record internals.
 *
 * Scans the customer-facing Place Brief surfaces for banned patterns and
 * exits non-zero with file:line evidence. Add new customer surfaces to
 * SCANNED_FILES as they are built.
 */

import { readFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

const SCANNED_FILES = [
  "src/lib/property/propertyBriefIntelligence.ts",
  "src/lib/property/chartThemes.ts",
  "src/components/property/ChartTableBrief.tsx",
  "src/components/property/OwnershipCostPanel.tsx",
  "src/lib/property/ownershipCostModel.ts",
  "src/lib/property/financingProgramsCurated.ts",
  "src/lib/property/farmMarginsCurated.ts",
  "src/lib/property/farmLaneCurated.ts",
  "src/lib/property/similarNearbyProperties.ts",
  "src/lib/property/propertyProfile.ts",
  "src/components/property/PropertyResultCard.tsx",
  "src/lib/property/townCharacterCurated.ts",
  "src/lib/property/stateNarrativeCurated.ts",
  "src/lib/property/broadbandLookup.ts",
  "src/lib/newsletter/newsletterSignals.ts",
  "src/lib/newsletter/newsletterEditions.ts",
  "src/lib/newsletter/newsletterDispatch.ts",
  "src/lib/newsletter/farmEditorialCurated.ts",
  "src/components/property/PropertyPlaceIntelligence.tsx",
  "src/components/property/PropertyEvaluationWorkspace.tsx",
  "src/components/property/PropertyImportLaunchpad.tsx",
  "src/components/property/PropertyHub.tsx",
  "src/components/discovery/PlaceFirstDiscovery.tsx",
  "src/app/(public)/explore/page.tsx",
  "src/app/(public)/compass/page.tsx",
  "src/app/(public)/financing-pathways/page.tsx",
  "src/app/(public)/readiness/page.tsx",
  "src/app/portal/property-discovery/page.tsx",
  "src/app/portal/borrower/environmental-intake/page.tsx",
];

interface Rule {
  name: string;
  pattern: RegExp;
  why: string;
}

const FAIR_HOUSING_RULES: Rule[] = [
  { name: "family-targeted persuasion", pattern: /family[- ]friendly|great for famil|perfect for famil|kid[- ]friendly/i, why: "familial-status steering — use amenity distances instead" },
  { name: "safety implication", pattern: /safe neighborhood|safe area|low[- ]crime|high[- ]crime|crime[- ](?:free|ridden)|dangerous (?:area|neighborhood)/i, why: "safety characterization — link official sources, never characterize" },
  { name: "school quality rating", pattern: /good schools|great schools|best schools|top[- ]rated school|excellent school/i, why: "school ratings are steering proxies — list directory facts only" },
  { name: "neighborhood vibe", pattern: /desirable (?:neighborhood|area)|up[- ]and[- ]coming|nice (?:neighborhood|area)|quiet neighbor|charming neighborhood|vibrant (?:neighborhood|community)/i, why: "vibe characterization — distances and counts only" },
  { name: "demographic steering", pattern: /demographic|kind of people|type of people|ethnic|racial makeup/i, why: "no statements about who lives somewhere" },
];

const VOICE_RULES: Rule[] = [
  { name: "unexplained score", pattern: /% relative fit|relative fit\b/i, why: "no score without a source — use readiness language" },
  { name: "investor diction", pattern: /kill[- ]point/i, why: "buyer-facing pages say 'watch this first'" },
  { name: "engine talk", pattern: /governed pathway engine|live-screen framework/i, why: "customers never hear about engines" },
  { name: "raw record internals", pattern: /Source record reference/i, why: "humanize record identifiers" },
  { name: "spec text leak", pattern: /should (?:surface|open by screening)|the page below is now meant|part that should answer/i, why: "sentences about the page do not belong on the page" },
  { name: "testing-state leak", pattern: /[Pp]review mode is currently/, why: "internal testing state is not customer copy" },
];

function main(): void {
  console.log("\n━━━ verify:brief-copy ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  const violations: string[] = [];

  for (const rel of SCANNED_FILES) {
    let source: string;
    try {
      source = readFileSync(path.join(ROOT, rel), "utf8");
    } catch {
      violations.push(`${rel}: file listed in SCANNED_FILES but not readable`);
      continue;
    }
    const lines = source.split("\n");
    for (const rule of [...FAIR_HOUSING_RULES, ...VOICE_RULES]) {
      lines.forEach((line, index) => {
        if (!rule.pattern.test(line)) return;
        // The rule tables themselves live in this scanner, not in scanned
        // files — but allow scanned files to *name* a rule in comments.
        if (/^\s*(?:\/\/|\/?\*)/.test(line)) return;
        violations.push(`${rel}:${index + 1} [${rule.name}] ${rule.why}\n    ${line.trim().slice(0, 140)}`);
      });
    }
  }

  if (violations.length > 0) {
    console.error(`\n✗ verify:brief-copy FAIL — ${violations.length} violation(s):\n`);
    for (const violation of violations) console.error(`  ${violation}`);
    console.error("");
    process.exit(1);
  }
  console.log(`  scanned ${SCANNED_FILES.length} customer-surface files · fair-housing + voice rules`);
  console.log("✓ verify:brief-copy PASS\n");
}

main();
