import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, MailCheck } from 'lucide-react';
import { hasApi } from '../api/http';
import { DEMO_CODE } from '../context/AuthContext';

const LEN = 6;
const COOLDOWN = 30;

/** 6-box code entry. `onSubmit(code)` and `onResend()` throw an Error to show a message. */
export default function OtpCard({ email, purpose, onSubmit, onResend, onBack }) {
  const [digits, setDigits] = useState(Array(LEN).fill(''));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [info, setInfo] = useState('');
  const [secs, setSecs] = useState(COOLDOWN);
  const refs = useRef([]);

  // Focus the first box on open, and again after a failed attempt (once the inputs are re-enabled)
  useEffect(() => {
    if (!busy && digits.every((d) => !d)) refs.current[0]?.focus();
  }, [busy]); // eslint-disable-line
  useEffect(() => {
    if (secs <= 0) return;
    const t = setTimeout(() => setSecs((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secs]);

  const submit = async (code) => {
    setBusy(true);
    setErr('');
    try {
      await onSubmit(code);
    } catch (ex) {
      setErr(ex.message);
      setDigits(Array(LEN).fill(''));
    } finally {
      setBusy(false);
    }
  };

  // Put `chars` into the boxes starting at `from` (handles typing, pasting and phone autofill)
  const fill = (from, chars) => {
    const next = [...digits];
    chars.split('').slice(0, LEN - from).forEach((c, k) => (next[from + k] = c));
    setDigits(next);
    const last = Math.min(from + chars.length, LEN - 1);
    refs.current[last]?.focus();
    if (next.every(Boolean)) submit(next.join(''));
  };

  const onChange = (i, e) => {
    const v = e.target.value.replace(/\D/g, '');
    if (!v) {
      const next = [...digits];
      next[i] = '';
      return setDigits(next);
    }
    fill(i, v);
  };

  const onKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) refs.current[i - 1]?.focus();
    if (e.key === 'ArrowLeft' && i > 0) refs.current[i - 1]?.focus();
    if (e.key === 'ArrowRight' && i < LEN - 1) refs.current[i + 1]?.focus();
  };

  const onPaste = (e) => {
    const v = e.clipboardData.getData('text').replace(/\D/g, '');
    if (v) {
      e.preventDefault();
      fill(0, v);
    }
  };

  const resend = async () => {
    setErr('');
    setInfo('');
    try {
      await onResend();
      setInfo('A new code is on its way.');
      setSecs(COOLDOWN);
    } catch (ex) {
      setErr(ex.message);
    }
  };

  return (
    <div className="face otp-card">
      <button type="button" className="otp-back" onClick={onBack} aria-label="Back"><ArrowLeft size={18} /> Back</button>
      <div className="otp-icon"><MailCheck size={30} /></div>
      <h2>CHECK YOUR EMAIL</h2>
      <p className="sub">
        We sent a 6-digit code to<br /><b style={{ color: '#fff' }}>{email}</b>
      </p>
      {!hasApi && <div className="glass-err" style={{ background: 'rgba(240,199,94,.18)', borderColor: 'rgba(240,199,94,.5)', color: '#fbeab0' }}>Demo mode: use code <b>{DEMO_CODE}</b></div>}
      {err && <div className="glass-err">{err}</div>}
      {info && <div className="glass-err" style={{ background: 'rgba(80,200,140,.2)', borderColor: 'rgba(120,230,170,.5)', color: '#d6ffe9' }}>{info}</div>}

      <div className="otp-boxes" onPaste={onPaste}>
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => (refs.current[i] = el)}
            className="otp-box"
            inputMode="numeric"
            autoComplete={i === 0 ? 'one-time-code' : 'off'}
            maxLength={LEN}
            value={d}
            disabled={busy}
            onChange={(e) => onChange(i, e)}
            onKeyDown={(e) => onKeyDown(i, e)}
            aria-label={`Digit ${i + 1}`}
          />
        ))}
      </div>

      <button className="g-btn" type="button" disabled={busy || digits.some((d) => !d)} onClick={() => submit(digits.join(''))}>
        {busy ? 'VERIFYING…' : purpose === 'signup' ? 'VERIFY & CREATE ACCOUNT' : 'VERIFY & LOGIN'}
      </button>
      <div className="switch">
        Did not get it?
        {secs > 0 ? <span style={{ marginLeft: 6, opacity: 0.8 }}>Resend in {secs}s</span> : <button type="button" onClick={resend}>Resend code</button>}
      </div>
    </div>
  );
}
