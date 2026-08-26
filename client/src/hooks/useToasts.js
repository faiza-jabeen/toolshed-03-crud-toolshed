import { useCallback, useRef, useState } from 'react';

/** Small toast queue. Kept in a hook so any component can report an outcome. */
export function useToasts() {
  const [toasts, setToasts] = useState([]);
  const seq = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const push = useCallback((tone, message) => {
    const id = ++seq.current;
    setToasts((t) => [...t, { id, tone, message }]);
    setTimeout(() => dismiss(id), tone === 'error' ? 7000 : 4000);
  }, [dismiss]);

  return {
    toasts,
    dismiss,
    ok: (m) => push('ok', m),
    fail: (m) => push('error', m),
  };
}
