/**
 * Government-record comparable discovery, not an automated BPO.
 * TECH-PROV-001 / CANON-EXPL-001. Read-only pilot under existing public parcel
 * retrieval: no owner identities, no invented adjustments or market values.
 * Existing source review is preserved; this does not approve a connector for
 * production reliance. Retrieved records require transaction/asset review.
 */
import { createHash } from "node:crypto";
import { governedFetch } from "@/lib/security/outboundRequestPolicy";
export const GOVERNMENT_COMPARABLE_VERSION = "government-comparable-discovery-v2.0.0";
const MD = "https://mdgeodata.md.gov/imap/rest/services/PlanningCadastre/MD_PropertyData/MapServer/0";
const NCC = "https://gis.nccde.org/agsserver/rest/services/BaseMaps/PropertySales/MapServer";
export const GOVERNMENT_COMPARABLE_SOURCES = [
 {id:"ny-orpts-salesweb",state:"NY",name:"New York ORPTS SalesWeb (outside NYC)",url:"https://www.tax.ny.gov/research/property/assess/sales/salesweb.htm",mode:"official-batch-import",restriction:"Official download only; no reverse-engineered automation. No imported current batch is configured."},
 {id:"md-sdat-property",state:"MD",name:"Maryland SDAT / iMAP",url:MD,mode:"official-api",restriction:"Recorded consideration is not automatically an arm's-length comparable. Publication lag and multi-parcel deeds require review."},
 {id:"de-new-castle-property-sales",state:"DE",name:"New Castle County Property Sales",url:NCC,mode:"official-api",restriction:"Only source-published recent annual layers qualify. Older layers never become recent sales through indexing."},
 {id:"de-kent-property-records",state:"DE",name:"Kent County Property Records",url:"https://pride.kentcountyde.gov/",mode:"official-batch-import",restriction:"Official export or supplied closing evidence required. No unattended website scraping."},
 {id:"de-sussex-property-records",state:"DE",name:"Sussex County Property Records",url:"https://sussexcountyde.gov/property-search",mode:"official-batch-import",restriction:"Official export or supplied closing evidence required. No unattended website scraping."},
] as const;
export interface GovernmentSaleCandidate {
 id:string; parcelId:string; transactionId:string|null; address:string; saleDate:string; recordedConsiderationUsd:number;
 propertyUse:string|null; buildingSqft:number|null; acres:number|null; sourceDate:string|null;
 sourceUrl:string; reviewRequired:string[]; // Not a ClosedSaleComparable: no verified or adjusted fields.
}
export interface GovernmentComparableDiscovery {
 version:typeof GOVERNMENT_COMPARABLE_VERSION; status:"comparable-evidence-pending";
 retrievalStatus:"candidates-found"|"no-recent-records"|"source-unavailable"|"official-batch-required"|"unsupported";
 subjectId:string; asOf:string; retrievedAt:string; sourceUrl:string|null;
 candidates:GovernmentSaleCandidate[]; truncated:boolean; notes:string[];
 contentHash:string; replayRef:string; productionRelianceAllowed:false;
}
const clean=(v:unknown)=>typeof v==="string"||typeof v==="number"?String(v).trim():"";
const positive=(v:unknown)=>{const s=clean(v);if(!s)return null;const n=Number(s);return Number.isFinite(n)&&n>0?n:null;};
function dateOnly(raw:unknown):string|null{
 const s=clean(raw),iso=/^\d{8}$/.test(s)?s.slice(0,4)+"-"+s.slice(4,6)+"-"+s.slice(6,8):s;
 const n=Date.parse(iso);return /^\d{4}-\d{2}-\d{2}$/.test(iso)&&Number.isFinite(n)&&new Date(n).toISOString().slice(0,10)===iso?iso:null;
}
export function normalizeMarylandSales(rows:Array<Record<string,unknown>>,subjectParcelId:string|null,asOf:string,sourceUrl:string):GovernmentSaleCandidate[]{
 const evaluation=Date.parse(asOf),cutoff=evaluation-548*86400000;
 if(!Number.isFinite(evaluation))return [];
 const candidates:GovernmentSaleCandidate[]=[];
 const seen=new Set<string>();
 for(const row of rows){
  const parcelId=clean(row.ACCTID),date=dateOnly(row.TRADATE),amount=positive(row.CONSIDR1);
  if(!parcelId||parcelId===subjectParcelId||!date||!amount||Date.parse(date)>evaluation||Date.parse(date)<cutoff)continue;
  const liber=clean(row.DR1LIBER),folio=clean(row.DR1FOLIO),jurisdiction=clean(row.JURSCODE);
  const transactionId=jurisdiction&&liber&&folio?jurisdiction+":"+liber+":"+folio:null;
  const id=parcelId+":"+date+":"+amount;if(seen.has(id))continue;seen.add(id);
  candidates.push({id,parcelId,transactionId,address:[clean(row.ADDRESS),clean(row.PREMCITY),"MD",clean(row.PREMZIP)].filter(Boolean).join(", "),
   saleDate:date,recordedConsiderationUsd:amount,propertyUse:clean(row.DESCLU)||null,buildingSqft:positive(row.SQFTSTRC),acres:positive(row.ACRES),
   sourceDate:clean(row.SDATDATE)||null,sourceUrl,
   reviewRequired:["Verify arm's-length status, concessions and deed scope.","Review asset/use, condition, location, improvements and agricultural acreage comparability.","Source-backed subject-specific adjustments are required; none were invented."]});
 }
 const deedCounts=new Map<string,number>();
 for(const c of candidates)if(c.transactionId)deedCounts.set(c.transactionId,(deedCounts.get(c.transactionId)??0)+1);
 return candidates.map(c=>({...c,reviewRequired:[...c.reviewRequired,...(!c.transactionId?["Deed identity missing; cannot count this as an independent transaction."]:
 (deedCounts.get(c.transactionId)??0)>1?["Multiple parcel rows share this deed; consideration must not be counted once per parcel."]:[])]})).sort((a,b)=>b.saleDate.localeCompare(a.saleDate)||a.id.localeCompare(b.id));
}
function bundle(input:{subjectId:string;asOf:string},patch:Partial<GovernmentComparableDiscovery>):GovernmentComparableDiscovery{
 const result={version:GOVERNMENT_COMPARABLE_VERSION as typeof GOVERNMENT_COMPARABLE_VERSION,status:"comparable-evidence-pending" as const,retrievalStatus:"unsupported" as const,
 subjectId:input.subjectId,asOf:input.asOf,retrievedAt:new Date().toISOString(),sourceUrl:null,candidates:[],truncated:false,
 notes:["Comparable evidence pending. Supply a broker comp sheet, professional appraisal, verified contract or closing evidence. Raw assessment is never substituted."],
 productionRelianceAllowed:false as const,...patch};
 const contentHash=createHash("sha256").update(JSON.stringify(result)).digest("hex");
 return {...result,contentHash,replayRef:GOVERNMENT_COMPARABLE_VERSION+":"+contentHash};
}
export async function discoverGovernmentComparables(input:{subjectId:string;state:string|null;county?:string|null;parcelId?:string|null;propertyType?:string|null;lat:number|null;lon:number|null;asOf:string}):Promise<GovernmentComparableDiscovery>{
 const state=input.state?.toUpperCase();
 if(state==="NY")return bundle(input,{retrievalStatus:"official-batch-required",sourceUrl:GOVERNMENT_COMPARABLE_SOURCES[0].url,notes:[GOVERNMENT_COMPARABLE_SOURCES[0].restriction,"Comparable evidence pending; an official SalesWeb export or broker/appraisal/closing evidence is required."]});
 if(state==="DE"){
  const county=(input.county??"").toLowerCase();
  if(!county.includes("new castle"))return bundle(input,{retrievalStatus:"official-batch-required",sourceUrl:county.includes("kent")?GOVERNMENT_COMPARABLE_SOURCES[3].url:county.includes("sussex")?GOVERNMENT_COMPARABLE_SOURCES[4].url:null,
    notes:["Current county export or broker/appraisal/closing evidence required; Delaware county coverage is not interchangeable.","Comparable evidence pending. No assessment fallback."]});
  try{
   const response=await governedFetch(NCC+"?f=json",{signal:AbortSignal.timeout(8000)});
   if(!response.ok)throw new Error("Source unavailable");
   const data=await response.json() as {layers?:Array<{name:string}>};
   const years=(data.layers??[]).map(l=>Number(l.name.match(/^(\d{4})\b/)?.[1])).filter(Number.isFinite);
   const newest=years.length?Math.max(...years):null;
   return bundle(input,{retrievalStatus:newest&&newest<new Date(Date.parse(input.asOf)-548*86400000).getUTCFullYear()?"no-recent-records":"official-batch-required",sourceUrl:NCC,
    notes:[newest?"Latest published annual sales layer: "+newest+". Publication year is not changed into a current sale date.":"No dated annual layer was resolved.",
     "Comparable evidence pending. Obtain current county sale/closing evidence and review comparability; no automatic time, size or acreage adjustment is applied."]});
  }catch{return bundle(input,{retrievalStatus:"source-unavailable",sourceUrl:NCC});}
 }
 if(state!=="MD")return bundle(input,{});
 if(input.lat==null||input.lon==null||!Number.isFinite(input.lat)||!Number.isFinite(input.lon)||Math.abs(input.lat)>90||Math.abs(input.lon)>180||!Number.isFinite(Date.parse(input.asOf)))return bundle(input,{retrievalStatus:"source-unavailable",sourceUrl:MD});
 try{
  const earliest=new Date(Date.parse(input.asOf)-548*86400000).toISOString().slice(0,10).replace(/-/g,"");
  const latest=new Date(input.asOf).toISOString().slice(0,10).replace(/-/g,"");
  const farm = /farm|agricultur/i.test(input.propertyType ?? "");
  const useFilter = farm ? " AND DESCLU = 'Agricultural'" : "";
  const url=new URL(MD+"/query");
  url.search=new URLSearchParams({f:"json",where:"CONSIDR1 > 0 AND TRADATE >= '"+earliest+"' AND TRADATE <= '"+latest+"'"+useFilter,
   geometry:input.lon+","+input.lat,geometryType:"esriGeometryPoint",inSR:"4326",distance:farm?"40233.6":"16093.44",units:"esriSRUnit_Meter",
   outFields:"JURSCODE,ACCTID,ADDRESS,PREMCITY,PREMZIP,TRADATE,CONSIDR1,DR1LIBER,DR1FOLIO,DESCLU,SQFTSTRC,ACRES,SDATDATE",
   returnGeometry:"false",orderByFields:"TRADATE DESC,ACCTID",resultRecordCount:"75"}).toString();
  const response=await governedFetch(url,{signal:AbortSignal.timeout(8000)});
  if(!response.ok)throw new Error("Source unavailable");
  const data=await response.json() as {error?:unknown;exceededTransferLimit?:boolean;features?:Array<{attributes:Record<string,unknown>}>};
  if(data.error||!Array.isArray(data.features))throw new Error("Source schema mismatch");
  const candidates=normalizeMarylandSales(data.features.map(f=>f.attributes),input.parcelId??null,input.asOf,MD);
  return bundle(input,{retrievalStatus:candidates.length?"candidates-found":"no-recent-records",sourceUrl:url.toString(),candidates,truncated:data.exceededTransferLimit===true,
   notes:["Public recorded transfers within " + (farm ? "25 miles, assessor-classified Agricultural only" : "10 miles") + ", up to 75 latest rows, within an 18-month discovery window. These are candidate records, NOT verified comparables or a value range.",
    "Source-published SDAT data dates remain attached; retrieval today does not remove publication lag. Consideration may include multiple parcels or non-market transfers.",
    "Comparable evidence pending until a reviewer verifies deed scope, asset comparability, condition, concessions and justified adjustments. No state HPI, generic size factor or assessment is used to fabricate adjusted comps."]});
 }catch{return bundle(input,{retrievalStatus:"source-unavailable",sourceUrl:MD,notes:["Government sale lookup failed; no zero value or assessment substitute is produced.","Comparable evidence pending. Supply broker, appraisal, contract or closing evidence."]});}
}
