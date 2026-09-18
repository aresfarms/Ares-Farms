/**
 * SEC-FORENSICS-001 Pass 02 verifier (evidence only — closes nothing).
 *
 * The owner attested (2026-06-14) that logging-bucket-locked exists and the three
 * sinks (furlong-forensics-runtime-logs / api-logs / deployment-events) are
 * present, enabled, and routed to that bucket. The build agent has NO GCP access
 * and cannot itself observe a sink — so this asserts the GOVERNANCE invariants:
 *
 *  - the owner attestation is recorded for all three Cloud-Logging classes,
 *  - existence + locked-destination are attested, but the attestation is NOT yet
 *    COMPLETE (filter-match / >=400d retention / writer IAM / test-event / export
 *    / owner-side evidence file are still outstanding),
 *  - therefore the three classes stay wired:false (not wiring-eligible),
 *  - the human-review gate is false, so forensicReadinessVerified() is false,
 *  - SEC-FORENSICS-001 cannot auto-close from wiring alone.
 */
import {
  CLOUD_LOGGING_CLASSES,
  PRESERVATION_SOURCES,
  SINK_OWNER_ATTESTATIONS,
  EXPORT_SINK_CONTRACT,
  sinkAttestationComplete,
  sinkAttestationGaps,
  FORENSIC_READINESS_HUMAN_REVIEW_COMPLETE,
  forensicReadinessVerified,
  forensicReadinessStatus,
} from "@/security/forensicPreservation";

const fail: string[] = [];
const ok = (c: boolean, m: string) => { console.log(`${c ? "✓" : "✗"} ${m}`); if (!c) fail.push(m); };

for (const c of CLOUD_LOGGING_CLASSES) {
  const a = SINK_OWNER_ATTESTATIONS[c];
  // attestation recorded + names match the contract
  ok(!!a && a.attested_on === "2026-06-14", `${c}: owner attestation recorded (2026-06-14)`);
  ok(a.sink_name === EXPORT_SINK_CONTRACT[c].sink_name, `${c}: attested sink name matches contract (${a.sink_name})`);
  // what the owner DID attest
  ok(a.sink_exists === true, `${c}: owner attests sink exists`);
  ok(a.destination_immutable_or_locked === true, `${c}: owner attests routed to locked/immutable destination`);
  // attestation is NOT yet complete → not wiring-eligible → stays unwired
  ok(sinkAttestationComplete(c) === false, `${c}: attestation INCOMPLETE — not wiring-eligible (gaps: ${sinkAttestationGaps(c).join(", ")})`);
  ok(PRESERVATION_SOURCES[c].wired === false, `${c}: stays wired:false (cannot mark wired on partial attestation)`);
}

// human-review gate + overall blocker invariant
ok(FORENSIC_READINESS_HUMAN_REVIEW_COMPLETE === false, "human-review gate is false (no signoff recorded)");
ok(forensicReadinessVerified() === false, "forensicReadinessVerified()=false — wiring alone cannot close SEC-FORENSICS-001");
const s = forensicReadinessStatus();
ok(s.wired === 3, `still 3/6 classes wired (got ${s.wired})`);

if (fail.length) { console.error(`\n✗ verify:forensic-pass02 FAIL — ${fail.length}`); process.exit(1); }
console.log("\n✓ verify:forensic-pass02 PASS — owner sink attestation recorded; existence + locked destination attested; attestation incomplete so the 3 Cloud-Logging classes stay wired:false; human-review gate false; forensicReadinessVerified()=false. EVIDENCE ONLY — SEC-FORENSICS-001 stays OPEN, no auto-close.");
process.exit(0);
