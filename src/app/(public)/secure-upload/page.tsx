"use client";

/**
 * Sovereign Secure Upload — the borrower's encrypted document channel
 * (founder direction 2026-08-05: financials and PII never travel by email).
 *
 * Flow: the page exchanges its signed link token for the deal reference and
 * checklist, then for each file: begin (governed handoff + direct-to-storage
 * session) → browser PUTs bytes straight to the IAM-private bucket over TLS
 * → confirm (custody record for the licensed lender). File bytes never pass
 * through the application servers. When the storage provider is not
 * configured (local dev), the page says so honestly and records metadata
 * custody only — never a fake success.
 */

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

const DOC_SLOTS: Array<{
  type: string;
  label: string;
  hint: string;
  actionHref?: string;
  actionLabel?: string;
}> = [
  { type: "bank-statements", label: "Bank statements", hint: "Most recent 3 months, all operating accounts" },
  { type: "tax-returns", label: "Tax returns", hint: "Last 2–3 years, personal and business" },
  { type: "personal-financial-statement", label: "Personal financial statement", hint: "Assets, liabilities, net worth — SBA Form 413 or your own" },
  { type: "debt-schedule", label: "Business debt schedule", hint: "Every existing loan: balance, payment, rate, maturity" },
  { type: "entity-documents", label: "Entity documents", hint: "Operating agreement / bylaws, EIN letter, good standing" },
  {
    type: "environmental-reports",
    label: "Environmental reports",
    hint: "Phase I ESA or any environmental screening you already hold — every USDA/SBA commercial deal requires environmental diligence before closing",
    // Borrower-procured model: the borrower chooses any qualified environmental
    // professional; Furlong Environmental is the platform's licensed in-house
    // option, offered — never required.
    actionHref: "/explore?lane=environmental-compliance#environmental-order",
    actionLabel: "Don't have one yet? Order your Phase I from Furlong Environmental →",
  },
  {
    type: "usda-fsa-records",
    label: "USDA / FSA records (farm deals)",
    hint: "Farm records, subsidy history, or FSA loan documents — download them yourself from your farmers.gov account or request them from your county FSA office. We will NEVER ask for your federal login.",
  },
  { type: "purchase-agreement", label: "Purchase agreement", hint: "The signed contract, if the deal has one yet" },
  { type: "other-supporting", label: "Anything else", hint: "Whatever your broker asked for that isn't above" },
];

type UploadState = { status: "idle" | "uploading" | "done" | "pending" | "error"; note?: string };

type IdentityState = {
  status: "loading" | "not-started" | "pending" | "verified";
  mode?: string | null;
  raw?: string | null;
  note?: string | null;
};

/**
 * The four document types that require a verified identity before they may be
 * uploaded (src/lib/privacy/actionGate.ts, `upload-financial-document`).
 * Mirrored here rather than imported so a client bundle never pulls the server
 * gate table — but it must stay in step with FINANCIAL_DOCUMENT_TYPES, and the
 * API enforces the real gate regardless of what this page renders.
 */
const IDENTITY_REQUIRED = new Set([
  "bank-statements",
  "tax-returns",
  "personal-financial-statement",
  "debt-schedule",
]);

/** The consent shown before a biometric capture. Sourced from the registry. */
const IDENTITY_CONSENT_TEXT =
  "To confirm I am the person this request belongs to, I authorize the portal and its identity " +
  "verification provider to verify my identity using a government-issued ID and, where required, " +
  "a photo of my face compared against that ID. This is used only to confirm my identity and to " +
  "prevent fraud. It is not a credit check and does not affect my credit.";

/** Per-file attestation (founder direction 2026-08-06). Deliberately an
 *  ATTESTATION about THIS file, not a repeated consent — a fresh statement
 *  each time carries evidentiary weight where an identical repeated tick
 *  does not, and it creates real exposure for a falsified record. */
const ATTESTATION_TEXT =
  "I confirm this file is a true, complete and unaltered copy of the record it claims to be, that " +
  "I am authorised to provide it, and that my broker and any lender will rely on it.";

function SecureUploadInner() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [dealRef, setDealRef] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [providerConfigured, setProviderConfigured] = useState<boolean | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [states, setStates] = useState<Record<string, UploadState>>({});
  const [attested, setAttested] = useState<Record<string, boolean>>({});
  const [identity, setIdentity] = useState<IdentityState>({ status: "loading" });
  const [identityConsent, setIdentityConsent] = useState(false);
  const [identityBusy, setIdentityBusy] = useState(false);

  /**
   * Identity status drives which slots are open. Polled on mount and again on
   * return from the provider, because the OUTCOME arrives by webhook — the
   * browser coming back from Stripe proves only that a browser came back.
   */
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    const check = async () => {
      const res = await fetch("/api/identity/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "status", token }),
      });
      const data = await res.json().catch(() => null);
      if (cancelled || !data?.ok) return;
      setIdentity({
        status: data.verified ? "verified" : data.status === "not-started" ? "not-started" : "pending",
        mode: data.mode ?? null,
        raw: data.status ?? null,
      });
    };
    void check();
    // Returning from the provider: the webhook may land a beat after the
    // redirect, so re-check a few times rather than showing a stale "pending".
    if (params.get("identity") === "returned") {
      const timers = [2000, 5000, 10000].map((ms) => setTimeout(() => void check(), ms));
      return () => {
        cancelled = true;
        timers.forEach(clearTimeout);
      };
    }
    return () => {
      cancelled = true;
    };
  }, [token, params]);

  async function beginIdentity() {
    setIdentityBusy(true);
    try {
      const res = await fetch("/api/identity/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start", token, consented: true }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Identity verification could not be started.");
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
        return;
      }
      // Configured but no hosted URL — say so rather than spin.
      setIdentity({ status: "pending", mode: data.mode ?? null, raw: data.status ?? null, note: data.notice ?? null });
    } catch (error) {
      setIdentity((s) => ({ ...s, note: error instanceof Error ? error.message : "Could not start." }));
    } finally {
      setIdentityBusy(false);
    }
  }

  useEffect(() => {
    if (!token) { setLinkError("This page needs a secure link — open it from the link you were sent."); return; }
    void (async () => {
      const res = await fetch("/api/public/secure-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "exchange", token }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) { setLinkError(data.error ?? "This link could not be verified."); return; }
      setDealRef(data.dealRef); setExpiresAt(data.expiresAt); setProviderConfigured(data.providerConfigured);
    })();
  }, [token]);

  async function handleFile(documentType: string, file: File) {
    setStates((s) => ({ ...s, [documentType]: { status: "uploading" } }));
    try {
      const beginRes = await fetch("/api/public/secure-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "begin", token, fileName: file.name, mimeType: file.type || null, byteSize: file.size, documentType }),
      });
      const begin = await beginRes.json();
      if (!beginRes.ok || !begin.ok) throw new Error(begin.error ?? "Could not start the upload.");
      let uploaded = false;
      if (begin.uploadUrl) {
        const put = await fetch(begin.uploadUrl, { method: "PUT", headers: { "Content-Type": file.type || "application/octet-stream" }, body: file });
        if (!put.ok) throw new Error("The secure storage transfer failed — try again.");
        uploaded = true;
      }
      const confirmRes = await fetch("/api/public/secure-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "confirm", token, fileName: file.name, mimeType: file.type || null, byteSize: file.size, documentType, storageUri: begin.storageUri, uploaded, attestationText: ATTESTATION_TEXT }),
      });
      const confirm = await confirmRes.json();
      if (!confirmRes.ok || !confirm.ok) throw new Error(confirm.error ?? "The upload could not be confirmed.");
      setStates((s) => ({
        ...s,
        [documentType]: uploaded
          ? {
              status: "done",
              note: `${file.name} — received into secure custody; your broker will be able to review it.`,
            }
          : {
              // Honest degradation must not LOOK like success (founder test
              // 2026-08-05: a green check next to "recorded" read as stored).
              status: "pending",
              note: `${file.name} — details recorded, but the FILE WAS NOT STORED: secure storage is not active in this environment. Re-send it once the portal confirms live storage.`,
            },
      }));
    } catch (error) {
      setStates((s) => ({ ...s, [documentType]: { status: "error", note: error instanceof Error ? error.message : "Upload failed." } }));
    }
  }

  if (linkError) {
    return (
      <main style={{ maxWidth: 720, margin: "0 auto", padding: "48px 20px" }}>
        <h1 style={{ color: "#1C2B45", fontFamily: "Georgia,serif" }}>Secure document upload</h1>
        <p style={{ color: "#a12626", fontSize: 14, lineHeight: 1.6 }}>{linkError}</p>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "40px 20px", display: "grid", gap: 16 }}>
      <h1 style={{ margin: 0, color: "#1C2B45", fontFamily: "Georgia,serif" }}>Secure document upload</h1>
      <p style={{ margin: 0, color: "#3b475a", fontSize: 14, lineHeight: 1.65 }}>
        {dealRef ? <>For deal <strong>{dealRef}</strong>. </> : "Verifying your link… "}
        Files travel encrypted, directly into access-controlled storage that only your
        broker&apos;s review process can reach — nothing is sent by email, and this page never sees
        or stores your account numbers itself. This link is single-purpose and expires
        {expiresAt ? ` on ${new Date(expiresAt).toLocaleDateString()}` : " after a few days"}.
      </p>
      {providerConfigured === false && (
        <p style={{ margin: 0, color: "#8F6E1F", background: "#FFF9E8", border: "1px solid #D7B85A", borderRadius: 10, padding: "10px 12px", fontSize: 13, lineHeight: 1.55 }}>
          Heads-up: secure storage is not yet activated in this environment. Your file details will be
          recorded for your broker, but hold the documents themselves until the portal confirms live storage.
        </p>
      )}
      <div style={{ display: "grid", gap: 10 }}>
        {DOC_SLOTS.map((slot) => {
          const st = states[slot.type] ?? { status: "idle" as const };
          // A financial slot stays shut until identity is verified. The other
          // slots are unaffected — an entity document or a purchase agreement
          // needs only the link, and making someone verify to send those would
          // be friction with no security behind it.
          const identityBlocks = IDENTITY_REQUIRED.has(slot.type) && identity.status !== "verified";
          return (
            <section key={slot.type} style={{ border: "1px solid #d7deea", borderRadius: 12, background: "#fff", padding: "14px 16px", display: "grid", gap: 6 }}>
              <strong style={{ color: "#1C2B45", fontSize: 14 }}>{slot.label}</strong>
              <span style={{ color: "#5A6172", fontSize: 12.5 }}>{slot.hint}</span>
              {slot.actionHref && (
                <a href={slot.actionHref} style={{ color: "#0F6E56", fontSize: 12.5, fontWeight: 750, textDecoration: "none" }}>
                  {slot.actionLabel}
                </a>
              )}
              {identityBlocks ? (
                <div role="note" style={{ border: "1px solid #B08A2E", background: "#FFF9E8", borderRadius: 9, padding: "11px 13px", display: "grid", gap: 7 }}>
                  <strong style={{ fontSize: 12.5, color: "#8F6E1F" }}>
                    {identity.status === "loading"
                      ? "Checking…"
                      : identity.status === "pending"
                        ? "Identity check in progress"
                        : "One identity check first"}
                  </strong>
                  <span style={{ fontSize: 12.5, color: "#3b475a", lineHeight: 1.6 }}>
                    {identity.status === "pending"
                      ? "Your check has been submitted and is being reviewed by the provider. This slot opens by itself once it clears — you can close this page and come back."
                      : "Tax returns, bank statements, personal financial statements and debt schedules are the records an impostor most wants. Before they enter the vault we confirm you are you — once, and it covers all four."}
                  </span>
                  {identity.status === "not-started" && (
                    <>
                      <label style={{ display: "flex", gap: 9, alignItems: "flex-start", fontSize: 12, color: "#3b475a", lineHeight: 1.55 }}>
                        <input
                          type="checkbox"
                          checked={identityConsent}
                          onChange={(e) => setIdentityConsent(e.target.checked)}
                          style={{ marginTop: 2 }}
                        />
                        <span>{IDENTITY_CONSENT_TEXT}</span>
                      </label>
                      <button
                        type="button"
                        disabled={!identityConsent || identityBusy}
                        onClick={() => void beginIdentity()}
                        style={{ justifySelf: "start", border: 0, borderRadius: 8, padding: "9px 14px", background: identityConsent ? "#1C2B45" : "#a9b6c8", color: "#fff", fontWeight: 800, fontSize: 13, cursor: identityConsent && !identityBusy ? "pointer" : "default" }}
                      >
                        {identityBusy ? "Opening…" : "Verify my identity →"}
                      </button>
                    </>
                  )}
                  {identity.mode === "test" && (
                    <span style={{ fontSize: 11.5, color: "#8F6E1F", fontWeight: 700 }}>
                      TEST MODE — a verification ceremony, not a live identity assertion.
                    </span>
                  )}
                  {identity.note && <span role="alert" style={{ fontSize: 12, color: "#a12626" }}>{identity.note}</span>}
                </div>
              ) : (
                <>
                  <label style={{ display: "flex", gap: 9, alignItems: "flex-start", fontSize: 12.5, color: "#3b475a", lineHeight: 1.55, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "9px 11px" }}>
                    <input
                      type="checkbox"
                      checked={attested[slot.type] === true}
                      onChange={(e) => setAttested((a) => ({ ...a, [slot.type]: e.target.checked }))}
                      style={{ marginTop: 2 }}
                    />
                    <span>{ATTESTATION_TEXT}</span>
                  </label>
                  <input
                    type="file"
                    aria-label={`Upload ${slot.label}`}
                    disabled={st.status === "uploading" || !dealRef || attested[slot.type] !== true}
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFile(slot.type, f); e.target.value = ""; }}
                    style={{ fontSize: 13 }}
                  />
                </>
              )}
              {st.status === "uploading" && <span style={{ color: "#5A6172", fontSize: 12.5 }}>Encrypting and transferring…</span>}
              {st.status === "done" && <span style={{ color: "#1C4532", fontSize: 12.5, fontWeight: 700 }}>✓ {st.note}</span>}
              {st.status === "pending" && <span role="alert" style={{ color: "#8F6E1F", background: "#FFF9E8", border: "1px solid #D7B85A", borderRadius: 8, padding: "6px 9px", fontSize: 12.5, fontWeight: 700 }}>⚠ {st.note}</span>}
              {st.status === "error" && <span role="alert" style={{ color: "#a12626", fontSize: 12.5 }}>{st.note}</span>}
            </section>
          );
        })}
      </div>
      <p style={{ margin: 0, color: "#6B7280", fontSize: 11.5, lineHeight: 1.6 }}>
        Chain of custody: every file is classified CONFIDENTIAL on receipt, access-logged, retained
        per policy, and reviewable only through your broker&apos;s governed workspace.
        Uploading here is your consent to that handling for this financing request; nothing here is
        a credit decision, and you may request deletion of documents for a withdrawn request at any time.
      </p>
    </main>
  );
}

export default function SecureUploadPage() {
  return (
    <Suspense fallback={<main style={{ padding: 48 }}>Loading…</main>}>
      <SecureUploadInner />
    </Suspense>
  );
}
