import { useParams } from 'react-router-dom';
import { usePaginatedArticles } from '../hooks/usePaginatedArticles.js';
import { useDocumentMeta } from '../hooks/useDocumentMeta.js';
import { useRevealOnScroll } from '../hooks/useRevealOnScroll.js';
import Card from '../components/Card.jsx';
import CardSkeleton from '../components/CardSkeleton.jsx';
import AskSidebar from '../components/AskSidebar.jsx';
import { EmptyBlock, ErrorBlock } from '../components/StateBlock.jsx';
import NotFound from './NotFound.jsx';

export default function CategoryPage() {
  const { category: slug } = useParams();
  const { category, items, loading, loadingMore, error, loadMore, hasMore } = usePaginatedArticles(slug);

  useDocumentMeta(category ? `${category.name} — Gazva Insights` : undefined, category?.meta_description);
  useRevealOnScroll([items.length]);

  if (error && !loading && !category) return <NotFound />;

  return (
    <>
      <div className="page-banner">
        <div className="page-banner__inner">
          {category ? (
            <>
              <span className={`eyebrow cat-${category.slug}`} style={category.color ? { color: category.color, '--eyebrow-dot': category.color } : undefined}>
                {category.name}
              </span>
              <h1>{category.banner_title || category.name}</h1>
              <p>{category.banner_description}</p>
            </>
          ) : (
            <div className="skeleton-line w-40 skeleton-pulse" style={{ height: 28, marginBottom: 10 }} />
          )}
        </div>
      </div>

      <section className="page-layout">
        <div className="page-layout__main">
          {loading && <CardSkeleton count={4} />}
          {error && !loading && <ErrorBlock />}
          {!loading && !error && items.length === 0 && <EmptyBlock message="No articles published in this category yet — check back soon." />}
          {!loading && !error && items.length > 0 && (
            <>
              <div className="post-grid" data-load-more-grid>
                {items.map((article) => (
                  <Card key={article.id} article={article} />
                ))}
              </div>
              {hasMore && (
                <div className="load-more-wrap">
                  <button className="btn btn-outline" data-load-more-btn onClick={loadMore} disabled={loadingMore}>
                    {loadingMore ? 'Loading…' : 'Load more articles'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
        <AskSidebar />
      </section>
    </>
  );
}
