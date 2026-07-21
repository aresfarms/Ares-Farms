import fs from "fs";
import path from "path";

import { canonicalDomainRegistry } from "@/lib/platform/canonicalDomainRegistry";

const repoRoot = process.cwd();

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function main(): void {
  const keys = canonicalDomainRegistry.map((entry) => entry.key);
  const modules = canonicalDomainRegistry.map((entry) => entry.authorityModule);
  const idFields = canonicalDomainRegistry.map((entry) => entry.canonicalIdField);

  assert(new Set(keys).size === keys.length, "Canonical domain keys must be unique.");
  assert(new Set(modules).size === modules.length, "Each canonical domain must have one distinct authority module.");
  assert(new Set(idFields).size === idFields.length, "Canonical identifier fields must be unique.");

  for (const domain of canonicalDomainRegistry) {
    const authorityPath = path.join(repoRoot, domain.authorityModule);
    assert(fs.existsSync(authorityPath), `${domain.displayName} authority module is missing: ${domain.authorityModule}`);
    assert(domain.authorityExport.length > 0, `${domain.displayName} must declare an authority export.`);
    const authoritySource = fs.readFileSync(authorityPath, "utf8");
    assert(
      authoritySource.includes(domain.authorityExport),
      `${domain.displayName} authority export is missing: ${domain.authorityExport}`
    );
    assert(domain.governanceTags.length >= 3, `${domain.displayName} must carry at least three governance tags.`);
    assert(new Set(domain.governanceTags).size === domain.governanceTags.length, `${domain.displayName} governance tags must be unique.`);
    assert(domain.projectionRule.length >= 80, `${domain.displayName} projection rule is not sufficiently explicit.`);
  }

  console.log(JSON.stringify({
    ok: true,
    checkedAt: new Date().toISOString(),
    canonicalDomains: canonicalDomainRegistry.length,
    authorities: Object.fromEntries(canonicalDomainRegistry.map((entry) => [entry.key, entry.authorityModule])),
    message: "Canonical domain registry conformance passed.",
  }, null, 2));
}

main();
