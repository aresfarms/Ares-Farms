import assert from "node:assert/strict";
import { createInstitutionalAppealRemandFinalityPolicy, evaluateInstitutionalAppealRemandFinality } from "@/lib/platform/institutionalAppealRemandFinalityAuthority";
import type { InstitutionalAppealRemandMonitoringDischargeEvaluation } from "@/lib/platform/institutionalAppealRemandMonitoringDischargeAuthority";

const discharge={schemaVersion:"institutional-appeal-remand-monitoring-discharge-v1",monitoringPolicyId:"monitor",dischargePolicyId:"discharge",reconciliationId:"recon",mode:"DISCHARGE",decision:"ALLOW",resultingState:"DISCHARGED",reasons:[],approvalRefs:["approval"],evidenceRefs:["evidence-discharge"],evaluatedAt:"2026-07-27T12:00:00Z",auditRefs:["audit-discharge"],replayRef:"replay-discharge"} as InstitutionalAppealRemandMonitoringDischargeEvaluation;
const policy=createInstitutionalAppealRemandFinalityPolicy({policyId:"finality",governanceVersion:"gov-1",requireImmutableRecord:true,requireRetentionPolicy:true,requireLegalHoldAssessment:true,requireClosureNotice:true,requireReopeningAuthority:true,requiredEvidenceRefs:["evidence-final"],auditRefs:["audit-policy"],replayRef:"replay-policy",versionRefs:["version-1"]});
const base={discharge,policy,immutableRecordRefs:["record-1"],retentionPolicyRef:"retention-1",legalHoldAssessmentRef:"hold-1",closureNoticeRef:"notice-1",reopeningAuthorityRef:"reopen-1",evidenceRefs:["evidence-final"],finalizedAt:"2026-07-27T13:00:00Z",auditRefs:["audit-eval"],replayRef:"replay-eval"};
const allowed=evaluateInstitutionalAppealRemandFinality(base);
const review=evaluateInstitutionalAppealRemandFinality({...base,closureNoticeRef:null,legalHoldAssessmentRef:null});
const blocked=evaluateInstitutionalAppealRemandFinality({...base,immutableRecordRefs:[]});
assert.equal(allowed.decision,"ALLOW");assert.equal(allowed.resultingState,"FINALIZED");assert.equal(review.decision,"REVIEW_REQUIRED");assert.equal(blocked.decision,"BLOCK");
console.log(JSON.stringify({ok:true,schemaVersion:allowed.schemaVersion,allowed:allowed.decision,review:review.decision,blocked:blocked.decision,state:allowed.resultingState,message:"Institutional appeal remand finality authority conformance passed."},null,2));
