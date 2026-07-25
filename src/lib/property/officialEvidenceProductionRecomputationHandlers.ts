import type { DownstreamArtifactKind } from "./officialEvidenceDownstreamInvalidation";
import { registerGovernedRecomputationHandler, type GovernedRecomputationHandler } from "./officialEvidenceRecomputationHandlerRegistry";

const bindings:Record<DownstreamArtifactKind,{handlerId:string;sourcePath:string}>={
 "tax-scenario":{handlerId:"ownership-cost-tax-scenario-v1",sourcePath:"src/lib/property/ownershipCostModel.ts#buildPostSaleTaxScenario"},
 "top-three":{handlerId:"scenario-ranking-v1",sourcePath:"src/lib/intelligence/scenarioRankingPlan.ts#buildScenarioRankingPlan"},
 "qualification-result":{handlerId:"financing-intake-v1",sourcePath:"src/lib/financing/intakeRuntime.ts#evaluateFinancingIntake"},
 "property-report":{handlerId:"property-brief-v1",sourcePath:"src/lib/property/propertyBriefIntelligence.ts#buildPropertyBriefIntelligence"},
};
const replayInputsNotYetPersisted:GovernedRecomputationHandler=()=>{throw new Error("Genuine replay inputs are not yet durably preserved; production recomputation remains blocked.");};
export function registerProductionRecomputationBindings(at=new Date().toISOString()):void{for(const kind of Object.keys(bindings) as DownstreamArtifactKind[]){const binding=bindings[kind];registerGovernedRecomputationHandler({handlerId:binding.handlerId,kind,sourcePath:binding.sourcePath,status:"pending",registeredAt:at,reviewedBy:null,reviewedAt:null,reviewReason:"Bound to the real generation path; approval withheld until replay inputs and output verification are durable."},replayInputsNotYetPersisted);}}
