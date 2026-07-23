# FURLONG Intelligence Portal Release Candidate Plan

Status: ACTIVE IMPLEMENTATION
Owner: Ares Farms Inc.
Canonical branch: feature/p2-cloud-run-private

## Product invariant

FURLONG is one subject, one intelligence workspace, one evidence graph, multiple scenarios, one governed recommendation, and one continuing outcome record.

## Release sequence

1. Consolidate the long-running staging branch into one reviewable release candidate.
2. Preserve public, customer, reviewer, partner, and administrator boundaries.
3. Activate production identity, rate limiting, role provisioning, and secret rotation evidence.
4. Run deployed browser acceptance against the exact release candidate.
5. Make the intelligence workspace the canonical customer experience.
6. Add governed orchestration across evidence, scenarios, recommendations, and outcomes.
7. Add outcome reconciliation and calibration.
8. Complete platform launch-authority decisions only after evidence is assembled.

## Intelligence workspace

Every workspace must expose:

- subject identity and ownership;
- verified, inferred, estimated, stale, conflicting, and unknown evidence;
- source authority, license boundary, retrieval time, geography, and provenance;
- scenario comparisons across capital, timing, operations, compliance, and downside;
- unresolved evidence and human decision assignments;
- current recommendation, conditions, supersession, attestations, and release history;
- actual outcomes and variance from the governed recommendation.

## Source-license boundary

A source may be used only for the purposes authorized by its license and governance record. Display-only or agent-support listing data must not silently become individualized recommendation input. Aggregated trends require a non-identifying output and an express permitted-use basis. The orchestrator must fail closed when a requested use exceeds the source boundary.

## Current launch blockers

- Production auth environment not activated.
- Production API rate limiting not activated or tuned.
- Governed-admin-only role provisioning not activated.
- External provider key rotation evidence incomplete.
- Browser-level deployed acceptance incomplete.
- Public domain and production project cutover not authorized.
- Consolidated launch ledger remains incomplete.

## Definition of release-candidate complete

- Full CI and backend verification pass on one commit.
- All migrations applied and runtime verification succeeds.
- Public browser acceptance passes against the deployed revision.
- No stale PR is represented as current authority.
- Production configuration is documented without secrets.
- Rollback, restore, incident, support, and source-failure exercises are evidenced.
