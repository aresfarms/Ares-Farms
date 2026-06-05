import { execSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

/**
 * verify:no-personal-docs — Personal Document Git Guard
 *
 * Codifies docs/DOCTRINE_VERIFY_NO_PERSONAL_DOCS_V1.md plus the
 * Build 40 hardening:
 *
 *   1. Default scan = full checked-out tree at HEAD (`tree` mode).
 *      No base-range dependency. No shallow-clone ambiguity. If the
 *      file exists anywhere in the tree at HEAD, fail.
 *   2. Optional diff mode is secondary / informational only
 *      (--mode=diff). It is NOT the source of truth.
 *   3. Fail closed on scan setup errors:
 *        - cannot compute scope → fail
 *        - cannot inspect suspicious PDF → fail
 *        - cannot enumerate files → fail
 *        - empty scope in default mode → fail
 *   4. Never print matched secrets. Findings carry only:
 *        - layer, category, path, lineNumber (if safe),
 *          redactedReason (the pattern label, not the matched text).
 *   5. CI proof prints `mode`, `scannedFileCount`, and exit code 0
 *      only after a non-zero file count is enumerated and scanned.
 */

export const VERIFY_NO_PERSONAL_DOCS_RUNTIME_VERSION =
  "verify-no-personal-docs-runtime-v0.2.0";

export const VERIFY_NO_PERSONAL_DOCS_DOC_REF =
  "docs/DOCTRINE_VERIFY_NO_PERSONAL_DOCS_V1.md";

// =============================================================================
// Layer 1 — sensitive filename patterns
// =============================================================================

export type FilenamePatternDef = {
  id: string;
  pattern: RegExp;
  rationale: string;
};

export const SENSITIVE_FILENAME_PATTERNS: ReadonlyArray<FilenamePatternDef> = [
  {
    id: "credit-summary-pdf",
    pattern: /Credit_Summary_.*\.pdf$/i,
    rationale: "Personal credit summary PDFs (per doctrine §Layer 1).",
  },
  {
    id: "credit-summary-glob",
    pattern: /credit[\s_-]*summary/i,
    rationale: "Any path containing 'credit summary' (case-insensitive).",
  },
  {
    id: "founder-named-pdf",
    pattern: /_(Caitlin_Hudson|Stuart_Fraass|Frances_Fraass)\.pdf$/i,
    rationale: "Per-founder PDFs (Caitlin/Stuart/Frances).",
  },
  {
    id: "recovery-key-pdf",
    pattern: /^Recovery\s+Key\.pdf$/,
    rationale: "Recovery Key.pdf (canonical filename per doctrine).",
  },
  {
    id: "recovery-key-glob",
    pattern: /recovery[\s_-]*key/i,
    rationale: "Any path containing 'recovery key' (case-insensitive).",
  },
  {
    id: "ssn-token",
    pattern: /(^|[\\/_\-.])ssn([\\/_\-.]|$)/i,
    rationale: "Path token 'ssn'.",
  },
  {
    id: "social-security",
    pattern: /social[_\s-]*security/i,
    rationale: "Path containing 'social security'.",
  },
  {
    id: "passport",
    pattern: /passport/i,
    rationale: "Path containing 'passport'.",
  },
  {
    id: "drivers-license",
    pattern: /driver'?s?[_\s-]*licen[cs]e/i,
    rationale: "Path containing 'driver's license'.",
  },
  {
    id: "tax-return",
    pattern: /tax[_\s-]*return/i,
    rationale: "Path containing 'tax return'.",
  },
  {
    id: "bank-statement",
    pattern: /bank[_\s-]*statement/i,
    rationale: "Path containing 'bank statement'.",
  },
];

// =============================================================================
// Layer 2 — content signature patterns
// =============================================================================

export type ContentSignatureDef = {
  id: string;
  pattern: RegExp;
  label: string;
  severity: "FAIL";
};

export const SENSITIVE_CONTENT_SIGNATURES: ReadonlyArray<ContentSignatureDef> =
  [
    {
      id: "ssn-pattern",
      pattern: /\b\d{3}-\d{2}-\d{4}\b/,
      label: "SSN-like pattern (###-##-####)",
      severity: "FAIL",
    },
    {
      id: "credit-card-16",
      // Card-network-prefix-anchored to avoid UUID / hash false
      // positives. Recognized prefixes: Visa (4xxx), MasterCard
      // (51-55 + xx, or 2221-2720 BIN range), American Express
      // (34, 37), Discover (6011, 65xx, 644-649). The trailing
      // groups follow the standard 4-4-4 / 4-4-4-1+ layout.
      pattern:
        /\b(?:4\d{3}|5[1-5]\d{2}|34\d{2}|37\d{2}|6011|65\d{2}|64[4-9]\d|2[2-7]\d{2})[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{1,7}\b/,
      label:
        "Credit card number-like group (Visa/MC/Amex/Discover-prefixed 13-19 digit run)",
      severity: "FAIL",
    },
    {
      id: "private-key-header",
      pattern:
        /-----BEGIN\s+(RSA |DSA |EC |OPENSSH |PGP |ENCRYPTED )?PRIVATE KEY-----/,
      label: "Private key header (-----BEGIN ... PRIVATE KEY-----)",
      severity: "FAIL",
    },
    {
      id: "recovery-phrase-label",
      pattern:
        /\b(?:seed\s+phrase|recovery\s+phrase|mnemonic\s+phrase|recovery\s+seed)\b/i,
      label: "Recovery / seed phrase label",
      severity: "FAIL",
    },
    {
      id: "bank-routing",
      pattern: /\brouting(?:\s*number|\s*#|\b)[:\s#]*\d{9}\b/i,
      label: "Bank routing number label",
      severity: "FAIL",
    },
    {
      id: "bank-account",
      pattern: /\baccount(?:\s*number|\s*#|\b)[:\s#]*\d{6,}\b/i,
      label: "Bank account number label",
      severity: "FAIL",
    },
    {
      id: "credit-report-label",
      pattern:
        /\b(?:credit\s+report|fico\s+score|equifax|experian|transunion)\b/i,
      label: "Credit report / bureau label",
      severity: "FAIL",
    },
  ];

const TEXT_EXTRACTABLE_EXTENSIONS = new Set<string>([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".json",
  ".md",
  ".mdx",
  ".txt",
  ".csv",
  ".tsv",
  ".yml",
  ".yaml",
  ".env",
  ".html",
  ".htm",
  ".css",
  ".scss",
  ".sass",
  ".sh",
  ".bash",
  ".zsh",
  ".sql",
  ".xml",
  ".cfg",
  ".conf",
  ".ini",
  ".log",
]);

// Path whitelist for Layer 2 only — the scanner's own files
// legitimately reference the patterns. Layer 1 (filename) is NEVER
// whitelisted — these files' own names don't match any sensitive
// pattern so there is nothing to whitelist.
const FALSE_POSITIVE_PATH_TOKENS: ReadonlyArray<RegExp> = [
  /^docs\/DOCTRINE_VERIFY_NO_PERSONAL_DOCS_V1\.md$/,
  /^docs\/BUILD_40_VERIFY_NO_PERSONAL_DOCS\.md$/,
  /^docs\/build-records\/PR_BODY_BUILD_40\.md$/,
  /^src\/scripts\/verifyNoPersonalDocs\.ts$/,
  /^src\/scripts\/verifyNoPersonalDocsSmokeTest\.ts$/,
];

// =============================================================================
// Allowlist (config-driven; default empty)
// =============================================================================

export type AllowlistEntry = {
  path: string;
  reason: string;
  approvingAuthority: string;
  expirationDate: string;
  classificationLevel: string;
  redactionConfirmation: boolean;
};

const ALLOWLIST_PATH = path.join(
  process.cwd(),
  ".no-personal-docs-allowlist.json"
);

function loadAllowlist(): AllowlistEntry[] {
  if (!existsSync(ALLOWLIST_PATH)) return [];
  try {
    const raw = readFileSync(ALLOWLIST_PATH, "utf8");
    const parsed = JSON.parse(raw) as AllowlistEntry[];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

export function validateAllowlistEntry(
  e: Partial<AllowlistEntry>
): { ok: boolean; reason?: string } {
  if (!e.path) return { ok: false, reason: "missing path" };
  if (!e.reason) return { ok: false, reason: "missing reason" };
  if (!e.approvingAuthority)
    return { ok: false, reason: "missing approvingAuthority" };
  if (!e.expirationDate)
    return { ok: false, reason: "missing expirationDate" };
  if (!e.classificationLevel)
    return { ok: false, reason: "missing classificationLevel" };
  if (e.redactionConfirmation !== true)
    return { ok: false, reason: "redactionConfirmation must be true" };
  const exp = new Date(e.expirationDate);
  if (Number.isNaN(exp.getTime())) {
    return { ok: false, reason: "expirationDate is not a valid date" };
  }
  if (exp.getTime() < Date.now()) {
    return { ok: false, reason: `allowlist entry expired ${e.expirationDate}` };
  }
  // Per doctrine: no permanent allowlist for founder financial/identity
  // documents. Reject these outright.
  const forbiddenIds = new Set([
    "credit-summary-pdf",
    "credit-summary-glob",
    "founder-named-pdf",
    "recovery-key-pdf",
    "recovery-key-glob",
  ]);
  for (const def of SENSITIVE_FILENAME_PATTERNS) {
    if (forbiddenIds.has(def.id) && def.pattern.test(e.path)) {
      return {
        ok: false,
        reason: `founder financial/identity/recovery documents may not be allowlisted (${def.id})`,
      };
    }
  }
  return { ok: true };
}

// =============================================================================
// Setup-error sentinel
// =============================================================================

class ScanSetupError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ScanSetupError";
  }
}

// =============================================================================
// Scope resolution
// =============================================================================

function execStrict(command: string): string {
  // execSync throws if the command exits non-zero; we want that.
  return execSync(command, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  })
    .toString();
}

type ScopeMode = "tree" | "diff" | "full-history";

type Scope = {
  mode: ScopeMode;
  description: string;
  paths: string[];
};

function enumerateTreeAtHead(): string[] {
  // `git ls-files` lists every tracked file at the current index/HEAD.
  // This is the canonical "what's in the repo" view; .gitignore is
  // honored by definition (ignored files aren't tracked).
  let raw: string;
  try {
    raw = execStrict("git ls-files");
  } catch (err) {
    throw new ScanSetupError(
      `git ls-files failed; cannot enumerate tree at HEAD: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
  }
  const paths = raw
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  if (paths.length === 0) {
    throw new ScanSetupError(
      "git ls-files returned 0 paths; this is unexpected and treated as a scan setup error (fail closed)."
    );
  }
  return paths;
}

function enumerateDiffRange(baseRef: string, headRef: string): string[] {
  let raw: string;
  try {
    raw = execStrict(
      `git diff --name-status --diff-filter=ACMRT ${baseRef}...${headRef}`
    );
  } catch (err) {
    throw new ScanSetupError(
      `git diff against ${baseRef}...${headRef} failed: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
  }
  const out: string[] = [];
  for (const line of raw.split(/\r?\n/)) {
    if (line.length === 0) continue;
    const parts = line.split(/\t+/);
    const code = parts[0]?.charAt(0);
    if (!code || !["A", "C", "M", "R", "T"].includes(code)) continue;
    const p = parts[parts.length - 1];
    if (p) out.push(p);
  }
  return out;
}

function enumerateFullHistory(): string[] {
  let raw: string;
  try {
    raw = execStrict(
      "git log --all --name-only --pretty=format: --diff-filter=ACMRT"
    );
  } catch (err) {
    throw new ScanSetupError(
      `git log --all enumeration failed: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
  }
  const set = new Set<string>();
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim();
    if (t.length > 0) set.add(t);
  }
  return [...set];
}

function resolveDiffBaseRef(): string {
  for (const c of ["origin/main", "main"]) {
    try {
      execStrict(`git rev-parse --verify ${c}`);
      return c;
    } catch {
      // try next
    }
  }
  // No HEAD~1 fallback: in diff mode we require a clearly-named base
  // ref to avoid silent "empty diff = pass" failure modes.
  throw new ScanSetupError(
    "diff mode requires origin/main or main to exist locally; neither is reachable. Either fetch the base ref, or use the default tree mode."
  );
}

// =============================================================================
// Layer 1 — filename scan
// =============================================================================

export type FilenameHit = {
  path: string;
  patternId: string;
  rationale: string;
};

export function scanFilename(filePath: string): FilenameHit[] {
  const hits: FilenameHit[] = [];
  const basename = path.basename(filePath);
  for (const def of SENSITIVE_FILENAME_PATTERNS) {
    if (def.pattern.test(filePath) || def.pattern.test(basename)) {
      hits.push({
        path: filePath,
        patternId: def.id,
        rationale: def.rationale,
      });
    }
  }
  return hits;
}

// =============================================================================
// Layer 2 — content scan (redacted output only)
// =============================================================================

export type ContentHit = {
  path: string;
  signatureId: string;
  signatureLabel: string;
  lineNumber: number;
  // No excerpt, no captured-text field. The doctrine + Build 40
  // hardening §4 forbids printing matched secrets. The label is the
  // pattern's human-readable name (e.g. "SSN-like pattern
  // (###-##-####)"); the line number is safe to print.
};

const MAX_CONTENT_BYTES = 2 * 1024 * 1024; // 2 MiB

function isFalsePositivePath(filePath: string): boolean {
  return FALSE_POSITIVE_PATH_TOKENS.some((re) => re.test(filePath));
}

export function scanFileContent(
  filePath: string,
  content: string
): ContentHit[] {
  if (isFalsePositivePath(filePath)) return [];
  const hits: ContentHit[] = [];
  const lines = content.split(/\r?\n/);
  for (const def of SENSITIVE_CONTENT_SIGNATURES) {
    const re = new RegExp(def.pattern.source, def.pattern.flags);
    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];
      if (line.length === 0) continue;
      // False-positive guard: skip lines tagged with explicit marker
      // words so doctrine / smoke / fixture text does not self-trigger.
      if (
        /\b(example|fixture|sample|placeholder|synthetic|fake)\b/i.test(line)
      ) {
        continue;
      }
      if (re.exec(line) !== null) {
        hits.push({
          path: filePath,
          signatureId: def.id,
          signatureLabel: def.label,
          lineNumber: i + 1,
        });
      }
    }
  }
  return hits;
}

type ReadResult =
  | { kind: "ok"; content: string }
  | { kind: "err"; reason: string };

function readFileSafely(filePath: string): ReadResult {
  try {
    const stat = statSync(filePath);
    if (!stat.isFile()) return { kind: "err", reason: "not a regular file" };
    if (stat.size > MAX_CONTENT_BYTES) {
      return {
        kind: "err",
        reason: `file exceeds ${MAX_CONTENT_BYTES} bytes`,
      };
    }
    return { kind: "ok", content: readFileSync(filePath, "utf8") };
  } catch (err) {
    return {
      kind: "err",
      reason: err instanceof Error ? err.message : String(err),
    };
  }
}

function isTextExtractable(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return TEXT_EXTRACTABLE_EXTENSIONS.has(ext);
}

function isPdf(filePath: string): boolean {
  return path.extname(filePath).toLowerCase() === ".pdf";
}

// =============================================================================
// Findings + result types
// =============================================================================

export type Finding = {
  layer: 1 | 2 | 3;
  category:
    | "FILENAME_PATTERN_MATCH"
    | "CONTENT_SIGNATURE_MATCH"
    | "PDF_UNINSPECTABLE_SUSPICIOUS_FILENAME"
    | "ALLOWLIST_ENTRY_INVALID"
    | "FILE_READ_ERROR"
    // Anti-vacuous-pass invariant: the gate refuses to declare PASS
    // unless at least one real file was inspected. Per Build 40
    // hardening §5 (assert inside the gate, not in the CI log).
    | "SCAN_VACUOUS_NO_FILES";
  path: string;
  lineNumber?: number;
  redactedReason: string;
};

export type ScanResult = {
  runtimeVersion: string;
  docRef: string;
  mode: ScopeMode;
  scopeDescription: string;
  scannedFileCount: number;
  layer1HitCount: number;
  layer2HitCount: number;
  pdfFailClosedCount: number;
  fileReadErrorCount: number;
  allowlistInvalidCount: number;
  findings: Finding[];
  allowlistEntries: AllowlistEntry[];
  exitCode: 0 | 1;
};

// =============================================================================
// Scan engine
// =============================================================================

export function scanPaths(
  paths: string[],
  allowlist: AllowlistEntry[],
  mode: ScopeMode,
  scopeDescription: string
): ScanResult {
  const findings: Finding[] = [];
  let layer1HitCount = 0;
  let layer2HitCount = 0;
  let pdfFailClosedCount = 0;
  let fileReadErrorCount = 0;

  // ───────────────────────────────────────────────────────────────────
  // Anti-vacuous-pass invariant (Build 40 hardening §5)
  // ───────────────────────────────────────────────────────────────────
  // The gate proves its own integrity instead of trusting a reader
  // to notice in the CI log. If we received zero paths to inspect,
  // we cannot have proven the absence of sensitive content; refuse
  // to declare PASS. Together with §3 (cannot enumerate → fail) this
  // closes the fail-open hole completely: the only path to exit 0
  // is "scanned real files and found nothing."
  if (paths.length === 0) {
    findings.push({
      layer: 3,
      category: "SCAN_VACUOUS_NO_FILES",
      path: "(scan-scope)",
      redactedReason:
        "Refusing to declare PASS without inspecting at least one file. The gate enforces its own integrity rather than trusting an external reader to verify the file count.",
    });
  }

  // Validate allowlist entries (invalid entries themselves become
  // findings — a malformed allowlist cannot pass the gate).
  const allowlistInvalid = allowlist
    .map((e) => ({ entry: e, validation: validateAllowlistEntry(e) }))
    .filter((x) => !x.validation.ok);
  for (const i of allowlistInvalid) {
    findings.push({
      layer: 3,
      category: "ALLOWLIST_ENTRY_INVALID",
      path: i.entry.path,
      redactedReason: `Allowlist entry invalid: ${i.validation.reason}`,
    });
  }
  const allowedPaths = new Set(
    allowlist
      .filter((e) => validateAllowlistEntry(e).ok)
      .map((e) => e.path)
  );

  for (const p of paths) {
    // Layer 1 — filename
    const filenameHits = scanFilename(p);
    if (filenameHits.length > 0 && !allowedPaths.has(p)) {
      layer1HitCount += filenameHits.length;
      for (const h of filenameHits) {
        findings.push({
          layer: 1,
          category: "FILENAME_PATTERN_MATCH",
          path: p,
          redactedReason: `pattern=${h.patternId} — ${h.rationale}`,
        });
      }
      if (isPdf(p)) {
        pdfFailClosedCount += 1;
        findings.push({
          layer: 1,
          category: "PDF_UNINSPECTABLE_SUSPICIOUS_FILENAME",
          path: p,
          redactedReason:
            "Suspicious-filename PDF cannot be inspected without an extractor; failing closed.",
        });
      }
    }

    // Layer 2 — content
    if (isTextExtractable(p) && !allowedPaths.has(p)) {
      const r = readFileSafely(p);
      if (r.kind === "ok") {
        const contentHits = scanFileContent(p, r.content);
        layer2HitCount += contentHits.length;
        for (const h of contentHits) {
          findings.push({
            layer: 2,
            category: "CONTENT_SIGNATURE_MATCH",
            path: p,
            lineNumber: h.lineNumber,
            // REDACTED — the signature label is logged, not the
            // matched text. Per Build 40 hardening §4.
            redactedReason: `signature=${h.signatureId} (${h.signatureLabel}) — match redacted; inspect locally to remediate.`,
          });
        }
      } else {
        // Cannot read a candidate file → fail closed (audit-safe).
        fileReadErrorCount += 1;
        findings.push({
          layer: 2,
          category: "FILE_READ_ERROR",
          path: p,
          redactedReason: `File could not be read for content scan: ${r.reason}`,
        });
      }
    }
  }

  const exitCode: 0 | 1 = findings.length > 0 ? 1 : 0;
  return {
    runtimeVersion: VERIFY_NO_PERSONAL_DOCS_RUNTIME_VERSION,
    docRef: VERIFY_NO_PERSONAL_DOCS_DOC_REF,
    mode,
    scopeDescription,
    scannedFileCount: paths.length,
    layer1HitCount,
    layer2HitCount,
    pdfFailClosedCount,
    fileReadErrorCount,
    allowlistInvalidCount: allowlistInvalid.length,
    findings,
    allowlistEntries: allowlist,
    exitCode,
  };
}

// =============================================================================
// Main entry
// =============================================================================

function resolveScope(args: string[]): Scope {
  // --mode=tree (default), --mode=diff, --mode=full-history
  // --paths a b c        (smoke-test injection; bypasses git
  //                       enumeration; failure cases are tested
  //                       directly in the smoke test)
  const modeFlag = args.find((a) => a.startsWith("--mode="));
  const explicitPathsIdx = args.findIndex((a) => a === "--paths");
  const explicitPathsPresent = explicitPathsIdx >= 0;
  const explicitPaths = explicitPathsPresent
    ? args.slice(explicitPathsIdx + 1).filter((a) => !a.startsWith("--"))
    : [];

  if (explicitPathsPresent) {
    if (explicitPaths.length === 0) {
      // --paths flag present but no paths supplied → setup error
      // (silently falling through to tree mode would mask a CLI bug).
      throw new ScanSetupError(
        "--paths was supplied with no following paths; refusing to silently fall through to tree mode."
      );
    }
    return {
      mode: "tree",
      description: `explicit-paths (${explicitPaths.length})`,
      paths: explicitPaths,
    };
  }

  const requestedMode = modeFlag ? modeFlag.split("=")[1] : "tree";

  switch (requestedMode) {
    case "tree": {
      const paths = enumerateTreeAtHead(); // throws on setup error
      return {
        mode: "tree",
        description: "git ls-files (full tree at HEAD)",
        paths,
      };
    }
    case "diff": {
      const baseRef = resolveDiffBaseRef(); // throws if unresolvable
      const paths = enumerateDiffRange(baseRef, "HEAD");
      if (paths.length === 0) {
        // Per hardening §3: no empty-range pass. In diff mode, an
        // empty diff is a SETUP error (the diff was not meaningfully
        // computed against the intended base). Fail closed.
        throw new ScanSetupError(
          `diff mode against ${baseRef}...HEAD returned 0 paths; refusing to silently pass an empty range. If this is genuinely a no-op branch, use tree mode instead.`
        );
      }
      return {
        mode: "diff",
        description: `git diff ${baseRef}...HEAD`,
        paths,
      };
    }
    case "full-history": {
      const paths = enumerateFullHistory();
      if (paths.length === 0) {
        throw new ScanSetupError(
          "full-history enumeration returned 0 paths; treating as setup error."
        );
      }
      return {
        mode: "full-history",
        description: "git log --all enumeration",
        paths,
      };
    }
    default:
      throw new ScanSetupError(
        `unknown --mode=${requestedMode}; expected tree | diff | full-history`
      );
  }
}

function main() {
  const args = process.argv.slice(2);
  const allowlist = loadAllowlist();

  let scope: Scope;
  try {
    scope = resolveScope(args);
  } catch (err) {
    // Setup error → exit 1 (fail closed). Output a clean record.
    const message =
      err instanceof Error ? err.message : "unknown scan setup error";
    console.log(
      JSON.stringify(
        {
          ok: false,
          runtimeVersion: VERIFY_NO_PERSONAL_DOCS_RUNTIME_VERSION,
          docRef: VERIFY_NO_PERSONAL_DOCS_DOC_REF,
          mode: "(setup-error)",
          scopeDescription: "(setup-error)",
          scannedFileCount: 0,
          findings: [
            {
              layer: 3,
              category: "ALLOWLIST_ENTRY_INVALID", // closest existing category
              path: "(scan-setup)",
              redactedReason: `Scan setup error: ${message}`,
            },
          ],
          exitCode: 1,
          message:
            "verify:no-personal-docs FAIL — scan setup error (failing closed per Build 40 hardening §3).",
        },
        null,
        2
      )
    );
    process.exit(1);
  }

  const result = scanPaths(scope.paths, allowlist, scope.mode, scope.description);

  console.log(
    JSON.stringify(
      {
        ok: result.exitCode === 0,
        runtimeVersion: result.runtimeVersion,
        docRef: result.docRef,
        mode: result.mode,
        scopeDescription: result.scopeDescription,
        scannedFileCount: result.scannedFileCount,
        layer1HitCount: result.layer1HitCount,
        layer2HitCount: result.layer2HitCount,
        pdfFailClosedCount: result.pdfFailClosedCount,
        fileReadErrorCount: result.fileReadErrorCount,
        allowlistInvalidCount: result.allowlistInvalidCount,
        findingCount: result.findings.length,
        findings: result.findings,
        exitCode: result.exitCode,
        message:
          result.exitCode === 0
            ? `verify:no-personal-docs PASS — mode=${result.mode}, scanned ${result.scannedFileCount} files, no sensitive filenames or content signatures detected.`
            : `verify:no-personal-docs FAIL — mode=${result.mode}, scanned ${result.scannedFileCount} files. Review the redacted findings; remove the offending paths/content; rerun.`,
      },
      null,
      2
    )
  );

  process.exit(result.exitCode);
}

if (
  process.argv[1] &&
  /verifyNoPersonalDocs(\.ts|\.js)?$/.test(process.argv[1])
) {
  main();
}

export { loadAllowlist };
