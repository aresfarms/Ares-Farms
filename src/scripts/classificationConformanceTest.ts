import fs from "fs";
import path from "path";

import {
  classifyRecord,
  createClassificationMetadata,
  inheritClassification,
} from "@/lib/runtime/classificationRuntime";

/**
 * Classification Conformance Test
 *
 * Verifies classification runtime behavior, registry presence, inheritance,
 * and public-safe metadata posture.
 */

const repoRoot = process.cwd();

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function exists(pathname: string): boolean {
  return fs.existsSync(path.join(repoRoot, pathname));
}

function main() {
  assert(
    exists("src/db/schema/dataClassificationRegistry.ts"),
    "Classification registry schema is missing."
  );
  assert(
    exists("src/lib/runtime/classificationRuntime.ts"),
    "Classification runtime is missing."
  );

  const classified = classifyRecord(
    {
      status: "review-pending",
    },
    {
      classificationLevel: "CONFIDENTIAL",
      sensitivityScope: "borrower",
      replayRef: "classification-conformance",
    }
  );

  assert(
    classified.classification.classificationLevel === "CONFIDENTIAL",
    "Classification metadata was not attached."
  );
  assert(
    classified.classification.replayClassificationContext.replayRef ===
      "classification-conformance",
    "Classification replay reference missing."
  );

  const restricted = createClassificationMetadata({
    classificationLevel: "RESTRICTED",
    sensitivityScope: "security",
  });
  const inherited = inheritClassification(restricted, {
    classificationLevel: "PUBLIC",
  });

  assert(
    inherited.classificationLevel === "RESTRICTED",
    "Classification inheritance must not downgrade restricted records."
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        checkedAt: new Date().toISOString(),
        attachedLevel: classified.classification.classificationLevel,
        inheritedLevel: inherited.classificationLevel,
        message: "Classification conformance test passed.",
      },
      null,
      2
    )
  );
}

main();
