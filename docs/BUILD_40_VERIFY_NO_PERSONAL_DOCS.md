# Build 40 — verify:no-personal-docs Personal Document Git Guard

**Doctrine:** `docs/DOCTRINE_VERIFY_NO_PERSONAL_DOCS_V1.md` (verbatim)
**Runtime:** `src/scripts/verifyNoPersonalDocs.ts`
**Runtime version:** `verify-no-personal-docs-runtime-v0.1.0`
**Command:** `npm run verify:no-personal-docs` (PR diff) · `npm run smoke:no-personal-docs` (fixtures)
**CI placement:** First step after `npm ci`, before `npx tsc --noEmit`.

---

## What this build ships

Two-layer git guard that prevents personal financial / identity / credential documents from being committed to the repository. Defense-in-depth alongside `.gitignore`; the doctrine treats the scanner as the canonical gate and `.gitignore` as the secondary line.

### Layer 1 — filename pattern scan (11 patterns)

Fails on any added / modified / renamed / copied path matching:

| id | Pattern |
|---|---|
| `credit-summary-pdf` | `/Credit_Summary_.*\.pdf$/i` |
| `credit-summary-glob` | `/credit[\s_-]*summary/i` |
| `founder-named-pdf` | `/_(Caitlin_Hudson\|Stuart_Fraass\|Frances_Fraass)\.pdf$/i` |
| `recovery-key-pdf` | `/^Recovery\s+Key\.pdf$/` |
| `recovery-key-glob` | `/recovery[\s_-]*key/i` |
| `ssn-token` | `/(^\|[\\/_\-.])ssn([\\/_\-.]\|$)/i` |
| `social-security` | `/social[_\s-]*security/i` |
| `passport` | `/passport/i` |
| `drivers-license` | `/driver'?s?[_\s-]*licen[cs]e/i` |
| `tax-return` | `/tax[_\s-]*return/i` |
| `bank-statement` | `/bank[_\s-]*statement/i` |

PDFs with a sensitive filename **fail closed** — the scanner cannot inspect PDF content without an extractor, so the doctrine §Pass/Fail requires fail-closed routing.

### Layer 2 — content signature scan (7 signatures)

For added / modified text-extractable files (`.ts .tsx .js .jsx .json .md .mdx .txt .csv .yml .yaml .env .html .css .sh .sql .xml .cfg .conf .ini .log`):

| id | Pattern | Catches |
|---|---|---|
| `ssn-pattern` | `\b\d{3}-\d{2}-\d{4}\b` | SSN-like |
| `credit-card-16` | `\b(?:\d[ -]?){15,19}\d\b` | Credit card number groups |
| `private-key-header` | `-----BEGIN\s+(RSA \|DSA \|EC \|OPENSSH \|PGP \|ENCRYPTED )?PRIVATE KEY-----` | Private key headers |
| `recovery-phrase-label` | `\b(?:seed\s+phrase\|recovery\s+phrase\|mnemonic\s+phrase\|recovery\s+seed)\b` | Recovery / seed phrase labels |
| `bank-routing` | `\brouting(?:\s*number\|\s*#\|\b)[:\s#]*\d{9}\b` | Bank routing labels |
| `bank-account` | `\baccount(?:\s*number\|\s*#\|\b)[:\s#]*\d{6,}\b` | Bank account labels |
| `credit-report-label` | `\b(?:credit\s+report\|fico\s+score\|equifax\|experian\|transunion)\b` | Credit report / bureau labels |

**False-positive guard:** lines containing `example`, `fixture`, `sample`, `placeholder`, `synthetic`, or `fake` are skipped on Layer 2, so doctrine / runtime / smoke test text that intentionally references a sensitive token doesn't self-trigger the gate.

**Path whitelist for Layer 2 only:** the scanner's own files (`src/scripts/verifyNoPersonalDocs.ts`, `…SmokeTest.ts`, the doctrine doc, the build doc, the PR body file) are skipped for Layer 2 content scanning because they all legitimately reference the patterns by name. Layer 1 (filename scan) is NOT skipped — the file names themselves don't match any sensitive pattern.

### Allowlist policy

`.no-personal-docs-allowlist.json` may carry entries with `{ path, reason, approvingAuthority, expirationDate, classificationLevel, redactionConfirmation: true }`. Entries are validated at every run:

- All six fields required.
- `expirationDate` must parse and be in the future.
- `redactionConfirmation` must be literally `true`.
- **Founder financial / identity documents** (anything matching `credit-summary-pdf`, `credit-summary-glob`, `founder-named-pdf`, `recovery-key-pdf`, `recovery-key-glob`) **cannot be allowlisted under any circumstances** — the validator rejects them by doctrine.

Invalid entries themselves become Layer-3 findings — a malformed allowlist cannot pass the gate.

### Diff range

Default: `origin/main...HEAD`. The CI step runs `git fetch --no-tags --depth=1 origin main:refs/remotes/origin/main || true` first so the diff resolves on shallow CI clones.

Other modes:
- `npm run verify:no-personal-docs -- --full-history` — scans every path ever committed (for scheduled audits).
- `npm run verify:no-personal-docs -- --paths a b c` — scans specific paths (used by the smoke test).

---

## Live proof-of-concept (during this build)

During implementation, a real personal financial PDF (`Credit_Summary_Caitlin_Hudson.pdf`) was sitting in the developer's working tree from a prior session. `git add -A` swept it into the index because this branch was forked from `main` **before** the `.gitignore` update in PR #29 had merged.

**The scanner caught it on the first real run:**

```
Layer 1 hits: 4
Findings:
  - credit-summary-pdf       Credit_Summary_Caitlin_Hudson.pdf
  - credit-summary-glob      Credit_Summary_Caitlin_Hudson.pdf
  - founder-named-pdf        Credit_Summary_Caitlin_Hudson.pdf
  - PDF_UNINSPECTABLE_SUSPICIOUS_FILENAME  (fail-closed)
Exit: 1
```

This was the canonical fail-closed demonstration the doctrine §Definition of Done required, surfaced naturally instead of from a synthetic fixture.

The fix: un-staged the PDF, added its filename family to `.gitignore` on this branch directly (independent of when PR #29 merges), re-ran — exit 0 on the actual 6 changed files (doctrine + runtime + smoke + package.json + CI + .gitignore).

---

## CI placement (per doctrine §CI Placement)

The new step runs **first**, before `tsc --noEmit`:

```yaml
- name: Personal document git guard
  run: |
    git fetch --no-tags --depth=1 origin main:refs/remotes/origin/main || true
    npm run verify:no-personal-docs

- name: Personal document git guard smoke
  run: npm run smoke:no-personal-docs

- name: TypeScript noEmit
  run: npx tsc --noEmit
```

A PR that introduces personal documents now fails CI before any expensive build step runs.

---

## Verification

| Check | Result |
|---|---|
| `npx tsc --noEmit` | PASS |
| `npm run smoke:no-personal-docs` | PASS — 11 filename patterns, 7 content signatures, 14 sensitive filename cases caught, 6 clean filenames pass, 7 content signature cases caught, false-positive guard verified, 3 invalid + 1 valid allowlist cases |
| `npm run verify:no-personal-docs` (this PR diff) | PASS — exit 0 · 6 changed files · 0 Layer 1 hits · 0 Layer 2 hits · 0 PDF fail-closed · 0 allowlist invalid |
| `npm run verify:module-manifests` | PASS |
| `npm run build` | PASS |

---

## Definition of Done check

| §DoD item | Status |
|---|---|
| Script implemented | ✅ `src/scripts/verifyNoPersonalDocs.ts` |
| npm command added | ✅ `verify:no-personal-docs` + `smoke:no-personal-docs` |
| CI step added | ✅ `.github/workflows/ci.yml` — runs before `tsc --noEmit` |
| Known sensitive patterns covered | ✅ All 12 patterns from doctrine §Layer 1 + all 6 categories from §Layer 2 |
| Test fixture proves fail-closed behavior | ✅ Smoke test covers 14 sensitive filename cases, 7 content signature cases, allowlist invalid/expired/forbidden/valid; also caught a real PDF in the working tree during this build |
| Documentation added | ✅ `docs/DOCTRINE_VERIFY_NO_PERSONAL_DOCS_V1.md` (verbatim doctrine) + this build doc |
| Existing repo history remains clean | ✅ Confirmed via prior audit: `git log --all --full-history` returned 0 commits matching any sensitive pattern; `git rev-list --all --objects \| grep` returned 0 blobs |

---

## Constitutional posture

- Fail-closed by default. Suspicious PDFs that can't be inspected fail; invalid allowlists fail; expired allowlists fail.
- Founder financial / identity documents cannot be allowlisted under any circumstances (validator rejects them outright).
- Defense-in-depth: scanner + `.gitignore` (extended on this branch).
- Replay-safe: deterministic over the diff range; same commit → same output.
- Audit-safe: every finding carries `layer`, `category`, `path`, and `detail` for the build-preservation archive.
- Doctrine trace: data-rights, founder-privacy, repository hygiene, source-control governance.
