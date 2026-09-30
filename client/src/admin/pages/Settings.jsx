import { useState } from 'react';
import GeneralTab from './settings/GeneralTab.jsx';
import FooterTab from './settings/FooterTab.jsx';
import SocialsTab from './settings/SocialsTab.jsx';
import ContactInfoTab from './settings/ContactInfoTab.jsx';
import HomeTab from './settings/HomeTab.jsx';
import FeaturedTab from './settings/FeaturedTab.jsx';
import PageTab from './settings/PageTab.jsx';

const TABS = [
  { key: 'general', label: 'General' },
  { key: 'home', label: 'Homepage' },
  { key: 'featured', label: 'Featured articles' },
  { key: 'footer', label: 'Footer' },
  { key: 'socials', label: 'Social links' },
  { key: 'contact-info', label: 'Contact info' },
  { key: 'about-page', label: 'About page' },
  { key: 'contact-page', label: 'Contact page banner' },
];

export default function Settings() {
  const [tab, setTab] = useState('general');

  return (
    <>
      <div className="admin-header">
        <div>
          <h1>Site settings</h1>
          <p>Content shown across the whole site — header, footer, homepage and static pages.</p>
        </div>
      </div>

      <div className="settings-shell">
        <div className="settings-tabs">
          {TABS.map((t) => (
            <button key={t.key} className={tab === t.key ? 'is-active' : ''} onClick={() => setTab(t.key)}>{t.label}</button>
          ))}
        </div>
        <div>
          {tab === 'general' && <GeneralTab />}
          {tab === 'home' && <HomeTab />}
          {tab === 'featured' && <FeaturedTab />}
          {tab === 'footer' && <FooterTab />}
          {tab === 'socials' && <SocialsTab />}
          {tab === 'contact-info' && <ContactInfoTab />}
          {tab === 'about-page' && <PageTab slug="about" />}
          {tab === 'contact-page' && <PageTab slug="contact" />}
        </div>
      </div>
    </>
  );
}
