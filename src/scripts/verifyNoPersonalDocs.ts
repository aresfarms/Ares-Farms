import { execSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

/**
 * verify:no-personal-docs — Personal Document Git Guard
 *
 * Codifies docs/DOCTRINE_VERIFY_NO_PERSONAL_DOCS_V1.md.
 *
 * Two-layer scanner over the PR diff range (origin/main...HEAD):
 *
 *   Layer 1 — filename pattern scan: fail if any added/modified/
 *             renamed/copied file path matches sensitive patterns
 *             (credit summary, founder-name PDFs, recovery key,
 *             SSN, social security, passport, driver's license,
 *             tax return, bank statement, etc.)
 *
 *   Layer 2 — content signature scan: fail if newly added or
 *             modified text-extractable files contain high-risk
 *             signatures (SSN-like ###-##-####, credit card number
 *             groups, private key headers, recovery seed phrase
 *             labels, bank routing/account labels, credit report
 *             labels).
 *
 * PDFs: text extraction is not done by default (no native PDF
 * library bundled); a PDF whose filename matches a sensitive
 * pattern fails closed. Allowlist entries require an owner, a
 * reason, and an expiration per the doctrine.
 *
 * Allowlisting is discouraged. No permanent allowlist for founder
 * financial or identity documents.
 */

export const VERIFY_NO_PERSONAL_DOCS_RUNTIME_VERSION =
  "verify-no-personal-docs-runtime-v0.1.0";

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

// Path prefixes that may legitimately contain sensitive-looking
// strings as part of governance/regulatory doctrine text. The
// scanner whitelists these for Layer 1 only when explicitly opted
// in via the allowlist; by default they are subject to the same
// scan as everything else. (Currently empty — the doctrine forbids
// permanent allowlists for founder financial or identity documents.)
export const PATH_PREFIX_ALLOWLIST: ReadonlyArray<string> = [];

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
      pattern: /\b(?:\d[ -]?){15,19}\d\b/,
      label: "Credit card number-like group (15-20 digits with separators)",
      severity: "FAIL",
    },
    {
      id: "private-key-header",
      pattern: /-----BEGIN\s+(RSA |DSA |EC |OPENSSH |PGP |ENCRYPTED )?PRIVATE KEY-----/,
      label: "Private key header (-----BEGIN ... PRIVATE KEY-----)",
      severity: "FAIL",
    },
    {
      id: "recovery-phrase-label",
      pattern: /\b(?:seed\s+phrase|recovery\s+phrase|mnemonic\s+phrase|recovery\s+seed)\b/i,
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
      pattern: /\b(?:credit\s+report|fico\s+score|equifax|experian|transunion)\b/i,
      label: "Credit report / bureau label",
      severity: "FAIL",
    },
  ];

// Extensions the content scanner can read as text. PDFs are not in
// this list — a PDF with a sensitive filename fails closed at
// Layer 1; a PDF without a sensitive filename is not content-scanned
// (the doctrine accepts this as a known limitation; gitleaks /
// trufflehog can extend coverage as optional tooling).
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

const FALSE_POSITIVE_PATH_TOKENS: ReadonlyArray<RegExp> = [
  // Scanner's own doctrine / runtime / smoke files reference sensitive
  // tokens as part of their text; they are intentionally excluded from
  // the Layer 2 content scan but NOT from the Layer 1 filename scan
  // (which already covers the file by id, not by content).
  /^docs\/DOCTRINE_VERIFY_NO_PERSONAL_DOCS_V1\.md$/,
  /^src\/scripts\/verifyNoPersonalDocs\.ts$/,
  /^src\/scripts\/verifyNoPersonalDocsSmokeTest\.ts$/,
  /^docs\/BUILD_40_VERIFY_NO_PERSONAL_DOCS\.md$/,
  /^docs\/build-records\/PR_BODY_BUILD_40\.md$/,
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
  if (!existsSync(ALLOWLIST_PATH)) {
    return [];
  }
  try {
    const raw = readFileSync(ALLOWLIST_PATH, "utf8");
    const parsed = JSON.parse(raw) as AllowlistEntry[];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function validateAllowlistEntry(
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
  // Reject expired entries.
  const exp = new Date(e.expirationDate);
  if (Number.isNaN(exp.getTime())) {
    return { ok: false, reason: "expirationDate is not a valid date" };
  }
  if (exp.getTime() < Date.now()) {
    return { ok: false, reason: `allowlist entry expired ${e.expirationDate}` };
  }
  // Permanent allowlist for founder financial/identity documents is
  // forbidden by doctrine. Reject entries that look like founder
  // financial/identity material outright.
  for (const def of SENSITIVE_FILENAME_PATTERNS) {
    if (def.id === "founder-named-pdf" && def.pattern.test(e.path)) {
      return {
        ok: false,
        reason: `founder financial/identity documents may not be allowlisted (${def.id})`,
      };
    }
    if (def.id === "credit-summary-pdf" && def.pattern.test(e.path)) {
      return {
        ok: false,
        reason: `credit-summary documents may not be allowlisted (${def.id})`,
      };
    }
    if (def.id === "credit-summary-glob" && def.pattern.test(e.path)) {
      return {
        ok: false,
        reason: `credit-summary documents may not be allowlisted (${def.id})`,
      };
    }
    if (def.id === "recovery-key-pdf" && def.pattern.test(e.path)) {
      return {
        ok: false,
        reason: `recovery-key documents may not be allowlisted (${def.id})`,
      };
    }
    if (def.id === "recovery-key-glob" && def.pattern.test(e.path)) {
      return {
        ok: false,
        reason: `recovery-key documents may not be allowlisted (${def.id})`,
      };
    }
  }
  return { ok: true };
}

// =============================================================================
// Diff range resolution
// =============================================================================

function safeExec(command: string, fallback: string): string {
  try {
    return execSync(command, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();
  } catch {
    return fallback;
  }
}

type ChangedFile = {
  path: string;
  status: "A" | "C" | "M" | "R" | "T"; // Added/Copied/Modified/Renamed/Type-change
};

function resolveBaseRef(): string {
  // Prefer origin/main; fall back to main; fall back to HEAD~1 on
  // detached single-commit branches.
  const candidates = ["origin/main", "main"];
  for (const c of candidates) {
    const head = safeExec(`git rev-parse --verify ${c}`, "");
    if (head.length > 0) return c;
  }
  // Last resort
  const headPrev = safeExec("git rev-parse --verify HEAD~1", "");
  if (headPrev.length > 0) return "HEAD~1";
  return "HEAD";
}

function getChangedFiles(baseRef: string, headRef: string): ChangedFile[] {
  // --diff-filter=ACMRT covers Added, Copied, Modified, Renamed,
  // Type-change. Deletions are intentionally excluded (a deletion
  // does not introduce sensitive content; it removes it).
  const raw = safeExec(
    `git diff --name-status --diff-filter=ACMRT ${baseRef}...${headRef}`,
    ""
  );
  if (raw.length === 0) return [];
  const out: ChangedFile[] = [];
  for (const line of raw.split(/\r?\n/)) {
    if (line.length === 0) continue;
    const parts = line.split(/\t+/);
    const code = parts[0]?.charAt(0);
    if (!code || !["A", "C", "M", "R", "T"].includes(code)) continue;
    // For renames/copies, the new path is the last column.
    const p = parts[parts.length - 1];
    if (!p) continue;
    out.push({ path: p, status: code as ChangedFile["status"] });
  }
  return out;
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
// Layer 2 — content scan
// =============================================================================

export type ContentHit = {
  path: string;
  signatureId: string;
  label: string;
  excerpt: string;
  lineNumber: number;
};

const MAX_CONTENT_BYTES = 2 * 1024 * 1024; // 2 MiB — skip huge files

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
    // Reset the lastIndex for stateful regex (we use non-global, but
    // be safe).
    const re = new RegExp(def.pattern.source, def.pattern.flags);
    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];
      if (line.length === 0) continue;
      // Skip lines that contain the literal pattern definition itself
      // (the doctrine / scanner source). isFalsePositivePath above
      // covers the obvious files; this catches any other reference
      // that explicitly labels itself as "example" or "fixture".
      if (/\b(example|fixture|sample|placeholder|synthetic|fake)\b/i.test(line)) {
        continue;
      }
      const m = re.exec(line);
      if (m) {
        hits.push({
          path: filePath,
          signatureId: def.id,
          label: def.label,
          excerpt: line.slice(0, 200),
          lineNumber: i + 1,
        });
      }
    }
  }
  return hits;
}

function readFileSafely(filePath: string): string | null {
  try {
    const stat = statSync(filePath);
    if (!stat.isFile()) return null;
    if (stat.size > MAX_CONTENT_BYTES) return null;
    return readFileSync(filePath, "utf8");
  } catch {
    return null;
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
    | "ALLOWLIST_ENTRY_INVALID";
  path: string;
  detail: string;
};

export type ScanResult = {
  runtimeVersion: string;
  docRef: string;
  baseRef: string;
  headRef: string;
  changedFileCount: number;
  layer1HitCount: number;
  layer2HitCount: number;
  pdfFailClosedCount: number;
  allowlistInvalidCount: number;
  findings: Finding[];
  allowlistEntries: AllowlistEntry[];
  exitCode: 0 | 1;
};

// =============================================================================
// Main entry
// =============================================================================

function scanPaths(
  paths: string[],
  baseRef: string,
  headRef: string,
  allowlist: AllowlistEntry[]
): ScanResult {
  const findings: Finding[] = [];
  let layer1HitCount = 0;
  let layer2HitCount = 0;
  let pdfFailClosedCount = 0;

  // Validate allowlist entries (rejected entries still count as
  // findings — invalid allowlists cannot pass).
  const allowlistInvalid = allowlist
    .map((e) => ({ entry: e, validation: validateAllowlistEntry(e) }))
    .filter((x) => !x.validation.ok);
  for (const i of allowlistInvalid) {
    findings.push({
      layer: 3,
      category: "ALLOWLIST_ENTRY_INVALID",
      path: i.entry.path,
      detail: `Allowlist entry invalid: ${i.validation.reason}`,
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
          detail: `pattern=${h.patternId} — ${h.rationale}`,
        });
      }
      // PDF fail-closed: a PDF whose filename matches a sensitive
      // pattern fails closed because we cannot reliably inspect
      // content without an extractor.
      if (isPdf(p)) {
        pdfFailClosedCount += 1;
        findings.push({
          layer: 1,
          category: "PDF_UNINSPECTABLE_SUSPICIOUS_FILENAME",
          path: p,
          detail:
            "Suspicious-filename PDF cannot be inspected without an extractor; failing closed.",
        });
      }
    }

    // Layer 2 — content
    if (isTextExtractable(p) && !allowedPaths.has(p)) {
      const text = readFileSafely(p);
      if (text !== null) {
        const contentHits = scanFileContent(p, text);
        layer2HitCount += contentHits.length;
        for (const h of contentHits) {
          findings.push({
            layer: 2,
            category: "CONTENT_SIGNATURE_MATCH",
            path: p,
            detail: `signature=${h.signatureId} (${h.label}) at line ${h.lineNumber}: "${h.excerpt}"`,
          });
        }
      }
    }
  }

  const exitCode: 0 | 1 = findings.length > 0 ? 1 : 0;
  return {
    runtimeVersion: VERIFY_NO_PERSONAL_DOCS_RUNTIME_VERSION,
    docRef: VERIFY_NO_PERSONAL_DOCS_DOC_REF,
    baseRef,
    headRef,
    changedFileCount: paths.length,
    layer1HitCount,
    layer2HitCount,
    pdfFailClosedCount,
    allowlistInvalidCount: allowlistInvalid.length,
    findings,
    allowlistEntries: allowlist,
    exitCode,
  };
}

function main() {
  // CLI flags:
  //   --full-history       scan every file ever committed
  //   --paths a b c        scan specific paths (used by smoke test)
  //   (default)            scan the PR diff origin/main...HEAD
  const args = process.argv.slice(2);
  const fullHistory = args.includes("--full-history");
  const pathsFlag = args.findIndex((a) => a === "--paths");
  const explicitPaths =
    pathsFlag >= 0 ? args.slice(pathsFlag + 1).filter((a) => !a.startsWith("--")) : [];

  const allowlist = loadAllowlist();
  let baseRef: string;
  let headRef: string;
  let paths: string[];

  if (explicitPaths.length > 0) {
    baseRef = "(explicit paths)";
    headRef = "(explicit paths)";
    paths = explicitPaths;
  } else if (fullHistory) {
    baseRef = "(full history)";
    headRef = "(full history)";
    // List every path ever committed.
    const raw = safeExec(
      "git log --all --name-only --pretty=format: --diff-filter=ACMRT",
      ""
    );
    const set = new Set<string>();
    for (const line of raw.split(/\r?\n/)) {
      const t = line.trim();
      if (t.length > 0) set.add(t);
    }
    paths = [...set];
  } else {
    baseRef = resolveBaseRef();
    headRef = "HEAD";
    paths = getChangedFiles(baseRef, headRef).map((c) => c.path);
  }

  const result = scanPaths(paths, baseRef, headRef, allowlist);

  console.log(
    JSON.stringify(
      {
        ok: result.exitCode === 0,
        runtimeVersion: result.runtimeVersion,
        docRef: result.docRef,
        baseRef: result.baseRef,
        headRef: result.headRef,
        changedFileCount: result.changedFileCount,
        layer1HitCount: result.layer1HitCount,
        layer2HitCount: result.layer2HitCount,
        pdfFailClosedCount: result.pdfFailClosedCount,
        allowlistInvalidCount: result.allowlistInvalidCount,
        findingCount: result.findings.length,
        findings: result.findings,
        exitCode: result.exitCode,
        message:
          result.exitCode === 0
            ? "verify:no-personal-docs PASS — no sensitive filenames or content signatures in the PR diff."
            : "verify:no-personal-docs FAIL — sensitive personal documents or content signatures detected. Review the findings; remove the offending paths/content; rerun.",
      },
      null,
      2
    )
  );

  process.exit(result.exitCode);
}

// Only run main when invoked directly (not when imported by the
// smoke test).
if (
  process.argv[1] &&
  /verifyNoPersonalDocs(\.ts|\.js)?$/.test(process.argv[1])
) {
  main();
}

// =============================================================================
// Public exports for the smoke test + downstream consumers
// =============================================================================

export { scanPaths, validateAllowlistEntry, loadAllowlist };
