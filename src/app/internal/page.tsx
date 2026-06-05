import Link from "next/link";

/**
 * /internal — Operator / module console index (INTERNAL_ONLY).
 *
 * Relocated from the root route in Build 45 when `/` became the public
 * customer homepage. This is an internal operator surface: a directory of the
 * governed module surfaces. It is NOT a customer page and carries a visible
 * internal-use-only banner. The public homepage is `/`; the Public Alpha
 * customer portal is `/portal/borrower`.
 */

const portalSurfaces = [
  {
    href: "/operator-demo",
    label: "Operator Demo Handoff",
    status: "Post-completion walkthrough",
    runtime: "seeded demo case, review order, active production blocks",
  },
  {
    href: "/portal/borrower",
    label: "Borrower Portal",
    status: "Portable borrower verticals",
    runtime:
      "applications, documents, notices, reports, data rights, safe status language",
  },
  {
    href: "/lender",
    label: "Lender Portal",
    status: "Portable lender verticals",
    runtime:
      "dashboard, applications, overlays, evidence, no commitment or underwriting claim",
  },
  {
    href: "/sponsor",
    label: "Sponsor Portal",
    status: "Portable sponsor verticals",
    runtime:
      "dashboard, readiness, advisory reports, no sponsor commitment or production promotion",
  },
  {
    href: "/governance",
    label: "Governance Operations",
    status: "Module 01 active",
    runtime: "admin reads, audit posture, content claims, live-action holds",
  },
  {
    href: "/operator-queue",
    label: "Operator Work Queue",
    status: "Module 02 active",
    runtime: "queue review, assignment posture, escalation posture",
  },
  {
    href: "/applications",
    label: "Application Operations",
    status: "Module 03 active",
    runtime: "application records, property scope, related review posture",
  },
  {
    href: "/documents",
    label: "Document Intake",
    status: "Module 04 active",
    runtime: "metadata review, storage handoff intent, raw content blocked",
  },
  {
    href: "/reviews",
    label: "Human Review",
    status: "Module 05 active",
    runtime: "human review workflows, transition gates, notice boundary",
  },
  {
    href: "/rules",
    label: "Rule and Overlay Evaluation",
    status: "Module 06 active",
    runtime: "advisory rule output, overlay posture, human review boundary",
  },
  {
    href: "/decisions",
    label: "Decision Finalization Controls",
    status: "Module 07 active",
    runtime: "final-action gate records, disclosure posture, notice boundary",
  },
  {
    href: "/notices",
    label: "Notice Lifecycle",
    status: "Module 08 active",
    runtime: "notice packets, provider controls, receipts, exception posture",
  },
  {
    href: "/audit-replay",
    label: "Audit Ledger and Replay",
    status: "Module 09 active",
    runtime: "bounded ledger reads, replay checks, evidence posture",
  },
  {
    href: "/connectors",
    label: "Connector Certification",
    status: "Module 10 active",
    runtime: "source authority, adapter review, execution controls",
  },
  {
    href: "/partners",
    label: "Partner Workflow Coordination",
    status: "Module 11 active",
    runtime: "lender and sponsor coordination, diligence, certification posture",
  },
  {
    href: "/billing",
    label: "Billing and Payment Controls",
    status: "Module 12 active",
    runtime: "billing events, payment connector review, no live capture",
  },
  {
    href: "/reports",
    label: "Reports and Advisory Export",
    status: "Module 13 active",
    runtime: "advisory reports, export posture, human review boundary",
  },
  {
    href: "/promotion",
    label: "Live Action and Sovereign Gate",
    status: "Module 14 active",
    runtime: "readiness review, sovereign gateway posture, live-action holds",
  },
  {
    href: "/case-command",
    label: "Unified Case Command",
    status: "Module 15 active",
    runtime: "cross-module case posture and links across modules 02-14",
  },
  {
    href: "/evidence-packets",
    label: "Governance Evidence Packet",
    status: "Module 16 active",
    runtime: "evidence compilation, advisory summaries, audit packet posture",
  },
  {
    href: "/source-ingestion",
    label: "Credentialed Source Ingestion",
    status: "Module 17 active",
    runtime: "credentialed pre-session review, source authority, no external request",
  },
  {
    href: "/exception-remediation",
    label: "Exception Remediation",
    status: "Module 18 active",
    runtime: "cross-module remediation, recovery posture, runbook follow-through",
  },
  {
    href: "/data-rights",
    label: "Borrower Data Rights",
    status: "Module 19 active",
    runtime: "borrower review, export, transport, audit, machine-readable prep",
  },
  {
    href: "/module-readiness",
    label: "Module Readiness Control Tower",
    status: "Module 20 active",
    runtime: "whole-system interoperability across modules 01-19",
  },
  {
    href: "/onboarding",
    label: "Borrower Onboarding",
    status: "Governed intake active",
    runtime: "runtime guard, classification, replay, observability",
  },
  {
    href: "/portfolio",
    label: "Portfolio Ranking",
    status: "Governed ranking active",
    runtime: "ranking envelope, classification, not-final-credit-decision",
  },
];

export default function InternalConsolePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        padding: 24,
        fontFamily: "Arial, sans-serif",
        background: "#f8fafc",
        color: "#111827",
      }}
    >
      <div
        style={{
          display: "grid",
          gap: 24,
          maxWidth: 1080,
          margin: "0 auto",
        }}
      >
        <aside
          role="note"
          style={{
            border: "2px solid #b45309",
            background: "#fffbeb",
            color: "#7c2d12",
            borderRadius: 8,
            padding: "12px 16px",
            fontWeight: 600,
            lineHeight: 1.5,
          }}
        >
          INTERNAL USE ONLY — operator console. This is NOT a customer page. The
          public homepage is <code>/</code>; the Public Alpha customer portal is{" "}
          <code>/portal/borrower</code>.
        </aside>

        <header
          style={{
            display: "grid",
            gap: 8,
            borderBottom: "1px solid #d0d7de",
            paddingBottom: 18,
          }}
        >
          <p style={{ margin: 0, color: "#475569", fontSize: 14 }}>
            Ares Farms Webportal Build
          </p>
          <h1 style={{ margin: 0, fontSize: 34 }}>Governed Operations Console</h1>
          <p style={{ margin: 0, maxWidth: 760, lineHeight: 1.5 }}>
            Runtime surfaces are being stabilized under the Master Volume
            protocol before final scoring, lending reliance, or regulated
            workflow activation.
          </p>
        </header>

        <section style={{ display: "grid", gap: 12 }}>
          <h2 style={{ margin: 0, fontSize: 22 }}>Active Surfaces</h2>
          <div
            style={{
              display: "grid",
              gap: 12,
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            }}
          >
            {portalSurfaces.map((surface) => (
              <Link
                key={surface.href}
                href={surface.href}
                style={{
                  display: "grid",
                  gap: 8,
                  padding: 16,
                  border: "1px solid #d0d7de",
                  borderRadius: 8,
                  background: "#ffffff",
                  color: "inherit",
                  textDecoration: "none",
                }}
              >
                <strong style={{ fontSize: 18 }}>{surface.label}</strong>
                <span>{surface.status}</span>
                <span style={{ color: "#475569", lineHeight: 1.4 }}>
                  {surface.runtime}
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section
          style={{
            display: "grid",
            gap: 12,
            padding: 16,
            border: "1px solid #d0d7de",
            borderRadius: 8,
            background: "#ffffff",
          }}
        >
          <h2 style={{ margin: 0, fontSize: 22 }}>Governance Checkpoint</h2>
          <dl
            style={{
              display: "grid",
              gridTemplateColumns: "240px 1fr",
              gap: 8,
              margin: 0,
            }}
          >
            <dt>Build Protocol</dt>
            <dd>Master Volume governed</dd>

            <dt>Replacement Rule</dt>
            <dd>Full-file replacements only</dd>

            <dt>Backend Runtime</dt>
            <dd>Guarded, versioned, classified, observable, replay-referenced</dd>

            <dt>Decision Reliance</dt>
            <dd>Human review required before regulated reliance</dd>
          </dl>
        </section>

        <section
          style={{
            display: "grid",
            gap: 8,
            padding: 16,
            border: "1px solid #d0d7de",
            borderRadius: 8,
            background: "#ffffff",
          }}
        >
          <h2 style={{ margin: 0, fontSize: 22 }}>Compliance Notice</h2>
          <p style={{ margin: 0, lineHeight: 1.5 }}>
            AI-GENERATED INFORMATION ONLY — NOT AN OFFICIAL REPORT — NOT VALID
            FOR PERMITTING, FINANCING, LEGAL, OR REGULATORY USE.
          </p>
        </section>
      </div>
    </main>
  );
}
