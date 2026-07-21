import { createHash, createHmac } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { productionOfficialReportAuthorityInventory as inventory, productionOfficialReportAuthorization as authorization, productionOfficialReportAuthorityVersion as inventoryVersion } from "@/lib/governance/productionOfficialReportAuthorityInventory";
const PROJECT = process.env.GCP_PROJECT ?? "furlong-staging-499102";
const REVISION = process.env.P5_REPORT_REVISION ?? "furlong-core-00100-562";
function sh(cmd: string, args: string[]): string { return execFileSync(cmd, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim(); }
function gcloud(args: string[]): string { return sh("gcloud", [...args, "--project", PROJECT]); }
function npmPass(script: string): boolean { try { sh("npm", ["run", "-s", script]); return true; } catch { return false; } }
function main(): void {
 const checks: Array<{name:string;pass:boolean;evidence:string}> = []; const add=(name:string,pass:boolean,evidence:string)=>checks.push({name,pass,evidence});
 const liveRevision=gcloud(["run","services","describe","furlong-core","--region","us-central1","--format","value(status.latestReadyRevisionName)"]);
 const liveImage=gcloud(["run","services","describe","furlong-core","--region","us-central1","--format","value(spec.template.spec.containers[0].image)"]);
 add("target revision is live",liveRevision===REVISION,`${liveRevision} expected ${REVISION}`); add("live image is digest pinned",liveImage.includes("@sha256:"),liveImage);
 add("official report authority smoke",npmPass("smoke:production-official-report-authority"),"npm run smoke:production-official-report-authority");
 add("content claims policy",npmPass("smoke:content-claims"),"npm run smoke:content-claims");
 add("governed report PDF route",existsSync(path.join(process.cwd(),"src/app/api/reports/pdf/route.ts")),"/api/reports/pdf");
 add("report attestation signing",existsSync(path.join(process.cwd(),"src/lib/security/reportAttestation.ts")),"reportAttestation.ts");
 add("all report types inventoried",inventory.length>=6,`${inventory.length} report types`);
 add("qualified reviewer required",inventory.every(x=>x.qualifiedReviewerRequired),"all report types"); add("legal compliance review required",inventory.every(x=>x.legalComplianceReviewRequired),"all report types");
 add("citation and provenance required",inventory.every(x=>x.sourceCitationRequired&&x.provenanceRequired),"all report types"); add("classification and redaction required",inventory.every(x=>x.dataClassificationRequired&&x.redactionRequired),"all report types");
 add("replay version and signature required",inventory.every(x=>x.deterministicRegenerationRequired&&x.immutableVersionRequired&&x.cryptographicSignatureRequired),"all report types");
 add("claims and publication authority required",inventory.every(x=>x.claimsPolicyRequired&&x.publicationAuthorityRequired),"all report types");
 add("human approval preserved",authorization.approvalRequired&&!authorization.approvalGranted,JSON.stringify(authorization));
 add("official publication and reliance remain blocked",inventory.every(x=>!x.publicationApproved&&!x.publicVerificationPermitted&&!x.officialReliancePermitted)&&!authorization.productionAuthorized,"fail-closed");
 const failed=checks.filter(x=>!x.pass); const generatedAtUtc=new Date().toISOString(); const report={schemaVersion:"p5-official-report-authority-readiness-v1",environment:"staging",targetRevision:REVISION,targetImage:liveImage,blockerId:"P5-B06",blockerStatus:failed.length?"OPEN":"EVIDENCE_READY_HUMAN_APPROVAL_REQUIRED",outcome:failed.length?"FAIL":"PASS",productionAuthorized:false,officialPublicationPermitted:false,publicVerificationPermitted:false,officialReliancePermitted:false,inventoryVersion,inventory,authorization,checks,generatedAtUtc};
 const bytes=JSON.stringify(report,null,2); const secret=gcloud(["secrets","versions","access","latest","--secret","REPORT_SIGNING_SECRET"]); const signatureRecord={algorithm:"HMAC-SHA256",keyId:"gcp-secret-manager://REPORT_SIGNING_SECRET/latest",reportSha256:createHash("sha256").update(bytes).digest("hex"),signature:createHmac("sha256",secret).update(bytes).digest("base64url"),signedAtUtc:generatedAtUtc};
 const dir=path.join(process.cwd(),"artifacts","deployments","staging"); mkdirSync(dir,{recursive:true}); const stamp=generatedAtUtc.replace(/[:.]/g,"-"); const reportPath=path.join(dir,`${stamp}-p5-b06-official-report-authority.json`); const signaturePath=path.join(dir,`${stamp}-p5-b06-official-report-authority-signature.json`); writeFileSync(reportPath,bytes); writeFileSync(signaturePath,JSON.stringify(signatureRecord,null,2)); console.log(JSON.stringify({outcome:report.outcome,blockerStatus:report.blockerStatus,passed:checks.length-failed.length,total:checks.length,failed:failed.map(x=>x.name),reportPath:path.relative(process.cwd(),reportPath),signaturePath:path.relative(process.cwd(),signaturePath),...signatureRecord},null,2)); if(failed.length)process.exit(1);
}
main();
