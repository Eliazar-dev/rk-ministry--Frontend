import { useEffect, useRef } from 'react';

export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

let scriptPromise = null;
function loadGsi() {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://accounts.google.com/gsi/client';
      s.async = true;
      s.onload = resolve;
      s.onerror = () => {
        scriptPromise = null;
        reject(new Error('Could not load Google sign-in.'));
      };
      document.head.appendChild(s);
    });
  }
  return scriptPromise;
}

// Both auth faces render a button, but only one callback is ever needed
let handler = () => {};
let initialised = false;

/**
 * "Continue with Google". Uses Google Identity Services; Google returns an ID token which our
 * Django API verifies. If VITE_GOOGLE_CLIENT_ID is missing we show a button that explains why.
 */
export default function GoogleButton({ onCredential, onError }) {
  const slot = useRef(null);

  useEffect(() => {
    handler = onCredential;
  }, [onCredential]);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    let live = true;
    loadGsi()
      .then(() => {
        if (!live || !slot.current) return;
        if (!initialised) {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: (res) => handler(res.credential),
          });
          initialised = true;
        }
        window.google.accounts.id.renderButton(slot.current, {
          type: 'standard',
          theme: 'filled_blue',
          size: 'large',
          shape: 'pill',
          text: 'continue_with',
          logo_alignment: 'center',
          width: Math.min(320, slot.current.clientWidth || 280),
        });
      })
      .catch((e) => onError?.(e.message));
    return () => {
      live = false;
    };
  }, []); // eslint-disable-line

  if (!GOOGLE_CLIENT_ID) {
    return (
      <button
        type="button"
        className="g-google"
        onClick={() => onError?.('Google sign-in is not set up yet. Add VITE_GOOGLE_CLIENT_ID to enable it.')}
      >
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
          <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
          <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z" />
          <path fill="#FBBC05" d="M10.5 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.9-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.8l7.9-6.1z" />
          <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
        </svg>
        Continue with Google
      </button>
    );
  }
  return <div ref={slot} className="google-slot" />;
}
