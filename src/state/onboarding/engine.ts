// src/state/onboarding/engine.ts

import { OnboardingState } from "./types";

export function nextStep(state: OnboardingState): number {
  if (!state.stage) return 1;
  if (!state.location) return 2;
  if (!state.farmTypes || state.farmTypes.length === 0) return 3;
  if (!state.goals || state.goals.length === 0) return 4;
  if (!state.acreage) return 5;
  if (!state.interests) return 6;
  if (!state.reportIntent || state.reportIntent.length === 0) return 7;

  return 8;
}

export function isComplete(state: OnboardingState): boolean {
  return nextStep(state) === 8;
}

export function initializeState(tenantId: string): OnboardingState {
  const now = new Date().toISOString();

  return {
    tenantId,

    stage: undefined,
    location: undefined,
    farmTypes: [],
    goals: [],
    acreage: undefined,

    interests: undefined,

    reportIntent: [],

    currentStep: 1,
    completed: false,

    createdAt: now,
    updatedAt: now,
  };
}

export function updateStep(state: OnboardingState): OnboardingState {
  return {
    ...state,
    currentStep: nextStep(state),
    completed: isComplete(state),
    updatedAt: new Date().toISOString(),
  };
}
