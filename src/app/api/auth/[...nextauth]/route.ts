import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import {
  ensureDurableIdentity,
  normalizeIdentityEmail,
  toPublicUserIdentity,
} from "@/lib/auth/identity";
import { evaluateCredentialAuthPolicy } from "@/lib/auth/authActivationPolicy";
import {
  ensureLocalNextAuthUrl,
  resolveNextAuthSecret,
} from "@/lib/auth/nextAuthSecurity";
import { persistRouteGovernanceEvidence } from "@/lib/governance/routeEvidence";
import { classifyRecord } from "@/lib/runtime/classificationRuntime";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import {
  createRuntimeVersionRef,
  evaluateVersionRuntime,
} from "@/lib/runtime/versionRuntime";

/**
 * NextAuth Credentials Runtime
 *
 * Master Volume Governance:
 * - Vol I: Constitutional Backbone
 *   Binds authenticated user identity to durable tenant authority.
 *
 * - Vol II: Regulatory Governance
 *   Preserves controlled identity/session context for regulated workflows.
 *
 * - Vol III: Technical Infrastructure
 *   Prevents session drift by resolving login credentials through the canonical
 *   durable identity runtime before issuing JWT/session state.
 *
 * - Vol IV: Operational Runbooks
 *   Supports identity recovery, access review, operational support, and audit prep.
 *
 * - Vol V: Canonical Platform Doctrines
 *   Enforces source authority, classification, observability, replay,
 *   version lineage, and governance evidence preservation for login events.
 */

ensureLocalNextAuthUrl();

type CredentialsInput = {
  email?: string | null;
  password?: string | null;
};

function createAuthSessionTraceId(): string {
  return `auth-session-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

async function persistCredentialRejection(
  traceId: string,
  eventType: string,
  message: string,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  const observability = createObservabilityEvent({
    eventType,
    domain: "security",
    severity: "WARN",
    message,
    traceId,
    replayRef: traceId,
    module: "api.auth.nextauth",
    metadata: {
      route: "/api/auth/[...nextauth]",
      ...metadata,
    },
  });

  await persistRouteGovernanceEvidence({
    traceId,
    route: "/api/auth/[...nextauth]",
    operation: "auth.credentials.authorize",
    module: "api.auth.nextauth",
    observability,
    sourceVersion: "nextauth-credentials-runtime-v0.1.0",
    metadata: {
      rejectedBeforeSession: true,
      ...metadata,
    },
  });
}

async function authorizeCredentials(credentials: CredentialsInput | undefined) {
  const traceId = createAuthSessionTraceId();
  const email = normalizeIdentityEmail(credentials?.email);

  if (!email) {
    await persistCredentialRejection(
      traceId,
      "AUTH_CREDENTIAL_EMAIL_MISSING",
      "Credential authorization rejected a request without a valid email."
    );

    return null;
  }

  const credentialPolicy = evaluateCredentialAuthPolicy({
    email,
    password: credentials?.password,
  });

  if (!credentialPolicy.allowed) {
    await persistCredentialRejection(
      traceId,
      "AUTH_CREDENTIAL_POLICY_BLOCKED",
      "Credential authorization was blocked by auth activation policy.",
      {
        mode: credentialPolicy.mode,
        productionLike: credentialPolicy.productionLike,
        failureCode: credentialPolicy.failureCode ?? null,
      }
    );

    return null;
  }

  const runtimeGuard = runRuntimeGuard({
    operation: "auth.credentials.authorize",
    module: "api.auth.nextauth",
    traceId,
    schemaVersion: "nextauth-credentials-v0.1.0",
    governanceVersion: "master-volumes-runtime-v0.1.0",
    classificationLevel: "CONFIDENTIAL",
    replayRef: traceId,
    actorId: email,
    metadata: {
      route: "/api/auth/[...nextauth]",
      credentialsProvider: true,
      credentialAuthMode: credentialPolicy.mode,
    },
  });

  if (!runtimeGuard.allowed) {
    await persistCredentialRejection(
      traceId,
      "AUTH_CREDENTIAL_RUNTIME_BLOCKED",
      "Credential authorization was blocked by runtime governance.",
      {
        findings: runtimeGuard.findings,
      }
    );

    return null;
  }

  const versionRuntime = evaluateVersionRuntime({
    operation: "auth.credentials.authorize",
    module: "api.auth.nextauth",
    traceId,
    versions: [
      createRuntimeVersionRef(
        "schema",
        "nextauth-credentials-v0.1.0",
        "src/app/api/auth/[...nextauth]/route.ts",
        traceId
      ),
      createRuntimeVersionRef(
        "governance",
        "master-volumes-runtime-v0.1.0",
        "Master Volume Series",
        traceId
      ),
      createRuntimeVersionRef(
        "runtime",
        "runtime-enforcement-v0.1.0",
        "src/lib/runtime",
        traceId
      ),
      createRuntimeVersionRef(
        "runtime",
        "governance-evidence-store-v0.1.0",
        "src/lib/governance/evidenceStore.ts",
        traceId
      ),
      createRuntimeVersionRef(
        "api",
        "durable-identity-runtime-v0.1.0",
        "src/lib/auth/identity.ts",
        traceId
      ),
    ],
  });

  const classifiedInput = classifyRecord(
    {
      email,
      credentialsProvider: true,
      credentialAuthMode: credentialPolicy.mode,
    },
    {
      classificationLevel: "CONFIDENTIAL",
      sensitivityScope: "security",
      classificationSource: "api-auth-nextauth-route",
      classificationVersion: "classification-runtime-v0.1.0",
      replayRef: traceId,
      disclosureAudience: ["authorized-operator", "governance"],
      sharingPermissions: ["identity-session-review"],
      aiUsagePermissions: ["classify", "summarize"],
      exportRestrictions: [
        "not-public-user-data",
        "requires-governed-access",
      ],
      redactionRequirements: [
        "redact-user-email-before-public-disclosure",
        "redact-tenant-id-before-public-disclosure",
      ],
      consentRequirements: ["user-session-consent"],
    }
  );

  const identity = await ensureDurableIdentity({
    email,
    role: "user",
    traceId,
    source: "api.auth.nextauth",
    metadata: {
      credentialsProvider: true,
      credentialAuthMode: credentialPolicy.mode,
    },
  });

  const publicUser = toPublicUserIdentity(identity.user);

  const classifiedOutput = classifyRecord(
    {
      user: publicUser,
      created: identity.created,
      sessionReady: true,
    },
    {
      classificationLevel: "CONFIDENTIAL",
      sensitivityScope: "security",
      classificationSource: "api-auth-nextauth-route-output",
      classificationVersion: "classification-runtime-v0.1.0",
      replayRef: traceId,
      disclosureAudience: ["authorized-operator", "governance"],
      sharingPermissions: ["identity-session-review"],
      aiUsagePermissions: ["summarize", "explain"],
      exportRestrictions: [
        "not-public-user-data",
        "requires-governed-access",
      ],
      redactionRequirements: [
        "redact-user-email-before-public-disclosure",
        "redact-tenant-id-before-public-disclosure",
      ],
      consentRequirements: ["user-session-consent"],
    }
  );

  const observability = createObservabilityEvent({
    eventType: identity.created
      ? "AUTH_CREDENTIAL_USER_CREATED"
      : "AUTH_CREDENTIAL_USER_AUTHORIZED",
    domain: "security",
    severity: "INFO",
    message:
      "Credential authorization resolved through durable identity runtime.",
    traceId,
    replayRef: traceId,
    actorId: identity.user.id,
    module: "api.auth.nextauth",
    metadata: {
      userId: identity.user.id,
      tenantId: identity.user.tenantId,
      created: identity.created,
      versionRuntimeOk: versionRuntime.ok,
      durableGovernanceEvidence: true,
      credentialAuthMode: credentialPolicy.mode,
    },
  });

  await persistRouteGovernanceEvidence({
    traceId,
    route: "/api/auth/[...nextauth]",
    operation: "auth.credentials.authorize",
    module: "api.auth.nextauth",
    versionRuntime,
    classifications: [
      {
        resourceType: "auth_credentials_input",
        resourceId: traceId,
        classification: classifiedInput.classification,
        traceId,
        replayRef: traceId,
        metadata: {
          route: "/api/auth/[...nextauth]",
          stage: "input",
        },
      },
      {
        resourceType: "auth_credentials_output",
        resourceId: identity.user.id,
        classification: classifiedOutput.classification,
        traceId,
        replayRef: traceId,
        metadata: {
          route: "/api/auth/[...nextauth]",
          stage: "output",
          created: identity.created,
        },
      },
    ],
    observability,
    sourceVersion: "nextauth-credentials-runtime-v0.1.0",
    result: {
      userId: identity.user.id,
      tenantId: identity.user.tenantId,
      created: identity.created,
      versionRuntimeOk: versionRuntime.ok,
      credentialAuthMode: credentialPolicy.mode,
    },
  });

  return {
    id: identity.user.id,
    email: identity.user.email,
    name: identity.user.name,
    tenantId: identity.user.tenantId,
    role: identity.user.role,
    governanceVersion: identity.user.governanceVersion,
    classification: identity.user.classification,
  };
}

export const authOptions = {
  secret: resolveNextAuthSecret(),
  providers: [
    CredentialsProvider({
      name: "Farm Login",
      credentials: {
        email: {
          label: "Email",
          type: "text",
        },
        password: {
          label: "Password",
          type: "password",
        },
      },
      async authorize(credentials: CredentialsInput | undefined) {
        return authorizeCredentials(credentials);
      },
    }),
  ],
  session: {
    strategy: "jwt" as const,
  },
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id;
        token.tenantId = user.tenantId;
        token.role = user.role;
        token.governanceVersion = user.governanceVersion;
        token.classification = user.classification;
      }

      return token;
    },
    async session({ session, token }: any) {
      if (session.user) {
        session.user.id = token.id;
        session.user.tenantId = token.tenantId;
        session.user.role = token.role;
        session.user.governanceVersion = token.governanceVersion;
        session.user.classification = token.classification;
      }

      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
