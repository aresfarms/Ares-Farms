/**
 * DIVEST-001 — real source-level import-graph analysis.
 *
 * The registry/manifest gate proves the DECLARED graph is clean. THIS proves the
 * ACTUAL source is clean: it scans every source file's import statements and
 * FAILS if a file belonging to one DIVESTIBLE unit imports a file belonging to a
 * DIFFERENT divestible unit (a hidden cross-unit internal import — real coupling
 * a registry can't see). Imports of the shared/core backbone or node_modules are
 * allowed (that is the shared substrate, reached by contract).
 *
 * Unit membership is by directory: only the clearly unit-specific directories
 * belong to a divestible unit; everything else is shared/core. (The codebase is
 * organized by type, not by unit, so most files are shared core.)
 *
 * Build-time only (reads the filesystem). Not imported by any runtime surface.
 */

import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, dirname, resolve, relative } from "node:path";

export type UnitId =
  | "source-intelligence"
  | "financing-intelligence"
  | "lender-sponsor-surfaces"
  | "borrower-experience"
  | "core"; // shared backbone (non-divestible) — the allowed shared substrate

/** Directory prefixes (repo-relative) that belong EXCLUSIVELY to a divestible unit. */
export const UNIT_DIRS: Record<Exclude<UnitId, "core">, string[]> = {
  "source-intelligence": [
    "src/lib/property/",
    "src/components/property/",
    "src/lib/source-intelligence/",
  ],
  "financing-intelligence": [
    "src/lib/capital-graph/",
    "src/lib/revenue-intelligence/",
    "src/lib/program-graph/",
    "src/lib/providers/",
    "src/app/(public)/providers/",
    "src/app/api/public/program-match/",
  ],
  "lender-sponsor-surfaces": [
    "src/app/lender/",
    "src/app/sponsor/",
  ],
  "borrower-experience": [
    "src/app/portal/borrower/",
    "src/lib/borrower-experience/",
    "src/app/api/public/anon-token/",
  ],
};

const DIVESTIBLE: Exclude<UnitId, "core">[] = [
  "source-intelligence",
  "financing-intelligence",
  "lender-sponsor-surfaces",
  "borrower-experience",
];

/** Which unit a repo-relative path belongs to (longest-prefix match), else core. */
export function unitOfPath(relPath: string): UnitId {
  const p = relPath.replace(/\\/g, "/");
  let best: UnitId = "core";
  let bestLen = 0;
  for (const unit of DIVESTIBLE) {
    for (const pre of UNIT_DIRS[unit]) {
      if (p.startsWith(pre) && pre.length > bestLen) {
        best = unit;
        bestLen = pre.length;
      }
    }
  }
  return best;
}

function walk(dir: string, out: string[]): void {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".next" || name === ".git") continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(name) && !/\.d\.ts$/.test(name)) out.push(full);
  }
}

/**
 * Extract every import/require specifier from a source file. Uses FOUR focused
 * patterns rather than one combined regex: a single combined pattern with an
 * optional "… from" clause silently swallows a bare `import "x";` into the next
 * statement and drops it (the bug an earlier version had). These four are
 * unambiguous and catch static imports/exports, bare side-effect imports,
 * dynamic import(), and require().
 */
function extractSpecifiers(src: string): string[] {
  const specs = new Set<string>();
  const patterns = [
    /\bfrom\s+["']([^"']+)["']/g,        // import/export … from "x"
    /\bimport\s+["']([^"']+)["']/g,       // bare: import "x"
    /\bimport\s*\(\s*["']([^"']+)["']/g,  // dynamic: import("x")
    /\brequire\(\s*["']([^"']+)["']/g,    // require("x")
  ];
  for (const re of patterns) {
    let m: RegExpExecArray | null;
    re.lastIndex = 0;
    while ((m = re.exec(src))) specs.add(m[1]);
  }
  return [...specs];
}

/** Resolve an import specifier to a repo-relative source path, or null (bare/node_modules/asset). */
function resolveSpecifier(root: string, fromFile: string, spec: string): string | null {
  let target: string;
  if (spec.startsWith("@/")) target = join(root, "src", spec.slice(2));
  else if (spec.startsWith("./") || spec.startsWith("../")) target = resolve(dirname(fromFile), spec);
  else return null; // bare specifier → node_modules (shared substrate) — allowed
  // resolve to an actual .ts/.tsx file (or index)
  const cands = [
    target,
    `${target}.ts`,
    `${target}.tsx`,
    join(target, "index.ts"),
    join(target, "index.tsx"),
  ];
  for (const c of cands) {
    if (existsSync(c) && statSync(c).isFile()) return relative(root, c).replace(/\\/g, "/");
  }
  // Unresolved (e.g. .json, .css, generated) — return repo-relative best guess for classification.
  return relative(root, target).replace(/\\/g, "/");
}

export interface CrossUnitImport {
  fromFile: string;
  fromUnit: UnitId;
  toFile: string;
  toUnit: UnitId;
  specifier: string;
}

/**
 * Scan the source tree and return every import edge where a DIVESTIBLE unit's
 * file imports a DIFFERENT divestible unit's file. (Imports into core/shared or
 * node_modules are allowed and not returned.)
 */
export function findCrossUnitImports(root: string = process.cwd()): CrossUnitImport[] {
  const files: string[] = [];
  walk(join(root, "src"), files);
  const violations: CrossUnitImport[] = [];
  for (const file of files) {
    const relFrom = relative(root, file).replace(/\\/g, "/");
    const fromUnit = unitOfPath(relFrom);
    if (fromUnit === "core") continue; // core importing anything is not a divestible-unit cross-import
    const src = readFileSync(file, "utf8");
    for (const spec of extractSpecifiers(src)) {
      const relTo = resolveSpecifier(root, file, spec);
      if (!relTo) continue;
      const toUnit = unitOfPath(relTo);
      if (toUnit !== "core" && toUnit !== fromUnit) {
        violations.push({ fromFile: relFrom, fromUnit, toFile: relTo, toUnit, specifier: spec });
      }
    }
  }
  return violations;
}

/**
 * The transitive source closure of a unit's own directories — every file it
 * imports, recursively. Used by the standalone-build analysis to prove a unit's
 * code only reaches its own files + shared/core + node_modules (i.e. it could be
 * carved out and built alone).
 */
export function unitImportClosure(
  unit: Exclude<UnitId, "core">,
  root: string = process.cwd(),
): { reaches: Record<UnitId, number>; foreignEdges: CrossUnitImport[] } {
  const all: string[] = [];
  walk(join(root, "src"), all);
  const seed = all.filter((f) => unitOfPath(relative(root, f).replace(/\\/g, "/")) === unit);
  const seen = new Set<string>();
  const queue = [...seed];
  const reaches: Record<UnitId, number> = {
    "source-intelligence": 0, "financing-intelligence": 0,
    "lender-sponsor-surfaces": 0, "borrower-experience": 0, core: 0,
  };
  const foreignEdges: CrossUnitImport[] = [];
  while (queue.length) {
    const file = queue.shift()!;
    const relFrom = relative(root, file).replace(/\\/g, "/");
    if (seen.has(relFrom)) continue;
    seen.add(relFrom);
    if (!existsSync(file) || !/\.(ts|tsx)$/.test(file)) continue;
    const src = readFileSync(file, "utf8");
    for (const spec of extractSpecifiers(src)) {
      const relTo = resolveSpecifier(root, file, spec);
      if (!relTo) continue;
      const toUnit = unitOfPath(relTo);
      reaches[toUnit] += 1;
      if (toUnit !== "core" && toUnit !== unit) {
        foreignEdges.push({ fromFile: relFrom, fromUnit: unit, toFile: relTo, toUnit, specifier: spec });
      }
      const abs = join(root, relTo);
      if (!seen.has(relTo) && existsSync(abs)) queue.push(abs);
    }
  }
  return { reaches, foreignEdges };
}
