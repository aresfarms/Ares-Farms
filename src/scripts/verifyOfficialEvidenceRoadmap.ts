import assert from "node:assert/strict";
import fs from "node:fs";
import {
  OFFICIAL_EVIDENCE_ROADMAP_VERSION,
  OFFICIAL_EVIDENCE_SEQUENCE,
  assertRoadmapTransition,
  roadmapArtifactFor,
} from "../lib/governance/officialEvidenceRoadmap";

for (const step of OFFICIAL_EVIDENCE_SEQUENCE)
  assert.equal(
    fs.existsSync(roadmapArtifactFor(step)),
    true,
    `Roadmap artifact missing for ${step}: ${roadmapArtifactFor(step)}`,
  );

for (let index = 0; index < OFFICIAL_EVIDENCE_SEQUENCE.length; index++)
  assert.doesNotThrow(() =>
    assertRoadmapTransition({
      completed: OFFICIAL_EVIDENCE_SEQUENCE.slice(0, index),
      requested: OFFICIAL_EVIDENCE_SEQUENCE[index],
    }),
  );

assert.throws(() =>
  assertRoadmapTransition({
    completed: ["3Q_EXTERNAL_NOTIFICATION_CONNECTOR"],
    requested: "3W_EXTERNAL_NOTIFICATION_RETIREMENT",
  }),
);

const roadmap = fs.readFileSync("docs/BUILD_PHASE_ROADMAP.md", "utf8");
assert.match(roadmap, /Roadmap Hard Rule/);
assert.match(roadmap, /No implementation step may be skipped, reordered, or substituted/);

console.log(JSON.stringify({
  ok: true,
  rule: "OFFICIAL-EVIDENCE-ROADMAP-SEQUENCE-001",
  schemaVersion: OFFICIAL_EVIDENCE_ROADMAP_VERSION,
  sequence: OFFICIAL_EVIDENCE_SEQUENCE,
}, null, 2));
