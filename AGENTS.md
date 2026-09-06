<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Ares/Furlong Master Volume Build Rules

The governing source of truth for this build is the Master Volume Series in:

`/Users/caitlinhudson/Documents/Master Build Volume Documents 05-2026/`

Authoritative files:

- `Furlong_Volume_0_Platform_Orientation.pdf`
- `Ares_Volume_I_Constitutional_Backbone_Master.pdf`
- `Ares_Volume_II_Regulatory_Governance_Master.pdf`
- `Ares_Volume_III_Technical_Infrastructure_Master.pdf`
- `Ares_Volume_III_B_Governance_Runtime_Master.pdf`
- `Ares_Volume_IV_Operational_Runbooks_Master.pdf`
- `Ares_Volume_V_Canonical_Doctrines_Master.pdf`
- `Ares_Master_Cross_Reference_Index.pdf`

## Non-Negotiable Build Protocol

1. Treat the Master Volume PDFs as authoritative requirements for the entire build.
2. Use `Ares_Master_Cross_Reference_Index.pdf` before technical work:
   - building a technical component uses Part 3,
   - working with canonical systems uses Part 5,
   - writing or executing runbooks uses Part 4,
   - regulatory compliance checks use Part 6.
3. Backend foundation completion is a hard gate. Do not build new borrower-facing, lender-facing, sponsor-facing, admin-facing, or product modules until the backend governance spine is complete enough for that module.
4. Do not drift from the current module. No unrelated refactors, no opportunistic feature work, and no silent architecture changes.
5. All code/script changes must be delivered as full-file replacements. Do not provide final instructions that tell the user to replace one line or patch a fragment.
6. Preserve Master Volume traceability in governed modules using explicit references to the controlling volume, section, doctrine, runtime, and replay obligations.
7. Every backend module that writes, transforms, classifies, explains, versions, observes, or replays institutional state must include the governance substrate first: runtime guard, version lineage, classification, explainability when applicable, observability, replay reference, and audit-safe output.
8. Schema singularity is mandatory. Use the canonical schema barrel and do not create competing schema sources.
9. Replay safety is a deployment gate. New material behavior must be deterministic, versioned, traceable, and reconstructable.
10. Human-readable instructions for Caitlin are required with each build step. Assume the operator is an environmental engineer, not a software engineer.
11. Truth over agreement is a hard rule. Never echo, flatter, validate, or adopt Caitlin's stated preference merely because she stated it. Give the conclusion best supported by the product evidence, governing sources, research, and observed behavior even when it contradicts her proposal. Identify conflicting prior decisions, weak premises, material tradeoffs, uncertainty, and adverse implications plainly. Recommend against a requested direction when the evidence warrants it; never manufacture certainty or agreement.
12. Verification is required before declaring a step complete. At minimum run `npm run build` and `npx tsc --noEmit` when TypeScript/application code changes.

## Backend-First Completion Gate

Before new product modules are built, the backend must have:

- one canonical schema source under `src/db/schema/`,
- real schema registry, version registry, classification registry, observability, and replay verification tables,
- duplicate legacy schema paths converted to compatibility bridges only,
- durable audit, ledger, replay, version, classification, observability, entitlement, and connector evidence where the build phase requires persistence,
- runtime guard coverage for material API routes and services,
- version lineage on governed outputs,
- classification propagation on governed inputs and outputs,
- observability events for material actions and failures,
- replay references on state-changing or decision-adjacent actions,
- audit-safe errors and human-review boundaries,
- passing `npm run build` and `npx tsc --noEmit`.

Frontend work is allowed only when it supports backend verification or displays already-governed backend behavior.

## Required Response Shape For Build Steps

When giving implementation instructions, include:

- what file is being replaced,
- why the replacement is required under the Master Volumes,
- the entire replacement file or a statement that the replacement has already been applied,
- exact commands to run,
- what successful output means,
- what to do if the command fails.
