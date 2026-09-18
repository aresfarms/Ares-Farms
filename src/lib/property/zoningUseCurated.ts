/**
 * Narrow, source-cited zoning interpretations used only when Furlong has an
 * exact supported jurisdiction + zoning-code match. Unknown jurisdictions fail
 * closed: the UI shows the raw zoning code and requires official interpretation.
 */

export type ZoningUseInterpretation = {
  jurisdiction: string;
  zoningCode: string;
  zoningLabel: string;
  summary: string;
  sourceName: string;
  sourceUrl: string;
  sourceAsOf: string;
  propertyWideCandidates: string[];
  developmentNote: string;
  energyNote: string;
};

function normalized(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

export function zoningUseInterpretation(args: {
  state?: string | null;
  county?: string | null;
  zoningCode?: string | null;
}): ZoningUseInterpretation | null {
  const state = normalized(args.state).toUpperCase();
  const county = normalized(args.county).replace(/\s+county$/, "");
  const zoningCode = (args.zoningCode ?? "").trim().toUpperCase();

  if (state === "MD" && county === "caroline" && zoningCode === "R") {
    return {
      jurisdiction: "Caroline County, Maryland",
      zoningCode: "R",
      zoningLabel: "R - Rural District",
      summary:
        "Caroline County describes the R Rural District as primarily rural/agricultural, with a full range of agricultural activities and limited low-density residential development.",
      sourceName: "Caroline County Planning & Codes - Zoning Districts / Table of Use Regulations",
      sourceUrl: "https://www.carolinemd.org/249/Zoning-Districts",
      sourceAsOf: "verified 2026-09-04",
      propertyWideCandidates: [
        "Agricultural production",
        "Agricultural tourism",
        "Forestry / tree farming",
        "Greenhouse / nursery uses subject to the current use table",
        "Detached rural residential use",
        "Minor subdivision / rural residential development subject to subdivision rules",
        "Rural major subdivision only where current TDR receiving-area rules allow it",
        "Renewable-energy / storage only after current county rules and interconnection are verified",
      ],
      developmentNote:
        "Do not label development marginal from rural location alone. R-zoned development potential depends on TDR receiving-versus-sending status, subdivision yield, frontage/access, septic and well capacity, soils, wetlands, forest conservation, and current county approvals.",
      energyNote:
        "Caroline County is actively updating solar rules in response to Maryland energy legislation. Do not credit solar or battery-storage value until the current ordinance, utility territory, substation/interconnection evidence, setbacks, and project terms are verified.",
    };
  }

  return null;
}
