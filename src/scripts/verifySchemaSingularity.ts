import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

/**
 * Schema Singularity Verification
 *
 * Master Volume Governance:
 * - Vol I: Enforces one constitutional schema authority.
 * - Vol III: Prevents duplicate backend schema definitions.
 * - Vol IV: Supports operational preflight checks before backend promotion.
 * - Vol V: Protects canonical source, replay, versioning, and auditability.
 *
 * Purpose:
 * This script fails if Drizzle table definitions are added outside the
 * canonical schema spine at `src/db/schema/`.
 */

type Violation = {
  file: string;
  message: string;
};

const repoRoot = process.cwd();
const sourceRoot = path.join(repoRoot, "src");
const canonicalSchemaDir = path.join(repoRoot, "src", "db", "schema");
const canonicalSchemaBarrel = path.join(canonicalSchemaDir, "index.ts");

const requiredCanonicalModules = [
  "./applicationDocuments",
  "./applications",
  "./auditEvents",
  "./borrowerNoticeDeliveries",
  "./borrowerNoticeDeliveryReceipts",
  "./borrowerNoticeExceptionResolutions",
  "./canonicalLedger",
  "./canonicalLedgerMeta",
  "./certifiedConnectorAdapters",
  "./dataClassificationRegistry",
  "./entitlements",
  "./externalDataConnectors",
  "./observabilityEvents",
  "./pipeline",
  "./regulatedDecisionNotices",
  "./replayVerification",
  "./reviewTransitionControls",
  "./reviewWorkflows",
  "./ruleOverlayRegistry",
  "./schemaRegistry",
  "./versionRegistry",
];

const tableDefinitionPattern =
  /export\s+const\s+\w+\s*=\s*pgTable\s*\(\s*["']/;

function toDisplayPath(filePath: string): string {
  return path.relative(repoRoot, filePath);
}

function isTypeScriptFile(filePath: string): boolean {
  return filePath.endsWith(".ts") || filePath.endsWith(".tsx");
}

function isInsideCanonicalSchemaDir(filePath: string): boolean {
  const relative = path.relative(canonicalSchemaDir, filePath);

  return Boolean(
    relative &&
      !relative.startsWith("..") &&
      !path.isAbsolute(relative)
  );
}

async function collectSourceFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory);
  const files: string[] = [];

  for (const entry of entries) {
    const entryPath = path.join(directory, entry);
    const entryStat = await stat(entryPath);

    if (entryStat.isDirectory()) {
      files.push(...(await collectSourceFiles(entryPath)));
      continue;
    }

    if (entryStat.isFile() && isTypeScriptFile(entryPath)) {
      files.push(entryPath);
    }
  }

  return files;
}

async function verifyNoExternalTableDefinitions(
  files: string[]
): Promise<Violation[]> {
  const violations: Violation[] = [];

  for (const file of files) {
    const content = await readFile(file, "utf8");

    if (!tableDefinitionPattern.test(content)) {
      continue;
    }

    if (isInsideCanonicalSchemaDir(file)) {
      continue;
    }

    violations.push({
      file: toDisplayPath(file),
      message:
        "Drizzle table definitions must live under src/db/schema/ only.",
    });
  }

  return violations;
}

async function verifyNoPlaceholderSchemaExports(): Promise<Violation[]> {
  const files = await collectSourceFiles(canonicalSchemaDir);
  const violations: Violation[] = [];
  const placeholderPattern = /export\s+const\s+\w+\s*=\s*\{\s*\}\s*;/;

  for (const file of files) {
    const content = await readFile(file, "utf8");

    if (placeholderPattern.test(content)) {
      violations.push({
        file: toDisplayPath(file),
        message:
          "Canonical schema modules may not export empty placeholder objects.",
      });
    }
  }

  return violations;
}

async function verifyRequiredBarrelExports(): Promise<Violation[]> {
  const content = await readFile(canonicalSchemaBarrel, "utf8");
  const missingModules = requiredCanonicalModules.filter((modulePath) => {
    return (
      !content.includes(`from "${modulePath}"`) &&
      !content.includes(`from '${modulePath}'`)
    );
  });

  if (missingModules.length === 0) {
    return [];
  }

  return [
    {
      file: toDisplayPath(canonicalSchemaBarrel),
      message: `Missing canonical schema module exports: ${missingModules.join(
        ", "
      )}.`,
    },
  ];
}

async function main(): Promise<void> {
  const sourceFiles = await collectSourceFiles(sourceRoot);
  const violations = [
    ...(await verifyNoExternalTableDefinitions(sourceFiles)),
    ...(await verifyNoPlaceholderSchemaExports()),
    ...(await verifyRequiredBarrelExports()),
  ];

  if (violations.length > 0) {
    console.error("Schema singularity verification failed.");

    for (const violation of violations) {
      console.error(`- ${violation.file}: ${violation.message}`);
    }

    process.exit(1);
  }

  console.log(
    "Schema singularity verified: all table definitions are under src/db/schema/."
  );
}

main().catch((error: unknown) => {
  console.error(
    error instanceof Error
      ? error.message
      : "Unknown schema singularity verification error."
  );
  process.exit(1);
});
