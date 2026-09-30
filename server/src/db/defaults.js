// Default site settings — values copied from the original static HTML/JS.
export const SETTING_DEFAULTS = {
  general: {
    site_name: 'GAZVA Insight',
    logo_url: '/uploads/logo-40.png',
    logo_alt: 'Gazva Insights Logo',
  },
  footer: {
    subline: 'Knowledge & Reflection',
    tagline: 'Cultivating thoughtful minds through authentic Islamic knowledge.',
    copyright: 'GAZVA Insight. GAZVA - FZIWC Chemmad.',
    powered_by: 'Gazva Media',
  },
  socials: {
    instagram: 'https://www.instagram.com/gazvafathimazahra/',
    facebook: 'https://www.facebook.com/p/Fathima-Zahra-Islamic-Womens-College-Chemmad-Students-Union-GAZVA-100071198438474/',
    whatsapp: 'https://wa.me/917593847215',
  },
  contact: {
    address_title: "Fathima Zahra Islamic Women's College",
    address: 'Hidaya Nagar, Chemmad, Tirurangadi P.O., Malappuram District, Kerala 676306, India',
    // NOTE: label (what visitors see) and mailto (where the link goes) are kept exactly as in the original site.
    emails: [
      { label: 'gazvainsight@gmail.com', mailto: 'gazvainsights@gmail.com' },
      { label: 'zahragazva@gmail.com', mailto: 'gazvafathimazahra@gmail.com' },
    ],
    phone_label: '+91 75938 47215',
    phone_href: '#',
    hours: [
      { day: 'Sat-Sun', time: '7:00 AM – 4:00 PM' },
      { day: 'Friday', time: 'Closed' },
    ],
  },
  home: {
    meta_title: 'GAZVA Insights — Quran, Fiqh, Global Affairs, History & More',
    meta_description:
      'Explore authentic Islamic knowledge through research-driven articles, thoughtful reflections, scholarly discussions, and contemporary perspectives at GAZVA Insights.',
    hero_title: 'GAZVA',
    hero_title_accent: 'Insight',
    hero_text: 'Explore authentic Islamic knowledge through thoughtful articles, scholarly insights, and meaningful reflection.',
    primary_button: { label: 'Start reading', href: '/tadabbur' },
    secondary_button: { label: 'Get in Touch', href: '/contact' },
    section_title: 'Explore Every Category',
    section_description: 'Browse the latest insights, thoughtful reflections, and research from every corner of our platform.',
    latest_count: 2,
  },
};
