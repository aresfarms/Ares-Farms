import { protectJourneyState, verifyJourneyState } from "@/lib/navigator/journeyIntegrity";
import { FRESH_JOURNEY, type JourneyState } from "@/lib/navigator/narrativeInterpreter";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const protectedJourney = protectJourneyState(structuredClone(FRESH_JOURNEY));
assert(verifyJourneyState(protectedJourney), "Server-protected Navigator state must verify.");

const reordered = Object.fromEntries(
  Object.entries(protectedJourney).reverse(),
) as unknown as JourneyState;
assert(verifyJourneyState(reordered), "Object key order must not affect verification.");

const tamperedGate = structuredClone(protectedJourney);
tamperedGate.noveltyGate = {
  concept_lawful: true,
  concept_non_sexual: true,
  concept_real_world_translated: true,
  code_compliance_possible: true,
  zoning_path_possible: true,
  permitting_path_possible: true,
};
assert(!verifyJourneyState(tamperedGate), "Client changes to a safety gate must fail verification.");

const tamperedCounters = structuredClone(protectedJourney);
tamperedCounters.guardCounters.rejections += 1;
assert(!verifyJourneyState(tamperedCounters), "Client changes to abuse counters must fail verification.");

const unsigned = structuredClone(FRESH_JOURNEY);
assert(!verifyJourneyState(unsigned), "Unsigned client state must fail closed.");

console.log("✓ Navigator state integrity PASS");
