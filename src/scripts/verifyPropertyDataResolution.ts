import fs from "node:fs";
import path from "node:path";
import { COUNTY_COLLEGE_BRANCHES } from "@/lib/property/countyCollegeBranchesCurated";

const root = process.cwd();
const commandCenter = fs.readFileSync(path.join(root, "src/components/property/lanes/GovernedLaneChassis.tsx"), "utf8");
const propertyRoute = fs.readFileSync(path.join(root, "src/app/api/public/property-facts/route.ts"), "utf8");
const failures: string[] = [];
if (!COUNTY_COLLEGE_BRANCHES["10005"]?.some((item) => /Owens Campus/.test(item.name))) failures.push("Sussex County branch-campus correction is missing.");
if (!commandCenter.includes("suppressResolvedUnknowns")) failures.push("Verified facts do not suppress duplicate unresolved guidance.");
if (!commandCenter.includes("Something Furlong missed?")) failures.push("Owner correction loop is missing.");
if (!commandCenter.includes("Owner-reported property features")) failures.push("Owner assertions are not visually separated from verified facts.");
if (!propertyRoute.includes('label: "Associated parcels"')) failures.push("Canonical parcel count is not promoted into the property brief.");
if (!propertyRoute.includes('label: "Recorded deed"')) failures.push("Deed metadata is not promoted into verified facts.");
if (!propertyRoute.includes('label: "Size"')) failures.push("Matched source size is not promoted into the property brief.");
if (failures.length) { console.error(JSON.stringify({ ok: false, rule: "PROPERTY-DATA-RESOLUTION-001", failures }, null, 2)); process.exit(1); }
console.log(JSON.stringify({ ok: true, rule: "PROPERTY-DATA-RESOLUTION-001", branchCampuses: true, resolvedUnknownSuppression: true, parcelAndSizeFacts: true, ownerAssertionsSeparated: true, deedMetadata: true }, null, 2));
