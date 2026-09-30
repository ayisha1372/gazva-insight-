import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { api, ApiError } from '../../api.js';
import { useSite } from '../../context/SiteContext.jsx';
// NOTE: the public /api/site categories list has no numeric `id` (only slug/name/color) —
// this editor needs real ids to submit category_id, so it loads the admin categories list instead.
import { useToast } from '../components/Toast.jsx';
import ImageField from '../components/ImageField.jsx';
import RichEditor from '../components/RichEditor.jsx';

const empty = {
  title: '', slug: '', category_id: '', excerpt: '', body: '',
  cover_image: '', cover_alt: '', card_image: '',
  author_name: '', author_role: '', author_avatar: '',
  label: '', style: 'standard', show_share: true, read_time: '',
  meta_description: '', status: 'draft', published_at: new Date().toISOString().slice(0, 10),
};

export default function ArticleEditor() {
  const { id } = useParams();
  const isNew = id === 'new';
  const navigate = useNavigate();
  const { reload: reloadSite } = useSite();
  const toast = useToast();

  const [form, setForm] = useState(empty);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [savedMeta, setSavedMeta] = useState(null); // { slug, category_slug } once we know it

  useEffect(() => {
    api.get('/admin/categories').then((d) => setCategories(d.items)).catch(() => {});
  }, []);

  useEffect(() => {
    if (isNew) {
      setForm(empty);
      return;
    }
    api.get(`/admin/articles/${id}`).then(({ item }) => {
      setForm({
        title: item.title, slug: item.slug, category_id: item.category_id, excerpt: item.excerpt, body: item.body,
        cover_image: item.cover_image || '', cover_alt: item.cover_alt || '', card_image: item.card_image || '',
        author_name: item.author_name, author_role: item.author_role, author_avatar: item.author_avatar || '',
        label: item.label || '', style: item.style, show_share: item.show_share, read_time: item.read_time || '',
        meta_description: item.meta_description || '', status: item.status, published_at: item.published_at,
      });
      setSavedMeta({ slug: item.slug, category_slug: item.category_slug });
      setLoading(false);
    }).catch(() => { toast('Could not load this article.', 'error'); navigate('/admin/articles'); });
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async (e, andPublish) => {
    e?.preventDefault();
    setSaving(true);
    setFieldErrors({});
    const payload = { ...form, category_id: Number(form.category_id), status: andPublish ? 'published' : form.status };
    try {
      const res = isNew ? await api.post('/admin/articles', payload) : await api.put(`/admin/articles/${id}`, payload);
      toast(isNew ? 'Article created.' : 'Article saved.');
      reloadSite();
      if (isNew) navigate(`/admin/articles/${res.item.id}`, { replace: true });
      else setSavedMeta({ slug: res.item.slug, category_slug: categories.find((c) => c.id === Number(form.category_id))?.slug });
      if (andPublish) setForm((f) => ({ ...f, status: 'published' }));
    } catch (err) {
      if (err instanceof ApiError && err.fields) setFieldErrors(err.fields);
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="admin-page-loading"><div className="spinner" /></div>;

  const previewHref = savedMeta ? `/${savedMeta.category_slug}/${savedMeta.slug}?preview=1` : null;

  return (
    <>
      <div className="admin-header">
        <div>
          <h1>{isNew ? 'New article' : 'Edit article'}</h1>
          <p>{isNew ? 'Create a new post for the site.' : `Editing "${form.title}"`}</p>
        </div>
        <div className="admin-header__actions">
          {previewHref && <Link to={previewHref} target="_blank" className="abtn abtn-outline">Preview</Link>}
          <Link to="/admin/articles" className="abtn abtn-outline">Back to list</Link>
        </div>
      </div>

      <form onSubmit={(e) => save(e, false)} noValidate>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }} className="editor-grid">
          <div className="admin-card admin-card__pad">
            <div className="afield">
              <label htmlFor="a-title">Title</label>
              <input id="a-title" className={`ainput${fieldErrors.title ? ' has-error' : ''}`} value={form.title} onChange={(e) => set('title')(e.target.value)} required />
              {fieldErrors.title && <p className="afield__error">{fieldErrors.title}</p>}
            </div>
            <div className="afield">
              <label htmlFor="a-excerpt">Excerpt</label>
              <textarea id="a-excerpt" className="atextarea" style={{ minHeight: 70 }} value={form.excerpt} onChange={(e) => set('excerpt')(e.target.value)} placeholder="Short summary shown on cards and listing pages" />
            </div>
            <div className="afield">
              <label>Body</label>
              <RichEditor value={form.body} onChange={set('body')} poem={form.style === 'poem'} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="admin-card admin-card__pad">
              <div className="afield">
                <label htmlFor="a-status">Status</label>
                <select id="a-status" className="aselect" value={form.status} onChange={(e) => set('status')(e.target.value)}>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
              <div className="afield">
                <label htmlFor="a-date">Published date</label>
                <input id="a-date" type="date" className="ainput" value={form.published_at} onChange={(e) => set('published_at')(e.target.value)} />
              </div>
              <div className="afield" style={{ marginBottom: 0 }}>
                <label htmlFor="a-category">Category</label>
                <select id="a-category" className={`aselect${fieldErrors.category_id ? ' has-error' : ''}`} value={form.category_id} onChange={(e) => set('category_id')(e.target.value)} required>
                  <option value="">Choose a category…</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {fieldErrors.category_id && <p className="afield__error">{fieldErrors.category_id}</p>}
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
                <button type="submit" className="abtn abtn-outline" disabled={saving} style={{ flex: 1 }}>
                  {saving ? 'Saving…' : 'Save'}
                </button>
                {form.status !== 'published' && (
                  <button type="button" className="abtn abtn-primary" disabled={saving} style={{ flex: 1 }} onClick={(e) => save(e, true)}>
                    Publish
                  </button>
                )}
              </div>
            </div>

            <div className="admin-card admin-card__pad">
              <h3 style={{ fontSize: '0.9rem', marginBottom: 12 }}>Images</h3>
              <ImageField label="Cover image" value={form.cover_image} onChange={set('cover_image')} hint="Shown at the top of the article" />
              <div className="afield">
                <label htmlFor="a-cover-alt">Cover image alt text</label>
                <input id="a-cover-alt" className="ainput" value={form.cover_alt} onChange={(e) => set('cover_alt')(e.target.value)} placeholder="Describe the image for accessibility" />
              </div>
              <ImageField label="Card thumbnail (optional)" value={form.card_image} onChange={set('card_image')} hint="Used on listing cards instead of the cover image" />
            </div>

            <div className="admin-card admin-card__pad">
              <h3 style={{ fontSize: '0.9rem', marginBottom: 12 }}>Author</h3>
              <div className="afield">
                <label htmlFor="a-author-name">Name</label>
                <input id="a-author-name" className="ainput" value={form.author_name} onChange={(e) => set('author_name')(e.target.value)} />
              </div>
              <div className="afield">
                <label htmlFor="a-author-role">Role</label>
                <input id="a-author-role" className="ainput" value={form.author_role} onChange={(e) => set('author_role')(e.target.value)} placeholder="e.g. Degree Second Year" />
              </div>
              <ImageField label="Author avatar (optional)" value={form.author_avatar} onChange={set('author_avatar')} />
            </div>

            <div className="admin-card admin-card__pad">
              <h3 style={{ fontSize: '0.9rem', marginBottom: 12 }}>More options</h3>
              <div className="afield">
                <label htmlFor="a-slug">URL slug</label>
                <input id="a-slug" className={`ainput${fieldErrors.slug ? ' has-error' : ''}`} value={form.slug} onChange={(e) => set('slug')(e.target.value)} placeholder="auto-generated from title if left blank" />
                {fieldErrors.slug && <p className="afield__error">{fieldErrors.slug}</p>}
              </div>
              <div className="afield">
                <label htmlFor="a-label">Eyebrow label (optional)</label>
                <input id="a-label" className="ainput" value={form.label} onChange={(e) => set('label')(e.target.value)} placeholder="Overrides the category name, e.g. MEET THE SCHOLAR" />
              </div>
              <div className="afield">
                <label htmlFor="a-style">Layout style</label>
                <select id="a-style" className="aselect" value={form.style} onChange={(e) => set('style')(e.target.value)}>
                  <option value="standard">Standard article</option>
                  <option value="poem">Poem</option>
                </select>
              </div>
              <div className="afield">
                <label htmlFor="a-read-time">Read time (optional)</label>
                <input id="a-read-time" className="ainput" value={form.read_time} onChange={(e) => set('read_time')(e.target.value)} placeholder="e.g. 6 min read" />
              </div>
              <div className="afield">
                <label htmlFor="a-meta">Meta description (SEO, optional)</label>
                <textarea id="a-meta" className="atextarea" style={{ minHeight: 60 }} value={form.meta_description} onChange={(e) => set('meta_description')(e.target.value)} />
              </div>
              <label className="acheck">
                <input type="checkbox" checked={form.show_share} onChange={(e) => set('show_share')(e.target.checked)} />
                Show share buttons
              </label>
            </div>
          </div>
        </div>
      </form>
    </>
  );
}
