import { useEffect, useState } from 'react';
import { Heart, Send } from 'lucide-react';
import { hasApi, http } from '../api/http';
import { useAuth } from '../context/AuthContext';

/**
 * Likes + comments for a sermon, lesson or devotional. With the API on they are stored in Django
 * (the admin can moderate them); in demo mode they live in this browser only.
 */
export default function Engage({ kind, item }) {
  const { user } = useAuth();
  const base = `/engage/${kind}/${item.id}/`;
  const localKey = `rk_eng_${kind}_${item.id}`;
  const blank = { liked: false, likes: item.likes || 0, comments: [] };

  const [state, setState] = useState(() => {
    if (hasApi) return blank;
    try {
      return JSON.parse(localStorage.getItem(localKey)) || blank;
    } catch {
      return blank;
    }
  });
  const [text, setText] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    if (hasApi) http(base).then(setState).catch(() => {});
  }, [base]);
  useEffect(() => {
    if (!hasApi) localStorage.setItem(localKey, JSON.stringify(state));
  }, [localKey, state]);

  const toggleLike = async () => {
    if (!hasApi) return setState((s) => ({ ...s, liked: !s.liked, likes: s.likes + (s.liked ? -1 : 1) }));
    try {
      setState(await http(`${base}like/`, { method: 'POST' }));
    } catch (ex) {
      setErr(ex.message);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    setErr('');
    if (hasApi) {
      try {
        setState(await http(`${base}comments/`, { method: 'POST', body: { text: t } }));
      } catch (ex) {
        return setErr(ex.message);
      }
    } else {
      setState((s) => ({ ...s, comments: [{ id: Date.now(), name: user?.name || 'Guest', text: t, at: new Date().toISOString() }, ...s.comments] }));
    }
    setText('');
  };

  return (
    <>
      <div className="engage">
        <button className={`like-btn ${state.liked ? 'on' : ''}`} onClick={toggleLike}>
          <Heart size={17} fill={state.liked ? 'currentColor' : 'none'} /> {state.likes}
        </button>
        <span className="meta">{state.comments.length} comments</span>
      </div>
      {err && <div className="notice err">{err}</div>}
      <form className="comment-form" onSubmit={submit}>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Share a thought or encouragement…" maxLength={1000} />
        <button className="btn btn-gold btn-sm" type="submit"><Send size={15} /> Post</button>
      </form>
      {state.comments.map((c) => (
        <div key={c.id} className="comment">
          <span className="avatar" style={{ width: 34, height: 34, fontSize: '.85rem' }}>{c.name[0]}</span>
          <div>
            <b>{c.name}</b> <small>{new Date(c.at).toLocaleString()}</small>
            <p>{c.text}</p>
          </div>
        </div>
      ))}
    </>
  );
}
