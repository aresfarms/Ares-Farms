import { spawnSync } from "node:child_process";

type RunResult = Readonly<{
  status: number | null;
  stdout: string;
  stderr: string;
}>;

function run(args: string[]): RunResult {
  const result = spawnSync("npx", [
    "tsx",
    "src/scripts/runWithGcpSecrets.ts",
    ...args,
  ], {
    cwd: process.cwd(),
    encoding: "utf8",
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.error) throw result.error;
  return {
    status: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
  };
}

const selected = run([
  "--plan",
  "--secret=EIA_API_KEY",
  "--",
  "node",
  "--version",
]);
if (selected.status !== 0) throw new Error(selected.stderr || selected.stdout);
const report = JSON.parse(selected.stdout) as {
  mode?: string;
  injectedSecretNames?: string[];
  valuesDisplayed?: boolean;
};
if (report.mode !== "PLAN_ONLY") throw new Error("Plan mode was not reported.");
if (JSON.stringify(report.injectedSecretNames) !== JSON.stringify(["EIA_API_KEY"])) {
  throw new Error("The runner did not preserve the explicit one-secret allowlist.");
}
if (report.valuesDisplayed !== false) throw new Error("Plan must affirm valuesDisplayed=false.");

const missing = run(["--plan", "--", "node", "--version"]);
if (missing.status === 0 || !missing.stderr.includes("Refusing to inject every governed secret")) {
  throw new Error("The runner did not fail closed when no secret allowlist was supplied.");
}

const unknown = run([
  "--plan",
  "--secret=NOT_A_GOVERNED_SECRET",
  "--",
  "node",
  "--version",
]);
if (unknown.status === 0 || !unknown.stderr.includes("Unknown governed secret name")) {
  throw new Error("The runner did not reject an unknown secret name.");
}

console.log(JSON.stringify({
  ok: true,
  explicitAllowlistRequired: true,
  allSecretInjectionRefused: true,
  unknownSecretNamesRefused: true,
  valuesDisplayed: false,
}, null, 2));
