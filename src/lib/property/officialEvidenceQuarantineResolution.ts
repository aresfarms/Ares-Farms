import { randomUUID } from "node:crypto";
import { readOfficialEvidenceRefreshState } from "./officialEvidenceRuntimeStore";
import { verifyOfficialEvidenceSnapshotAtRead } from "./officialEvidenceReadVerification";
import { readOfficialEvidenceQuarantine, replaceOfficialEvidenceQuarantine, type OfficialEvidenceQuarantineRecord, type QuarantineEvent } from "./officialEvidenceQuarantineStore";

export type QuarantineDecision = "ACKNOWLEDGE" | "REMEDIATION" | "REVERIFY";
function event(action:QuarantineEvent["action"],actorId:string,actorName:string,reason:string,verificationReasons?:string[]):QuarantineEvent { return {eventId:randomUUID(),action,actorId,actorName,at:new Date().toISOString(),reason,verificationReasons}; }
export function decideEvidenceQuarantine(input:{quarantineId:string;decision:QuarantineDecision;actorId:string;actorName:string;reason:string}):OfficialEvidenceQuarantineRecord {
  if(!input.reason.trim()) throw new Error("A quarantine decision reason is required.");
  if(!["ACKNOWLEDGE","REMEDIATION","REVERIFY"].includes(input.decision)) throw new Error("Unsupported quarantine decision; manual release is prohibited.");
  const current=readOfficialEvidenceQuarantine().find(x=>x.quarantineId===input.quarantineId); if(!current) throw new Error("Quarantine record not found.");
  if(current.status==="released") throw new Error("Released quarantine records are immutable.");
  if(input.decision==="ACKNOWLEDGE") return replaceOfficialEvidenceQuarantine({...current,status:"acknowledged",events:[...current.events,event("ACKNOWLEDGE",input.actorId,input.actorName,input.reason)]});
  if(input.decision==="REMEDIATION") return replaceOfficialEvidenceQuarantine({...current,status:"remediation-pending",events:[...current.events,event("REMEDIATION",input.actorId,input.actorName,input.reason)]});
  const state=readOfficialEvidenceRefreshState<any>(current.sourceId); const snapshot=state?.snapshots.find(x=>x.sourceVersion===current.sourceVersion)??null;
  if(!snapshot) return replaceOfficialEvidenceQuarantine({...current,status:"remediation-pending",events:[...current.events,event("REVERIFY_FAILED",input.actorId,input.actorName,input.reason,["snapshot-not-found"])]});
  const verification=verifyOfficialEvidenceSnapshotAtRead(current.sourceId,snapshot);
  if(!verification.valid) return replaceOfficialEvidenceQuarantine({...current,status:"remediation-pending",reasons:verification.reasons,events:[...current.events,event("REVERIFY_FAILED",input.actorId,input.actorName,input.reason,verification.reasons)]});
  const at=new Date().toISOString(); return replaceOfficialEvidenceQuarantine({...current,status:"released",releasedAt:at,releasedBy:input.actorId,events:[...current.events,{...event("RELEASE",input.actorId,input.actorName,input.reason),at}]});
}
