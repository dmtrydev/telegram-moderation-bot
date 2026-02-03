/**
 * Link filter: http://, https://, t.me/, @username (mention)
 * Stopwords: case-insensitive match (full word or as part of word per typical need - we do substring for simplicity).
 */

const LINK_PATTERNS = [
  /https?:\/\//i,
  /t\.me\//i,
  /@[a-zA-Z0-9_]{5,}/, // @username (min 5 chars to avoid @bot etc noise)
];

export function hasLinks(text: string): boolean {
  if (!text || !text.trim()) return false;
  return LINK_PATTERNS.some((re) => re.test(text));
}

export function hasStopword(text: string, stopwords: string[]): boolean {
  if (!text || !text.trim() || stopwords.length === 0) return false;
  const lower = text.toLowerCase();
  return stopwords.some((w) => {
    const wl = w.trim().toLowerCase();
    return wl.length > 0 && lower.includes(wl);
  });
}
