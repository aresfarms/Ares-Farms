import { execFileSync, spawnSync } from "node:child_process";

import {
  externalSecretInventory,
  governedLocalSecretNames,
} from "@/lib/security/externalSecretInventory";

const separator = process.argv.indexOf("--");
if (separator < 0 || separator === process.argv.length - 1) {
  throw new Error("Usage: npm run with:staging-secrets -- <command> [args...]");
}

const [command, ...args] = process.argv.slice(separator + 1);
const injected: Record<string, string> = {};
for (const name of governedLocalSecretNames) {
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
