import { useEffect } from 'react';

/**
 * Sets the tab title client-side on every navigation. The server also renders the correct
 * <title>/description/OG tags into index.html on first load (for link previews and bots that
 * don't run JS) — see server/src/utils/seo.js — this hook keeps it in sync during SPA navigation.
 */
export function useDocumentMeta(title, description) {
  useEffect(() => {
    if (title) document.title = title;
    if (description) {
      let tag = document.querySelector('meta[name="description"]');
      if (!tag) {
        tag = document.createElement('meta');
        tag.name = 'description';
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', description);
    }
  }, [title, description]);
}
