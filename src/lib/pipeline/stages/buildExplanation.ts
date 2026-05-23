export function buildExplanation(decision: any, risk: any, score: any) {
  return {
    explanation: {
      decision: decision.decision,
      reasons: decision.compositeScore > 0.6
        ? ["Meets approval threshold"]
        : ["Composite score below approval threshold"],
      riskDrivers: risk.flags,
      policyDrivers: [],
      financialDrivers: ["Score-based evaluation applied"],
    },
  };
}
