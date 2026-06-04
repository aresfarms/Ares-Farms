import { eventContractRegistry } from "@/lib/modules/eventContractRegistry";
import { crossModuleHandoffMap } from "@/lib/modules/handoffMap";
import { moduleManifests } from "@/lib/modules/moduleRegistry";
import {
  DISCLOSURE_AUDIT_GATE_DOC_REF,
  DISCLOSURE_AUDIT_GATE_RUNTIME_VERSION,
  DISCLOSURE_AUDIT_GATE_SIGNAL_IDS,
  DISCLOSURE_AUDIT_GATE_SPEC_VERSION,
  DISCLOSURE_REGISTRY,
  PROHIBITED_CLAIMS_CORPUS,
  composeDisclosureAuditGate,
  detectProhibitedClaim,
  disclosureAuditGateLineage,
  moduleDisclosureResolutionFor,
} from "@/lib/disclosure-audit/disclosureAuditGateRuntime";

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function main() {
  // ────────────────────────────────────────────────────────────────────
  // Version + doc seal
  // ────────────────────────────────────────────────────────────────────
  assert(
    DISCLOSURE_AUDIT_GATE_RUNTIME_VERSION ===
      "disclosure-audit-gate-runtime-v0.1.0",
    "Runtime version must match v0.1.0 seal."
  );
  assert(
    DISCLOSURE_AUDIT_GATE_SPEC_VERSION ===
      "module-44-disclosure-audit-gate-spec-v1.0",
    "Spec version must match v1.0 seal."
  );
  assert(
    DISCLOSURE_AUDIT_GATE_DOC_REF ===
      "docs/DOCTRINE_DISCLOSURE_AUDIT_GATE_V1.md",
    "Doc ref must point at the canonical doctrine doc."
  );

  const lineage = disclosureAuditGateLineage();
  assert(
    lineage.runtimeVersion === DISCLOSURE_AUDIT_GATE_RUNTIME_VERSION,
    "Lineage runtime version must equal canonical."
  );
  assert(
    lineage.disclosureRegistryCount === DISCLOSURE_REGISTRY.length,
    "Lineage disclosureRegistryCount must equal registry size."
  );
  assert(
    lineage.prohibitedClaimsCorpusCount === PROHIBITED_CLAIMS_CORPUS.length,
    "Lineage prohibitedClaimsCorpusCount must equal corpus size."
  );

  // ────────────────────────────────────────────────────────────────────
  // Registry shape
  // ────────────────────────────────────────────────────────────────────
  for (const d of DISCLOSURE_REGISTRY) {
    assert(d.disclosure_id.length > 0, "disclosure_id required");
    assert(
      d.applies_to.length > 0,
      `disclosure ${d.disclosure_id} must list at least one surface_class`
    );
    assert(
      d.semantic_tokens.length > 0,
      `disclosure ${d.disclosure_id} must declare at least one semantic_token`
    );
    assert(
      d.placement === "visible-on-render",
      `disclosure ${d.disclosure_id} must be visible-on-render`
    );
    assert(
      d.severity_if_missing === "FAIL" || d.severity_if_missing === "WARN",
      `disclosure ${d.disclosure_id} severity must be FAIL or WARN`
    );
  }
  for (const c of PROHIBITED_CLAIMS_CORPUS) {
    assert(c.claim_id.length > 0, "claim_id required");
    assert(c.patterns.length > 0, `claim ${c.claim_id} requires patterns`);
    assert(
      c.context_exempt_patterns.length > 0,
      `claim ${c.claim_id} requires context_exempt_patterns (negation-aware)`
    );
    assert(
      c.expected_behavior === "blocked-or-redacted-before-render",
      `claim ${c.claim_id} expected_behavior must be blocked-or-redacted-before-render`
    );
  }

  // ────────────────────────────────────────────────────────────────────
  // Scenario A: baseline audit — all 27 external surfaces should pass.
  // ────────────────────────────────────────────────────────────────────
  const baseline = composeDisclosureAuditGate({
    reviewerRole: "Qualified Governance Reviewer",
  });

  assert(
    baseline.productionBlocked &&
      baseline.humanReviewRequired &&
      baseline.advisoryOnly &&
      baseline.disclosureAuditGateInternalOnly &&
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
    baseline.summary.surfaceCountReconciled,
    "Public surface count must reconcile between registry and gateway (§5)."
  );
  assert(
    baseline.summary.publicSurfaceCountFromRegistry ===
      baseline.summary.publicSurfaceCountFromGateway,
    "Registry vs gateway public surface counts must match."
  );
  assert(
    baseline.summary.disclosureFailCount === 0,
    `Every external surface must have full required-disclosure coverage. Got ${baseline.summary.disclosureFailCount} FAILs.`
  );
  assert(
    baseline.summary.claimsFailCount === 0,
    `Every external surface must emit zero unexempted prohibited claims. Got ${baseline.summary.claimsFailCount} FAILs.`
  );
  assert(
    baseline.exitCode === 0,
    `Baseline must exit 0 when coverage + no-leak + reconciled all hold. Got ${baseline.exitCode}.`
  );

  // ────────────────────────────────────────────────────────────────────
  // Scenario B: negation-safety — every prohibited-claim doctrine
  // negation MUST NOT trigger a violation.
  // ────────────────────────────────────────────────────────────────────
  const negationDoctrineSamples = [
    "Furlong does not approve loans.",
    "Furlong does not deny applications.",
    "Furlong does not commit funds.",
    "Furlong does not certify any record.",
    "Furlong does not guarantee any outcome.",
    "Not a lender commitment.",
    "Not an approval.",
    "Not a public verification.",
    "Not a legal reliance.",
    "No autonomous decision is made.",
    "No information sale, no silent submission, no marketing lead.",
    "Furlong does not secretly submit your information.",
  ];
  for (const sample of negationDoctrineSamples) {
    for (const claim of PROHIBITED_CLAIMS_CORPUS) {
      const r = detectProhibitedClaim(
        sample,
        claim.patterns,
        claim.context_exempt_patterns
      );
      assert(
        !r.matched,
        `Negation safety failure on "${sample}" against ${claim.claim_id}: matched ${JSON.stringify(r.matches)}`
      );
    }
  }

  // ────────────────────────────────────────────────────────────────────
  // Scenario C: red-team self-test — every category must be caught.
  // ────────────────────────────────────────────────────────────────────
  const redTeamSamples = [
    "Congratulations, you are approved for $50000!",
    "Your application has been approved.",
    "The system determined your eligibility automatically.",
    "You may rely on this as an official record.",
    "Committed funds locked-rate for sponsor guaranteed deal.",
    "Publicly verified by Furlong.",
  ];
  for (const sample of redTeamSamples) {
    let caught = false;
    for (const claim of PROHIBITED_CLAIMS_CORPUS) {
      const r = detectProhibitedClaim(
        sample,
        claim.patterns,
        claim.context_exempt_patterns
      );
      if (r.matched) {
        caught = true;
        break;
      }
    }
    assert(caught, `Red-team sample "${sample}" was NOT caught by the corpus.`);
  }

  // ────────────────────────────────────────────────────────────────────
  // Scenario D: aggregate red-team injection through composer — must
  // flip exit code to 1 and emit RED_TEAM_MISS finding only if caught
  // count < planted count.
  // ────────────────────────────────────────────────────────────────────
  const aggregateRT = composeDisclosureAuditGate({
    redTeamPlantedSampleText:
      "Congratulations, you are approved for $250000! Your application has been approved by AI.",
  });
  assert(
    aggregateRT.summary.redTeamPlantedClaims === 1,
    "Composer must count red-team planted claims = 1 when injection text provided."
  );
  assert(
    aggregateRT.summary.redTeamCaught === 1,
    "Composer must catch the planted red-team injection (red-team self-test passes)."
  );
  // Exit code is 1 here because the planted text leaks into every
  // external surface audit → claims_controls FAIL on all 27 external
  // surfaces. That is the correct posture: a planted claim blocks the
  // gate.
  assert(
    aggregateRT.exitCode === 1,
    "Aggregate red-team injection must block the gate (exit 1)."
  );
  assert(
    aggregateRT.findings.some(
      (f) => f.category === "PROHIBITED_CLAIM_LEAKED"
    ),
    "Aggregate red-team injection must surface PROHIBITED_CLAIM_LEAKED findings."
  );

  // ────────────────────────────────────────────────────────────────────
  // Scenario E: moduleDisclosureResolutionFor consumer helper
  // ────────────────────────────────────────────────────────────────────
  const publicTrustManifest = moduleManifests.find(
    (m) => m.id === "trust"
  );
  if (publicTrustManifest) {
    const r = moduleDisclosureResolutionFor(publicTrustManifest);
    assert(
      r.disclosuresStatus === "PASS",
      `trust module must resolve disclosures PASS; got ${r.disclosuresStatus}`
    );
    assert(
      r.claimsStatus === "PASS",
      `trust module must resolve claims PASS; got ${r.claimsStatus}`
    );
  }
  const governanceManifest = moduleManifests.find(
    (m) => m.id === "governance"
  );
  if (governanceManifest) {
    const r = moduleDisclosureResolutionFor(governanceManifest);
    assert(
      r.disclosuresStatus === "N/A",
      `governance module must resolve disclosures N/A (internal); got ${r.disclosuresStatus}`
    );
  }

  // ────────────────────────────────────────────────────────────────────
  // Signals
  // ────────────────────────────────────────────────────────────────────
  assert(
    DISCLOSURE_AUDIT_GATE_SIGNAL_IDS.length === 4,
    "Runtime must declare exactly four governed signals."
  );
  for (const s of baseline.v1Signals) {
    assert(
      s.status === "READY_FOR_REVIEW",
      `Baseline signal ${s.id} must be READY_FOR_REVIEW; got ${s.status}`
    );
  }

  // ────────────────────────────────────────────────────────────────────
  // Module manifest conformance
  // ────────────────────────────────────────────────────────────────────
  const moduleManifest = moduleManifests.find(
    (m) => m.id === "governance-disclosure-audit-gate"
  );
  assert(
    moduleManifest !== undefined,
    "governance-disclosure-audit-gate module manifest must be registered."
  );
  assert(
    moduleManifest.productionBlocked && moduleManifest.replayRequired,
    "Module must be production-blocked and replay-required."
  );
  assert(
    moduleManifest.publicSurfaceAllowed === false,
    "Module must not have a public surface."
  );
  assert(
    moduleManifest.eventsPublished.includes(
      "governance.disclosure.audit.gate.verified"
    ),
    "Module must publish the verified event."
  );

  // Event contract conformance
  const contract = eventContractRegistry.find(
    (entry) =>
      entry.eventType === "governance.disclosure.audit.gate.verified"
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

  // Handoff conformance
  const handoffs = crossModuleHandoffMap.filter(
    (h) =>
      h.fromModuleId === "governance-disclosure-audit-gate" ||
      h.toModuleId === "governance-disclosure-audit-gate"
  );
  assert(
    handoffs.length >= 8,
    "Disclosure Audit Gate must declare at least eight governed handoffs."
  );
  assert(
    handoffs.every(
      (h) => h.productionBlocked && h.humanReviewBoundary
    ),
    "Every handoff must remain production-blocked and human-review-bound."
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        runtimeVersion: DISCLOSURE_AUDIT_GATE_RUNTIME_VERSION,
        specVersion: DISCLOSURE_AUDIT_GATE_SPEC_VERSION,
        docRef: DISCLOSURE_AUDIT_GATE_DOC_REF,
        disclosureRegistryCount: DISCLOSURE_REGISTRY.length,
        prohibitedClaimsCorpusCount: PROHIBITED_CLAIMS_CORPUS.length,
        externalSurfaceCount: baseline.summary.externalSurfaceCount,
        publicSurfaceCountFromRegistry:
          baseline.summary.publicSurfaceCountFromRegistry,
        publicSurfaceCountFromGateway:
          baseline.summary.publicSurfaceCountFromGateway,
        surfaceCountReconciled: baseline.summary.surfaceCountReconciled,
        disclosurePassCount: baseline.summary.disclosurePassCount,
        claimsPassCount: baseline.summary.claimsPassCount,
        baselineExitCode: baseline.exitCode,
        redTeamExitCode: aggregateRT.exitCode,
        redTeamPlantedClaims: aggregateRT.summary.redTeamPlantedClaims,
        redTeamCaught: aggregateRT.summary.redTeamCaught,
        handoffs: handoffs.length,
        message: "Disclosure Audit Gate v1 smoke test passed.",
      },
      null,
      2
    )
  );
}

main();
