# Development dependency advisory exception

Production dependencies must remain free of known npm advisories. Development
dependencies may not be silently ignored: any temporary exception is exact,
low-severity only, time-bounded, and enforced by
`npm run verify:dependency-security`.

As of 2026-07-22, the only approved exception is
`GHSA-4x5r-pxfx-6jf8` in transitive `@babel/core`. It is reached through the
Next.js ESLint toolchain and is not installed in the production dependency
set. The available patched major is Babel 8, while the current
`eslint-plugin-react-hooks` dependency requires Babel 7. The repository does
not use this toolchain to process untrusted source maps.

The exception expires for review on 2026-08-21. Verification fails if:

- any production advisory appears;
- another development advisory appears;
- the approved advisory changes package, ID, title, or severity;
- the advisory disappears but the stale exception remains; or
- the review deadline passes.

The correct remediation is to remove the exception once the Next.js ESLint
dependency chain accepts a patched Babel release. Do not force Babel 8 through
an incompatible peer graph merely to make the audit output cosmetically green.
