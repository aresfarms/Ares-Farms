export function buildExplanation(input: any) {
  const reasons: string[] = [];
  const riskDrivers: string[] = [];
  const policyDrivers: string[] = [];
  const financialDrivers: string[] = [];

  const score = input.score?.score ?? 0;
  const risk = input.risk?.riskScore ?? 0;
  const decision = input.decision?.decision ?? "REVIEW";

  const acres = input.metadata?.acres ?? 0;
  const revenue = input.financials?.revenue ?? 0;

  const policy = input.policy ?? {};
  const policies = policy.policies ?? [];

  // -------------------------
  // FINANCIAL DRIVERS
  // -------------------------
  if (score < 0.4) {
    financialDrivers.push("Low financial performance score");
  }

  if (revenue < 100000) {
    financialDrivers.push("Below optimal revenue threshold");
  }

  if (acres < 50) {
    financialDrivers.push("Small acreage increases volatility risk");
  }

  // -------------------------
  // RISK DRIVERS
  // -------------------------
  if (risk > 0.5) {
    riskDrivers.push("Moderate to elevated operational risk detected");
  }

  if (risk > 0.7) {
    riskDrivers.push("High risk profile may indicate instability");
  }

  // -------------------------
  // POLICY DRIVERS
  // -------------------------
  if (policies.includes("USDA_HIGH_COMPLIANCE_REGION")) {
    policyDrivers.push("High compliance region increases regulatory scrutiny");
  }

  if (policies.includes("SBA_LOW_AGRI_SCALE")) {
    policyDrivers.push("Farm scale may not meet SBA thresholds");
  }

  // -------------------------
  // DECISION REASONS
  // -------------------------
  if (decision === "REJECT") {
    reasons.push("Composite score below approval threshold");
  }

  if (decision === "REVIEW") {
    reasons.push("Mixed signals require manual underwriting review");
  }

  if (decision === "APPROVE") {
    reasons.push("Strong financial and risk alignment");
  }

  return {
    explanation: {
      decision,
      reasons,
      riskDrivers,
      policyDrivers,
      financialDrivers,
    },
  };
}
