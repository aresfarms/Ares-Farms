export type ConversionReviewClass =
  | "administrative-or-by-right"
  | "change-of-use-or-site-plan"
  | "conditional-special-exception"
  | "rezoning-variance-or-licensed-use";

export interface ConversionIntelligence {
  reviewClass: ConversionReviewClass;
  pathLabel: string;
  zoningReviewMonths: { low: number; high: number };
  endToEndMonths: { low: number; high: number };
  resubmissionUpperMonths: number;
  professionalSoftCost: { low: number; high: number };
  municipalFees: "VERIFY_LOCAL_FEE_SCHEDULE";
  steps: string[];
  jurisdictionLabel: string;
  note: string;
}

function jurisdiction(args: { town?: string | null; county?: string | null; stateCode?: string | null }) {
  return [args.town, args.county, args.stateCode].filter(Boolean).join(", ") || "the governing jurisdiction";
}

function sameFamily(current: string, target: string) {
  const pairs = [
    [/hotel|motel|hospitality|lodging/, /hotel|motel|hospitality|lodging|extended-stay/],
    [/office|medical/, /office|medical/],
    [/retail|storefront|service/, /retail|storefront|service/],
    [/warehouse|industrial|flex/, /warehouse|industrial|flex|storage/],
  ] as const;
  return pairs.some(([a, b]) => a.test(current) && b.test(target));
}

export function buildCommercialConversionIntelligence(args: {
  currentLandUse?: string | null;
  zoning?: string | null;
  targetUse: string;
  squareFeet?: number | null;
  town?: string | null;
  county?: string | null;
  stateCode?: string | null;
}): ConversionIntelligence {
  const current = `${args.currentLandUse ?? ""}`.toLowerCase();
  const target = args.targetUse.toLowerCase();
  const place = jurisdiction(args);
  const zoningKnown = Boolean(args.zoning?.trim());
  const senior = /senior housing|independent living|assisted living|memory care/.test(target);
  const mixedResidential = /mixed-use|residential|apartments|multifamily/.test(target);
  const extendedStay = /extended-stay|hotel|motel|hospitality/.test(target);
  const same = sameFamily(current, target);

  let reviewClass: ConversionReviewClass = "change-of-use-or-site-plan";
  let pathLabel = "Land-use confirmation + change-of-use/site-plan review";
  let zoningReviewMonths = { low: 2, high: 8 };
  let endToEndMonths = { low: 4, high: 12 };
  let resubmissionUpperMonths = 18;
  let professionalSoftCost = { low: 10000, high: 75000 };
  const steps = [
    "Confirm the municipal zoning use table and whether the target use is by-right, conditional, or prohibited.",
    "Run a pre-application meeting with planning/zoning and document the required studies, hearings, and agency referrals.",
    "Prepare concept/site plan, code and life-safety review, parking/access, utilities, stormwater and accessibility scope as applicable.",
    "Submit in the jurisdiction's required sequence; track comments, hearing dates, conditions, resubmittals and expiration dates.",
  ];

  if (same) {
    reviewClass = "administrative-or-by-right";
    pathLabel = "Likely administrative/by-right confirmation + permits";
    zoningReviewMonths = { low: 1, high: 3 };
    endToEndMonths = { low: 2, high: 8 };
    resubmissionUpperMonths = 12;
    professionalSoftCost = { low: 2500, high: 25000 };
  }

  if (extendedStay && /hotel|motel|hospitality|lodging/.test(current)) {
    reviewClass = "change-of-use-or-site-plan";
    pathLabel = "Hospitality operating-model change + code/permit confirmation";
    zoningReviewMonths = { low: 1, high: 4 };
    endToEndMonths = { low: 3, high: 9 };
    resubmissionUpperMonths = 15;
    professionalSoftCost = { low: 15000, high: 60000 };
  }

  if (mixedResidential) {
    reviewClass = "conditional-special-exception";
    pathLabel = "Residential/mixed-use entitlement + change-of-occupancy review";
    zoningReviewMonths = { low: 4, high: 12 };
    endToEndMonths = { low: 9, high: 24 };
    resubmissionUpperMonths = 36;
    professionalSoftCost = { low: 35000, high: 180000 };
  }

  if (senior) {
    const hospitalityShell = /hotel|motel|hospitality|lodging|multifamily|apartment|residential/.test(current);
    reviewClass = hospitalityShell ? "conditional-special-exception" : "rezoning-variance-or-licensed-use";
    pathLabel = hospitalityShell
      ? "Senior-housing land-use confirmation + change of occupancy + fire/life-safety + accessibility"
      : "Senior-housing entitlement/rezoning risk + change of occupancy + fire/life-safety + accessibility";
    zoningReviewMonths = hospitalityShell ? { low: 4, high: 12 } : { low: 6, high: 18 };
    endToEndMonths = hospitalityShell ? { low: 9, high: 24 } : { low: 12, high: 30 };
    resubmissionUpperMonths = 36;
    professionalSoftCost = hospitalityShell ? { low: 50000, high: 250000 } : { low: 75000, high: 300000 };
    steps.push(
      "Determine whether the operating model is independent living only or includes care services; care can trigger separate state licensing and staffing requirements.",
      "Complete fire/life-safety, accessibility, egress, elevator, kitchen, sprinkler, utility-capacity and parking reviews before treating the conversion as finance-ready.",
    );
  }

  if (!zoningKnown && reviewClass === "administrative-or-by-right") {
    reviewClass = "change-of-use-or-site-plan";
    pathLabel = "Zoning not yet verified — treat as land-use confirmation + permit review until the municipality confirms otherwise";
    zoningReviewMonths = { low: 2, high: 8 };
    endToEndMonths = { low: 4, high: 12 };
    resubmissionUpperMonths = 18;
    professionalSoftCost = { low: 10000, high: 75000 };
  }

  return {
    reviewClass,
    pathLabel,
    zoningReviewMonths,
    endToEndMonths,
    resubmissionUpperMonths,
    professionalSoftCost,
    municipalFees: "VERIFY_LOCAL_FEE_SCHEDULE",
    steps,
    jurisdictionLabel: place,
    note:
      `Screening runway for ${place}, not a municipal determination or professional fee quote. ` +
      "Local fee schedules, hearing calendars, completeness rules, agency referrals, public opposition, redesign and resubmission can move both time and cost materially. Construction cost is excluded.",
  };
}
