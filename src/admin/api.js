// Small helpers shared by the admin screens: API calls under /manage and an in-memory page cache.
import { http } from '../api/http';

export const mp = (path, opts) => http(`/manage/${path}`, opts);

export const qs = (obj) => {
  const p = new URLSearchParams();
  Object.entries(obj).forEach(([k, v]) => {
    if (v !== '' && v != null) p.set(k, v);
  });
  return p.toString();
};

// Visited list pages are kept here so going back is instant; they are refreshed in the background.
const cache = new Map();
export const cacheGet = (k) => cache.get(k);
export const cacheSet = (k, v) => cache.set(k, v);
export const invalidate = (prefix) => {
  for (const k of [...cache.keys()]) if (k.startsWith(prefix)) cache.delete(k);
};

export const money = (n) => `KES ${Number(n || 0).toLocaleString()}`;
export const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');
export const fmtDateTime = (d) =>
  d ? new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
export const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
