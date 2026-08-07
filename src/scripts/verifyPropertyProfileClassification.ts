import assert from "node:assert/strict";
import { classifyPropertyProfile } from "@/lib/property/propertyProfile";

const cases = [
  { name: "small residence", input: { propertyType: "single family residence", acreageText: "0.5 acres" }, expected: "residential" },
  { name: "twenty acre agricultural default", input: { propertyType: "residence with barn", acreageText: "20 acres" }, expected: "farm" },
  { name: "large agricultural parcel", input: { propertyType: "country property", acreageText: "500 acres" }, expected: "farm" },
  { name: "warehouse overrides acreage", input: { propertyType: "industrial warehouse", acreageText: "40 acres" }, expected: "commercial" },
  { name: "hotel overrides acreage", input: { propertyType: "hotel and conference center", acreageText: "35 acres" }, expected: "hospitality" },
  { name: "vacant land remains land", input: { propertyType: "vacant unimproved land", acreageText: "80 acres" }, expected: "land" },
  { name: "mobile home park is specific", input: { propertyType: "manufactured housing community", acreageText: "30 acres" }, expected: "mobile-home-park" },
] as const;

for (const testCase of cases) {
  const actual = classifyPropertyProfile(testCase.input).id;
  assert.equal(actual, testCase.expected, `${testCase.name}: expected ${testCase.expected}, got ${actual}`);
}

console.log(JSON.stringify({ ok: true, rule: "PROPERTY-PROFILE-AUTO-CLASSIFICATION-001", cases: cases.map(({ name, expected }) => ({ name, expected })) }, null, 2));
