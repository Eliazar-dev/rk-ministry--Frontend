import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronDown, ChevronLeft, ChevronRight, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { cacheGet, cacheSet, invalidate, qs } from './api';
import { mp } from './api';
import { formatCell, RESOURCES } from './resources';
import ResourceForm from './ResourceForm';
import { Badge, STATUS_TONE, Skeleton, Switch, useConfirm, useDebounced, usePageTitle, useToast } from './ui';

const PAGE = 20;

function Cell({ col, row }) {
  const v = row[col.key];
  if (col.type === 'status') return <Badge tone={STATUS_TONE[v]}>{v}</Badge>;
  if (col.type === 'badge') return <Badge tone="navy">{v}</Badge>;
  if (col.type === 'role') return v ? <Badge tone="gold">Admin</Badge> : <Badge>Member</Badge>;
  if (col.type === 'clip') return <span className="a-clip">{v}</span>;
  return <>{formatCell(col, row)}</>;
}

const Row = memo(function Row({ cfg, row, open, onToggle, onEdit, onDelete, onAction, onExpand }) {
  const cols = cfg.columns;
  const thumb = cfg.thumb && row[cfg.thumb];
  const canOpen = Boolean(cfg.detail);
  const acts = (cfg.actions || []).filter((a) => a.when(row));
  const main = cols[0];
  return (
    <>
      <tr className={open ? 'open' : ''} onClick={canOpen ? () => onExpand(row.id) : undefined} style={canOpen ? { cursor: 'pointer' } : undefined}>
        {cfg.thumb !== undefined && <td className="a-thumb">{thumb ? <img src={thumb} alt="" loading="lazy" /> : <span />}</td>}
        {cols.map((c) => <td key={c.key} className={c.bold ? 'bold' : ''}><Cell col={c} row={row} /></td>)}
        {(cfg.toggles || []).map(([f, label]) => (
          <td key={f} onClick={(e) => e.stopPropagation()}><Switch checked={!!row[f]} label={`${label}: ${row[main.key]}`} onChange={() => onToggle(row, f)} /></td>
        ))}
        <td className="a-actions" onClick={(e) => e.stopPropagation()}>
          {acts.map((a) => <button key={a.path} className="a-btn sm primary" onClick={() => onAction(row, a)}>{a.label}</button>)}
          {!cfg.readOnly && <button className="a-icon" onClick={() => onEdit(row)} aria-label="Edit"><Pencil size={16} /></button>}
          {!cfg.noDelete && <button className="a-icon danger" onClick={() => onDelete(row)} aria-label="Delete"><Trash2 size={16} /></button>}
          {canOpen && <span className={`a-chev ${open ? 'up' : ''}`}><ChevronDown size={16} /></span>}
        </td>
      </tr>
      {open && canOpen && (
        <tr className="a-detail"><td colSpan={99}>
          <dl>{cfg.detail(row).map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
        </td></tr>
      )}
    </>
  );
});

export default function ResourceList({ resKey }) {
  const cfg = RESOURCES[resKey];
  const toast = useToast();
  const confirm = useConfirm();
  const [params, setParams] = useSearchParams();
  const section = params.get('section') || '';
  const kind = params.get('kind') || '';
  const status = params.get('status') || '';
  const [q, setQ] = useState('');
  const dq = useDebounced(q);
  const [page, setPage] = useState(1);
  const [state, setState] = useState({ rows: [], count: 0, loading: true, error: '' });
  const [editing, setEditing] = useState(null); // null | 'new' | id
  const [openRow, setOpenRow] = useState(null);
  const [tick, setTick] = useState(0);
  usePageTitle(cfg.label);

  useEffect(() => setPage(1), [dq, section, kind, status]);

  const key = `${cfg.endpoint}?${qs({ page, q: dq, section, kind, status })}`;
  useEffect(() => {
    const cached = cacheGet(key);
    setState(cached ? { ...cached, loading: false, error: '' } : (s) => ({ ...s, loading: true, error: '' }));
    const ctl = new AbortController();
    mp(`${key}${key.includes('?') ? '&' : '?'}page_size=${PAGE}`, { signal: ctl.signal })
      .then((d) => {
        const next = { rows: d.results, count: d.count };
        cacheSet(key, next);
        setState({ ...next, loading: false, error: '' });
      })
      .catch((ex) => ex.name !== 'AbortError' && setState((s) => ({ ...s, loading: false, error: ex.message })));
    return () => ctl.abort();
  }, [key, tick]);

  const refresh = () => { invalidate(`${cfg.endpoint}?`); setTick((t) => t + 1); };

  const patchRow = useCallback((id, patch) => setState((s) => ({ ...s, rows: s.rows.map((r) => (r.id === id ? { ...r, ...patch } : r)) })), []);

  const onToggle = useCallback(async (row, field) => {
    const value = !row[field];
    patchRow(row.id, { [field]: value }); // instant
    try {
      await mp(`${cfg.endpoint}/${row.id}/`, { method: 'PATCH', body: { [field]: value } });
      invalidate(`${cfg.endpoint}?`);
    } catch (ex) {
      patchRow(row.id, { [field]: !value });
      toast(ex.message, 'error');
    }
  }, [cfg.endpoint, patchRow, toast]);

  const onDelete = useCallback(async (row) => {
    const name = row[cfg.columns[0].key];
    if (!(await confirm({ title: `Delete this ${cfg.one}?`, message: `“${String(name).slice(0, 80)}” will be removed for good.`, confirmLabel: 'Delete', danger: true }))) return;
    try {
      await mp(`${cfg.endpoint}/${row.id}/`, { method: 'DELETE' });
      toast('Deleted.');
      refresh();
    } catch (ex) {
      toast(ex.message, 'error');
    }
  }, [cfg, confirm, toast]); // eslint-disable-line react-hooks/exhaustive-deps

  const onAction = useCallback(async (row, a) => {
    const res = await confirm({ title: `${a.label}?`, message: 'Use this only if the money is already in your M-Pesa account. A receipt email is sent to the customer.', confirmLabel: a.label, input: { label: a.ask, placeholder: 'e.g. QGH7XXXXXX' } });
    if (!res) return;
    try {
      patchRow(row.id, await mp(`${cfg.endpoint}/${row.id}/${a.path}/`, { method: 'POST', body: { receipt: res.value } }));
      invalidate(`${cfg.endpoint}?`);
      toast('Marked as paid.');
    } catch (ex) {
      toast(ex.message, 'error');
    }
  }, [cfg.endpoint, confirm, patchRow, toast]);

  const onEdit = useCallback((row) => setEditing(row.id), []);
  const onExpand = useCallback((id) => setOpenRow((o) => (o === id ? null : id)), []);
  const setParam = (k, v) => setParams((p) => { v ? p.set(k, v) : p.delete(k); return p; }, { replace: true });

  const pages = Math.max(1, Math.ceil(state.count / PAGE));
  const colCount = cfg.columns.length + (cfg.thumb !== undefined ? 1 : 0) + (cfg.toggles?.length || 0) + 1;
  const tabs = cfg.sections ? ['section', section, cfg.sections] : cfg.kinds ? ['kind', kind, cfg.kinds] : null;
  const searchRef = useRef(null);

  return (
    <div>
      <div className="a-head">
        <div><h1>{cfg.label}</h1>{cfg.sortHint && <p className="a-sub">{cfg.sortHint}</p>}</div>
        {!cfg.readOnly && <button className="a-btn primary" onClick={() => setEditing('new')}><Plus size={17} /> Add {cfg.one}</button>}
      </div>

      <div className="a-toolbar">
        <label className="a-search"><Search size={16} /><input ref={searchRef} value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${cfg.label.toLowerCase()}…`} aria-label="Search" /></label>
        {tabs && (
          <div className="a-tabs" role="tablist">
            {tabs[2].map(([v, l]) => <button key={v} role="tab" aria-selected={tabs[1] === v} className={tabs[1] === v ? 'on' : ''} onClick={() => setParam(tabs[0], v)}>{l}</button>)}
          </div>
        )}
        {cfg.statuses && (
          <div className="a-tabs">
            {[['', 'All'], ['paid', 'Paid'], ['pending', 'Pending'], ['failed', 'Failed']].map(([v, l]) => <button key={v} className={status === v ? 'on' : ''} onClick={() => setParam('status', v)}>{l}</button>)}
          </div>
        )}
      </div>

      <div className="a-card a-table-wrap">
        {state.error ? (
          <div className="a-empty"><p>{state.error}</p><button className="a-btn" onClick={refresh}>Try again</button></div>
        ) : (
          <table className="a-table">
            <thead>
              <tr>
                {cfg.thumb !== undefined && <th />}
                {cfg.columns.map((c) => <th key={c.key}>{c.label}</th>)}
                {(cfg.toggles || []).map(([f, l]) => <th key={f}>{l}</th>)}
                <th />
              </tr>
            </thead>
            <tbody>
              {state.loading && !state.rows.length
                ? Array.from({ length: 6 }).map((_, i) => <tr key={i}><td colSpan={colCount}><Skeleton h={22} /></td></tr>)
                : state.rows.map((r) => (
                    <Row key={r.id} cfg={cfg} row={r} open={openRow === r.id} onToggle={onToggle} onEdit={onEdit} onDelete={onDelete} onAction={onAction} onExpand={onExpand} />
                  ))}
            </tbody>
          </table>
        )}
        {!state.loading && !state.error && state.rows.length === 0 && (
          <div className="a-empty">
            <p>{dq ? 'Nothing matches your search.' : `No ${cfg.label.toLowerCase()} yet.`}</p>
            {!cfg.readOnly && !dq && <button className="a-btn primary" onClick={() => setEditing('new')}><Plus size={16} /> Add the first one</button>}
          </div>
        )}
      </div>

      {state.count > PAGE && (
        <nav className="a-pager" aria-label="Pages">
          <span>{state.count} total</span>
          <button className="a-icon" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} aria-label="Previous page"><ChevronLeft size={18} /></button>
          {Array.from({ length: pages }, (_, i) => i + 1).filter((n) => n === 1 || n === pages || Math.abs(n - page) <= 1).map((n, i, a) => (
            <span key={n} style={{ display: 'contents' }}>
              {i > 0 && n - a[i - 1] > 1 && <span className="a-gap">…</span>}
              <button className={`a-page ${n === page ? 'on' : ''}`} onClick={() => setPage(n)} aria-current={n === page ? 'page' : undefined}>{n}</button>
            </span>
          ))}
          <button className="a-icon" disabled={page >= pages} onClick={() => setPage((p) => p + 1)} aria-label="Next page"><ChevronRight size={18} /></button>
        </nav>
      )}

      {editing && cfg.fields && (
        <ResourceForm
          key={editing}
          fields={cfg.fields}
          endpoint={cfg.endpoint}
          id={editing === 'new' ? null : editing}
          defaults={editing === 'new' && section ? { section } : undefined}
          title={editing === 'new' ? `Add ${cfg.one}` : `Edit ${cfg.one}`}
          onSaved={() => { setEditing(null); refresh(); }}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
