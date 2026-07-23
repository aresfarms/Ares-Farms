import { launchAuthorizationRequirements } from "@/lib/governance/consolidatedLaunchAuthorizationLedger";
import { actorMayDecide, actorMayUseStagingUltimateAuthority, buildLaunchDecisionRollup } from "@/lib/governance/launchAuthorizationDecisionStore";
import { validateLaunchAuthorityAssignments } from "@/lib/governance/launchAuthorityAssignmentRegistry";
function assert(v: unknown,m:string): asserts v { if(!v) throw new Error(m); }
const r=buildLaunchDecisionRollup();
assert(r.required===19,"All 19 authority slots are required.");
assert(r.completed===0 && !r.approvalsComplete && !r.productionAuthorized,"Decision store must start fail-closed.");
assert(actorMayDecide("chudson@aresfarmsinc.com","CAITLIN_NAMED_TESTER"),"Caitlin binding missing.");
assert(actorMayDecide("stuart@aresfarmsinc.com","STUART_NAMED_TESTER"),"Stuart binding missing.");
assert(actorMayDecide("chudson@aresfarmsinc.com","DATA_RIGHTS_OFFICER"),"Data Rights Officer binding missing.");
assert(!actorMayDecide("chudson@aresfarmsinc.com","SECURITY_AUTHORITY"),"Unfilled security authority must remain blocked.");
assert(validateLaunchAuthorityAssignments().length===0,"Assignment registry validation failed.");
assert(r.slots.filter((slot)=>slot.assignment?.status==="ASSIGNED").length===3,"Exactly three launch slots should currently be assigned.");
assert(!actorMayDecide("chudson@aresfarmsinc.com","STUART_NAMED_TESTER"),"Proxy tester submission must be blocked.");
assert(launchAuthorizationRequirements.length===10,"All blockers must remain represented.");
const stagingOverrideEnv: NodeJS.ProcessEnv = {
  ...process.env,
  LAUNCH_TEST_ULTIMATE_AUTHORITY_ENABLED: "true",
  GOOGLE_CLOUD_PROJECT: "furlong-staging-499102",
  LAUNCH_TEST_ULTIMATE_AUTHORITY_EMAILS: "chudson@aresfarmsinc.com",
} as NodeJS.ProcessEnv;
assert(actorMayUseStagingUltimateAuthority("chudson@aresfarmsinc.com", stagingOverrideEnv),"Caitlin staging override should activate only under the explicit staging gate.");
assert(!actorMayUseStagingUltimateAuthority("stuart@aresfarmsinc.com", stagingOverrideEnv),"Unlisted identities must not receive staging ultimate authority.");
assert(!actorMayUseStagingUltimateAuthority("chudson@aresfarmsinc.com", {...stagingOverrideEnv, GOOGLE_CLOUD_PROJECT:"furlong-production"}),"Staging ultimate authority must fail closed outside the staging project.");

console.log(JSON.stringify({ok:true,required:r.required,completed:r.completed,productionAuthorized:r.productionAuthorized},null,2));
