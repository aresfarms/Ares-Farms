import Link from "next/link";

import type { ScenarioRankingPlan } from "@/lib/intelligence/scenarioRankingPlan";
import {
  PUBLIC_PRODUCTS,
  type PublicProductCode,
} from "@/lib/billing/publicProductCatalog";
import {
  recommendPropertyReportLevel,
  type PropertyReportRecommendationInput,
} from "@/lib/billing/propertyDecisionReportRecommendation";

type Props = Omit<PropertyReportRecommendationInput, "plan"> & {
  plan: ScenarioRankingPlan;
  exactAddress: string | null;
  propertyId: string | null;
};

const money = (cents: number | null) =>
  cents === null
    ? "Not priced"
    : (cents / 100).toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      });

function href(
  code: PublicProductCode,
  exactAddress: string | null,
  propertyId: string | null,
): string | null {
  if (!exactAddress || exactAddress.trim().length < 8) return null;
  const query = new URLSearchParams({
    product: code,
    address: exactAddress.trim(),
  });
  if (propertyId) query.set("propertyId", propertyId);
  return `/purchase?${query.toString()}`;
}

export function PropertyReportOfferPanel(props: Props) {
  const recommendation = recommendPropertyReportLevel({
    plan: props.plan,
    priceKnown: props.priceKnown,
    customerVisionSelected: props.customerVisionSelected,
    activeTransaction: props.activeTransaction,
    materialEvidenceGapCount: props.materialEvidenceGapCount,
    professionalEvidenceRequired: props.professionalEvidenceRequired,
  });
  const propertyReport = PUBLIC_PRODUCTS.focused_property_report;
  const decisionReport = PUBLIC_PRODUCTS.custom_property_analysis;
  const propertyReportHref = href(
    propertyReport.code,
    props.exactAddress,
    props.propertyId,
  );
  const decisionReportHref = href(
    decisionReport.code,
    props.exactAddress,
    props.propertyId,
  );
  const servicesQuery = new URLSearchParams();
  if (props.exactAddress) {
    servicesQuery.set("address", props.exactAddress);
  }
  const servicesHref =
    "/professional-services" +
    (servicesQuery.size ? `?${servicesQuery.toString()}` : "");

  const card = {
    display: "grid",
    gap: 8,
    alignContent: "start",
    border: "1px solid #d7deea",
    borderRadius: 12,
    background: "#fff",
    padding: "15px",
  } as const;
  const linkStyle = {
    display: "inline-flex",
    justifyContent: "center",
    padding: "10px 13px",
    borderRadius: 8,
    background: "#0f766e",
    color: "#fff",
    fontWeight: 800,
    fontSize: 12.5,
    textDecoration: "none",
  } as const;

  return (
    <section
      aria-labelledby="report-path-heading"
      data-testid="property-report-offer"
      style={{
        display: "grid",
        gap: 14,
        border: "1px solid #c9d7dc",
        borderRadius: 16,
        background: "#f8fbfb",
        padding: 18,
      }}
    >
      <div style={{ display: "grid", gap: 5 }}>
        <span
          style={{
            color: "#0f766e",
            fontSize: 10.5,
            fontWeight: 850,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          Pay only for the next answer
        </span>
        <h2 id="report-path-heading" style={{ margin: 0, fontSize: 22 }}>
          {recommendation.headline}
        </h2>
        <p style={{ margin: 0, color: "#4d596d", lineHeight: 1.55 }}>
          {recommendation.explanation}
        </p>
        {recommendation.reasons.length ? (
          <ul style={{ margin: 0, paddingLeft: 20, color: "#4d596d" }}>
            {recommendation.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        ) : null}
      </div>

      <div
        style={{
          display: "grid",
          gap: 10,
          gridTemplateColumns: "repeat(auto-fit, minmax(225px, 1fr))",
        }}
      >
        <article style={card}>
          <strong>Furlong Property Snapshot</strong>
          <span style={{ color: "#0f766e", fontWeight: 850 }}>$0</span>
          <span style={{ color: "#526074", fontSize: 12.5 }}>
            Property facts, material warnings, evidence coverage, and the next
            question to resolve.
          </span>
          <span style={{ color: "#0f766e", fontSize: 11.5, fontWeight: 800 }}>
            You are viewing this now.
          </span>
        </article>

        <article
          style={{
            ...card,
            border:
              recommendation.level === "PROPERTY_REPORT"
                ? "2px solid #0f766e"
                : card.border,
          }}
        >
          <strong>{propertyReport.publicName}</strong>
          <span style={{ color: "#0f766e", fontWeight: 850 }}>
            {money(propertyReport.unitAmountCents)} one time
          </span>
          <span style={{ color: "#526074", fontSize: 12.5 }}>
            Immediate automated property, enterprise, economics, financing,
            source, assumption, and missing-evidence report.
          </span>
          {recommendation.level === "PROPERTY_REPORT" ? (
            <span style={{ color: "#0f766e", fontSize: 11.5, fontWeight: 800 }}>
              Recommended next level
            </span>
          ) : null}
          {propertyReportHref &&
          ["PROPERTY_REPORT", "DECISION_REPORT"].includes(
            recommendation.level,
          ) ? (
            <Link href={propertyReportHref} style={linkStyle}>
              Review exact scope and availability
            </Link>
          ) : null}
        </article>

        <article
          style={{
            ...card,
            border:
              recommendation.level === "DECISION_REPORT"
                ? "2px solid #9c6b1b"
                : card.border,
          }}
        >
          <strong>{decisionReport.publicName}</strong>
          <span style={{ color: "#9c6b1b", fontWeight: 850 }}>
            {money(decisionReport.unitAmountCents)} base scope
          </span>
          <span style={{ color: "#526074", fontSize: 12.5 }}>
            Human review, ranked scenarios, acquisition boundaries,
            sensitivities, projections, and an explicit action verdict.
          </span>
          {recommendation.doNotBuyDecisionReportYet ? (
            <strong style={{ color: "#7a5a10", fontSize: 12 }}>
              Do not buy this report yet.
            </strong>
          ) : decisionReportHref ? (
            <Link href={decisionReportHref} style={linkStyle}>
              Review exact scope and availability
            </Link>
          ) : null}
          <span style={{ color: "#526074", fontSize: 11.5 }}>
            A completed $49 Property Report may receive one $49 upgrade credit
            for this same property within 30 days; eligibility is confirmed
            before payment.
          </span>
        </article>
      </div>

      <p style={{ margin: 0, color: "#526074", fontSize: 11.5 }}>
        These are proposed launch prices. Paid checkout stays closed until
        pricing, artifact delivery, payment, refund, dispute, and access tests
        pass for the exact product.
      </p>

      <div
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <Link
          href={servicesHref}
          style={{ ...linkStyle, background: "#34495e" }}
        >
          Request separately scoped professional services
        </Link>
        <span style={{ color: "#526074", fontSize: 11.5, lineHeight: 1.5 }}>
          Phase I–III, remediation, site supervision, engineering consulting,
          field/lab work, and other professional services are quoted separately.
          Furlong does not offer stamped structural or electrical plans.
        </span>
      </div>
    </section>
  );
}
