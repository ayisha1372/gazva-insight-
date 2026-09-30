import { useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function Modal({ title, wide, onClose, children, footer }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return createPortal(
    <div className="amodal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`amodal${wide ? ' is-wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="amodal__header">
          <h2>{title}</h2>
          <button className="abtn abtn-ghost abtn-icon" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="amodal__body">{children}</div>
        {footer && <div className="amodal__footer">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}
