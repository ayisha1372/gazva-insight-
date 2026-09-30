import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useSite } from '../context/SiteContext.jsx';
import { useDocumentMeta } from '../hooks/useDocumentMeta.js';
import { useRevealOnScroll } from '../hooks/useRevealOnScroll.js';
import Card from '../components/Card.jsx';
import CardSkeleton from '../components/CardSkeleton.jsx';
import AskSidebar from '../components/AskSidebar.jsx';
import { ErrorBlock } from '../components/StateBlock.jsx';

export default function Home() {
  const { site } = useSite();
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const home = site.home;

  useDocumentMeta(home.meta_title, home.meta_description);

  const load = () => {
    setError(false);
    setData(null);
    api.get('/home').then(setData).catch(() => setError(true));
  };
  useEffect(load, []);
  useRevealOnScroll([data]);

  return (
    <>
      <section className="hero" style={{ textAlign: 'center' }}>
        <div className="hero-content" style={{ maxWidth: 640, margin: '0 auto', padding: '80px 24px 72px' }}>
          <h1 className="hero-title">
            {home.hero_title} <span className="hero-title-span">{home.hero_title_accent}</span>
          </h1>
          <p className="hero-text" style={{ fontSize: '1.12rem', color: 'var(--ink-soft)', lineHeight: 1.7, marginBottom: 36 }}>
            {home.hero_text}
          </p>
          <div className="hero-buttons" style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            {home.primary_button?.label && (
              <Link to={home.primary_button.href || '/'} className="btn btn-primary">{home.primary_button.label}</Link>
            )}
            {home.secondary_button?.label && (
              <Link to={home.secondary_button.href || '/'} className="btn btn-outline">{home.secondary_button.label}</Link>
            )}
          </div>
        </div>
      </section>

      <section className="container" style={{ paddingTop: 64 }}>
        <div className="section-head">
          <div>
            <h2>{home.section_title}</h2>
            <p className="section-head__desc">{home.section_description}</p>
          </div>
        </div>

        {error && <ErrorBlock onRetry={load} />}
        {!error && !data && <CardSkeleton count={4} />}
        {!error && data && (
          <div className="mosaic">
            {data.featured.map(({ size, article }) => (
              <Card key={article.id} article={article} size={size} />
            ))}
          </div>
        )}
      </section>

      {!error && data && (
        <section className="page-layout" style={{ paddingTop: 24 }}>
          <div className="page-layout__main">
            {data.latest.length > 0 && (
              <div className="post-grid">
                {data.latest.map((article) => (
                  <Card key={article.id} article={article} />
                ))}
              </div>
            )}
          </div>
          <AskSidebar />
        </section>
      )}
    </>
  );
}
