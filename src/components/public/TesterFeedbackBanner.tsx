/**
 * TesterFeedbackBanner — staging tester rail (P3, founder direction
 * 2026-07-17: testers give feedback WHILE the owner audits and fixes).
 *
 * Renders ONLY when FURLONG_TESTER_FEEDBACK_EMAIL is set (a staging env —
 * never configured in production). Stamps every page with the exact build
 * (Cloud Run's K_REVISION) so feedback is always tied to the revision it
 * describes, and gives a one-click mailto with the revision prefilled.
 * Read-only: no new state-writing surface, nothing stored server-side.
 */

export function TesterFeedbackBanner() {
  const email = process.env.FURLONG_TESTER_FEEDBACK_EMAIL;
  if (!email) return null;
  const revision = process.env.K_REVISION ?? "local-dev";
  const subject = encodeURIComponent(`Furlong staging feedback (build ${revision})`);
  const body = encodeURIComponent(
    `Build: ${revision}\nPage: (paste the URL you were on)\nWhat happened / what you expected:\n`
  );
  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        alignItems: "center",
        justifyContent: "center",
        flexWrap: "wrap",
        padding: "6px 14px",
        background: "#0c2233",
        borderBottom: "1px solid #2c5876",
        fontSize: 12,
        color: "#b7ccd9",
      }}
    >
      <span style={{ fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "#d4b06a" }}>
        Staging test build
      </span>
      <span style={{ fontFamily: "ui-monospace, monospace" }}>{revision}</span>
      <a
        href={`mailto:${email}?subject=${subject}&body=${body}`}
        style={{ color: "#7fc4b8", fontWeight: 700, textDecoration: "underline", textUnderlineOffset: 2 }}
      >
        Send feedback on this build
      </a>
    </div>
  );
}
