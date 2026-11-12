import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Check, Eye, EyeOff, Lock, Mail, User } from 'lucide-react';
import { LogoImg } from '../components/Logo';
import GoogleButton from '../components/GoogleButton';
import OtpCard from '../components/OtpCard';
import { useAuth } from '../context/AuthContext';

export default function Auth() {
  const { login, signup, verifySignup, requestLoginCode, loginWithCode, googleLogin, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';

  const [flip, setFlip] = useState(location.state?.mode === 'signup'); // false = login, true = sign up
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);
  const [welcome, setWelcome] = useState(null);
  const [otp, setOtp] = useState(null); // { email, purpose: 'signup' | 'login' } → shows the code screen
  const [lf, setLf] = useState({ email: '', password: '' });
  const [sf, setSf] = useState({ name: '', email: '', password: '' });
  // While a sign-in is in progress we handle the redirect ourselves (so the welcome popup is never skipped)
  const hold = useRef(false);

  // Already signed in when arriving here → go straight on
  useEffect(() => {
    if (user && !hold.current) navigate(from, { replace: true });
  }, [user, from, navigate]);

  // Welcome popup → redirect after 3 seconds
  useEffect(() => {
    if (!welcome) return;
    const t = setTimeout(() => navigate(from, { replace: true }), 3000);
    return () => clearTimeout(t);
  }, [welcome, from, navigate]);

  const toggle = () => {
    setErr('');
    setFlip((f) => !f);
  };

  // New account → welcome popup (3 s) then redirect; returning member → straight in
  const finish = ({ user: u, created }) => (created ? setWelcome(u) : navigate(from, { replace: true }));

  const guard = async (fn) => {
    setErr('');
    setBusy(true);
    hold.current = true;
    try {
      await fn();
    } catch (ex) {
      hold.current = false;
      setErr(ex.message);
    } finally {
      setBusy(false);
    }
  };

  const onLogin = (e) => {
    e.preventDefault();
    guard(async () => finish(await login(lf)));
  };

  const onSignup = (e) => {
    e.preventDefault();
    if (sf.password.length < 6) return setErr('Password must be at least 6 characters.');
    guard(async () => {
      await signup(sf); // emails the code
      hold.current = false;
      setOtp({ email: sf.email.trim().toLowerCase(), purpose: 'signup' });
    });
  };

  const sendLoginCode = () => {
    if (!lf.email.trim()) return setErr('Enter your email above first, then tap "Email me a code".');
    guard(async () => {
      await requestLoginCode(lf.email.trim());
      hold.current = false;
      setOtp({ email: lf.email.trim().toLowerCase(), purpose: 'login' });
    });
  };

  const onGoogle = (credential) => guard(async () => finish(await googleLogin(credential)));

  // --- code screen callbacks (they throw so OtpCard can show the message) ---
  const submitCode = async (code) => {
    hold.current = true;
    try {
      const res =
        otp.purpose === 'signup'
          ? await verifySignup({ email: otp.email, code })
          : await loginWithCode({ email: otp.email, code });
      finish(res);
    } catch (ex) {
      hold.current = false;
      throw ex;
    }
  };
  const resendCode = () => (otp.purpose === 'signup' ? signup(sf) : requestLoginCode(otp.email));

  const pwType = show ? 'text' : 'password';
  const Eye_ = show ? EyeOff : Eye;

  const googleBlock = (
    <>
      <div className="or"><span>OR</span></div>
      <GoogleButton onCredential={onGoogle} onError={setErr} />
    </>
  );

  return (
    <div className="auth-page">
      <span className="blob b1" /><span className="blob b2" /><span className="blob b3" />

      <div className="auth-wrap">
        <Link to="/" className="auth-back">← Back to website</Link>
        <div className="auth-brand">
          <span className="logo-badge"><LogoImg alt="RK" /></span>
          <h1>Richard Kwanya Snr</h1>
          <p>#Babawa</p>
        </div>

        {otp ? (
          <OtpCard
            email={otp.email}
            purpose={otp.purpose}
            onSubmit={submitCode}
            onResend={resendCode}
            onBack={() => { setOtp(null); setErr(''); }}
          />
        ) : (
          <div className={`flipper ${flip ? 'flip' : ''}`}>
            {/* LOGIN */}
            <form className="face front" onSubmit={onLogin} style={{ visibility: flip ? 'hidden' : 'visible', transition: 'visibility 0s .4s' }}>
              <h2>WELCOME BACK</h2>
              <p className="sub">Sign in to watch, read and download</p>
              {err && !flip && <div className="glass-err">{err}</div>}
              <div className="g-field">
                <Mail size={20} />
                <input type="email" required placeholder="Email ID" autoComplete="email" value={lf.email} onChange={(e) => setLf({ ...lf, email: e.target.value })} />
              </div>
              <div className="g-field">
                <Lock size={20} />
                <input type={pwType} required placeholder="Password" autoComplete="current-password" value={lf.password} onChange={(e) => setLf({ ...lf, password: e.target.value })} />
                <button type="button" className="eye" onClick={() => setShow(!show)} aria-label="Toggle password"><Eye_ size={18} /></button>
              </div>
              <div className="g-row">
                <label><input type="checkbox" defaultChecked /> Remember me</label>
                <Link to="/forgot-password">Forgot Password?</Link>
              </div>
              <button className="g-btn" disabled={busy}>{busy && !flip ? 'SIGNING IN…' : 'LOGIN'}</button>
              <button type="button" className="link-btn" onClick={sendLoginCode} disabled={busy}>Email me a login code instead</button>
              {googleBlock}
              <div className="switch">New here?<button type="button" onClick={toggle}>Create account</button></div>
            </form>

            {/* SIGN UP */}
            <form className="face back" onSubmit={onSignup} style={{ visibility: flip ? 'visible' : 'hidden', transition: 'visibility 0s .4s' }}>
              <h2>JOIN THE FAMILY</h2>
              <p className="sub">Create your account — we will email you a code</p>
              {err && flip && <div className="glass-err">{err}</div>}
              <div className="g-field">
                <User size={20} />
                <input required placeholder="Full name" autoComplete="name" value={sf.name} onChange={(e) => setSf({ ...sf, name: e.target.value })} />
              </div>
              <div className="g-field">
                <Mail size={20} />
                <input type="email" required placeholder="Email ID" autoComplete="email" value={sf.email} onChange={(e) => setSf({ ...sf, email: e.target.value })} />
              </div>
              <div className="g-field">
                <Lock size={20} />
                <input type={pwType} required placeholder="Password" autoComplete="new-password" value={sf.password} onChange={(e) => setSf({ ...sf, password: e.target.value })} />
                <button type="button" className="eye" onClick={() => setShow(!show)} aria-label="Toggle password"><Eye_ size={18} /></button>
              </div>
              <button className="g-btn" disabled={busy}>{busy && flip ? 'SENDING CODE…' : 'SIGN UP'}</button>
              {googleBlock}
              <div className="switch">Already a member?<button type="button" onClick={toggle}>Login</button></div>
            </form>
          </div>
        )}
      </div>

      {welcome && (
        <div className="welcome">
          <div className="welcome-box">
            <div className="check-pop"><Check size={44} strokeWidth={3} /></div>
            <h2>Welcome, <em>{welcome.name.split(' ')[0]}</em>!</h2>
            <p>We are delighted to have you in the Richard Kwanya Snr Ministry family. Taking you home…</p>
            <div className="progress"><i /></div>
          </div>
        </div>
      )}
    </div>
  );
}
