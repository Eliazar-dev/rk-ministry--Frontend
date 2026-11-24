import { useEffect, useState } from 'react';
import { X, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_URL, tokens } from '../api/http';

export default function NewsletterPopup() {
  const { user } = useAuth();
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Check if already dismissed
    const key = `newsletter_dismissed_${user.email}`;
    if (localStorage.getItem(key)) {
      setDismissed(true);
      return;
    }

    // Check subscription status
    const checkSubscription = async () => {
      try {
        const t = tokens.get();
        const res = await fetch(`${API_URL}/newsletter/me/`, {
          headers: t?.access ? { Authorization: `Bearer ${t.access}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          if (data.subscribed) {
            setDismissed(true);
          } else {
            setShow(true);
          }
        }
      } catch {
        // If check fails, show the popup anyway
        setShow(true);
      }
    };

    checkSubscription();
  }, [user]);

  const handleSubscribe = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/newsletter/subscribe/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, name: user.display_name }),
      });
      if (res.ok) {
        setSubscribed(true);
        setTimeout(() => {
          setShow(false);
          if (user) {
            localStorage.setItem(`newsletter_dismissed_${user.email}`, 'true');
          }
        }, 2000);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    setShow(false);
    if (user) {
      localStorage.setItem(`newsletter_dismissed_${user.email}`, 'true');
    }
  };

  if (!show || dismissed) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: 20,
    }}>
      <div style={{
        background: 'linear-gradient(135deg, rgba(10,26,58,0.98), rgba(20,40,80,0.98))',
        borderRadius: 20,
        padding: 40,
        maxWidth: 480,
        width: '100%',
        border: '1px solid rgba(212,175,55,0.4)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        position: 'relative',
        animation: 'fadeIn 0.3s ease-out',
      }}>
        <button
          onClick={handleDismiss}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            borderRadius: '50%',
            width: 36,
            height: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#fff',
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
          onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
        >
          <X size={20} />
        </button>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          marginBottom: 24,
        }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #d4af37, #f4d03f)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Mail size={28} color="#0a1a3a" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.5rem', color: '#d4af37', margin: 0 }}>Stay Connected</h2>
            <p style={{ color: '#b0b0b0', margin: '4px 0 0 0', fontSize: '.95rem' }}>Join our newsletter</p>
          </div>
        </div>

        {!subscribed ? (
          <>
            <p style={{ color: '#e0e0e0', lineHeight: 1.6, marginBottom: 24 }}>
              Get notified when new sermons, Sabbath School lessons, devotionals, and articles are published.
              Never miss an update from Richard Kwanya Snr Ministry.
            </p>
            <button
              onClick={handleSubscribe}
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px 24px',
                borderRadius: 10,
                border: 'none',
                background: 'linear-gradient(135deg, #d4af37, #f4d03f)',
                color: '#0a1a3a',
                fontWeight: 700,
                fontSize: '1rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={(e) => !loading && (e.target.style.transform = 'translateY(-2px)', e.target.style.boxShadow = '0 8px 20px rgba(212,175,55,0.4)')}
              onMouseLeave={(e) => !loading && (e.target.style.transform = 'translateY(0)', e.target.style.boxShadow = 'none')}
            >
              {loading ? 'Subscribing...' : 'Subscribe with my email'}
            </button>
            <button
              onClick={handleDismiss}
              style={{
                width: '100%',
                padding: '12px',
                marginTop: 12,
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'transparent',
                color: '#b0b0b0',
                fontSize: '.9rem',
                cursor: 'pointer',
                transition: 'color 0.2s, border-color 0.2s',
              }}
              onMouseEnter={(e) => { e.target.style.color = '#fff'; e.target.style.borderColor = 'rgba(255,255,255,0.4)'; }}
              onMouseLeave={(e) => { e.target.style.color = '#b0b0b0'; e.target.style.borderColor = 'rgba(255,255,255,0.2)'; }}
            >
              Maybe later
            </button>
          </>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '20px 0',
          }}>
            <div style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'rgba(74,222,128,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <Mail size={32} color="#4ade80" />
            </div>
            <h3 style={{ color: '#4ade80', fontSize: '1.25rem', margin: '0 0 8px' }}>You're subscribed!</h3>
            <p style={{ color: '#b0b0b0', margin: 0 }}>We'll send updates to {user.email}</p>
          </div>
        )}
      </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
