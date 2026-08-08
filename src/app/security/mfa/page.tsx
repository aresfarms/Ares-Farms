import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { activePasskeys, ensureAccessSecurityState } from "@/lib/auth/accessSecurityRuntime";
import MfaClient from "./MfaClient";

export default async function MfaPage(){
  const session=await getServerSession(authOptions); const user=session?.user as {id?:string;email?:string|null;role?:string|null}|undefined;
  if(!user?.id) redirect("/api/auth/signin?callbackUrl=/security/mfa");
  const [state,passkeys]=await Promise.all([ensureAccessSecurityState(user.id),activePasskeys(user.id)]);
  return <main style={{maxWidth:900,margin:"40px auto",padding:"0 24px",fontFamily:"system-ui"}}>
    <div style={{fontSize:12,fontWeight:800,letterSpacing:1,textTransform:"uppercase"}}>Ares Farms / Furlong Security</div>
    <h1>Multi-Factor Authentication</h1>
    <p>Privileged access requires fresh phishing-resistant passkey verification for each session. Sensitive actions require step-up verification.</p>
    <section style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:12,margin:"20px 0"}}>
      <div><strong>Access status</strong><div>{state.accessStatus}</div></div><div><strong>Passkeys enrolled</strong><div>{passkeys.length}</div></div><div><strong>Session version</strong><div>{state.sessionVersion}</div></div><div><strong>SMS-only MFA</strong><div>Not permitted</div></div>
    </section>
    <MfaClient />
    <p style={{marginTop:24,fontSize:13,color:"#4b5563"}}>Biometric data remains on the authenticator/device. Furlong stores only the WebAuthn public credential data needed to verify possession and user presence.</p>
  </main>;
}
