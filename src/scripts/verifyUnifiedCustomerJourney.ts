import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

const copy = read("src/lib/public-content/publicCopyRegistry.ts");
assert.ok(copy.includes("See what works before you buy or apply."), "homepage must use outcome-first, non-promissory positioning");
assert.ok(copy.includes("You choose who receives anything."), "financing copy must preserve customer-controlled handoff");

const portal = read("src/app/portal/borrower/page.tsx");
assert.ok(portal.includes("MyFurlongDashboard"), "borrower portal must resolve to the continuing My Furlong relationship");

const workspace = read("src/components/property/PropertyEvaluationWorkspace.tsx");
assert.ok(workspace.includes('current="understand"'), "property workspace must identify the Understand stage");
assert.ok(workspace.includes("/provider-compare"), "property analysis must route to neutral public provider comparison");
assert.ok(!workspace.includes("Bring the whole picture to the licensed lending desk"), "property analysis must not steer to one favored desk");

const network = read("src/app/(public)/provider-compare/page.tsx");
assert.ok(network.includes("If a published box is not verified"), "network must fail closed instead of manufacturing a match");
assert.ok(/paid rank|pay-to-rank|increase a provider.s score or rank/i.test(network), "network must explain economic neutrality");

const caseRoom = read("src/app/lender-submissions/page.tsx");
for (const phrase of ["one package version", "one provider", "one verified recipient", "Revocation and expiry fail closed"]) {
  assert.ok(caseRoom.includes(phrase), `case-room copy missing: ${phrase}`);
}

assert.ok(read("src/app/portfolio/page.tsx").includes('redirect("/portal/borrower")'), "legacy demo portfolio must not remain a customer destination");

const publicRoot = join(root, "src/app/(public)");
function walk(path: string): string[] {
  return readdirSync(path).flatMap((name) => {
    const full = join(path, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}
const publicCode = walk(publicRoot).filter((path) => /\.(ts|tsx)$/.test(path)).map((path) => readFileSync(path, "utf8")).join("\n");
assert.equal(/\/api\/(?:stripe\/)?checkout/.test(publicCode), false, "core public customer surfaces must not launch payment checkout");

console.log(JSON.stringify({ ok: true, rule: "FURLONG-UNIFIED-CUSTOMER-JOURNEY-001", stages: ["Explore", "Understand", "Prepare", "Finance", "Operate"], myFurlong: true, neutralCapitalNetwork: true, exactPackageCaseRoom: true, publicCheckout: false }, null, 2));
