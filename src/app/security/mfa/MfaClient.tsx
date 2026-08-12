"use client";
import { useState } from "react";
import { startAuthentication, startRegistration } from "@simplewebauthn/browser";

export default function MfaClient(){
  const [status,setStatus]=useState("Ready"); const [busy,setBusy]=useState(false);
  async function run(mode:"register"|"authenticate"){
    setBusy(true); setStatus(mode==="register"?"Creating passkey…":"Waiting for passkey verification…");
    try{
      const o=await fetch("/api/security/mfa/options",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({mode})}).then(r=>r.json());
      if(!o.ok) throw new Error(o.error);
      const response=mode==="register"?await startRegistration({optionsJSON:o.options}):await startAuthentication({optionsJSON:o.options});
      const v=await fetch("/api/security/mfa/verify",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({mode,challengeId:o.challengeId,response,label:"Primary passkey"})}).then(r=>r.json());
      if(!v.ok) throw new Error(v.error);
      setStatus(mode==="register"?"Passkey enrolled and MFA verified.":"MFA verified for this session.");
      setTimeout(()=>location.reload(),500);
    }catch(e){setStatus(e instanceof Error?e.message:"MFA failed.");}finally{setBusy(false);}
  }
  return <div style={{display:"grid",gap:12,maxWidth:560}}>
    <div style={{padding:16,border:"1px solid #d1d5db",borderRadius:12,background:"#fff"}}>
      <strong>Phishing-resistant MFA</strong><p>Use Touch ID, Face ID, Windows Hello, or a FIDO2 security key. SMS-only MFA is not permitted for privileged access.</p>
      <div style={{display:"flex",gap:10,flexWrap:"wrap"}}><button disabled={busy} onClick={()=>run("register")}>Enroll a passkey</button><button disabled={busy} onClick={()=>run("authenticate")}>Verify MFA for this session</button></div>
      <p aria-live="polite" style={{fontWeight:700}}>{status}</p>
    </div>
  </div>;
}
