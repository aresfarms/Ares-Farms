import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";

import { canonicalDomainRegistry } from "@/lib/platform/canonicalDomainRegistry";

const repoRoot = process.cwd();
const probePath = path.join(repoRoot, "src", "__canonical_domain_fail_closed_probe.ts");

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function runVerifier() {
  return spawnSync("npm", ["run", "verify:canonical-domain"], {
    cwd: repoRoot,
    encoding: "utf8",
    env: process.env,
  });
}

function main(): void {
  const restricted = canonicalDomainRegistry.flatMap((domain) =>
    (domain.restrictedImplementationModules ?? []).map((modulePath) => ({
      domain: domain.displayName,
      modulePath,
    }))
  );

  assert(restricted.length > 0, "Fail-closed proof cannot run without restricted implementation modules.");
  let rejected = 0;
  try {
    for (const probe of restricted) {
      fs.writeFileSync(probePath, `import "${probe.modulePath}";\n`, {
        encoding: "utf8",
        flag: "wx",
        mode: 0o600,
      });
      const result = runVerifier();
      const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
      assert(result.status !== 0, `${probe.domain} probe passed unexpectedly: ${probe.modulePath}`);
      assert(
        output.includes("must only be imported by its canonical authority") && output.includes(probe.modulePath),
        `${probe.domain} probe failed for an unrelated reason: ${probe.modulePath}\n${output}`
      );
      rejected += 1;
      fs.unlinkSync(probePath);
    }
  } finally {
    if (fs.existsSync(probePath)) fs.unlinkSync(probePath);
  }

  assert(rejected === restricted.length, `Expected ${restricted.length} rejected probes, received ${rejected}.`);
  const baseline = runVerifier();
  assert(
    baseline.status === 0,
    `Canonical verifier did not recover after probe cleanup.\n${baseline.stdout ?? ""}\n${baseline.stderr ?? ""}`
  );

  console.log(JSON.stringify({
    ok: true,
    restrictedModulesProbed: restricted.length,
    rejectedProbes: rejected,
    message: "Canonical domain fail-closed proof passed without a vacuous success.",
  }, null, 2));
}

main();
