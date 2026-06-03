import { applyEngine } from "./applyEngine";
import { productionEngine } from "./productionEngine";
import { expenseEngine } from "./expenseEngine";
import { economicEngine } from "./economicEngine";
import { riskEngine } from "./riskEngine";
import { financialEngine } from "./financialEngine";
import { ruleEngine } from "./ruleEngine";

/**
 * 🧠 PHASE 5 — ORCHESTRATION LAYER
 * Ensures deterministic execution order + consistent data flow
 */

export function orchestrateFarmDecision(input: any) {
  /**
   * 1. CORE ENGINE (baseline + normalization)
   */
  const base = applyEngine(input);

  const farm = base.decision ? input : input;

  /**
   * 2. PRODUCTION LAYER
   */
  const production = productionEngine(farm, base.scores.sba);

  /**
   * 3. EXPENSE LAYER
   */
  const expenses = expenseEngine(farm);

  /**
   * 4. ECONOMIC LAYER
   */
  const economic = economicEngine(farm);

  /**
   * 5. RISK LAYER (depends on finance + SBA)
   */
  const risk = riskEngine(farm, base.scores.sba);

  /**
   * 6. FINANCIAL LAYER (depends on all above)
   */
  const financial = financialEngine({
    production,
    economic,
    expenses,
    risk,
  });

  /**
   * 7. RULES / COMPLIANCE LAYER
   */
  const rules = ruleEngine(farm);

  /**
   * 📦 FINAL CONSOLIDATED OUTPUT
   */
  return {
    tenantId: base.tenantId,

    scores: base.scores,

    decision: {
      ...base.decision,
      crops: production.crops,
      livestock: production.livestock,
      equipment: production.equipment,
      vendors: production.vendors,
      reports: production.reports,
    },

    financial,
    risk,
    economic,
    rules,

    system: {
      pipelineVersion: "phase-5-orchestrated",
      status: "deterministic",
    },
  };
}
