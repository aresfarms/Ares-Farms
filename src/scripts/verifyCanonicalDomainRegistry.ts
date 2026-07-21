import fs from "fs";
import path from "path";

import { canonicalDomainRegistry } from "@/lib/platform/canonicalDomainRegistry";

const repoRoot = process.cwd();
const authorityRoot = "src/lib/platform/authorities/";
const authorityBarrelPath = path.join(repoRoot, authorityRoot, "index.ts");

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function sourceFiles(root: string): string[] {
  return fs.readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = path.join(root, entry.name);
    if (entry.isDirectory()) return sourceFiles(absolutePath);
    return /\.(?:ts|tsx)$/.test(entry.name) ? [absolutePath] : [];
  });
}

function importedModules(source: string): string[] {
  const modules: string[] = [];
  const pattern = /(?:import|export)\s+(?:type\s+)?(?:[\s\S]*?\s+from\s+)?["']([^"']+)["']/g;
  for (const match of source.matchAll(pattern)) modules.push(match[1]);
  return modules;
}

function main(): void {
  const keys = canonicalDomainRegistry.map((entry) => entry.key);
  const modules = canonicalDomainRegistry.map((entry) => entry.authorityModule);
  const idFields = canonicalDomainRegistry.map((entry) => entry.canonicalIdField);

  assert(new Set(keys).size === keys.length, "Canonical domain keys must be unique.");
  assert(new Set(modules).size === modules.length, "Each canonical domain must have one distinct authority module.");
  assert(new Set(idFields).size === idFields.length, "Canonical identifier fields must be unique.");

  const authorityBarrelSource = fs.readFileSync(authorityBarrelPath, "utf8");

  for (const domain of canonicalDomainRegistry) {
    assert(
      domain.authorityModule.startsWith(authorityRoot) && domain.authorityModule !== `${authorityRoot}index.ts`,
      `${domain.displayName} must resolve through a dedicated canonical authority boundary.`
    );
    const authorityPath = path.join(repoRoot, domain.authorityModule);
    assert(fs.existsSync(authorityPath), `${domain.displayName} authority module is missing: ${domain.authorityModule}`);
    assert(domain.authorityExport.length > 0, `${domain.displayName} must declare an authority export.`);
    const authoritySource = fs.readFileSync(authorityPath, "utf8");
    assert(
      authoritySource.includes(`export const ${domain.authorityExport}`),
      `${domain.displayName} authority contract is missing: ${domain.authorityExport}`
    );
    assert(
      authorityBarrelSource.includes(domain.authorityExport),
      `${domain.displayName} authority contract is not exposed by the canonical authority barrel.`
    );
    assert(domain.governanceTags.length >= 3, `${domain.displayName} must carry at least three governance tags.`);
    assert(new Set(domain.governanceTags).size === domain.governanceTags.length, `${domain.displayName} governance tags must be unique.`);
    assert(domain.projectionRule.length >= 80, `${domain.displayName} projection rule is not sufficiently explicit.`);

    for (const restrictedModule of domain.restrictedImplementationModules ?? []) {
      const violations = sourceFiles(path.join(repoRoot, "src"))
        .filter((filePath) => path.relative(repoRoot, filePath) !== domain.authorityModule)
        .filter((filePath) => importedModules(fs.readFileSync(filePath, "utf8")).includes(restrictedModule))
        .map((filePath) => path.relative(repoRoot, filePath));
      assert(
        violations.length === 0,
        `${domain.displayName} implementation module must only be imported by its canonical authority: ${restrictedModule}\n${violations.join("\n")}`
      );
    }
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
