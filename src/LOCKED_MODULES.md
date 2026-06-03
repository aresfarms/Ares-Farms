cat > src/LOCKED_MODULES.md << 'EOF'
LOCKED BASELINE (DO NOT MODIFY)

System Flow
INPUT → VALIDATION → SCORING → DECISION → RESPONSE

Modules Locked
- src/lib/validation/applySchema.ts
- src/app/api/apply/route.ts
- src/services/scoring/scoringEngine.ts
- src/services/decision/decisionEngine.ts

Output Contract
Must always return:
tenantId
decision
scores
policyVersion

Rules
No changes to locked files unless explicitly instructed as a new module step
No partial edits
No unplanned modifications
EOF
