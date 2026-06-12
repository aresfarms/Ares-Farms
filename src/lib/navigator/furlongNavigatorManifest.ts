/**
 * Furlong Navigator — manifest (addendum §1, §9).
 *
 * Furlong Navigator is the guided discovery experience that helps a visitor
 * understand what a property, asset, business, or opportunity can realistically
 * become. It is the governed conversational front door of the platform — NOT a
 * static intake form, chatbot widget, calculator, or persona picker.
 *
 * Public naming rule: all public-facing references say "Furlong Navigator"
 * (supersedes "AI questionnaire").
 */

import { PROPERTY_PRIVACY_DOCTRINE_ID } from "./propertyPrivacyDoctrine";

export const FURLONG_NAVIGATOR_MANIFEST = {
  name: "Furlong Navigator",
  version: "furlong-navigator-v0.1.0",
  publicMeaning:
    "Furlong Navigator is the guided discovery experience that helps a visitor understand what a property, " +
    "asset, business, or opportunity can realistically become.",
  isNot: ["static intake form", "chatbot widget", "calculator", "persona picker"],
  ctas: {
    primary: { label: "Start your journey here", destination: "/discover" },
    secondary: { label: "What are your possibilities?", destination: "/explore" },
  },
  spine: ["person", "story", "assets", "constraints", "pathways", "evidence", "programs", "tradeoffs", "decision", "journey"],
  entryModes: ["open-discovery", "own-asset"],
  doctrines: [PROPERTY_PRIVACY_DOCTRINE_ID, "G-3 advisory-only", "G-4 listing-content sourcing", "G-5 public/internal isolation"],
  confidenceStates: ["high", "medium", "low", "cant-determine"],
  threeAnswers: ["YES", "NO", "CANT_DETERMINE"],
  anonymousJourneyMemory: {
    allowed: ["explored pathways", "session state", "property/address reference", "comparison state", "continue-your-journey"],
    forbidden: ["user identification", "owner identification", "behavioral sale profile", "demographic inference", "selling/sharing visitor data"],
  },
  mission: "Help people discover and understand pathways they didn't know existed, with evidence and transparency.",
} as const;
