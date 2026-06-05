import {
  SENSITIVE_CONTENT_SIGNATURES,
  SENSITIVE_FILENAME_PATTERNS,
  VERIFY_NO_PERSONAL_DOCS_DOC_REF,
  VERIFY_NO_PERSONAL_DOCS_RUNTIME_VERSION,
  scanFileContent,
  scanFilename,
  scanPaths,
  validateAllowlistEntry,
} from "@/scripts/verifyNoPersonalDocs";

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function main() {
  assert(
    VERIFY_NO_PERSONAL_DOCS_RUNTIME_VERSION ===
      "verify-no-personal-docs-runtime-v0.2.0",
    "Runtime version must match canonical seal (post Build 40 hardening)."
  );
  assert(
    VERIFY_NO_PERSONAL_DOCS_DOC_REF ===
      "docs/DOCTRINE_VERIFY_NO_PERSONAL_DOCS_V1.md",
    "Doc ref must point at the canonical doctrine doc."
  );

  // ────────────────────────────────────────────────────────────────────
  // Layer 1 — sensitive filenames MUST be caught
  // ────────────────────────────────────────────────────────────────────
  const sensitiveFilenames = [
    "Credit_Summary_Anonymous.pdf",
    "Credit_Summary_Caitlin_Hudson.pdf",
    "annual_credit_summary.pdf",
    "Some_Doc_Caitlin_Hudson.pdf",
    "Some_Doc_Stuart_Fraass.pdf",
    "Some_Doc_Frances_Fraass.pdf",
    "Recovery Key.pdf",
    "wallet_recovery_key.txt",
    "ssn.txt",
    "my_social_security_card.pdf",
    "Passport_scan.jpg",
    "drivers_license.png",
    "2025_tax_return.pdf",
    "Chase_bank_statement.pdf",
  ];
  for (const p of sensitiveFilenames) {
    const hits = scanFilename(p);
    assert(
      hits.length > 0,
      `Layer 1 must catch sensitive filename "${p}" — got 0 hits.`
    );
  }

  // ────────────────────────────────────────────────────────────────────
  // Layer 1 — innocuous paths MUST NOT be caught
  // ────────────────────────────────────────────────────────────────────
  const cleanFilenames = [
    "README.md",
    "docs/DOCTRINE_PUBLIC_ALPHA_DEFINITION_V1.md",
    "src/lib/runtime/classificationRuntime.ts",
    "package.json",
    "docs/governance/VOL_VII_OPERATIONAL_ANNEX.json",
    "src/scripts/humanAuthorityRegistryCli.ts",
  ];
  for (const p of cleanFilenames) {
    const hits = scanFilename(p);
    assert(
      hits.length === 0,
      `Clean filename "${p}" must NOT trigger Layer 1 — got ${hits.length} hits: ${JSON.stringify(hits)}`
    );
  }

  // ────────────────────────────────────────────────────────────────────
  // Layer 2 — content signatures MUST be caught
  // ────────────────────────────────────────────────────────────────────
  const cases: Array<{ id: string; text: string }> = [
    { id: "ssn-pattern", text: "borrower id: 123-45-6789 on file" },
    { id: "credit-card-16", text: "card number 4111 1111 1111 1111 detected" },
    {
      id: "private-key-header",
      text: "-----BEGIN RSA PRIVATE KEY-----\nABCD...",
    },
    {
      id: "recovery-phrase-label",
      text: "this is the recovery seed phrase to the wallet",
    },
    { id: "credit-report-label", text: "Equifax credit report attached" },
    { id: "bank-routing", text: "Routing Number: 011000015" },
    { id: "bank-account", text: "Account Number: 1234567890" },
  ];

  for (const c of cases) {
    const hits = scanFileContent("src/synthetic.txt", c.text);
    assert(
      hits.some((h) => h.signatureId === c.id),
      `Layer 2 must catch ${c.id} on "${c.text}" — got: ${JSON.stringify(hits.map((h) => h.signatureId))}`
    );
    // Build 40 hardening §4: no excerpt / no matched-text fields on
    // the hit. The hit must carry only safe fields.
    for (const h of hits) {
      assert(
        !("excerpt" in (h as Record<string, unknown>)),
        "ContentHit must NOT carry an 'excerpt' field per Build 40 hardening §4 (never print matched secrets)."
      );
      assert(
        typeof h.signatureLabel === "string" && h.signatureLabel.length > 0,
        "ContentHit must carry a signatureLabel."
      );
      assert(
        typeof h.lineNumber === "number" && h.lineNumber > 0,
        "ContentHit must carry a positive lineNumber."
      );
    }
  }

  // False-positive guard: lines explicitly tagged with the word
  // "example/fixture/sample/placeholder/synthetic/fake" are skipped to
  // avoid blocking doctrine / test text that intentionally references
  // a sensitive token.
  const guarded = scanFileContent(
    "src/synthetic.txt",
    "Routing Number: 011000015 (example value)"
  );
  assert(
    !guarded.some((h) => h.signatureId === "bank-routing"),
    "False-positive guard must skip lines tagged with 'example'-like words."
  );

  // ────────────────────────────────────────────────────────────────────
  // Layer 2 — clean content MUST NOT be caught
  // ────────────────────────────────────────────────────────────────────
  const cleanContent = [
    "version: 0.1.0",
    'message: "Build 38 Public Alpha Profile v1 — Customer Journey"',
    "module-id: governance-build-self-report",
    "module-number: 42",
    "date: 2026-06-04",
  ].join("\n");
  const cleanHits = scanFileContent("src/sample.md", cleanContent);
  assert(
    cleanHits.length === 0,
    `Clean content must NOT trigger Layer 2 — got ${cleanHits.length} hits: ${JSON.stringify(cleanHits)}`
  );

  // ────────────────────────────────────────────────────────────────────
  // Allowlist — invalid entries must be rejected
  // ────────────────────────────────────────────────────────────────────
  const incomplete = validateAllowlistEntry({ path: "foo.txt" });
  assert(!incomplete.ok, "Allowlist entry missing fields must be rejected.");

  const expired = validateAllowlistEntry({
    path: "foo.txt",
    reason: "audit fixture",
    approvingAuthority: "Chief Governance Authority",
    expirationDate: "2020-01-01",
    classificationLevel: "RESTRICTED",
    redactionConfirmation: true,
  });
  assert(!expired.ok, "Expired allowlist entry must be rejected.");

  const forbidden = validateAllowlistEntry({
    path: "Credit_Summary_Caitlin_Hudson.pdf",
    reason: "audit fixture",
    approvingAuthority: "Chief Governance Authority",
    expirationDate: "2099-01-01",
    classificationLevel: "RESTRICTED",
    redactionConfirmation: true,
  });
  assert(
    !forbidden.ok,
    "Founder financial/identity document allowlist must be rejected per doctrine."
  );

  const validEntry = validateAllowlistEntry({
    path: "third-party/sample_with_test_fixtures.json",
    reason: "vendor test fixture; classification confirmed by audit",
    approvingAuthority: "Chief Governance Authority",
    expirationDate: "2099-01-01",
    classificationLevel: "RESTRICTED",
    redactionConfirmation: true,
  });
  assert(validEntry.ok, "Valid allowlist entry must pass validation.");

  // ────────────────────────────────────────────────────────────────────
  // Anti-vacuous-pass invariant (Build 40 hardening §5)
  // Empty paths must fail closed. Scanned-count > 0 is asserted
  // inside the gate, not in the CI log.
  // ────────────────────────────────────────────────────────────────────
  const vacuous = scanPaths([], [], "tree", "smoke: empty-paths");
  assert(
    vacuous.exitCode === 1,
    `scanPaths with 0 paths must exit 1 (anti-vacuous-pass invariant) — got ${vacuous.exitCode}.`
  );
  assert(
    vacuous.findings.some((f) => f.category === "SCAN_VACUOUS_NO_FILES"),
    "scanPaths with 0 paths must emit a SCAN_VACUOUS_NO_FILES finding."
  );
  assert(
    vacuous.scannedFileCount === 0,
    "Vacuous scan must report scannedFileCount = 0."
  );

  // A non-empty scan that finds nothing must still exit 0.
  const cleanScan = scanPaths(
    ["README.md", "package.json"],
    [],
    "tree",
    "smoke: clean-scan"
  );
  // (We don't read these files via scanPaths since it would try to
  // open them; instead we verify that scanPaths' OWN invariant
  // permits exit 0 only when paths > 0. The exitCode depends on
  // whether the content scan finds anything; the smoke fixture
  // checks the invariant gate, not the content of the repo.)
  assert(
    cleanScan.scannedFileCount === 2,
    `scanPaths must report 2 scanned files for ['README.md', 'package.json'] — got ${cleanScan.scannedFileCount}.`
  );
  assert(
    !cleanScan.findings.some((f) => f.category === "SCAN_VACUOUS_NO_FILES"),
    "Non-empty scan must NOT emit SCAN_VACUOUS_NO_FILES finding."
  );

  // ────────────────────────────────────────────────────────────────────
  // Registry coverage
  // ────────────────────────────────────────────────────────────────────
  assert(
    SENSITIVE_FILENAME_PATTERNS.length >= 11,
    `Must declare at least 11 filename patterns (per doctrine §Layer 1) — got ${SENSITIVE_FILENAME_PATTERNS.length}.`
  );
  assert(
    SENSITIVE_CONTENT_SIGNATURES.length >= 7,
    `Must declare at least 7 content signatures (per doctrine §Layer 2) — got ${SENSITIVE_CONTENT_SIGNATURES.length}.`
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        runtimeVersion: VERIFY_NO_PERSONAL_DOCS_RUNTIME_VERSION,
        docRef: VERIFY_NO_PERSONAL_DOCS_DOC_REF,
        filenamePatternCount: SENSITIVE_FILENAME_PATTERNS.length,
        contentSignatureCount: SENSITIVE_CONTENT_SIGNATURES.length,
        layer1SensitiveCasesTested: sensitiveFilenames.length,
        layer1CleanCasesTested: cleanFilenames.length,
        layer2CaseCount: cases.length,
        allowlistInvalidCasesTested: 3,
        allowlistValidCasesTested: 1,
        message: "verify:no-personal-docs smoke test passed.",
      },
      null,
      2
    )
  );
}

main();
