import { z } from "zod";

export const ApplicantSchema = z.object({
  tenantId: z.string().optional(),

  creditScore: z.number().min(0).max(850),
  liquidity: z.number().min(0),
  experienceLevel: z.number().min(0).max(10),
  collateralEquity: z.number().min(0),
  acreage: z.number().min(0),
});
