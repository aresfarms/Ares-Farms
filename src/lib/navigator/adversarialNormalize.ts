/**
 * Shared adversarial normalization for safety/privacy DETECTION only.
 *
 * Obfuscation (leetspeak, intra-word spacing, punctuation insertion) must not
 * let a forbidden intent slip a guardrail — nor let it defeat a lawful
 * carve-out (e.g. spaced "b a c k s up to" must still read as adjacency, not a
 * shutdown). Detectors test BOTH the raw message and this normalized form, so a
 * match on either fires; the lawful carve-outs likewise run on the normalized
 * form so obfuscation can't strip them.
 *
 * Used ONLY to feed the detectors — never to alter routing copy or output.
 */
export function normalizeAdversarial(text: string): string {
  // 1) Token-based join of single-character runs ("w h i t e" → "white",
  //    "w.h.o" → "who"). Punctuation-as-separator (".", "-", "_") is first
  //    turned into spaces so "w.h.o" and "b-o-m-b" tokenize the same way.
  const spaced = text.toLowerCase().replace(/([a-z0-9@$!|])[.\-_]+(?=[a-z0-9@$!|])/g, "$1 ");
  const toks = spaced.split(/\s+/).filter(Boolean);
  const out: string[] = [];
  let run: string[] = [];
  const flush = () => {
    if (run.length >= 2) {
      // Don't swallow a leading 1-letter English word ("a"/"i") into the joined
      // token: "a w h i t e" → "a white", not "awhite".
      if ((run[0] === "a" || run[0] === "i") && run.length >= 3) { out.push(run[0]); out.push(run.slice(1).join("")); }
      else out.push(run.join(""));
    } else out.push(...run);
    run = [];
  };
  for (const t of toks) { if (/^[a-z0-9@$!|]$/.test(t)) run.push(t); else { flush(); out.push(t); } }
  flush();
  let s = out.join(" ");
  // 2) Leetspeak / homoglyph digits + symbols → letters (after joining).
  s = s
    .replace(/[1!|]/g, "i").replace(/0/g, "o").replace(/3/g, "e").replace(/4/g, "a")
    .replace(/5/g, "s").replace(/\$/g, "s").replace(/7/g, "t").replace(/@/g, "a").replace(/8/g, "b");
  return s;
}

/** True if `re` matches the raw text OR its adversarially-normalized form. */
export function matchesAdversarial(re: RegExp, text: string): boolean {
  return re.test(text) || re.test(normalizeAdversarial(text));
}
