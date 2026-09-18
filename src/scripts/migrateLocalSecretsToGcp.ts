import { execFileSync } from "node:child_process";
import { chmodSync, existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";

import {
  externalSecretInventory,
  governedLocalSecretNames,
  type GovernedLocalSecretName,
} from "@/lib/security/externalSecretInventory";

const execute = process.argv.includes("--execute");
const removeLocal = process.argv.includes("--remove-local");
const projectArgument = process.argv.find((argument) => argument.startsWith("--project="));
const envArgument = process.argv.find((argument) => argument.startsWith("--env-file="));
const secretArguments = process.argv
  .filter((argument) => argument.startsWith("--secret="))
  .map((argument) => argument.slice("--secret=".length));
const project = projectArgument?.slice("--project=".length) || externalSecretInventory.gcpProjectId;
const envPath = envArgument?.slice("--env-file=".length) || join(process.cwd(), ".env");
const selectedNames = secretArguments.length > 0
  ? governedLocalSecretNames.filter((name) => secretArguments.includes(name))
  : governedLocalSecretNames;

const unknownSecretArguments = secretArguments.filter(
  (name) => !governedLocalSecretNames.includes(name as GovernedLocalSecretName)
);
if (unknownSecretArguments.length > 0) {
  throw new Error(`Unknown governed secret name(s): ${unknownSecretArguments.join(", ")}`);
}

function parseAssignments(source: string): Map<GovernedLocalSecretName, string> {
  const assignments = new Map<GovernedLocalSecretName, string>();
  const governed = new Set<string>(governedLocalSecretNames);
  for (const line of source.split(/\r?\n/)) {
    const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match || !governed.has(match[1])) continue;
    const name = match[1] as GovernedLocalSecretName;
    if (assignments.has(name)) throw new Error(`Duplicate governed secret assignment: ${name}`);
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!value || value.includes("\n") || value.includes("\r")) {
      throw new Error(`Governed secret must be a non-empty single-line value: ${name}`);
    }
    assignments.set(name, value);
  }
  return assignments;
}

function gcloud(args: string[], input?: string): string {
  return execFileSync("gcloud", args, {
    cwd: process.cwd(),
    encoding: "utf8",
    input,
    maxBuffer: 1024 * 1024,
    stdio: [input === undefined ? "ignore" : "pipe", "pipe", "pipe"],
  }).trim();
}

function secretExists(name: string): boolean {
  try {
    gcloud(["secrets", "describe", name, "--project", project, "--format=value(name)"]);
    return true;
  } catch {
    return false;
  }
}

function removeAssignments(source: string, names: ReadonlySet<string>): string {
  const retained = source.split(/\r?\n/).filter((line) => {
    const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=/);
    return !match || !names.has(match[1]);
  });
  return `${retained.join("\n").replace(/\n+$/, "")}\n`;
}

if (!existsSync(envPath)) throw new Error(`Environment file does not exist: ${basename(envPath)}`);
const source = readFileSync(envPath, "utf8");
const assignments = parseAssignments(source);
const foundNames = selectedNames.filter((name) => assignments.has(name));
const missingNames = selectedNames.filter((name) => !assignments.has(name));

if (!execute) {
  console.log(JSON.stringify({
    ok: missingNames.length === 0,
    mode: "PLAN_ONLY",
    project,
    envFile: basename(envPath),
    foundSecretNames: foundNames,
    missingSecretNames: missingNames,
    valuesDisplayed: false,
    removeLocalAfterVerifiedUpload: removeLocal,
  }, null, 2));
  process.exit(missingNames.length === 0 ? 0 : 2);
}

if (missingNames.length > 0) {
  throw new Error(`Refusing partial migration; missing governed secrets: ${missingNames.join(", ")}`);
}

const migrated: string[] = [];
for (const name of selectedNames) {
  if (!secretExists(name)) {
    gcloud([
      "secrets", "create", name,
      "--project", project,
      "--replication-policy=automatic",
      "--labels=environment=staging,managed_by=furlong,classification=restricted",
    ]);
  }
  gcloud([
    "secrets", "versions", "add", name,
    "--project", project,
    "--data-file=-",
  ], assignments.get(name));
  const state = gcloud([
    "secrets", "versions", "describe", "latest",
    "--secret", name,
    "--project", project,
    "--format=value(state)",
  ]);
  if (state !== "ENABLED") throw new Error(`Uploaded secret version is not enabled: ${name}`);
  migrated.push(name);
}

if (removeLocal) {
  const tempPath = join(dirname(envPath), `.${basename(envPath)}.secret-migration.tmp`);
  writeFileSync(tempPath, removeAssignments(source, new Set(selectedNames)), {
    encoding: "utf8",
    flag: "wx",
    mode: 0o600,
  });
  chmodSync(tempPath, 0o600);
  renameSync(tempPath, envPath);
}

console.log(JSON.stringify({
  ok: true,
  mode: "EXECUTED",
  project,
  migratedSecretNames: migrated,
  valuesDisplayed: false,
  localAssignmentsRemoved: removeLocal,
  rotationStatus: "PENDING_RECORDED_ROTATION_EVIDENCE",
}, null, 2));
