import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, X, XCircle } from 'lucide-react';

/* ---------------- Toasts ---------------- */
const ToastCtx = createContext(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const push = useCallback((text, kind = 'ok') => {
    const id = Math.random().toString(36).slice(2);
    setItems((l) => [...l, { id, text, kind }]);
    setTimeout(() => setItems((l) => l.filter((t) => t.id !== id)), kind === 'error' ? 6000 : 3200);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="a-toasts" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={`a-toast ${t.kind}`} role="status">
            {t.kind === 'error' ? <XCircle size={18} /> : <CheckCircle2 size={18} />}
            <span>{t.text}</span>
            <button aria-label="Dismiss" onClick={() => setItems((l) => l.filter((x) => x.id !== t.id))}><X size={15} /></button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

/* ---------------- Confirm dialog ----------------
   const ok = await confirm({ title, message, confirmLabel, danger, input: { label, placeholder } })
   → false when cancelled, otherwise { value } (the typed text when there is an input). */
const ConfirmCtx = createContext(() => Promise.resolve(false));
export const useConfirm = () => useContext(ConfirmCtx);

export function ConfirmProvider({ children }) {
  const [dlg, setDlg] = useState(null);
  const [text, setText] = useState('');
  const confirm = useCallback(
    (opts) =>
      new Promise((resolve) => {
        setText('');
        setDlg({ opts, resolve });
      }),
    []
  );
  const close = (result) => {
    dlg?.resolve(result);
    setDlg(null);
  };
  useEffect(() => {
    if (!dlg) return;
    const onKey = (e) => e.key === 'Escape' && close(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }); // eslint-disable-line react-hooks/exhaustive-deps

  const o = dlg?.opts;
  return (
    <ConfirmCtx.Provider value={confirm}>
      {children}
      {dlg && (
        <div className="a-modal-back" onMouseDown={() => close(false)}>
          <div className="a-dialog" role="alertdialog" aria-modal="true" aria-label={o.title} onMouseDown={(e) => e.stopPropagation()}>
            <span className={`a-dialog-ic ${o.danger ? 'danger' : ''}`}><AlertTriangle size={22} /></span>
            <h3>{o.title}</h3>
            {o.message && <p>{o.message}</p>}
            {o.input && (
              <label className="a-field" style={{ marginTop: 12 }}>
                <span className="a-label">{o.input.label}</span>
                <input autoFocus value={text} placeholder={o.input.placeholder} onChange={(e) => setText(e.target.value)} />
              </label>
            )}
            <div className="a-dialog-actions">
              <button className="a-btn" onClick={() => close(false)}>{o.cancelLabel || 'Cancel'}</button>
              <button
                className={`a-btn ${o.danger ? 'danger' : 'primary'}`}
                autoFocus={!o.input}
                onClick={() => close({ value: text.trim() })}
              >
                {o.confirmLabel || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmCtx.Provider>
  );
}

/* ---------------- Small bits ---------------- */
export function Skeleton({ w = '100%', h = 14, r = 8, style }) {
  return <span className="a-skel" style={{ width: w, height: h, borderRadius: r, ...style }} />;
}

export function Badge({ tone = 'gray', children }) {
  return <span className={`a-badge ${tone}`}>{children}</span>;
}

export const STATUS_TONE = { paid: 'green', pending: 'amber', failed: 'red' };

export function Switch({ checked, onChange, label, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      className={`a-switch ${checked ? 'on' : ''}`}
      onClick={onChange}
    >
      <i />
    </button>
  );
}

export function useDebounced(value, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export function usePageTitle(t) {
  const prev = useRef(document.title);
  useEffect(() => {
    const old = prev.current;
    document.title = `${t} · Admin`;
    return () => (document.title = old);
  }, [t]);
}
