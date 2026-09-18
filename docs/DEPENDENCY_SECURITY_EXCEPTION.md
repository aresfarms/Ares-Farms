# Development dependency advisory exception policy

Production dependencies must remain free of known npm advisories. Development
dependencies may not be silently ignored: any temporary exception is exact,
low-severity only, time-bounded, and enforced by
`npm run verify:dependency-security`.

As of 2026-08-06, there are no approved dependency-advisory exceptions. The
former `GHSA-4x5r-pxfx-6jf8` development-only exception was removed after the
dependency chain was updated to patched versions. Both production and full
dependency audits report zero known vulnerabilities.

Verification fails if:

- any production advisory appears;
- another development advisory appears;
- the approved advisory changes package, ID, title, or severity;
- the advisory disappears but the stale exception remains; or
- an active exception's review deadline passes.

Any future exception must remain exact, low-severity, development-only,
time-bounded, and documented here with a remediation owner and review date.
