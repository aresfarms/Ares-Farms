/**
 * Professional Access — the single door for the platform's credentialed
 * counterparties (founder direction 2026-08-06: "one stop shop… if you're an
 * attorney login here, auditor here, lender here").
 *
 * SECURITY POSTURE — read before changing anything here:
 * Each lane is a DESTINATION, not a claim. Clicking "I'm an auditor" grants
 * nothing: every link lands on the SAME governed sign-in, and authority is
 * resolved server-side. A page that let a visitor pick their own privilege
 * would be exactly the caller-claimed-role hole the API perimeter rejects.
 *
 * HOW AUTHORITY IS ACTUALLY ESTABLISHED (founder correction 2026-08-06 —
 * the earlier version of this page under-described it). Two governed paths,
 * both already built:
 *   1. CREDENTIAL VERIFICATION (institutionalCredentialVerification.ts):
 *      the professional's licence/commission is verified against the OFFICIAL
 *      issuing directory — bar, agency, or issuer confirmation — and the
 *      resulting verification TOKEN is bound to that principal, carries the
 *      official source snapshot hash, a standing, and an EXPIRY. Access is
 *      the token, not the job title.
 *   2. COMPELLED DISCLOSURE (compelledDisclosureCeremony.ts): an attorney or
 *      agency arriving WITHOUT a standing credential presents legal process —
 *      court order, subpoena, warrant, or agency demand. The ceremony records
 *      it, fixes the NOTICE POSTURE (required / delayed / prohibited /
 *      pending legal review), and opens ONLY the selectors that process
 *      actually names. Nothing else in the vault becomes reachable.
 *
 * Each lane states plainly what that role can and cannot see — minimum
 * disclosure is the promise, so it belongs in front of the login.
 *
 * Master Volume Governance: Vol I (accountable authority — named humans, not
 * self-declared roles); Vol II (controlled disclosure per role); Vol V
 * (auditable access boundaries).
 */

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Professional Access | Furlong",
  description:
    "The governed sign-in for lenders, attorneys, auditors and sponsors working a Furlong file. Access is granted to named accounts only.",
};

const NAVY = "#1C2B45";
const GOLD = "#b8862f";
const INK = "#101a2b";
const MUTED = "#4d596d";

type Lane = {
  role: string;
  title: string;
  who: string;
  sees: string[];
  neverSees: string[];
  destination: string;
  accent: string;
  /**
   * FOUNDER-CAUGHT 2026-08-06. The attorney and auditor lanes pointed at
   * /governance and /audit-replay — both INTERNAL operator consoles carrying
   * the full 43-module platform nav (deployment gates, release board packets,
   * billing controls, connector certification). An outside counterparty must
   * never reach those. The API perimeter's "caller-claimed authority" 403 was
   * the only thing preventing it, and that 403 is itself a bug queued for fix,
   * so the door cannot be left standing on an accident.
   *
   * A lane marked "building" renders as a stated absence, not a link. It goes
   * back to "live" only when a purpose-built, scope-limited surface exists for
   * that counterparty — never by re-pointing it at an internal console.
   */
  status: "live" | "building";
  buildingNote?: string;
};

const LANES: Lane[] = [
  {
    role: "lender",
    title: "Lender / Debt Broker",
    who: "The commercial debt broker or a funding lender working a live financing file.",
    sees: [
      "Deals routed to you, with the customer's contact details and property",
      "The borrower's uploaded documents — one file at a time, every open recorded",
      "Status, customer-visible notes, and the closing timeline you maintain",
      "Documents you send back to the customer, and signature requests",
    ],
    neverSees: [
      "Any deal not routed to you",
      "Environmental case files or the PE's work product",
      "Platform governance, audit ledgers, or other professionals' queues",
    ],
    destination: "/lender-desk",
    accent: "#534AB7",
    status: "live",
  },
  {
    role: "attorney",
    title: "Attorney / Counsel",
    who: "Counsel with a verified bar credential, or presenting legal process on a matter.",
    sees: [
      "The specific matter or document set your credential or legal process covers",
      "Consent, disclosure and signature language with its version history",
      "The evidence trail for anything you are asked to opine on",
      "Without a standing credential: exactly the records your court order, subpoena or warrant names — nothing beyond them",
    ],
    neverSees: [
      "Borrower financial documents outside your engagement",
      "Other customers' files, or any file without a recorded engagement",
      "Marketing, revenue, or operator-only surfaces",
    ],
    destination: "/governance",
    accent: "#185FA5",
    status: "building",
    buildingNote:
      "The counsel surface described above is being built. It does not exist yet, and this lane " +
      "previously opened an internal operator console instead — which is not what is described " +
      "here and not something outside counsel should ever see. Rather than send you somewhere " +
      "wrong, the door is closed until the matter-scoped surface is real. To reach a matter now, " +
      "contact the file's broker directly, or serve legal process through the route below.",
  },
  {
    role: "auditor",
    title: "Auditor / Examiner",
    who: "An auditor, examiner, or regulator whose commission we verify with the issuing agency.",
    sees: [
      "The audit ledger and replay records — what happened, when, and by whom",
      "Governance evidence, classification and version lineage",
      "Access logs for every governed document read",
    ],
    neverSees: [
      "Document contents — the audit trail proves handling, it does not expose files",
      "Customer PII beyond what an access record necessarily contains",
      "Any ability to change a record; auditor access is read-only by design",
    ],
    destination: "/audit-replay",
    accent: "#0F6E56",
    status: "building",
    buildingNote:
      "The examination surface described above is being built. This lane previously opened an " +
      "internal replay console that states on its own face that external verification claims are " +
      "not made from it — it offers an examiner nothing to request, nothing to sample, and nothing " +
      "to independently verify. An examiner needs to make a scoped request, receive a manifest of " +
      "responsive records, check hashes without having to trust our screen, and take a signed " +
      "export away. None of that exists yet, so the door stays closed rather than wasting your time.",
  },
  {
    role: "sponsor",
    title: "Sponsor / Institutional Partner",
    who: "An institution or program sponsor with a recorded participation agreement.",
    sees: [
      "Aggregate program activity for your own participation",
      "Documents explicitly shared with your institution",
    ],
    neverSees: [
      "Individual borrower files that were not shared with you",
      "Any demographic data — none is collected, ever (Section 1071 firewall)",
    ],
    destination: "/sponsor",
    accent: "#993556",
    status: "building",
    buildingNote:
      "The partner surface described above is being built. Like the counsel and examiner lanes, " +
      "this one pointed at an internal operator console rather than a partner-scoped view of your " +
      "own participation. It stays closed until the scoped surface exists.",
  },
];

const card = {
  border: "1px solid #d7deea",
  borderRadius: 14,
  background: "#fff",
  padding: "18px 20px",
  display: "grid",
  gap: 10,
} as const;

export default function ProfessionalAccessPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f6f8fb",
        padding: "40px 20px 64px",
        fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
      }}
    >
      <div style={{ maxWidth: 780, margin: "0 auto", display: "grid", gap: 18 }}>
        <header style={{ display: "grid", gap: 8 }}>
          <span style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: GOLD }}>
            Professional Access
          </span>
          <h1 style={{ margin: 0, fontSize: 30, color: NAVY, fontFamily: "Georgia,serif", letterSpacing: "-0.01em" }}>
            Sign in to the file you are working
          </h1>
          <p style={{ margin: 0, fontSize: 15, color: MUTED, lineHeight: 1.65 }}>
            Lenders, attorneys, auditors and institutional partners each see a different
            slice of a Furlong file — never the whole thing. Pick your lane below to see
            exactly what that role can and cannot open, then sign in.
          </p>
        </header>

        <div
          style={{
            border: "1px solid #e2d7bd",
            borderLeft: `4px solid ${GOLD}`,
            background: "#faf6ec",
            borderRadius: 12,
            padding: "12px 16px",
            fontSize: 13,
            color: "#5b4a22",
            lineHeight: 1.6,
          }}
        >
          <strong style={{ color: INK }}>Access is verified, not asserted.</strong> Choosing
          a lane here does not grant it. Standing access requires a credential we verify
          against the official issuing directory — your bar, commission, or agency — recorded
          with its source, standing and expiry. Without one, an attorney or agency may still
          proceed by presenting legal process (court order, subpoena, warrant, or agency
          demand): that opens only the specific records the process names, and nothing else.
        </div>

        {LANES.map((lane) => (
          <section key={lane.role} style={{ ...card, borderLeft: `4px solid ${lane.accent}` }}>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: "4px 12px" }}>
              <h2 style={{ margin: 0, fontSize: 19, color: NAVY, fontFamily: "Georgia,serif" }}>{lane.title}</h2>
              <span style={{ fontSize: 12.5, color: MUTED }}>{lane.who}</span>
            </div>

            <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
              <div>
                <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "#127a4f" }}>
                  You can see
                </span>
                <ul style={{ margin: "6px 0 0", paddingLeft: 18, fontSize: 13, color: INK, lineHeight: 1.6 }}>
                  {lane.sees.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </div>
              <div>
                <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "#9a3412" }}>
                  You never see
                </span>
                <ul style={{ margin: "6px 0 0", paddingLeft: 18, fontSize: 13, color: INK, lineHeight: 1.6 }}>
                  {lane.neverSees.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </div>
            </div>

            {lane.status === "live" ? (
              <Link
                href={lane.destination}
                style={{
                  justifySelf: "start",
                  borderRadius: 10,
                  padding: "10px 18px",
                  fontSize: 14,
                  fontWeight: 800,
                  color: "#fff",
                  background: lane.accent,
                  textDecoration: "none",
                }}
              >
                Sign in as {lane.title.split(" /")[0].toLowerCase()} →
              </Link>
            ) : (
              /* A door that would open onto the wrong room is worse than no
                 door. State the absence plainly — a professional can act on
                 "not built yet, here is who to call"; they cannot act on a
                 sign-in button that lands them somewhere they should not be. */
              <div
                role="note"
                style={{
                  justifySelf: "stretch",
                  borderRadius: 10,
                  padding: "12px 14px",
                  border: "1px solid #D7B85A",
                  background: "#FFF9E8",
                  display: "grid",
                  gap: 5,
                }}
              >
                <strong style={{ fontSize: 13, color: "#8F6E1F" }}>
                  Not open yet — this lane is being built
                </strong>
                <span style={{ fontSize: 12.5, color: INK, lineHeight: 1.6 }}>{lane.buildingNote}</span>
              </div>
            )}
          </section>
        ))}

        <p style={{ margin: 0, fontSize: 12.5, color: "#708997", lineHeight: 1.6 }}>
          Every document opened through any of these lanes is recorded — who opened it, when,
          and which file it belonged to. That record is the point: it is what lets a customer
          be told the truth about who has seen their information. Need access and don&apos;t
          have it? Contact the Furlong operator who invited you.
        </p>
      </div>
    </main>
  );
}
