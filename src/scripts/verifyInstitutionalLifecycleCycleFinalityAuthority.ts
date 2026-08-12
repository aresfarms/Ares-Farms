import assert from "node:assert/strict";
import type { InstitutionalLifecycleCycleMonitoringDischargeEvaluation } from "@/lib/platform/institutionalLifecycleCycleMonitoringDischargeAuthority";
import { createInstitutionalLifecycleCycleFinalityPolicy, evaluateInstitutionalLifecycleCycleFinality } from "@/lib/platform/institutionalLifecycleCycleFinalityAuthority";

const discharge={cyclePolicyId:"cycle-policy-1",cycleId:"cycle-2",generation:2,dischargePolicyId:"discharge-1",canonicalObjectId:"object-1",decision:"ALLOW",resultingState:"DISCHARGED",replayRef:"replay-1"} as InstitutionalLifecycleCycleMonitoringDischargeEvaluation;
const policy=createInstitutionalLifecycleCycleFinalityPolicy({policyId:"finality-1",governanceVersion:"gov-1",requireImmutableRecord:true,requireRetentionPolicy:true,requireLegalHoldAssessment:true,requireClosureNotice:true,requireReopeningAuthority:true,requiredEvidenceRefs:["evidence-final"],auditRefs:["audit-policy"],replayRef:"replay-policy",versionRefs:["version-1"]});
const base={discharge,policy,immutableRecordRefs:["record-1"],retentionPolicyRef:"retention-1",legalHoldAssessmentRef:"legal-1",closureNoticeRef:"notice-1",reopeningAuthorityRef:"reopen-1",evidenceRefs:["evidence-final"],finalizedAt:"2026-07-26T00:00:00Z",auditRefs:["audit-eval"],replayRef:"replay-1"};
const allowed=evaluateInstitutionalLifecycleCycleFinality(base);
const review=evaluateInstitutionalLifecycleCycleFinality({...base,legalHoldAssessmentRef:null,closureNoticeRef:null,auditRefs:["audit-review"]});
const blocked=evaluateInstitutionalLifecycleCycleFinality({...base,immutableRecordRefs:[],auditRefs:["audit-block"]});
assert.equal(allowed.decision,"ALLOW");assert.equal(allowed.resultingState,"FINALIZED");assert.equal(review.decision,"REVIEW_REQUIRED");assert.equal(blocked.decision,"BLOCK");
console.log(JSON.stringify({ok:true,schemaVersion:allowed.schemaVersion,allowed:allowed.decision,review:review.decision,blocked:blocked.decision,state:allowed.resultingState,generation:allowed.generation,message:"Institutional lifecycle cycle finality authority conformance passed."},null,2));
