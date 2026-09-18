import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";

/**
 * TECH-SEC-001 / TECH-TEST-001 Cloud Build upload-context gate.
 *
 * Local preflight uses gcloud's authoritative upload manifest so unsafe files
 * are rejected before `gcloud builds submit` creates a source archive. Inside
 * Cloud Build or CI, where gcloud may be unavailable, the gate scans the
 * extracted workspace and verifies that .gcloudignore retains every required
 * fail-closed exclusion.
 */

const REQUIRED_IGNORE_RULES = [
  ".env",
  ".env.*",
  "*.pem",
  "*.key",
  "Recovery Key.pdf",
  "Credit_Summary_*.pdf",
  "*_Caitlin_Hudson.pdf",
  "*_Stuart_Fraass.pdf",
  "*_Frances_Fraass.pdf",
  "data",
  "review-exports",
  "journey-photos",
  "work",
  "scratch",
  "tmp",
] as const;

const FORBIDDEN_DIRECTORIES = new Set([
  "data",
  "review-exports",
  "journey-photos",
  "work",
  "scratch",
  "tmp",
]);

const SKIP_FALLBACK_DIRECTORIES = new Set([
  ".git",
  ".next",
  "node_modules",
  "coverage",
  "out",
  "dist",
]);

const FORBIDDEN_FILENAME_PATTERNS: ReadonlyArray<{
  id: string;
  pattern: RegExp;
}> = [
  { id: "environment-file", pattern: /(^|\/)\.env(?:\..+)?$/i },
  { id: "private-key-file", pattern: /\.(?:pem|key|p12|pfx)$/i },
  { id: "recovery-key", pattern: /recovery[\s_-]*key/i },
  { id: "credit-summary", pattern: /credit[\s_-]*summary/i },
  {
    id: "founder-named-document",
    pattern: /_(?:Caitlin_Hudson|Stuart_Fraass|Frances_Fraass)\.[^/]+$/i,
  },
  { id: "ssn", pattern: /(^|[\/_\-.])ssn([\/_\-.]|$)/i },
  { id: "social-security", pattern: /social[_\s-]*security/i },
  { id: "passport", pattern: /passport/i },
  { id: "drivers-license", pattern: /driver'?s?[_\s-]*licen[cs]e/i },
  { id: "tax-return", pattern: /tax[_\s-]*return/i },
  { id: "bank-statement", pattern: /bank[_\s-]*statement/i },
];

function normalizePath(filePath: string): string {
  return filePath.replaceAll("\\", "/").replace(/^\.\//, "");
}

function fallbackWorkspacePaths(root: string): string[] {
  const paths: string[] = [];

  function walk(current: string): void {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const absolute = path.join(current, entry.name);
      const relative = normalizePath(path.relative(root, absolute));
      if (entry.isDirectory()) {
        if (SKIP_FALLBACK_DIRECTORIES.has(entry.name)) continue;
        walk(absolute);
      } else if (entry.isFile()) {
        paths.push(relative);
      }
    }
  }

  walk(root);
  return paths;
}

function resolveCandidatePaths(root: string): {
  source: "gcloud-upload-manifest" | "workspace-fallback";
  paths: string[];
} {
  const result = spawnSync("gcloud", ["meta", "list-files-for-upload", "."], {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

  if (!result.error && result.status === 0) {
    return {
      source: "gcloud-upload-manifest",
      paths: result.stdout
        .split(/\r?\n/)
        .map(normalizePath)
        .filter(Boolean),
    };
  }

  return {
    source: "workspace-fallback",
    paths: fallbackWorkspacePaths(root),
  };
}

function main(): void {
  const root = process.cwd();
  const ignorePath = path.join(root, ".gcloudignore");
  if (!existsSync(ignorePath)) {
    throw new Error(".gcloudignore is missing; refusing Cloud Build upload.");
  }

  const ignoreText = readFileSync(ignorePath, "utf8");
  const missingRules = REQUIRED_IGNORE_RULES.filter(
    (rule) => !ignoreText.split(/\r?\n/).includes(rule)
  );
  const manifest = resolveCandidatePaths(root);
  const findings: Array<{ path: string; reason: string }> = [];

  for (const candidate of manifest.paths) {
    const segments = normalizePath(candidate).split("/");
    const forbiddenDirectory = segments.find((segment) =>
      FORBIDDEN_DIRECTORIES.has(segment)
    );
    if (forbiddenDirectory) {
      findings.push({
        path: candidate,
        reason: `forbidden-directory:${forbiddenDirectory}`,
      });
      continue;
    }

    const matchedPattern = FORBIDDEN_FILENAME_PATTERNS.find(({ pattern }) =>
      pattern.test(candidate)
    );
    if (matchedPattern) {
      findings.push({ path: candidate, reason: matchedPattern.id });
    }
  }

  const ok = missingRules.length === 0 && findings.length === 0;
  console.log(
    JSON.stringify(
      {
        ok,
        gate: "verify-cloud-build-upload-context-v1",
        authority: ["TECH-SEC-001", "TECH-TEST-001"],
        manifestSource: manifest.source,
        inspectedPathCount: manifest.paths.length,
        missingIgnoreRules: missingRules,
        findings,
        message: ok
          ? "Cloud Build upload context is safe."
          : "Cloud Build upload context rejected; correct all redacted path findings before submission.",
      },
      null,
      2
    )
  );

  process.exit(ok ? 0 : 1);
}

try {
  main();
} catch (error) {
  console.error(
    JSON.stringify(
      {
        ok: false,
        gate: "verify-cloud-build-upload-context-v1",
        error: error instanceof Error ? error.message : "unknown setup error",
      },
      null,
      2
    )
  );
  process.exit(1);
}
