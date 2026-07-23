"use client";

import Link from "next/link";

import type { PropertyProfileId } from "@/lib/property/propertyProfile";
import type { PreliminaryCapitalPlan, PlanningRange } from "@/lib/intelligence/preliminaryCapitalPlan";
import type { CollateralEquityPlan } from "@/lib/intelligence/collateralEquityPlan";
import type { MarketComparablePlan } from "@/lib/intelligence/marketComparablePlan";
import type { ScenarioRankingPlan } from "@/lib/intelligence/scenarioRankingPlan";
import type { TransactionTimelinePlan } from "@/lib/intelligence/transactionTimelinePlan";
import type { FinancialCapacityPlan } from "@/lib/intelligence/financialCapacityPlan";
import type { ExecutableScenarioRankingPlan } from "@/lib/intelligence/executableScenarioRankingPlan";
import type { DecisionSynthesisPlan } from "@/lib/intelligence/decisionSynthesisPlan";
import type { RecommendationEvidenceLedger } from "@/lib/intelligence/recommendationEvidenceLedger";
import type { HumanDecisionAssignmentPlan } from "@/lib/intelligence/humanDecisionAssignmentPlan";
import type { DecisionResolutionPlan } from "@/lib/intelligence/decisionResolutionPlan";
import type { RecommendationFinalityPlan } from "@/lib/intelligence/recommendationFinalityPlan";
import type { RecommendationReleaseRecord } from "@/lib/intelligence/recommendationReleaseRecord";

export interface BestCourseTrack {
  title: string;
  summary: string;
  posture: "leading" | "alternative" | "conditional";
}

function tracksFor(profileId: PropertyProfileId): BestCourseTrack[] {
  if (profileId === "farm") {
    return [
      { title: "Operating agricultural use", summary: "Test the land, structures, markets, competitors, equipment, insurance, and full operating margin together.", posture: "leading" },
      { title: "Residential plus leased or passive acreage", summary: "Test whether keeping the residence and leasing usable ground creates a safer carrying structure.", posture: "alternative" },
      { title: "Specialty or direct-market enterprise", summary: "Test flowers, produce, equestrian, agritourism, or another high-value use against real trade-area demand.", posture: "conditional" },
    ];
  }
  if (profileId === "commercial" || profileId === "hospitality" || profileId === "mobile-home-park") {
    return [
      { title: "Owner-operated commercial use", summary: "Test whether the property and business can support acquisition, buildout, working capital, insurance, and debt service.", posture: "leading" },
      { title: "Income-producing property", summary: "Test rent, occupancy, operating costs, comparable sales, cap-rate support, and lender treatment.", posture: "alternative" },
      { title: "Adaptive or mixed use", summary: "Test whether phased redevelopment or a blended use produces a stronger risk-adjusted result.", posture: "conditional" },
    ];
  }
  if (profileId === "land") {
    return [
      { title: "Productive land use", summary: "Test agriculture, grazing, forestry, conservation, energy, or land leasing against the parcel's actual constraints.", posture: "leading" },
      { title: "Residential or homestead use", summary: "Test access, utilities, wastewater, construction cost, financing, and long-term carrying cost.", posture: "alternative" },
      { title: "Hold, lease, or walk away", summary: "Test whether passive use or no purchase is stronger than forcing an expensive development plan.", posture: "conditional" },
    ];
  }
  return [
    { title: "Primary residential use", summary: "Test purchase price, condition, comparable sales, total carrying cost, and long-term replacement needs.", posture: "leading" },
    { title: "Residential plus income or land use", summary: "Test rental, accessory, agricultural, or other lawful secondary income without overstating it.", posture: "alternative" },
    { title: "Renovate, renegotiate, or pass", summary: "Test whether repairs and financing still leave a responsible ownership position.", posture: "conditional" },
  ];
}

function requiresComplexPipeline(profileId: PropertyProfileId): boolean {
  return profileId === "farm" || profileId === "commercial" || profileId === "hospitality" || profileId === "mobile-home-park" || profileId === "land";
}

function requiresPhaseI(profileId: PropertyProfileId): boolean {
  return profileId === "farm" || profileId === "commercial" || profileId === "hospitality" || profileId === "mobile-home-park";
}

export function PropertyBestCoursePanel({
  profileId,
  startingLens,
  deepHref,
  environmentalHref,
  financingHref,
  onDownload,
  downloadBusy,
  capitalPlan,
  collateralPlan,
  marketComparablePlan,
  scenarioRankingPlan,
  transactionTimelinePlan,
  financialCapacityPlan,
  executableScenarioRankingPlan,
  decisionSynthesisPlan,
  recommendationEvidenceLedger,
  humanDecisionAssignmentPlan,
  decisionResolutionPlan,
  recommendationFinalityPlan,
  recommendationReleaseRecord,
}: {
  profileId: PropertyProfileId;
  startingLens?: string | null;
  deepHref: string;
  environmentalHref: string;
  financingHref: string;
  onDownload: () => void;
  downloadBusy: boolean;
  capitalPlan: PreliminaryCapitalPlan;
  collateralPlan: CollateralEquityPlan;
  marketComparablePlan: MarketComparablePlan;
  scenarioRankingPlan: ScenarioRankingPlan;
  transactionTimelinePlan: TransactionTimelinePlan;
  financialCapacityPlan: FinancialCapacityPlan;
  executableScenarioRankingPlan: ExecutableScenarioRankingPlan;
  decisionSynthesisPlan: DecisionSynthesisPlan;
  recommendationEvidenceLedger: RecommendationEvidenceLedger;
  humanDecisionAssignmentPlan: HumanDecisionAssignmentPlan;
  decisionResolutionPlan: DecisionResolutionPlan;
  recommendationFinalityPlan: RecommendationFinalityPlan;
  recommendationReleaseRecord: RecommendationReleaseRecord;
}) {
  const complex = requiresComplexPipeline(profileId);
  const phaseI = requiresPhaseI(profileId);
  const formatRange = (range: PlanningRange) => {
    if (range.low == null || range.likely == null || range.high == null) return "To be confirmed";
    const money = (value: number) => `$${value.toLocaleString("en-US")}`;
    return `${money(range.low)}–${money(range.high)} · likely ${money(range.likely)}`;
  };

  return (
    <section aria-label="Best realistic course framework" style={{ display: "grid", gap: 16, border: "1px solid #cfd8e6", borderRadius: 16, background: "#ffffff", padding: "20px 20px" }}>
      <div style={{ display: "grid", gap: 6 }}>
        <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: "#0f766e" }}>
          Furlong best-course analysis
        </span>
        <h2 style={{ margin: 0, fontSize: 25, lineHeight: 1.15, color: "#101a2b" }}>
          What is the best realistic course for this property?
        </h2>
        <p style={{ margin: 0, fontSize: 14, color: "#4d596d", lineHeight: 1.65, maxWidth: 900 }}>
          Furlong will rank the strongest uses, explain why, calculate what each course costs, map realistic financing, and say whether the customer should proceed, renegotiate, phase the project, or walk away.
          {startingLens ? ` The ${startingLens.replace(/-/g, " ")} selection is the starting lens, not the conclusion.` : ""}
        </p>
      </div>

      <section aria-label="Governed decision synthesis" style={{ display: "grid", gap: 10, border: "2px solid #0f766e", borderRadius: 14, padding: "16px", background: "#f2fbf8" }}>
        <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "#0f766e" }}>Decision synthesis</span>
        <strong style={{ fontSize: 20, color: "#162033" }}>{decisionSynthesisPlan.headline}</strong>
        <span style={{ fontSize: 12.5, color: "#526074", lineHeight: 1.55 }}>{decisionSynthesisPlan.rationale.join(" ")}</span>
        <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
          <div style={{ border: "1px solid #cfd8e6", borderRadius: 10, padding: 11, background: "#ffffff" }}>
            <strong style={{ display: "block", fontSize: 12.5, color: "#162033", marginBottom: 4 }}>Required conditions</strong>
            <span style={{ fontSize: 11.5, color: "#526074", lineHeight: 1.5 }}>{decisionSynthesisPlan.requiredConditions.join(" · ")}</span>
          </div>
          <div style={{ border: "1px solid #cfd8e6", borderRadius: 10, padding: 11, background: "#ffffff" }}>
            <strong style={{ display: "block", fontSize: 12.5, color: "#162033", marginBottom: 4 }}>Hard stops</strong>
            <span style={{ fontSize: 11.5, color: decisionSynthesisPlan.hardStops.length ? "#8a2d2d" : "#526074", lineHeight: 1.5 }}>{decisionSynthesisPlan.hardStops.length ? decisionSynthesisPlan.hardStops.join(" · ") : "No current hard stop is established from the available evidence."}</span>
          </div>
          <div style={{ border: "1px solid #cfd8e6", borderRadius: 10, padding: 11, background: "#ffffff" }}>
            <strong style={{ display: "block", fontSize: 12.5, color: "#162033", marginBottom: 4 }}>Next action</strong>
            <span style={{ fontSize: 11.5, color: "#526074", lineHeight: 1.5 }}>{decisionSynthesisPlan.nextActions.join(" ")}</span>
          </div>
        </div>
        <span style={{ fontSize: 11.5, color: "#7a5a10", lineHeight: 1.5 }}>{decisionSynthesisPlan.advisoryBoundary}</span>
      </section>

      <section aria-label="Recommendation evidence ledger" style={{ display: "grid", gap: 11, border: "1px solid #cfd8e6", borderRadius: 12, padding: "15px", background: "#fbfcfe" }}>
        <div style={{ display: "grid", gap: 4 }}>
          <strong style={{ fontSize: 15, color: "#162033" }}>Why this recommendation exists</strong>
          <span style={{ fontSize: 12.5, color: "#526074", lineHeight: 1.55 }}>Every recommendation is traceable to verified facts, modeled assumptions, unresolved unknowns, and named human decisions.</span>
        </div>
        <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))" }}>
          {(["verified-fact", "modeled-assumption", "unresolved-unknown", "human-decision"] as const).map((kind) => {
            const items = recommendationEvidenceLedger.entries.filter((entry) => entry.kind === kind);
            return (
              <div key={kind} style={{ display: "grid", gap: 5, border: "1px solid #e1e7ef", borderRadius: 10, padding: 11, background: "#ffffff" }}>
                <strong style={{ fontSize: 12.5, color: "#162033" }}>{kind.replace(/-/g, " ")} · {recommendationEvidenceLedger.counts[kind]}</strong>
                {items.slice(0, 3).map((entry) => <span key={entry.id} style={{ fontSize: 11.5, color: entry.status === "blocking" ? "#9b1c1c" : entry.status === "pending" ? "#7a5a10" : "#526074", lineHeight: 1.45 }}><strong>{entry.label}:</strong> {entry.detail}</span>)}
              </div>
            );
          })}
        </div>
        <span style={{ fontSize: 11.5, color: "#7a5a10", lineHeight: 1.5 }}>{recommendationEvidenceLedger.reviewRule}</span>
      </section>

      <section aria-label="Human decision assignments" style={{ display: "grid", gap: 11, border: "1px solid #d7c58c", borderRadius: 12, padding: "15px", background: "#fffdf6" }}>
        <div style={{ display: "grid", gap: 4 }}>
          <strong style={{ fontSize: 15, color: "#162033" }}>Human decision assignments</strong>
          <span style={{ fontSize: 12.5, color: "#526074", lineHeight: 1.55 }}>{humanDecisionAssignmentPlan.headline} Blocking decisions: {humanDecisionAssignmentPlan.blockingCount}. Awaiting named assignment: {humanDecisionAssignmentPlan.unassignedCount}.</span>
        </div>
        <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))" }}>
          {humanDecisionAssignmentPlan.assignments.map((assignment) => (
            <article key={assignment.id} style={{ display: "grid", gap: 5, border: "1px solid #e6dcc0", borderRadius: 10, padding: 11, background: "#ffffff" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "baseline" }}>
                <strong style={{ fontSize: 12.5, color: "#162033" }}>{assignment.title}</strong>
                <span style={{ fontSize: 11.5, fontWeight: 800, color: assignment.blocksRecommendation ? "#9b1c1c" : "#0f766e" }}>{assignment.dueState.replace(/-/g, " ")}</span>
              </div>
              <span style={{ fontSize: 11.5, color: "#526074", lineHeight: 1.45 }}><strong>Owner:</strong> {assignment.ownerRole}</span>
              <span style={{ fontSize: 11.5, color: "#526074", lineHeight: 1.45 }}><strong>Authority:</strong> {assignment.authority.replace(/-/g, " ")}</span>
              <span style={{ fontSize: 11.5, color: "#526074", lineHeight: 1.45 }}><strong>Evidence:</strong> {assignment.evidenceRequired.join(" · ")}</span>
              <span style={{ fontSize: 11.5, color: assignment.blocksRecommendation ? "#9b1c1c" : "#526074", lineHeight: 1.45 }}><strong>Blocking effect:</strong> {assignment.blockingEffect}</span>
            </article>
          ))}
        </div>
        <span style={{ fontSize: 11.5, color: "#7a5a10", lineHeight: 1.5 }}>{humanDecisionAssignmentPlan.assignmentRule}</span>
      </section>

      <section aria-label="Decision resolution workflow" style={{ display: "grid", gap: 11, border: "1px solid #b9c8dc", borderRadius: 12, padding: "15px", background: "#f8fbff" }}>
        <div style={{ display: "grid", gap: 4 }}>
          <strong style={{ fontSize: 15, color: "#162033" }}>Decision resolution workflow</strong>
          <span style={{ fontSize: 12.5, color: "#526074", lineHeight: 1.55 }}>{decisionResolutionPlan.headline} Cleared gates: {decisionResolutionPlan.clearedGateCount}. Preserved gates: {decisionResolutionPlan.preservedGateCount}. Finality: {decisionResolutionPlan.finalityStatus.replace(/-/g, " ")}.</span>
        </div>
        <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
          {decisionResolutionPlan.records.map((record) => (
            <article key={record.assignmentId} style={{ display: "grid", gap: 5, border: "1px solid #dbe4ef", borderRadius: 10, padding: 11, background: "#ffffff" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "baseline" }}>
                <strong style={{ fontSize: 12.5, color: "#162033" }}>{record.title}</strong>
                <span style={{ fontSize: 11.5, fontWeight: 800, color: record.gateDisposition === "cleared" ? "#0f766e" : "#9b1c1c" }}>{record.gateDisposition}</span>
              </div>
              <span style={{ fontSize: 11.5, color: "#526074", lineHeight: 1.45 }}><strong>Reviewer:</strong> {record.reviewerRole}</span>
              <span style={{ fontSize: 11.5, color: "#526074", lineHeight: 1.45 }}><strong>Authority used:</strong> {record.authorityUsed.replace(/-/g, " ")}</span>
              <span style={{ fontSize: 11.5, color: "#526074", lineHeight: 1.45 }}><strong>Outcome:</strong> {record.outcome.replace(/-/g, " ")}</span>
              <span style={{ fontSize: 11.5, color: "#526074", lineHeight: 1.45 }}><strong>Evidence considered:</strong> {record.evidenceConsidered.length ? record.evidenceConsidered.join(" · ") : "No authorized evidence review has been recorded."}</span>
              <span style={{ fontSize: 11.5, color: record.gateDisposition === "cleared" ? "#526074" : "#9b1c1c", lineHeight: 1.45 }}><strong>Resolution effect:</strong> {record.resolutionEffect}</span>
            </article>
          ))}
        </div>
        <span style={{ fontSize: 11.5, color: "#7a5a10", lineHeight: 1.5 }}>{decisionResolutionPlan.resolutionRule}</span>
      </section>

      <section aria-label="Recommendation finality gate" style={{ display: "grid", gap: 11, border: "1px solid #c8b57a", borderRadius: 12, padding: "15px", background: "#fffdf5" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline", flexWrap: "wrap" }}>
          <div style={{ display: "grid", gap: 4 }}>
            <strong style={{ fontSize: 15, color: "#162033" }}>Recommendation finality gate</strong>
            <span style={{ fontSize: 12.5, color: "#526074", lineHeight: 1.55 }}>{recommendationFinalityPlan.headline}</span>
          </div>
          <strong style={{ fontSize: 13, color: recommendationFinalityPlan.status === "final" ? "#0f766e" : recommendationFinalityPlan.status === "blocked" ? "#9b1c1c" : "#7a5a10", textTransform: "uppercase", letterSpacing: "0.06em" }}>{recommendationFinalityPlan.status.replace(/-/g, " ")}</strong>
        </div>
        <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
          {([
            ["Evidence", recommendationFinalityPlan.evidenceGate],
            ["Assignments", recommendationFinalityPlan.assignmentGate],
            ["Authority", recommendationFinalityPlan.authorityGate],
            ["Conditions", recommendationFinalityPlan.conditionGate],
            ["Resolutions", recommendationFinalityPlan.resolutionGate],
          ] as const).map(([label, state]) => (
            <div key={label} style={{ border: "1px solid #e6dcc0", borderRadius: 9, padding: 10, background: "#ffffff" }}>
              <strong style={{ display: "block", fontSize: 11.5, color: "#162033" }}>{label}</strong>
              <span style={{ fontSize: 11.5, color: state === "satisfied" ? "#0f766e" : "#9b1c1c", fontWeight: 800 }}>{state}</span>
            </div>
          ))}
        </div>
        {recommendationFinalityPlan.blockingReasons.length > 0 && <span style={{ fontSize: 11.5, color: "#9b1c1c", lineHeight: 1.5 }}><strong>Blocking reasons:</strong> {recommendationFinalityPlan.blockingReasons.join(" · ")}</span>}
        {recommendationFinalityPlan.remainingConditions.length > 0 && <span style={{ fontSize: 11.5, color: "#7a5a10", lineHeight: 1.5 }}><strong>Remaining conditions:</strong> {recommendationFinalityPlan.remainingConditions.join(" · ")}</span>}
        <span style={{ fontSize: 11.5, color: "#526074", lineHeight: 1.5 }}>{recommendationFinalityPlan.finalityRule}</span>
      </section>

      <section aria-label="Recommendation release record" style={{ display: "grid", gap: 11, border: "1px solid #9fb8ae", borderRadius: 12, padding: "15px", background: "#f7fcfa" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline", flexWrap: "wrap" }}>
          <div style={{ display: "grid", gap: 4 }}>
            <strong style={{ fontSize: 15, color: "#162033" }}>Recommendation release record</strong>
            <span style={{ fontSize: 12.5, color: "#526074", lineHeight: 1.55 }}>{recommendationReleaseRecord.approvedRecommendationText}</span>
          </div>
          <strong style={{ fontSize: 12.5, color: recommendationReleaseRecord.releaseState === "eligible" ? "#0f766e" : "#9b1c1c", textTransform: "uppercase", letterSpacing: "0.06em" }}>{recommendationReleaseRecord.releaseState}</strong>
        </div>
        <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))" }}>
          <div style={{ border: "1px solid #d9e7e1", borderRadius: 9, padding: 10, background: "#ffffff" }}><strong style={{ display: "block", fontSize: 11.5, color: "#162033" }}>Release ID</strong><span style={{ fontSize: 11.5, color: "#526074" }}>{recommendationReleaseRecord.releaseId}</span></div>
          <div style={{ border: "1px solid #d9e7e1", borderRadius: 9, padding: 10, background: "#ffffff" }}><strong style={{ display: "block", fontSize: 11.5, color: "#162033" }}>Evidence version</strong><span style={{ fontSize: 11.5, color: "#526074" }}>{recommendationReleaseRecord.evidenceVersion}</span></div>
          <div style={{ border: "1px solid #d9e7e1", borderRadius: 9, padding: 10, background: "#ffffff" }}><strong style={{ display: "block", fontSize: 11.5, color: "#162033" }}>Finality</strong><span style={{ fontSize: 11.5, color: "#526074" }}>{recommendationReleaseRecord.finality.replace(/-/g, " ")}</span></div>
          <div style={{ border: "1px solid #d9e7e1", borderRadius: 9, padding: 10, background: "#ffffff" }}><strong style={{ display: "block", fontSize: 11.5, color: "#162033" }}>Reviewer records</strong><span style={{ fontSize: 11.5, color: "#526074" }}>{recommendationReleaseRecord.reviewerResolutions.length}</span></div>
        </div>
        {recommendationReleaseRecord.conditions.length > 0 && <span style={{ fontSize: 11.5, color: "#7a5a10", lineHeight: 1.5 }}><strong>Recorded conditions:</strong> {recommendationReleaseRecord.conditions.join(" · ")}</span>}
        <span style={{ fontSize: 11.5, color: "#526074", lineHeight: 1.5 }}>{recommendationReleaseRecord.advisoryBoundary}</span>
        <span style={{ fontSize: 11.5, color: "#526074", lineHeight: 1.5 }}>{recommendationReleaseRecord.integrityStatement}</span>
      </section>

      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))" }}>
        {scenarioRankingPlan.scenarios.map((scenario, index) => (
          <article key={scenario.id} style={{ display: "grid", gap: 7, border: "1px solid #e1e7ef", borderRadius: 12, padding: "14px 15px", background: index === 0 ? "#f2fbf8" : "#fafbfd" }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: index === 0 ? "#0f766e" : "#607086", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              {index === 0 ? "Rank 1 · leading course" : `Rank ${index + 1}`}
            </span>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline" }}>
              <strong style={{ fontSize: 16, color: "#162033", lineHeight: 1.3 }}>{scenario.title}</strong>
              <strong style={{ fontSize: 16, color: "#0f766e" }}>{scenario.totalScore}/100</strong>
            </div>
            <span style={{ fontSize: 12.5, color: "#526074", lineHeight: 1.55 }}>{scenario.summary}</span>
            <span style={{ fontSize: 11.5, color: "#526074", lineHeight: 1.5 }}>{scenario.reasons.join(" · ")}</span>
            <span style={{ fontSize: 11.5, color: "#7a5a10", fontWeight: 700 }}>{scenario.posture.replace(/-/g, " ")} — {scenario.conditions[0]}</span>
          </article>
        ))}
      </div>
      <div style={{ display: "grid", gap: 5, borderLeft: "3px solid #0f766e", paddingLeft: 12 }}>
        <strong style={{ fontSize: 13, color: "#162033" }}>Current overall posture: {scenarioRankingPlan.overallPosture.replace(/-/g, " ")}</strong>
        <span style={{ fontSize: 11.5, color: "#526074", lineHeight: 1.5 }}>{scenarioRankingPlan.rankingRule}</span>
      </div>

      <section aria-label="Personalized executable scenario ranking" style={{ display: "grid", gap: 11, border: "1px solid #cfd8e6", borderRadius: 12, padding: "15px", background: "#f7fbff" }}>
        <div style={{ display: "grid", gap: 4 }}>
          <strong style={{ fontSize: 15, color: "#162033" }}>Property potential versus customer-executable rank</strong>
          <span style={{ fontSize: 12.5, color: "#526074", lineHeight: 1.55 }}>{executableScenarioRankingPlan.headline} {executableScenarioRankingPlan.explanation}</span>
        </div>
        <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
          {executableScenarioRankingPlan.scenarios.map((scenario) => (
            <div key={scenario.id} style={{ display: "grid", gap: 4, border: "1px solid #e1e7ef", borderRadius: 10, padding: 11, background: "#ffffff" }}>
              <strong style={{ fontSize: 12.5, color: "#162033" }}>{scenario.title}</strong>
              <span style={{ fontSize: 11.5, color: "#526074", lineHeight: 1.5 }}>Property potential: rank {scenario.propertyPotentialRank} · {scenario.propertyPotentialScore}/100</span>
              <span style={{ fontSize: 11.5, color: scenario.executableRank == null ? "#7a5a10" : "#0f766e", fontWeight: 700 }}>Customer-executable: {scenario.executableRank == null ? "locked pending authorization" : `rank ${scenario.executableRank} · ${scenario.executableScore}/100`}</span>
              <span style={{ fontSize: 11.5, color: "#526074", lineHeight: 1.5 }}>{scenario.adjustments[0]}</span>
            </div>
          ))}
        </div>
        <span style={{ fontSize: 11.5, color: "#7a5a10", lineHeight: 1.5 }}>{executableScenarioRankingPlan.decisionRule}</span>
      </section>

      <section aria-label="Contract and transaction timeline compatibility" style={{ display: "grid", gap: 11, border: "1px solid #d9e2ec", borderRadius: 12, padding: "15px", background: "#f8fafc" }}>
        <div style={{ display: "grid", gap: 4 }}>
          <strong style={{ fontSize: 15, color: "#162033" }}>Can the financing close inside the transaction window?</strong>
          <span style={{ fontSize: 12.5, color: "#526074", lineHeight: 1.55 }}>{transactionTimelinePlan.recommendedContractWindow}</span>
        </div>
        <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))" }}>
          <div style={{ border: "1px solid #e1e7ef", borderRadius: 10, padding: 11, background: "#ffffff" }}>
            <strong style={{ display: "block", fontSize: 12.5, color: "#162033", marginBottom: 4 }}>Current compatibility</strong>
            <span style={{ fontSize: 11.5, color: "#526074", lineHeight: 1.5 }}>{transactionTimelinePlan.compatibility === "unknown" ? "Contract deadline and extension rights still need to be entered." : transactionTimelinePlan.compatibility.replace(/-/g, " ")}</span>
          </div>
          <div style={{ border: "1px solid #e1e7ef", borderRadius: 10, padding: 11, background: "#ffffff" }}>
            <strong style={{ display: "block", fontSize: 12.5, color: "#162033", marginBottom: 4 }}>Critical path</strong>
            <span style={{ fontSize: 11.5, color: "#526074", lineHeight: 1.5 }}>{transactionTimelinePlan.criticalPath.join(" → ")}</span>
          </div>
          <div style={{ border: "1px solid #e1e7ef", borderRadius: 10, padding: 11, background: "#ffffff" }}>
            <strong style={{ display: "block", fontSize: 12.5, color: "#162033", marginBottom: 4 }}>Delay exposure</strong>
            <span style={{ fontSize: 11.5, color: "#526074", lineHeight: 1.5 }}>{transactionTimelinePlan.carryingCostCategories.join(" · ")}</span>
          </div>
        </div>
        <span style={{ fontSize: 11.5, color: "#7a5a10", lineHeight: 1.5 }}>{transactionTimelinePlan.decisionRule}</span>
      </section>

      <section aria-label="Preliminary capital plan" style={{ display: "grid", gap: 12, border: "1px solid #d9e2ec", borderRadius: 12, padding: "15px", background: "#fbfcfe" }}>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 10, alignItems: "baseline" }}>
          <div style={{ display: "grid", gap: 3 }}>
            <strong style={{ fontSize: 16, color: "#162033" }}>Preliminary total project need</strong>
            <span style={{ fontSize: 12.5, color: "#526074" }}>Acquisition plus currently modeled diligence, improvements, startup capital, and required environmental work.</span>
          </div>
          <strong style={{ fontSize: 17, color: "#0f766e" }}>{formatRange(capitalPlan.totalProjectNeed)}</strong>
        </div>
        <div style={{ display: "grid", gap: 8 }}>
          {capitalPlan.usesOfFunds.map((line) => (
            <div key={line.id} style={{ display: "grid", gap: 3, gridTemplateColumns: "minmax(180px, 1fr) minmax(170px, auto)", borderTop: "1px solid #e5eaf0", paddingTop: 8 }}>
              <span style={{ fontSize: 13, color: "#26364a", fontWeight: 700 }}>{line.label}</span>
              <span style={{ fontSize: 13, color: "#26364a", fontWeight: 800, textAlign: "right" }}>{formatRange(line.range)}</span>
              <span style={{ gridColumn: "1 / -1", fontSize: 11.5, color: "#6c788a", lineHeight: 1.5 }}>{line.note}</span>
            </div>
          ))}
        </div>
        <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
          <div style={{ border: "1px solid #e1e7ef", borderRadius: 10, padding: 11, background: "#ffffff" }}>
            <strong style={{ display: "block", fontSize: 12.5, color: "#162033", marginBottom: 4 }}>Most realistic structure</strong>
            <span style={{ fontSize: 11.5, color: "#526074", lineHeight: 1.5 }}>{capitalPlan.realisticStructure.join(" ")}</span>
          </div>
          <div style={{ border: "1px solid #e1e7ef", borderRadius: 10, padding: 11, background: "#ffffff" }}>
            <strong style={{ display: "block", fontSize: 12.5, color: "#162033", marginBottom: 4 }}>Maximum potential</strong>
            <span style={{ fontSize: 11.5, color: "#526074", lineHeight: 1.5 }}>{capitalPlan.maximumPotentialStructure.join(" ")}</span>
          </div>
          <div style={{ border: "1px solid #e1e7ef", borderRadius: 10, padding: 11, background: "#ffffff" }}>
            <strong style={{ display: "block", fontSize: 12.5, color: "#162033", marginBottom: 4 }}>Conservative fallback</strong>
            <span style={{ fontSize: 11.5, color: "#526074", lineHeight: 1.5 }}>{capitalPlan.conservativeFallback.join(" ")}</span>
          </div>
        </div>
        {(capitalPlan.leadPathway || capitalPlan.backupPathway) && (
          <span style={{ fontSize: 12, color: "#526074" }}>
            Lead lane to test: <strong>{capitalPlan.leadPathway ?? "Still classifying"}</strong>{capitalPlan.backupPathway ? ` · backup: ${capitalPlan.backupPathway}` : ""}.
          </span>
        )}
      </section>

      <section aria-label="Customer financial authorization and house-poor analysis" style={{ display: "grid", gap: 11, border: "1px solid #d9e2ec", borderRadius: 12, padding: "15px", background: "#f8fafc" }}>
        <div style={{ display: "grid", gap: 4 }}>
          <strong style={{ fontSize: 15, color: "#162033" }}>Customer capacity and house-poor check</strong>
          <span style={{ fontSize: 12.5, color: "#526074", lineHeight: 1.55 }}>Property potential is ranked separately from whether this customer can responsibly carry the acquisition, improvements, operations, and existing obligations.</span>
        </div>
        <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))" }}>
          <div style={{ border: "1px solid #e1e7ef", borderRadius: 10, padding: 11, background: "#ffffff" }}>
            <strong style={{ display: "block", fontSize: 12.5, color: "#162033", marginBottom: 4 }}>Authorization</strong>
            <span style={{ fontSize: 11.5, color: "#526074", lineHeight: 1.5 }}>{financialCapacityPlan.authorization === "authorized" ? "Authorized financial review" : "Customer authorization required before personalized affordability is calculated."}</span>
          </div>
          <div style={{ border: "1px solid #e1e7ef", borderRadius: 10, padding: 11, background: "#ffffff" }}>
            <strong style={{ display: "block", fontSize: 12.5, color: "#162033", marginBottom: 4 }}>Current posture</strong>
            <span style={{ fontSize: 11.5, color: "#526074", lineHeight: 1.5 }}>{financialCapacityPlan.posture.replace(/-/g, " ")}</span>
          </div>
          <div style={{ border: "1px solid #e1e7ef", borderRadius: 10, padding: 11, background: "#ffffff" }}>
            <strong style={{ display: "block", fontSize: 12.5, color: "#162033", marginBottom: 4 }}>House-poor gate</strong>
            <span style={{ fontSize: 11.5, color: "#526074", lineHeight: 1.5 }}>{financialCapacityPlan.housePoorGates[0]}</span>
          </div>
        </div>
        <span style={{ fontSize: 11.5, color: "#7a5a10", lineHeight: 1.5 }}>{financialCapacityPlan.decisionRule}</span>
      </section>

      <section aria-label="Comparable sales and market competition" style={{ display: "grid", gap: 11, border: "1px solid #d9e2ec", borderRadius: 12, padding: "15px", background: "#fbfcfe" }}>
        <div style={{ display: "grid", gap: 4 }}>
          <strong style={{ fontSize: 15, color: "#162033" }}>Comparable sales, nearby alternatives, and market competition</strong>
          <span style={{ fontSize: 12.5, color: "#526074", lineHeight: 1.55 }}>{marketComparablePlan.marketModel}</span>
        </div>
        <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))" }}>
          <div style={{ border: "1px solid #e1e7ef", borderRadius: 10, padding: 11, background: "#ffffff" }}>
            <strong style={{ display: "block", fontSize: 12.5, color: "#162033", marginBottom: 4 }}>Comparable support</strong>
            <span style={{ fontSize: 11.5, color: "#526074", lineHeight: 1.5 }}>{marketComparablePlan.acquisitionComparables.length} nearby property reference{marketComparablePlan.acquisitionComparables.length === 1 ? "" : "s"} currently available to test price and fit. Closed-sale support still controls lender value.</span>
          </div>
          <div style={{ border: "1px solid #e1e7ef", borderRadius: 10, padding: 11, background: "#ffffff" }}>
            <strong style={{ display: "block", fontSize: 12.5, color: "#162033", marginBottom: 4 }}>Better-property check</strong>
            <span style={{ fontSize: 11.5, color: "#526074", lineHeight: 1.5 }}>{marketComparablePlan.alternativePropertyCount} nearby lower- or similarly-priced alternative{marketComparablePlan.alternativePropertyCount === 1 ? "" : "s"} should be tested before recommending this parcel.</span>
          </div>
          <div style={{ border: "1px solid #e1e7ef", borderRadius: 10, padding: 11, background: "#ffffff" }}>
            <strong style={{ display: "block", fontSize: 12.5, color: "#162033", marginBottom: 4 }}>Decision rule</strong>
            <span style={{ fontSize: 11.5, color: "#526074", lineHeight: 1.5 }}>{marketComparablePlan.decisionRules[0]}</span>
          </div>
        </div>
        <span style={{ fontSize: 11.5, color: "#7a5a10", lineHeight: 1.5 }}>Furlong treats nearby properties as acquisition alternatives and business-market evidence, not merely a list of addresses.</span>
      </section>

      <section aria-label="Comparable-supported collateral analysis" style={{ display: "grid", gap: 11, border: "1px solid #d9e2ec", borderRadius: 12, padding: "15px", background: "#f8fafc" }}>
        <div style={{ display: "grid", gap: 4 }}>
          <strong style={{ fontSize: 15, color: "#162033" }}>Existing collateral and verified equity</strong>
          <span style={{ fontSize: 12.5, color: "#526074", lineHeight: 1.55 }}>
            Another property can support agricultural or commercial financing even when it already has a mortgage, but Furlong will not count the owner&apos;s estimate as usable equity.
          </span>
        </div>
        <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))" }}>
          <div style={{ border: "1px solid #e1e7ef", borderRadius: 10, padding: 11, background: "#ffffff" }}>
            <strong style={{ display: "block", fontSize: 12.5, color: "#162033", marginBottom: 4 }}>Value sequence</strong>
            <span style={{ fontSize: 11.5, color: "#526074", lineHeight: 1.5 }}>Owner estimate → closed-sale comparable support → likely lender value → usable collateral equity.</span>
          </div>
          <div style={{ border: "1px solid #e1e7ef", borderRadius: 10, padding: 11, background: "#ffffff" }}>
            <strong style={{ display: "block", fontSize: 12.5, color: "#162033", marginBottom: 4 }}>Equity calculation</strong>
            <span style={{ fontSize: 11.5, color: "#526074", lineHeight: 1.5 }}>Lender-supported value minus mortgages, junior liens, required equity cushion, and borrowing costs.</span>
          </div>
          <div style={{ border: "1px solid #e1e7ef", borderRadius: 10, padding: 11, background: "#ffffff" }}>
            <strong style={{ display: "block", fontSize: 12.5, color: "#162033", marginBottom: 4 }}>Current status</strong>
            <span style={{ fontSize: 11.5, color: "#526074", lineHeight: 1.5 }}>{collateralPlan.status === "consent-required" ? "Customer authorization required before another property is analyzed." : "Authorized, but comparable and lender review are still required before usable equity is stated."}</span>
          </div>
        </div>
        <span style={{ fontSize: 11.5, color: "#7a5a10", lineHeight: 1.5 }}>
          Furlong will compare no-collateral, separate equity borrowing, second-lien, and cross-collateralized structures, then recommend the least risky workable option.
        </span>
      </section>

      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))" }}>
        <div style={{ border: "1px solid #d9e2ec", borderRadius: 12, padding: "14px 15px", background: "#f8fafc" }}>
          <strong style={{ display: "block", fontSize: 14, color: "#162033", marginBottom: 5 }}>Financing pipeline</strong>
          <span style={{ display: "block", fontSize: 18, fontWeight: 800, color: "#0f766e", marginBottom: 5 }}>
            {capitalPlan.pipeline.mostLikely}
          </span>
          <span style={{ fontSize: 12.5, color: "#526074", lineHeight: 1.55 }}>
            {capitalPlan.pipeline.explanation} Best case: {capitalPlan.pipeline.bestCase}. Delay case: {capitalPlan.pipeline.delayCase}.
          </span>
        </div>
        <div style={{ border: "1px solid #d9e2ec", borderRadius: 12, padding: "14px 15px", background: phaseI ? "#fff8e8" : "#f8fafc" }}>
          <strong style={{ display: "block", fontSize: 14, color: "#162033", marginBottom: 5 }}>Environmental requirement</strong>
          <span style={{ display: "block", fontSize: 16, fontWeight: 800, color: phaseI ? "#854F0B" : "#3b475a", marginBottom: 5 }}>
            {phaseI ? "Phase I ESA included in the financing plan" : "Triggered when the parcel or loan pathway requires it"}
          </span>
          <span style={{ fontSize: 12.5, color: "#526074", lineHeight: 1.55 }}>
            {phaseI
              ? "The pro forma will carry the expected report cost, timing, reliance requirements, and contingency for additional investigation. The analysis can proceed before the report is complete, but lender approval and closing may depend on it."
              : "Known site risks, historical uses, mixed-use activity, or lender requirements can still add environmental diligence to the transaction."}
          </span>
        </div>
      </div>

      <div className="no-print" style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
        <Link href={deepHref} style={{ ...primaryAction, textDecoration: "none" }}>Open the full pro forma</Link>
        {phaseI && <Link href={environmentalHref} style={{ ...secondaryAction, textDecoration: "none" }}>Coordinate the required Phase I</Link>}
        <Link href={financingHref} style={{ ...secondaryAction, textDecoration: "none" }}>Personalize financing</Link>
        <button type="button" onClick={onDownload} disabled={downloadBusy} style={secondaryAction}>
          {downloadBusy ? "Preparing PDF..." : "Download the property report"}
        </button>
      </div>
      <p style={{ margin: 0, fontSize: 11.5, color: "#6c788a", lineHeight: 1.55 }}>
        Advisory planning only. This is not an appraisal, environmental clearance, credit decision, approval, commitment, or guarantee. Personalized financial and collateral analysis begins only after the customer authorizes it.
      </p>
    </section>
  );
}

const primaryAction = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 44,
  border: "1px solid #0f766e",
  borderRadius: 9,
  padding: "9px 14px",
  background: "#0f766e",
  color: "#ffffff",
  fontSize: 13,
  fontWeight: 800,
  cursor: "pointer",
} as const;

const secondaryAction = {
  ...primaryAction,
  border: "1px solid #cfd8e6",
  background: "#ffffff",
  color: "#1d3652",
} as const;
