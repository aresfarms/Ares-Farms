# America 250 Narration Audio Assets

**Status: PENDING — ElevenLabs recording session required**

Place generated MP3 files at the paths below.
When a file exists at its path AND `audioSrc` is set in
`src/lib/narration/narrationScripts.ts`, audio activates automatically.
No code change required — asset presence is sufficient.

---

## Voice Direction

**Style:** Historical documentary  
**Tone:** PBS / Smithsonian / National Park Service / America 250 exhibit  
**Provider:** ElevenLabs  
**NOT:** Browser TTS, GPS voice, AI assistant, call center voice

---

## Required Files

### Series level
| File | Entry ID | Voice | Status |
|------|----------|-------|--------|
| `opening.mp3` | opening | Female | PENDING |
| `closing.mp3` | closing | Female | PENDING |
| `amber-thread.mp3` | amber-thread | Female | PENDING |
| `sapphire-thread.mp3` | sapphire-thread | Male | PENDING |
| `modern-convergence.mp3` | modern-convergence | Female | PENDING |
| `furlong-closing.mp3` | furlong-closing | Female | PENDING |

### Story introductions
| File | Entry ID | Voice | Status |
|------|----------|-------|--------|
| `intro.mp3` | america-250-intro | Female | PENDING |
| `capitals.mp3` | capital-road-trip | Male | PENDING |
| `delaware/intro.mp3` | delaware | Female | PENDING |
| `pennsylvania/intro.mp3` | pennsylvania | Male | PENDING |
| `new-york/intro.mp3` | new-york | Female | PENDING |
| `massachusetts/intro.mp3` | massachusetts | Male | PENDING |
| `virginia/intro.mp3` | virginia | Female | PENDING |
| `maine/intro.mp3` | maine | Male | PENDING |

---

## Activation Steps (per asset)

1. Generate MP3 via ElevenLabs using the script in `narrationScripts.ts`
2. Place the file at the path listed above (relative to `public/audio/america250/`)
3. In `src/lib/narration/narrationScripts.ts`, update the entry's `audioSrc`:
   ```ts
   // Before
   audioSrc: null,  // pending: /audio/america250/delaware/intro.mp3

   // After
   audioSrc: "/audio/america250/delaware/intro.mp3",
   ```
4. Rebuild or redeploy — no other code changes needed

---

## Technical Spec

- Format: MP3
- Sample rate: 44.1 kHz
- Bit rate: 128 kbps minimum, 192 kbps preferred
- Channels: Mono (narration only, no music bed)
- Silence at start/end: 0.3–0.5s padding
- No background music in the assets — music is handled separately if needed

---

*Public Alpha remains PENDING.*  
*"The map reveals opportunities, not the visitor."*
