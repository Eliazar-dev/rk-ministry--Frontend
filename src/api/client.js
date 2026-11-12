import { useEffect, useState } from 'react';
import { resources } from '../data/mock';
import { useAuth } from '../context/AuthContext';
import { hasApi, http } from './http';

/** Convert any YouTube URL into an embeddable one. */
export function toEmbed(url = '') {
  const m = url.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([A-Za-z0-9_-]{11})/) || [];
  return m[1] ? `https://www.youtube.com/embed/${m[1]}?rel=0&autoplay=1` : url;
}

export const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

export const money = (n) => `KES ${Number(n).toLocaleString()}`;

/** Fetch a resource. Uses Django when VITE_API_URL is set, otherwise demo data. */
export async function list(resource) {
  if (hasApi) return http(`/${resource}/`);
  await new Promise((r) => setTimeout(r, 700)); // lets the skeletons show
  return resources[resource] ?? [];
}

// Pages share one cache: going back to a page is instant and refreshes quietly in the background.
// Entries are keyed by signed-in state because members receive more fields than visitors.
const cache = new Map();
const inflight = new Map();

function load(key, resource) {
  if (!inflight.has(key)) {
    inflight.set(
      key,
      list(resource)
        .then((d) => (cache.set(key, d), d))
        .finally(() => inflight.delete(key))
    );
  }
  return inflight.get(key);
}

function useResource(resource, empty) {
  const { user } = useAuth();
  const key = `${resource}|${Boolean(user)}`;
  const [state, setState] = useState(() => (cache.has(key) ? { data: cache.get(key), loading: false } : { data: empty, loading: true }));

  useEffect(() => {
    let live = true;
    setState(cache.has(key) ? { data: cache.get(key), loading: false } : { data: empty, loading: true });
    load(key, resource)
      .then((data) => live && setState({ data, loading: false }))
      .catch(() => live && setState((s) => ({ ...s, loading: false })));
    return () => {
      live = false;
    };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  return state;
}

/** useList('sermons') -> { data: [], loading } */
export const useList = (resource) => useResource(resource, []);
/** useOne('about') -> { data: {}, loading } */
export const useOne = (resource) => useResource(resource, {});
