import { useEffect, useRef, useState } from 'react';
import { Check, Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useGate } from '../context/GateContext';
import { money } from '../api/client';
import { hasApi, http, waitForPayment } from '../api/http';

const PRESETS = [500, 1000, 2500, 5000, 10000, 20000];

export default function Donate() {
  const { user } = useAuth();
  const { guard } = useGate();
  const [amount, setAmount] = useState(1000);
  const [custom, setCustom] = useState('');
  const [phone, setPhone] = useState('');
  const [stage, setStage] = useState('form'); // form | sending | waiting | done
  const [err, setErr] = useState('');
  const ctl = useRef({ cancelled: false });
  useEffect(() => () => (ctl.current.cancelled = true), []);

  const value = custom ? Number(custom) : amount;

  const submit = (e) => {
    e.preventDefault();
    guard({ type: 'donate' }, send, '/donate');
  };

  const send = async () => {
    setErr('');
    setStage('sending');
    try {
      if (hasApi) {
        const d = await http('/donations/', { method: 'POST', body: { amount: value, phone } });
        setStage('waiting');
        const result = await waitForPayment(`/donations/${d.id}/`, { timeoutMs: 60000, ctl: ctl.current });
        if (result.status === 'paid') setStage('done');
        else if (result.status !== 'cancelled') {
          setStage('form');
          setErr(result.status === 'failed' ? result.reason || 'The payment was not completed.' : 'We did not receive the payment in time. Please try again.');
        }
      } else {
        await new Promise((r) => setTimeout(r, 1200));
        setStage('done');
      }
    } catch (ex) {
      setStage('form');
      setErr(ex.message);
    }
  };

  return (
    <>
      <section className="page-banner">
        <div className="container">
          <div className="eyebrow">Give</div>
          <h1>Support the Mission</h1>
          <p>Your gift helps us equip people and transform lives through the gospel.</p>
        </div>
      </section>
      <section className="section">
        <div className="container" style={{ maxWidth: 620 }}>
          <form className="form-card" onSubmit={submit}>
            {stage === 'done' ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div className="check-pop"><Check size={48} strokeWidth={3} /></div>
                <h2 style={{ fontFamily: 'var(--font-display)' }}>Thank you, {user?.name?.split(' ')[0]}!</h2>
                <p style={{ color: 'var(--muted)', marginTop: 8 }}>Your gift of {money(value)} was received. A receipt is on its way to your email. God bless you.</p>
              </div>
            ) : stage === 'waiting' ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <h2 style={{ fontFamily: 'var(--font-display)' }}>Check your phone</h2>
                <p style={{ color: 'var(--muted)', marginTop: 8 }}>Enter your M-Pesa PIN to approve {money(value)}. Waiting for confirmation…</p>
              </div>
            ) : (
              <>
                {err && <div className="notice err">{err}</div>}
                <div className="amounts">
                  {PRESETS.map((a) => (
                    <button type="button" key={a} className={`amount ${!custom && amount === a ? 'on' : ''}`} onClick={() => { setAmount(a); setCustom(''); }}>
                      {a.toLocaleString()}
                    </button>
                  ))}
                </div>
                <div className="field"><label>Or enter another amount (KES)</label><input type="number" min="10" value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Custom amount" /></div>
                <div className="field"><label>M-Pesa phone number</label><input required inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07XX XXX XXX" /></div>
                <button className="btn btn-gold btn-block" disabled={stage === 'sending' || !value}>
                  <Heart size={17} /> {stage === 'sending' ? 'Sending prompt…' : `Donate ${money(value || 0)}`}
                </button>
              </>
            )}
          </form>
        </div>
      </section>
    </>
  );
}
