import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { composeBuildSelfReport } from "@/lib/build-self-report/buildSelfReportRuntime";
import type { SurfaceSection } from "@/lib/customer-journey/publicAlphaSurfaceContent";
import { composeDisclosureAuditGate } from "@/lib/disclosure-audit/disclosureAuditGateRuntime";
import { composeHumanAuthorityRegistry } from "@/lib/human-authority/humanAuthorityRegistryRuntime";

import { auditSection } from "./verifyCustomerJourney";

/**
 * CI live-state gate fail-closed proof (Build 43 — Track B).
 *
 * The CI-safe `--check` modes (verify:human-authority:ci,
 * verify:customer-journey:ci, build:self-report:ci) run the SAME audit
 * functions as the literal gates against live repo state, only skipping
 * the timestamped build-record write. This proof exercises those exact
 * audit functions with broken inputs to demonstrate, deterministically
 * and without touching any real repo file, that each fails closed:
 *
 *   1. An unfilled alpha-required role (simulated empty / corrupt Vol VII
 *      Annex projection) → verify:human-authority gate code exits 1.
 *   2. A customer surface missing its required content → the
 *      verify:customer-journey section audit returns FAIL.
 *   3. A malformed / incomplete active CCR, and a requirements mismatch →
 *      the build:self-report gate code exits 1.
 *
 * Pure and self-contained: temp fixtures only, no writes to tracked
 * files, no network.
 */

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function proveHumanAuthorityFailsClosed(): void {
  // No filled roles = the honest baseline when the Annex is empty,
  // missing, or fails to project any role. The live verify:human-authority
  // CLI loads the real Annex (which IS filled, so it exits 0); this proves
  // the underlying gate code fails closed when roles are unfilled.
  const unfilled = composeHumanAuthorityRegistry();
  assert(
    unfilled.exitCode === 1,
    "FAIL-CLOSED PROOF (human-authority): unfilled alpha-required roles must exit 1."
  );
  assert(
    unfilled.findings.some((f) => f.category === "ALPHA_REQUIRED_ROLE_UNFILLED"),
    "FAIL-CLOSED PROOF (human-authority): must surface ALPHA_REQUIRED_ROLE_UNFILLED."
  );
}

function proveCustomerJourneyFailsClosed(): void {
  // A page that loads but is missing a required content token must FAIL
  // the section audit (the same audit verify:customer-journey:ci runs).
  const dir = mkdtempSync(path.join(tmpdir(), "ci-live-state-proof-"));
  try {
    const pageRel = "ci-proof-page.tsx";
    writeFileSync(
      path.join(dir, pageRel),
      "export default function Page() { return null; }\n",
      "utf8"
    );
    const section: SurfaceSection = {
      route: "/__ci_live_state_proof__",
      ordinal: 1,
      doctrineSection: "ci-proof",
      doctrineLabel: "CI Live-State Proof",
      pageFilePath: pageRel,
      requiredContent: [
        {
          id: "next-step-guidance",
          label: "required token that the empty proof page omits",
          sourceDoctrine: "ci-proof",
          requiredPatterns: [/__CI_PROOF_REQUIRED_TOKEN__/],
        },
      ],
      requiredDisclosureIds: [],
      bannedTokens: [],
    };
    const disclosurePack = composeDisclosureAuditGate();
    const findings: Parameters<typeof auditSection>[3] = [];
    const result = auditSection(section, dir, disclosurePack, findings);
    assert(
      result.overall === "FAIL",
      "FAIL-CLOSED PROOF (customer-journey): page missing required content must be FAIL."
    );
    assert(
      findings.some((f) => f.category === "REQUIRED_CONTENT_MISSING"),
      "FAIL-CLOSED PROOF (customer-journey): must surface REQUIRED_CONTENT_MISSING."
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function proveBuildSelfReportFailsClosed(): void {
  const pending = [
    { id: "REQ-58", name: "p1" },
    { id: "REQ-59", name: "p2" },
    { id: "REQ-60", name: "p3" },
  ];

  // (a) Malformed / incomplete active CCR → fail closed.
  const malformedCcr = composeBuildSelfReport({
    commit: "ci-proof",
    requirementsTotal: 60,
    requirementsImplemented: 57,
    pendingRequirements: pending,
    classificationChangeRegistryMarkdown: [
      "<!-- ccr:meta",
      "id: CCR-PROOF-INCOMPLETE",
      "title: Active entry missing required fields",
      "status: ACTIVE",
      "previousState: X",
      "newState: Y",
      "-->",
    ].join("\n"),
  });
  assert(
    malformedCcr.classificationChangeRegistry.parsed === false,
    "FAIL-CLOSED PROOF (build-self-report): incomplete active CCR must not parse."
  );
  assert(
    malformedCcr.header.exit_code === 1,
    "FAIL-CLOSED PROOF (build-self-report): malformed CCR must exit 1."
  );

  // (b) Requirements ledger not enumerated → fail closed (a different
  // gate condition that also flips the exit code the :ci mode asserts).
  const reqMismatch = composeBuildSelfReport({
    commit: "ci-proof",
    requirementsTotal: 60,
    requirementsImplemented: 57,
    pendingRequirements: [],
  });
  assert(
    reqMismatch.header.exit_code === 1,
    "FAIL-CLOSED PROOF (build-self-report): requirements mismatch must exit 1."
  );

  // The build-self-report exit code also incorporates module-verdict FAIL,
  // orphan/dangling findings, audit-chain FAIL, and live-fetch != 0 — the
  // build:self-report:ci mode exits this same code, so those conditions
  // are enforced in CI by construction.
  const auditChainBroken = composeBuildSelfReport({
    commit: "ci-proof",
    auditChainIntact: "FAIL",
    requirementsTotal: 60,
    requirementsImplemented: 57,
    pendingRequirements: pending,
  });
  assert(
    auditChainBroken.header.exit_code === 1,
    "FAIL-CLOSED PROOF (build-self-report): broken audit chain must exit 1."
  );
}

function main(): void {
  proveHumanAuthorityFailsClosed();
  proveCustomerJourneyFailsClosed();
  proveBuildSelfReportFailsClosed();

  console.log(
    JSON.stringify(
      {
        ok: true,
        proof: "ci-live-state-gate-fail-closed",
        humanAuthorityUnfilledExits1: true,
        customerJourneyMissingContentFails: true,
        buildSelfReportMalformedCcrExits1: true,
        buildSelfReportRequirementsMismatchExits1: true,
        buildSelfReportAuditChainBrokenExits1: true,
        message:
          "CI live-state gate fail-closed proof passed — :ci modes enforce real-state defects.",
      },
      null,
      2
    )
  );
}

main();
