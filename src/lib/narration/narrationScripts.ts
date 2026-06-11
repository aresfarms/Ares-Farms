/**
 * America 250 Narration Scripts — Build 53
 *
 * Recording scripts and asset manifest for the Living Opportunity Map
 * documentary narration.
 *
 * ── Architecture ────────────────────────────────────────────────────────────
 * Each NarrationEntry carries:
 *   text      — the spoken script, written for oral delivery
 *   audioSrc  — path to the static MP3 asset under /audio/america250/
 *               Set to null until the asset is generated and deployed.
 *
 * When audioSrc is null: captions show, no audio plays. The map works
 * independently of audio at all times.
 *
 * When audioSrc is a path: the HTML5 <audio> element loads and plays
 * the file. Muted by default — visitor must unmute explicitly.
 *
 * ── Asset directory ──────────────────────────────────────────────────────────
 * public/audio/america250/
 *   intro.mp3                  ← America 250 Intro (IN)
 *   capitals.mp3               ← Capital Road Trip (RT)
 *   opening.mp3                ← Series opening narration
 *   closing.mp3                ← Series closing narration
 *   amber-thread.mp3           ← Amber Thread — Historical Journey A
 *   sapphire-thread.mp3        ← Sapphire Thread — Historical Journey B
 *   modern-convergence.mp3     ← Modern Convergence — The founding of Furlong
 *   furlong-closing.mp3        ← Furlong Closing Message
 *   delaware/intro.mp3
 *   pennsylvania/intro.mp3
 *   new-york/intro.mp3
 *   massachusetts/intro.mp3
 *   virginia/intro.mp3
 *   maine/intro.mp3
 *
 * ── Voice assignments (for ElevenLabs recording sessions) ────────────────────
 * Style: Historical documentary. PBS / Smithsonian / National Park Service.
 * NOT: AI assistant, GPS voice, call center, robotic.
 *
 *   Opening            → Female  (warm welcome, sets documentary tone)
 *   Closing            → Female  (invitation)
 *   America 250 Intro  → Female  (national overview)
 *   Capital Road Trip  → Male    (movement, drama)
 *   Delaware           → Female  (precise, confident)
 *   Pennsylvania       → Male    (grand, foundational)
 *   New York           → Female  (sweep, Hudson to Erie Canal)
 *   Massachusetts      → Male    (grave reverence)
 *   Virginia           → Female
 *   Maine              → Male    (spare, coastal)
 *   Amber Thread       → Female  (quiet, historical)
 *   Sapphire Thread    → Male    (parallel journey)
 *   Modern Convergence → Female  (hopeful convergence)
 *   Furlong Closing    → Female  (invitation to explore)
 *
 * ── Oral writing conventions ─────────────────────────────────────────────────
 *   "— " (em-dash + space) → medium pause for recording direction
 *   "..."                  → longer pause
 *   Short sentences        → natural rhythm, not run-on prose
 *
 * Privacy posture (unchanged):
 *   "The map reveals opportunities, not the visitor."
 *   No personal data. No geolocation.
 *   Public Alpha remains PENDING.
 */

export type VoiceGender = "female" | "male";

export type NarrationEntry = {
  /** Unique identifier — maps to audio file name */
  id: string;
  /** The spoken script — written for oral delivery, not reading */
  text: string;
  /** Voice gender for ElevenLabs recording session assignment */
  voiceGender: VoiceGender;
  /**
   * Human-readable narrator label for recording session documentation.
   * Not shown in UI — shown only in session notes.
   */
  narratorLabel: string;
  /**
   * Path to the static MP3 asset under /audio/america250/.
   * null = asset not yet generated. Captions show; no audio plays.
   * When the ElevenLabs file is placed at the path, audio activates
   * automatically — no code change required.
   */
  audioSrc: string | null;
};

// ── Series-level narrations ────────────────────────────────────────────────────

/**
 * Opening narration — plays when the visitor turns on captions/audio.
 * Sets the documentary tone for the whole series.
 */
export const NARRATION_OPENING: NarrationEntry = {
  id: "opening",
  voiceGender: "female",
  narratorLabel: "Female narrator",
  audioSrc: null, // pending: /audio/america250/opening.mp3
  text:
    "Take America's journey with Furlong. " +
    "For two hundred and fifty years, Americans have followed pathways " +
    "of migration, agriculture, innovation, commerce, stewardship, and opportunity. " +
    "This map traces a few of those journeys.",
};

/**
 * Closing narration — plays after the last story, or when the
 * sequence completes.
 */
export const NARRATION_CLOSING: NarrationEntry = {
  id: "closing",
  voiceGender: "female",
  narratorLabel: "Female narrator",
  audioSrc: null, // pending: /audio/america250/closing.mp3
  text:
    "Every journey starts somewhere. " +
    "Now it's your turn. " +
    "Explore your possibilities below.",
};

// ── Per-story narrations ───────────────────────────────────────────────────────
// Keyed by FeaturedStory.stateAbbr as it appears in america250StoryRegistry.ts.
//   "IN" → America 250 Intro
//   "RT" → Capital Road Trip
//   "DE" → Delaware
//   "PA" → Pennsylvania
//   "NY" → New York
//   "MA" → Massachusetts
//   "VA" → Virginia
//   "ME" → Maine

export const STORY_NARRATIONS: Record<string, NarrationEntry> = {

  // 1. Intro — Female (warm, national overview)
  "IN": {
    id: "america-250-intro",
    voiceGender: "female",
    narratorLabel: "Female narrator",
    audioSrc: null, // pending: /audio/america250/intro.mp3
    text:
      "Somewhere in these two hundred and fifty years, every American family has a starting point. " +
      "A farm. A port. A factory. A crossroads. " +
      "The thirteen original colonies that became fifty states " +
      "built an infrastructure of land, law, capital, and community " +
      "that continues to define what is possible today. " +
      "Every journey starts somewhere.",
  },

  // 2. Capital Road Trip — Male (movement, drama, the itinerant republic)
  "RT": {
    id: "capital-road-trip",
    voiceGender: "male",
    narratorLabel: "Male narrator",
    audioSrc: null, // pending: /audio/america250/capitals.mp3
    text:
      "Philadelphia was not supposed to be a permanent capital. " +
      "When the British threatened the city in December 1776, " +
      "the Continental Congress fled to Baltimore. " +
      "The capital bounced through Princeton, Annapolis, Trenton, and New York. " +
      "Then, by a compromise brokered over dinner, " +
      "to a swamp on the Potomac that no one yet called Washington. " +
      "A republic always moving. Always negotiating. " +
      "Always building toward something permanent.",
  },

  // 3. Delaware — Female (precise, confident, strategic)
  "DE": {
    id: "delaware",
    voiceGender: "female",
    narratorLabel: "Female narrator",
    audioSrc: null, // pending: /audio/america250/delaware/intro.mp3
    text:
      "Delaware did not become the First State by accident. " +
      "Its delegates understood something their larger neighbors did not: " +
      "a small state needed the Constitution more than a large one. " +
      "They moved fast. " +
      "December 7th, 1787. Unanimous. " +
      "They did not hesitate.",
  },

  // 4. Pennsylvania — Male (grand, foundational, Valley Forge gravity)
  "PA": {
    id: "pennsylvania",
    voiceGender: "male",
    narratorLabel: "Male narrator",
    audioSrc: null, // pending: /audio/america250/pennsylvania/intro.mp3
    text:
      "Philadelphia was the largest city in the British colonies " +
      "when the Second Continental Congress convened there in 1775. " +
      "It was there that Jefferson wrote the Declaration of Independence " +
      "in a rented room on Market Street. " +
      "That Washington's army held together at Valley Forge, " +
      "eighteen miles away, by sheer will, through the winter of 1777. " +
      "Pennsylvania's founding by William Penn gave it a different soul. " +
      "That soul made Philadelphia the birthplace of American democracy.",
  },

  // 5. New York — Female (grand sweep, Hudson to Erie Canal)
  "NY": {
    id: "new-york",
    voiceGender: "female",
    narratorLabel: "Female narrator",
    audioSrc: null, // pending: /audio/america250/new-york/intro.mp3
    text:
      "Henry Hudson sailed into New York Harbor in 1609 " +
      "looking for a passage to Asia. " +
      "He found the most strategically significant natural harbor " +
      "on the Atlantic coast. " +
      "George Washington took the oath of office at Federal Hall on Wall Street " +
      "on April 30th, 1789. " +
      "Then, in 1825, the Erie Canal connected the Great Lakes to the Hudson River " +
      "and opened the American continent to commerce and settlement. " +
      "Every decision made there still echoes across New York today.",
  },

  // 6. Massachusetts — Male (shot heard round the world, grave reverence)
  "MA": {
    id: "massachusetts",
    voiceGender: "male",
    narratorLabel: "Male narrator",
    audioSrc: null, // pending: /audio/america250/massachusetts/intro.mp3
    text:
      "The Pilgrims landed at Plymouth in November 1620, " +
      "having missed their intended destination in Virginia. " +
      "What they built was a different kind of society — " +
      "the first written framework for self-government in North America. " +
      "The shot heard round the world was fired at Lexington " +
      "on April 19th, 1775. " +
      "Paul Revere rode through the night. " +
      "The farmers at Concord stood their ground. The British retreated. " +
      "Everything that followed — Valley Forge, Yorktown, the Constitution — " +
      "began on that Tuesday morning in April, on a farm field in Massachusetts.",
  },

  // 7. Virginia — Female
  "VA": {
    id: "virginia",
    voiceGender: "female",
    narratorLabel: "Female narrator",
    audioSrc: null, // pending: /audio/america250/virginia/intro.mp3
    text:
      "Virginia's full story is still being written. " +
      "The colony that gave America Washington, Jefferson, Madison, and Monroe. " +
      "The Shenandoah Valley that sheltered farmers " +
      "who brought their traditions to the frontier. " +
      "The Appalachian ridge that shaped the American westward character. " +
      "Virginia's story will be available soon.",
  },

  // 8. Maine — Male (sparse, coastal, oldest — coming first)
  "ME": {
    id: "maine",
    voiceGender: "male",
    narratorLabel: "Male narrator",
    audioSrc: null, // pending: /audio/america250/maine/intro.mp3
    text:
      "The first English settlement in North America was not Plymouth. " +
      "It was Popham Colony, Maine, in 1607. " +
      "Thirteen years before the Pilgrims. The same year as Jamestown. " +
      "The timber that built the British Royal Navy " +
      "came from Maine's white pines, marked with the King's Broad Arrow. " +
      "Maine was first. Maine's full story is coming.",
  },

};

// ── Heritage thread narrations ─────────────────────────────────────────────────
// These entries power the Amber Thread, Sapphire Thread, and Modern
// Convergence sections of the America 250 experience.
//
// Thread naming per governance posture:
//   Amber Thread   — Historical Journey A
//   Sapphire Thread — Historical Journey B
//   Modern Convergence — The founding of Furlong

/**
 * Amber Thread — Historical Journey A
 * A quiet, deliberate account of one American family's passage
 * through two centuries of agricultural and civic life.
 */
export const NARRATION_AMBER_THREAD: NarrationEntry = {
  id: "amber-thread",
  voiceGender: "female",
  narratorLabel: "Female narrator",
  audioSrc: null, // pending: /audio/america250/amber-thread.mp3
  text:
    "Two hundred and fifty years of American history follow specific pathways. " +
    "Some families moved with the frontier, planting crops in soil " +
    "that had never been turned before. " +
    "They built farmsteads, filed land claims, joined county fairs, " +
    "sent sons to wars, and passed land down through generations. " +
    "This is one of those journeys. " +
    "The Amber Thread.",
};

/**
 * Sapphire Thread — Historical Journey B
 * A parallel account — different geography, different generation,
 * the same American landscape.
 */
export const NARRATION_SAPPHIRE_THREAD: NarrationEntry = {
  id: "sapphire-thread",
  voiceGender: "male",
  narratorLabel: "Male narrator",
  audioSrc: null, // pending: /audio/america250/sapphire-thread.mp3
  text:
    "History is written in parallel. " +
    "While one family moved south and west through the river valleys, " +
    "another found its footing along the eastern seaboard — " +
    "in coastal towns, in mill villages, in the practical life " +
    "of a new republic still learning what it was. " +
    "The Sapphire Thread follows that journey. " +
    "A different path through the same American century.",
};

/**
 * Modern Convergence — The founding of Furlong
 * Where the two historical threads meet, and what they made possible.
 */
export const NARRATION_MODERN_CONVERGENCE: NarrationEntry = {
  id: "modern-convergence",
  voiceGender: "female",
  narratorLabel: "Female narrator",
  audioSrc: null, // pending: /audio/america250/modern-convergence.mp3
  text:
    "Two threads. Two journeys through American history. " +
    "And then — two hundred and fifty years later — a convergence. " +
    "The infrastructure built across those generations: " +
    "the land, the law, the capital markets, the agricultural networks, " +
    "the financing pathways that most farmers never knew existed. " +
    "This is where Furlong begins. " +
    "Not as a company. As a consequence of history.",
};

/**
 * Furlong Closing Message
 * The final narration in the America 250 sequence.
 */
export const NARRATION_FURLONG_CLOSING: NarrationEntry = {
  id: "furlong-closing",
  voiceGender: "female",
  narratorLabel: "Female narrator",
  audioSrc: null, // pending: /audio/america250/furlong-closing.mp3
  text:
    "Every journey starts somewhere. " +
    "Two hundred and fifty years of American history " +
    "built the infrastructure of opportunity that exists today — " +
    "the land titles, the agricultural programs, " +
    "the financing pathways, the environmental stewardship frameworks. " +
    "Furlong is here to help you find your path through it. " +
    "Your exploration starts now.",
};

// ── Lookup helpers ─────────────────────────────────────────────────────────────

/**
 * Get the narration entry for a story by its stateAbbr.
 * Returns null if no narration is defined for that stateAbbr.
 */
export function getStoryNarration(stateAbbr: string): NarrationEntry | null {
  return STORY_NARRATIONS[stateAbbr] ?? null;
}
