-- GAZVA Insight — PostgreSQL schema (idempotent: safe to run repeatedly)

CREATE TABLE IF NOT EXISTS admins (
  id              SERIAL PRIMARY KEY,
  email           TEXT        NOT NULL,
  name            TEXT        NOT NULL DEFAULT 'Admin',
  password_hash   TEXT        NOT NULL,
  token_version   INTEGER     NOT NULL DEFAULT 0,      -- bump to invalidate all existing sessions
  failed_attempts INTEGER     NOT NULL DEFAULT 0,
  locked_until    TIMESTAMPTZ,
  last_login_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS admins_email_key ON admins (lower(email));

CREATE TABLE IF NOT EXISTS categories (
  id                 SERIAL PRIMARY KEY,
  slug               TEXT        NOT NULL UNIQUE,
  name               TEXT        NOT NULL,
  color              TEXT,                              -- optional override; the 8 original categories use the stylesheet colours
  banner_title       TEXT        NOT NULL DEFAULT '',
  banner_description TEXT        NOT NULL DEFAULT '',
  meta_description   TEXT        NOT NULL DEFAULT '',
  sort_order         INTEGER     NOT NULL DEFAULT 0,
  show_in_nav        BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS articles (
  id               SERIAL PRIMARY KEY,
  category_id      INTEGER     NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  slug             TEXT        NOT NULL,
  title            TEXT        NOT NULL,
  excerpt          TEXT        NOT NULL DEFAULT '',
  body             TEXT        NOT NULL DEFAULT '',     -- sanitised HTML
  cover_image      TEXT,
  cover_alt        TEXT,
  card_image       TEXT,                                -- optional separate thumbnail; falls back to cover_image
  author_name      TEXT        NOT NULL DEFAULT '',
  author_role      TEXT        NOT NULL DEFAULT '',
  author_avatar    TEXT,
  label            TEXT,                                -- overrides the category name in the small coloured eyebrow
  style            TEXT        NOT NULL DEFAULT 'standard' CHECK (style IN ('standard','poem')),
  show_share       BOOLEAN     NOT NULL DEFAULT TRUE,
  read_time        TEXT,
  meta_description TEXT,
  status           TEXT        NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  published_at     DATE        NOT NULL DEFAULT CURRENT_DATE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (category_id, slug)
);
CREATE INDEX IF NOT EXISTS articles_listing_idx ON articles (status, published_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS articles_category_idx ON articles (category_id);

CREATE TABLE IF NOT EXISTS media (
  id            SERIAL PRIMARY KEY,
  filename      TEXT        NOT NULL UNIQUE,
  original_name TEXT        NOT NULL,
  mime          TEXT        NOT NULL,
  size          INTEGER     NOT NULL,
  alt           TEXT        NOT NULL DEFAULT '',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Cards shown in the homepage mosaic ("Explore Every Category"), in display order
CREATE TABLE IF NOT EXISTS home_featured (
  id         SERIAL PRIMARY KEY,
  article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  position   INTEGER NOT NULL DEFAULT 0,
  size       TEXT    NOT NULL DEFAULT 'normal' CHECK (size IN ('lead','wide','normal')),
  UNIQUE (article_id)
);

-- Grouped site settings (general, footer, socials, contact, home) stored as JSON documents
CREATE TABLE IF NOT EXISTS settings (
  key        TEXT PRIMARY KEY,
  value      JSONB       NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Editable static pages (About, Contact banner)
CREATE TABLE IF NOT EXISTS pages (
  slug             TEXT PRIMARY KEY,
  meta_title       TEXT        NOT NULL DEFAULT '',
  meta_description TEXT        NOT NULL DEFAULT '',
  eyebrow          TEXT        NOT NULL DEFAULT '',
  title            TEXT        NOT NULL DEFAULT '',
  description      TEXT        NOT NULL DEFAULT '',
  body             TEXT        NOT NULL DEFAULT '',
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Everything visitors submit: contact form, "Ask your question" sidebar, article comments
CREATE TABLE IF NOT EXISTS messages (
  id            SERIAL PRIMARY KEY,
  type          TEXT        NOT NULL CHECK (type IN ('contact','question','comment')),
  name          TEXT        NOT NULL,
  email         TEXT        NOT NULL,
  phone         TEXT,
  subject       TEXT,
  category      TEXT,
  message       TEXT        NOT NULL,
  article_id    INTEGER     REFERENCES articles(id) ON DELETE SET NULL,
  article_title TEXT,
  is_read       BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS messages_inbox_idx ON messages (is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS messages_type_idx ON messages (type, created_at DESC);
