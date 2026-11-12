import { useEffect, useState } from 'react';
import { Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import {
  BookOpen, ExternalLink, Film, HandHeart, HeartHandshake, Images, LayoutDashboard, LogOut, Mail, Menu, MessageSquare,
  Newspaper, Package, ShoppingBag, Sunrise, UserRound, Users, Video, X,
} from 'lucide-react';
import { LogoImg } from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import { hasApi } from '../api/http';
import Dashboard from './Dashboard';
import ResourceList from './ResourceList';
import ResourceForm from './ResourceForm';
import { NAV, PASTOR, RESOURCES } from './resources';
import { ConfirmProvider, ToastProvider, usePageTitle } from './ui';
import './admin.css';

const ICONS = { LayoutDashboard, Film, Video, BookOpen, Sunrise, Newspaper, Images, UserRound, Package, ShoppingBag, HeartHandshake, HandHeart, Mail, MessageSquare, Users };

function Notice({ title, children }) {
  return (
    <div className="adm a-center">
      <div className="a-card a-notice">
        <span className="a-logo"><LogoImg alt="" /></span>
        <h1>{title}</h1>
        {children}
      </div>
    </div>
  );
}

function PastorPage() {
  usePageTitle('Pastor biography');
  return (
    <div>
      <div className="a-head"><div><h1>Pastor biography</h1><p className="a-sub">Shown under “Meet the Pastor” on the About page.</p></div></div>
      <ResourceForm mode="page" singleton fields={PASTOR.fields} endpoint={PASTOR.endpoint} />
    </div>
  );
}

function Resource() {
  const { pathname } = useLocation();
  const key = pathname.replace(/^\/manage\//, '').split('/')[0];
  if (key === 'pastor') return <PastorPage />;
  if (!RESOURCES[key]) return <Navigate to="/manage" replace />;
  return <ResourceList key={key} resKey={key} />;
}

export default function AdminApp() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  useEffect(() => setOpen(false), [pathname]);

  if (!hasApi) return <Notice title="Admin needs the live server"><p>Set <code>VITE_API_URL</code> to your backend address and redeploy.</p><Link className="a-btn" to="/">Back to website</Link></Notice>;
  if (!user) return <Notice title="Admin sign-in"><p>Sign in with your admin account to manage the website.</p><Link className="a-btn primary" to="/auth" state={{ from: '/manage' }}>Sign in</Link></Notice>;
  if (!user.is_staff) return <Notice title="No access"><p>This account is not an administrator. Ask the site owner to make you staff.</p><Link className="a-btn" to="/">Back to website</Link></Notice>;

  return (
    <ToastProvider>
      <ConfirmProvider>
        <div className="adm">
          <div className={`a-overlay ${open ? 'show' : ''}`} onClick={() => setOpen(false)} />
          <aside className={`a-side ${open ? 'show' : ''}`}>
            <div className="a-brand">
              <span className="a-logo"><LogoImg alt="" /></span>
              <div><strong>Richard Kwanya Snr</strong><small>Admin panel</small></div>
              <button className="a-icon a-close" onClick={() => setOpen(false)} aria-label="Close menu"><X size={18} /></button>
            </div>
            <nav>
              {NAV.map(([group, items]) => (
                <div key={group}>
                  <h4>{group}</h4>
                  {items.map(([to, label, icon]) => {
                    const Icon = ICONS[icon];
                    return <NavLink key={to} to={`/manage${to ? `/${to}` : ''}`} end={!to} className="a-link"><Icon size={18} /> {label}</NavLink>;
                  })}
                </div>
              ))}
            </nav>
            <div className="a-side-foot">
              <Link to="/" className="a-link"><ExternalLink size={18} /> View website</Link>
              <button className="a-link" onClick={() => { logout(); navigate('/'); }}><LogOut size={18} /> Sign out</button>
              <small>{user.email}</small>
            </div>
          </aside>
          <div className="a-main">
            <header className="a-top">
              <button className="a-icon" onClick={() => setOpen(true)} aria-label="Open menu"><Menu size={20} /></button>
              <strong>Admin panel</strong>
              <Link to="/" className="a-icon" aria-label="View website"><ExternalLink size={18} /></Link>
            </header>
            <main className="a-content">
              <Routes>
                <Route index element={<Dashboard />} />
                <Route path="*" element={<Resource />} />
              </Routes>
            </main>
          </div>
        </div>
      </ConfirmProvider>
    </ToastProvider>
  );
}
