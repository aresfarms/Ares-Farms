import fs from "node:fs";
import os from "node:os";
import path from "node:path";
function ok(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}
async function main() {
  process.env.FURLONG_RUNTIME_STATE_DIR = fs.mkdtempSync(
    path.join(os.tmpdir(), "furlong-scheduler-release-"),
  );
  process.env.EVIDENCE_REPLAY_SIGNING_SECRET = "scheduler-release-test-secret";
  const store = await import("@/lib/property/officialEvidenceRuntimeStore");
  const capture =
    await import("@/lib/property/officialEvidenceGenerationCapture");
  const replay = await import("@/lib/property/officialEvidenceReplayExecutor");
  const registry =
    await import("@/lib/property/officialEvidenceRecomputationHandlerRegistry");
  const production =
    await import("@/lib/property/officialEvidenceProductionRecomputationHandlers");
  const ceremony =
    await import("@/lib/property/officialEvidenceRecomputationCeremony");
  const release =
    await import("@/lib/property/officialEvidenceSchedulerRelease");
  const bootstrap =
    await import("@/lib/property/officialEvidenceLiveBootstrap");
  const batch =
    await import("@/lib/property/officialEvidenceBatchReplayVerification");
  const approval =
    await import("@/lib/property/officialEvidenceApprovalPacket");
  const handoff = await import("@/lib/property/officialEvidenceReviewHandoff");
  const finalPacket =
    await import("@/lib/property/officialEvidenceFinalCanaryPacket");
  const tax = await import("@/lib/property/ownershipCostModel");
  const ranking = await import("@/lib/intelligence/scenarioRankingPlan");
  const market = await import("@/lib/intelligence/marketComparablePlan");
  const capital = await import("@/lib/intelligence/preliminaryCapitalPlan");
  const financing = await import("@/lib/financing/intakeRuntime");
  const brief = await import("@/lib/property/propertyBriefIntelligence");
  store.writeOfficialEvidenceRefreshState({
    sourceId: "parcel-tax-authority",
    snapshots: [],
    receipts: [],
    publishedVersion: "tax-release-v1",
  });
  store.writeOfficialEvidenceRefreshState({
    sourceId: "well-permit-authority",
    snapshots: [],
    receipts: [],
    publishedVersion: "well-release-v1",
  });
  let prematureBlocked = false;
  try {
    release.recordSchedulerRelease({
      action: "AUTHORIZE",
      actorId: "op-1",
      actorName: "Operator",
      reason: "premature",
    });
  } catch {
    prematureBlocked = true;
  }
  ok(
    prematureBlocked,
    "Release authorization must fail before technical and ceremony readiness.",
  );
  const taxInput = {
    price: 425000,
    sellerCurrentAnnualTax: 1800,
    currentTaxTransfersUnchanged: false,
    ownershipContext: {
      rates: { weekOf: "2026-07-23", rate30: 6.2, rate15: null },
      taxContext: {
        medianAnnualTax: 3200,
        medianHomeValue: 290000,
        effectiveRatePct: 1.1,
      },
      electricity: null,
      hpi: null,
    },
  };
  const taxOutput = tax.buildPostSaleTaxScenario(
    {
      price: taxInput.price,
      sellerCurrentAnnualTax: taxInput.sellerCurrentAnnualTax,
      currentTaxTransfersUnchanged: false,
    },
    taxInput.ownershipContext as any,
  );
  const marketPlan = market.buildMarketComparablePlan({
    profileId: "farm",
    comparables: [],
  });
  const capitalPlan = capital.buildPreliminaryCapitalPlan({
    profileId: "farm",
    listedPrice: 425000,
    requestedAmount: null,
    pathwayNames: ["FSA Direct Farm Ownership"],
  });
  const topInput = {
    profileId: "farm" as const,
    marketPlan,
    capitalPlan,
    pathwayCount: 1,
    taxImpact: {
      acquisitionPrice: 425000,
      stabilizedAnnual: 4675,
      adverseAnnual: 5844,
    },
    infrastructureRisk: null,
  };
  const qualificationInput = {
    applicationId: "release-application",
    purpose: "acquisition" as const,
    programInterest: "fsa" as const,
    contactName: "Release Applicant",
    contactEmail: "release@example.test",
    propertyDescriptor: "Release Farm",
    location: { state: "MD", county: "Caroline" },
    estimatedProjectCost: 425000,
    scopeSummary: "Release proof",
    timeline: "12 months",
    feeDisclosureAcknowledged: true,
    consentAcknowledged: true,
  };
  const qualificationOutput =
    financing.evaluateFinancingIntake(qualificationInput);
  const briefInput = {
    propertyId: null,
    sourceId: null,
    propertyType: "farm",
    priceLabel: "$425,000",
    county: "Caroline County",
    town: "Federalsburg",
    stateCode: "MD",
    pathwayList: ["FSA Direct Farm Ownership"],
    description: "Release farm",
  };
  const fixtures = [
    {
      kind: "tax-scenario" as const,
      id: "release:tax",
      input: taxInput,
      output: taxOutput,
    },
    {
      kind: "top-three" as const,
      id: "release:top",
      input: topInput,
      output: ranking.buildScenarioRankingPlan(topInput),
    },
    {
      kind: "qualification-result" as const,
      id: "release:qualification",
      input: qualificationInput,
      output: qualificationOutput,
      at: qualificationOutput.generatedAt,
    },
    {
      kind: "property-report" as const,
      id: "release:report",
      input: briefInput,
      output: brief.buildPropertyBriefIntelligence(briefInput),
    },
  ];
  production.ensureProductionRecomputationBindings("2026-07-25T18:29:00Z");
  for (const fixture of fixtures) {
    capture.captureGeneratedEvidenceArtifact({
      kind: fixture.kind,
      propertyId: "release-property",
      artifactId: fixture.id,
      generatedAt: fixture.at ?? "2026-07-25T18:30:00Z",
      replayInput: fixture.input,
      replayOutput: fixture.output,
    });
    const registration = registry.latestGovernedRecomputationHandler(
      fixture.kind,
    );
    ok(registration, `${fixture.kind} production registration must exist.`);
    const attestation = replay.attestDeterministicReplay({
      artifactId: fixture.id,
      handlerId: registration.handlerId,
      implementationHash: registration.implementationHash,
    });
    ok(attestation.matched, `${fixture.kind} replay must match.`);
    registry.decideGovernedRecomputationHandler({
      kind: fixture.kind,
      decision: "APPROVE",
      reviewerId: "module45-reviewer",
      reviewerName: "Module 45 Reviewer",
      reason: "Exact replay proof matched.",
    });
  }
  bootstrap.bootstrapLiveEvidenceReplayReview("2026-07-25T18:31:00Z");
  batch.runGovernedBatchReplayVerification({
    actorId: "module45-reviewer",
    actorName: "Module 45 Reviewer",
    reason: "Verify current four-builder approval packet.",
    at: "2026-07-25T18:32:00Z",
  });
  const approvalPacket = approval.createApprovalPacket({
    actorId: "module45-reviewer",
    actorName: "Module 45 Reviewer",
    reason: "Prepare four separate release decisions.",
    at: "2026-07-25T18:33:00Z",
  });
  for (const kind of [
    "tax-scenario",
    "top-three",
    "qualification-result",
    "property-report",
  ] as const) {
    approval.decideApprovalPacketItem({
      packetId: approvalPacket.packetId,
      kind,
      decision: "APPROVE",
      actorId: "module45-reviewer",
      actorName: "Module 45 Reviewer",
      reason: `Approve current ${kind} implementation for scheduler release test.`,
    });
  }
  handoff.recordReviewHandoff({
    actorId: "module45-reviewer",
    actorName: "Module 45 Reviewer",
    reason: "Ready for final activation ceremony.",
    at: "2026-07-25T18:34:00Z",
  });
  ceremony.recordRecomputationActivationCeremony({
    action: "FINALIZE",
    actorId: "module45-reviewer",
    actorName: "Module 45 Reviewer",
    reason: "All exact implementations approved and replay matched.",
    at: "2026-07-25T18:35:00Z",
  });
  finalPacket.createFinalCanaryReleasePacket({
    actorId: "module45-reviewer",
    actorName: "Module 45 Reviewer",
    reason: "Bind the finalized ceremony to the paused canary release.",
    at: "2026-07-25T18:36:00Z",
  });
  release.recordSchedulerRelease({
    action: "AUTHORIZE",
    actorId: "module45-reviewer",
    actorName: "Module 45 Reviewer",
    reason: "Authorize one paused scheduler canary.",
  });
  ok(
    release.schedulerReleaseAuthorized(),
    "Release must be authorized after finalized readiness.",
  );
  ok(
    !release.schedulerResumePermitted(),
    "Resume must remain blocked before the canary passes.",
  );
  release.recordSchedulerRelease({
    action: "CANARY_PASS",
    actorId: "system:scheduler-canary",
    actorName: "scheduler-canary",
    reason: "Canary completed without blocked or failed jobs.",
    canaryRunId: "canary-1",
    jobCount: 0,
  });
  ok(
    release.schedulerResumePermitted(),
    "Successful canary must permit scheduler resume.",
  );
  release.recordSchedulerRelease({
    action: "REVOKE",
    actorId: "module45-reviewer",
    actorName: "Module 45 Reviewer",
    reason: "Test revocation.",
  });
  ok(
    !release.schedulerResumePermitted(),
    "Revocation must immediately remove resume permission.",
  );
  const page = fs.readFileSync(
    "src/app/internal/evidence-recomputation/page.tsx",
    "utf8",
  );
  ok(
    page.includes("Authorize paused scheduler canary") &&
      page.includes("Resume permission"),
    "Review surface must show release and resume controls.",
  );
  console.log(
    JSON.stringify(
      {
        ok: true,
        rule: "OFFICIAL-EVIDENCE-SCHEDULER-RELEASE-001",
        prematureBlocked,
        receipts: release.listSchedulerReleaseReceipts().map((r) => r.action),
      },
      null,
      2,
    ),
  );
}
main().catch((error) => {
  console.error(error);
  process.exit(1);
});
