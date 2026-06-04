# Build 23 — Connector Certification v2

Connector Certification v2 is the ninth downstream consumer of the
Universal Capital Graph (Build 13) and the Customer Type Registry
(Build 14), composed on top of Builds 15–22. It joins:

- The legacy v1 `evaluateConnectorCertification` runtime (5
  per-connector dimensions: review, certification_evidence,
  rollback, monitoring, activation_checks) as an additive
  compatibility bridge.
- Three new v2 governed alignment dimensions derived from Registry
  Framework v2:
  - `capital_graph_connector_alignment`
  - `customer_type_connector_alignment`
  - `certification_posture_alignment`
- Cross-source conflicts (v1 certified vs v2 blocked, upstream RF v2
  conflict propagation, v1 live-execution-blocked posture).

Live external connector execution remains blocked until qualified
approval through the Source Promotion Authority, the Controlled
Promotion Board, the Live Scraper Activation Gate, and any other
gates named in the participant role registry.

Version lineage:
`connector-certification-v2-runtime-v0.1.0` → RF v2 → CE v2 → EE v2
→ AI v2 → LWF v2 → OD v2 → FPE v2 → RI v2 → Customer Type → Capital
Graph → v1 connector certification.

Module manifest, RESTRICTED event contract
`governance.connector.certification.v2.composed`, 19 governed
handoffs.
