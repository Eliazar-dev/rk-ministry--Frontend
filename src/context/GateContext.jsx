import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Lock, X } from 'lucide-react';
import GoogleButton from '../components/GoogleButton';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

/**
 * The site is open to everyone. Visitors are asked to sign up only when they press content.
 *   guard({ type, id }, action, returnTo?)  → runs `action` if signed in, otherwise opens the sign-up prompt
 * What they pressed is remembered, so after signing up the page opens it for them (see useResume).
 */
const GateContext = createContext(null);
export const useGate = () => useContext(GateContext);

const KEY = 'rk_intent';
const readIntent = () => {
  try {
    return JSON.parse(sessionStorage.getItem(KEY));
  } catch {
    return null;
  }
};

export function GateProvider({ children }) {
  const { user, googleLogin } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const [gate, setGate] = useState(null); // { returnTo }
  const [err, setErr] = useState('');

  const guard = useCallback(
    (intent, action, returnTo) => {
      if (user) return action();
      const here = pathname + search;
      try {
        sessionStorage.setItem(KEY, JSON.stringify({ ...intent, path: pathname }));
      } catch {
        /* private mode: they just won't be taken back to the item */
      }
      setErr('');
      setGate({ returnTo: returnTo || here });
    },
    [user, pathname, search]
  );

  // Things a browser would block after a redirect (downloads, new tabs): tell them to tap again
  useEffect(() => {
    const it = readIntent();
    if (user && it && it.path === pathname && (it.type === 'pdf' || it.type === 'album')) {
      sessionStorage.removeItem(KEY);
      toast({ title: 'You are signed in', message: it.type === 'pdf' ? 'Tap Download again to continue.' : 'Tap View photos again to continue.' });
    }
  }, [user, pathname, toast]);

  useEffect(() => {
    if (user && gate) setGate(null);
  }, [user, gate]);

  const close = () => setGate(null);
  const go = (mode) => {
    navigate('/auth', { state: { from: gate.returnTo, mode } });
    close();
  };
  const onGoogle = async (credential) => {
    try {
      const { user: u, created } = await googleLogin(credential);
      toast({ title: created ? `Welcome, ${u.name.split(' ')[0]}!` : 'Welcome back', message: 'You are signed in.' });
    } catch (ex) {
      setErr(ex.message);
    }
  };

  return (
    <GateContext.Provider value={{ guard }}>
      {children}
      {gate && (
        <div className="modal" onClick={close} onKeyDown={(e) => e.key === 'Escape' && close()}>
          <div className="gate" role="dialog" aria-modal="true" aria-labelledby="gate-title" onClick={(e) => e.stopPropagation()}>
            <button className="gate-x" onClick={close} aria-label="Close"><X size={18} /></button>
            <span className="gate-ic"><Lock size={26} /></span>
            <h2 id="gate-title">Create a free account to continue</h2>
            <p>It takes a minute. Join the Richard Kwanya Snr Ministry family to watch, read and download everything.</p>
            {err && <div className="glass-err">{err}</div>}
            <button className="g-btn" onClick={() => go('signup')}>CREATE ACCOUNT</button>
            <button className="gate-alt" onClick={() => go('login')}>I already have an account · Log in</button>
            <div className="or"><span>OR</span></div>
            <GoogleButton onCredential={onGoogle} onError={setErr} />
            <button className="link-btn" onClick={close}>Maybe later</button>
          </div>
        </div>
      )}
    </GateContext.Provider>
  );
}

/** After signing up, reopen what the person pressed. `open(item)` runs once the member data has loaded. */
export function useResume(type, items, open) {
  const { user } = useAuth();
  const { pathname } = useLocation();
  useEffect(() => {
    if (!user || !items.length) return;
    const it = readIntent();
    if (!it || it.type !== type || it.path !== pathname) return;
    const item = items.find((x) => x.id === it.id);
    if (!item || item.locked) return; // wait for the unlocked copy
    sessionStorage.removeItem(KEY);
    open(item);
  }, [user, items, type, pathname]); // eslint-disable-line react-hooks/exhaustive-deps
}
