import { runDealPipeline } from "../src/services/deals/runDealPipeline";

async function test() {
  const result = await runDealPipeline({
    veteran: true,
    womanOwned: true,
    minorityOwned: false,
    firstTimeFarmer: true,
    creditScore: 720,
    liquidity: 85000,
    experienceLevel: 3,
    collateralEquity: 150000,
    acreage: 25,
  });

  console.log(JSON.stringify(result, null, 2));
}

test();
