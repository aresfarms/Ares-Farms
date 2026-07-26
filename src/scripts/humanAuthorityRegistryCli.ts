import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  HUMAN_AUTHORITY_REGISTRY_DOC_REF,
  HUMAN_AUTHORITY_REGISTRY_RUNTIME_VERSION,
  HUMAN_AUTHORITY_REGISTRY_SPEC_VERSION,
  composeHumanAuthorityRegistry,
} from "@/lib/human-authority/humanAuthorityRegistryRuntime";
import { loadOperationalAnnexFilledRoles } from "@/lib/human-authority/operationalAnnexRoleFills";

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
  // `--check` (CI mode): run the identical live-state audit but skip the
  // timestamped build-record write, so the gate can be enforced on every
  // PR without committing dated artifacts. Still exits result.exitCode.
  const checkMode = process.argv.includes("--check");
  const commit = safeExec("git rev-parse HEAD", "unknown");
  const branch = safeExec("git rev-parse --abbrev-ref HEAD", "main");

  // Load the Vol VII Operational Annex if present. The Annex records
  // the 7 Active-Fill Vol VI-A authorities (Caitlin / Stuart / Frances)
  // + their mappings to Module 45 roles + the External + Unfilled-by-
  // Design assignments. If the Annex is missing the gate falls back to
  // the no-fills baseline.
  const filledRoles = loadOperationalAnnexFilledRoles();
  const result = composeHumanAuthorityRegistry({
    reviewerRole: "Chief Governance Authority",
    filledRoles,
    metadata: {
      commit,
      branch,
      source: "human-authority-registry-cli",
      annexLoaded: filledRoles.length > 0,
      annexFilledRoleCount: filledRoles.length,
    },
  });

  const today = new Date().toISOString().slice(0, 10);
  const outDir = path.join("docs", "build-records", today);
  const jsonPath = path.join(outDir, "human-authority-registry.json");
  if (!checkMode) {
    mkdirSync(outDir, { recursive: true });
    writeFileSync(jsonPath, JSON.stringify(result, null, 2) + "\n", "utf8");
  }

  console.log(
    JSON.stringify(
      {
        ok: result.exitCode === 0,
        runtimeVersion: HUMAN_AUTHORITY_REGISTRY_RUNTIME_VERSION,
        specVersion: HUMAN_AUTHORITY_REGISTRY_SPEC_VERSION,
        docRef: HUMAN_AUTHORITY_REGISTRY_DOC_REF,
        commit,
        branch,
        annexLoaded: filledRoles.length > 0,
        annexFilledRoleCount: filledRoles.length,
        annexAttribution: filledRoles.map((r) => ({
          roleId: r.roleId,
          recordedBy: r.recordedBy,
        })),
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
        checkMode,
        jsonPath: checkMode ? "(--check: build-record not written)" : jsonPath,
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
