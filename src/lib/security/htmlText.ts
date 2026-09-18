const SUPPRESSED_ELEMENTS = new Set(["script", "style"]);

function elementName(tagBody: string): { name: string; closing: boolean } | null {
  const trimmed = tagBody.trimStart();
  const closing = trimmed.startsWith("/");
  const start = closing ? 1 : 0;
  let end = start;
  while (end < trimmed.length && /[A-Za-z0-9:-]/.test(trimmed[end])) end += 1;
  const name = trimmed.slice(start, end).toLowerCase();
  return name ? { name, closing } : null;
}

/** Remove script/style elements without relying on incomplete HTML regexes. */
export function removeSuppressedHtmlElements(input: string): string {
  let output = "";
  let cursor = 0;
  while (cursor < input.length) {
    const open = input.indexOf("<", cursor);
    if (open < 0) return output + input.slice(cursor);
    const close = input.indexOf(">", open + 1);
    if (close < 0) return output + input.slice(cursor, open);
    const tag = elementName(input.slice(open + 1, close));
    if (!tag || tag.closing || !SUPPRESSED_ELEMENTS.has(tag.name)) {
      output += input.slice(cursor, close + 1);
      cursor = close + 1;
      continue;
    }

    output += `${input.slice(cursor, open)} `;
    cursor = close + 1;
    while (cursor < input.length) {
      const candidateOpen = input.indexOf("<", cursor);
      if (candidateOpen < 0) return output;
      const candidateClose = input.indexOf(">", candidateOpen + 1);
      if (candidateClose < 0) return output;
      const candidate = elementName(input.slice(candidateOpen + 1, candidateClose));
      cursor = candidateClose + 1;
      if (candidate?.closing && candidate.name === tag.name) break;
    }
  }
  return output;
}

/** Convert untrusted HTML to plain text; decode only approved entities afterward. */
export function stripHtmlMarkup(input: string): string {
  const withoutSuppressed = removeSuppressedHtmlElements(input);
  let output = "";
  let cursor = 0;
  while (cursor < withoutSuppressed.length) {
    if (withoutSuppressed[cursor] !== "<") {
      output += withoutSuppressed[cursor];
      cursor += 1;
      continue;
    }
    const close = withoutSuppressed.indexOf(">", cursor + 1);
    if (close < 0) break;
    output += " ";
    cursor = close + 1;
  }
  return output;
}
