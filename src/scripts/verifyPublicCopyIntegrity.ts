/**
 * verifyPublicCopyIntegrity — Build 53
 *
 * Scans public-facing source files for banned phrases and fails the build
 * if any are found. Run via:
 *
 *   npm run verify:public-copy-integrity
 *
 * Governance:
 *   This gate enforces that stale, internal, or superseded copy does not
 *   reach a rendered public surface. Banned phrases and rationale are
 *   declared in publicCopyRegistry.ts (BANNED_PUBLIC_PHRASES). File scope
 *   is limited to the (public) route group and its direct component/lib
 *   dependencies — internal portal and backend files are excluded.
 *
 * Exit codes:
 *   0 — all checks pass
 *   1 — one or more banned phrases found; details printed to stdout
 *
 * Public Alpha remains PENDING.
 * "The map reveals opportunities, not the visitor."
 */

import * as fs from "fs";
import * as path from "path";

import { BANNED_PUBLIC_PHRASES } from "@/lib/public-content/publicCopyRegistry";

// ── File scope ────────────────────────────────────────────────────────────────

/**
 * Directories to scan for banned public copy.
 * These paths are relative to the project root.
 *
 * Rule: include only source that can be reached from the (public) route group
 * layout and its component/lib imports.  Internal platform, portal, and
 * backend modules are excluded — they may legitimately contain some of these
 * strings in non-rendered contexts (e.g. governance comments, admin labels).
 */
const PUBLIC_SCAN_ROOTS = [
  "src/app/(public)",
  "src/components/public",
  "src/components/brand",
  "src/components/customer",
  "src/components/narration",
  "src/components/story",
  "src/components/exploration",
  "src/components/stewardship",
  "src/lib/public-content",
  "src/lib/customer-landing",
  "src/lib/narration",
  "src/lib/trust",
  "src/lib/stewardship",
] as const;

/**
 * File extensions to scan within the above directories.
 */
const SCAN_EXTENSIONS = new Set([".ts", ".tsx"]);

/**
 * Files or subdirectory segments to skip even when found under a scan root.
 * Use sparingly — prefer fixing the file rather than skipping it.
 */
const SKIP_FILE_SEGMENTS: string[] = [
  // narrationScripts.ts contains 'narratorLabel' values used for recording
  // session documentation only — they are NOT rendered to users.
  "narrationScripts.ts",

  // publicCopyRegistry.ts is the DEFINITION file for banned phrases.
  // It intentionally contains them as string constants in BANNED_PUBLIC_PHRASES.
  "publicCopyRegistry.ts",

  // verifyPublicCopyIntegrity.ts itself references banned phrases as literals.
  "verifyPublicCopyIntegrity.ts",

  // verifyPublicSurfaceConformance.ts is a gate script, not a rendering surface.
  "verifyPublicSurfaceConformance.ts",

  // America250Banner.tsx IS the approved top-of-site commemorative banner.
  // "Celebrating 250 years" is correct and intentional there.
  // The banned use was in the map component header panel (removed in Build 53).
  "America250Banner.tsx",

  // NarrationBar.tsx is disabled (returns null). Its doc comments list
  // banned APIs as a forbidden-list reference, not as rendered UI copy.
  "NarrationBar.tsx",
];

// ── Utilities ─────────────────────────────────────────────────────────────────

const ROOT = path.resolve(process.cwd());

function collectFiles(dir: string): string[] {
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) return [];

  const results: string[] = [];

  function walk(current: string): void {
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile() && SCAN_EXTENSIONS.has(path.extname(entry.name))) {
        results.push(fullPath);
      }
    }
  }

  walk(abs);
  return results;
}

function shouldSkip(filePath: string): boolean {
  return SKIP_FILE_SEGMENTS.some((segment) => filePath.endsWith(segment));
}

type Violation = {
  file:    string;
  line:    number;
  phrase:  string;
  content: string;
  rationale: string;
};

// ── Main ──────────────────────────────────────────────────────────────────────

function run(): void {
  const allFiles: string[] = [];
  for (const root of PUBLIC_SCAN_ROOTS) {
    allFiles.push(...collectFiles(root));
  }

  const scannedFiles = allFiles.filter((f) => !shouldSkip(f));

  const violations: Violation[] = [];

  for (const filePath of scannedFiles) {
    const content = fs.readFileSync(filePath, "utf-8");
    const lines   = content.split("\n");
    const relPath = path.relative(ROOT, filePath);

    for (const { phrase, rationale, caseInsensitive } of BANNED_PUBLIC_PHRASES) {
      const searchPhrase = caseInsensitive ? phrase.toLowerCase() : phrase;

      lines.forEach((rawLine, index) => {
        const searchLine = caseInsensitive ? rawLine.toLowerCase() : rawLine;
        if (searchLine.includes(searchPhrase)) {
          violations.push({
            file:      relPath,
            line:      index + 1,
            phrase,
            content:   rawLine.trim(),
            rationale,
          });
        }
      });
    }
  }

  // ── Report ───────────────────────────────────────────────────────────────

  const line = "─".repeat(72);

  console.log("\n╔══ verify:public-copy-integrity ══════════════════════════════════╗");
  console.log(`║  Scanned ${String(scannedFiles.length).padStart(4)} files across ${PUBLIC_SCAN_ROOTS.length} roots`
    .padEnd(70) + "║");
  console.log("╚══════════════════════════════════════════════════════════════════╝\n");

  if (violations.length === 0) {
    console.log("✓  No banned phrases found in public-facing source.");
    console.log("✓  Public copy integrity: PASS\n");
    process.exit(0);
  }

  // Group violations by phrase for readability.
  const byPhrase = new Map<string, Violation[]>();
  for (const v of violations) {
    const group = byPhrase.get(v.phrase) ?? [];
    group.push(v);
    byPhrase.set(v.phrase, group);
  }

  console.error(`✗  ${violations.length} banned phrase occurrence(s) found.\n`);

  for (const [phrase, group] of byPhrase) {
    console.error(line);
    console.error(`  BANNED: "${phrase}"`);
    console.error(`  REASON: ${group[0].rationale}`);
    console.error(`  FOUND IN ${group.length} location(s):\n`);
    for (const v of group) {
      console.error(`    ${v.file}:${v.line}`);
      console.error(`      → ${v.content}`);
    }
    console.error("");
  }

  console.error(line);
  console.error("\n✗  Public copy integrity: FAIL");
  console.error(
    "   Fix: remove or replace each banned phrase,\n" +
    "   or move the file outside the public scan roots if it is not\n" +
    "   actually public-facing copy (and document why in SKIP_FILE_SEGMENTS).\n"
  );

  process.exit(1);
}

run();
