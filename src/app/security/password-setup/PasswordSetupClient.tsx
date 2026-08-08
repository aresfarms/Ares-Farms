"use client";

import { FormEvent, useState } from "react";

export default function PasswordSetupClient() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (password !== confirm) return setMessage("Passwords do not match.");
    if (password.length < 16) return setMessage("Use at least 16 characters.");
    setBusy(true); setMessage(null);
    const response = await fetch("/api/public/local-founder-password-bootstrap", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setMessage(body.error === "PASSWORD_ALREADY_CONFIGURED" ? "Password is already configured." : "Password setup failed.");
      setBusy(false); return;
    }
    window.location.assign("/sign-in?callbackUrl=%2Fsecurity%2Fmfa");
  }

  return <form onSubmit={submit} style={{display:"grid",gap:16}}>
    <label style={{display:"grid",gap:6}}><span>New password</span><input type="password" autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)} required style={{padding:12,border:"1px solid #cbd5e1",borderRadius:8}} /></label>
    <label style={{display:"grid",gap:6}}><span>Confirm password</span><input type="password" autoComplete="new-password" value={confirm} onChange={e=>setConfirm(e.target.value)} required style={{padding:12,border:"1px solid #cbd5e1",borderRadius:8}} /></label>
    {message ? <div role="alert">{message}</div> : null}
    <button type="submit" disabled={busy} style={{padding:12,borderRadius:8,fontWeight:700}}>{busy ? "Saving…" : "Set my password"}</button>
  </form>;
}
