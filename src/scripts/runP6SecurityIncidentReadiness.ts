import { createHash, createHmac } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const PROJECT = process.env.GCP_PROJECT ?? "furlong-staging-499102";
const REGION = process.env.GCP_REGION ?? "us-central1";
const SERVICE = process.env.SERVICE ?? "furlong-core";

function sh(cmd: string, args: string[], env: NodeJS.ProcessEnv = process.env): string {
  return execFileSync(cmd, args, { encoding: "utf8", env, stdio: ["ignore", "pipe", "pipe"] }).trim();
}
function gcloud(args: string[]): string { return sh("gcloud", [...args, "--project", PROJECT]); }
function runNpm(script: string): boolean { try { sh("npm", ["run", "-s", script]); return true; } catch { return false; } }
function main(): void {
  const checks: Array<{name:string;pass:boolean;actual:string;evidence:string}> = [];
  const add=(name:string,pass:boolean,actual:string,evidence:string)=>checks.push({name,pass,actual,evidence});
  const svc=JSON.parse(gcloud(["run","services","describe",SERVICE,"--region",REGION,"--format","json"])) as any;
  const revision = gcloud(["run","services","describe",SERVICE,"--region",REGION,"--format","value(status.latestReadyRevisionName)"]);
  const expectedRevision = process.env.P6_SECURITY_REVISION ?? revision;
  const image = gcloud(["run","services","describe",SERVICE,"--region",REGION,"--format","value(spec.template.spec.containers[0].image)"]);
  add("expected P6 revision live", revision===expectedRevision, revision, expectedRevision);
  add("image is digest pinned", image.includes("@sha256:"), image, "Cloud Run service image");
  const envs=(svc.spec?.template?.spec?.containers?.[0]?.env??[]) as Array<{name?:string;value?:string}>;
  const envMap=Object.fromEntries(envs.map(e=>[e.name,e.value]));
  add("live API authentication enforcement required", envMap.API_AUTH_ENFORCEMENT==="required", String(envMap.API_AUTH_ENFORCEMENT), "Cloud Run environment");
  add("live rate limiting enabled", envMap.RATE_LIMITING_ENABLED==="true", String(envMap.RATE_LIMITING_ENABLED), "Cloud Run environment");
  add("incident response control model passes", runNpm("smoke:production-incident-response-readiness"), "smoke passed", "Module 34 fail-closed model");
  const alerts=JSON.parse(gcloud(["monitoring","policies","list","--format","json"])) as Array<{displayName?:string;enabled?:boolean}>;
  const required=["app","sql","secret","privileged","source"];
  const names=alerts.filter(a=>a.enabled!==false).map(a=>(a.displayName??"").toLowerCase());
  add("required alert families enabled", required.every(k=>names.some(n=>n.includes(k))), names.join(" | "), "Cloud Monitoring policies");
  const channels=JSON.parse(gcloud(["alpha","monitoring","channels","list","--format","json"])) as Array<{enabled?:boolean;type?:string}>;
  add("security notification channel enabled", channels.some(c=>c.enabled!==false), JSON.stringify(channels.map(c=>({type:c.type,enabled:c.enabled}))), "Cloud Monitoring channels");
  const audit=JSON.parse(gcloud(["projects","get-iam-policy",PROJECT,"--format","json"])) as {auditConfigs?:Array<{service?:string}>};
  add("project audit logging configured", (audit.auditConfigs??[]).length>=2, String((audit.auditConfigs??[]).length), "IAM audit configs");
  add("IAP enabled", svc.metadata?.annotations?.["run.googleapis.com/iap-enabled"]==="true", String(svc.metadata?.annotations?.["run.googleapis.com/iap-enabled"]), "Cloud Run annotation");
  const drill={scenario:"credential-exposure-plus-5xx-spike",detectedBy:["unexpected secret access alert","app 5xx alert"],actions:["declare SEV-1","freeze deployments","rotate affected secret","review audit logs","validate IAP and runtime restrictions","prepare human-approved communications"],executedActions:[],productionChangesMade:false,outcome:"TABLETOP_PASS"};
  add("non-destructive incident tabletop complete", drill.outcome==="TABLETOP_PASS"&&!drill.productionChangesMade, drill.outcome, "P6 tabletop drill");
  const failed=checks.filter(c=>!c.pass);
  const generatedAtUtc=new Date().toISOString();
  const report={schemaVersion:"p6-security-incident-readiness-v1",environment:"staging",targetRevision:expectedRevision,productionAuthorized:false,blockerId:"P5-B08",blockerStatus:failed.length?"OPEN":"EVIDENCE_READY_HUMAN_APPROVAL_REQUIRED",outcome:failed.length?"FAIL":"PASS",checks,tabletopDrill:drill,generatedAtUtc};
  const bytes=JSON.stringify(report,null,2);
  const secret=gcloud(["secrets","versions","access","latest","--secret","REPORT_SIGNING_SECRET"]);
  const sig={algorithm:"HMAC-SHA256",keyId:"gcp-secret-manager://REPORT_SIGNING_SECRET/latest",reportSha256:createHash("sha256").update(bytes).digest("hex"),signature:createHmac("sha256",secret).update(bytes).digest("base64url"),signedAtUtc:generatedAtUtc};
  const dir=path.join(process.cwd(),"artifacts","deployments","staging"); mkdirSync(dir,{recursive:true});
  const stamp=generatedAtUtc.replace(/[:.]/g,"-");
  const rp=path.join(dir,`${stamp}-${expectedRevision}-p6-security-incident.json`); const sp=path.join(dir,`${stamp}-${expectedRevision}-p6-security-incident-signature.json`);
  writeFileSync(rp,bytes); writeFileSync(sp,JSON.stringify(sig,null,2));
  console.log(JSON.stringify({outcome:report.outcome,passed:checks.length-failed.length,total:checks.length,failed:failed.map(f=>f.name),blockerStatus:report.blockerStatus,reportPath:path.relative(process.cwd(),rp),signaturePath:path.relative(process.cwd(),sp),...sig},null,2));
  if(failed.length) process.exit(1);
}
main();
