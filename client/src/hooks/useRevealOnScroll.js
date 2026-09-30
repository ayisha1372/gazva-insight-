import { useEffect } from 'react';

/**
 * Reproduces the original site's card entrance animation (js/component.js):
 * cards start faded/translated (.card in styles.css) and get a `.show` class,
 * which triggers the CSS transition, once they scroll into view.
 * Re-runs whenever `deps` changes (e.g. after "Load more" reveals new cards).
 */
export function useRevealOnScroll(deps = []) {
  useEffect(() => {
    const cards = document.querySelectorAll('.card:not(.show)');
    if (!cards.length) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('show');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    cards.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
