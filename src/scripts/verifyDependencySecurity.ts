import { spawnSync } from "node:child_process";

import exceptionJson from "../../config/security/dependency-advisory-exceptions.json";

type AuditAdvisory = Readonly<{
  source: number;
  title: string;
  url: string;
  severity: string;
}>;

type AuditReport = Readonly<{
  vulnerabilities: Record<string, Readonly<{
    name: string;
    severity: string;
    via: Array<string | AuditAdvisory>;
  }>>;
  metadata: Readonly<{
    vulnerabilities: Readonly<{ total: number }>;
  }>;
}>;

type DependencyException = Readonly<{
  source: number;
  ghsa: string;
  package: string;
  severity: string;
  title: string;
}>;

function audit(args: string[]): AuditReport {
  const result = spawnSync("npm", ["audit", "--json", ...args], {
    cwd: process.cwd(),
    encoding: "utf8",
    maxBuffer: 4 * 1024 * 1024,
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.error) throw result.error;
  if (!result.stdout.trim()) {
    throw new Error(`npm audit produced no JSON: ${result.stderr.trim() || "unknown error"}`);
  }
  return JSON.parse(result.stdout) as AuditReport;
}

const production = audit(["--omit=dev"]);
if (production.metadata.vulnerabilities.total !== 0) {
  throw new Error(`Production dependency audit contains ${production.metadata.vulnerabilities.total} advisory finding(s).`);
}

const full = audit([]);
const actual = Object.values(full.vulnerabilities).flatMap((vulnerability) =>
  vulnerability.via
    .filter((via): via is AuditAdvisory => typeof via !== "string")
    .map((via) => ({
      source: via.source,
      ghsa: via.url.split("/").pop() || "",
      package: vulnerability.name,
      severity: via.severity,
      title: via.title,
    }))
);
const expected: readonly DependencyException[] = exceptionJson.exceptions;
const expectedSources = new Set(expected.map((entry) => entry.source));
const actualSources = new Set(actual.map((entry) => entry.source));
const mismatches: string[] = [];

for (const entry of actual) {
  const exception = expected.find((candidate) => candidate.source === entry.source);
  if (!exception) {
    mismatches.push(`Unapproved advisory ${entry.source} (${entry.package}, ${entry.severity})`);
    continue;
  }
  if (
    exception.ghsa !== entry.ghsa ||
    exception.package !== entry.package ||
    exception.severity !== entry.severity ||
    exception.title !== entry.title
  ) {
    mismatches.push(`Approved advisory metadata changed for ${entry.source}`);
  }
}
for (const entry of expected) {
  if (!actualSources.has(entry.source)) mismatches.push(`Stale exception no longer present: ${entry.source}`);
}
if (actualSources.size !== expectedSources.size || full.metadata.vulnerabilities.total !== expected.length) {
  mismatches.push(
    `Audit count differs: npm=${full.metadata.vulnerabilities.total}, approved=${expected.length}`
  );
}

const reviewDeadline = new Date(`${exceptionJson.reviewBy}T23:59:59.999Z`);
if (
  expected.length > 0 &&
  (!Number.isFinite(reviewDeadline.getTime()) || Date.now() > reviewDeadline.getTime())
) {
  mismatches.push(`Dependency advisory exception review expired on ${exceptionJson.reviewBy}`);
}

console.log(JSON.stringify({
  ok: mismatches.length === 0,
  productionAdvisories: production.metadata.vulnerabilities.total,
  developmentAdvisories: actual.map((entry) => ({
    source: entry.source,
    ghsa: entry.ghsa,
    package: entry.package,
    severity: entry.severity,
  })),
  reviewBy: exceptionJson.reviewBy,
  mismatches,
}, null, 2));

if (mismatches.length > 0) process.exitCode = 1;
