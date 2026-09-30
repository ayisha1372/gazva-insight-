import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '../api.js';

const SiteContext = createContext(null);

const FALLBACK = {
  general: { site_name: 'GAZVA Insight', logo_url: '/uploads/logo-40.png', logo_alt: 'Gazva Insights Logo' },
  footer: { subline: '', tagline: '', copyright: '', powered_by: '' },
  socials: { instagram: '', facebook: '', whatsapp: '' },
  contact: { address_title: '', address: '', emails: [], phone_label: '', phone_href: '#', hours: [] },
  home: { meta_title: '', meta_description: '', hero_title: 'GAZVA', hero_title_accent: 'Insight', hero_text: '', primary_button: {}, secondary_button: {}, section_title: '', section_description: '', latest_count: 2 },
  categories: [],
};

export function SiteProvider({ children }) {
  const [site, setSite] = useState(FALLBACK);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    api
      .get('/site')
      .then((data) => setSite(data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  return <SiteContext.Provider value={{ site, loading, error, reload: load }}>{children}</SiteContext.Provider>;
}

export const useSite = () => useContext(SiteContext);
