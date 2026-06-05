import { execSync } from "node:child_process";

import { EXPLORATION_MODULE_REGISTRY } from "@/lib/exploration/explorationRegistry";
import {
  detectExplorationProhibitedClaim,
  ExplorationModule,
  REQUIRED_ALPHA_EXPLORATION_MODULE_IDS,
  UNIVERSAL_EXPLORATION_ENGINE_VERSION,
} from "@/lib/exploration/explorationTypes";

/**
 * verify:exploration-registry (Build 45)
 *
 * Fails closed if the Universal Exploration Engine registry violates the
 * customer-first contract: every required Alpha module present, both modes
 * supported, narrowing dimensions + first-value outputs present, no personal
 * info required before value, human review only after value, no prohibited
 * claims, environmental technical review held until a qualified reviewer, and
 * source families declared.
 */

type Finding = { code: string; moduleId: string; detail: string };

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

function customerFacingText(module: ExplorationModule): string[] {
  const out: string[] = [
    module.label,
    module.plainEnglishDescription,
    module.fullMapIntro,
    module.focusPrompt,
  ];
  for (const dim of module.narrowingDimensions) {
    out.push(dim.label, dim.prompt);
    for (const opt of dim.options) {
      out.push(opt.label, opt.plainEnglishDescription);
    }
  }
  for (const fv of module.firstValueOutputs) {
    out.push(fv.label, fv.description);
  }
  for (const hr of module.humanReviewRoutes) {
    out.push(hr.label);
  }
  return out;
}

function main() {
  const findings: Finding[] = [];
  const registry = EXPLORATION_MODULE_REGISTRY;
  const byId = new Map(registry.map((m) => [m.moduleId, m]));

  // 1. Every required Alpha module present.
  for (const requiredId of REQUIRED_ALPHA_EXPLORATION_MODULE_IDS) {
    if (!byId.has(requiredId)) {
      findings.push({
        code: "REQUIRED_MODULE_MISSING",
        moduleId: requiredId,
        detail: `Required Alpha exploration module "${requiredId}" is not registered.`,
      });
    }
  }

  for (const module of registry) {
    // 2. Full Map intro present.
    if (!module.fullMapIntro || module.fullMapIntro.trim().length === 0) {
      findings.push({
        code: "MISSING_FULL_MAP_INTRO",
        moduleId: module.moduleId,
        detail: "Module has no FULL_MAP intro.",
      });
    }
    // 3. Focus prompt present.
    if (!module.focusPrompt || module.focusPrompt.trim().length === 0) {
      findings.push({
        code: "MISSING_FOCUS_PROMPT",
        moduleId: module.moduleId,
        detail: "Module has no FOCUS_MY_EXPLORATION prompt.",
      });
    }
    // 4. Narrowing dimensions present.
    if (module.narrowingDimensions.length === 0) {
      findings.push({
        code: "NO_NARROWING_DIMENSIONS",
        moduleId: module.moduleId,
        detail: "Module declares no narrowing dimensions.",
      });
    } else if (
      module.narrowingDimensions.some((d) => d.options.length === 0)
    ) {
      findings.push({
        code: "DIMENSION_WITHOUT_OPTIONS",
        moduleId: module.moduleId,
        detail: "A narrowing dimension has no options.",
      });
    }
    // 5. First-value outputs present.
    if (module.firstValueOutputs.length === 0) {
      findings.push({
        code: "NO_FIRST_VALUE_OUTPUTS",
        moduleId: module.moduleId,
        detail: "Module declares no first-value outputs.",
      });
    }
    // 6. First value must not require personal info before value is shown.
    for (const fv of module.firstValueOutputs) {
      if (fv.requiresPersonalInfo) {
        findings.push({
          code: "FIRST_VALUE_REQUIRES_PERSONAL_INFO",
          moduleId: module.moduleId,
          detail: `First-value output "${fv.outputId}" requires personal info before value is shown.`,
        });
      }
      if (!fv.allowedInFreeExploration) {
        findings.push({
          code: "FIRST_VALUE_NOT_FREE",
          moduleId: module.moduleId,
          detail: `First-value output "${fv.outputId}" is not allowed in free exploration.`,
        });
      }
    }
    // 7. Human review only after value is shown.
    for (const hr of module.humanReviewRoutes) {
      if (!hr.triggerAfterValueShown) {
        findings.push({
          code: "HUMAN_REVIEW_BEFORE_VALUE",
          moduleId: module.moduleId,
          detail: `Human review route "${hr.routeId}" can appear before value is shown.`,
        });
      }
    }
    // 8. No prohibited claims in customer-facing copy.
    for (const text of customerFacingText(module)) {
      const hit = detectExplorationProhibitedClaim(text);
      if (hit) {
        findings.push({
          code: "PROHIBITED_CLAIM",
          moduleId: module.moduleId,
          detail: `Prohibited claim "${hit}" in customer-facing copy: "${text.slice(0, 80)}".`,
        });
      }
    }
    // 9. Environmental technical review must be held until a qualified reviewer.
    if (module.moduleId === "environmental-compliance") {
      const technical = module.humanReviewRoutes.filter(
        (r) => r.specialistDomain === "ENVIRONMENTAL_COMPLIANCE"
      );
      if (technical.length === 0) {
        findings.push({
          code: "ENV_TECHNICAL_REVIEW_MISSING",
          moduleId: module.moduleId,
          detail:
            "environmental-compliance must declare an environmental technical review route (held for Alpha).",
        });
      }
      for (const route of technical) {
        if (route.heldForAlpha !== true) {
          findings.push({
            code: "ENV_TECHNICAL_REVIEW_NOT_HELD",
            moduleId: module.moduleId,
            detail: `Environmental technical review route "${route.routeId}" activates without a qualified-reviewer hold (heldForAlpha must be true).`,
          });
        }
      }
    }
    // 10. Source families declared.
    if (module.sourceFamilies.length === 0) {
      findings.push({
        code: "MISSING_SOURCE_FAMILIES",
        moduleId: module.moduleId,
        detail: "Module declares no source families.",
      });
    }
  }

  const exitCode = findings.length > 0 ? 1 : 0;
  const commit = safeExec("git rev-parse HEAD", "unknown");
  const branch = safeExec("git rev-parse --abbrev-ref HEAD", "main");

  console.log(
    JSON.stringify(
      {
        ok: exitCode === 0,
        engineVersion: UNIVERSAL_EXPLORATION_ENGINE_VERSION,
        commit,
        branch,
        registeredModuleCount: registry.length,
        requiredModuleCount: REQUIRED_ALPHA_EXPLORATION_MODULE_IDS.length,
        findingCount: findings.length,
        findings,
        exitCode,
        message:
          exitCode === 0
            ? "verify:exploration-registry PASS — every Alpha exploration module supports Full Map + Focus, shows value before any personal info, gates human review behind value, holds environmental technical review for a qualified reviewer, declares source families, and carries no prohibited claims."
            : "verify:exploration-registry FAIL — see findings.",
      },
      null,
      2
    )
  );

  process.exit(exitCode);
}

main();
