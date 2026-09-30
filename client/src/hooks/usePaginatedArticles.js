import { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';

const PAGE_SIZE = 4; // matches the original main.js "load more" behaviour (PAGE_SIZE = 4)

/** Loads a category's articles a page at a time, growing the list on "Load more" — same UX as the static site. */
export function usePaginatedArticles(categorySlug) {
  const [items, setItems] = useState([]);
  const [category, setCategory] = useState(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);

  const fetchPage = useCallback(
    (offset) =>
      api.get(`/categories/${categorySlug}?limit=${PAGE_SIZE}&offset=${offset}`),
    [categorySlug]
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    setItems([]);
    fetchPage(0)
      .then((data) => {
        if (cancelled) return;
        setCategory(data.category);
        setItems(data.items);
        setTotal(data.total);
      })
      .catch(() => !cancelled && setError(true))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [fetchPage]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const data = await fetchPage(items.length);
      setItems((prev) => [...prev, ...data.items]);
    } catch {
      setError(true);
    } finally {
      setLoadingMore(false);
    }
  };

  return { category, items, total, loading, loadingMore, error, loadMore, hasMore: items.length < total };
}
