import { execSync } from "node:child_process";

import {
  detectStewardshipViolation,
  FURLONG_STEWARDSHIP_VERSION,
  STEWARDSHIP_DOCTRINE_RULES,
  STEWARDSHIP_DOMAINS,
  STEWARDSHIP_INTRO,
  STEWARDSHIP_REVIEW_BY_EXPLORATION_MODULE,
  stewardshipDomainById,
} from "@/lib/stewardship/stewardshipRegistry";

/**
 * verify:stewardship (Build 44-A)
 *
 * Fails closed if the stewardship integration violates its contract:
 * required domains present, stewardship-language titles, domains persist
 * independently of individuals (route derived from domainId, not steward),
 * required exploration→domain review mappings present and valid, environmental
 * technical review held for Alpha, and no forbidden-title / sales / approval /
 * guarantee language in customer-facing copy.
 */

type Finding = { code: string; domainId: string; detail: string };

const REQUIRED_DOMAIN_IDS = [
  "financing-capital",
  "environmental-compliance",
  "communications-public-trust",
];

const REQUIRED_REVIEW_MAPPINGS: Record<string, string[]> = {
  "property-land": ["financing-capital", "environmental-compliance"],
  "small-business-growth": ["financing-capital", "communications-public-trust"],
  "environmental-compliance": ["environmental-compliance"],
};

function safeExec(command: string, fallback: string): string {
  try {
    return execSync(command, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();
  } catch {
    return fallback;
  }
}

function main() {
  const findings: Finding[] = [];
  const byId = new Map(STEWARDSHIP_DOMAINS.map((d) => [d.domainId, d]));

  // Required domains present.
  for (const id of REQUIRED_DOMAIN_IDS) {
    if (!byId.has(id)) {
      findings.push({
        code: "REQUIRED_DOMAIN_MISSING",
        domainId: id,
        detail: `Required stewardship domain "${id}" is not registered.`,
      });
    }
  }

  for (const domain of STEWARDSHIP_DOMAINS) {
    // Shape.
    if (!domain.domainName || domain.domainName.trim().length === 0) {
      findings.push({ code: "MISSING_DOMAIN_NAME", domainId: domain.domainId, detail: "Missing domainName." });
    }
    if (!domain.stewardTitle.startsWith("Steward of ")) {
      findings.push({
        code: "NON_STEWARDSHIP_TITLE",
        domainId: domain.domainId,
        detail: `Title must use stewardship language ("Steward of …"); got "${domain.stewardTitle}".`,
      });
    }
    if (!domain.currentSteward || domain.currentSteward.trim().length === 0) {
      findings.push({ code: "MISSING_CURRENT_STEWARD", domainId: domain.domainId, detail: "Missing currentSteward." });
    }
    if (!domain.description || domain.description.trim().length === 0) {
      findings.push({ code: "MISSING_DESCRIPTION", domainId: domain.domainId, detail: "Missing description." });
    }
    // Domains persist independently of individuals: route derives from domainId.
    if (domain.profileRoute !== `/stewardship/${domain.domainId}`) {
      findings.push({
        code: "ROUTE_NOT_DOMAIN_DERIVED",
        domainId: domain.domainId,
        detail: `profileRoute must be /stewardship/<domainId> so it persists independently of the steward; got "${domain.profileRoute}".`,
      });
    }
    if (domain.helpsIlluminate.length === 0) {
      findings.push({ code: "NO_HELPS_ILLUMINATE", domainId: domain.domainId, detail: "No helpsIlluminate entries." });
    }
    if (domain.questionsExplored.length === 0) {
      findings.push({ code: "NO_QUESTIONS_EXPLORED", domainId: domain.domainId, detail: "No questionsExplored entries." });
    }
    if (domain.whenHumanReviewAppropriate.length === 0) {
      findings.push({ code: "NO_HUMAN_REVIEW_GUIDANCE", domainId: domain.domainId, detail: "No whenHumanReviewAppropriate entries." });
    }

    // No forbidden-title / sales / approval / guarantee language.
    const texts = [
      domain.domainName,
      domain.stewardTitle,
      domain.description,
      ...domain.helpsIlluminate,
      ...domain.questionsExplored,
      ...domain.whenHumanReviewAppropriate,
      domain.heldForAlphaNote ?? "",
    ];
    for (const text of texts) {
      const hit = detectStewardshipViolation(text);
      if (hit) {
        findings.push({
          code: "STEWARDSHIP_LANGUAGE_VIOLATION",
          domainId: domain.domainId,
          detail: `${hit} in: "${text.slice(0, 80)}".`,
        });
      }
    }
  }

  // Environmental technical review must remain held for Alpha.
  const env = stewardshipDomainById("environmental-compliance");
  if (env && (!env.heldForAlphaNote || env.heldForAlphaNote.trim().length === 0)) {
    findings.push({
      code: "ENV_TECHNICAL_REVIEW_NOT_HELD",
      domainId: "environmental-compliance",
      detail: "environmental-compliance must note that technical environmental review remains held for Alpha.",
    });
  }

  // Shared stewardship copy (intro + doctrine) carries no violations.
  for (const text of [...STEWARDSHIP_INTRO, ...STEWARDSHIP_DOCTRINE_RULES]) {
    const hit = detectStewardshipViolation(text);
    if (hit) {
      findings.push({ code: "SHARED_COPY_VIOLATION", domainId: "(shared)", detail: `${hit} in: "${text.slice(0, 80)}".` });
    }
  }

  // Exploration→domain review mappings: valid domainIds + required examples.
  for (const [moduleId, ids] of Object.entries(
    STEWARDSHIP_REVIEW_BY_EXPLORATION_MODULE
  )) {
    for (const id of ids) {
      if (!byId.has(id)) {
        findings.push({
          code: "REVIEW_MAPPING_UNKNOWN_DOMAIN",
          domainId: id,
          detail: `Exploration module "${moduleId}" maps to unknown stewardship domain "${id}".`,
        });
      }
    }
  }
  for (const [moduleId, expected] of Object.entries(REQUIRED_REVIEW_MAPPINGS)) {
    const actual = STEWARDSHIP_REVIEW_BY_EXPLORATION_MODULE[moduleId] ?? [];
    for (const id of expected) {
      if (!actual.includes(id)) {
        findings.push({
          code: "REVIEW_MAPPING_MISSING",
          domainId: id,
          detail: `Exploration module "${moduleId}" must offer stewardship domain "${id}".`,
        });
      }
    }
  }

  const exitCode = findings.length > 0 ? 1 : 0;
  console.log(
    JSON.stringify(
      {
        ok: exitCode === 0,
        version: FURLONG_STEWARDSHIP_VERSION,
        commit: safeExec("git rev-parse HEAD", "unknown"),
        branch: safeExec("git rev-parse --abbrev-ref HEAD", "main"),
        domainCount: STEWARDSHIP_DOMAINS.length,
        findingCount: findings.length,
        findings,
        exitCode,
        message:
          exitCode === 0
            ? "verify:stewardship PASS — stewardship domains persist independently of individuals, use stewardship language, route to review, hold environmental technical review for a qualified reviewer, and carry no forbidden-title / sales / approval language."
            : "verify:stewardship FAIL — see findings.",
      },
      null,
      2
    )
  );
  process.exit(exitCode);
}

main();
