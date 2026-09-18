import PasswordSetupClient from "./PasswordSetupClient";

export default function PasswordSetupPage() {
  return <main style={{minHeight:"100vh",display:"grid",placeItems:"center",padding:24,background:"#f8fafc"}}>
    <section style={{width:"min(480px,100%)",background:"white",border:"1px solid #e2e8f0",borderRadius:16,padding:28}}>
      <div style={{fontSize:12,fontWeight:800,letterSpacing:".08em",textTransform:"uppercase",color:"#475569"}}>Furlong Secure Access</div>
      <h1 style={{margin:"8px 0 10px",fontSize:28}}>Set your password</h1>
      <p style={{color:"#475569",lineHeight:1.5}}>This one-time localhost setup stores only a salted password hash. Use at least 16 characters. After setup, sign-in requires this password plus passkey MFA.</p>
      <PasswordSetupClient />
    </section>
  </main>;
}
