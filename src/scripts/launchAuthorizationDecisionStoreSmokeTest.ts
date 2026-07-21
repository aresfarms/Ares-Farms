import { launchAuthorizationRequirements } from "@/lib/governance/consolidatedLaunchAuthorizationLedger";
import { actorMayDecide, buildLaunchDecisionRollup } from "@/lib/governance/launchAuthorizationDecisionStore";
function assert(v: unknown,m:string): asserts v { if(!v) throw new Error(m); }
const r=buildLaunchDecisionRollup();
assert(r.required===19,"All 19 authority slots are required.");
assert(r.completed===0 && !r.approvalsComplete && !r.productionAuthorized,"Decision store must start fail-closed.");
assert(actorMayDecide("chudson@aresfarmsinc.com","CAITLIN_NAMED_TESTER"),"Caitlin binding missing.");
assert(actorMayDecide("stuart@aresfarmsinc.com","STUART_NAMED_TESTER"),"Stuart binding missing.");
assert(!actorMayDecide("chudson@aresfarmsinc.com","STUART_NAMED_TESTER"),"Proxy tester submission must be blocked.");
assert(launchAuthorizationRequirements.length===10,"All blockers must remain represented.");
console.log(JSON.stringify({ok:true,required:r.required,completed:r.completed,productionAuthorized:r.productionAuthorized},null,2));
