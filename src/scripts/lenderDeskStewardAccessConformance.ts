import assert from "node:assert/strict";
import fs from "node:fs";

import {
  canOperateLenderDesk,
  internalLenderDeskRole,
} from "@/lib/auth/operatorRegistry";

assert.equal(canOperateLenderDesk("sfraas@aresfarmsinc.com"), true);
assert.equal(canOperateLenderDesk("chudson@aresfarmsinc.com"), false);
assert.equal(canOperateLenderDesk("frances@aresfarmsinc.com"), false);
assert.equal(
  internalLenderDeskRole("sfraas@aresfarmsinc.com", "staging"),
  "lender",
);
assert.equal(
  internalLenderDeskRole("sfraas@aresfarmsinc.com", "development"),
  "lender",
);
assert.equal(
  internalLenderDeskRole("sfraas@aresfarmsinc.com", "production"),
  null,
  "Production must require verified professional authority rather than the staging steward bridge.",
);

const authRoute = fs.readFileSync(
  "src/app/api/auth/[...nextauth]/route.ts",
  "utf8",
);
const proxy = fs.readFileSync("src/proxy.ts", "utf8");
const dealDesk = fs.readFileSync(
  "src/app/api/lender/deal-desk/route.ts",
  "utf8",
);
const setupPage = fs.readFileSync(
  "src/app/(public)/broker-setup/page.tsx",
  "utf8",
);

assert(authRoute.includes("const professional = internalOperator ? null"));
assert(proxy.includes("lenderDeskOperatorRole"));
assert(dealDesk.includes("internalLenderDeskRole(email)"));
assert(dealDesk.includes("externalNotificationSuppressed: syntheticDeal"));
assert(setupPage.includes("Windows Hello"));

console.log(
  JSON.stringify(
    {
      ok: true,
      operator: "sfraas@aresfarmsinc.com",
      stagingRole: "lender",
      productionBridgeDisabled: true,
      phishingResistantMfa: "Windows Hello passkey",
      syntheticExternalNotificationsSuppressed: true,
    },
    null,
    2,
  ),
);
