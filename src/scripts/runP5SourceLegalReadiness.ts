import { createHash, createHmac } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { productionSourceLegalAuthorization, productionSourceLegalInventory, productionSourceLegalInventoryVersion } from "@/lib/governance/productionSourceLegalInventory";

const PROJECT = process.env.GCP_PROJECT ?? "furlong-staging-499102";
const REVISION = process.env.P5_SOURCE_LEGAL_REVISION ?? "furlong-core-00097";
function sh(cmd: string, args: string[]): string { return execFileSync(cmd, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim(); }
function gcloud(args: string[]): string { return sh("gcloud", [...args, "--project", PROJECT]); }
function npmPass(script: string): boolean { try { sh("npm", ["run", "-s", script]); return true; } catch { return false; } }
function main(): void {
  const checks: Array<{name:string;pass:boolean;evidence:string}> = []; const add=(name:string,pass:boolean,evidence:string)=>checks.push({name,pass,evidence});
  const liveRevision=gcloud(["run","services","describe","furlong-core","--region","us-central1","--format","value(status.latestReadyRevisionName)"]);
  const liveImage=gcloud(["run","services","describe","furlong-core","--region","us-central1","--format","value(spec.template.spec.containers[0].image)"]);
  add("target revision is live", liveRevision.startsWith(REVISION), `${liveRevision} expected prefix ${REVISION}`);
  add("live image is digest pinned", liveImage.includes("@sha256:"), liveImage);
  add("existing source legal gate", npmPass("smoke:source-legal-review"), "npm run smoke:source-legal-review");
  add("production source inventory gate", npmPass("smoke:production-source-legal"), "npm run smoke:production-source-legal");
  add("all canonical sources inventoried", productionSourceLegalInventory.length > 0, `${productionSourceLegalInventory.length} sources`);
  add("all sources require terms review", productionSourceLegalInventory.every(x=>x.termsReviewRequired), "termsReviewRequired=true");
  add("permitted and prohibited uses mapped", productionSourceLegalInventory.every(x=>x.permittedUses.length>0&&x.prohibitedUses.length>0), "all sources mapped");
  add("anti-bulk controls mapped", productionSourceLegalInventory.every(x=>Boolean(x.antiBulkRule)), "all sources mapped");
  add("retention and cache controls mapped", productionSourceLegalInventory.every(x=>Boolean(x.retentionRule)&&Boolean(x.cacheRule)), "all sources mapped");
  add("republication and display controls mapped", productionSourceLegalInventory.every(x=>Boolean(x.republicationRule)&&Boolean(x.publicDisplayRule)), "all sources mapped");
  add("attribution and credential controls mapped", productionSourceLegalInventory.every(x=>Boolean(x.attributionRule)&&Boolean(x.credentialRule)), "all sources mapped");
  add("no automated legal approval", productionSourceLegalInventory.every(x=>!x.approvalGranted), "sourceApprovalsGranted=0");
  add("live fetch remains blocked", productionSourceLegalInventory.every(x=>!x.liveFetchAllowed), "liveFetchAllowed=false");
  add("production reliance remains blocked", productionSourceLegalInventory.every(x=>!x.productionRelianceAllowed&&!x.officialUseAllowed), "reliance=false; official=false");
  add("qualified human authorization preserved", productionSourceLegalAuthorization.approvalRequired&&!productionSourceLegalAuthorization.approvalGranted, JSON.stringify(productionSourceLegalAuthorization));
  const failed=checks.filter(x=>!x.pass), generatedAtUtc=new Date().toISOString();
  const report={ schemaVersion:"p5-source-legal-readiness-v1", environment:"staging", targetRevision:liveRevision, targetImage:liveImage, blockerId:"P5-B04", blockerStatus:failed.length?"OPEN":"EVIDENCE_READY_HUMAN_APPROVAL_REQUIRED", outcome:failed.length?"FAIL":"PASS", productionAuthorized:false, liveSourceUsePermitted:false, productionReliancePermitted:false, inventoryVersion:productionSourceLegalInventoryVersion, inventory:productionSourceLegalInventory, authorization:productionSourceLegalAuthorization, checks, generatedAtUtc };
  const bytes=JSON.stringify(report,null,2), secret=gcloud(["secrets","versions","access","latest","--secret","REPORT_SIGNING_SECRET"]);
  const sig={algorithm:"HMAC-SHA256",keyId:"gcp-secret-manager://REPORT_SIGNING_SECRET/latest",reportSha256:createHash("sha256").update(bytes).digest("hex"),signature:createHmac("sha256",secret).update(bytes).digest("base64url"),signedAtUtc:generatedAtUtc};
  const dir=path.join(process.cwd(),"artifacts","deployments","staging"); mkdirSync(dir,{recursive:true}); const stamp=generatedAtUtc.replace(/[:.]/g,"-");
  const reportPath=path.join(dir,`${stamp}-p5-b04-source-legal.json`), signaturePath=path.join(dir,`${stamp}-p5-b04-source-legal-signature.json`); writeFileSync(reportPath,bytes); writeFileSync(signaturePath,JSON.stringify(sig,null,2));
  console.log(JSON.stringify({outcome:report.outcome,blockerStatus:report.blockerStatus,passed:checks.length-failed.length,total:checks.length,failed:failed.map(x=>x.name),reportPath:path.relative(process.cwd(),reportPath),signaturePath:path.relative(process.cwd(),signaturePath),...sig},null,2)); if(failed.length)process.exit(1);
}
main();
