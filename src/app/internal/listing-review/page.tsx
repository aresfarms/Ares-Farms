import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { canApproveSourceLegal, operatorByEmail, sourceLegalApprovers } from "@/lib/auth/operatorRegistry";
import {
  allListers, allListings, recordLicenseVerification, recordProvenanceCheck,
} from "@/lib/source-intelligence/listing-intake/listingStore";
import {
  counselClearedStates, recordCounselClearance, recordListingDecision,
  type ListingDecision,
} from "@/lib/source-intelligence/listing-intake/listingSourceActivationStore";
import { listingRenderEligibility } from "@/lib/source-intelligence/listing-intake/listingRenderGate";
import type { LicenseStatus } from "@/lib/source-intelligence/listing-intake/listingTypes";

/**
 * Internal Listing Review — operator console for the direct-listing engine.
 * Operator-walled (/internal prefix → server auth gate); decisions require
 * Module 45 authority and write the append-only audit ledger. This is the
 * clickable path for: counsel clearance per state, license verification
 * (operator-recorded, evidence-referenced), provenance results, and per-listing
 * approve/reject/shelve. The build never self-approves anything.
 */

const muted = { color: "#5d687a", lineHeight: 1.6 } as const;
const card = { background: "#ffffff", border: "1px solid #d7deea", borderRadius: 12, padding: "18px 22px" } as const;

async function requireApprover() {
  "use server";
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!canApproveSourceLegal(email)) throw new Error("Module 45 authority required.");
  return operatorByEmail(email)!;
}

async function actCounsel(formData: FormData): Promise<void> {
  "use server";
  const op = await requireApprover();
  recordCounselClearance({
    state: String(formData.get("state") ?? ""),
    reviewerId: op.id, reviewerName: op.name,
    reason: String(formData.get("reason") ?? "").trim(),
  });
  revalidatePath("/internal/listing-review");
}

async function actLicense(formData: FormData): Promise<void> {
  "use server";
  const op = await requireApprover();
  recordLicenseVerification({
    listerId: String(formData.get("listerId") ?? ""),
    licenseStatus: String(formData.get("licenseStatus") ?? "unverified") as LicenseStatus,
    licenseNumber: String(formData.get("licenseNumber") ?? ""),
    licenseExpiration: String(formData.get("licenseExpiration") ?? "") || null,
    verificationSource: String(formData.get("verificationSource") ?? "").trim(),
    actorId: op.id, actorName: op.name,
  });
  revalidatePath("/internal/listing-review");
}

async function actProvenance(formData: FormData): Promise<void> {
  "use server";
  const op = await requireApprover();
  const v = String(formData.get("ownerOfRecordMatch") ?? "null");
  recordProvenanceCheck({
    listingId: String(formData.get("listingId") ?? ""),
    ownerOfRecordMatch: v === "true" ? true : v === "false" ? false : null,
    evidence: String(formData.get("evidence") ?? "").trim(),
    actorId: op.id, actorName: op.name,
  });
  revalidatePath("/internal/listing-review");
}

async function actDecide(formData: FormData): Promise<void> {
  "use server";
  const op = await requireApprover();
  recordListingDecision({
    listingId: String(formData.get("listingId") ?? ""),
    listingState: String(formData.get("listingState") ?? ""),
    decision: String(formData.get("decision") ?? "HOLD") as ListingDecision,
    reviewerId: op.id, reviewerName: op.name,
    reason: String(formData.get("reason") ?? "").trim(),
  });
  revalidatePath("/internal/listing-review");
}

export default async function ListingReviewPage() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  const operator = operatorByEmail(email);
  const mayApprove = canApproveSourceLegal(email);
  const listers = allListers();
  const listings = allListings();
  const cleared = counselClearedStates();

  return (
    <main style={{ maxWidth: 1000, margin: "0 auto", padding: "28px 24px 80px", display: "grid", gap: 18 }}>
      <header style={{ display: "grid", gap: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "#9a3412" }}>
          Internal · Operator review — not public
        </span>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: "#0f172a" }}>Listing Review — direct listings (broker / bank-REO)</h1>
        <p style={{ margin: 0, ...muted, fontSize: 14 }}>
          Signed in as <strong>{operator ? `${operator.name} (${operator.role})` : email ?? "unknown"}</strong>.{" "}
          {mayApprove ? "You hold Module 45 approve authority." : `View-only. Approvers: ${sourceLegalApprovers().map((o) => o.name).join(", ")}.`}
        </p>
      </header>

      {/* Counsel clearance — the hard precondition. */}
      <section style={{ ...card, borderColor: "#c7b3e6", background: "#faf8ff", display: "grid", gap: 8 }}>
        <strong style={{ fontSize: 15, color: "#0f172a" }}>Counsel-cleared states (free-venue posture confirmed)</strong>
        <p style={{ margin: 0, ...muted, fontSize: 13 }}>
          Currently cleared: <strong>{cleared.length ? cleared.join(", ") : "NONE — no listing can go live anywhere"}</strong>.
          Record a clearance only after the real estate attorney confirms the posture for that state.
        </p>
        {mayApprove && (
          <form action={actCounsel} style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <input name="state" placeholder="State (e.g. VA)" required maxLength={2} style={inp} />
            <input name="reason" placeholder="Counsel reference / reason (ledger-recorded)" required style={{ ...inp, minWidth: 320 }} />
            <button type="submit" style={btn("#6d28d9")}>Record counsel clearance</button>
          </form>
        )}
      </section>

      {/* Listers + license verification. */}
      <section style={{ ...card, display: "grid", gap: 10 }}>
        <strong style={{ fontSize: 15, color: "#0f172a" }}>Listers ({listers.length})</strong>
        {listers.length === 0 && <p style={{ margin: 0, ...muted, fontSize: 13 }}>No listers registered yet.</p>}
        {listers.map((l) => (
          <div key={l.listerId} style={{ borderTop: "1px dashed #e2e8f0", paddingTop: 8, display: "grid", gap: 6 }}>
            <span style={{ fontSize: 14, color: "#162033" }}>
              <strong>{l.displayName}</strong> · {l.credential.listerType} · license:{" "}
              <strong>{l.credential.licenseStatus ?? "unverified"}</strong>
              {l.credential.licenseNumber ? ` #${l.credential.licenseNumber}` : ""}
              {l.credential.licenseExpiration ? ` · exp ${l.credential.licenseExpiration}` : ""}
              {l.credential.verifiedAsOf ? ` · verified ${l.credential.verifiedAsOf}` : ""}
            </span>
            {mayApprove && (
              <form action={actLicense} style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <input type="hidden" name="listerId" value={l.listerId} />
                <select name="licenseStatus" defaultValue="active" style={inp}>
                  {["active", "expired", "suspended", "revoked", "not-found"].map((s) => <option key={s}>{s}</option>)}
                </select>
                <input name="licenseNumber" placeholder="License #" required style={inp} />
                <input name="licenseExpiration" placeholder="Expiration (YYYY-MM-DD)" style={inp} />
                <input name="verificationSource" placeholder="Verification source / evidence ref (required)" required style={{ ...inp, minWidth: 280 }} />
                <button type="submit" style={btn("#0f766e")}>Record license verification</button>
              </form>
            )}
          </div>
        ))}
      </section>

      {/* Listings queue. */}
      <section style={{ ...card, display: "grid", gap: 10 }}>
        <strong style={{ fontSize: 15, color: "#0f172a" }}>Listings ({listings.length})</strong>
        {listings.length === 0 && <p style={{ margin: 0, ...muted, fontSize: 13 }}>No submissions yet.</p>}
        {listings.map((l) => {
          const elig = listingRenderEligibility(l);
          return (
            <div key={l.listingId} style={{ borderTop: "1px dashed #e2e8f0", paddingTop: 8, display: "grid", gap: 6 }}>
              <span style={{ fontSize: 14, color: "#162033" }}>
                <strong>{l.town}, {l.state}</strong> · {l.propertyType} · by {l.listerDisplayName} · status{" "}
                <strong>{l.status}</strong> · renderable: <strong>{String(elig.canRender)}</strong>
              </span>
              {!elig.canRender && (
                <span style={{ fontSize: 12, color: "#9a3412" }}>blocked: {elig.reasons.join(" · ")}</span>
              )}
              {mayApprove && (
                <div style={{ display: "grid", gap: 6 }}>
                  <form action={actProvenance} style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <input type="hidden" name="listingId" value={l.listingId} />
                    <select name="ownerOfRecordMatch" defaultValue="null" style={inp}>
                      <option value="true">owner-of-record MATCH (evidence required)</option>
                      <option value="false">MISMATCH (shelve)</option>
                      <option value="null">not machine-verifiable</option>
                    </select>
                    <input name="evidence" placeholder="Evidence reference (listing agreement #…)" style={{ ...inp, minWidth: 260 }} />
                    <button type="submit" style={btn("#475569")}>Record provenance</button>
                  </form>
                  <form action={actDecide} style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <input type="hidden" name="listingId" value={l.listingId} />
                    <input type="hidden" name="listingState" value={l.state} />
                    <input name="reason" placeholder="Reason (ledger-recorded)" required style={{ ...inp, minWidth: 260 }} />
                    <button type="submit" name="decision" value="APPROVE" style={btn("#0f766e")}>Approve</button>
                    <button type="submit" name="decision" value="REJECT" style={btn("#9a3412")}>Reject</button>
                    <button type="submit" name="decision" value="SHELVE_PROVENANCE" style={btn("#6d28d9")}>Shelve (provenance)</button>
                    <button type="submit" name="decision" value="HOLD" style={btn("#475569")}>Hold</button>
                  </form>
                </div>
              )}
            </div>
          );
        })}
        <p style={{ margin: 0, fontSize: 12, color: "#94a3b8" }}>
          A listing renders ONLY when operator-approved AND its state is counsel-cleared AND fair-housing,
          identity, accountable-party, and license gates all pass. Every decision is ledger-attributed.
        </p>
      </section>
    </main>
  );
}

const inp = { padding: "6px 10px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13 } as const;
function btn(bg: string) {
  return { background: bg, color: "#fff", border: "none", borderRadius: 8, padding: "7px 14px", fontWeight: 700, fontSize: 13, cursor: "pointer" } as const;
}
