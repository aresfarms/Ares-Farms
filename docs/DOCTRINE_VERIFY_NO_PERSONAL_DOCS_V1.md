# verify:no-personal-docs — Personal Document Git Guard

## Purpose

Prevent founder financial, identity, recovery, credential, or private personal documents from being committed to the repository.

This control supports the Furlong data-rights and privacy posture by enforcing that sensitive personal documents are not stored in source control.

---

## Command

```bash
npm run verify:no-personal-docs
```

---

## Scope

Runs against the PR diff range:

```bash
origin/main...HEAD
```

Scheduled audit may additionally run against full history and dangling blobs.

---

## Layer 1 — Filename Pattern Scan

Fail if any added, modified, renamed, or copied file path matches sensitive patterns, including:

```text
Credit_Summary_*.pdf
*_Caitlin_Hudson.pdf
*_Stuart_Fraass.pdf
*_Frances_Fraass.pdf
Recovery Key.pdf
*recovery*key*
*credit*summary*
*ssn*
*social_security*
*passport*
*drivers_license*
*tax_return*
*bank_statement*
```

---

## Layer 2 — Content Signature Scan

Fail if newly added or modified text-extractable files contain high-risk signatures, including:

```text
SSN-like pattern: ###-##-####
Credit card-like number groups
Private key headers
Recovery seed phrases
Bank routing/account labels
Credit report labels
```

For PDFs, attempt text extraction where feasible. If extraction fails on a suspicious filename, fail closed or require explicit allowlist approval.

---

## Optional Tooling

Preferred:

- gitleaks
- trufflehog

Fallback:

- custom Node/TS scanner
- grep-based scan over PR-changed files
- PDF text extraction where available

---

## Pass / Fail

PASS only if:

- no sensitive filenames detected
- no sensitive content signatures detected
- no unallowlisted suspicious PDF detected

FAIL if:

- any sensitive path appears in PR diff
- any sensitive content signature appears
- any suspicious PDF cannot be inspected
- any allowlist entry is missing owner, reason, and expiration

---

## Allowlist Rule

Allowlisting is discouraged.

If unavoidable, an allowlist entry must include:

- file path
- reason
- approving authority
- expiration date
- classification level
- redaction confirmation

No permanent allowlist for founder financial or identity documents.

---

## CI Placement

Run before build-heavy gates.

Recommended order:

1. verify:no-personal-docs
2. typecheck
3. governance / module verification
4. build

---

## Scheduled Full-History Audit

Run periodically, not on every PR:

```bash
git log --all --full-history --oneline -- "<patterns>"
git rev-list --all --objects | grep -iE "<patterns>"
git fsck --lost-found
```

---

## Doctrine Trace

This control supports:

- Data minimization
- Data sovereignty
- Data-rights transparency
- Founder privacy protection
- No hidden data exposure
- Repository hygiene
- Source-control governance

---

## Definition of Done

- Script implemented
- npm command added
- CI step added
- Known sensitive patterns covered
- Test fixture proves fail-closed behavior
- Documentation added
- Existing repo history remains clean
