import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useDocumentMeta } from '../hooks/useDocumentMeta.js';
import { LoadingBlock } from '../components/StateBlock.jsx';
import NotFound from './NotFound.jsx';

export default function About() {
  const [page, setPage] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    api.get('/pages/about').then(setPage).catch(() => setNotFound(true));
  }, []);

  useDocumentMeta(page?.meta_title, page?.meta_description);

  if (notFound) return <NotFound />;
  if (!page) return <LoadingBlock label="Loading" />;

  return (
    <>
      <div className="page-banner">
        <div className="page-banner__inner">
          <span className="eyebrow cat-general">{page.eyebrow}</span>
          <h1>{page.title}</h1>
          <p>{page.description}</p>
        </div>
      </div>

      <section className="about-content" dangerouslySetInnerHTML={{ __html: page.body }} />
    </>
  );
}
