import { Link } from 'react-router-dom';
const API_BASE = import.meta.env.VITE_API_URL;

const FALLBACK_IMG =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="250"><rect width="100%" height="100%" fill="%23DEF1ED"/></svg>');

/**
 * A listing card, matching the original .card / .card--lead / .card--wide markup exactly.
 * `size` controls the mosaic span classes; omit it for the plain post-grid layout.
 */
export default function Card({ article, size }) {
  const sizeClass = size === 'lead' ? ' card--lead' : size === 'wide' ? ' card--wide' : '';
  return (
    <Link to={`/${article.category.slug}/${article.slug}`} className={`card${sizeClass}`}>
      <div className="card__media">
        <img
  src={article.image ? `${API_BASE}${article.image}` : FALLBACK_IMG}
  alt=""
  loading="lazy"
/>
      </div>
      <div className="card__body">
        <span
          className={`eyebrow cat-${article.category.slug}`}
          style={article.category.color ? { color: article.category.color, '--eyebrow-dot': article.category.color } : undefined}
        >
          {article.label || article.category.name}
        </span>
        <h3 className="card__title">{article.title}</h3>
        <p className="card__excerpt">{article.excerpt}</p>
        <div className="card__meta">
          <span>{article.author_name}</span>
          <span className="dot" />
          <span>{formatDate(article.published_at)}</span>
        </div>
      </div>
    </Link>
  );
}

export function formatDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}
