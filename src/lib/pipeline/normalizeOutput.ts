export function normalizeOutput(result: any) {
  return {
    userId: result?.userId ?? "unknown",
    name: result?.name ?? "unknown",

    location: {
      state: result?.location?.state ?? "UNKNOWN",
      region: result?.location?.region ?? result?.location?.state ?? "UNKNOWN",
      county: result?.location?.county ?? "UNKNOWN",
      country: result?.location?.country ?? "US",
    },

    scores: {
      credit: Number(result?.scores?.credit ?? 0),
      liquidity: Number(result?.scores?.liquidity ?? 0),
      experience: Number(result?.scores?.experience ?? 0),
      collateral: Number(result?.scores?.collateral ?? 0),
      acreage: Number(result?.scores?.acreage ?? 0),
      sba: Number(result?.scores?.sba ?? 0),
    },

    risk: {
      riskScore: Number(result?.risk?.riskScore ?? 0),
      flags: result?.risk?.flags ?? [],
    },

    decision: {
      decision: result?.decision?.decision ?? "REJECT",
      compositeScore: Number(result?.decision?.compositeScore ?? 0),
    },

    recommendations: {
      crops: result?.recommendations?.crops ?? [],
      livestock: result?.recommendations?.livestock ?? [],
      equipment: result?.recommendations?.equipment ?? [],
      vendors: result?.recommendations?.vendors ?? [],
    },
  };
}
