import {
  ADVISORY_ONLY_DISCLOSURE,
  BORROWER_PORTABILITY_DISCLOSURE,
  LENDER_READY_DISCLOSURE,
  evaluateContentClaims,
} from "@/lib/governance/contentClaimsPolicy";

/**
 * Content Claims Policy Smoke Test
 *
 * Master Volume Governance:
 * - Vol I: blocks public claims that exceed constitutional authority.
 * - Vol II: prevents approval, eligibility, credit, underwriting, and
 *   regulatory-reliance overclaims.
 * - Vol III: verifies deterministic claim scanning before module promotion.
 * - Vol III-B: keeps AI and report language advisory-only.
 * - Vol IV: supports deployment gates and operator remediation.
 * - Vol V: enforces verification, lender-ready, free-tier, portability,
 *   explainability, source-authority, and controlled-disclosure doctrines.
 */

type SmokeResult = {
  name: string;
  ok: boolean;
  details: Record<string, unknown>;
};

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function blockedCodes(text: string): string[] {
  return evaluateContentClaims(text).findings
    .filter((finding) => finding.severity === "BLOCK")
    .map((finding) => finding.code);
}

function runCase(name: string, test: () => Record<string, unknown>): SmokeResult {
  return {
    name,
    ok: true,
    details: test(),
  };
}

const results: SmokeResult[] = [];

results.push(
  runCase("lender-ready disclosure is allowed", () => {
    const evaluation = evaluateContentClaims({
      text: [
        "This lender-ready package organizes intake documents for human review.",
        LENDER_READY_DISCLOSURE,
      ],
      context: {
        lenderReadyDisclosurePresent: true,
      },
    });

    assert(evaluation.ok, "Disclosed lender-ready language should pass.");

    return {
      findingCount: evaluation.findingCount,
    };
  })
);

results.push(
  runCase("approval and guarantee claims are blocked", () => {
    const codes = blockedCodes(
      "This package is lender-approved, creditworthy, and guaranteed acceptance for financing."
    );

    assert(
      codes.includes("PROHIBITED_APPROVAL_CLAIM"),
      "Approval, creditworthiness, or guarantee language should be blocked."
    );

    return {
      blockedCodes: codes,
    };
  })
);

results.push(
  runCase("verification claims require live infrastructure", () => {
    const blocked = evaluateContentClaims(
      "Download your verified report through the public verification gateway."
    );
    const allowed = evaluateContentClaims({
      text: "Download your verified report through the public verification gateway.",
      context: {
        publicVerificationGatewayOperational: true,
        canonicalHashVerificationOperational: true,
      },
    });

    assert(
      blocked.findings.some(
        (finding) => finding.code === "VERIFICATION_INFRASTRUCTURE_REQUIRED"
      ),
      "External/public verification claims should be blocked without live infrastructure."
    );
    assert(
      allowed.ok,
      "Verification claim should pass only when live verification infrastructure is declared operational."
    );

    return {
      blocked: blocked.blockCount,
      allowed: allowed.ok,
    };
  })
);

results.push(
  runCase("free tier and portability rights are protected", () => {
    const allowed = evaluateContentClaims({
      text: [
        "Borrowers pay nothing for the baseline readiness report.",
        "The report includes missing-document guidance, borrower rights notices, and export capability.",
        BORROWER_PORTABILITY_DISCLOSURE,
      ],
      context: {
        freeTierBaselineReadinessAvailable: true,
        borrowerPortabilityAvailable: true,
      },
    });
    const blocked = evaluateContentClaims(
      "The free tier is a teaser and portable export is premium unless the borrower upgrades."
    );

    assert(allowed.ok, "Borrower-free baseline and portability rights should pass.");
    assert(
      blocked.findings.some(
        (finding) =>
          finding.code === "FREE_TIER_DARK_PATTERN" ||
          finding.code === "PORTABILITY_BARRIER"
      ),
      "Free-tier dark patterns and portability barriers should be blocked."
    );

    return {
      allowed: allowed.ok,
      blockedCodes: blocked.findings.map((finding) => finding.code),
    };
  })
);

results.push(
  runCase("AI decision claims are blocked", () => {
    const blocked = evaluateContentClaims(
      "AI approves loan eligibility and makes credit decisions instantly."
    );
    const allowed = evaluateContentClaims([
      ADVISORY_ONLY_DISCLOSURE,
      "AI may summarize, classify, and explain governed records for human review.",
    ]);

    assert(
      blocked.findings.some((finding) => finding.code === "AI_DECISION_CLAIM"),
      "AI decision authority claims should be blocked."
    );
    assert(allowed.ok, "Advisory-only AI language should pass.");

    return {
      blockedCodes: blocked.findings.map((finding) => finding.code),
      allowed: allowed.ok,
    };
  })
);

results.push(
  runCase("security posture overclaims are blocked", () => {
    const soc2Blocked = evaluateContentClaims("SOC 2 Type II certified.");
    const fedRampBlocked = evaluateContentClaims("FedRAMP authorized and active.");
    const allowed = evaluateContentClaims(
      "SOC 2 Type II is not yet in place. FedRAMP authorization is not currently in place."
    );

    assert(
      soc2Blocked.findings.some(
        (finding) => finding.code === "SOC2_TYPE_II_OVERCLAIM"
      ),
      "SOC 2 Type II overclaim should be blocked."
    );
    assert(
      fedRampBlocked.findings.some(
        (finding) => finding.code === "FEDRAMP_OVERCLAIM"
      ),
      "FedRAMP overclaim should be blocked."
    );
    assert(allowed.ok, "Honest not-in-place posture language should pass.");

    return {
      soc2Blocked: soc2Blocked.blockCount,
      fedRampBlocked: fedRampBlocked.blockCount,
      allowed: allowed.ok,
    };
  })
);

console.log(
  JSON.stringify(
    {
      ok: true,
      checkedAt: new Date().toISOString(),
      policy: "content-claims-policy-v0.1.0",
      cases: results,
    },
    null,
    2
  )
);
