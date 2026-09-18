# OPS-LENDER-SUBMISSION-001

1. Open a case and freeze a deterministic package.
2. A human reviews the preview. Changes create a new package version.
3. Capture customer consent for the exact manifest.
4. Verify the lender recipient out of band; store only its fingerprint and verification evidence.
5. Run all dispatch gates. Any non-PASS result stops the workflow.
6. Exercise `sandbox-v1` with one idempotency key. Retry only a declared transient-safe failure, never more than five attempts.
7. Treat UNKNOWN as reconciliation required; do not resend.
8. Compare replayed status with append-only attempts and receipts.
9. Stop for human review. Production delivery remains blocked until a separately approved promotion package exists.
