import { useState } from 'react';
import { API_URL } from '../api/http';

export default function NewsletterUnsubscribe() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUnsubscribe = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setStatus('');
    try {
      const res = await fetch(`${API_URL}/newsletter/unsubscribe/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setStatus('unsubscribed');
        setEmail('');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 500, marginTop: 80, marginBottom: 80 }}>
      <div style={{
        background: 'linear-gradient(135deg, rgba(10,26,58,0.95), rgba(20,40,80,0.95))',
        padding: 40,
        borderRadius: 16,
        border: '1px solid rgba(212,175,55,0.3)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      }}>
        <h1 style={{ fontSize: '1.75rem', marginBottom: 16, color: '#d4af37' }}>Unsubscribe from Newsletter</h1>
        <p style={{ marginBottom: 24, color: '#e0e0e0' }}>
          Enter your email address to unsubscribe from the Richard Kwanya Snr Ministry newsletter.
        </p>
        <form onSubmit={handleUnsubscribe}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 8, color: '#c0c0c0', fontSize: '.9rem' }}>
              Email address
            </label>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.1)',
                color: '#fff',
                fontSize: '1rem',
              }}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: 8,
              border: 'none',
              background: '#d4af37',
              color: '#0a1a3a',
              fontWeight: 600,
              fontSize: '1rem',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Processing...' : 'Unsubscribe'}
          </button>
        </form>
        {status === 'unsubscribed' && (
          <div style={{ marginTop: 20, padding: 12, background: 'rgba(74,222,128,0.2)', borderRadius: 8, color: '#4ade80' }}>
            ✓ You have been unsubscribed successfully.
          </div>
        )}
        {status === 'error' && (
          <div style={{ marginTop: 20, padding: 12, background: 'rgba(248,113,113,0.2)', borderRadius: 8, color: '#f87171' }}>
            Something went wrong. Please check your email and try again.
          </div>
        )}
      </div>
    </div>
  );
}
