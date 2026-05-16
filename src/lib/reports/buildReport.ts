export function buildReport(result: any) {
  const { scores, decision, tenantId } = result;

  /**
   * 📊 BASE SUMMARY
   */
  const summary = {
    tenantId,
    riskLevel:
      scores.sba > 0.75
        ? "LOW"
        : scores.sba > 0.5
        ? "MEDIUM"
        : "HIGH",

    overallScore: Math.round(scores.sba * 100),
  };

  /**
   * 🌾 FREE REPORT (SAFE OUTPUT)
   */
  const freeReport = {
    title: "Farm AI Summary Report",
    sections: {
      overview: [
        `Tenant: ${tenantId}`,
        `Overall Score: ${summary.overallScore}%`,
        `Risk Level: ${summary.riskLevel}`,
      ],

      basicRecommendations: {
        crops: decision.crops,
        livestock: decision.livestock,
      },
    },
  };

  /**
   * 💰 PAID REPORT (BUSINESS LAYER)
   */
  const paidReport = {
    title: "Commercial Farm Expansion Report",

    sections: {
      financialHealth: {
        credit: scores.credit,
        liquidity: scores.liquidity,
        collateral: scores.collateral,
      },

      optimization: {
        crops: decision.crops,
        equipment: decision.equipment,
      },

      vendorStrategy: decision.vendors,

      notes: [
        "Includes optimization for scaling operations",
        "Includes financing pathways and equipment planning",
      ],
    },
  };

  /**
   * 🌍 ENVIRONMENTAL REPORT (PE / REGULATED)
   */
  const environmentalReport = {
    title: "Environmental Compliance Report (Phase I–III)",

    sections: {
      siteAssessment: [
        "Soil suitability analysis required",
        "Water table risk assessment required",
      ],

      complianceNotes: [
        "Requires PE certification before regulatory submission",
        "Not legally valid without human review",
      ],
    },
  };

  /**
   * 📦 FINAL OUTPUT STRUCTURE
   */
  return {
    summary,
    freeReport,
    paidReport,
    environmentalReport,
  };
}
