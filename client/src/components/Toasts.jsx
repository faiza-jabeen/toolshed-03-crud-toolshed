export function Toasts({ toasts, dismiss }) {
  return (
    <div className="toasts" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div className={`toast toast--${t.tone}`} key={t.id}>
          <p className="toast__msg">{t.message}</p>
          <button className="toast__x" type="button" onClick={() => dismiss(t.id)} aria-label="Dismiss">✕</button>
        </div>
      ))}
    </div>
  );
}
