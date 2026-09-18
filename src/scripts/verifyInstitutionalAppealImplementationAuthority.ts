import assert from "node:assert/strict";
import { institutionalAppealImplementationAuthority as authority } from "@/lib/platform/institutionalAppealImplementationAuthority";
import type { InstitutionalRevocationAppealEvaluation } from "@/lib/platform/institutionalRevocationAppealAuthority";

const appeal={appealPolicyId:"appeal-policy",reconciliationId:"recon-1",disposition:"MODIFY",appealedScopes:["PUBLICATION"],decision:"ALLOW",resultingState:"MODIFIED"} as unknown as InstitutionalRevocationAppealEvaluation;
const policy=authority.createPolicy({policyId:"implementation-policy",governanceVersion:"gov-1",allowedModes:["RESTORE_SELECTED","NO_CHANGE","REMAND_FOR_ACTION"],requireExecutionApproval:true,requireImplementationNotice:true,requireRestorationPlan:true,fullRestorationAuthorized:false,requiredEvidenceRefs:["evidence-final"],auditRefs:["audit-policy"],replayRef:"replay-policy",versionRefs:["version-1"]});
const allowed=authority.evaluate({appeal,policy,mode:"RESTORE_SELECTED",restoreScopes:["PUBLICATION"],approvalRefs:["approval-1"],implementationNoticeRef:"notice-1",restorationPlanRef:"plan-1",evidenceRefs:["evidence-final"],implementedAt:"2026-07-22T15:10:00Z",auditRefs:["audit-1"],replayRef:"replay-1"});
const review=authority.evaluate({appeal,policy,mode:"RESTORE_SELECTED",restoreScopes:["PUBLICATION"],evidenceRefs:["evidence-final"],implementedAt:"2026-07-22T15:10:00Z",auditRefs:["audit-2"],replayRef:"replay-2"});
const blocked=authority.evaluate({appeal,policy,mode:"RESTORE_SELECTED",restoreScopes:["ACTION"],approvalRefs:["approval-1"],implementationNoticeRef:"notice-1",restorationPlanRef:"plan-1",evidenceRefs:["evidence-final"],implementedAt:"2026-07-22T15:10:00Z",auditRefs:["audit-3"],replayRef:"replay-3"});
assert.equal(allowed.decision,"ALLOW");assert.equal(allowed.resultingState,"PARTIALLY_RESTORED");assert.equal(review.decision,"REVIEW_REQUIRED");assert.equal(blocked.decision,"BLOCK");
console.log(JSON.stringify({ok:true,schemaVersion:allowed.schemaVersion,allowed:allowed.decision,review:review.decision,blocked:blocked.decision,state:allowed.resultingState,message:"Institutional appeal implementation authority conformance passed."},null,2));
