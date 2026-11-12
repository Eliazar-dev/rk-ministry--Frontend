// Tiny fetch wrapper for the Django API: JWT header, silent token refresh, readable errors.
const API = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
export const hasApi = Boolean(API);

const KEY = 'rk_tokens';
export const tokens = {
  get() {
    try {
      return JSON.parse(localStorage.getItem(KEY));
    } catch {
      return null;
    }
  },
  set(t) {
    localStorage.setItem(KEY, JSON.stringify(t));
  },
  clear() {
    localStorage.removeItem(KEY);
  },
};

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function send(path, method, body, access, signal) {
  return fetch(`${API}${path}`, {
    method,
    signal,
    headers: {
      'Content-Type': 'application/json',
      ...(access ? { Authorization: `Bearer ${access}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

async function refreshAccess() {
  const t = tokens.get();
  if (!t?.refresh) return null;
  try {
    const res = await send('/auth/refresh/', 'POST', { refresh: t.refresh });
    if (!res.ok) return null;
    const data = await res.json();
    tokens.set({ ...t, access: data.access });
    return data.access;
  } catch {
    return null;
  }
}

/** First error message found in a DRF error body (detail, or the first field error). */
function messageFrom(data) {
  if (!data) return '';
  if (typeof data.detail === 'string') return data.detail;
  const first = Object.entries(data)[0];
  if (!first) return '';
  const [field, val] = first;
  const text = Array.isArray(val) ? val[0] : typeof val === 'string' ? val : '';
  return text ? (field === 'non_field_errors' ? text : `${field.replace(/_/g, ' ')}: ${text}`) : '';
}

/**
 * http('/path', { method, body, signal })
 * A stale login must never break a page: if the token cannot be refreshed we sign the person out and
 * retry the same request once as a visitor, so public pages keep working.
 */
export async function http(path, { method = 'GET', body, signal } = {}) {
  const access = tokens.get()?.access;
  let res = await send(path, method, body, access, signal);

  // (login/refresh calls are excluded; /auth/me/ is how we discover that a saved login has gone stale)
  if (res.status === 401 && access && (!path.startsWith('/auth/') || path === '/auth/me/')) {
    const fresh = await refreshAccess();
    if (fresh) {
      res = await send(path, method, body, fresh, signal);
    } else {
      tokens.clear();
      window.dispatchEvent(new Event('rk-logout'));
      res = await send(path, method, body, null, signal);
    }
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    /* empty body */
  }
  if (!res.ok) {
    const fallback = res.status === 401 ? 'Please sign in to continue.' : 'Something went wrong. Please try again.';
    throw new ApiError(messageFrom(data) || fallback, res.status, data);
  }
  return data;
}

/**
 * Poll a payment until it is paid / failed or the time runs out.
 * Returns the last JSON. `ctl.cancelled = true` stops it (use on unmount).
 */
export async function waitForPayment(path, { timeoutMs = 60000, intervalMs = 3000, ctl = {}, onTick } = {}) {
  const start = Date.now();
  while (!ctl.cancelled && Date.now() - start < timeoutMs) {
    await new Promise((r) => setTimeout(r, intervalMs));
    if (ctl.cancelled) break;
    try {
      const data = await http(path);
      onTick?.(data);
      if (data.status !== 'pending') return data;
    } catch {
      /* keep polling through transient errors */
    }
  }
  return { status: ctl.cancelled ? 'cancelled' : 'timeout' };
}
