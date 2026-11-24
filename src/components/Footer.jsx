import { Link } from 'react-router-dom';
import { Mail, MapPin, Phone } from 'lucide-react';
import Logo from './Logo';
import { EMAIL, MAP_QUERY, PHONE } from '../config';
import { useState } from 'react';
import { API_URL } from '../api/http';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setStatus('');
    try {
      const res = await fetch(`${API_URL}/newsletter/subscribe/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setStatus('subscribed');
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
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <Logo />
          <p style={{ marginTop: 16, maxWidth: 340, fontSize: '.9rem' }}>
            Equipping people, transforming lives. Spreading the gospel through the Word, worship, mission and service.
          </p>
          <div style={{ marginTop: 20 }}>
            <h4 style={{ marginBottom: 8 }}>Newsletter</h4>
            <form onSubmit={handleSubscribe} style={{ display: 'flex', gap: 8 }}>
              <input
                type="email"
                placeholder="Your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                style={{
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: 'rgba(255,255,255,0.1)',
                  color: '#fff',
                  flex: 1,
                  fontSize: '.9rem',
                }}
              />
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '8px 16px',
                  borderRadius: 6,
                  border: 'none',
                  background: '#d4af37',
                  color: '#0a1a3a',
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '.9rem',
                }}
              >
                {loading ? '...' : 'Subscribe'}
              </button>
            </form>
            {status === 'subscribed' && (
              <div style={{ marginTop: 8, fontSize: '.85rem', color: '#4ade80' }}>
                ✓ Subscribed! Check your email.
              </div>
            )}
            {status === 'error' && (
              <div style={{ marginTop: 8, fontSize: '.85rem', color: '#f87171' }}>
                Something went wrong. Try again.
              </div>
            )}
          </div>
        </div>
        <div>
          <h4>Explore</h4>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/resources/sermons">Sermons</Link></li>
            <li><Link to="/resources/sabbath-school">Sabbath School</Link></li>
            <li><Link to="/resources/youth-ministries">Youth Ministries</Link></li>
            <li><Link to="/store">Store</Link></li>
          </ul>
        </div>
        <div>
          <h4>Ministry</h4>
          <ul>
            <li><Link to="/about#pastor">Pastor&apos;s Biography</Link></li>
            <li><Link to="/about#mission">Mission</Link></li>
            <li><Link to="/about#vision">Vision</Link></li>
            <li><Link to="/resources/mission-gallery">Mission Gallery</Link></li>
            <li><Link to="/donate">Donate</Link></li>
          </ul>
        </div>
        <div>
          <h4>Contact</h4>
          <ul>
            <li style={{ display: 'flex', gap: 8 }}><MapPin size={16} /> {MAP_QUERY}</li>
            <li style={{ display: 'flex', gap: 8 }}><Phone size={16} /> {PHONE}</li>
            <li style={{ display: 'flex', gap: 8 }}><Mail size={16} /> {EMAIL}</li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <strong>Richard Kwanya Snr #Babawa</strong>
        <div style={{ opacity: .7, marginTop: 4 }}>© {new Date().getFullYear()} All rights reserved.</div>
      </div>
    </footer>
  );
}
