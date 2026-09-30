const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24"><path d="M17.5 14.4c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.1-.6.1-.2.3-.7.9-.9 1-.2.2-.3.2-.6.1-.9-.4-1.8-1-2.6-1.9-.7-.8-1.2-1.6-1.5-2.2-.1-.3 0-.4.1-.6l.4-.5c.1-.2.2-.3.2-.5 0-.2 0-.4-.1-.5-.1-.2-.6-1.5-.8-2-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.3.3-1 .9-1 2.3s1 2.7 1.1 2.9c.1.2 1.7 2.7 4.3 3.7 2.5 1 2.5.7 3 .6.4-.1 1.4-.6 1.6-1.1.2-.6.2-1 .1-1.1-.1-.1-.2-.2-.5-.3Zm-5.5 6.9h-.1a8.9 8.9 0 0 1-4.5-1.2l-.3-.2-3.3.9.9-3.2-.2-.3a8.9 8.9 0 0 1-1.3-4.7c0-4.9 4-8.9 9-8.9 2.4 0 4.6.9 6.3 2.6a8.8 8.8 0 0 1 2.6 6.3c0 5-4 8.9-9.1 8.9Zm7.7-16.6A10.6 10.6 0 0 0 12 1.6c-5.9 0-10.7 4.7-10.7 10.6 0 1.9.5 3.7 1.4 5.2L1.6 22.4l5.2-1.4c1.5.8 3.2 1.3 5 1.3h.1c5.9 0 10.7-4.7 10.7-10.6 0-2.8-1.1-5.5-3.1-7.5Z" /></svg>
);
const FacebookIcon = () => (
  <svg viewBox="0 0 24 24"><path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.16 8.44 9.94v-7.03H7.9v-2.9h2.54V9.84c0-2.5 1.49-3.89 3.78-3.89 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.87h2.78l-.44 2.9h-2.34V22c4.78-.78 8.44-4.94 8.44-9.94Z" /></svg>
);

export default function ShareRow({ label = 'Share this article' }) {
  const share = (platform) => {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(document.title);
    const shareUrl = platform === 'whatsapp' ? `https://wa.me/?text=${title}%20${url}` : `https://www.facebook.com/sharer/sharer.php?u=${url}`;
    window.open(shareUrl, '_blank', 'noopener,width=600,height=600');
  };
  return (
    <div className="share-row">
      <span className="share-row__label">{label}</span>
      <button className="share-btn" aria-label="Share on WhatsApp" onClick={() => share('whatsapp')}><WhatsAppIcon /></button>
      <button className="share-btn" aria-label="Share on Facebook" onClick={() => share('facebook')}><FacebookIcon /></button>
    </div>
  );
}
