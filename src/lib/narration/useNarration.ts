"use client";

/**
 * useNarration — Build 53
 *
 * React hook managing documentary-style narration for the America 250
 * Living Opportunity Map.
 *
 * ── Audio model ────────────────────────────────────────────────────────────
 * Audio is served from static MP3 assets under /audio/america250/.
 * Path is stored in NarrationEntry.audioSrc. When audioSrc is null,
 * captions display and no audio attempt is made — the map and text
 * experience works completely independently of audio availability.
 *
 * When audioSrc is non-null, a single HTMLAudioElement is reused across
 * entries (src is swapped). Audio starts muted by default — the visitor
 * must explicitly unmute.
 *
 * ── Activation model ───────────────────────────────────────────────────────
 * Narration requires explicit opt-in (enable()). It never auto-activates.
 * Audio never auto-plays — all playback is user-initiated.
 *
 * ── Caption model ──────────────────────────────────────────────────────────
 * Caption text is always set when speak() is called, regardless of whether
 * audio is available or muted. The consuming component renders captions in
 * an aria-live region so screen readers receive the text.
 *
 * ── Asset activation path (no code change required) ───────────────────────
 * 1. Generate MP3 via ElevenLabs.
 * 2. Place file at the path in NarrationEntry.audioSrc
 *    (e.g. public/audio/america250/delaware/intro.mp3).
 * 3. Set audioSrc to that path in narrationScripts.ts.
 * 4. Audio activates automatically — no hook changes needed.
 *
 * Accessibility posture:
 *   - Audio is opt-in only (never auto-plays).
 *   - Audio is muted by default — visitor must unmute explicitly.
 *   - Captions are always visible in an aria-live region.
 *   - No personal data. No geolocation.
 *
 * Public Alpha remains PENDING.
 * "The map reveals opportunities, not the visitor."
 */

import { useCallback, useEffect, useRef, useState } from "react";

import type { NarrationEntry } from "@/lib/narration/narrationScripts";

// ── Public types ───────────────────────────────────────────────────────────────

export type NarrationState = {
  /** Visitor has turned captions/narration on */
  enabled:        boolean;
  /** Audio muted — captions still display */
  muted:          boolean;
  /** Audio is actively playing */
  playing:        boolean;
  /** Audio was paused mid-playback */
  paused:         boolean;
  /** Caption text for the current or most-recent narration entry */
  caption:        string;
  /** Id of the current narration entry, or null */
  captionId:      string | null;
  /**
   * Whether the current entry has an audio asset (audioSrc is non-null).
   * false = captions only. true = audio available (may still be muted).
   */
  audioAvailable: boolean;
};

export type NarrationActions = {
  /** Turn narration on (opt-in — does not auto-play anything) */
  enable():  void;
  /** Turn narration off and stop any current audio */
  disable(): void;
  /** Set caption and play audio if available and unmuted */
  speak(entry: NarrationEntry): void;
  /** Pause current audio */
  pause():   void;
  /** Resume paused audio */
  resume():  void;
  /** Replay current entry from the beginning */
  replay():  void;
  /** Stop audio and clear caption */
  cancel():  void;
  /** Toggle audio mute (captions remain visible) */
  toggleMute(): void;
};

export type NarrationControls = NarrationState & NarrationActions;

// ── Hook ───────────────────────────────────────────────────────────────────────

export function useNarration(): NarrationControls {
  const [enabled,         setEnabled]        = useState(false);
  const [muted,           setMuted]          = useState(true);   // muted by default
  const [playing,         setPlaying]        = useState(false);
  const [paused,          setPaused]         = useState(false);
  const [caption,         setCaption]        = useState("");
  const [captionId,       setCaptionId]      = useState<string | null>(null);
  const [audioAvailable,  setAudioAvailable] = useState(false);

  // ── Refs (stable callbacks, avoid stale closures) ─────────────────────────
  const audioRef          = useRef<HTMLAudioElement | null>(null);
  const enabledRef        = useRef(false);
  const mutedRef          = useRef(true);
  const currentEntryRef   = useRef<NarrationEntry | null>(null);

  // ── Sync state → refs ─────────────────────────────────────────────────────
  useEffect(() => { enabledRef.current = enabled; }, [enabled]);
  useEffect(() => { mutedRef.current   = muted;   }, [muted]);

  // ── Audio element — created once on client, reused across entries ─────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    const audio = new Audio();
    audio.preload = "none";
    audio.muted   = true; // muted by default
    audioRef.current = audio;

    const onPlay  = () => { setPlaying(true);  setPaused(false); };
    const onPause = () => {
      // ended fires before pause on some browsers — only set paused if not ended
      if (!audio.ended) {
        setPlaying(false);
        setPaused(true);
      }
    };
    const onEnded = () => { setPlaying(false); setPaused(false); };
    const onError = () => { setPlaying(false); setPaused(false); };

    audio.addEventListener("play",  onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);

    return () => {
      audio.pause();
      audio.removeEventListener("play",  onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
    };
  }, []);

  // ── Stable actions ─────────────────────────────────────────────────────────

  const cancel = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.src = "";
    }
    setPlaying(false);
    setPaused(false);
    setCaption("");
    setCaptionId(null);
    setAudioAvailable(false);
    currentEntryRef.current = null;
  }, []);

  const speak = useCallback((entry: NarrationEntry) => {
    if (!enabledRef.current) return;

    currentEntryRef.current = entry;

    // Always update caption — visible regardless of audio state
    setCaption(entry.text);
    setCaptionId(entry.id);

    const hasAudio = entry.audioSrc !== null && entry.audioSrc !== undefined;
    setAudioAvailable(hasAudio);

    if (!hasAudio) {
      // No audio asset yet — caption only
      const audio = audioRef.current;
      if (audio) { audio.pause(); audio.src = ""; }
      setPlaying(false);
      setPaused(false);
      return;
    }

    // Audio asset available — load and play if not muted
    const audio = audioRef.current;
    if (!audio) return;

    audio.pause();
    audio.src     = entry.audioSrc!;
    audio.muted   = mutedRef.current;
    audio.currentTime = 0;

    if (!mutedRef.current) {
      audio.play().catch(() => {
        // Autoplay policy rejection — user gesture required first.
        // The play button in NarrationBar satisfies this on second press.
        setPlaying(false);
      });
    }
  }, []);

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const resume = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !audio.src) return;
    audio.play().catch(() => { setPlaying(false); });
  }, []);

  const replay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !currentEntryRef.current?.audioSrc) return;
    audio.currentTime = 0;
    audio.muted = mutedRef.current;
    if (!mutedRef.current) {
      audio.play().catch(() => { setPlaying(false); });
    }
  }, []);

  const enable = useCallback(() => {
    setEnabled(true);
    enabledRef.current = true;
  }, []);

  const disable = useCallback(() => {
    const audio = audioRef.current;
    if (audio) { audio.pause(); audio.src = ""; }
    setEnabled(false);
    enabledRef.current = false;
    setPlaying(false);
    setPaused(false);
    setCaption("");
    setCaptionId(null);
    setAudioAvailable(false);
    currentEntryRef.current = null;
  }, []);

  const toggleMute = useCallback(() => {
    setMuted(prev => {
      const next = !prev;
      mutedRef.current = next;
      const audio = audioRef.current;
      if (audio) {
        audio.muted = next;
        // Unmuting while audio is loaded: start playing
        if (!next && audio.src && audio.paused) {
          audio.play().catch(() => { setPlaying(false); });
        }
        // Muting while playing: pause and keep position
        if (next && !audio.paused) {
          audio.pause();
        }
      }
      return next;
    });
  }, []);

  return {
    // State
    enabled, muted, playing, paused,
    caption, captionId, audioAvailable,
    // Actions
    enable, disable,
    speak, pause, resume, replay, cancel,
    toggleMute,
  };
}
