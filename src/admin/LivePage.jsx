import { useCallback, useEffect, useState } from 'react';
import { Loader2, Plus, Radio, Save, Trash2, Video, X } from 'lucide-react';
import { mp, todayISO } from './api';
import { Skeleton, useConfirm, usePageTitle, useToast } from './ui';

const results = (d) => (Array.isArray(d) ? d : d?.results || []);

/** watch / youtu.be / live / shorts / embed -> youtube embed URL */
const toEmbed = (url = '') => {
  const id = (url.match(/(?:youtu\.be\/|[?&]v=|embed\/|shorts\/|live\/)([A-Za-z0-9_-]{11})/) || [])[1];
  return id ? `https://www.youtube.com/embed/${id}` : '';
};

const toLocalInput = (iso) => (iso ? iso.slice(0, 16) : '');
const toISO = (local) => (local ? new Date(local).toISOString() : '');

const EMPTY = { title: '', youtube_url: '', scheduled_at: '', description: '' };

export default function LivePage() {
  usePageTitle('Live stream');
  const toast = useToast();
  const confirm = useConfirm();
  const [streams, setStreams] = useState([]);
  const [sermonLinks, setSermonLinks] = useState(new Set()); // youtube_urls already saved as sermons
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null | 'new' | record
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(() => {
    mp('live/?page_size=100')
      .then((d) => setStreams(results(d)))
      .catch((e) => toast(e.message, 'error'))
      .finally(() => setLoading(false));
    // Which streams already exist as sermons? Prevents duplicate "Save as sermon".
    mp('sermons/?page_size=100')
      .then((d) => setSermonLinks(new Set(results(d).map((s) => s.youtube_url).filter(Boolean))))
      .catch(() => {});
  }, [toast]);

  useEffect(load, [load]);

  const now = Date.now();
  const current = streams.find((s) => s.is_live);
  const next = !current && streams.find((s) => !s.is_live && new Date(s.scheduled_at).getTime() > now);
  const ended = streams.filter((s) => !s.is_live && new Date(s.scheduled_at).getTime() <= now);

  const openNew = () => {
    setForm({ ...EMPTY, scheduled_at: toLocalInput(new Date(Date.now() + 3600e3).toISOString()) });
    setEditing('new');
  };
  const openEdit = (s) => {
    setForm({
      title: s.title,
      youtube_url: s.youtube_url,
      scheduled_at: toLocalInput(s.scheduled_at),
      description: s.description || '',
    });
    setEditing(s);
  };

  const save = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.youtube_url.trim() || !form.scheduled_at) {
      toast('Title, YouTube link and start time are required.', 'error');
      return;
    }
    setSaving(true);
    const body = { ...form, scheduled_at: toISO(form.scheduled_at) };
    try {
      if (editing === 'new') await mp('live/', { method: 'POST', body });
      else await mp(`live/${editing.id}/`, { method: 'PATCH', body });
      toast(editing === 'new' ? 'Stream created' : 'Stream saved');
      setEditing(null);
      load();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const goLive = async (s) => {
    setBusyId(s.id);
    try {
      await mp(`live/${s.id}/`, { method: 'PATCH', body: { is_live: true, ends_at: null } });
      toast('You are live!');
      load();
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setBusyId(null);
    }
  };

  const endLive = async (s) => {
    const ok = await confirm({
      title: 'End the live stream?',
      message: 'The public page will stop showing the player. You can save it as a sermon afterwards.',
      confirmLabel: 'End live',
      danger: true,
    });
    if (!ok) return;
    setBusyId(s.id);
    try {
      await mp(`live/${s.id}/`, { method: 'PATCH', body: { is_live: false, ends_at: new Date().toISOString() } });
      toast('Stream ended');
      load();
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setBusyId(null);
    }
  };

  const saveAsSermon = async (s) => {
    setBusyId(s.id);
    try {
      await mp('sermons/', {
        method: 'POST',
        body: { title: s.title, youtube_url: s.youtube_url, description: s.description || '', date: todayISO() },
      });
      setSermonLinks((prev) => new Set(prev).add(s.youtube_url));
      toast('Saved as a sermon — it is on the Sermons page now');
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (s) => {
    const ok = await confirm({ title: 'Delete this stream?', message: `"${s.title}" will be removed.`, confirmLabel: 'Delete', danger: true });
    if (!ok) return;
    try {
      await mp(`live/${s.id}/`, { method: 'DELETE' });
      toast('Stream deleted');
      load();
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  const embed = toEmbed(form.youtube_url);

  return (
    <div>
      <div className="a-head">
        <div>
          <h1>Live stream</h1>
          <p className="a-sub">Control what visitors see on the Live page and the red dot in the menu.</p>
        </div>
        <button className="a-btn primary" onClick={openNew}><Plus size={16} /> New stream</button>
      </div>

      {loading ? (
        <Skeleton h={140} />
      ) : (
        <>
          {current && (
            <div className="a-card a-live-now">
              <span className="a-badge red">● LIVE NOW</span>
              <h2>{current.title}</h2>
              <p className="a-sub">Started {new Date(current.scheduled_at).toLocaleString('en-GB')}</p>
              <div className="a-actions">
                <button className="a-btn" onClick={() => openEdit(current)}>Edit</button>
                <button className="a-btn" onClick={() => endLive(current)} disabled={busyId === current.id}>
                  {busyId === current.id ? <Loader2 size={16} className="spin" /> : 'End live'}
                </button>
              </div>
            </div>
          )}
          {!current && next && (
            <div className="a-card a-live-next">
              <span className="a-badge navy">UP NEXT</span>
              <h2>{next.title}</h2>
              <p className="a-sub">Starts {new Date(next.scheduled_at).toLocaleString('en-GB')}</p>
              <div className="a-actions">
                <button className="a-btn primary" onClick={() => goLive(next)} disabled={busyId === next.id}>
                  {busyId === next.id ? <Loader2 size={16} className="spin" /> : 'Go live now'}
                </button>
                <button className="a-btn" onClick={() => openEdit(next)}>Edit</button>
              </div>
            </div>
          )}
          {!current && !next && (
            <div className="a-card"><p className="a-sub">Nothing is live or scheduled. Create a stream to announce the next service.</p></div>
          )}

          {streams.length > 0 && (
            <div className="a-card" style={{ marginTop: 16 }}>
              <div className="a-card-head"><h3>All streams</h3></div>
              <div className="a-table-wrap">
                <table className="a-table">
                  <thead><tr><th>Title</th><th>Starts</th><th>Status</th><th></th></tr></thead>
                  <tbody>
                    {streams.map((s) => {
                      const isLive = s.is_live;
                      const isNext = !current && next?.id === s.id;
                      const isEnded = !isLive && new Date(s.scheduled_at).getTime() <= now;
                      return (
                        <tr key={s.id}>
                          <td><strong>{s.title}</strong></td>
                          <td>{new Date(s.scheduled_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                          <td>
                            {isLive ? <span className="a-badge red">Live</span>
                              : isNext ? <span className="a-badge navy">Next</span>
                              : isEnded ? <span className="a-badge">Ended</span>
                              : <span className="a-badge amber">Scheduled</span>}
                          </td>
                          <td className="a-actions">
                            {!isLive && <button className="a-btn" onClick={() => goLive(s)} disabled={busyId === s.id}>Go live</button>}
                            {isEnded && !sermonLinks.has(s.youtube_url) && (
                              <button className="a-btn" onClick={() => saveAsSermon(s)} disabled={busyId === s.id} title="Add this stream to the Sermons page">
                                <Video size={14} /> Save as sermon
                              </button>
                            )}
                            <button className="a-btn" onClick={() => openEdit(s)}>Edit</button>
                            <button className="a-icon" onClick={() => remove(s)} aria-label="Delete"><Trash2 size={16} /></button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {editing && (
        <div className="a-modal-back right" onMouseDown={() => !saving && setEditing(null)}>
          <aside className="a-slide" role="dialog" aria-modal="true" aria-label="Live stream" onMouseDown={(e) => e.stopPropagation()}>
            <header>
              <h2>{editing === 'new' ? 'New live stream' : 'Edit stream'}</h2>
              <button className="a-icon" onClick={() => setEditing(null)} aria-label="Close"><X size={18} /></button>
            </header>
            <form onSubmit={save}>
              <div className="a-form-body">
                <div className="a-field">
                  <label className="a-label" htmlFor="lv-title">Title <b>*</b></label>
                  <input id="lv-title" className="a-input" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Sabbath Service — Live" />
                </div>
                <div className="a-field">
                  <label className="a-label" htmlFor="lv-yt">YouTube link <b>*</b></label>
                  <input id="lv-yt" className="a-input" required value={form.youtube_url} onChange={(e) => setForm({ ...form, youtube_url: e.target.value })} placeholder="https://youtu.be/… or youtube.com/live/…" />
                  <small className="a-help">Watch, share, live and youtu.be links all work.</small>
                  {embed && (
                    <iframe className="a-yt-frame" src={embed} title="YouTube preview" allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture" allowFullScreen />
                  )}
                </div>
                <div className="a-field">
                  <label className="a-label" htmlFor="lv-when">Starts at <b>*</b></label>
                  <input id="lv-when" className="a-input" type="datetime-local" required value={form.scheduled_at} onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} />
                  <small className="a-help">Shown to visitors as a countdown. You can go live earlier with the button.</small>
                </div>
                <div className="a-field">
                  <label className="a-label" htmlFor="lv-desc">Description</label>
                  <textarea id="lv-desc" className="a-input" rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What is this service about?" />
                </div>
              </div>
              <div className="a-form-foot">
                <button type="button" className="a-btn" onClick={() => setEditing(null)}>Cancel</button>
                <button className="a-btn primary" disabled={saving}>
                  {saving ? <><Loader2 size={16} className="spin" /> Saving…</> : <><Save size={16} /> Save stream</>}
                </button>
              </div>
            </form>
          </aside>
        </div>
      )}
    </div>
  );
}
