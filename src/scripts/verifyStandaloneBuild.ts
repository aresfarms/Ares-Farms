/**
 * verify:standalone-build — the DEFINITIVE carve-out proof for one divestible
 * unit (DIVEST-001 part 2). Default target: source-intelligence.
 *
 * "Can we actually sell this module off?" Three checks:
 *   1. CLOSURE   — the unit's transitive source closure reaches ONLY its own
 *                  files + the core/shared backbone + node_modules. Any edge into
 *                  ANOTHER divestible unit is named exactly (that is what blocks a
 *                  clean carve-out).
 *   2. CARVE-OUT — buildCarveOutManifest() produces a non-empty export +
 *                  run-alone manifest.
 *   3. ISOLATED BUILD — tsc --noEmit over a tsconfig that includes ONLY the
 *                  unit's own directories (tsc follows imports into the core
 *                  contract + node_modules). A clean compile = the unit's entry
 *                  code builds when you start from only its files.
 *
 * Exit 0 only if the unit is self-contained, has a carve-out kit, and compiles.
 * On failure it reports exactly what is missing.
 */

import { spawnSync } from "node:child_process";
import { writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";

import { UNIT_DIRS, unitImportClosure, type UnitId } from "../lib/divestiture/importGraph";
import { buildCarveOutManifest, divestibleUnitById } from "../lib/divestiture/divestibleUnits";

const TARGET = (process.argv[2] as Exclude<UnitId, "core">) ?? "source-intelligence";
const ROOT = process.cwd();
const fail: string[] = [];
const note = (m: string) => fail.push(m);

if (!UNIT_DIRS[TARGET]) {
  console.error(`verify:standalone-build — unknown unit "${TARGET}". Known: ${Object.keys(UNIT_DIRS).join(", ")}`);
  process.exit(1);
}

// ── 1. CLOSURE: reaches only own + core + node_modules ───────────────────────
const { reaches, foreignEdges } = unitImportClosure(TARGET);
for (const e of foreignEdges) {
  note(`CLOSURE: "${e.fromFile}" reaches ${e.toUnit} ("${e.specifier}") — a foreign-unit dependency that blocks a clean carve-out.`);
}

// ── 2. CARVE-OUT manifest ────────────────────────────────────────────────────
if (!divestibleUnitById(TARGET)) note(`CARVE-OUT: "${TARGET}" is not a designated unit.`);
const kit = divestibleUnitById(TARGET) ? buildCarveOutManifest(TARGET) : null;
if (kit) {
  if (kit.modules.length === 0) note("CARVE-OUT: kit names no modules.");
  if (kit.dataExport.ownedDataStores.length === 0) note("CARVE-OUT: kit has no owned data stores to export.");
  if (kit.runAlone.services.length === 0 || kit.runAlone.config.length === 0) note("CARVE-OUT: run-alone manifest missing services/config.");
}

// ── 3. ISOLATED BUILD: tsc over only the unit's own directories ──────────────
const tmp = join(ROOT, `tsconfig.standalone.${TARGET}.json`);
let isolatedBuild = "skipped";
try {
  writeFileSync(
    tmp,
    JSON.stringify(
      {
        extends: "./tsconfig.json",
        compilerOptions: { noEmit: true },
        include: UNIT_DIRS[TARGET].map((d) => `${d}**/*.ts`).concat(UNIT_DIRS[TARGET].map((d) => `${d}**/*.tsx`)),
      },
      null,
      2,
    ),
  );
  const r = spawnSync("npx", ["tsc", "--noEmit", "-p", tmp], { cwd: ROOT, encoding: "utf8" });
  if (r.status === 0) {
    isolatedBuild = "PASS";
  } else {
    isolatedBuild = "FAIL";
    const out = ((r.stdout || "") + (r.stderr || "")).trim().split("\n").slice(0, 12).join("\n");
    note(`ISOLATED BUILD: tsc over ${TARGET}'s own directories failed:\n${out}`);
  }
} finally {
  rmSync(tmp, { force: true });
}

// ── Report ───────────────────────────────────────────────────────────────────
console.log(`verify:standalone-build — unit "${TARGET}"`);
console.log(`  closure reaches: ${JSON.stringify(reaches)}`);
console.log(`  foreign-unit edges: ${foreignEdges.length}`);
console.log(`  carve-out kit: ${kit ? `${kit.modules.length} modules, ${kit.dataExport.ownedDataStores.length} owned stores` : "none"}`);
console.log(`  isolated tsc build: ${isolatedBuild}`);

if (fail.length) {
  console.error(`\n✗  verify:standalone-build FAIL — ${fail.length} issue(s) for "${TARGET}":`);
  for (const f of fail) console.error(`    ✗ ${f}`);
  process.exit(1);
}
console.log(
  `\n✓  verify:standalone-build PASS — "${TARGET}" is self-contained (reaches only its own code + core backbone + node_modules), produces a carve-out kit, and compiles in isolation. It can be carved out and built alone.`,
);
process.exit(0);
