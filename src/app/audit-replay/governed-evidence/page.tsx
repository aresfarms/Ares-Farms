import { getServerSession } from "next-auth";
import Link from "next/link";
import path from "node:path";
import { redirect } from "next/navigation";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { readLedgerEvents } from "@/lib/audit/appendLedger";
import { resolveAnonymousTokenIdForGovernedReview } from "@/lib/borrower-experience/anonymousToken";
import { composeGovernedEvidencePacket } from "@/lib/governance/governedEvidenceReviewPortal";
import {
  findEvidenceAccessGrant,
  issueEvidenceAccessGrant,
  recordInstitutionalEvidenceAccess,
} from "@/lib/governance/institutionalEvidenceAccess";
import { enforceInstitutionalPacketAccess } from "@/lib/governance/institutionalAccessRuntimeEnforcement";
import {
  latestValidCredentialVerification,
  verifyInstitutionalCredential,
} from "@/lib/governance/institutionalCredentialVerification";
import {
  latestValidLegalAuthorityVerification,
  verifyInstitutionalLegalAuthority,
} from "@/lib/governance/institutionalLegalAuthorityVerification";
import { moduleManifests } from "@/lib/modules/moduleRegistry";
import { verifyLedgerChain } from "@/lib/security/ledgerHashChain";

const portalRoles = new Set(["auditor", "government_official", "attorney", "governance", "admin"]);

function sessionIdentity(session: unknown) {
  const user = (session as { user?: { id?: string; email?: string; role?: string } } | null | undefined)?.user;
  return {
    id: String(user?.id ?? user?.email ?? "unknown"),
    email: String(user?.email ?? "unknown"),
    role: String(user?.role ?? "").toLowerCase(),
  };
}

async function createAttorneyTokenGrant(formData: FormData) {
  "use server";
  const session = await getServerSession(authOptions);
  const actor = sessionIdentity(session);
  if (actor.role !== "attorney") throw new Error("Only an authenticated attorney account may use token-bound review.");
  const token = String(formData.get("token") ?? "").trim();
  const tokenId = resolveAnonymousTokenIdForGovernedReview(token);
  if (!tokenId) {
    recordInstitutionalEvidenceAccess({ actorId: actor.id, actorEmail: actor.email, role: actor.role, action: "LOGIN", outcome: "DENIED", reason: "Anonymous token validation failed." });
    throw new Error("The anonymous token was not recognized.");
  }
  const issuedAt = new Date();
  const credential = latestValidCredentialVerification({ principalId: actor.id, principalEmail: actor.email, role: "attorney", at: issuedAt.toISOString() });
  if (!credential) throw new Error("Active state-bar verification is required before attorney access can be granted.");
  const matterId = String(formData.get("matterId") ?? "").trim() || null;
  const authority = latestValidLegalAuthorityVerification({ principalId: actor.id, principalEmail: actor.email, role: "attorney", subjectId: tokenId, matterId });
  if (!authority) throw new Error("Independently verified legal authority for this token and matter is required before access can be granted.");
  const grant = issueEvidenceAccessGrant({
    role: "attorney",
    principalId: actor.id,
    principalEmail: actor.email,
    purpose: "Attorney review based on demonstrated possession of an anonymous token.",
    matterId,
    agencyOrFirm: String(formData.get("firm") ?? "").trim() || null,
    tenantId: null,
    moduleIds: ["anonymous-token"],
    subjectIds: [tokenId],
    tokenId,
    windowStart: null,
    windowEnd: null,
    expiresAt: new Date(issuedAt.getTime() + 30 * 60 * 1000).toISOString(),
    issuedBy: actor.id,
    credentialVerificationId: credential.verificationId,
    authorityVerificationId: authority.authorityVerificationId,
    issuedAt: issuedAt.toISOString(),
  });
  recordInstitutionalEvidenceAccess({ actorId: actor.id, actorEmail: actor.email, role: actor.role, action: "LOGIN", outcome: "ALLOWED", reason: "Short-lived token-bound attorney grant issued.", grantId: grant.grantId, tokenId });
  redirect(`/audit-replay/governed-evidence?grant=${encodeURIComponent(grant.grantId)}`);
}

async function createScopedInstitutionalGrant(formData: FormData) {
  "use server";
  const session = await getServerSession(authOptions);
  const actor = sessionIdentity(session);
  if (!(["governance", "admin"] as string[]).includes(actor.role)) throw new Error("Governance or administrator authority is required to issue an institutional grant.");
  const role = String(formData.get("role") ?? "") as "attorney" | "government_official" | "auditor";
  const principalId = String(formData.get("principalId") ?? "").trim();
  const principalEmail = String(formData.get("principalEmail") ?? "").trim().toLowerCase();
  const expiresAt = String(formData.get("expiresAt") ?? "").trim();
  const windowStart = String(formData.get("windowStart") ?? "").trim() || null;
  const windowEnd = String(formData.get("windowEnd") ?? "").trim() || null;
  const moduleId = String(formData.get("moduleId") ?? "").trim();
  const subjectId = String(formData.get("subjectId") ?? "").trim();
  if (!moduleId || !subjectId) throw new Error("Institutional grants require explicit module and subject scope.");
  const credential = latestValidCredentialVerification({ principalId, principalEmail, role });
  if (!credential) throw new Error("A current credential verification is required for the selected principal and role.");
  const matterId = String(formData.get("matterId") ?? "").trim() || null;
  const authority = latestValidLegalAuthorityVerification({ principalId, principalEmail, role, subjectId: subjectId || null, matterId });
  if (!authority) throw new Error("A current independently verified legal-authority receipt is required for the selected principal, subject, and matter.");
  const grant = issueEvidenceAccessGrant({
    role,
    principalId,
    principalEmail,
    purpose: String(formData.get("purpose") ?? "").trim(),
    matterId,
    agencyOrFirm: String(formData.get("agencyOrFirm") ?? "").trim() || null,
    tenantId: String(formData.get("tenantId") ?? "").trim() || null,
    moduleIds: moduleId ? [moduleId] : [],
    subjectIds: subjectId ? [subjectId] : [],
    tokenId: null,
    windowStart,
    windowEnd,
    expiresAt,
    issuedBy: actor.id,
    credentialVerificationId: credential.verificationId,
    authorityVerificationId: authority.authorityVerificationId,
  });
  redirect(`/audit-replay/governed-evidence?grant=${encodeURIComponent(grant.grantId)}`);
}

async function recordLegalAuthorityVerification(formData: FormData) {
  "use server";
  const session = await getServerSession(authOptions);
  const actor = sessionIdentity(session);
  if (!(["governance", "admin"] as string[]).includes(actor.role)) throw new Error("Governance or administrator authority is required to verify legal authority.");
  verifyInstitutionalLegalAuthority({
    principalId: String(formData.get("principalId") ?? "").trim(),
    principalEmail: String(formData.get("principalEmail") ?? "").trim().toLowerCase(),
    role: String(formData.get("role") ?? "") as "attorney" | "government_official" | "auditor",
    clientOrAgencySubjectId: String(formData.get("subjectId") ?? "").trim(),
    matterId: String(formData.get("matterId") ?? "").trim(),
    jurisdiction: String(formData.get("jurisdiction") ?? "").trim(),
    authorityType: String(formData.get("authorityType") ?? "").trim(),
    effectiveAt: String(formData.get("effectiveAt") ?? "").trim(),
    expiresAt: String(formData.get("expiresAt") ?? "").trim(),
    sourceDocumentPayload: String(formData.get("sourceDocumentPayload") ?? "").trim(),
    independentSourceRef: String(formData.get("independentSourceRef") ?? "").trim(),
    independentSourcePayload: String(formData.get("independentSourcePayload") ?? "").trim(),
    namedPrincipalMatched: formData.get("namedPrincipalMatched") === "on",
    subjectMatched: formData.get("subjectMatched") === "on",
    matterMatched: formData.get("matterMatched") === "on",
    jurisdictionMatched: formData.get("jurisdictionMatched") === "on",
    verifiedBy: actor.id,
    reason: String(formData.get("reason") ?? "").trim(),
  });
  redirect("/audit-replay/governed-evidence");
}

async function recordCredentialVerification(formData: FormData) {
  "use server";
  const session = await getServerSession(authOptions);
  const actor = sessionIdentity(session);
  if (!(["governance", "admin"] as string[]).includes(actor.role)) throw new Error("Governance or administrator authority is required to verify credentials.");
  const role = String(formData.get("role") ?? "") as "attorney" | "government_official" | "auditor";
  verifyInstitutionalCredential({
    principalId: String(formData.get("principalId") ?? "").trim(),
    principalEmail: String(formData.get("principalEmail") ?? "").trim().toLowerCase(),
    fullLegalName: String(formData.get("fullLegalName") ?? "").trim(),
    role,
    credentialType: String(formData.get("credentialType") ?? "").trim(),
    credentialIdentifier: String(formData.get("credentialIdentifier") ?? "").trim(),
    jurisdictionOrIssuer: String(formData.get("jurisdictionOrIssuer") ?? "").trim(),
    officialSourceRef: String(formData.get("officialSourceRef") ?? "").trim(),
    officialSourcePayload: String(formData.get("officialSourcePayload") ?? "").trim(),
    method: String(formData.get("method") ?? "OFFICIAL_DIRECTORY_MANUAL") as "OFFICIAL_DIRECTORY_AUTOMATED" | "OFFICIAL_DIRECTORY_MANUAL" | "ISSUER_CONFIRMATION" | "AGENCY_CONFIRMATION",
    standing: String(formData.get("standing") ?? "").trim(),
    titleOrClassification: String(formData.get("titleOrClassification") ?? "").trim() || null,
    agencyOrFirm: String(formData.get("agencyOrFirm") ?? "").trim() || null,
    independenceAttested: role === "auditor" ? formData.get("independenceAttested") === "on" : null,
    verifiedBy: actor.id,
    expiresAt: String(formData.get("expiresAt") ?? "").trim(),
    reason: String(formData.get("reason") ?? "").trim(),
  });
  redirect("/audit-replay/governed-evidence");
}

export default async function GovernedEvidenceReviewPage({ searchParams }: { searchParams: Promise<{ module?: string; grant?: string; subject?: string; from?: string; to?: string }> }) {
  const session = await getServerSession(authOptions);
  const actor = sessionIdentity(session);
  if (!(session as { user?: unknown } | null | undefined)?.user || !portalRoles.has(actor.role)) {
    return <main style={{ maxWidth: 760, margin: "0 auto", padding: 32 }}><h1>Restricted evidence review</h1><p>This passworded screen is limited to separately provisioned auditor, governmental-official, attorney, governance, and administrator accounts.</p></main>;
  }

  const query = await searchParams;
  const moduleId = query.module?.trim() || null;
  const subjectId = query.subject?.trim() || null;
  const grant = query.grant ? findEvidenceAccessGrant(query.grant) : null;
  const allEvents = readLedgerEvents();
  const packetRole = grant?.role ?? actor.role;
  const runtimeDecision = enforceInstitutionalPacketAccess({
    actorId: actor.id,
    actorEmail: actor.email,
    actorRole: packetRole,
    grant,
    candidateEvents: allEvents,
    requestedModuleId: moduleId,
    requestedSubjectId: subjectId,
    requestedWindowStart: query.from ?? null,
    requestedWindowEnd: query.to ?? null,
    action: "VIEW",
  });
  const decisionReason = runtimeDecision.reasonCodes.join(", ");

  recordInstitutionalEvidenceAccess({
    actorId: actor.id, actorEmail: actor.email, role: actor.role, action: "VIEW_PACKET",
    outcome: runtimeDecision.allowed ? "ALLOWED" : "DENIED", reason: decisionReason,
    grantId: grant?.grantId ?? null, moduleId, subjectId, tokenId: grant?.tokenId ?? null,
    windowStart: query.from ?? grant?.windowStart ?? null, windowEnd: query.to ?? grant?.windowEnd ?? null,
  });

  if (!runtimeDecision.allowed) {
    return (
      <main style={{ maxWidth: 900, margin: "0 auto", padding: 32, display: "grid", gap: 18 }}>
        <h1>Governed Evidence Review Portal</h1>
        <p><strong>Access not granted:</strong> {decisionReason}</p>
        {actor.role === "attorney" ? (
          <form action={createAttorneyTokenGrant} style={{ display: "grid", gap: 10, maxWidth: 600 }}>
            <h2>Open a token-bound attorney review</h2>
            <label>Anonymous token<input name="token" type="password" required style={{ display: "block", width: "100%", padding: 10 }} /></label>
            <label>Matter reference<input name="matterId" style={{ display: "block", width: "100%", padding: 10 }} /></label>
            <label>Firm<input name="firm" style={{ display: "block", width: "100%", padding: 10 }} /></label>
            <button type="submit">Validate token and open 30-minute review</button>
          </form>
        ) : null}
      </main>
    );
  }

  const ledgerPath = path.join(process.cwd(), "data", "audit-ledger.ndjson");
  const authorizedEvents = [...runtimeDecision.events];
  const effectiveModule = moduleId && grant?.moduleIds.includes(moduleId) ? moduleId : null;
  const packet = composeGovernedEvidencePacket({
    scope: effectiveModule ? { kind: "MODULE", moduleId: effectiveModule } : { kind: "PLATFORM" },
    modules: moduleManifests,
    events: authorizedEvents,
    chainVerification: verifyLedgerChain(ledgerPath),
  });

  return (
    <main style={{ maxWidth: 1180, margin: "0 auto", padding: "28px 24px 80px", display: "grid", gap: 18 }}>
      <header style={{ border: "1px solid #d5dbe7", borderRadius: 12, padding: 20 }}>
        <p style={{ margin: 0, fontSize: 12, fontWeight: 700 }}>PASSWORD-PROTECTED · {actor.role.toUpperCase().replaceAll("_", " ")}</p>
        <h1 style={{ margin: "8px 0" }}>Governed Evidence Review Portal</h1>
        <p style={{ margin: 0 }}>Every view, search, verification, export, and denial is recorded in the append-only institutional access ledger.</p>
      </header>

      <section style={{ border: "1px solid #d5dbe7", borderRadius: 12, padding: 18 }}>
        <form method="get" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 10 }}>
          {query.grant ? <input type="hidden" name="grant" value={query.grant} /> : null}
          <label>Module<select name="module" defaultValue={moduleId ?? ""} style={{ display: "block", width: "100%", padding: 10 }}><option value="">Whole permitted scope</option>{moduleManifests.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}</select></label>
          <label>Subject<input name="subject" defaultValue={subjectId ?? ""} style={{ display: "block", width: "100%", padding: 10 }} /></label>
          <label>From<input name="from" type="datetime-local" defaultValue={query.from ?? ""} style={{ display: "block", width: "100%", padding: 10 }} /></label>
          <label>To<input name="to" type="datetime-local" defaultValue={query.to ?? ""} style={{ display: "block", width: "100%", padding: 10 }} /></label>
          <button type="submit">Build permitted packet</button>
          <Link href="/audit-replay">Return to audit console</Link>
        </form>
      </section>

      {(["governance", "admin"] as string[]).includes(actor.role) ? (
        <details style={{ border: "1px solid #d5dbe7", borderRadius: 12, padding: 18 }}>
          <summary><strong>Verify client, matter, examination, or engagement authority</strong></summary>
          <form action={recordLegalAuthorityVerification} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 10, marginTop: 14 }}>
            <label>Role<select name="role" required><option value="attorney">Attorney</option><option value="government_official">Governmental official</option><option value="auditor">Auditor</option></select></label>
            <label>Principal ID<input name="principalId" required /></label><label>Principal email<input name="principalEmail" type="email" required /></label>
            <label>Client/agency subject ID<input name="subjectId" required /></label><label>Matter/examination ID<input name="matterId" required /></label>
            <label>Jurisdiction<input name="jurisdiction" required /></label><label>Authority type<input name="authorityType" placeholder="Representation, appointment, subpoena, engagement" required /></label>
            <label>Effective at<input name="effectiveAt" type="datetime-local" required /></label><label>Expires at<input name="expiresAt" type="datetime-local" required /></label>
            <label>Submitted authority evidence<textarea name="sourceDocumentPayload" required /></label><label>Independent corroborating source<input name="independentSourceRef" required /></label>
            <label>Independent source response<textarea name="independentSourcePayload" required /></label><label>Reason<input name="reason" required /></label>
            <label><input type="checkbox" name="namedPrincipalMatched" required /> Named professional matches</label><label><input type="checkbox" name="subjectMatched" required /> Client/agency subject matches</label>
            <label><input type="checkbox" name="matterMatched" required /> Matter/examination matches</label><label><input type="checkbox" name="jurisdictionMatched" required /> Jurisdiction matches</label>
            <button type="submit">Record verified authority</button>
          </form>
        </details>
      ) : null}

      {(["governance", "admin"] as string[]).includes(actor.role) ? (
        <details style={{ border: "1px solid #d5dbe7", borderRadius: 12, padding: 18 }}>
          <summary><strong>Verify professional or governmental credentials</strong></summary>
          <form action={recordCredentialVerification} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 10, marginTop: 14 }}>
            <label>Role<select name="role" required><option value="attorney">Attorney</option><option value="government_official">Governmental official</option><option value="auditor">Auditor</option></select></label>
            <label>Principal ID<input name="principalId" required /></label><label>Principal email<input name="principalEmail" type="email" required /></label><label>Full legal name<input name="fullLegalName" required /></label>
            <label>Credential type<input name="credentialType" placeholder="State Bar, CPA, CIA, agency appointment" required /></label><label>Credential number<input name="credentialIdentifier" type="password" required /></label>
            <label>Jurisdiction or issuer<input name="jurisdictionOrIssuer" required /></label><label>Standing/status<input name="standing" placeholder="Active / Eligible / Confirmed" required /></label>
            <label>Agency or firm<input name="agencyOrFirm" /></label><label>Title/classification<input name="titleOrClassification" /></label>
            <label>Official source<input name="officialSourceRef" required /></label><label>Verification method<select name="method"><option value="OFFICIAL_DIRECTORY_MANUAL">Official directory — manual</option><option value="OFFICIAL_DIRECTORY_AUTOMATED">Official directory — automated</option><option value="ISSUER_CONFIRMATION">Issuer confirmation</option><option value="AGENCY_CONFIRMATION">Agency confirmation</option></select></label>
            <label>Source response/evidence<textarea name="officialSourcePayload" required /></label><label>Expires at<input name="expiresAt" type="datetime-local" required /></label>
            <label>Reason<input name="reason" required /></label><label><input name="independenceAttested" type="checkbox" /> Auditor independence attested for this engagement</label>
            <button type="submit">Record verified credential</button>
          </form>
        </details>
      ) : null}

      {(["governance", "admin"] as string[]).includes(actor.role) ? (
        <details style={{ border: "1px solid #d5dbe7", borderRadius: 12, padding: 18 }}>
          <summary><strong>Issue a scoped institutional access grant</strong></summary>
          <form action={createScopedInstitutionalGrant} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 10, marginTop: 14 }}>
            <label>Role<select name="role" required><option value="attorney">Attorney</option><option value="government_official">Governmental official</option><option value="auditor">Auditor</option></select></label>
            <label>Principal ID<input name="principalId" required /></label><label>Principal email<input name="principalEmail" type="email" required /></label>
            <label>Agency or firm<input name="agencyOrFirm" /></label><label>Matter ID<input name="matterId" /></label><label>Purpose<input name="purpose" required /></label>
            <label>Tenant ID<input name="tenantId" /></label><label>Module ID<input name="moduleId" /></label><label>Subject ID<input name="subjectId" /></label>
            <label>Window start<input name="windowStart" type="datetime-local" /></label><label>Window end<input name="windowEnd" type="datetime-local" /></label>
            <label>Expires at<input name="expiresAt" type="datetime-local" required /></label><button type="submit">Issue tracked grant</button>
          </form>
        </details>
      ) : null}

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>
        {[["Packet", packet.packetId], ["Access basis", `Grant ${grant?.grantId ?? "none"}`], ["Capability", runtimeDecision.capabilityToken ?? "none"], ["Capability expires", runtimeDecision.capabilityExpiresAt ?? "none"], ["Withheld fields", String(runtimeDecision.withheldCount)], ["Scope", packet.scope.kind === "PLATFORM" ? "Whole explicitly permitted scope" : packet.scope.moduleId], ["Modules", String(packet.moduleCount)], ["Ledger events", String(packet.evidenceEventCount)], ["Integrity", packet.integrityConclusion], ["Packet SHA-256", packet.packetSha256]].map(([label, value]) => <div key={label} style={{ border: "1px solid #d5dbe7", borderRadius: 10, padding: 14, overflowWrap: "anywhere" }}><div style={{ fontSize: 12, fontWeight: 700 }}>{label}</div><div style={{ marginTop: 6 }}>{value}</div></div>)}
      </section>

      <section style={{ border: "1px solid #d5dbe7", borderRadius: 12, padding: 18 }}><h2>Rule-matching logic</h2>{packet.ruleMatches.map((rule) => <article key={rule.ruleId} style={{ borderTop: "1px solid #e4e8ef", paddingTop: 12 }}><strong>{rule.ruleId} · {rule.status}</strong><div>{rule.label}</div><p>{rule.explanation}</p><small>{rule.evidenceRefs.join(" · ")}</small></article>)}</section>
      <section style={{ border: "1px solid #d5dbe7", borderRadius: 12, padding: 18 }}><h2>Plain-language legal record</h2>{packet.timeline.length === 0 ? <p>No permitted matching events were found.</p> : <ol>{packet.timeline.map((event) => <li key={`${event.occurredAt}-${event.sourceRef}`} style={{ marginBottom: 14 }}><strong>{event.occurredAt} · {event.action}</strong><div>{event.whatHappened}</div><div><em>Why it matters:</em> {event.whyItMatters}</div><small>{event.sourceRef} · {event.cryptographicCoverage}</small></li>)}</ol>}</section>
      <section style={{ border: "1px solid #e2b8b8", background: "#fff8f8", borderRadius: 12, padding: 18 }}><h2>Integrity limitations and legal boundary</h2>{packet.unresolvedIssues.length ? <ul>{packet.unresolvedIssues.map((issue) => <li key={issue}>{issue}</li>)}</ul> : <p>No unresolved packet-integrity issues were detected.</p>}<p>{packet.legalBoundary}</p></section>
    </main>
  );
}
