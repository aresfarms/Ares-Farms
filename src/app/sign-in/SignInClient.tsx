"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";

export default function SignInClient() {
  const params = useSearchParams();
  const callbackUrl =
    params.get("callbackUrl") ||
    "/security/mfa?callbackUrl=/professional-access";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const result = await signIn("credentials", {
      email,
      password,
      callbackUrl,
      redirect: false,
    });
    if (!result?.ok) {
      setError(
        "Sign-in was not accepted. Check your authorized email and password.",
      );
      setBusy(false);
      return;
    }
    window.location.assign(result.url || callbackUrl);
  }

  return (
    <form onSubmit={submit} style={{ display: "grid", gap: 16 }}>
      <label style={{ display: "grid", gap: 6 }}>
        <span>Authorized email</span>
        <input
          type="email"
          required
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ padding: 12, border: "1px solid #cbd5e1", borderRadius: 8 }}
        />
      </label>
      <label style={{ display: "grid", gap: 6 }}>
        <span>Password</span>
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ padding: 12, border: "1px solid #cbd5e1", borderRadius: 8 }}
        />
      </label>
      {error ? (
        <div
          role="alert"
          style={{
            color: "#991b1b",
            background: "#fee2e2",
            padding: 12,
            borderRadius: 8,
          }}
        >
          {error}
        </div>
      ) : null}
      <button
        type="submit"
        disabled={busy}
        style={{
          padding: 12,
          borderRadius: 8,
          border: 0,
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        {busy ? "Signing in…" : "Sign in securely"}
      </button>
    </form>
  );
}
