import { useState } from 'react';
import { Mail, MapPin, Navigation, Phone } from 'lucide-react';
import { EMAIL, MAP_DIRECTIONS, MAP_EMBED, MAP_OPEN, MAP_QUERY, PHONE } from '../config';
import usePageTitle from '../hooks/usePageTitle';
import { useAuth } from '../context/AuthContext';
import { hasApi, http } from '../api/http';

export default function Contact() {
  usePageTitle('Contact', 'Contact Richard Kwanya Snr Ministry — send a message or find us on the map.');
  const { user } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '', message: '', website: '' });
  const [sent, setSent] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const [err, setErr] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    try {
      if (hasApi) await http('/contact/', { method: 'POST', body: form });
      setSent(true);
    } catch (ex) {
      setErr(ex.message);
    }
  };

  return (
    <>
      <section className="page-banner">
        <div className="container">
          <div className="eyebrow">Contact</div>
          <h1>We would love to hear from you</h1>
          <p>Questions, partnerships or invitations — send us a message.</p>
        </div>
      </section>
      <section className="section">
        <div className="container two-col" style={{ gridTemplateColumns: undefined }}>
          <form className="form-card" onSubmit={submit}>
            <input className="hp" tabIndex={-1} autoComplete="off" aria-hidden="true" value={form.website} onChange={set('website')} />
            {sent && <div className="notice ok">Message sent. We will get back to you soon.</div>}
            {err && <div className="notice err">{err}</div>}
            <div className="row2">
              <div className="field"><label>Name</label><input required value={form.name} onChange={set('name')} /></div>
              <div className="field"><label>Email</label><input required type="email" value={form.email} onChange={set('email')} /></div>
            </div>
            <div className="field"><label>Message</label><textarea required rows={6} value={form.message} onChange={set('message')} /></div>
            <button className="btn btn-gold">Send message</button>
          </form>
          <div>
            <div className="contact-card"><span className="ic"><MapPin size={20} /></span><div><b>Location</b><div style={{ fontSize: '.88rem', color: 'var(--muted)' }}>{MAP_QUERY}</div></div></div>
            <div className="contact-card"><span className="ic"><Phone size={20} /></span><div><b>Phone / WhatsApp</b><div style={{ fontSize: '.88rem', color: 'var(--muted)' }}>{PHONE}</div></div></div>
            <div className="contact-card"><span className="ic"><Mail size={20} /></span><div><b>Email</b><div style={{ fontSize: '.88rem', color: 'var(--muted)' }}>{EMAIL}</div></div></div>
          </div>
        </div>
        <div className="container map-wrap">
          <iframe
            className="map"
            title="Map to Baraton University, Eldoret"
            src={MAP_EMBED}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
          <div className="map-actions">
            <a className="btn btn-navy" href={MAP_OPEN} target="_blank" rel="noopener noreferrer"><MapPin size={16} /> Open in Google Maps</a>
            <a className="btn btn-gold" href={MAP_DIRECTIONS} target="_blank" rel="noopener noreferrer"><Navigation size={16} /> Get directions</a>
          </div>
        </div>
      </section>
    </>
  );
}
