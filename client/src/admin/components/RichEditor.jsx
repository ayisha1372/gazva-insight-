import { useRef, useState } from 'react';

/**
 * A lightweight HTML source editor: a textarea plus a toolbar that wraps the current
 * selection in tags, and a live preview tab. Keeps the admin bundle free of a heavy
 * WYSIWYG dependency; the server sanitizes the stored HTML regardless (see sanitize.js),
 * so this is a convenience layer, not the source of truth for what's safe to store.
 */
const TAGS = [
  { label: 'Paragraph', open: '<p>', close: '</p>' },
  { label: 'Heading', open: '<h2>', close: '</h2>' },
  { label: 'Bold', open: '<strong>', close: '</strong>' },
  { label: 'Italic', open: '<em>', close: '</em>' },
  { label: 'Quote', open: '<blockquote>', close: '</blockquote>' },
  { label: 'Link', open: '<a href="https://">', close: '</a>' },
  { label: 'List', open: '<ul>\n  <li>', close: '</li>\n</ul>' },
  { label: 'List item', open: '<li>', close: '</li>' },
  { label: 'Line break', open: '<br>', close: '' },
];

export default function RichEditor({ value, onChange, poem }) {
  const [tab, setTab] = useState('write');
  const ref = useRef(null);

  const wrap = ({ open, close }) => {
    const el = ref.current;
    if (!el) return;
    const { selectionStart: s, selectionEnd: e } = el;
    const selected = value.slice(s, e);
    const next = value.slice(0, s) + open + selected + close + value.slice(e);
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(s + open.length, s + open.length + selected.length);
    });
  };

  const insertPoemStanza = () => wrap({ open: '<p class="poem-malayalam">', close: '</p>' });

  return (
    <div>
      <div className="editor-tabs">
        <button type="button" className={tab === 'write' ? 'is-active' : ''} onClick={() => setTab('write')}>Write</button>
        <button type="button" className={tab === 'preview' ? 'is-active' : ''} onClick={() => setTab('preview')}>Preview</button>
      </div>

      {tab === 'write' ? (
        <>
          <div className="editor-toolbar">
            {TAGS.map((t) => (
              <button type="button" key={t.label} onClick={() => wrap(t)}>{t.label}</button>
            ))}
            {poem && <button type="button" onClick={insertPoemStanza}>Malayalam stanza</button>}
          </div>
          <textarea
            ref={ref}
            className="atextarea editor-body"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            spellCheck={false}
            placeholder="<p>Write the article body as HTML…</p>"
          />
          <p className="afield__hint">
            Use the buttons to wrap selected text in tags, or write HTML directly. Allowed tags: p, h2, h3, h4, blockquote, em,
            strong, ul/ol/li, a, br, img. Anything else is stripped when you save.
          </p>
        </>
      ) : (
        <div className={`editor-preview${poem ? ' poem-body' : ''}`} dangerouslySetInnerHTML={{ __html: value || '<p style="color:var(--ink-muted)">Nothing to preview yet.</p>' }} />
      )}
    </div>
  );
}
