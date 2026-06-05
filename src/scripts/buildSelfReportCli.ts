import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  composeBuildSelfReport,
  renderBuildSelfReportMarkdown,
} from "@/lib/build-self-report/buildSelfReportRuntime";

/**
 * Build Self-Report CLI
 *
 * Generates docs/build-records/<YYYY-MM-DD>/build-self-report.json
 * and build-self-report.md. Exits non-zero if the gate fails.
 */

function safeExec(command: string, fallback: string): string {
  try {
    return execSync(command, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
  } catch {
    return fallback;
  }
}

function main() {
  // `--check` (CI mode): compose against the identical live state but skip
  // the timestamped build-record writes, so the gate's exit condition can
  // be enforced on every PR. Still exits result.header.exit_code.
  const checkMode = process.argv.includes("--check");
  const commit = safeExec("git rev-parse HEAD", "unknown");
  const branch = safeExec("git rev-parse --abbrev-ref HEAD", "main");
  const status = safeExec("git status --porcelain", "");
  const treeStatus = status.length === 0 ? "clean" : "dirty";

  const result = composeBuildSelfReport({
    commit,
    branch,
    treeStatus: treeStatus as "clean" | "dirty",
  });

  const today = new Date().toISOString().slice(0, 10);
  const outDir = path.join("docs", "build-records", today);
  const jsonPath = path.join(outDir, "build-self-report.json");
  const mdPath = path.join(outDir, "build-self-report.md");
  if (!checkMode) {
    mkdirSync(outDir, { recursive: true });
    writeFileSync(jsonPath, JSON.stringify(result, null, 2) + "\n", "utf8");
    writeFileSync(mdPath, renderBuildSelfReportMarkdown(result), "utf8");
  }

  console.log(
    JSON.stringify(
      {
        ok: result.header.exit_code === 0,
        runtimeVersion: result.runtimeVersion,
        specVersion: result.specVersion,
        checkpoint: result.header.checkpoint,
        commit: result.header.commit,
        modulesAudited: result.summary.modulesAudited,
        modulesPass: result.summary.modulesPass,
        modulesPassWithWarnings: result.summary.modulesPassWithWarnings,
        modulesFail: result.summary.modulesFail,
        modulesBlockedByDesign: result.summary.modulesBlockedByDesign,
        orphansNoConsumer: result.summary.orphansNoConsumer,
        orphansNoProducer: result.summary.orphansNoProducer,
        orphansDangling: result.summary.orphansDangling,
        danglingEventContracts: result.summary.danglingEventContracts,
        liveFetchEnabled: result.header.live_fetch_enabled,
        auditChainIntact: result.header.audit_chain_intact,
        findingCount: result.summary.findingCount,
        crossSourceConflictCount: result.summary.crossSourceConflictCount,
        classificationRegistryParsed:
          result.summary.classificationRegistryParsed,
        classificationChangesActive: result.summary.classificationChangesActive,
        classificationChangesHistorical:
          result.summary.classificationChangesHistorical,
        activeClassificationChanges:
          result.classificationChangeRegistry.activeEntries.map((e) => ({
            id: e.id,
            title: e.title,
            previousState: e.previousState,
            newState: e.newState,
            status: e.status,
          })),
        exitCode: result.header.exit_code,
        checkMode,
        jsonPath: checkMode ? "(--check: build-record not written)" : jsonPath,
        mdPath: checkMode ? "(--check: build-record not written)" : mdPath,
        message:
          result.header.exit_code === 0
            ? "Build Self-Report PASS."
            : "Build Self-Report FAIL — review findings and conflicts.",
      },
      null,
      2
    )
  );

  process.exit(result.header.exit_code);
}

main();
