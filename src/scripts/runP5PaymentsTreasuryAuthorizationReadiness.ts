import { createHash, createHmac } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { productionPaymentsTreasuryAuthorization as authorization, productionPaymentsTreasuryControlInventory as inventory, productionPaymentsTreasuryAuthorizationVersion as inventoryVersion } from "@/lib/governance/productionPaymentsTreasuryAuthorizationInventory";
const PROJECT = process.env.GCP_PROJECT ?? "furlong-staging-499102";
const REVISION = process.env.P5_PAYMENTS_REVISION ?? "furlong-core-00101-zhz";
function sh(cmd:string,args:string[]):string{return execFileSync(cmd,args,{encoding:"utf8",stdio:["ignore","pipe","pipe"]}).trim();}
function gcloud(args:string[]):string{return sh("gcloud",[...args,"--project",PROJECT]);}
function npmPass(script:string):boolean{try{sh("npm",["run","-s",script]);return true;}catch{return false;}}
function main():void{
 const checks:Array<{name:string;pass:boolean;evidence:string}>=[];const add=(name:string,pass:boolean,evidence:string)=>checks.push({name,pass,evidence});
 const liveRevision=gcloud(["run","services","describe","furlong-core","--region","us-central1","--format","value(status.latestReadyRevisionName)"]);const liveImage=gcloud(["run","services","describe","furlong-core","--region","us-central1","--format","value(spec.template.spec.containers[0].image)"]);
 add("target revision is live",liveRevision===REVISION,`${liveRevision} expected ${REVISION}`);add("live image is digest pinned",liveImage.includes("@sha256:"),liveImage);
 add("payments treasury authority smoke",npmPass("smoke:production-payments-treasury-authorization"),"npm run smoke:production-payments-treasury-authorization");
 add("payment connector control implementation",existsSync(path.join(process.cwd(),"src/lib/billing/paymentConnectorControlStore.ts")),"paymentConnectorControlStore.ts");
 add("treasury governance guard",existsSync(path.join(process.cwd(),"src/lib/treasury/treasuryGovernanceGuard.ts")),"treasuryGovernanceGuard.ts");
 add("all financial operations inventoried",inventory.length>=8,`${inventory.length} operations`);
 add("qualified treasury authority required",inventory.every(x=>x.qualifiedTreasuryAuthorityRequired&&x.separationOfPowersRequired),"all operations");
 add("processor payment and fee authority required",inventory.every(x=>x.processorCertificationRequired&&x.paymentAuthorityRequired&&x.feeScheduleApprovalRequired),"all operations");
 add("borrower fee disclosure required",inventory.every(x=>x.borrowerFeeDisclosureRequired),"all operations");
 add("refund and dispute controls required",inventory.every(x=>x.refundPolicyRequired&&x.disputePolicyRequired),"all operations");
 add("reconciliation required",inventory.every(x=>x.reconciliationPolicyRequired),"all operations");
 add("immutable ledger replay and audit required",inventory.every(x=>x.immutableLedgerRequired&&x.deterministicReplayRequired&&x.auditEvidenceRequired),"all operations");
 add("reserve and rollback controls required",inventory.every(x=>x.reserveFloorProtectionRequired&&x.rollbackKillSwitchRequired),"all operations");
 add("human financial approval preserved",authorization.approvalRequired&&!authorization.approvalGranted,JSON.stringify(authorization));
 add("live money movement remains blocked",inventory.every(x=>!x.executionApproved&&!x.liveMoneyMovementPermitted)&&!authorization.liveMoneyMovementPermitted&&!authorization.productionAuthorized,"fail-closed");
 const failed=checks.filter(x=>!x.pass);const generatedAtUtc=new Date().toISOString();const report={schemaVersion:"p5-payments-treasury-authorization-readiness-v1",environment:"staging",targetRevision:REVISION,targetImage:liveImage,blockerId:"P5-B07",blockerStatus:failed.length?"OPEN":"EVIDENCE_READY_HUMAN_APPROVAL_REQUIRED",outcome:failed.length?"FAIL":"PASS",productionAuthorized:false,liveMoneyMovementPermitted:false,inventoryVersion,inventory,authorization,checks,generatedAtUtc};
 const bytes=JSON.stringify(report,null,2);const secret=gcloud(["secrets","versions","access","latest","--secret","REPORT_SIGNING_SECRET"]);const signatureRecord={algorithm:"HMAC-SHA256",keyId:"gcp-secret-manager://REPORT_SIGNING_SECRET/latest",reportSha256:createHash("sha256").update(bytes).digest("hex"),signature:createHmac("sha256",secret).update(bytes).digest("base64url"),signedAtUtc:generatedAtUtc};
 const dir=path.join(process.cwd(),"artifacts","deployments","staging");mkdirSync(dir,{recursive:true});const stamp=generatedAtUtc.replace(/[:.]/g,"-");const reportPath=path.join(dir,`${stamp}-p5-b07-payments-treasury-authorization.json`);const signaturePath=path.join(dir,`${stamp}-p5-b07-payments-treasury-authorization-signature.json`);writeFileSync(reportPath,bytes);writeFileSync(signaturePath,JSON.stringify(signatureRecord,null,2));console.log(JSON.stringify({outcome:report.outcome,blockerStatus:report.blockerStatus,passed:checks.length-failed.length,total:checks.length,failed:failed.map(x=>x.name),reportPath:path.relative(process.cwd(),reportPath),signaturePath:path.relative(process.cwd(),signaturePath),...signatureRecord},null,2));if(failed.length)process.exit(1);
}
main();
