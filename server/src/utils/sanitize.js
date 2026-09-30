import sanitizeHtml from 'sanitize-html';

/**
 * Article / page bodies are stored as HTML and rendered with dangerouslySetInnerHTML,
 * so everything is whitelisted on the way IN. Only the markup the original site used
 * (p, h2, blockquote+cite, em, br, poem stanza classes, bold spans) plus a few basics.
 */
const weight = [/^(bold|normal|[1-9]00)$/];

export function cleanHtml(html = '') {
  return sanitizeHtml(String(html), {
    allowedTags: [
      'p', 'h2', 'h3', 'h4', 'blockquote', 'cite', 'em', 'strong', 'b', 'i', 'u', 'br', 'hr',
      'ul', 'ol', 'li', 'a', 'div', 'span', 'img', 'figure', 'figcaption',
    ],
    allowedAttributes: {
      a: ['href', 'target', 'rel', 'style'],
      img: ['src', 'alt', 'width', 'height', 'loading'],
      p: ['class'],
      div: ['class'],
      span: ['style'],
      strong: ['style'],
    },
    allowedClasses: { p: ['poem-malayalam'], div: ['poem-divider'] },
    allowedStyles: { '*': { 'font-weight': weight } },
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    allowedSchemesByTag: { img: ['http', 'https'] },
    allowProtocolRelative: false,
    transformTags: {
      a: (tagName, attribs) => {
        if (attribs.target === '_blank') attribs.rel = 'noopener noreferrer';
        return { tagName, attribs };
      },
      img: (tagName, attribs) => ({ tagName, attribs: { ...attribs, loading: 'lazy' } }),
    },
  }).trim();
}

const ENTITIES = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'" };
const decode = (s) => s.replace(/&(amp|lt|gt|quot|#39);/g, (m) => ENTITIES[m]);

/**
 * Plain-text fields (titles, names, messages): remove any markup but keep the characters as typed.
 * sanitize-html escapes & < > in its output, so decode once to get "Q&A" back rather than "Q&amp;A";
 * React escapes text on render, so storing raw text is safe.
 */
export const cleanText = (s = '') => decode(sanitizeHtml(String(s), { allowedTags: [], allowedAttributes: {} })).trim();

/** Short plain-text summary of an HTML body (for meta descriptions). */
export function excerptFrom(html = '', max = 160) {
  const text = cleanText(html).replace(/\s+/g, ' ');
  return text.length > max ? text.slice(0, max - 1).trimEnd() + '…' : text;
}
