import { createHash } from "node:crypto";
import { NextResponse } from "next/server";

import { readJsonBodyWithLimit } from "@/lib/security/requestGuards";
import { guardPublicInput } from "@/security/realityPlatform/publicInputGuard";
import { calculatePropertyOperatingModel, type PropertyOperatingModelInput, type OperatingUseType, type OperatingRevenueCadence } from "@/lib/property/propertyOperatingModel";
import { adviseOnPropertyOperatingModel, buildDeterministicOperatingModelAdvice, type ProjectConcern } from "@/lib/property/propertyOperatingModelAdvisor";
import { decideRate } from "@/security/realityPlatform/navigatorRateLimit";
import { incomeCapScenario } from "@/lib/property/calculationMath";

export const dynamic = "force-dynamic";

const aiWindows = new Map<string, number[]>();
function anonymousRateKey(request: Request): string {
  const raw = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip")?.trim() || "unknown";
  return createHash("sha256").update(raw).digest("hex").slice(0, 24);
}
function aiBudget(request: Request) {
  const key = anonymousRateKey(request);
  const decision = decideRate("operating-model-ai", aiWindows.get(key) ?? [], Date.now());
  aiWindows.set(key, decision.window);
  return decision;
}

interface OperatingModelRequest {
  model?: Partial<PropertyOperatingModelInput> & { expenses?: PropertyOperatingModelInput["expenses"] };
  propertyContext?: {
    classification?: string | null;
    currentUse?: string | null;
    targetUse?: string | null;
    location?: string | null;
    entitlementSummary?: string | null;
  };
  customerGoal?: string | null;
  projectConcern?: ProjectConcern;
  valuation?: {
    capRateLowPct?: number | null;
    capRateHighPct?: number | null;
  };
  requestAdvice?: boolean;
}

const USES = new Set<OperatingUseType>(["hotel", "extended_stay", "senior_independent_living", "senior_assisted_living", "other_units"]);
const CADENCE = new Set<OperatingRevenueCadence>(["nightly", "monthly"]);
const bounded = (value: unknown, max: number, fallback = 0) => {
  const n = typeof value === "number" && Number.isFinite(value) ? value : fallback;
  return Math.min(max, Math.max(0, n));
};
const optionalBounded = (value: unknown, max: number) => typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= max ? value : null;
const text = (value: unknown, max = 240) => typeof value === "string" ? value.trim().slice(0, max) : null;

function cleanModel(raw: OperatingModelRequest["model"]): PropertyOperatingModelInput | null {
  if (!raw) return null;
  const useType = USES.has(raw.useType as OperatingUseType) ? raw.useType as OperatingUseType : "other_units";
  const revenueCadence = CADENCE.has(raw.revenueCadence as OperatingRevenueCadence) ? raw.revenueCadence as OperatingRevenueCadence : "monthly";
  const e = raw.expenses ?? {};
  return {
    useType,
    revenueCadence,
    unitCount: bounded(raw.unitCount, 10_000),
    occupancyPct: optionalBounded(raw.occupancyPct, 100) ?? NaN,
    averageUnitRevenue: bounded(raw.averageUnitRevenue, 1_000_000),
    ancillaryRevenueMonthly: optionalBounded(raw.ancillaryRevenueMonthly, 50_000_000),
    replacementReservePct: optionalBounded(raw.replacementReservePct, 100),
    expenses: {
      payrollMonthly: optionalBounded(e.payrollMonthly, 50_000_000),
      utilitiesMonthly: optionalBounded(e.utilitiesMonthly, 50_000_000),
      insuranceMonthly: optionalBounded(e.insuranceMonthly, 50_000_000),
      propertyTaxMonthly: optionalBounded(e.propertyTaxMonthly, 50_000_000),
      maintenanceHousekeepingMonthly: optionalBounded(e.maintenanceHousekeepingMonthly, 50_000_000),
      foodServicesMonthly: optionalBounded(e.foodServicesMonthly, 50_000_000),
      managementMarketingMonthly: optionalBounded(e.managementMarketingMonthly, 50_000_000),
      licensingOtherMonthly: optionalBounded(e.licensingOtherMonthly, 50_000_000),
    },
    acquisitionPrice: optionalBounded(raw.acquisitionPrice, 10_000_000_000),
    conversionCapex: optionalBounded(raw.conversionCapex, 10_000_000_000),
    professionalSoftCost: optionalBounded(raw.professionalSoftCost, 1_000_000_000),
    contingencyPct: optionalBounded(raw.contingencyPct, 100),
    loanAmount: optionalBounded(raw.loanAmount, 10_000_000_000),
    interestRatePct: optionalBounded(raw.interestRatePct, 50),
    amortizationYears: optionalBounded(raw.amortizationYears, 50),
    targetDscr: Math.min(3, Math.max(1, typeof raw.targetDscr === "number" && Number.isFinite(raw.targetDscr) ? raw.targetDscr : 1.25)),
  };
}

export async function POST(request: Request) {
  const parsed = await readJsonBodyWithLimit<OperatingModelRequest>(request, { maxBytes: 32 * 1024 });
  if (!parsed.ok) return NextResponse.json({ ok: false, error: parsed.error }, { status: parsed.status });

  const model = cleanModel(parsed.body.model);
  if (!model) return NextResponse.json({ ok: false, error: "Operating-model inputs are required." }, { status: 400 });
  if (model.unitCount <= 0) return NextResponse.json({ ok: false, error: "Enter at least one room or unit." }, { status: 400 });

  const customerGoal = text(parsed.body.customerGoal, 1000);
  let safeCustomerGoal = customerGoal;
  if (customerGoal) {
    const guard = guardPublicInput(customerGoal);
    if (!["ALLOW", "ALLOW_WITH_SCRUB"].includes(guard.decision)) {
      return NextResponse.json({ ok: false, error: "That note could not be processed safely. Remove instruction-like or sensitive text and try again." }, { status: 400 });
    }
    if (guard.signals.includes("pii-scrub")) {
      safeCustomerGoal = "Customer supplied a goal containing personal details; those details were removed. Analyze only the structured property and operating assumptions.";
    }
  }

  const propertyContext = {
    classification: text(parsed.body.propertyContext?.classification),
    currentUse: text(parsed.body.propertyContext?.currentUse),
    targetUse: text(parsed.body.propertyContext?.targetUse),
    location: text(parsed.body.propertyContext?.location),
    entitlementSummary: text(parsed.body.propertyContext?.entitlementSummary, 600),
  };
  const result = calculatePropertyOperatingModel(model);
  const capRateLowPct = bounded(parsed.body.valuation?.capRateLowPct, 30);
  const capRateHighPct = bounded(parsed.body.valuation?.capRateHighPct, 30);
  const valuation = null; // Only a reviewed evidence path may publish a Value Screen.
  const capScenario = result.coveragePosture !== "NEEDS_EVIDENCE"
    ? incomeCapScenario(result.noi, capRateLowPct, capRateHighPct) : null;
  const budget = parsed.body.requestAdvice === false ? null : aiBudget(request);
  const advice = parsed.body.requestAdvice === false
    ? null
    : budget && !budget.allowed
      ? buildDeterministicOperatingModelAdvice(result, parsed.body.projectConcern ?? "unknown")
      : await adviseOnPropertyOperatingModel({
          modelInput: model,
          result,
          propertyContext,
          customerGoal: safeCustomerGoal,
          projectConcern: parsed.body.projectConcern ?? "unknown",
        });

  return NextResponse.json(
    {
      ok: true,
      model,
      result,
      valuation,
      capScenario,
      advice,
      posture: {
        mathAuthority: "deterministic",
        aiRole: "interpretation_and_follow_up_only",
        persistsAnonymousInputs: false,
        aiRateLimited: Boolean(budget && !budget.allowed),
        aiRetryAfterMs: budget && !budget.allowed ? budget.retryAfterMs ?? null : null,
        creditDecision: false,
        financingApproval: false,
        nonResidentialPersonalFinancialScoring: false,
        borrowerUnderwritingAuthority: "selected_provider_only",
      },
    },
    { headers: { "Cache-Control": "no-store, private" } },
  );
}
