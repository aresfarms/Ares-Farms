/**
 * Governed Report Builder
 *
 * Master Volume Governance:
 * - Vol I: generated reports must stay inside constitutional authority.
 * - Vol II: outputs must remain advisory and cannot imply approval,
 *   underwriting, eligibility, financing, permitting, legal, or regulatory use.
 * - Vol III: report structure must be deterministic and replay-safe.
 * - Vol IV: human-review and escalation limits must remain visible.
 * - Vol V: report output must preserve classification, explainability,
 *   portability, disclosure, and export-governance boundaries.
 */

type ReportInput = {
  scores?: Record<string, number | null | undefined>;
  decision?: {
    crops?: unknown[];
    livestock?: unknown[];
    equipment?: unknown[];
    vendors?: unknown[];
  };
  tenantId?: string | null;
};

function numericScore(value: unknown): number {
  const numericValue = Number(value);

  return Number.isFinite(numericValue) ? numericValue : 0;
}

function percentScore(value: unknown): number {
  return Math.round(numericScore(value) * 100);
}

function riskLevelFromScore(score: number): "LOW" | "MEDIUM" | "HIGH" {
  if (score > 0.75) {
    return "LOW";
  }

  if (score > 0.5) {
    return "MEDIUM";
  }

  return "HIGH";
}

function safeItems(value: unknown[] | undefined): unknown[] {
  return Array.isArray(value) ? value : [];
}

export function buildReport(result: ReportInput) {
  const scores = result.scores ?? {};
  const decision = result.decision ?? {};
  const tenantId = result.tenantId ?? "unknown";
  const sbaScore = numericScore(scores.sba);

  const summary = {
    tenantId,
    riskLevel: riskLevelFromScore(sbaScore),
    overallScore: percentScore(sbaScore),
    advisoryOnly: true,
    borrowerCharged: false,
    officialUseAllowed: false,
  };

  const baselineReadinessReport = {
    title: "Baseline Readiness Report",
    advisory:
      "Advisory information only. This is not an approval, pre-approval, credit decision, underwriting decision, financing commitment, permitting decision, legal conclusion, or regulatory determination.",
    sections: {
      overview: [
        `Tenant: ${tenantId}`,
        `Overall readiness signal: ${summary.overallScore}%`,
        `Operational risk signal: ${summary.riskLevel}`,
      ],
      readinessGuidance: {
        crops: safeItems(decision.crops),
        livestock: safeItems(decision.livestock),
      },
      borrowerRights: [
        "Borrowers pay nothing for baseline readiness support.",
        "Borrowers may review and export governed records through portability workflows.",
        "Human review is required before any regulated reliance.",
      ],
    },
  };

  const institutionalCoordinationReport = {
    title: "Institutional Coordination Report",
    advisory:
      "Institutional coordination support only. This is not borrower-paid and does not create approval, eligibility, underwriting, financing, legal, permitting, or regulatory reliance.",
    sections: {
      operatingSignals: {
        credit: numericScore(scores.credit),
        liquidity: numericScore(scores.liquidity),
        collateral: numericScore(scores.collateral),
      },
      operationalPlanning: {
        crops: safeItems(decision.crops),
        equipment: safeItems(decision.equipment),
      },
      vendorContext: safeItems(decision.vendors),
      notes: [
        "Supports organized human review and institutional coordination.",
        "Does not create a lender commitment or borrower disclosure.",
      ],
    },
  };

  const environmentalReadinessChecklist = {
    title: "Environmental Documentation Readiness Checklist",
    advisory:
      "Environmental readiness support only. This is not valid for permitting, financing, legal, or regulatory reliance without independent licensed professional review.",
    sections: {
      documentationReadiness: [
        "Soil suitability documentation may need licensed professional review.",
        "Water table and site risk documentation may need licensed professional review.",
      ],
      relianceLimits: [
        "Not an official environmental report.",
        "Not a permit application.",
        "Not a legal or regulatory determination.",
      ],
    },
  };

  return {
    summary,
    baselineReadinessReport,
    institutionalCoordinationReport,
    environmentalReadinessChecklist,
  };
}
