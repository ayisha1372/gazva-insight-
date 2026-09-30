/** URL slug. Keeps unicode letters (so Malayalam titles still work) but falls back to a timestamp if nothing survives. */
export function slugify(input = '') {
  const s = String(input)
    .normalize('NFKC')
    .toLowerCase()
    .replace(/['’"]/g, '')
    .replace(/[^\p{L}\p{M}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/g, '');
  return s || `post-${Date.now().toString(36)}`;
}
