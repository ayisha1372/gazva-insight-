import { useEffect, useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useSite } from '../context/SiteContext.jsx';

export default function Header() {
  const { site } = useSite();
  const [open, setOpen] = useState(false);

  // Original component.js closed the mobile menu on route change / link click
  const close = () => setOpen(false);
  useEffect(() => { close(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const navCategories = site.categories.filter((c) => c.show_in_nav);

  return (
    <header className="site-header">
      <nav className="navbar" aria-label="Primary">
        <Link to="/" className="navbar__brand" aria-label={`${site.general.site_name} home`} onClick={close}>
          <span className="navbar__logo">
            <img src={site.general.logo_url} alt={site.general.logo_alt} width="40" height="40" style={{ borderRadius: 10, objectFit: 'cover' }} />
          </span>
          <span className="navbar__name">
            GAZVA <span>Insight</span>
          </span>
        </Link>

        <ul className={`navbar__links${open ? ' is-open' : ''}`} id="navbarLinks">
          <li>
            <NavLink to="/" end className={({ isActive }) => (isActive ? 'is-active' : '')} onClick={close}>
              Home
            </NavLink>
          </li>
          {navCategories.map((c) => (
            <li key={c.slug}>
              <NavLink to={`/${c.slug}`} className={({ isActive }) => (isActive ? 'is-active' : '')} onClick={close}>
                {c.name}
              </NavLink>
            </li>
          ))}
        </ul>

        <button
          className="navbar__toggle"
          id="navbarToggle"
          aria-label="Toggle menu"
          aria-expanded={open}
          aria-controls="navbarLinks"
          onClick={() => setOpen((v) => !v)}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </nav>
    </header>
  );
}
