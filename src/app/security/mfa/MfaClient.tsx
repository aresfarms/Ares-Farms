"use client";

import { startAuthentication, startRegistration } from "@simplewebauthn/browser";
import { useState } from "react";

const DEFAULT_DESTINATION = "/internal";

type MfaMode = "register" | "authenticate";

function requestedDestination(): string {
  const requested = new URLSearchParams(window.location.search).get("callbackUrl");
  if (!requested) return DEFAULT_DESTINATION;

  try {
    const resolved = new URL(requested, window.location.origin);
    if (resolved.origin !== window.location.origin) return DEFAULT_DESTINATION;

    const destination = `${resolved.pathname}${resolved.search}${resolved.hash}`;
    if (!destination.startsWith("/") || destination.startsWith("//")) {
      return DEFAULT_DESTINATION;
    }
    if (
      destination === "/security/mfa" ||
      destination.startsWith("/security/mfa?") ||
      destination === "/sign-in" ||
      destination.startsWith("/sign-in?")
    ) {
      return DEFAULT_DESTINATION;
    }

    return destination;
  } catch {
    return DEFAULT_DESTINATION;
  }
}

export default function MfaClient() {
  const [status, setStatus] = useState("Ready");
  const [busy, setBusy] = useState(false);

  async function run(mode: MfaMode) {
    setBusy(true);
    setStatus(
      mode === "register"
        ? "Creating passkey…"
        : "Waiting for passkey verification…",
    );

    try {
      const optionsResult = await fetch("/api/security/mfa/options", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mode }),
      }).then((response) => response.json());
      if (!optionsResult.ok) throw new Error(optionsResult.error);

      const response =
        mode === "register"
          ? await startRegistration({ optionsJSON: optionsResult.options })
          : await startAuthentication({ optionsJSON: optionsResult.options });

      const verificationResult = await fetch("/api/security/mfa/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          mode,
          challengeId: optionsResult.challengeId,
          response,
          label: "Primary passkey",
        }),
      }).then((verificationResponse) => verificationResponse.json());
      if (!verificationResult.ok) throw new Error(verificationResult.error);

      setStatus(
        mode === "register"
          ? "Passkey enrolled and verified. Opening the requested portal…"
          : "MFA verified. Opening the requested portal…",
      );
      window.location.replace(requestedDestination());
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "MFA failed.");
      setBusy(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 12, maxWidth: 560 }}>
      <div
        style={{
          padding: 16,
          border: "1px solid #d1d5db",
          borderRadius: 12,
          background: "#fff",
        }}
      >
        <strong>Phishing-resistant MFA</strong>
        <p>
          Use Touch ID, Face ID, Windows Hello, or a FIDO2 security key.
          SMS-only MFA is not permitted for privileged access.
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button disabled={busy} onClick={() => run("register")}>
            Enroll a passkey
          </button>
          <button disabled={busy} onClick={() => run("authenticate")}>
            Verify MFA for this session
          </button>
        </div>
        <p aria-live="polite" style={{ fontWeight: 700 }}>
          {status}
        </p>
      </div>
    </div>
  );
}
