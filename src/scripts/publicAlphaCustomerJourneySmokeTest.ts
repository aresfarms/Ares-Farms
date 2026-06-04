import { eventContractRegistry } from "@/lib/modules/eventContractRegistry";
import { crossModuleHandoffMap } from "@/lib/modules/handoffMap";
import { moduleManifests } from "@/lib/modules/moduleRegistry";
import {
  CUSTOMER_PROMISE_AFFIRMATIONS,
  CUSTOMER_PROMISE_NEGATIONS,
  CUSTOMER_PROMISE_TAGLINE,
  FINANCING_REALITY_CLASSIFICATIONS,
  PUBLIC_ALPHA_CUSTOMER_JOURNEY_DOC_REF,
  PUBLIC_ALPHA_CUSTOMER_JOURNEY_RUNTIME_VERSION,
  PUBLIC_ALPHA_CUSTOMER_JOURNEY_SECTIONS,
  PUBLIC_ALPHA_CUSTOMER_JOURNEY_SIGNAL_IDS,
  PUBLIC_ALPHA_CUSTOMER_JOURNEY_SPEC_VERSION,
  PUBLIC_ALPHA_CUSTOMER_SUCCESS_QUESTIONS,
  composePublicAlphaCustomerJourney,
  publicAlphaCustomerJourneyLineage,
} from "@/lib/public-alpha-journey/publicAlphaCustomerJourneyRuntime";

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function main() {
  // ────────────────────────────────────────────────────────────────────
  // Version + doc seal
  // ────────────────────────────────────────────────────────────────────
  assert(
    PUBLIC_ALPHA_CUSTOMER_JOURNEY_RUNTIME_VERSION ===
      "public-alpha-customer-journey-runtime-v0.1.0",
    "Runtime version must match v0.1.0 seal."
  );
  assert(
    PUBLIC_ALPHA_CUSTOMER_JOURNEY_SPEC_VERSION === "public-alpha-profile-v1",
    "Spec version must match canonical seal."
  );
  assert(
    PUBLIC_ALPHA_CUSTOMER_JOURNEY_DOC_REF ===
      "docs/DOCTRINE_PUBLIC_ALPHA_CUSTOMER_JOURNEY_V1.md",
    "Doc ref must point at the canonical doctrine doc."
  );

  const lineage = publicAlphaCustomerJourneyLineage();
  assert(lineage.sectionCount === 7, "Lineage sectionCount must be 7.");
  assert(
    lineage.customerSuccessQuestionCount === 6,
    "Lineage customerSuccessQuestionCount must be 6."
  );
  assert(
    lineage.financingRealityClassificationCount === 6,
    "Lineage financingRealityClassificationCount must be 6."
  );
  assert(
    lineage.promiseNegationCount === 5,
    "Lineage promiseNegationCount must be 5 (approve/deny/underwriting/agency/guarantee)."
  );
  assert(
    lineage.promiseAffirmationCount === 6,
    "Lineage promiseAffirmationCount must be 6 (pathways/gaps/docs/realities/environmental/next)."
  );

  // ────────────────────────────────────────────────────────────────────
  // Registry shape — the canonical 7/6/6/5/6 declared in the spec
  // ────────────────────────────────────────────────────────────────────
  assert(
    PUBLIC_ALPHA_CUSTOMER_JOURNEY_SECTIONS.length === 7,
    "Must declare exactly 7 entry-surface sections."
  );
  const sectionIds = PUBLIC_ALPHA_CUSTOMER_JOURNEY_SECTIONS.map((s) => s.id);
  assert(
    sectionIds.includes("founder_introduction"),
    "Section 1 must be founder_introduction."
  );
  assert(
    sectionIds.includes("customer_project_intake"),
    "Section 2 must be customer_project_intake."
  );
  assert(
    sectionIds.includes("pathway_discovery"),
    "Section 3 must be pathway_discovery."
  );
  assert(
    sectionIds.includes("readiness_review"),
    "Section 4 must be readiness_review."
  );
  assert(
    sectionIds.includes("financing_reality_classification"),
    "Section 5 must be financing_reality_classification."
  );
  assert(
    sectionIds.includes("human_escalation"),
    "Section 6 must be human_escalation."
  );
  assert(
    sectionIds.includes("data_transparency"),
    "Section 7 must be data_transparency."
  );

  // pathway_discovery must ban approval language per spec §3 ("No
  // approval language permitted.").
  const pathwaySection = PUBLIC_ALPHA_CUSTOMER_JOURNEY_SECTIONS.find(
    (s) => s.id === "pathway_discovery"
  );
  assert(
    pathwaySection !== undefined,
    "pathway_discovery section must exist."
  );
  assert(
    pathwaySection.bannedSemanticTokens.length > 0,
    "pathway_discovery must declare banned tokens (spec §3: no approval language permitted)."
  );

  // ────────────────────────────────────────────────────────────────────
  // Customer promise registry — 5 negations + 6 affirmations + tagline
  // ────────────────────────────────────────────────────────────────────
  assert(CUSTOMER_PROMISE_NEGATIONS.length === 5, "5 negations.");
  assert(
    CUSTOMER_PROMISE_NEGATIONS.includes("approve loans"),
    "Must list 'approve loans' negation."
  );
  assert(
    CUSTOMER_PROMISE_NEGATIONS.includes("deny loans"),
    "Must list 'deny loans' negation."
  );
  assert(
    CUSTOMER_PROMISE_NEGATIONS.includes("issue underwriting decisions"),
    "Must list 'issue underwriting decisions' negation."
  );
  assert(
    CUSTOMER_PROMISE_NEGATIONS.includes("issue agency determinations"),
    "Must list 'issue agency determinations' negation."
  );
  assert(
    CUSTOMER_PROMISE_NEGATIONS.includes("guarantee funding"),
    "Must list 'guarantee funding' negation."
  );
  assert(CUSTOMER_PROMISE_AFFIRMATIONS.length === 6, "6 affirmations.");
  assert(
    CUSTOMER_PROMISE_AFFIRMATIONS.includes("available pathways"),
    "Must list 'available pathways' affirmation."
  );
  assert(
    CUSTOMER_PROMISE_AFFIRMATIONS.includes("environmental considerations"),
    "Must list 'environmental considerations' affirmation."
  );
  assert(
    CUSTOMER_PROMISE_TAGLINE === "Compass to Capital",
    "Tagline must be 'Compass to Capital'."
  );

  // ────────────────────────────────────────────────────────────────────
  // Financing reality classifications — the canonical 6
  // ────────────────────────────────────────────────────────────────────
  assert(
    FINANCING_REALITY_CLASSIFICATIONS.length === 6,
    "Must declare exactly 6 financing reality classifications."
  );
  for (const c of [
    "likely financeable",
    "financeable with conditions",
    "specialist review required",
    "limited financing market",
    "cash-favored transaction",
    "not enough information",
  ]) {
    assert(
      FINANCING_REALITY_CLASSIFICATIONS.includes(c as never),
      `Must include classification "${c}".`
    );
  }

  // ────────────────────────────────────────────────────────────────────
  // 6 customer success questions
  // ────────────────────────────────────────────────────────────────────
  assert(
    PUBLIC_ALPHA_CUSTOMER_SUCCESS_QUESTIONS.length === 6,
    "Must declare exactly 6 customer success questions."
  );
  const qIds = PUBLIC_ALPHA_CUSTOMER_SUCCESS_QUESTIONS.map((q) => q.id);
  for (const id of [
    "what_are_my_options",
    "what_are_my_risks",
    "what_documents_do_i_need",
    "what_happens_to_my_data",
    "what_should_i_do_next",
    "who_can_help_me",
  ]) {
    assert(qIds.includes(id as never), `Must include question "${id}".`);
  }

  // ────────────────────────────────────────────────────────────────────
  // Scenario A: baseline audit (honest baseline — surfaces may be
  // incomplete; runtime must compose correctly regardless of content
  // gaps).
  // ────────────────────────────────────────────────────────────────────
  const baseline = composePublicAlphaCustomerJourney({
    reviewerRole: "Chief Governance Authority",
  });
  assert(
    baseline.productionBlocked &&
      baseline.humanReviewRequired &&
      baseline.advisoryOnly &&
      baseline.publicAlphaCustomerJourneyInternalOnly &&
      baseline.noCustomerFacingPublication &&
      baseline.noAutonomousDetermination &&
      baseline.noInformationSale &&
      baseline.noSilentSubmission &&
      baseline.noApproval &&
      baseline.noDenial &&
      baseline.noLenderCommitment &&
      baseline.noLegalReliance &&
      baseline.noPublicVerification &&
      baseline.noRegulatoryReliance &&
      baseline.noLiveExternalAction &&
      baseline.noSourceCertainty &&
      baseline.noNoticeSend &&
      baseline.replaySafe &&
      baseline.auditSafe &&
      baseline.federationScoped &&
      baseline.conflictPreserving,
    "Baseline pack must preserve every constitutional flag."
  );
  assert(
    baseline.sectionResults.length === 7,
    "Baseline must produce 7 section audit results."
  );
  assert(
    baseline.customerSuccessResults.length === 6,
    "Baseline must produce 6 customer success results."
  );
  for (const r of baseline.sectionResults) {
    assert(
      r.candidateRoutes.length > 0,
      `Section ${r.sectionId} must declare candidate routes.`
    );
  }
  for (const finding of baseline.findings) {
    assert(
      finding.resolution === "REQUIRES_HUMAN_REVIEW",
      `Finding ${finding.findingId} must resolve to REQUIRES_HUMAN_REVIEW.`
    );
    assert(
      finding.evidenceReplayRef.length > 0,
      `Finding ${finding.findingId} must carry an evidence replay reference.`
    );
    assert(
      finding.doctrineRefs.length > 0,
      `Finding ${finding.findingId} must reference doctrine.`
    );
  }
  assert(
    baseline.alphaJourneyReady === "PASS" ||
      baseline.alphaJourneyReady === "PENDING_SIGNOFF" ||
      baseline.alphaJourneyReady === "FAIL",
    "alphaJourneyReady must be one of PASS / PENDING_SIGNOFF / FAIL."
  );

  // Every section result carries either PASS, FAIL, WARN, or
  // PENDING_SIGNOFF — never blank.
  for (const r of baseline.sectionResults) {
    assert(
      ["PASS", "FAIL", "WARN", "PENDING_SIGNOFF"].includes(r.status),
      `Section ${r.sectionId} must have a valid status; got ${r.status}.`
    );
  }

  // ────────────────────────────────────────────────────────────────────
  // Scenario B: signals
  // ────────────────────────────────────────────────────────────────────
  assert(
    PUBLIC_ALPHA_CUSTOMER_JOURNEY_SIGNAL_IDS.length === 6,
    "Must declare exactly 6 governed signals."
  );
  const signalIds = baseline.v1Signals.map((s) => s.id);
  for (const id of PUBLIC_ALPHA_CUSTOMER_JOURNEY_SIGNAL_IDS) {
    assert(
      signalIds.includes(id),
      `Baseline must surface signal ${id}.`
    );
  }

  // ────────────────────────────────────────────────────────────────────
  // Module manifest conformance
  // ────────────────────────────────────────────────────────────────────
  const manifest = moduleManifests.find(
    (m) => m.id === "governance-public-alpha-customer-journey"
  );
  assert(
    manifest !== undefined,
    "governance-public-alpha-customer-journey module manifest must be registered."
  );
  assert(
    manifest.productionBlocked && manifest.replayRequired,
    "Module must be production-blocked and replay-required."
  );
  assert(
    manifest.publicSurfaceAllowed === false,
    "Module must not have a public surface."
  );
  assert(
    manifest.eventsPublished.includes(
      "governance.public.alpha.customer.journey.audited"
    ),
    "Module must publish the audited event."
  );

  // Event contract
  const contract = eventContractRegistry.find(
    (entry) =>
      entry.eventType === "governance.public.alpha.customer.journey.audited"
  );
  assert(contract !== undefined, "Event contract must be registered.");
  assert(
    contract.productionBlocked && contract.replayRequired,
    "Event contract must be production-blocked and replay-required."
  );
  assert(
    contract.classificationLevel === "RESTRICTED",
    "Event contract must be RESTRICTED."
  );
  assert(
    contract.publicSurfaceAllowed === false,
    "Event contract must not be public-surface allowed."
  );

  // Handoffs
  const handoffs = crossModuleHandoffMap.filter(
    (h) =>
      h.fromModuleId === "governance-public-alpha-customer-journey" ||
      h.toModuleId === "governance-public-alpha-customer-journey"
  );
  assert(
    handoffs.length >= 8,
    "Customer Journey module must declare at least eight governed handoffs."
  );
  assert(
    handoffs.every((h) => h.productionBlocked && h.humanReviewBoundary),
    "Every handoff must remain production-blocked and human-review-bound."
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        runtimeVersion: PUBLIC_ALPHA_CUSTOMER_JOURNEY_RUNTIME_VERSION,
        specVersion: PUBLIC_ALPHA_CUSTOMER_JOURNEY_SPEC_VERSION,
        docRef: PUBLIC_ALPHA_CUSTOMER_JOURNEY_DOC_REF,
        sectionCount: baseline.sections.length,
        customerSuccessQuestionCount: baseline.customerSuccessQuestions.length,
        financingRealityClassifications:
          FINANCING_REALITY_CLASSIFICATIONS.length,
        promiseNegationCount: CUSTOMER_PROMISE_NEGATIONS.length,
        promiseAffirmationCount: CUSTOMER_PROMISE_AFFIRMATIONS.length,
        tagline: CUSTOMER_PROMISE_TAGLINE,
        baselineSectionsPass: baseline.summary.sectionsPass,
        baselineSectionsFail: baseline.summary.sectionsFail,
        baselineSuccessQuestionsPass:
          baseline.summary.customerSuccessQuestionsPass,
        baselineSuccessQuestionsFail:
          baseline.summary.customerSuccessQuestionsFail,
        baselineCustomerPromise: baseline.summary.customerPromiseStatus,
        baselineFinancingReality: baseline.summary.financingRealityStatus,
        baselineClassifications: `${baseline.summary.classificationsPresentCount}/${baseline.summary.classificationsTotal}`,
        baselineFindings: baseline.summary.findingCount,
        baselineCrossSourceConflicts: baseline.summary.crossSourceConflictCount,
        baselineV1OverallReadinessPercent:
          baseline.summary.v1OverallReadinessPercent,
        baselineAlphaJourneyReady: baseline.alphaJourneyReady,
        baselineExitCode: baseline.exitCode,
        handoffs: handoffs.length,
        message: "Public Alpha Profile v1 — Customer Journey smoke test passed.",
      },
      null,
      2
    )
  );
}

main();
