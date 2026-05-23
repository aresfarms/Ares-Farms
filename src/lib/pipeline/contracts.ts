export type PipelineResult = {
  userId: string;
  name: string;

  scores: {
    credit: number;
    liquidity: number;
    experience: number;
    collateral: number;
    acreage: number;
    sba: number;
  };

  risk: {
    riskScore: number;
  };

  decision: {
    decision: "APPROVE" | "REVIEW" | "REJECT";
    compositeScore: number;
  };

  recommendations: {
    crops: string[];
    livestock: string[];
    equipment: string[];
    vendors: string[];
  };

  meta: {
    systemVersion: string;
    pipelineVersion: string;
    schemaVersion: string;
  };
};
