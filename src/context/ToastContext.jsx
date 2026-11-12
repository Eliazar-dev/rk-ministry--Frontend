import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, X } from 'lucide-react';

const ToastContext = createContext(() => {});
export const useToast = () => useContext(ToastContext);

function Toast({ t, onClose }) {
  const [paused, setPaused] = useState(false);
  const left = useRef(t.duration);
  const started = useRef(Date.now());

  useEffect(() => {
    if (paused) {
      left.current -= Date.now() - started.current;
      return;
    }
    started.current = Date.now();
    const id = setTimeout(onClose, Math.max(left.current, 400));
    return () => clearTimeout(id);
  }, [paused]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="toast" role="status" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      {t.image ? <img src={t.image} alt="" /> : <span className="toast-ic"><CheckCircle2 size={22} /></span>}
      <div className="toast-text">
        <strong>{t.title}</strong>
        {t.message && <span>{t.message}</span>}
      </div>
      {t.to && (
        <Link to={t.to} className="toast-link" onClick={onClose}>{t.toLabel || 'View'}</Link>
      )}
      <button className="toast-x" onClick={onClose} aria-label="Dismiss"><X size={16} /></button>
    </div>
  );
}

/** toast({ title, message, image, to, toLabel, duration }) */
export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const close = useCallback((id) => setItems((l) => l.filter((x) => x.id !== id)), []);
  const toast = useCallback((t) => {
    const id = Math.random().toString(36).slice(2);
    setItems((l) => [...l.slice(-2), { duration: 3000, ...t, id }]);
  }, []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toasts" aria-live="polite">
        {items.map((t) => <Toast key={t.id} t={t} onClose={() => close(t.id)} />)}
      </div>
    </ToastContext.Provider>
  );
}
