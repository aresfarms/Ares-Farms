import {
  PROGRAM_GRAPH,
  programGraph,
} from "@/lib/program-graph";

/** Stable public boundary for the canonical Program domain. */
export const canonicalProgramAuthority = Object.freeze({
  graph: PROGRAM_GRAPH,
  evaluate: programGraph,
});
