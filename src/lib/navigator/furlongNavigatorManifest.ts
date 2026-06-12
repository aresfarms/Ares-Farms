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
  // Hero CTA restructure Option A (2026-06-11): the labels themselves explain
  // the difference. Navigator = the primary experience (the discovery engine);
  // the map = supporting exploration. The map never competes as the product.
  ctas: {
    primary: {
      label: "Talk to Furlong Navigator",
      destination: "/navigator",
      support: "Tell us what you're looking for and we'll help uncover pathways you may not know exist.",
    },
    secondary: {
      label: "Explore America's Possibilities",
      destination: "#americas-possibilities",
      support: "Browse the map, hidden-gem stories, and pathway examples before you begin.",
    },
  },
  /**
   * Constitutional positioning rule (addendum 2026-06-11): the Navigator is
   * NOT a search engine, calculator, listing portal, lender, broker, or
   * recommendation engine. Its purpose is to help a person answer FOUR
   * canonical questions — the Navigator decision framework.
   */
  decisionFramework: [
    "What is realistically achievable?",
    "What obstacles exist?",
    "What alternatives exist?",
    "Which path appears to have the highest probability of success?",
  ],
  publicMessaging: "Pathways, not promises.",
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
