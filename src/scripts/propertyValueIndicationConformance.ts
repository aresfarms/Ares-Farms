import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { indicateMarketValue, type ClosedSaleComparable } from "@/lib/property/marketValueIndication";
import { resolveListingPrice } from "@/lib/property/listingPriceEvidence";
import { findGovernedListingSnapshot } from "@/lib/property/governedListingSnapshot";
const asOf = "2026-09-08", subjectId = "fixture-subject";
const tax = indicateMarketValue({assessedTotalValue:500000,assessmentAsOf:"202301",stateCode:"MD",propertyType:"single family residential home", knownPriceUsd:575000,knownPriceLabel:"Asking price"});
assert.equal(tax.status,"context-only");
assert.equal(tax.midUsd,null); assert.equal(tax.lowUsd,null); assert.equal(tax.highUsd,null); assert.equal(tax.divergence,null);
const farm = indicateMarketValue({stateCode:"MD",propertyType:"working farm",acreage:60});
assert.equal(farm.status,"context-only"); assert.equal(farm.midUsd,null);
for (const propertyType of ["vacant land","hotel","residential"]) {
 const result=indicateMarketValue({propertyType,assessedTotalValue:629000,knownPriceUsd:2500000});
 assert.equal(result.midUsd,null,"Neither asking price nor assessment alone creates a market opinion.");
}
const comps: ClosedSaleComparable[] = [550000,600000,650000].map((amount,i)=>({
 id:"fixture-comp-"+i, transactionId:"fixture-deed-"+i, subjectId, salePriceUsd:amount-10000, adjustedIndicationUsd:amount,
 saleDate:"2026-06-01", adjustmentBasis:"Fixture documented condition adjustment +10000",
 sourceName:"Fixture recorded sale",sourceUrl:"https://example.gov/record/"+i,verified:true,armLengthVerified:true,
}));
const screen=(c:ClosedSaleComparable[])=>indicateMarketValue({propertyType:"residential",asOf,subjectId,closedSaleComparables:c});
const valid=screen(comps);
assert.equal(valid.methodCode,"sales-comparison-screen"); assert.equal(valid.midUsd,600000); assert.equal(valid.lowUsd,550000); assert.equal(valid.highUsd,650000);
assert.equal(screen(comps.slice(0,2)).midUsd,null);
assert.equal(screen([comps[0],comps[0],comps[1]]).midUsd,null,"One deed is one sale.");
assert.equal(screen([...comps,{...comps[0],adjustedIndicationUsd:990000}]).midUsd,null,"Conflicting duplicate is quarantined.");
for (const change of [{saleDate:"2027-01-01"},{saleDate:"2020-01-01"},{saleDate:"2026-02-30"},{saleDate:"invalid"},{subjectId:"other"},{armLengthVerified:false},{adjustmentBasis:""},{sourceUrl:""},{adjustedIndicationUsd:Infinity}]) {
 assert.equal(screen([{...comps[0],...change},...comps.slice(1)]).midUsd,null,JSON.stringify(change));
}
const incomeArgs={propertyType:"hotel",noiAnnual:500000,capRateLowPct:8,capRateHighPct:10};
assert.equal(indicateMarketValue(incomeArgs).midUsd,null,"Typed cap rates do not establish market evidence.");
const income=indicateMarketValue({...incomeArgs,incomeEvidenceRef:"fixture-property-noi",capRateEvidenceRef:"fixture-market-cap-review"});
assert.equal(income.lowUsd,5000000); assert.equal(income.highUsd,6250000); assert.equal(income.midUsd,5556000);
const listing={subjectAddress:"3835 Seippes Road Federalsburg MD 21632",sourceAddress:"3835 Seippes Rd Federalsburg MD 21632",sourceName:"Fixture approved broker feed",sourceUrl:"https://example.gov/listing",observedAt:"2026-09-07",asOf,price:750000,status:"Active",approved:true,priceKind:"asking" as const};
assert.equal(resolveListingPrice(listing).amountUsd,750000);
for (const change of [{observedAt:"2026-04-01"},{observedAt:"2027-01-01"},{approved:false},{sourceAddress:"3835 Seippes Rd"},{sourceAddress:"3835 Seippes Rd Unit 2 Federalsburg MD 21632"},{status:"Sold"},{status:"Pending"},{priceKind:"assessment" as const},{priceKind:"auction-bid" as const},{price:Infinity}]) assert.equal(resolveListingPrice({...listing,...change}).amountUsd,null,JSON.stringify(change));
assert.equal(findGovernedListingSnapshot("18885"),null);
assert.equal(findGovernedListingSnapshot("18885 Sand Hill Road Georgetown DE 19947",asOf)?.askingPrice,null);
const chassis=readFileSync("src/components/property/lanes/GovernedLaneChassis.tsx","utf8");
assert(chassis.includes("Comparable evidence pending") && chassis.includes("record.propertyValueScreen"));
assert(!chassis.includes("const valuation = indicateMarketValue"));
const pdf=readFileSync("src/lib/pdf/generatePropertyEvaluationPdf.ts","utf8");
assert(pdf.includes("Comparable evidence pending") && pdf.includes("input.propertyValueScreen"));
const workspace=readFileSync("src/components/property/PropertyEvaluationWorkspace.tsx","utf8");
assert(workspace.includes("residentialBasisPrice = effectiveListedPrice"));
console.log(JSON.stringify({ok:true,rule:"VALUATION-INTEGRITY-002",assessmentAndStateAverageContextOnly:true,threeDistinctRecentReviewedCompsRequired:true,median:valid.midUsd,askingPriceFreshExactAndApproved:true,webAndExportUseCanonicalOutput:true}));
