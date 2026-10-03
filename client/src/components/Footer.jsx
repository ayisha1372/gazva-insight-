import { Link } from 'react-router-dom';
import { useSite } from '../context/SiteContext.jsx';

const API_BASE = import.meta.env.VITE_API_URL;

const InstagramIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="2" width="20" height="20" rx="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);
const FacebookIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

export default function Footer() {
  const { site } = useSite();
  const { general, footer, socials } = site;
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <div className="footer__top">
        <div className="footer__col footer__col--brand">
          <div className="footer__brand">
<img
  src={`${API_BASE}${general.logo_url}`}
  alt={general.logo_alt}
  className="footer__logo-img"
/>            <div className="footer__brand-text">
              <span className="footer__brand-name">{general.site_name}</span>
              <span className="footer__brand-subline">{footer.subline}</span>
            </div>
          </div>
          <p className="footer__tagline">{footer.tagline}</p>
        </div>

        <div className="footer__col">
          <h3 className="footer__heading">About</h3>
          <ul className="footer__links">
            <li><Link to="/about">About Us</Link></li>
            <li><Link to="/contact">Contact Us</Link></li>
            <li><Link to="/contact#askQuestionForm">Ask a Question</Link></li>
          </ul>
        </div>

        <div className="footer__col">
          <h3 className="footer__heading">Follow Us</h3>
          <div className="footer__socials">
            {socials.instagram && (
              <a href={socials.instagram} className="footer__social-btn" aria-label="Instagram" target="_blank" rel="noopener noreferrer">
                <InstagramIcon />
              </a>
            )}
            {socials.facebook && (
              <a href={socials.facebook} className="footer__social-btn" aria-label="Facebook" target="_blank" rel="noopener noreferrer">
                <FacebookIcon />
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="footer__bottom">
        <div className="footer__bottom-inner">
          <span>
            &copy; <span id="footerYear">{year}</span> {footer.copyright}
          </span>
          <span>
            Powered by <span style={{ color: '#9FC1AC' }}>{footer.powered_by}</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
