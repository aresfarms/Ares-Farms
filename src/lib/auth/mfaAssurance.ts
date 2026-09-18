export const MFA_ASSURANCE_COOKIE = "furlong-mfa-assurance";
export const MFA_ASSURANCE_MAX_AGE_SECONDS = 4 * 60 * 60;
export const MFA_STEP_UP_MAX_AGE_SECONDS = 10 * 60;

type Payload = { userId: string; sessionVersion: number; verifiedAt: string; exp: number; method: "passkey" };
const enc = new TextEncoder();
function b64(bytes: Uint8Array) { return btoa(String.fromCharCode(...bytes)).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/g,""); }
function b64Text(text: string) { return b64(enc.encode(text)); }
function unb64Text(value: string) { const s=value.replace(/-/g,"+").replace(/_/g,"/"); return decodeURIComponent(Array.prototype.map.call(atob(s), (c:string)=>"%"+("00"+c.charCodeAt(0).toString(16)).slice(-2)).join("")); }
async function key(secret: string) { return crypto.subtle.importKey("raw",enc.encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign","verify"]); }
export async function issueMfaAssurance(input: { userId:string; sessionVersion:number; secret:string; now?:number }) {
  const now=input.now??Date.now(); const payload:Payload={userId:input.userId,sessionVersion:input.sessionVersion,verifiedAt:new Date(now).toISOString(),exp:Math.floor(now/1000)+MFA_ASSURANCE_MAX_AGE_SECONDS,method:"passkey"};
  const body=b64Text(JSON.stringify(payload)); const sig=new Uint8Array(await crypto.subtle.sign("HMAC",await key(input.secret),enc.encode(body))); return `${body}.${b64(sig)}`;
}
export async function verifyMfaAssurance(input:{token?:string|null;userId:string;sessionVersion:number;secret:string;now?:number;maxVerifiedAgeSeconds?:number}) {
  try { if(!input.token) return null; const [body,sig]=input.token.split("."); if(!body||!sig) return null; const raw=Uint8Array.from(atob(sig.replace(/-/g,"+").replace(/_/g,"/")+"===".slice((sig.length+3)%4)),c=>c.charCodeAt(0)); const ok=await crypto.subtle.verify("HMAC",await key(input.secret),raw,enc.encode(body)); if(!ok)return null; const p=JSON.parse(unb64Text(body)) as Payload; const now=Math.floor((input.now??Date.now())/1000); if(p.exp<now||p.userId!==input.userId||p.sessionVersion!==input.sessionVersion||p.method!=="passkey")return null; if(input.maxVerifiedAgeSeconds){const verified=Math.floor(Date.parse(p.verifiedAt)/1000); if(!Number.isFinite(verified)||now-verified>input.maxVerifiedAgeSeconds)return null;} return p; } catch { return null; }
}
