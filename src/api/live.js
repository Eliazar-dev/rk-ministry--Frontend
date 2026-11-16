// Shared live-stream state: one 30 s poll feeds the navbar dot, the home banner and the /live page.
import { useEffect, useState } from 'react';
import { hasApi, http } from './http';
import { useAuth } from '../context/AuthContext';

const POLL_MS = 30000;
let state = { data: null, loaded: !hasApi }; // {data: stream|null, loaded: bool}
const subs = new Set();
let timer = null;
let fetching = false;

async function refresh() {
  if (!hasApi || fetching || document.hidden) return;
  fetching = true;
  try {
    state = { data: await http('/live/'), loaded: true };
  } catch {
    state = { ...state, loaded: true }; // keep last good data on errors
  } finally {
    fetching = false;
    subs.forEach((fn) => fn());
  }
}

function ensureTimer() {
  if (timer) return;
  timer = setInterval(refresh, POLL_MS);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) refresh();
  });
}

/** { data, loaded } — data is the current/scheduled stream or null. Refetches on sign-in changes. */
export function useLiveStream() {
  const { user } = useAuth();
  const [, bump] = useState(0);
  useEffect(() => {
    const cb = () => bump((n) => n + 1);
    subs.add(cb);
    ensureTimer();
    refresh();
    return () => subs.delete(cb);
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps
  return state;
}
