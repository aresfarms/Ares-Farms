import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";

import {
  PROPERTY_REPORT_RECOMMENDATION_VERSION,
  recommendPropertyReportLevel,
} from "@/lib/billing/propertyDecisionReportRecommendation";
import {
  publicOrderReportArtifactForCustomer,
  readPublicOrderReportArtifact,
} from "@/lib/billing/publicOrderReportArtifact";
import type {
  RankedPropertyScenario,
  ScenarioRankingPlan,
} from "@/lib/intelligence/scenarioRankingPlan";

function scenario(
  id: string,
  candidateRole: RankedPropertyScenario["candidateRole"],
  totalScore: number,
): RankedPropertyScenario {
  return {
    id,
    candidateRole,
    title: id,
    summary: id,
    totalScore,
    propertyFit: totalScore,
    marketViability: totalScore,
    financeability: totalScore,
    lifecycleResilience: totalScore,
    taxResilience: totalScore,
    taxAdjustment: 0,
    infrastructureResilience: totalScore,
    infrastructureAdjustment: 0,
    posture:
      totalScore >= 72
        ? "proceed-with-conditions"
        : totalScore >= 58
          ? "renegotiate"
          : "walk-away",
    reasons: [],
    conditions: [],
  };
}

function plan(
  status: ScenarioRankingPlan["status"],
  overallPosture: ScenarioRankingPlan["overallPosture"],
  scores = [76, 65, 55],
): ScenarioRankingPlan {
  return {
    status,
    overallPosture,
    scenarios: [
      scenario("single", "best-single-enterprise", scores[0]),
      scenario("mixed", "best-mixed-use", scores[1]),
      scenario("vision", "customer-vision", scores[2]),
    ],
    rankingRule: "same evidence",
    walkAwayGates: [],
  };
}

function verifyRecommendations() {
  const snapshot = recommendPropertyReportLevel({
    plan: plan("evidence-supported", "proceed-with-conditions"),
    priceKnown: true,
    customerVisionSelected: false,
    activeTransaction: false,
    materialEvidenceGapCount: 0,
  });
  assert.equal(snapshot.level, "SNAPSHOT_ONLY");
  assert.equal(snapshot.doNotBuyDecisionReportYet, true);

  const automated = recommendPropertyReportLevel({
    plan: plan("preliminary", "proceed-with-conditions"),
    priceKnown: true,
    customerVisionSelected: false,
    activeTransaction: false,
    materialEvidenceGapCount: 1,
  });
  assert.equal(automated.level, "PROPERTY_REPORT");

  const reviewed = recommendPropertyReportLevel({
    plan: plan("preliminary", "renegotiate", [66, 64, 60]),
    priceKnown: false,
    customerVisionSelected: true,
    activeTransaction: true,
    materialEvidenceGapCount: 5,
  });
  assert.equal(reviewed.level, "DECISION_REPORT");
  assert.equal(reviewed.doNotBuyDecisionReportYet, false);

  const clearWalkAway = recommendPropertyReportLevel({
    plan: plan("evidence-supported", "walk-away", [45, 40, 35]),
    priceKnown: true,
    customerVisionSelected: false,
    activeTransaction: false,
    materialEvidenceGapCount: 0,
  });
  assert.equal(clearWalkAway.level, "SNAPSHOT_ONLY");
  assert.match(clearWalkAway.headline, /Do not buy/i);

  const professionalFirst = recommendPropertyReportLevel({
    plan: plan("preliminary", "renegotiate"),
    priceKnown: false,
    customerVisionSelected: true,
    activeTransaction: true,
    materialEvidenceGapCount: 5,
    professionalEvidenceRequired: true,
  });
  assert.equal(professionalFirst.level, "PROFESSIONAL_SCOPE_FIRST");
  assert.equal(
    professionalFirst.version,
    PROPERTY_REPORT_RECOMMENDATION_VERSION,
  );
}

function verifyReportArtifactVisibility() {
  const base = {
    artifactId: "f63e8dc6-b67b-4fb1-ae12-4a828609aa8f",
    status: "VERIFIED",
    fileName: "decision-report.pdf",
    mimeType: "application/pdf",
    byteSize: 2048,
    expectedSha256: "a".repeat(64),
    verifiedSha256: "a".repeat(64),
    objectKey: "public-orders/order/report.pdf",
    storageProvider: "gcs-resumable-v1",
    createdAt: "2026-09-16T00:00:00.000Z",
    verifiedAt: "2026-09-16T00:01:00.000Z",
    availableAt: null,
    firstDownloadedAt: null,
    lastDownloadedAt: null,
    downloadCount: 0,
    verification: { malwareStatus: "clean" },
    sensitivity: { classificationLevel: "CONFIDENTIAL" },
  };
  assert(readPublicOrderReportArtifact({ reportArtifact: base }));
  assert.equal(
    publicOrderReportArtifactForCustomer({ reportArtifact: base }),
    null,
  );
  const available = publicOrderReportArtifactForCustomer({
    reportArtifact: {
      ...base,
      status: "AVAILABLE",
      availableAt: "2026-09-16T00:02:00.000Z",
    },
  });
  assert.equal(available?.sha256, "a".repeat(64));
  assert.equal(
    readPublicOrderReportArtifact({
      reportArtifact: { ...base, expectedSha256: "not-a-digest" },
    }),
    null,
  );
}

async function verifyAnchors() {
  const root = process.cwd();
  const [
    catalog,
    offer,
    professionalRoute,
    professionalForm,
    migration,
    store,
    agreement,
    checkout,
    artifactStore,
    artifactRoute,
    downloadRoute,
    fulfillmentUi,
    statusUi,
    cloudbuild,
  ] = await Promise.all([
    readFile(
      path.join(root, "src/lib/billing/publicProductCatalog.ts"),
      "utf8",
    ),
    readFile(
      path.join(root, "src/components/property/PropertyReportOfferPanel.tsx"),
      "utf8",
    ),
    readFile(
      path.join(root, "src/app/api/public/professional-services/route.ts"),
      "utf8",
    ),
    readFile(
      path.join(root, "src/components/public/ProfessionalServicesIntake.tsx"),
      "utf8",
    ),
    readFile(
      path.join(
        root,
        "src/lib/db/migrations/0065_public_order_upgrade_credit.sql",
      ),
      "utf8",
    ),
    readFile(path.join(root, "src/lib/billing/publicOrderStore.ts"), "utf8"),
    readFile(
      path.join(root, "src/lib/billing/publicOrderAgreement.ts"),
      "utf8",
    ),
    readFile(
      path.join(root, "src/app/api/public/purchases/checkout/route.ts"),
      "utf8",
    ),
    readFile(
      path.join(root, "src/lib/billing/publicOrderReportArtifact.ts"),
      "utf8",
    ),
    readFile(
      path.join(
        root,
        "src/app/api/internal/public-orders/report-artifact/route.ts",
      ),
      "utf8",
    ),
    readFile(
      path.join(root, "src/app/api/public/purchases/[orderId]/report/route.ts"),
      "utf8",
    ),
    readFile(
      path.join(root, "src/app/internal/public-orders/page.tsx"),
      "utf8",
    ),
    readFile(
      path.join(root, "src/components/public/PublicOrderStatus.tsx"),
      "utf8",
    ),
    readFile(path.join(root, "cloudbuild.yaml"), "utf8"),
  ]);

  assert(catalog.includes('"Furlong Property Report"'));
  assert(catalog.includes('"Furlong Property Decision Report"'));
  assert(catalog.includes("FURLONG_PROPERTY_REPORT_ARTIFACT_DELIVERY_ENABLED"));
  assert(offer.includes("Do not buy this report yet."));
  assert(offer.includes("within 30 days"));
  assert(professionalRoute.includes("paymentCaptured: false"));
  assert(professionalRoute.includes("universalDeliveryPromise: false"));
  assert(professionalForm.includes("no work is ordered"));
  assert(professionalForm.includes("does not provide or stamp"));
  assert(migration.includes("credit_source_order_id"));
  assert(migration.includes("amount_total_cents = unit_amount_cents"));
  assert(store.includes("samePropertyVerified: true"));
  assert(store.includes("singleUseReserved: true"));
  assert(agreement.includes("included scope, excluded scope"));
  assert(checkout.includes("AUTOMATED_ARTIFACT_NOT_READY"));
  assert(checkout.includes("No payment has been taken."));
  assert(artifactStore.includes("scanBytesForMalware"));
  assert(artifactStore.includes('classificationLevel: "CONFIDENTIAL"'));
  assert(artifactStore.includes("public_order.report_downloaded"));
  assert(artifactRoute.includes("rawBytesAcceptedByRoute: false"));
  assert(downloadRoute.includes("fetchObjectStream"));
  assert(downloadRoute.includes("recordPublicOrderReportDownload"));
  assert(fulfillmentUi.includes("Publish verified report to customer"));
  assert(statusUi.includes("Download verified report"));
  assert(cloudbuild.includes("npm run verify:public-report-commerce"));
}

async function main() {
  verifyRecommendations();
  verifyReportArtifactVisibility();
  await verifyAnchors();
  console.log(
    "✓ Public two-report ladder, neutral recommendation, upgrade credit, and separately scoped professional-services boundaries verified.",
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
