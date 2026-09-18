import { createHash, createHmac } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { financingActivationControls, financingBoundaryMatrix, productionFinancingAuthority, PRODUCTION_FINANCING_AUTHORITY_VERSION } from "@/lib/governance/productionFinancingAuthorityInventory";

const PROJECT = process.env.GCP_PROJECT ?? "furlong-staging-499102";
function sh(c:string,a:string[]){return execFileSync(c,a,{encoding:"utf8",stdio:["ignore","pipe","pipe"]}).trim();}
function gc(a:string[]){return sh("gcloud",[...a,"--project",PROJECT]);}
function npmPass(s:string){try{sh("npm",["run","-s",s]);return true;}catch{return false;}}
const liveRevision=gc(["run","services","describe","furlong-core","--region","us-central1","--format","value(status.latestReadyRevisionName)"]);
const liveImage=gc(["run","services","describe","furlong-core","--region","us-central1","--format","value(spec.template.spec.containers[0].image)"]);
const checks=[
 ["live revision ready",Boolean(liveRevision),liveRevision],
 ["image digest pinned",liveImage.includes("@sha256:"),liveImage],
 ["financing authority smoke",npmPass("smoke:production-financing-authority"),"npm run smoke:production-financing-authority"],
 ["lender workflow v2",npmPass("smoke:lender-workflow-v2"),"npm run smoke:lender-workflow-v2"],
 ["lender workflow v1",npmPass("smoke:lender-workflow"),"npm run smoke:lender-workflow"],
 ["credit authority registered",productionFinancingAuthority.ownerPresent,"CREDIT_ELIGIBILITY_AUTHORITY"],
 ["activation controls complete",financingActivationControls.length>=12,String(financingActivationControls.length)],
 ["Furlong cannot determine eligibility",financingBoundaryMatrix.some(r=>r.action==="determine eligibility"&&r.furlong==="PROHIBITED"),"boundary matrix"],
 ["Furlong cannot underwrite",financingBoundaryMatrix.some(r=>r.action==="underwrite credit"&&r.furlong==="PROHIBITED"),"boundary matrix"],
 ["Furlong cannot approve or deny",financingBoundaryMatrix.some(r=>r.action==="approve or deny"&&r.furlong==="PROHIBITED"),"boundary matrix"],
 ["human approval preserved",productionFinancingAuthority.qualifiedHumanApprovalRequired&&!productionFinancingAuthority.qualifiedHumanApprovalGranted,JSON.stringify(productionFinancingAuthority)],
 ["lender participation blocked",!productionFinancingAuthority.lenderParticipationApproved,"lenderParticipationApproved=false"],
 ["production financing blocked",!productionFinancingAuthority.productionFinancingPermitted,"productionFinancingPermitted=false"],
 ["autonomous credit blocked",!productionFinancingAuthority.autonomousCreditDecisionPermitted,"autonomousCreditDecisionPermitted=false"],
 ["notices and payments blocked",!productionFinancingAuthority.borrowerNoticeSendPermitted&&!productionFinancingAuthority.paymentAuthorizationPermitted,"notice/payment=false"],
].map(([name,pass,evidence])=>({name:String(name),pass:Boolean(pass),evidence:String(evidence)}));
const failed=checks.filter(c=>!c.pass); const generatedAtUtc=new Date().toISOString();
const report={schemaVersion:"p5-financing-authority-readiness-v1",environment:"staging",targetRevision:liveRevision,targetImage:liveImage,blockerId:"P5-B03",blockerStatus:failed.length?"OPEN":"EVIDENCE_READY_HUMAN_APPROVAL_REQUIRED",outcome:failed.length?"FAIL":"PASS",productionAuthorized:false,productionFinancingPermitted:false,authorityVersion:PRODUCTION_FINANCING_AUTHORITY_VERSION,authority:productionFinancingAuthority,requiredControls:financingActivationControls,boundaryMatrix:financingBoundaryMatrix,checks,generatedAtUtc};
const bytes=JSON.stringify(report,null,2); const secret=gc(["secrets","versions","access","latest","--secret","REPORT_SIGNING_SECRET"]); const sig={algorithm:"HMAC-SHA256",keyId:"gcp-secret-manager://REPORT_SIGNING_SECRET/latest",reportSha256:createHash("sha256").update(bytes).digest("hex"),signature:createHmac("sha256",secret).update(bytes).digest("base64url"),signedAtUtc:generatedAtUtc};
const dir=path.join(process.cwd(),"artifacts","deployments","staging");mkdirSync(dir,{recursive:true});const stamp=generatedAtUtc.replace(/[:.]/g,"-");const rp=path.join(dir,`${stamp}-p5-b03-financing-authority.json`);const sp=path.join(dir,`${stamp}-p5-b03-financing-authority-signature.json`);writeFileSync(rp,bytes);writeFileSync(sp,JSON.stringify(sig,null,2));
console.log(JSON.stringify({outcome:report.outcome,blockerStatus:report.blockerStatus,passed:checks.length-failed.length,total:checks.length,failed:failed.map(c=>c.name),reportPath:path.relative(process.cwd(),rp),signaturePath:path.relative(process.cwd(),sp),...sig},null,2));if(failed.length)process.exit(1);
