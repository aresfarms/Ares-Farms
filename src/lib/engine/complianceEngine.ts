export function complianceEngine(farm: any) {
  const notes: string[] = [];

  const acreage = farm?.acreage ?? 0;
  const location = farm?.location ?? "unknown";

  /**
   * 🧾 USDA / REGULATORY COMPLIANCE CHECKS (SIMPLIFIED MODEL)
   */

  // Acreage-based flagging
  if (acreage < 5) {
    notes.push("Small acreage detected — may qualify as hobby farm; check USDA eligibility rules.");
  } else if (acreage < 40) {
    notes.push("Mid-size farm — verify eligibility for USDA micro-loan and EQIP programs.");
  } else {
    notes.push("Commercial-scale farm — eligible for most USDA FSA programs subject to credit review.");
  }

  /**
   * 🌎 STATE / LOCAL COMPLIANCE FLAGS (PLACEHOLDER LOGIC)
   */
  notes.push("Verify state-specific zoning laws for agricultural land use.");
  notes.push("Confirm water rights and irrigation compliance based on region.");
  notes.push("Check livestock density regulations for local jurisdiction.");

  /**
   * 🌱 ENVIRONMENTAL SAFETY FLAGS
   */
  notes.push("Ensure proper manure handling and runoff management practices.");
  notes.push("Confirm pesticide usage compliance with EPA guidelines.");
  notes.push("Check buffer zone requirements for waterways and neighboring properties.");

  /**
   * 🧾 LIABILITY / RISK FLAGS
   */
  notes.push("Confirm liability coverage for livestock interactions and public access areas.");
  notes.push("Verify insurance requirements for structures and equipment.");

  return {
    compliant: true,
    notes
  };
}
