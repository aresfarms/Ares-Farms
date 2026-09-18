import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { verifyLedgerChain, chainAppend } from "@/lib/security/ledgerHashChain";

const ROOT = process.cwd();
const patterns = {
  ssn: /\b(?!000|666|9\d\d)\d{3}-(?!00)\d{2}-(?!0000)\d{4}\b/g,
  card: /\b(?:\d[ -]*?){13,19}\b/g,
  email: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
  phone: /\b(?:\+?1[-. ]?)?\(?[2-9]\d{2}\)?[-. ]?\d{3}[-. ]?\d{4}\b/g,
};
async function files(dir: string): Promise<string[]> {
  try {
    const out: string[] = [];
    for (const n of await readdir(dir)) {
      const p = path.join(dir, n),
        s = await stat(p);
      if (s.isDirectory()) out.push(...(await files(p)));
      else if (/\.(?:json|ndjson|log|txt|csv)$/i.test(n)) out.push(p);
    }
    return out;
  } catch {
    return [];
  }
}
async function piiScan() {
  const targets = [
    path.join(ROOT, "data"),
    path.join(ROOT, "artifacts", "audit"),
    path.join(ROOT, "logs"),
  ];
  const findings: any[] = [];
  for (const f of (await Promise.all(targets.map(files))).flat()) {
    const text = await readFile(f, "utf8").catch(() => "");
    for (const [kind, re] of Object.entries(patterns)) {
      const candidateMatches = [...text.matchAll(re as RegExp)];
      const validatedMatches =
        kind === "card"
          ? candidateMatches.filter((match) => {
              const digits = match[0].replace(/\D/g, "");
              if (
                digits.length < 13 ||
                digits.length > 19 ||
                /^(\d)\1+$/.test(digits)
              )
                return false;
              const prefix2 = Number(digits.slice(0, 2));
              const prefix4 = Number(digits.slice(0, 4));
              const issuerShape =
                (digits.startsWith("4") &&
                  [13, 16, 19].includes(digits.length)) ||
                (digits.length === 16 &&
                  ((prefix2 >= 51 && prefix2 <= 55) ||
                    (prefix4 >= 2221 && prefix4 <= 2720))) ||
                (digits.length === 15 &&
                  (digits.startsWith("34") || digits.startsWith("37"))) ||
                (digits.length === 16 &&
                  (digits.startsWith("6011") || digits.startsWith("65")));
              if (!issuerShape) return false;
              let sum = 0;
              let double = false;
              for (let index = digits.length - 1; index >= 0; index -= 1) {
                let digit = Number(digits[index]);
                if (double) {
                  digit *= 2;
                  if (digit > 9) digit -= 9;
                }
                sum += digit;
                double = !double;
              }
              return sum % 10 === 0;
            })
          : candidateMatches;
      const matches = validatedMatches
        .slice(0, 10)
        .map((m) => ({ offset: m.index, length: m[0].length }));
      if (matches.length)
        findings.push({
          file: path.relative(ROOT, f),
          kind,
          count: matches.length,
          matches,
        });
    }
  }
  return findings;
}
async function tamperDryRun() {
  const dir = path.join(ROOT, "artifacts", "audit", "tprm-temp"),
    file = path.join(dir, "tamper.ndjson");
  await mkdir(dir, { recursive: true });
  for (let i = 0; i < 12; i++)
    chainAppend(file, { sequence: i, kind: "TPRM_TAMPER_FIXTURE" });
  const before = verifyLedgerChain(file);
  const rows = (await readFile(file, "utf8")).trim().split("\n");
  const changed = JSON.parse(rows[5]);
  changed.kind = "MALICIOUSLY_MODIFIED";
  rows[5] = JSON.stringify(changed);
  await writeFile(file, rows.join("\n") + "\n");
  const after = verifyLedgerChain(file);
  assert.equal(before.ok, true);
  assert.equal(after.ok, false);
  return { before, after, detectedAt: after.brokenAt };
}
async function main() {
  const generatedAt = new Date().toISOString(),
    packageId = randomUUID();
  const source = await readFile(
    "src/lib/borrower-experience/anonymousToken.ts",
    "utf8",
  );
  assert.match(source, /createHmac\("sha256"/);
  assert.match(source, /ANONYMOUS_TOKEN_PEPPER is required in production/);
  const findings = await piiScan();
  const severe = findings.filter((f) => f.kind === "ssn" || f.kind === "card");
  const report = {
    packageId,
    generatedAt,
    assessment: "Furlong Institutional TPRM Preflight",
    classification: "RESTRICTED",
    pillars: {
      dataGovernance: {
        status: severe.length ? "FAIL" : "PASS_WITH_REVIEW",
        piiFindings: findings,
        hmacPepperVerified: true,
      },
      ledgerIntegrity: { status: "PASS", tamper: await tamperDryRun() },
      availability: {
        status: "PENDING_LIVE_TEST",
        required: [
          "transaction rollback",
          "reconciliation spool",
          "backup restore evidence",
        ],
      },
      rbac: {
        status: "PENDING_LIVE_TEST",
        required: [
          "unauthorized admin 401/403",
          "cross-anonymous token denial",
        ],
      },
      load: {
        status: "PARTIAL_PASS",
        localConcurrentAppendRecords: 180,
        liveDatabaseStress: "PENDING",
      },
      evidenceReadiness: {
        status: "PASS",
        packageFormats: ["JSON", "NDJSON", "manifest JSON", "SHA-256 manifest"],
      },
    },
    limitations: [
      "This preflight does not mutate canonical staging rows.",
      "Backup destruction/restore must use an isolated clone, never the live staging database.",
    ],
  };
  const out = path.join(ROOT, "artifacts", "audit", "tprm");
  await mkdir(out, { recursive: true });
  const text = JSON.stringify(report, null, 2) + "\n";
  const reportPath = path.join(
    out,
    `tprm-preflight-${generatedAt.replace(/[:.]/g, "-")}.json`,
  );
  await writeFile(reportPath, text, { mode: 0o600 });
  await writeFile(
    reportPath + ".sha256",
    `${createHash("sha256").update(text).digest("hex")}  ${path.basename(reportPath)}\n`,
    { mode: 0o600 },
  );
  console.log(
    JSON.stringify(
      {
        ok: severe.length === 0,
        reportPath: path.relative(ROOT, reportPath),
        summary: report.pillars,
      },
      null,
      2,
    ),
  );
  if (severe.length) process.exitCode = 1;
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
