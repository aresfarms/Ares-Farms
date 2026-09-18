import assert from "node:assert/strict";
import type { InstitutionalLifecycleCyclePostReinstatementMonitoringEvaluation } from "@/lib/platform/institutionalLifecycleCyclePostReinstatementMonitoringAuthority";
import { createInstitutionalLifecycleCycleMonitoringDischargePolicy, evaluateInstitutionalLifecycleCycleMonitoringDischarge } from "@/lib/platform/institutionalLifecycleCycleMonitoringDischargeAuthority";

const monitoring={cyclePolicyId:"cycle-policy-1",cycleId:"cycle-2",generation:2,monitoringPolicyId:"monitor-1",canonicalObjectId:"object-1",decision:"CONTINUE",resultingState:"COMPLETE",replayRef:"replay-1"} as unknown as InstitutionalLifecycleCyclePostReinstatementMonitoringEvaluation;
const policy=createInstitutionalLifecycleCycleMonitoringDischargePolicy({policyId:"discharge-1",governanceVersion:"gov-1",minimumMonitoringDays:30,requireCleanReviewHistory:true,requireFinalAssessment:true,requireHumanApproval:true,requireFinalNotice:true,requiredEvidenceRefs:["evidence-final"],auditRefs:["audit-policy"],replayRef:"replay-policy",versionRefs:["version-1"]});
const base={monitoring,policy,mode:"DISCHARGE" as const,monitoringStartedAt:"2026-06-01T00:00:00Z",evaluatedAt:"2026-07-26T00:00:00Z",cleanReviewHistory:true,evidenceRefs:["evidence-final"],auditRefs:["audit-eval"],replayRef:"replay-1"};
const allowed=evaluateInstitutionalLifecycleCycleMonitoringDischarge({...base,finalAssessmentRef:"assessment-1",approvalRefs:["approval-1"],finalNoticeRef:"notice-1"});
const review=evaluateInstitutionalLifecycleCycleMonitoringDischarge(base);
const blocked=evaluateInstitutionalLifecycleCycleMonitoringDischarge({...base,monitoringStartedAt:"2026-07-20T00:00:00Z",finalAssessmentRef:"assessment-1",approvalRefs:["approval-1"],finalNoticeRef:"notice-1"});
assert.equal(allowed.decision,"ALLOW");assert.equal(allowed.resultingState,"DISCHARGED");assert.equal(allowed.canonicalObjectId,"object-1");assert.equal(allowed.cycleId,"cycle-2");assert.equal(allowed.generation,2);assert.equal(review.decision,"REVIEW_REQUIRED");assert.equal(blocked.decision,"BLOCK");
console.log(JSON.stringify({ok:true,schemaVersion:allowed.schemaVersion,allowed:allowed.decision,review:review.decision,blocked:blocked.decision,state:allowed.resultingState,message:"Institutional lifecycle cycle monitoring discharge authority conformance passed."},null,2));
