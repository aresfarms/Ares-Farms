import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  HUMAN_AUTHORITY_REGISTRY_DOC_REF,
  HUMAN_AUTHORITY_REGISTRY_RUNTIME_VERSION,
  HUMAN_AUTHORITY_REGISTRY_SPEC_VERSION,
  composeHumanAuthorityRegistry,
} from "@/lib/human-authority/humanAuthorityRegistryRuntime";

/**
 * Module 45 — Human Authority Registry CLI
 *
 * Generates docs/build-records/<YYYY-MM-DD>/human-authority-registry.json
 * and exits non-zero if the §6 gate fails:
 *   - 100% coverage of clearable actions
 *   - zero ai_permitted = true
 *   - zero self-clear paths
 *   - every alpha_required module's role is filled
 */

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
  const commit = safeExec("git rev-parse HEAD", "unknown");
  const branch = safeExec("git rev-parse --abbrev-ref HEAD", "main");

  const result = composeHumanAuthorityRegistry({
    reviewerRole: "Chief Governance Authority",
    // No filled-role roster is supplied here. The Alpha-required
    // gate will FAIL until access control records role fills.
    // That is the correct posture for Build 36: the runtime is
    // shipped; the operational state (filled roles) is recorded
    // outside the code repository.
    metadata: { commit, branch, source: "human-authority-registry-cli" },
  });

  const today = new Date().toISOString().slice(0, 10);
  const outDir = path.join("docs", "build-records", today);
  mkdirSync(outDir, { recursive: true });
  const jsonPath = path.join(outDir, "human-authority-registry.json");
  writeFileSync(jsonPath, JSON.stringify(result, null, 2) + "\n", "utf8");

  console.log(
    JSON.stringify(
      {
        ok: result.exitCode === 0,
        runtimeVersion: HUMAN_AUTHORITY_REGISTRY_RUNTIME_VERSION,
        specVersion: HUMAN_AUTHORITY_REGISTRY_SPEC_VERSION,
        docRef: HUMAN_AUTHORITY_REGISTRY_DOC_REF,
        commit,
        branch,
        bindingCount: result.summary.bindingCount,
        rolesDeclared: result.summary.rolesDeclared,
        rolesFilled: result.summary.rolesFilled,
        modulesAudited: result.summary.modulesAudited,
        modulesAlphaRequired: result.summary.modulesAlphaRequired,
        modulesIntentionallyHeld: result.summary.modulesIntentionallyHeld,
        modulesInternalSupport: result.summary.modulesInternalSupport,
        modulesAuthorityPass: result.summary.modulesAuthorityPass,
        modulesAuthorityFail: result.summary.modulesAuthorityFail,
        modulesAuthorityWarn: result.summary.modulesAuthorityWarn,
        modulesAuthorityNA: result.summary.modulesAuthorityNA,
        coverageMissingCount: result.summary.coverageMissingCount,
        findingCount: result.summary.findingCount,
        crossSourceConflictCount: result.summary.crossSourceConflictCount,
        v1OverallReadinessPercent: result.summary.v1OverallReadinessPercent,
        exitCode: result.exitCode,
        jsonPath,
        message:
          result.exitCode === 0
            ? "Human Authority Registry PASS — every clearable action has a binding, zero ai_permitted, zero self-clear, every alpha_required role filled."
            : "Human Authority Registry FAIL — see findings (alpha_required roles unfilled, or coverage / no-AI / self-clear violation).",
      },
      null,
      2
    )
  );

  process.exit(result.exitCode);
}

main();
