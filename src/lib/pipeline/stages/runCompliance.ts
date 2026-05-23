export function runCompliance(input: any, enriched: any) {
  const acres = enriched?.metadata?.acres ?? 0;
  const region = enriched?.location?.region ?? "UNKNOWN";

  const notes: string[] = [];

  if (acres < 50) {
    notes.push("Small acreage detected — may qualify as hobby farm; check USDA eligibility rules.");
  }

  notes.push("Verify state-specific zoning laws for agricultural land use.");
  notes.push("Confirm water rights and irrigation compliance based on region.");
  notes.push("Check livestock density regulations for local jurisdiction.");

  const compliant = true;

  return {
    compliant,
    notes,
  };
}
