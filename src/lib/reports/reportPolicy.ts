export const reportPolicy = {
  free: {
    name: "AI Farm Summary Report",
    gated: false,
    humanReview: false,
    description: "Basic AI-generated farm insights",
  },

  paid: {
    name: "Commercial Farm Expansion Report",
    gated: true,
    humanReview: false,
    description:
      "Detailed profitability, crop optimization, vendor matching, financing pathways",
  },

  environmental: {
    name: "Environmental Phase I–III Report",
    gated: true,
    humanReview: true,
    certifiedOnly: true,
    description:
      "PE-certified environmental engineering report for permitting and regulatory use",
  },
};
