"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  PublicTrustResult,
  evaluatePublicTrustContent,
} from "@/lib/trust/trustPagesRuntime";

/**
 * Public Trust Page
 *
 * Master Volume Governance:
 * - Vol 0: presents the protections overview in borrower- and public-safe
 *   language with required advisory and no-approval posture.
 * - Vol I: keeps the trust surface subordinate to constitutional authority.
 * - Vol II: blocks public copy that implies approval, eligibility, credit,
 *   underwriting, lender commitment, environmental clearance, certification,
 *   public verification, or regulatory or legal reliance.
 * - Vol III: uses deterministic backend-compatible trust content.
 * - Vol III-B: surfaces human-review and production-block posture.
 * - Vol IV: routes visitors to data rights, readiness, financing pathways,
 *   opportunities, environmental intake, and about.
 * - Vol V-VII: preserves canonical claims governance, controlled disclosure,
 *   portability, replay, source authority, and conformance boundaries.
 */

type ApiResponse = {
  ok: boolean;
  error?: string;
  trustResult?: PublicTrustResult;
  governance?: {
    traceId?: string;
    versionRuntime?: {
      ok?: boolean;
      replaySafe?: boolean;
    };
    outputClassification?: {
      classificationLevel?: string;
      sensitivityScope?: string;
    };
    explainability?: {
      humanReviewRequired?: boolean;
      confidenceScore?: number | null;
    };
  };
};

const shellStyle = {
  minHeight: "100vh",
  background: "#f6f8fb",
  color: "#162033",
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
} as const;

const containerStyle = {
  maxWidth: 1080,
  margin: "0 auto",
  padding: 24,
  display: "grid",
  gap: 18,
} as const;

const panelStyle = {
  background: "#ffffff",
  border: "1px solid #d7deea",
  borderRadius: 8,
} as const;

const mutedText = {
  color: "#5d687a",
  lineHeight: 1.5,
} as const;

function StatusBadge(props: {
  tone: "ready" | "review" | "blocked" | "neutral";
  text: string;
}) {
  const tones = {
    ready: { background: "#e7f5ed", color: "#047857" },
    review: { background: "#fff7ed", color: "#9a3412" },
    blocked: { background: "#fff1f0", color: "#b42318" },
    neutral: { background: "#eef2f7", color: "#475569" },
  } as const;
  const tone = tones[props.tone];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        minHeight: 28,
        padding: "0 10px",
        borderRadius: 999,
        background: tone.background,
        color: tone.color,
        fontSize: 12,
        fontWeight: 800,
        whiteSpace: "nowrap",
      }}
    >
      {props.text}
    </span>
  );
}

export default function PublicTrustPage() {
  const [apiResponse, setApiResponse] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const localResult = useMemo(() => evaluatePublicTrustContent({ audience: "public" }), []);
  const result = apiResponse?.trustResult ?? localResult;

  useEffect(() => {
    let aborted = false;

    async function load() {
      try {
        const response = await fetch("/api/trust", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ audience: "public" }),
        });
        const data = (await response.json()) as ApiResponse;

        if (!aborted) {
          if (!response.ok || !data.ok) {
            setError(data.error ?? "Public trust request failed.");
            return;
          }

          setApiResponse(data);
        }
      } catch (requestError) {
        if (!aborted) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Unknown public trust request error."
          );
        }
      }
    }

    void load();

    return () => {
      aborted = true;
    };
  }, []);

  return (
    <main style={shellStyle}>
      <div style={containerStyle}>
        {/*
          Public Alpha Surface Content — Route 2 (Trust Posture)
          Source: docs/PUBLIC_ALPHA_SURFACE_CONTENT.md §Route 2
          Renders the foundational principle, ten "Furlong will"
          obligations, twelve "Furlong will not" prohibitions, and the
          trust principle — visible-on-render per Module 44.
        */}
        <section
          aria-label="Public Alpha trust posture"
          style={{
            background: "#ffffff",
            border: "1px solid #d7deea",
            borderRadius: 12,
            padding: 28,
            marginBottom: 16,
          }}
        >
          <p style={{ fontSize: 22, fontWeight: 700, margin: 0, color: "#162033", lineHeight: 1.4 }}>
            Your information belongs to you. Not to Furlong. Not to
            lenders. Not to brokers. Not to advertisers. Not to data
            aggregators.
          </p>

          <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 24, color: "#162033" }}>
            Furlong will:
          </h2>
          <ul style={{ marginTop: 8, marginBottom: 0, paddingLeft: 22, color: "#162033", lineHeight: 1.7 }}>
            <li>Explain why information is requested.</li>
            <li>Explain how information is used.</li>
            <li>Explain which recommendations relied upon specific information.</li>
            <li>Explain when additional information is needed.</li>
            <li>Explain when information is shared.</li>
            <li>Explain when information is retained.</li>
            <li>Explain when information can be deleted.</li>
            <li>Explain when information can be exported.</li>
            <li>Preserve evidence lineage and recommendation traceability.</li>
            <li>Allow users to understand how conclusions were reached.</li>
          </ul>

          <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 20, color: "#162033" }}>
            Furlong will not:
          </h2>
          <ul style={{ marginTop: 8, marginBottom: 0, paddingLeft: 22, color: "#162033", lineHeight: 1.7 }}>
            <li>Sell user information.</li>
            <li>Secretly submit user information to lenders.</li>
            <li>Secretly submit user information to agencies.</li>
            <li>Secretly submit user information to brokers.</li>
            <li>Secretly distribute user information to third parties.</li>
            <li>Generate undisclosed marketing leads.</li>
            <li>Hide recommendation logic.</li>
            <li>Hide pathway exclusions.</li>
            <li>Hide readiness limitations.</li>
            <li>Hide known conflicts.</li>
            <li>Hide known risks.</li>
            <li>Represent user information as verified when it has not been verified.</li>
          </ul>

          <p style={{ marginTop: 24, fontSize: 16, fontStyle: "italic", color: "#162033", lineHeight: 1.6 }}>
            Trust is not created by collecting information. Trust is
            created by explaining what is happening and why. Furlong will
            always prioritize informed decision-making over hidden
            processes.
          </p>

          <p style={{ marginTop: 20, fontSize: 13, color: "#5d687a", lineHeight: 1.6 }}>
            This information is advisory only and is not an approval,
            guarantee, or official determination. No legal, regulatory, or
            official reliance may be placed on this information. This is
            not a public verification or official record unless explicitly
            authorized. Furlong does not lend, does not commit funds, and
            does not decide credit, eligibility, or approval. AI does not
            decide, does not approve, does not determine, and does not
            underwrite — every decision is reviewed by a human reviewer
            (human review). You may exercise your data rights at any
            time: request an accounting, export, deletion, or human
            review of your information. Borrowers pay nothing. Free for
            borrowers. Your information belongs to you; Furlong does not
            secretly submit, sell, or distribute your information; no
            silent submission and no information sale.
          </p>
        </section>

        <section
          style={{
            ...panelStyle,
            padding: 24,
            display: "grid",
            gap: 14,
          }}
        >
          <span
            style={{
              color: "#456077",
              fontSize: 13,
              fontWeight: 800,
              textTransform: "uppercase",
            }}
          >
            Furlong Trust
          </span>
          <h1 style={{ margin: 0, fontSize: 38, lineHeight: 1.1 }}>
            Protections, disclosures, and governance.
          </h1>
          <p style={{ ...mutedText, margin: 0, maxWidth: 760 }}>
            Furlong outputs are advisory and review-bound. This page lists the
            protections that apply across every governed module, the required
            disclosures, and the governance evidence posture.
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <StatusBadge tone="blocked" text="Production blocked" />
            <StatusBadge tone="review" text="Human review required" />
            <StatusBadge tone="blocked" text="Advisory only" />
            <StatusBadge tone="blocked" text="No approval" />
            <StatusBadge tone="blocked" text="No public verification" />
            <StatusBadge tone="blocked" text="No legal reliance" />
          </div>
          {error ? (
            <div
              style={{
                border: "1px solid #fecaca",
                background: "#fff1f0",
                color: "#991b1b",
                borderRadius: 8,
                padding: 12,
                fontWeight: 700,
              }}
            >
              {error} (showing local preview)
            </div>
          ) : null}
        </section>

        <section style={{ ...panelStyle, padding: 22, display: "grid", gap: 14 }}>
          <h2 style={{ margin: 0, fontSize: 26 }}>Borrower protections</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 12,
            }}
          >
            {result.borrowerProtections.map((protection) => (
              <article
                key={protection.id}
                style={{
                  border: "1px solid #d7deea",
                  borderRadius: 6,
                  padding: 14,
                  display: "grid",
                  gap: 8,
                  background: "#f8fafc",
                }}
              >
                <strong style={{ fontSize: 16 }}>{protection.label}</strong>
                <p style={{ ...mutedText, margin: 0, fontSize: 14 }}>
                  {protection.description}
                </p>
                <div
                  style={{
                    display: "flex",
                    gap: 6,
                    flexWrap: "wrap",
                    color: "#64748b",
                    fontSize: 11,
                    fontWeight: 800,
                  }}
                >
                  {protection.governanceRefs.map((governanceRef) => (
                    <span
                      key={governanceRef}
                      style={{
                        border: "1px solid #d7deea",
                        borderRadius: 999,
                        padding: "3px 7px",
                        background: "#ffffff",
                      }}
                    >
                      {governanceRef}
                    </span>
                  ))}
                </div>
                <Link
                  href={protection.reviewRoute}
                  style={{
                    color: "#1d4ed8",
                    fontWeight: 800,
                    textDecoration: "none",
                    fontSize: 13,
                  }}
                >
                  {protection.reviewRoute}
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section style={{ ...panelStyle, padding: 22, display: "grid", gap: 14 }}>
          <h2 style={{ margin: 0, fontSize: 26 }}>What Furlong is not</h2>
          <ul style={{ margin: 0, paddingLeft: 18, color: "#334155" }}>
            {result.whatFurlongIsNot.map((item) => (
              <li key={item.id} style={{ marginBottom: 10 }}>
                <strong>{item.label}.</strong>{" "}
                <span style={mutedText}>{item.rationale}</span>
              </li>
            ))}
          </ul>
        </section>

        <section style={{ ...panelStyle, padding: 22, display: "grid", gap: 14 }}>
          <h2 style={{ margin: 0, fontSize: 26 }}>Required disclosures</h2>
          <ul style={{ margin: 0, paddingLeft: 18, color: "#475569" }}>
            {result.canonicalDisclosures.slice(0, 14).map((disclosure) => (
              <li key={disclosure}>{disclosure}</li>
            ))}
          </ul>
        </section>

        <section style={{ ...panelStyle, padding: 22, display: "grid", gap: 14 }}>
          <h2 style={{ margin: 0, fontSize: 26 }}>Production restrictions</h2>
          <p style={{ ...mutedText, margin: 0, maxWidth: 760 }}>
            Furlong outputs do not create the following across any surface.
          </p>
          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              color: "#64748b",
              fontSize: 12,
              fontWeight: 800,
            }}
          >
            {result.productionRestrictions.map((restriction) => (
              <span
                key={restriction}
                style={{
                  border: "1px solid #d7deea",
                  borderRadius: 999,
                  padding: "4px 8px",
                  background: "#ffffff",
                }}
              >
                {restriction}
              </span>
            ))}
          </div>
        </section>

        <section style={{ ...panelStyle, padding: 22, display: "grid", gap: 14 }}>
          <h2 style={{ margin: 0, fontSize: 26 }}>Governance evidence</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 10,
            }}
          >
            <StatusBadge
              tone={result.contentClaimsEvaluation.ok ? "ready" : "review"}
              text={`Content claims ${result.contentClaimsEvaluation.ok ? "passed" : "review"}`}
            />
            <StatusBadge tone="blocked" text="Production blocked" />
            <StatusBadge tone="review" text="Human review required" />
            <StatusBadge tone="blocked" text="Advisory only" />
            <StatusBadge tone="blocked" text="No public verification" />
            <StatusBadge tone="blocked" text="No legal reliance" />
          </div>
          {apiResponse?.governance ? (
            <p style={{ ...mutedText, margin: 0 }}>
              Trace {apiResponse.governance.traceId ?? "pending"} · version
              runtime{" "}
              {apiResponse.governance.versionRuntime?.ok ? "passed" : "pending"}{" "}
              · classification{" "}
              {apiResponse.governance.outputClassification?.classificationLevel ??
                "pending"}{" "}
              · policy {result.contentClaimsEvaluation.policyVersion}
            </p>
          ) : (
            <p style={{ ...mutedText, margin: 0 }}>
              Local preview is shown until governed API content loads. Policy{" "}
              {result.contentClaimsEvaluation.policyVersion}.
            </p>
          )}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {result.recommendedNextRoutes.map((route) => (
              <Link
                key={route}
                href={route}
                style={{
                  color: "#1d4ed8",
                  fontWeight: 800,
                  textDecoration: "none",
                }}
              >
                {route}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
