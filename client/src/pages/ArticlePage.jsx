import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { api, ApiError } from '../api.js';
import { formatDate } from '../components/Card.jsx';
import ShareRow from '../components/ShareRow.jsx';
import CommentForm from '../components/CommentForm.jsx';
import AskSidebar from '../components/AskSidebar.jsx';
import { useDocumentMeta } from '../hooks/useDocumentMeta.js';
import { LoadingBlock } from '../components/StateBlock.jsx';
import NotFound from './NotFound.jsx';

const API_BASE = import.meta.env.VITE_API_URL;

export default function ArticlePage() {
  const { category, slug } = useParams();
  const [params] = useSearchParams();
  const [article, setArticle] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setArticle(null);
    setNotFound(false);
    const preview = params.get('preview') === '1' ? '?preview=1' : '';
    api
      .get(`/articles/${category}/${slug}${preview}`)
      .then(setArticle)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) setNotFound(true);
      });
  }, [category, slug, params]);

  useDocumentMeta(article ? `${article.title} — Gazva Insights` : undefined, article?.meta_description || article?.excerpt);

  if (notFound) return <NotFound />;
  if (!article) return <LoadingBlock label="Loading article" />;

  const isPoem = article.style === 'poem';

  return (
    <article className="page-layout">
      <div className="page-layout__main">
        {article.status === 'draft' && (
          <div className="form-status is-visible is-loading" role="status" style={{ marginBottom: 24 }}>
            Preview only — this article is still a draft and isn&rsquo;t visible to visitors.
          </div>
        )}

        <header className="article-header">
          <span className={`eyebrow cat-${article.category.slug}`} style={article.category.color ? { color: article.category.color, '--eyebrow-dot': article.category.color } : undefined}>
            {article.label || article.category.name}
          </span>
          <h1 className="article-header__title">{article.title}</h1>

          <div className="article-meta">
            <div className="article-meta__author">
              <span className="article-meta__avatar" style={!article.author_avatar ? { background: 'var(--teal-light)' } : undefined}>
                {article.author_avatar && <img src={article.author_avatar} alt="" loading="lazy" />}
              </span>
              <span>
                <span className="article-meta__name">{article.author_name}</span>
                {article.author_role && <span className="article-meta__role">{article.author_role}</span>}
              </span>
            </div>
            <span className="dot" />
            <span>{formatDate(article.published_at)}</span>
            {article.read_time && (
              <>
                <span className="dot" />
                <span>{article.read_time}</span>
              </>
            )}
          </div>
        </header>

        {article.cover_image && (
  <div className="article-cover">
    <img
      src={`${API_BASE}${article.cover_image}`}
      alt={article.cover_alt || ''}
      loading="lazy"
    />
  </div>
)}

        <div className={`article-body${isPoem ? ' poem-body' : ''}`} dangerouslySetInnerHTML={{ __html: article.body }} />

        {article.show_share && <ShareRow label={isPoem ? 'Share this poem' : 'Share this article'} />}

        <CommentForm articleId={article.id} />
      </div>

      <AskSidebar />
    </article>
  );
}
