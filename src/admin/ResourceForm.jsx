import { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, Save, X } from 'lucide-react';
import { ApiError } from '../api/http';
import { mp, todayISO } from './api';
import ImageField from './ImageField';
import { Skeleton, Switch, useConfirm, useToast } from './ui';

const empty = (f) => (f.type === 'bool' ? false : f.type === 'date' ? todayISO() : '');
const ytId = (u = '') => (u.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([A-Za-z0-9_-]{11})/) || [])[1];

const initialFor = (fields, rec, defaults) =>
  Object.fromEntries(
    fields.map((f) => {
      const fromRec = f.srcKey ? rec?.[f.srcKey] || rec?.[f.name] : rec?.[f.name];
      return [f.name, fromRec ?? defaults?.[f.name] ?? f.default ?? empty(f)];
    })
  );

function validate(fields, v) {
  const e = {};
  for (const f of fields) {
    const val = v[f.name];
    const blank = val === '' || val == null;
    if (f.required && f.type !== 'bool' && blank) e[f.name] = 'This is required.';
    else if (!blank && (f.type === 'url' || f.type === 'youtube') && !/^https?:\/\/\S+\.\S+/.test(val)) e[f.name] = 'Enter a full link starting with https://';
    else if (!blank && f.https && !/^https:\/\//i.test(val)) e[f.name] = 'The link must start with https://';
    else if (!blank && f.type === 'number' && (Number.isNaN(Number(val)) || (f.min != null && Number(val) < f.min))) e[f.name] = f.min != null ? `Enter a number of at least ${f.min}.` : 'Enter a number.';
    else if (!blank && f.max && String(val).length > f.max) e[f.name] = `Keep this under ${f.max} characters.`;
  }
  return e;
}

/**
 * Generic form built from a field list. Only the fields you changed are sent when editing, so saves are small and fast.
 * props: fields, endpoint, id (edit) | null (new), singleton, defaults, mode 'panel'|'page', title, onSaved, onClose
 */
export default function ResourceForm({ fields, endpoint, id, singleton, defaults, mode = 'panel', title, onSaved, onClose }) {
  const toast = useToast();
  const confirm = useConfirm();
  const path = singleton ? `${endpoint}/` : id ? `${endpoint}/${id}/` : `${endpoint}/`;
  const [loading, setLoading] = useState(Boolean(id) || singleton);
  const [rec, setRec] = useState(null);
  const [vals, setVals] = useState(() => initialFor(fields, null, defaults));
  const [errs, setErrs] = useState({});
  const [saving, setSaving] = useState(false);
  const [loadErr, setLoadErr] = useState('');
  const first = useRef(null);

  useEffect(() => {
    if (!id && !singleton) return;
    const ctl = new AbortController();
    mp(path, { signal: ctl.signal })
      .then((r) => {
        setRec(r);
        setVals(initialFor(fields, r, defaults));
        setLoading(false);
      })
      .catch((ex) => ex.name !== 'AbortError' && (setLoadErr(ex.message), setLoading(false)));
    return () => ctl.abort();
  }, [path]); // eslint-disable-line react-hooks/exhaustive-deps

  const base = useMemo(() => initialFor(fields, rec, defaults), [fields, rec, defaults]);
  const dirty = fields.some((f) => vals[f.name] !== base[f.name]);
  const set = (name) => (value) => {
    setVals((v) => ({ ...v, [name]: value }));
    setErrs((e) => (e[name] ? { ...e, [name]: undefined } : e));
  };

  const close = async () => {
    if (dirty && !(await confirm({ title: 'Discard your changes?', message: 'What you typed will be lost.', confirmLabel: 'Discard', danger: true }))) return;
    onClose?.();
  };

  useEffect(() => {
    if (mode !== 'panel') return;
    const onKey = (e) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!loading) first.current?.querySelector('input:not([type=hidden]):not([type=file]),textarea,select')?.focus();
  }, [loading]);

  const submit = async (e) => {
    e.preventDefault();
    const found = validate(fields, vals);
    setErrs(found);
    if (Object.keys(found).length) {
      document.querySelector('.a-field.has-err')?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return;
    }
    const payload = {};
    for (const f of fields) {
      const v = vals[f.name];
      const changed = v !== base[f.name];
      if (id || singleton ? changed : v !== '') payload[f.name] = f.type === 'number' ? Number(v) : v;
    }
    if ((id || singleton) && !Object.keys(payload).length) return onClose?.();
    setSaving(true);
    try {
      const saved = await mp(path, { method: singleton ? 'PUT' : id ? 'PATCH' : 'POST', body: payload });
      toast(singleton ? 'Saved.' : id ? 'Changes saved.' : 'Created.');
      onSaved?.(saved);
      if (singleton) {
        setRec(saved);
        setVals(initialFor(fields, saved, defaults));
      }
    } catch (ex) {
      if (ex instanceof ApiError && ex.data && typeof ex.data === 'object' && !ex.data.detail) {
        setErrs(Object.fromEntries(Object.entries(ex.data).map(([k, m]) => [k, Array.isArray(m) ? m[0] : String(m)])));
        toast('Please fix the highlighted fields.', 'error');
      } else toast(ex.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const body = loading ? (
    <div className="a-form-body">{[1, 2, 3, 4].map((n) => <div key={n} style={{ marginBottom: 18 }}><Skeleton w="30%" h={12} /><Skeleton h={40} r={12} style={{ marginTop: 8 }} /></div>)}</div>
  ) : loadErr ? (
    <div className="a-form-body"><div className="a-err">{loadErr}</div></div>
  ) : (
    <form onSubmit={submit} noValidate>
      <div className="a-form-body" ref={first}>
        {fields.map((f) => (
          <div key={f.name} className={`a-field ${errs[f.name] ? 'has-err' : ''} ${f.type === 'bool' ? 'inline' : ''}`}>
            {f.type === 'bool' ? (
              <>
                <Switch checked={!!vals[f.name]} onChange={() => set(f.name)(!vals[f.name])} label={f.label} />
                <span className="a-label">{f.label}</span>
              </>
            ) : (
              <label className="a-label" htmlFor={`f-${f.name}`}>{f.label}{f.required && <b> *</b>}</label>
            )}

            {['text', 'url', 'youtube', 'date', 'number'].includes(f.type) && (
              <input
                id={`f-${f.name}`}
                className="a-input"
                type={f.type === 'date' ? 'date' : f.type === 'number' ? 'number' : 'text'}
                inputMode={f.type === 'number' ? 'numeric' : undefined}
                value={vals[f.name] ?? ''}
                placeholder={f.placeholder}
                min={f.min}
                maxLength={f.max}
                onChange={(e) => set(f.name)(e.target.value)}
              />
            )}
            {f.type === 'youtube' && ytId(vals[f.name]) && (
              <img className="a-yt" src={`https://img.youtube.com/vi/${ytId(vals[f.name])}/mqdefault.jpg`} alt="Video preview" />
            )}
            {f.type === 'textarea' && (
              <textarea id={`f-${f.name}`} className="a-input" rows={f.rows || 4} value={vals[f.name] ?? ''} maxLength={f.max} onChange={(e) => set(f.name)(e.target.value)} />
            )}
            {f.type === 'select' && (
              <select id={`f-${f.name}`} className="a-input" value={vals[f.name]} onChange={(e) => set(f.name)(e.target.value)}>
                {f.options.map(([val, label]) => <option key={val} value={val}>{label}</option>)}
              </select>
            )}
            {['image', 'raw', 'video'].includes(f.type) && (
              <ImageField id={`f-${f.name}`} type={f.type} folder={f.folder} value={vals[f.name]} onChange={set(f.name)} />
            )}

            {f.max && f.type === 'textarea' && <small className="a-help">{String(vals[f.name] || '').length}/{f.max}</small>}
            {f.help && <small className="a-help">{f.help}</small>}
            {errs[f.name] && <small className="a-err" role="alert">{errs[f.name]}</small>}
          </div>
        ))}
      </div>
      <div className="a-form-foot">
        {mode === 'panel' && <button type="button" className="a-btn" onClick={close}>Cancel</button>}
        <button className="a-btn primary" disabled={saving || (!dirty && Boolean(id || singleton))}>
          {saving ? <><Loader2 size={16} className="spin" /> Saving…</> : <><Save size={16} /> {singleton ? 'Save changes' : id ? 'Save changes' : 'Create'}</>}
        </button>
      </div>
    </form>
  );

  if (mode === 'page') {
    return <div className="a-card a-page-form">{body}</div>;
  }
  return (
    <div className="a-modal-back right" onMouseDown={close}>
      <aside className="a-slide" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(e) => e.stopPropagation()}>
        <header><h2>{title}</h2><button className="a-icon" onClick={close} aria-label="Close"><X size={18} /></button></header>
        {body}
      </aside>
    </div>
  );
}
