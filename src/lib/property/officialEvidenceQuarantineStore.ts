import { createHash, randomUUID } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import { runtimeStatePath } from "./runtimeStatePath";
import type { OfficialEvidenceSourceId } from "./officialEvidenceSourceGovernance";
import { invalidateArtifactsForQuarantine } from "./officialEvidenceDownstreamInvalidation";

export type QuarantineStatus = "open" | "acknowledged" | "remediation-pending" | "released";
export interface QuarantineEvent { eventId:string; action:"DETECTED"|"ACKNOWLEDGE"|"REMEDIATION"|"REVERIFY_FAILED"|"RELEASE"; actorId:string; actorName:string; at:string; reason:string; verificationReasons?:string[]; }
export interface OfficialEvidenceQuarantineRecord {
  quarantineId:string; sourceId:OfficialEvidenceSourceId; sourceVersion:string; detectedAt:string; reasons:string[]; reasonHash:string;
  receiptId:string|null; connectorId:string|null; parserVersion:string|null; implementationHash:string|null;
  status:QuarantineStatus; events:QuarantineEvent[]; releasedAt?:string|null; releasedBy?:string|null;
}
const FILE = runtimeStatePath("official-evidence", "read-quarantine.json");
function write(records:OfficialEvidenceQuarantineRecord[]):void { fs.mkdirSync(path.dirname(FILE),{recursive:true}); const temp=`${FILE}.${process.pid}.${Date.now()}.tmp`; fs.writeFileSync(temp,JSON.stringify(records,null,2)+"\n","utf8"); fs.renameSync(temp,FILE); }
export function readOfficialEvidenceQuarantine():OfficialEvidenceQuarantineRecord[]{ try { return JSON.parse(fs.readFileSync(FILE,"utf8")) as OfficialEvidenceQuarantineRecord[]; } catch { return []; } }
export function replaceOfficialEvidenceQuarantine(record:OfficialEvidenceQuarantineRecord):OfficialEvidenceQuarantineRecord { const records=readOfficialEvidenceQuarantine(); const index=records.findIndex(x=>x.quarantineId===record.quarantineId); if(index<0) throw new Error("Quarantine record not found."); records[index]=record; write(records); return record; }
export function recordOfficialEvidenceQuarantine(input:Omit<OfficialEvidenceQuarantineRecord,"quarantineId"|"detectedAt"|"reasonHash"|"status"|"events">&{detectedAt?:string}):OfficialEvidenceQuarantineRecord {
  const reasons=[...new Set(input.reasons)].sort(); const reasonHash=createHash("sha256").update(JSON.stringify(reasons)).digest("hex"); const records=readOfficialEvidenceQuarantine();
  const existing=records.find(x=>x.sourceId===input.sourceId&&x.sourceVersion===input.sourceVersion&&x.reasonHash===reasonHash); if(existing) return existing;
  const detectedAt=input.detectedAt??new Date().toISOString(); const record:OfficialEvidenceQuarantineRecord={...input,reasons,reasonHash,quarantineId:randomUUID(),detectedAt,status:"open",events:[{eventId:randomUUID(),action:"DETECTED",actorId:"system:evidence-read",actorName:"evidence-read-verifier",at:detectedAt,reason:"Snapshot failed read-time provenance verification.",verificationReasons:reasons}]};
  write([...records,record]);
  invalidateArtifactsForQuarantine({ sourceId: record.sourceId, sourceVersion: record.sourceVersion, quarantineId: record.quarantineId, reason: `Evidence quarantined: ${record.reasons.join(", ")}`, at: detectedAt });
  return record;
}
