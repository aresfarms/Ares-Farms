import { Suspense } from "react";

import SignInClient from "./SignInClient";

export default function SignInPage() {
  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "#f8fafc" }}>
      <section style={{ width: "min(440px, 100%)", background: "white", border: "1px solid #e2e8f0", borderRadius: 16, padding: 28, boxShadow: "0 12px 30px rgba(15,23,42,.08)" }}>
        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", color: "#475569" }}>Furlong Secure Access</div>
        <h1 style={{ margin: "8px 0 10px", fontSize: 28 }}>Sign in</h1>
        <p style={{ margin: "0 0 22px", color: "#475569", lineHeight: 1.5 }}>
          Sign in with your authorized Furlong password. Privileged sessions must complete passkey MFA before access is granted.
        </p>
        <Suspense fallback={<div>Loading secure sign-in…</div>}>
          <SignInClient />
        </Suspense>
      </section>
    </main>
  );
}
