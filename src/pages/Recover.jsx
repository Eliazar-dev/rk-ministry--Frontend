import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Mail } from 'lucide-react';
import { LogoImg } from '../components/Logo';
import { hasApi, http } from '../api/http';

/** /forgot-password  → ask for email.   /reset-password?uid=…&token=…  → choose new password. */
export default function Recover({ mode }) {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setMsg('');
    setBusy(true);
    try {
      if (!hasApi) throw new Error('Password reset needs the live server. Set VITE_API_URL first.');
      if (mode === 'forgot') {
        const r = await http('/auth/forgot/', { method: 'POST', body: { email } });
        setMsg(r.detail);
      } else {
        const r = await http('/auth/reset/', {
          method: 'POST',
          body: { uid: params.get('uid'), token: params.get('token'), password },
        });
        setMsg(r.detail);
        setTimeout(() => navigate('/auth'), 2500);
      }
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <span className="blob b1" /><span className="blob b2" /><span className="blob b3" />
      <div className="auth-wrap">
        <div className="auth-brand">
          <span className="logo-badge"><LogoImg alt="RK" /></span>
          <h1>Richard Kwanya Snr</h1>
          <p>#Babawa</p>
        </div>
        <form className="face" onSubmit={submit}>
          <h2>{mode === 'forgot' ? 'FORGOT PASSWORD' : 'NEW PASSWORD'}</h2>
          <p className="sub">
            {mode === 'forgot' ? 'Enter your email and we will send you a reset link' : 'Choose a new password for your account'}
          </p>
          {err && <div className="glass-err">{err}</div>}
          {msg && <div className="glass-err" style={{ background: 'rgba(80,200,140,.2)', borderColor: 'rgba(120,230,170,.5)', color: '#d6ffe9' }}>{msg}</div>}
          {mode === 'forgot' ? (
            <div className="g-field">
              <Mail size={20} />
              <input type="email" required placeholder="Email ID" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          ) : (
            <div className="g-field">
              <Lock size={20} />
              <input type="password" required minLength={6} placeholder="New password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          )}
          <button className="g-btn" disabled={busy}>{busy ? 'PLEASE WAIT…' : mode === 'forgot' ? 'SEND LINK' : 'SAVE PASSWORD'}</button>
          <div className="switch"><Link to="/auth" style={{ color: 'var(--gold-400)', fontWeight: 700 }}>Back to login</Link></div>
        </form>
      </div>
    </div>
  );
}
