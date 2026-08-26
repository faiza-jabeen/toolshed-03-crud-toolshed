import { useEffect, useRef } from 'react';

export function ConfirmDialog({ open, title, body, confirmLabel, busy, onConfirm, onCancel }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    ref.current?.focus();
    const onKey = (e) => { if (e.key === 'Escape' && !busy) onCancel(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, busy, onCancel]);

  if (!open) return null;
  return (
    <div className="sheet" role="dialog" aria-modal="true" aria-label={title}>
      <div className="sheet__scrim" onClick={() => !busy && onCancel()} />
      <div className="sheet__panel sheet__panel--sm">
        <h2 className="sheet__name">{title}</h2>
        <p className="sheet__body">{body}</p>
        <div className="sheet__actions">
          <button className="btn btn--ghost" onClick={onCancel} disabled={busy} ref={ref}>Keep it</button>
          <button className="btn btn--danger" onClick={onConfirm} disabled={busy}>
            {busy && <span className="spinner" />}{busy ? 'Removing…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
