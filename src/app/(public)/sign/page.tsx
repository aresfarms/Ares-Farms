"use client";

/**
 * Signing Ceremony — the customer signs a document an authorized finance reviewer placed in
 * the vault (founder-approved signature vault, 2026-08-06). ESIGN/UETA
 * process: view the exact document, versioned consent, explicit intent,
 * typed legal name. TEST MODE banner until counsel review flips
 * SIGNATURE_MODE=live. Customer surface (brief-copy scanned).
 */

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { Disclosures } from "@/components/public/Disclosures";

const NAVY = "#1C2B45";
const MUTED = "#4d596d";

type Ceremony = {
  dealRef: string;
  fileName: string | null;
  alreadySigned: boolean;
  viewPath: string;
  consentText: string;
  intentText: string;
  mode: "test" | "live";
};

function SignInner() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [ceremony, setCeremony] = useState<Ceremony | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [typedName, setTypedName] = useState("");
  const [consented, setConsented] = useState(false);
  const [phase, setPhase] = useState<"idle" | "signing" | "signed" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setLoadError("This page needs a signing link — open it from your status page.");
      return;
    }
    void (async () => {
      const res = await fetch(`/api/public/document-sign?token=${encodeURIComponent(token)}`);
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setLoadError(data.error ?? "This signing link could not be verified.");
        return;
      }
      setCeremony(data as Ceremony);
      if ((data as Ceremony).alreadySigned) setPhase("signed");
    })();
  }, [token]);

  async function sign() {
    setPhase("signing");
    setMessage(null);
    try {
      const res = await fetch("/api/public/document-sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, typedName, consented }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error ?? "The signature could not be recorded.");
      setPhase("signed");
    } catch (err) {
      setPhase("error");
      setMessage(err instanceof Error ? err.message : "The signature could not be recorded.");
    }
  }

  if (loadError) {
    return (
      <main style={{ maxWidth: 680, margin: "0 auto", padding: "48px 20px" }}>
        <h1 style={{ color: NAVY, fontFamily: "Georgia,serif" }}>Sign a document</h1>
        <p style={{ color: "#a12626", fontSize: 14, lineHeight: 1.6 }}>{loadError}</p>
      </main>
    );
  }
  if (!ceremony) {
    return (
      <main style={{ maxWidth: 680, margin: "0 auto", padding: "48px 20px" }}>
        <p style={{ color: MUTED, fontSize: 14 }}>Verifying your signing link…</p>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 680, margin: "0 auto", padding: "40px 20px 60px", display: "grid", gap: 16 }}>
      <h1 style={{ margin: 0, color: NAVY, fontFamily: "Georgia,serif" }}>Sign a document</h1>
      {ceremony.mode === "test" && (
        <p style={{ margin: 0, color: "#8F6E1F", background: "#FFF9E8", border: "1px solid #D7B85A", borderRadius: 10, padding: "10px 12px", fontSize: 13, lineHeight: 1.55 }}>
          TEST MODE: electronic signing is being rehearsed and reviewed — a ceremony completed
          here is a rehearsal, not yet a legally operative signature.
        </p>
      )}
      <p style={{ margin: 0, color: "#3b475a", fontSize: 14, lineHeight: 1.65 }}>
        For financing request <strong>{ceremony.dealRef}</strong>. Your authorized finance reviewer has asked for your
        signature on <strong>{ceremony.fileName ?? "a document"}</strong>. Read it first — the
        signature you record here is bound to the exact file below.
      </p>
      <a
        href={ceremony.viewPath}
        target="_blank"
        rel="noopener noreferrer"
        style={{ justifySelf: "start", borderRadius: 9, padding: "10px 16px", background: NAVY, color: "#fff", fontWeight: 800, textDecoration: "none", fontSize: 13.5 }}
      >
        📄 Open and read the document
      </a>

      {phase === "signed" ? (
        <section style={{ border: "1px solid #bbf7d0", background: "#f0fdf4", borderRadius: 12, padding: "16px 18px", display: "grid", gap: 6 }}>
          <strong style={{ color: "#166534", fontSize: 15 }}>✓ Signature recorded</strong>
          <p style={{ margin: 0, color: "#166534", fontSize: 13.5, lineHeight: 1.6 }}>
            Your signature certificate is in the vault — you can download it from your status
            page any time, and the financing case has been updated.
            {ceremony.mode === "test" && " (Test mode: this was a rehearsal ceremony.)"}
          </p>
        </section>
      ) : (
        <section style={{ border: "1px solid #d7deea", background: "#fff", borderRadius: 12, padding: "16px 18px", display: "grid", gap: 12 }}>
          <label style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 13, color: "#3b475a", lineHeight: 1.6 }}>
            <input type="checkbox" checked={consented} onChange={(e) => setConsented(e.target.checked)} style={{ marginTop: 3 }} />
            <span>{ceremony.consentText}</span>
          </label>
          <p style={{ margin: 0, fontSize: 13, color: "#3b475a", lineHeight: 1.6 }}>{ceremony.intentText}</p>
          <div>
            <label htmlFor="typed-name" style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#3b475a", marginBottom: 5 }}>
              Your full legal name
            </label>
            <input
              id="typed-name"
              value={typedName}
              onChange={(e) => setTypedName(e.target.value)}
              style={{ width: "100%", boxSizing: "border-box", border: "1px solid #cfd8e6", borderRadius: 9, padding: "10px 12px", fontSize: 15, fontFamily: "Georgia,serif", fontStyle: "italic", color: NAVY, background: "#fbfcfe" }}
            />
          </div>
          <button
            type="button"
            disabled={phase === "signing" || !consented || typedName.trim().length < 3}
            onClick={() => void sign()}
            style={{
              justifySelf: "start",
              border: "none",
              borderRadius: 10,
              padding: "11px 20px",
              fontSize: 14,
              fontWeight: 800,
              color: "#fff",
              background: consented && typedName.trim().length >= 3 ? "#1c5aa0" : "#a9b6c8",
              cursor: consented && typedName.trim().length >= 3 && phase !== "signing" ? "pointer" : "default",
            }}
          >
            {phase === "signing" ? "Recording your signature…" : "Sign"}
          </button>
          {phase === "error" && message && (
            <span role="alert" style={{ fontSize: 13, color: "#b42318" }}>{message}</span>
          )}
          <span style={{ fontSize: 11.5, color: "#8090a0", lineHeight: 1.5 }}>
            What gets recorded: your typed name, the date and time, your network address, and the
            document&apos;s digital fingerprint — together they form your signature certificate,
            kept in the same encrypted vault as the document itself.
          </span>
        </section>
      )}
      <Disclosures variant="full" showManifesto={false} />
    </main>
  );
}

export default function SignPage() {
  return (
    <Suspense fallback={<main style={{ padding: 48 }} />}>
      <SignInner />
    </Suspense>
  );
}
