import { readFile } from "node:fs/promises";
import path from "node:path";

import {
  EXPLORATION_CATEGORIES,
  explorationHref,
} from "@/lib/customer-landing/featuredExplorationStories";
import { REPORT_LOGO_PATH } from "@/lib/reports/reportBranding";

const REPO_ROOT = process.cwd();

type CheckResult = {
  label: string;
  ok: boolean;
  detail: string;
};

async function load(relativePath: string): Promise<string> {
  return readFile(path.join(REPO_ROOT, relativePath), "utf8");
}

function check(ok: boolean, label: string, detail: string): CheckResult {
  return { ok, label, detail };
}

async function main() {
  const homepage = await load("src/app/page.tsx");
  const onboarding = await load("src/app/onboarding/page.tsx");
  const logoComponent = await load("src/components/brand/FurlongLogo.tsx");
  const publicHeader = await load("src/components/public/PublicSiteHeader.tsx");
  const journeyShell = await load("src/components/exploration/ExplorationJourneyShell.tsx");

  const uniqueSlugs = new Set(EXPLORATION_CATEGORIES.map((category) => category.slug));
  const requiredHomepageTokens = [
    "Explore the full map",
    "How Furlong Works",
    "What Furlong Does Not Do",
  ];
  const requiredOnboardingTokens = [
    "Full Map vs Focus My Exploration",
    "Focus My Exploration",
    "Continue to human-reviewed intake",
  ];

  const results: CheckResult[] = [
    check(
      EXPLORATION_CATEGORIES.length === 8,
      "eight-categories",
      `registered ${EXPLORATION_CATEGORIES.length} categories`
    ),
    check(
      uniqueSlugs.size === EXPLORATION_CATEGORIES.length,
      "unique-category-slugs",
      `found ${uniqueSlugs.size} unique slugs`
    ),
    check(
      EXPLORATION_CATEGORIES.every(
        (category) => explorationHref(category.slug) === `/onboarding?explore=${encodeURIComponent(category.slug)}`
      ),
      "category-routes",
      "all categories route into the onboarding exploration surface"
    ),
    check(
      requiredHomepageTokens.every((token) => homepage.includes(token)),
      "homepage-sections",
      "homepage includes hero CTA and the Build 44/45 trust sections"
    ),
    check(
      requiredOnboardingTokens.every((token) => onboarding.includes(token)),
      "onboarding-modes",
      "onboarding exposes Full Map and Focus My Exploration"
    ),
    check(
      onboarding.includes("EXPLORATION_CATEGORIES.map") &&
        onboarding.includes("category.label") &&
        onboarding.includes("category.blurb"),
      "onboarding-category-registry",
      "all eight exploration categories render on the onboarding surface"
    ),
    check(
      logoComponent.includes('const LOGO_SRC = "/brand/furlong-logo.png"'),
      "logo-png-primary",
      "FurlongLogo prefers the official PNG asset"
    ),
    check(
      publicHeader.includes('<FurlongLogo size="header" href="/" />'),
      "public-header-logo",
      "public header renders the Furlong logo"
    ),
    check(
      journeyShell.includes('<FurlongLogo size="compact" href="/" />'),
      "journey-shell-logo",
      "journey shell renders the compact Furlong logo"
    ),
    check(
      REPORT_LOGO_PATH === "/brand/furlong-logo.png",
      "report-branding-logo",
      `report branding logo path is ${REPORT_LOGO_PATH}`
    ),
  ];

  const findings = results.filter((result) => !result.ok);
  const payload = {
    ok: findings.length === 0,
    runtimeVersion: "exploration-registry-runtime-v0.1.0",
    categoryCount: EXPLORATION_CATEGORIES.length,
    findings,
    checks: results,
    message:
      findings.length === 0
        ? "verify:exploration-registry PASS — homepage, onboarding modes, category registry, and logo surfaces are aligned."
        : "verify:exploration-registry FAIL — see findings.",
  };

  console.log(JSON.stringify(payload, null, 2));
  process.exit(findings.length === 0 ? 0 : 1);
}

void main();
