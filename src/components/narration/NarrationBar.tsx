"use client";

/**
 * NarrationBar — Build 53 (Disabled)
 *
 * Professional narration audio assets are pending ElevenLabs recording.
 * This component is fully disabled until assets are ready.
 *
 * When assets exist (audioSrc set in narrationScripts.ts):
 *   - Re-enable this component
 *   - Wire HTML5 <audio> controls (play/pause/replay/mute)
 *   - Style: PBS / Smithsonian documentary tone
 *   - NOT: browser TTS, GPS voice, AI assistant voice
 *
 * Do NOT re-enable browser Web Speech API (speechSynthesis).
 * Do NOT add "Female narrator" or "Male narrator" labels to the UI.
 *
 * Public Alpha remains PENDING.
 */

import type { NarrationControls } from "@/lib/narration/useNarration";

/**
 * Returns null — narration is disabled until professional audio assets exist.
 * The map and all page content work fully without audio.
 */
export function NarrationBar(_props: { narration: NarrationControls }) {
  // Narration disabled — no audio assets deployed yet.
  // Re-enable when ElevenLabs MP3s are placed in public/audio/america250/.
  return null;
}
