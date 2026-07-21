import { createHash, createHmac } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { evaluateProductionCutoverHoldGate } from "@/lib/governance/productionCutoverHoldGate";
import { evaluateProductionReleaseBoard } from "@/lib/governance/productionReleaseBoard";
import { productionDomainCutoverAuthorization as authorization, productionDomainCutoverAuthorizationInventory as inventory, productionDomainCutoverAuthorizationVersion as inventoryVersion } from "@/lib/governance/productionDomainCutoverAuthorizationInventory";

const PROJECT = process.env.GCP_PROJECT ?? "furlong-staging-499102";
const REVISION = process.env.P5_CUTOVER_REVISION ?? "furlong-core-00102-mg7";
function sh(cmd: string, args: string[]): string { return execFileSync(cmd, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim(); }
function gcloud(args: string[]): string { return sh("gcloud", [...args, "--project", PROJECT]); }
function npmPass(script: string): boolean { try { sh("npm", ["run", "-s", script]); return true; } catch { return false; } }
function optionalGcloud(args: string[]): string { try { return gcloud(args); } catch { return ""; } }
function main(): void {
  const checks: Array<{name:string;pass:boolean;evidence:string}> = []; const add=(name:string,pass:boolean,evidence:string)=>checks.push({name,pass,evidence});
  const liveRevision=gcloud(["run","services","describe","furlong-core","--region","us-central1","--format","value(status.latestReadyRevisionName)"]);
  const liveImage=gcloud(["run","services","describe","furlong-core","--region","us-central1","--format","value(spec.template.spec.containers[0].image)"]);
  const domainMappings=optionalGcloud(["beta","run","domain-mappings","list","--region","us-central1","--format","value(metadata.name)"]);
  const dnsZones=optionalGcloud(["dns","managed-zones","list","--format","value(name,dnsName)"]);
  const hold=evaluateProductionCutoverHoldGate(); const board=evaluateProductionReleaseBoard();
  add("target revision is live",liveRevision===REVISION,`${liveRevision} expected ${REVISION}`);
  add("live image is digest pinned",liveImage.includes("@sha256:"),liveImage);
  add("domain cutover authorization smoke",npmPass("smoke:production-domain-cutover-authorization"),"npm run smoke:production-domain-cutover-authorization");
  add("production cutover hold gate",npmPass("smoke:production-cutover-hold"),"npm run smoke:production-cutover-hold");
  add("production release board gate",npmPass("smoke:production-release-board"),"npm run smoke:production-release-board");
  add("all production edge surfaces inventoried",inventory.length>=6,`${inventory.length} surfaces`);
  add("DNS ownership and change-set controls required",inventory.every(x=>x.domainOwnershipVerifiedRequired&&x.dnsZoneAuthorityVerifiedRequired&&x.exactDnsChangeSetRequired&&x.ttlReductionPlanRequired),"all surfaces");
  add("certificate TLS CDN and WAF controls required",inventory.every(x=>x.managedCertificateRequired&&x.certificateIssuanceVerifiedRequired&&x.tlsPolicyRequired&&x.cdnPolicyRequired&&x.wafPolicyRequired),"all surfaces");
  add("health monitoring and incident controls required",inventory.every(x=>x.healthProbeRequired&&x.monitoringAndAlertingRequired&&x.incidentBridgeRequired),"all surfaces");
  add("cutover and rollback controls required",inventory.every(x=>x.cutoverRunbookRequired&&x.rollbackRunbookRequired&&x.rollbackTargetRequired&&x.rollbackDrillRequired&&x.changeWindowRequired),"all surfaces");
  add("qualified release authority required",inventory.every(x=>x.qualifiedReleaseManagerRequired&&x.releaseBoardApprovalRequired&&x.finalLaunchHoldReleaseRequired),"all surfaces");
  add("staging has no Cloud Run domain mapping",domainMappings.length===0,domainMappings||"none");
  add("staging has no managed public DNS zone",dnsZones.length===0,dnsZones||"none");
  add("cutover and release holds preserved",hold.summary.publicDnsCutoverAllowed===0&&hold.summary.productionCutoverExecuted===0&&hold.summary.finalGoLiveHoldReleased===0&&board.summary.releaseBoardApprovalGranted===0&&board.summary.launchHoldReleased===0,"zero cutover/release authority");
  add("human approval preserved",authorization.approvalRequired&&!authorization.approvalGranted&&!authorization.productionAuthorized,JSON.stringify(authorization));
  add("DNS certificate exposure and launch remain blocked",inventory.every(x=>!x.dnsCutoverApproved&&!x.certificateActivationApproved&&!x.publicExposureApproved&&!x.finalLaunchHoldReleased)&&!authorization.finalLaunchHoldReleased,"fail-closed");
  const failed=checks.filter(x=>!x.pass); const generatedAtUtc=new Date().toISOString();
  const report={schemaVersion:"p5-domain-cutover-authorization-readiness-v1",environment:"staging",targetRevision:REVISION,targetImage:liveImage,blockerId:"P5-B10",blockerStatus:failed.length?"OPEN":"EVIDENCE_READY_HUMAN_APPROVAL_REQUIRED",outcome:failed.length?"FAIL":"PASS",productionAuthorized:false,dnsCutoverPermitted:false,certificateActivationPermitted:false,publicProductionExposurePermitted:false,finalLaunchHoldReleased:false,inventoryVersion,inventory,authorization,cloudEdgeEvidence:{domainMappings:domainMappings||null,dnsManagedZones:dnsZones||null},checks,generatedAtUtc};
  const bytes=JSON.stringify(report,null,2); const secret=gcloud(["secrets","versions","access","latest","--secret","REPORT_SIGNING_SECRET"]); const signatureRecord={algorithm:"HMAC-SHA256",keyId:"gcp-secret-manager://REPORT_SIGNING_SECRET/latest",reportSha256:createHash("sha256").update(bytes).digest("hex"),signature:createHmac("sha256",secret).update(bytes).digest("base64url"),signedAtUtc:generatedAtUtc};
  const dir=path.join(process.cwd(),"artifacts","deployments","staging"); mkdirSync(dir,{recursive:true}); const stamp=generatedAtUtc.replace(/[:.]/g,"-"); const reportPath=path.join(dir,`${stamp}-p5-b10-domain-cutover-authorization.json`); const signaturePath=path.join(dir,`${stamp}-p5-b10-domain-cutover-authorization-signature.json`); writeFileSync(reportPath,bytes); writeFileSync(signaturePath,JSON.stringify(signatureRecord,null,2)); console.log(JSON.stringify({outcome:report.outcome,blockerStatus:report.blockerStatus,passed:checks.length-failed.length,total:checks.length,failed:failed.map(x=>x.name),reportPath:path.relative(process.cwd(),reportPath),signaturePath:path.relative(process.cwd(),signaturePath),...signatureRecord},null,2)); if(failed.length)process.exit(1);
}
main();
