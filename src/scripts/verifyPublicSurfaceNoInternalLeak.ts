/**
 * verifyPublicSurfaceNoInternalLeak — Build 53
 *
 * Hard gate: scans public-facing route source files for internal governance,
 * module, or platform-infrastructure terminology that must never appear on a
 * rendered public customer-facing page.
 *
 * Run via:
 *   npm run verify:public-surface-no-internal-leak
 *
 * Governance:
 *   A rendered public page is any file under the (public) route group, the
 *   portal/borrower placeholder, and direct component/lib dependencies that
 *   are exclusively consumed by those routes. Internal portal pages, admin
 *   dashboards, scripts, and backend modules are excluded — they may
 *   legitimately contain these strings in non-rendered contexts.
 *
 * Exit codes:
 *   0 — all checks pass
 *   1 — one or more banned phrases found; details printed to stdout
 *
 * Public Alpha remains PENDING.
 * "The map reveals opportunities, not the visitor."
 */

import * as fs   from "fs";
import * as path from "path";

// ── Public scan roots ─────────────────────────────────────────────────────────

/**
 * Directories to scan. Only source that can be reached from the (public)
 * route group and its component/lib imports.
 */
const PUBLIC_SCAN_ROOTS = [
  "src/app/(public)",
  "src/app/portal/borrower",
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

const SCAN_EXTENSIONS = new Set([".ts", ".tsx"]);

/**
 * Files that are definition files or gate scripts — they may legitimately
 * contain banned phrases as data, forbidden-list references, or self-checks.
 */
const SKIP_FILE_SEGMENTS: string[] = [
  // Definition files
  "publicCopyRegistry.ts",
  "verifyPublicCopyIntegrity.ts",
  "verifyPublicSurfaceConformance.ts",
  "verifyPublicSurfaceNoInternalLeak.ts",
  "verifyPublicAccessibility.ts",
  // Disabled narration — doc comments list banned APIs as forbidden-list
  "NarrationBar.tsx",
  // America250Banner has intentional "250" copy
  "America250Banner.tsx",
  // trustPagesRuntime.ts is a data library; "console" may appear in governance
  // comments. Its rendered public output is tested by verifyPublicSurfaceConformance.
  "trustPagesRuntime.ts",
  // portal/borrower sub-routes are internal authenticated portal pages, not public
  // surfaces. They are NOT accessible without auth. The top-level portal/borrower/page.tsx
  // has been replaced with a clean public placeholder and is scanned directly.
  // Sub-routes below are behind the borrower authentication boundary.
  "portal/borrower/applications/page.tsx",
  "portal/borrower/data-rights/page.tsx",
  "portal/borrower/documents/page.tsx",
  "portal/borrower/notices/page.tsx",
  "portal/borrower/reports/page.tsx",
  "portal/borrower/environmental-intake/page.tsx",
  "portal/borrower/opportunities/page.tsx",
];

// ── Banned phrases ────────────────────────────────────────────────────────────

/**
 * Each entry declares a phrase that must NOT appear in any rendered
 * public-facing source file, plus a rationale and optional case-insensitivity.
 *
 * "phrase" matches the exact string (or lowercase when caseInsensitive: true).
 */
const BANNED_INTERNAL_PHRASES: ReadonlyArray<{
  phrase:          string;
  rationale:       string;
  caseInsensitive?: boolean;
}> = [
  {
    phrase:    "Module 03",
    rationale: "Internal module reference. Must not appear on public pages.",
  },
  {
    phrase:    "Module 04",
    rationale: "Internal module reference. Must not appear on public pages.",
  },
  {
    phrase:    "Module 09",
    rationale: "Internal module reference. Must not appear on public pages.",
  },
  {
    phrase:    "Module 10",
    rationale: "Internal module reference. Must not appear on public pages.",
  },
  {
    phrase:    "Module 13",
    rationale: "Internal module reference. Must not appear on public pages.",
  },
  {
    phrase:    "Module 14",
    rationale: "Internal module reference. Must not appear on public pages.",
  },
  {
    phrase:    "Module 15",
    rationale: "Internal module reference. Must not appear on public pages.",
  },
  {
    phrase:    "Module 16",
    rationale: "Internal module reference. Must not appear on public pages.",
  },
  {
    phrase:    "Module 17",
    rationale: "Internal module reference. Must not appear on public pages.",
  },
  {
    phrase:    "Module 18",
    rationale: "Internal module reference. Must not appear on public pages.",
  },
  {
    phrase:    "Module 19",
    rationale: "Internal module reference. Must not appear on public pages.",
  },
  {
    phrase:    "PORTABLE VERTICAL SURFACE",
    rationale: "Internal infrastructure label. Must not appear on public pages.",
  },
  {
    phrase:          "Build Now",
    rationale:       "Internal build/module action label. Must not appear on public pages.",
    caseInsensitive: false,
  },
  {
    phrase:    "Revenue Source Intelligence",
    rationale: "Internal intelligence system label. Must not appear on public pages.",
  },
  {
    phrase:          "Governed coordination platform",
    rationale:       "Internal platform label. Use 'discovery and exploration platform' on public pages.",
    caseInsensitive: true,
  },
  {
    phrase:          "Exploration-first intake",
    rationale:       "Internal UX/intake label. Must not appear as visible copy on public pages.",
    caseInsensitive: true,
  },
  {
    phrase:          "Full Map vs Focus My Exploration",
    rationale:       "Internal UX mode label. Must not appear as a visible heading on public pages.",
    caseInsensitive: true,
  },
  {
    phrase:          "Human escalation",
    rationale:       "Internal process label. Use plain language on public pages.",
    caseInsensitive: true,
  },
  {
    phrase:    "lender dashboard",
    rationale: "Internal dashboard label. Must not appear on public pages.",
  },
  {
    phrase:    "sponsor dashboard",
    rationale: "Internal dashboard label. Must not appear on public pages.",
  },
  {
    phrase:          "demo surface",
    rationale:       "Internal surface label. Must not appear on public pages.",
    caseInsensitive: true,
  },
  {
    phrase:          "internal surface",
    rationale:       "Internal surface label. Must not appear on public pages.",
    caseInsensitive: true,
  },
  {
    phrase:          "Open Module",
    rationale:       "Internal portal navigation label. Must not appear on public pages.",
    caseInsensitive: true,
  },
  {
    phrase:          "ModuleHeader",
    rationale:       "Internal module-kit component. Must not be imported in public routes.",
    caseInsensitive: false,
  },
  {
    phrase:          "internalModuleKit",
    rationale:       "Internal module kit import. Must not appear in public routes.",
    caseInsensitive: false,
  },
  {
    phrase:          "PortableSurfaceIndexPage",
    rationale:       "Internal portal index component. Must not be rendered in public routes.",
    caseInsensitive: false,
  },
  {
    phrase:          "verticalSurfacePage",
    rationale:       "Internal portal surface import. Must not appear in public routes.",
    caseInsensitive: false,
  },
  {
    phrase:          "Public Alpha human escalation",
    rationale:       "Internal aria-label. Must not appear on public pages.",
    caseInsensitive: true,
  },
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
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) { walk(full); }
      else if (entry.isFile() && SCAN_EXTENSIONS.has(path.extname(entry.name))) {
        results.push(full);
      }
    }
  }
  walk(abs);
  return results;
}

function shouldSkip(filePath: string): boolean {
  return SKIP_FILE_SEGMENTS.some((seg) => filePath.endsWith(seg));
}

type Violation = {
  file:      string;
  line:      number;
  phrase:    string;
  content:   string;
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

    for (const { phrase, rationale, caseInsensitive } of BANNED_INTERNAL_PHRASES) {
      const search = caseInsensitive ? phrase.toLowerCase() : phrase;
      lines.forEach((rawLine, index) => {
        const searchLine = caseInsensitive ? rawLine.toLowerCase() : rawLine;
        if (searchLine.includes(search)) {
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

  // ── Report ──────────────────────────────────────────────────────────────

  const line = "─".repeat(72);

  console.log("\n╔══ verify:public-surface-no-internal-leak ════════════════════════╗");
  console.log(`║  Scanned ${String(scannedFiles.length).padStart(4)} files across ${PUBLIC_SCAN_ROOTS.length} roots`.padEnd(70) + "║");
  console.log("╚══════════════════════════════════════════════════════════════════╝\n");

  if (violations.length === 0) {
    console.log("✓  No internal phrases found in public-facing source.");
    console.log("✓  Public surface internal-leak check: PASS\n");
    process.exit(0);
  }

  // Group by phrase for readability.
  const byPhrase = new Map<string, Violation[]>();
  for (const v of violations) {
    const group = byPhrase.get(v.phrase) ?? [];
    group.push(v);
    byPhrase.set(v.phrase, group);
  }

  console.error(`✗  ${violations.length} internal phrase occurrence(s) found in public source.\n`);

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
  console.error("\n✗  Public surface internal-leak check: FAIL");
  console.error(
    "   Fix: remove or replace each banned phrase from the public surface,\n" +
    "   or move the file behind the admin/portal boundary if it is not\n" +
    "   public-facing copy (and document why in SKIP_FILE_SEGMENTS).\n"
  );

  process.exit(1);
}

run();
