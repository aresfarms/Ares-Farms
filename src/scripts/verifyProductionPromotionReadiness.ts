import {
  PRODUCTION_PROMOTION_READINESS_RULE,
  buildProductionPromotionReadinessPacket,
} from "@/lib/governance/productionPromotionReadiness";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const base = {
  serviceUrl: "https://furlong-core.example.run.app",
  stableUrl: "https://stable---furlong-core.example.run.app",
  apiAuthEnforcement: "required",
  rateLimitingEnabled: "true",
  rateLimitWindowSeconds: "60",
  rateLimitMax: "100",
  credentialsMode: "email-allowlist",
  credentialAllowlistConfigured: true,
  roleProvisioningMode: "governed-admin-only",
  secretBindings: [
    { envName: "DATABASE_URL", secretName: "DATABASE_URL", version: "latest" },
    { envName: "NEXTAUTH_SECRET", secretName: "NEXTAUTH_SECRET", version: "latest" },
    { envName: "AUTH_CREDENTIAL_SHARED_SECRET", secretName: "AUTH_CREDENTIAL_SHARED_SECRET", version: "latest" },
  ],
  requiredSecretNames: ["DATABASE_URL", "NEXTAUTH_SECRET", "AUTH_CREDENTIAL_SHARED_SECRET"],
  iapProtected: true,
  releaseBoardApproved: false,
  constitutionalAuthorityApproved: false,
  qualifiedReleaseManagerApproved: false,
  finalActivationApproved: false,
};

const ready = buildProductionPromotionReadinessPacket(base);
assert(ready.technicalPerimeterReady, "Complete technical perimeter must be ready.");
assert(ready.status === "READY_FOR_HUMAN_PROMOTION_DECISION", "Technically ready posture must await human decision.");
assert(!ready.finalPromotionAuthorized && !ready.liveActionAuthorityGranted, "Readiness packet must never grant final authority.");
assert(ready.blockers.includes("release-board-approval"), "Human release approval must remain explicit.");

const noAllowlist = buildProductionPromotionReadinessPacket({ ...base, credentialAllowlistConfigured: false });
assert(!noAllowlist.technicalPerimeterReady, "Missing allowlist must block technical readiness.");

const plaintextLike = buildProductionPromotionReadinessPacket({
  ...base,
  secretBindings: [{ envName: "DATABASE_URL", secretName: "other-secret", version: "latest" }],
});
assert(!plaintextLike.technicalPerimeterReady, "Mismatched secret bindings must block readiness.");

console.log(JSON.stringify({
  ok: true,
  rule: PRODUCTION_PROMOTION_READINESS_RULE,
  technicalPerimeterCanBecomeReady: true,
  credentialAllowlistRequired: true,
  secretReferencesRequired: true,
  humanAuthorityStillRequired: true,
  finalPromotionAuthorized: false,
}, null, 2));
