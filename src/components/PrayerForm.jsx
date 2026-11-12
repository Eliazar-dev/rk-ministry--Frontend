import { useState } from 'react';
import { HeartHandshake } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { hasApi, http } from '../api/http';

export default function PrayerForm() {
  const { user } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '', request: '', website: '' });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState('');

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      if (hasApi) await http('/prayer-requests/', { method: 'POST', body: form });
      else await new Promise((r) => setTimeout(r, 900));
      setDone(true);
      setForm({ ...form, request: '' });
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="prayer">
      <div>
        <div className="eyebrow" style={{ color: 'var(--gold-400)' }}>We pray with you</div>
        <h2>Prayer Request</h2>
        <p style={{ marginTop: 12 }}>
          Share what is on your heart. Our prayer team will lift your request before God — you do not walk alone.
        </p>
        <HeartHandshake size={56} style={{ color: 'var(--gold-400)', marginTop: 20 }} />
      </div>
      <form onSubmit={submit}>
        <input className="hp" tabIndex={-1} autoComplete="off" aria-hidden="true" value={form.website} onChange={set('website')} />
        {done && <div className="notice ok">Thank you. Your request has been received — we are praying for you.</div>}
        {err && <div className="notice err">{err}</div>}
        <div className="row2">
          <div className="field"><label>Your name</label><input required value={form.name} onChange={set('name')} placeholder="Full name" /></div>
          <div className="field"><label>Email</label><input required type="email" value={form.email} onChange={set('email')} placeholder="you@email.com" /></div>
        </div>
        <div className="field"><label>Prayer request</label><textarea required rows={4} value={form.request} onChange={set('request')} placeholder="How can we pray for you?" /></div>
        <button className="btn btn-gold btn-block" disabled={busy}>{busy ? 'Sending…' : 'Submit Prayer Request'}</button>
      </form>
    </div>
  );
}
