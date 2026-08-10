import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const dockerfile = readFileSync("scanner/Dockerfile", "utf8");

assert.match(
  dockerfile,
  /^FROM clamav\/clamav-debian:1\.4\.5 AS clamav-builder$/m,
  "Scanner build stage must use the official security-patched ClamAV 1.4.5 image.",
);
assert.match(
  dockerfile,
  /clamd --version \| grep -F 'ClamAV 1\.4\.5'/,
  "Scanner build must assert the engine version.",
);
assert.match(
  dockerfile,
  /freshclam --foreground --stdout/,
  "Scanner image must refresh malware definitions at build time.",
);
assert.doesNotMatch(
  dockerfile,
  /apt-get install[^\n]*\bclamav\b/,
  "Scanner must not fall back to the stale distribution ClamAV package.",
);
assert.match(
  dockerfile,
  /^FROM gcr\.io\/distroless\/python3-debian13@sha256:[a-f0-9]{64}$/m,
  "Scanner runtime must use a digest-pinned distroless Python base.",
);
assert.match(
  dockerfile,
  /^USER 65532:65532$/m,
  "Scanner runtime must use the fixed distroless non-root identity.",
);

console.log(
  "verify:scanner-image-policy PASS — patched ClamAV build stage, fresh signatures, digest-pinned distroless runtime, and fixed non-root identity are enforced.",
);
