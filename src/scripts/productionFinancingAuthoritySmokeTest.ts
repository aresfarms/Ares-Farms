import { composeLenderWorkflowV2 } from "@/lib/lender/workflowV2Runtime";
import { financingActivationControls, financingBoundaryMatrix, productionFinancingAuthority } from "@/lib/governance/productionFinancingAuthorityInventory";

function assert(v: unknown, m: string): asserts v { if (!v) throw new Error(m); }
const pack = composeLenderWorkflowV2({});
assert(productionFinancingAuthority.ownerPresent, "Credit/Eligibility Authority is missing.");
assert(financingActivationControls.length >= 12, "Financing activation controls are incomplete.");
assert(financingBoundaryMatrix.every((r) => r.furlong !== "QUALIFIED_HUMAN_ONLY"), "Furlong cannot hold credit authority.");
assert(pack.productionBlocked && pack.noUnderwritingReliance && pack.noOfficialCreditDecision && pack.noLenderCommitment, "Lender workflow failed closed boundary.");
assert(!productionFinancingAuthority.qualifiedHumanApprovalGranted, "Automation cannot grant financing approval.");
assert(!productionFinancingAuthority.productionFinancingPermitted, "Production financing must remain blocked.");
console.log(JSON.stringify({ ok: true, checkedAt: new Date().toISOString(), blockerId: "P5-B03", controls: financingActivationControls.length, productionFinancingPermitted: false, message: "Production financing authority passed fail-closed." }, null, 2));
