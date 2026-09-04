"use client";

/**
 * Sovereign Secure Upload — the borrower's encrypted document channel
 * (founder direction 2026-08-05: financials and PII never travel by email).
 *
 * Flow: the page exchanges its signed link token for the deal reference and
 * checklist, then for each file: begin (governed handoff + direct-to-storage
 * session) → browser PUTs bytes straight to the IAM-private bucket over TLS
 * → confirm (governed custody record for the Capital Desk / assigned reviewer). File bytes never pass
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
  { type: "other-supporting", label: "Anything else", hint: "Whatever your Capital Desk or assigned finance reviewer asked for that isn't above" },
];

type UploadState = { status: "idle" | "uploading" | "done" | "pending" | "error"; note?: string };

/** Per-file attestation (founder direction 2026-08-06). Deliberately an
 *  ATTESTATION about THIS file, not a repeated consent — a fresh statement
 *  each time carries evidentiary weight where an identical repeated tick
 *  does not, and it creates real exposure for a falsified record. */
const ATTESTATION_TEXT =
  "I confirm this file is a true, complete and unaltered copy of the record it claims to be, that " +
  "I am authorised to provide it, and that Furlong's authorized finance reviewer and any lender I later authorize may rely on it.";

function SecureUploadInner() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [dealRef, setDealRef] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [providerConfigured, setProviderConfigured] = useState<boolean | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [states, setStates] = useState<Record<string, UploadState>>({});
  const [attested, setAttested] = useState<Record<string, boolean>>({});

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
              note: `${file.name} — received into secure custody; the authorized Capital Desk / assigned finance reviewer can review it.`,
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
        Capital Desk / assigned finance-review process can reach — nothing is sent by email, and this page never sees
        or stores your account numbers itself. This link is single-purpose and expires
        {expiresAt ? ` on ${new Date(expiresAt).toLocaleDateString()}` : " after a few days"}.
      </p>
      {providerConfigured === false && (
        <p style={{ margin: 0, color: "#8F6E1F", background: "#FFF9E8", border: "1px solid #D7B85A", borderRadius: 10, padding: "10px 12px", fontSize: 13, lineHeight: 1.55 }}>
          Heads-up: secure storage is not yet activated in this environment. Your file details will be
          recorded for the financing case, but hold the documents themselves until the portal confirms live storage.
        </p>
      )}
      <div style={{ display: "grid", gap: 10 }}>
        {DOC_SLOTS.map((slot) => {
          const st = states[slot.type] ?? { status: "idle" as const };
          return (
            <section key={slot.type} style={{ border: "1px solid #d7deea", borderRadius: 12, background: "#fff", padding: "14px 16px", display: "grid", gap: 6 }}>
              <strong style={{ color: "#1C2B45", fontSize: 14 }}>{slot.label}</strong>
              <span style={{ color: "#5A6172", fontSize: 12.5 }}>{slot.hint}</span>
              {slot.actionHref && (
                <a href={slot.actionHref} style={{ color: "#0F6E56", fontSize: 12.5, fontWeight: 750, textDecoration: "none" }}>
                  {slot.actionLabel}
                </a>
              )}
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
        per policy, and reviewable only through the governed Capital Desk or an explicitly assigned professional workspace.
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
