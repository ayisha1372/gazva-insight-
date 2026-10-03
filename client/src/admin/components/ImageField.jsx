import { useState } from 'react';
import MediaPicker from './MediaPicker.jsx';

const API_BASE = import.meta.env.VITE_API_URL;

/** A form field that shows a preview thumbnail and opens MediaPicker to choose/replace it. */
export default function ImageField({ label, value, onChange, hint }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="afield">
      {label && <label>{label}</label>}
      <div className="image-picker">
{value ? (
  <img
    src={
      value.startsWith('http')
        ? value
        : value.startsWith('/uploads/')
          ? `${API_BASE}${value}`
          : `${API_BASE}/uploads/${value}`
    }
    alt=""
    className="image-picker__preview"
  />
) : (
  <div className="image-picker__empty" />
)}        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="abtn abtn-outline abtn-sm" onClick={() => setOpen(true)}>{value ? 'Replace' : 'Choose image'}</button>
            {value && <button type="button" className="abtn abtn-ghost abtn-sm" onClick={() => onChange('')}>Remove</button>}
          </div>
          {hint && <span className="afield__hint">{hint}</span>}
        </div>
      </div>
      {open && <MediaPicker onClose={() => setOpen(false)} onSelect={({ url }) => { onChange(url); setOpen(false); }} />}
    </div>
  );
}
