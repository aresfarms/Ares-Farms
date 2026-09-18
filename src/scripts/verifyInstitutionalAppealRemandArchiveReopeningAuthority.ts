import assert from "node:assert/strict";
import { institutionalAppealRemandArchiveReopeningAuthority as authority } from "@/lib/platform/institutionalAppealRemandArchiveReopeningAuthority";

const archive={schemaVersion:"institutional-appeal-remand-archive-projection-v1",finalityPolicyId:"finality",projectionPolicyId:"projection",canonicalObjectId:"case-1",decision:"ALLOW",resultingState:"ARCHIVED",reasons:[],evidenceRefs:["archive-evidence"],projectedAt:"2026-07-22T17:00:00Z",auditRefs:["archive-audit"],replayRef:"replay-1"} as const;
const policy=authority.createPolicy({policyId:"reopen",governanceVersion:"gov-1",allowedBases:["NEW_EVIDENCE","FRAUD_INDICATOR","LEGAL_MANDATE"],requireArchivedMatter:true,requireIndependentReview:true,requireMaterialityEvidence:true,requireLegalReview:true,requireFraudEscalation:false,fullReopeningAuthorized:true,requiredEvidenceRefs:["evidence-reopen"],auditRefs:["audit-policy"],replayRef:"replay-1",versionRefs:["version-1"]});
const base={archive,policy,basis:"NEW_EVIDENCE" as const,fullReopeningRequested:false,independentReviewRefs:["review-1"],materialityEvidenceRef:"materiality-1",legalReviewRef:"legal-1",fraudEscalationRef:null,evidenceRefs:["evidence-reopen"],evaluatedAt:"2026-07-23T17:00:00Z",auditRefs:["audit-eval"],replayRef:"replay-1"};
const allowed=authority.evaluate(base);
const review=authority.evaluate({...base,independentReviewRefs:[]});
const blocked=authority.evaluate({...base,replayRef:"replay-wrong"});
const full=authority.evaluate({...base,fullReopeningRequested:true});
assert.equal(allowed.decision,"ALLOW");assert.equal(allowed.resultingState,"REOPENED_RESTRICTED");
assert.equal(review.decision,"REVIEW_REQUIRED");assert.equal(blocked.decision,"BLOCK");assert.equal(full.resultingState,"REOPENED_FULL");
console.log(JSON.stringify({ok:true,schemaVersion:allowed.schemaVersion,allowed:allowed.decision,review:review.decision,blocked:blocked.decision,state:allowed.resultingState,fullState:full.resultingState,message:"Institutional appeal remand archive reopening authority conformance passed."},null,2));
