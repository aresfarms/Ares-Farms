import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const dockerfile = readFileSync("scanner/Dockerfile", "utf8");

assert.match(
  dockerfile,
  /^FROM clamav\/clamav-debian:1\.4\.5$/m,
  "Scanner must use the official security-patched ClamAV 1.4.5 image.",
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

console.log(
  "verify:scanner-image-policy PASS — official ClamAV 1.4.5 engine pin, build-time version assertion, and fresh signatures are enforced.",
);
