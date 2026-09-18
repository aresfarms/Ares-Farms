import { execFileSync, spawnSync } from "node:child_process";

import {
  externalSecretInventory,
  governedLocalSecretNames,
  type GovernedLocalSecretName,
} from "@/lib/security/externalSecretInventory";

const separator = process.argv.indexOf("--");
if (separator < 0 || separator === process.argv.length - 1) {
  throw new Error(
    "Usage: npm run with:staging-secrets -- --secret=NAME [--secret=NAME] -- <command> [args...]"
  );
}

const optionArguments = process.argv.slice(2, separator);
const planOnly = optionArguments.includes("--plan");
const requestedNames = optionArguments
  .filter((argument) => argument.startsWith("--secret="))
  .map((argument) => argument.slice("--secret=".length));
const unsupportedArguments = optionArguments.filter(
  (argument) => argument !== "--plan" && !argument.startsWith("--secret=")
);
const unknownNames = requestedNames.filter(
  (name) => !governedLocalSecretNames.includes(name as GovernedLocalSecretName)
);

if (unsupportedArguments.length > 0) {
  throw new Error(`Unsupported option(s): ${unsupportedArguments.join(", ")}`);
}
if (requestedNames.length === 0) {
  throw new Error("Refusing to inject every governed secret; select at least one --secret=NAME.");
}
if (unknownNames.length > 0) {
  throw new Error(`Unknown governed secret name(s): ${unknownNames.join(", ")}`);
}
if (new Set(requestedNames).size !== requestedNames.length) {
  throw new Error("Duplicate --secret selection is not allowed.");
}

const [command, ...args] = process.argv.slice(separator + 1);
if (planOnly) {
  console.log(JSON.stringify({
    ok: true,
    mode: "PLAN_ONLY",
    project: externalSecretInventory.gcpProjectId,
    injectedSecretNames: requestedNames,
    command,
    valuesDisplayed: false,
  }, null, 2));
  process.exit(0);
}

const injected: Record<string, string> = {};
for (const name of requestedNames as GovernedLocalSecretName[]) {
  injected[name] = execFileSync("gcloud", [
    "secrets", "versions", "access", "latest",
    "--secret", name,
    "--project", externalSecretInventory.gcpProjectId,
  ], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    maxBuffer: 1024 * 1024,
  }).trim();
}

const child = spawnSync(command, args, {
  cwd: process.cwd(),
  env: { ...process.env, ...injected },
  stdio: "inherit",
});
if (child.error) throw child.error;
process.exitCode = child.status ?? 1;
