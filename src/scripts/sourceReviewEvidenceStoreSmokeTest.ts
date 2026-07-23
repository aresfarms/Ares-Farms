import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  latestSourceReviewEvidence,
  recordSourceReviewEvidence,
  sourceReviewEvidenceFor,
} from "@/lib/governance/sourceReviewEvidenceStore";

function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}

const dir = mkdtempSync(path.join(tmpdir(), "furlong-source-review-"));
process.env.FURLONG_RUNTIME_STATE_DIR = dir;

try {
  const legal = recordSourceReviewEvidence({
    kind: "LEGAL_REVIEW_HOLD",
    sourceId: "county-gis",
    actorId: "smoke-legal-reviewer",
    reviewNote: "qualified review pending",
    replayRef: "smoke-legal",
  });
  const promotion = recordSourceReviewEvidence({
    kind: "PROMOTION_PACKET_HOLD",
    sourceId: "county-gis",
    actorId: "smoke-promotion-reviewer",
    reviewNote: "promotion remains blocked",
    replayRef: "smoke-promotion",
  });

  assert(legal.activationBlocked, "Legal evidence must remain activation-blocking.");
  assert(promotion.productionBlocked, "Promotion evidence must remain production-blocking.");
  assert(sourceReviewEvidenceFor("county-gis").length === 2, "Both records must persist.");
  assert(sourceReviewEvidenceFor("county-gis", "LEGAL_REVIEW_HOLD").length === 1, "Legal and promotion evidence must remain distinct.");
  assert(latestSourceReviewEvidence("county-gis", "LEGAL_REVIEW_HOLD")?.evidenceId === legal.evidenceId, "Latest legal evidence must survive reread.");
  assert(latestSourceReviewEvidence("county-gis", "PROMOTION_PACKET_HOLD")?.evidenceId === promotion.evidenceId, "Latest promotion evidence must survive reread.");

  
const readiness = recordSourceReviewEvidence({
  kind: "PRODUCTION_READINESS_HOLD",
  sourceId: "source-test-1",
  actorId: "test-readiness-reviewer",
  reviewNote: "readiness hold",
  replayRef: "replay-readiness-1",
});
assert(readiness.productionBlocked, "Readiness evidence must remain production blocked.");
assert(
  latestSourceReviewEvidence("source-test-1", "PRODUCTION_READINESS_HOLD")?.evidenceId ===
    readiness.evidenceId,
  "Latest readiness evidence must persist."
);


const activation = recordSourceReviewEvidence({
  kind: "CONTROLLED_PROMOTION_HOLD",
  sourceId: "source-test-1",
  actorId: "test-activation-reviewer",
  reviewNote: "activation hold",
  replayRef: "replay-activation-1",
});
assert(activation.productionBlocked, "Activation evidence must remain production blocked.");
assert(
  latestSourceReviewEvidence("source-test-1", "CONTROLLED_PROMOTION_HOLD")?.evidenceId ===
    activation.evidenceId,
  "Latest activation evidence must persist."
);

console.log(JSON.stringify({ ok: true, records: 4, activationBlocked: true, productionBlocked: true }, null, 2));
} finally {
  rmSync(dir, { recursive: true, force: true });
}
