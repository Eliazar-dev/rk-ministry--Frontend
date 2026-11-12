import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Check, Smartphone } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { money } from '../api/client';
import { hasApi, http, waitForPayment } from '../api/http';

const WAIT = 60; // seconds to wait for the customer to enter their M-Pesa PIN

export default function Checkout() {
  const { items, total, clear } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '', location: '', phone: '' });
  const [stage, setStage] = useState('form'); // form | waiting | done
  const [secs, setSecs] = useState(WAIT);
  const [order, setOrder] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const ctl = useRef({ cancelled: false });

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  useEffect(() => () => (ctl.current.cancelled = true), []);

  // Visual countdown while we wait for payment
  useEffect(() => {
    if (stage !== 'waiting' || secs <= 0) return;
    const t = setTimeout(() => setSecs((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [stage, secs]);

  // Demo mode (no API): pretend the payment succeeds when the timer ends
  useEffect(() => {
    if (!hasApi && stage === 'waiting' && secs === 0) finish({ ref: 'RK' + Math.floor(100000 + Math.random() * 900000) });
  }, [secs, stage]); // eslint-disable-line

  const finish = (info) => {
    setOrder({ ref: info.ref, total, ...form });
    clear();
    setStage('done');
  };

  if (items.length === 0 && stage === 'form') return <Navigate to="/cart" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      if (hasApi) {
        const created = await http('/orders/', {
          method: 'POST',
          body: { ...form, items: items.map((i) => ({ id: i.id, qty: i.qty })) },
        });
        setSecs(WAIT);
        setStage('waiting');
        ctl.current.cancelled = false;
        const result = await waitForPayment(`/orders/${created.id}/`, { timeoutMs: WAIT * 1000, ctl: ctl.current });
        if (result.status === 'paid') finish({ ref: created.ref });
        else if (result.status !== 'cancelled') {
          setStage('form');
          setErr(
            result.status === 'failed'
              ? result.reason || 'The payment was not completed. Please try again.'
              : 'We did not receive your payment in time. If money was deducted, contact us with your phone number.'
          );
        }
      } else {
        setSecs(WAIT);
        setStage('waiting');
      }
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setBusy(false);
    }
  };

  if (stage === 'waiting') {
    const C = 2 * Math.PI * 62;
    return (
      <section className="success">
        <div className="container">
          <div className="timer-ring">
            <svg width="150" height="150" viewBox="0 0 150 150">
              <defs>
                <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#f7df9b" /><stop offset="1" stopColor="#b8912a" />
                </linearGradient>
              </defs>
              <circle className="ring-bg" cx="75" cy="75" r="62" fill="none" strokeWidth="10" />
              <circle className="ring-fg" cx="75" cy="75" r="62" fill="none" strokeWidth="10" strokeDasharray={C} strokeDashoffset={C * (1 - secs / WAIT)} />
            </svg>
            <div className="num">{secs}</div>
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)' }}>Confirm payment on your phone</h2>
          <p style={{ color: 'var(--muted)', maxWidth: 440, margin: '8px auto 0' }}>
            <Smartphone size={16} style={{ verticalAlign: 'middle' }} /> An M-Pesa prompt for <b>{money(total)}</b> was sent to <b>{form.phone}</b>. Enter your PIN to complete the order.
          </p>
        </div>
      </section>
    );
  }

  if (stage === 'done') {
    return (
      <section className="success">
        <div className="container">
          <div className="check-pop"><Check size={54} strokeWidth={3} /></div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem' }}>Order Successful!</h2>
          <p style={{ color: 'var(--muted)', margin: '8px auto 4px', maxWidth: 460 }}>
            Thank you, {order.name.split(' ')[0]}. A confirmation email is on its way to <b>{order.email}</b>.
          </p>
          <p style={{ marginBottom: 24 }}>Order reference: <b>{order.ref}</b> · {money(order.total)}</p>
          <button className="btn btn-gold" onClick={() => navigate('/store')}>Continue shopping</button>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="page-banner"><div className="container"><h1>Checkout</h1></div></section>
      <section className="section">
        <div className="container two-col">
          <form className="form-card" onSubmit={submit}>
            <h3 style={{ marginBottom: 18 }}>Client details</h3>
            {err && <div className="notice err">{err}</div>}
            <div className="row2">
              <div className="field"><label>Full name</label><input required value={form.name} onChange={set('name')} /></div>
              <div className="field"><label>Email</label><input required type="email" value={form.email} onChange={set('email')} /></div>
            </div>
            <div className="row2">
              <div className="field"><label>Location / delivery address</label><input required value={form.location} onChange={set('location')} placeholder="e.g. Thika, Kiambu" /></div>
              <div className="field"><label>M-Pesa phone number (STK push)</label><input required inputMode="tel" value={form.phone} onChange={set('phone')} placeholder="07XX XXX XXX" /></div>
            </div>
            <button className="btn btn-gold btn-block" disabled={busy}>{busy ? 'Sending prompt…' : `Pay ${money(total)} with M-Pesa`}</button>
          </form>
          <div className="summary">
            <h3 style={{ marginBottom: 14 }}>Your order</h3>
            {items.map((i) => (
              <div className="line" key={i.id}><span>{i.name} × {i.qty}</span><span>{money(i.price * i.qty)}</span></div>
            ))}
            <div className="line total"><span>Total</span><span>{money(total)}</span></div>
            <Link to="/cart" className="link-more" style={{ marginTop: 10 }}>Edit cart</Link>
          </div>
        </div>
      </section>
    </>
  );
}
