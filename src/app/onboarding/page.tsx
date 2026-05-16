"use client";

import { useState } from "react";

type FarmType =
  | "CROPS"
  | "LIVESTOCK"
  | "POULTRY"
  | "DAIRY"
  | "BEEF"
  | "PIG"
  | "ORCHARD"
  | "AQUACULTURE"
  | "EXOTIC_ANIMALS"
  | "EXOTIC_BIRDS";

export default function OnboardingPage() {
  const [step, setStep] = useState(1);

  const [state, setState] = useState<any>({
    stage: "",
    location: {
      country: "",
      state: "",
    },
    farmTypes: [] as FarmType[],
    goals: [] as string[],
    acreage: 0,
    interests: {
      soilAnalysis: false,
      environmentalReports: false,
      financing: false,
      vendorRecommendations: false,
      commodityIntelligence: false,
    },
  });

  async function updateBackend(updatedState: any) {
    await fetch("/api/onboard", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tenantId: "demo-user",
        state: updatedState,
      }),
    });
  }

  function toggleFarmType(type: FarmType) {
    const exists = state.farmTypes.includes(type);

    const updated = {
      ...state,
      farmTypes: exists
        ? state.farmTypes.filter((t: FarmType) => t !== type)
        : [...state.farmTypes, type],
    };

    setState(updated);
  }

  function toggleGoal(goal: string) {
    const exists = state.goals.includes(goal);

    const updated = {
      ...state,
      goals: exists
        ? state.goals.filter((g: string) => g !== goal)
        : [...state.goals, goal],
    };

    setState(updated);
  }

  async function next() {
    const nextStep = step + 1;
    setStep(nextStep);
    await updateBackend(state);
  }

  async function finish() {
    await updateBackend(state);
    window.location.href = "/dashboard";
  }

  return (
    <div style={{ padding: 24, fontFamily: "sans-serif" }}>
      <h1>Farm Onboarding</h1>
      <p>Step {step}</p>

      {/* STEP 1 */}
      {step === 1 && (
        <div>
          <h2>What stage are you?</h2>

          <button onClick={() => setState({ ...state, stage: "BEGINNER" })}>
            Beginner
          </button>

          <button onClick={() => setState({ ...state, stage: "INTERMEDIATE" })}>
            Intermediate
          </button>

          <button onClick={() => setState({ ...state, stage: "ADVANCED" })}>
            Advanced
          </button>

          <br />
          <button onClick={next}>Next</button>
        </div>
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <div>
          <h2>Location</h2>

          <input
            placeholder="Country"
            onChange={(e) =>
              setState({
                ...state,
                location: { ...state.location, country: e.target.value },
              })
            }
          />

          <input
            placeholder="State"
            onChange={(e) =>
              setState({
                ...state,
                location: { ...state.location, state: e.target.value },
              })
            }
          />

          <br />
          <button onClick={next}>Next</button>
        </div>
      )}

      {/* STEP 3 */}
      {step === 3 && (
        <div>
          <h2>Select Farm Types (multi-select)</h2>

          {[
            "CROPS",
            "LIVESTOCK",
            "POULTRY",
            "DAIRY",
            "ORCHARD",
            "AQUACULTURE",
            "EXOTIC_ANIMALS",
            "EXOTIC_BIRDS",
          ].map((type) => (
            <button
              key={type}
              onClick={() => toggleFarmType(type as FarmType)}
              style={{
                margin: 4,
                background: state.farmTypes.includes(type)
                  ? "green"
                  : "gray",
              }}
            >
              {type}
            </button>
          ))}

          <br />
          <button onClick={next}>Next</button>
        </div>
      )}

      {/* STEP 4 */}
      {step === 4 && (
        <div>
          <h2>Goals (multi-select)</h2>

          {[
            "PROFIT_MAXIMIZATION",
            "EXPANSION",
            "LAND_ACQUISITION",
            "SUSTAINABILITY",
          ].map((goal) => (
            <button
              key={goal}
              onClick={() => toggleGoal(goal)}
              style={{
                margin: 4,
                background: state.goals.includes(goal) ? "green" : "gray",
              }}
            >
              {goal}
            </button>
          ))}

          <br />
          <button onClick={next}>Next</button>
        </div>
      )}

      {/* STEP 5 */}
      {step === 5 && (
        <div>
          <h2>Acreage</h2>

          <input
            type="number"
            onChange={(e) =>
              setState({ ...state, acreage: Number(e.target.value) })
            }
          />

          <br />
          <button onClick={next}>Next</button>
        </div>
      )}

      {/* STEP 6 */}
      {step === 6 && (
        <div>
          <h2>Finish Setup</h2>

          <button onClick={finish}>Generate Farm Plan</button>
        </div>
      )}
    </div>
  );
}
