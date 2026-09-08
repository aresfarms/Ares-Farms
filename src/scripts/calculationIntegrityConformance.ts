import { buildDraftProformaInput } from "@/lib/pdf/draftProformaFromProperty";
import { normalizeMarylandSales } from "@/lib/property/governmentComparableNetwork";
import assert from "node:assert/strict";
import { annualLevelDebtService, principalFromAnnualDebtService, debtCoverage, transactionPrice, remainingLoanBalance, parseScenarioNumber, incomeCapScenario } from "@/lib/property/calculationMath";
import { calculatePropertyOperatingModel, type PropertyOperatingModelInput } from "@/lib/property/propertyOperatingModel";
import { buildAgriculturalProForma, defaultAgriculturalProFormaInputs } from "@/lib/property/agriculturalProForma";
import { estimateHazardRebuild } from "@/lib/property/hazardRebuildEstimate";
import { modelCommercialUses } from "@/lib/property/commercialUseModel";
const close = (actual: number, expected: number, tolerance = 0.01) => assert(Math.abs(actual - expected) <= tolerance, actual + " differs from " + expected);
// Independent amortization oracle: repeated interest accrual and payment,
// bisection on ending balance; no reuse of the production payment formula.
function oracle(principal: number, ratePct: number, years: number, frequency: 1|12) {
 const balance = (payment: number) => { let b = principal; for(let i=0;i<years*frequency;i++) b=b*(1+ratePct/100/frequency)-payment; return b; };
 let low=0,high=principal*(1+ratePct/100);
 for(let i=0;i<100;i++){const mid=(low+high)/2;if(balance(mid)>0)low=mid;else high=mid;}
 return (low+high)/2*frequency;
}
assert.equal(parseScenarioNumber(""), null); assert.equal(parseScenarioNumber(" "), null);
assert.equal(parseScenarioNumber("broken"), null); assert.equal(parseScenarioNumber("0"), 0);
assert.equal(parseScenarioNumber("1,234.50"), 1234.5);
assert.equal(incomeCapScenario(null, 6, 8), null); assert.equal(incomeCapScenario(100000, 0, 8), null);
assert.equal(incomeCapScenario(120000, 6, 8)?.lowUsd, 1500000);
assert.equal(incomeCapScenario(120000, 6, 8)?.highUsd, 2000000);
assert.equal(incomeCapScenario(120000, 6, 8)?.role, "user-assumption-scenario");
let paymentCases = 0;
for(const frequency of [1,12] as const) for(const years of [1,25,40]) for(const rate of [0,0.001,6,30]) {
 const annual=annualLevelDebtService(350000,rate,years,frequency)!;
 close(annual,oracle(350000,rate,years,frequency));
 close(principalFromAnnualDebtService(annual,rate,years,frequency)!,350000);
 let balance = 350000;
 for (let i=0; i<years*frequency; i++) {
   close(remainingLoanBalance(350000,rate,years,i,frequency)!, balance, 0.01);
   balance=balance*(1+rate/100/frequency)-annual/frequency;
 }
 close(remainingLoanBalance(350000,rate,years,years*frequency,frequency)!,0);
 paymentCases++;
}
assert.equal(annualLevelDebtService(0,6,30,12),0);
assert.equal(annualLevelDebtService(-1,6,30,12),null);
assert.equal(annualLevelDebtService(100000,-1,30,12),null);
assert.equal(annualLevelDebtService(100000,6,0,12),null);
assert.equal(annualLevelDebtService(Infinity,6,30,12),null);
assert.equal(debtCoverage(0,1000),0); assert.equal(debtCoverage(-500,1000),-0.5);
assert.equal(debtCoverage(500,0),null); assert.equal(debtCoverage(null,1000),null);
assert.equal(transactionPrice(Infinity),null);assert.equal(transactionPrice(-1),null);
const modelInput: PropertyOperatingModelInput = {useType:"other_units",revenueCadence:"monthly",unitCount:10,
 occupancyPct:100,averageUnitRevenue:1000,ancillaryRevenueMonthly:0,replacementReservePct:10,
 expenses:{payrollMonthly:1000,utilitiesMonthly:0,insuranceMonthly:0,propertyTaxMonthly:0,maintenanceHousekeepingMonthly:0,foodServicesMonthly:0,managementMarketingMonthly:0,licensingOtherMonthly:0},
 acquisitionPrice:100000,conversionCapex:0,professionalSoftCost:0,contingencyPct:0,loanAmount:100000,interestRatePct:6,amortizationYears:30,targetDscr:1.25};
const full=calculatePropertyOperatingModel(modelInput);
assert.equal(full.annualRevenue,120000);assert.equal(full.annualOperatingExpenses,24000);assert.equal(full.noi,96000);
close(full.annualDebtService!,oracle(100000,6,30,12),0.51);
const incomplete=calculatePropertyOperatingModel({...modelInput,expenses:{...modelInput.expenses,payrollMonthly:null}});
assert.equal(incomplete.noi,null);assert.equal(incomplete.annualOperatingExpenses,null);assert(incomplete.sensitivity.every(row=>row.noi==null));assert.equal(incomplete.dscr,null);assert.equal(incomplete.coveragePosture,"NEEDS_EVIDENCE");assert.equal(incomplete.maxLoanSupportedAtTarget,null);
assert.equal(calculatePropertyOperatingModel({...modelInput,interestRatePct:null}).annualDebtService,null);
assert.equal(calculatePropertyOperatingModel({...modelInput,interestRatePct:0}).annualDebtService,3333);
assert.equal(calculatePropertyOperatingModel({...modelInput,acquisitionPrice:null}).totalProjectCost,null);
const loss=calculatePropertyOperatingModel({...modelInput,expenses:{...modelInput.expenses,payrollMonthly:15000}});
assert(loss.noi!=null && loss.noi<0 && loss.dscr!<0);assert.equal(loss.coveragePosture,"SHORT");
const noOccupancy=calculatePropertyOperatingModel({...modelInput,occupancyPct:0});
assert.equal(noOccupancy.annualRevenue,0);assert(!noOccupancy.missingInputs.includes("stabilized occupancy assumption"));
const farmInput=defaultAgriculturalProFormaInputs({tractAcres:100,purchasePrice:400000,annualRatePct:6});
assert.equal(buildAgriculturalProForma(farmInput).debt.cashRentDscrLow,null);
const leased=buildAgriculturalProForma({...farmInput,cashRentOwnerCostsAnnual:10000});
close(leased.debt.cashRentDscrLow!, (leased.revenue.cashRentLow-10000)/leased.debt.annualDebtService,1e-10);
assert.throws(()=>buildAgriculturalProForma({...farmInput,tillablePct:101}),RangeError);
assert.throws(()=>buildAgriculturalProForma({...farmInput,amortizationYears:0}),RangeError);
assert.throws(()=>buildAgriculturalProForma({...farmInput,cornPrice:NaN}),RangeError);
const rebuildInput={squareFeet:2000,squareFeetVerified:true,asOfYear:2026};
assert.equal(estimateHazardRebuild(rebuildInput).rebuildLowUsd,null);
const rebuild=estimateHazardRebuild({...rebuildInput,costEvidence:{lowPerSqft:200,highPerSqft:250,sourceRef:"fixture-site-estimator",asOfYear:2026,includesSiteHazards:true}});
assert.equal(rebuild.rebuildLowUsd,400000);assert.equal(rebuild.rebuildHighUsd,500000);assert.equal(rebuild.totalPremiumPct,0);
assert.equal(estimateHazardRebuild({...rebuildInput,asOfYear:2027,costEvidence:{lowPerSqft:200,highPerSqft:250,sourceRef:"fixture-site-estimator",asOfYear:2026,includesSiteHazards:true}}).status,"unavailable");
const commercial=modelCommercialUses({zoning:"commercial",landUse:"office",squareFeet:10000,town:"Test",screeningPrice:1000000,benchRatePct:6});
assert(commercial.uses.every(use=>use.noiMid==null&&use.dscr==null));
assert.equal(commercial.bestSupportedUse,null);
const draftArgs={propertyTitle:"Fixture",exactAddress:null,county:null,state:"MD",lane:"B" as const,generationDate:"2026-09-08",acquisitionPrice:400000,acreage:59.34,fsaRatePct:6,valuationNote:"Fixture asking price",revenueUnits:[]};
const blankDraft=buildDraftProformaInput(draftArgs);
assert.equal(blankDraft.partIV.twoCase.dscrStandalone.conservative,"Operating evidence pending");
const missingPrice=buildDraftProformaInput({...draftArgs,acquisitionPrice:null,additionalProperties:[{title:"Other",location:null,price:200000}]});
assert.match(missingPrice.partIV.twoCase.debtService,/Requires acquisition price/);
const rows=[{JURSCODE:"CARO",ACCTID:"a",TRADATE:"20260601",CONSIDR1:500000,DR1LIBER:"1",DR1FOLIO:"2",ADDRESS:"1 Test",PREMCITY:"Test",PREMZIP:"21632"}, {JURSCODE:"CARO",ACCTID:"b",TRADATE:"20260601",CONSIDR1:500000,DR1LIBER:"1",DR1FOLIO:"2",ADDRESS:"2 Test",PREMCITY:"Test",PREMZIP:"21632"}];
const transfers=normalizeMarylandSales(rows,null,"2026-09-08","https://example.gov");
assert.equal(transfers.length,2); assert(transfers.every(t=>t.reviewRequired.some(note=>/Multiple parcel/.test(note))));
assert.equal(normalizeMarylandSales([{...rows[0],TRADATE:"20270101"}],null,"2026-09-08","https://example.gov").length,0);
assert.equal(normalizeMarylandSales([{...rows[0],CONSIDR1:0}],null,"2026-09-08","https://example.gov").length,0);
assert.equal(normalizeMarylandSales([rows[0]],"a","2026-09-08","https://example.gov").length,0);
console.log(JSON.stringify({ok:true,rule:"CALCULATION-NUMERIC-INTEGRITY-001",independentPaymentCases:paymentCases,zeroDistinctFromMissing:true,lossesNotClampedToZero:true,leaseGrossNotNoi:true,genericConstructionAndRentNotEvidence:true}));
