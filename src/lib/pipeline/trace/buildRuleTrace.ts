export function buildRuleTrace(input: any) {
  const trace: any[] = [];

  const score = input.score?.score ?? 0;
  const risk = input.risk?.riskScore ?? 0;
  const decision = input.decision?.decision ?? "REVIEW";
  const policy = input.policy ?? {};
  const policies = policy.policies ?? [];

  const acres = input.metadata?.acres ?? 0;
  const revenue = input.financials?.revenue ?? 0;

  let workingScore = score;

  // -------------------------
  // FINANCIAL RULES
  // -------------------------
  if (revenue < 100000) {
    trace.push({
      layer: "SCORING",
      rule: "LOW_REVENUE_THRESHOLD",
      impact: -0.08,
      before: workingScore,
      after: workingScore - 0.08,
      reason: "Revenue below optimal underwriting threshold",
    });
    workingScore -= 0.08;
  }

  if (acres < 50) {
    trace.push({
      layer: "SCORING",
      rule: "SMALL_ACREAGE_RISK",
      impact: -0.05,
      before: workingScore,
      after: workingScore - 0.05,
      reason: "Small acreage increases volatility risk",
    });
    workingScore -= 0.05;
  }

  // -------------------------
  // RISK RULES
  // -------------------------
  if (risk > 0.5) {
    trace.push({
      layer: "RISK",
      rule: "ELEVATED_OPERATIONAL_RISK",
      impact: -0.12,
      before: workingScore,
      after: workingScore - 0.12,
      reason: "Moderate-to-high operational risk detected",
    });
    workingScore -= 0.12;
  }

  // -------------------------
  // POLICY RULES
  // -------------------------
  if (policies.includes("USDA_HIGH_COMPLIANCE_REGION")) {
    trace.push({
      layer: "POLICY",
      rule: "USDA_HIGH_COMPLIANCE_REGION",
      impact: -0.03,
      before: workingScore,
      after: workingScore - 0.03,
      reason: "High compliance region increases regulatory burden",
    });
    workingScore -= 0.03;
  }

  if (policies.includes("SBA_LOW_AGRI_SCALE")) {
    trace.push({
      layer: "POLICY",
      rule: "SBA_SCALE_LIMIT",
      impact: -0.06,
      before: workingScore,
      after: workingScore - 0.06,
      reason: "Farm size below SBA preferred scale",
    });
    workingScore -= 0.06;
  }

  // -------------------------
  // DECISION RULE
  // -------------------------
  if (decision === "REJECT") {
    trace.push({
      layer: "DECISION",
      rule: "REJECT_THRESHOLD",
      impact: 0,
      before: workingScore,
      after: workingScore,
      reason: "Final composite score below approval threshold",
    });
  }

  return {
    trace,
    finalScore: workingScore,
  };
}
