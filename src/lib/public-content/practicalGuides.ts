export const GUIDE_VERSION = "furlong-practical-guides-v1.0.0";
export const GUIDE_SOURCE_CHECK_DATE = "2026-09-08";
export const PRACTICAL_GUIDES = [
  {
    slug: "business-property-expansion",
    title: "Evaluate a property for your business expansion",
    summary: "Separate the real-estate decision from the operating-business decision.",
    scope: "U.S. general preparation. Local zoning, permits and lender requirements vary.",
    sections: [
      { title: "Define the project before comparing properties", text: "Write down the business activity, required space, equipment, customer access and timing. Identify what the business needs the site to do. A listing description is not confirmation that a proposed use is permitted." },
      { title: "Build two evidence lists", text: "For the property: source-backed price, parcel identity, physical condition, utilities and use restrictions. For the business: demand evidence, operating records or a documented budget, and the costs of moving, fitting out and opening. Keep one-time costs separate from recurring expenses." },
      { title: "Compare before committing", text: "Use the same categories for each candidate. When a critical input is missing, mark it pending and identify who can obtain it. Furlong's comparison does not rank an incomplete property as a winner." },
    ],
    sources: [{ label: "SBA: business planning, market research and startup costs", url: "https://www.sba.gov/counseling/plan-your-business/" }],
  },
  {
    slug: "preparing-a-financing-discussion",
    title: "Prepare for a financing discussion",
    summary: "Organize the project and the unanswered questions before approaching a provider.",
    scope: "U.S. general preparation, not a loan application, program eligibility determination or lender acceptance.",
    sections: [
      { title: "Make the request understandable", text: "Describe what you want to do, how much funding you are seeking, and how you would use it. Keep the property price separate from improvements, equipment, operating needs and financing costs." },
      { title: "Bring evidence, not just a forecast", text: "Identify the business plan, operating records or financial projections supporting the request. Record the source and date of each figure. Your chosen lender determines the information and underwriting it requires." },
      { title: "Control the handoff", text: "Download your Furlong Answer and inspect it before distributing a copy. Downloading is not an application or an authorized provider handoff. Any Furlong-managed sharing must separately identify the recipient and document package." },
    ],
    sources: [{ label: "SBA: Lender Match preparation checklist and limits", url: "https://www.sba.gov/loans/lender-match/" }],
  },
  {
    slug: "missing-project-economics",
    title: "Find the missing evidence in project economics",
    summary: "An incomplete number is a question to resolve—not permission to substitute a convenient estimate.",
    scope: "General decision preparation. No appraisal, tax advice, credit decision or professional cost estimate.",
    sections: [
      { title: "Name each number's job", text: "Keep asking price, contract price, intended offer, tax assessment, market-value evidence and professional appraisal separate. A tax fact does not become the price you will pay." },
      { title: "Separate income from cash left over", text: "Record revenue, recurring operating expenses, initial investment and debt payments separately. If an input is an assumption, identify it as an assumption and keep it separate from documented operating results." },
      { title: "Assign the unresolved questions", text: "For each material gap, record the evidence needed and the person who has agreed to obtain it. An empty field does not mean zero cost or no risk. Recheck changed inputs before using a saved or exported snapshot." },
    ],
    sources: [{ label: "SBA: planning and startup-cost resources", url: "https://www.sba.gov/counseling/plan-your-business/" }],
  },
  {
    slug: "agricultural-land-possibilities",
    title: "Investigate possible uses of agricultural land",
    summary: "Begin with the actual parcel and the intended enterprise, not a regional crop assumption.",
    scope: "U.S. general preparation. Soil-map coverage and local requirements vary. No crop, yield, profit or land-use recommendation.",
    sections: [
      { title: "Define the land you are evaluating", text: "Confirm parcel boundaries, the offered acreage and the portion usable for the proposed enterprise. Agricultural classification alone does not establish the best enterprise for that property." },
      { title: "Use soil information at the right level", text: "NRCS Web Soil Survey supports soil and land-use information for a selected area. NRCS notes that onsite investigation is needed for some applications. Keep mapped information separate from current field observations and laboratory results. Do not treat a mapped soil category as a current parcel-wide pH test." },
      { title: "Keep the recommendation pending until it is supported", text: "Identify enterprise-specific requirements, water and access, operating costs, labor and market evidence. Missing critical soil or enterprise evidence keeps a leading crop or profitability claim pending. Use qualified local assistance for the unresolved property-specific questions." },
    ],
    sources: [{ label: "USDA NRCS: Web Soil Survey and onsite-investigation limits", url: "https://www.nrcs.usda.gov/resources/data-and-reports/web-soil-survey" }],
  },
] as const;
