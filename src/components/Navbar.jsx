import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, Heart, LayoutDashboard, LogIn, Menu, ShoppingCart, User, X } from 'lucide-react';
import Logo from './Logo';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export const RESOURCE_LINKS = [
  ['Devotionals', '/resources/devotionals'],
  ['Sabbath School Video Lessons', '/resources/sabbath-school'],
  ['Sermon Videos', '/resources/sermons'],
  ['Literature Evangelism', '/resources/literature'],
  ['Store / Shop', '/store'],
  ['Blogs', '/resources/blogs'],
  ['Medical Missionary', '/resources/medical-missionary'],
  ['Children Bible Stories', '/resources/children-bible-stories'],
  ['E-Books', '/resources/ebooks'],
  ['Mission Gallery', '/resources/mission-gallery'],
];

const ABOUT_LINKS = [
  ["Pastor's Biography", '/about#pastor'],
  ['Mission', '/about#mission'],
  ['Vision', '/about#vision'],
];

/**
 * Not sticky. On the home page it's `overlay` (absolutely positioned on the hero)
 * with a dark gradient scrim so the links stay readable over any video.
 */
export default function Navbar({ overlay = false }) {
  const [open, setOpen] = useState(false);
  const [mobRes, setMobRes] = useState(false);
  const { user } = useAuth();
  const { count } = useCart();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => (document.body.style.overflow = '');
  }, [open]);

  const initial = (user?.name || 'U').charAt(0).toUpperCase();
  const profilePic = user?.profile_picture;

  return (
    <>
      <header className={`navbar ${overlay ? 'overlay' : ''}`}>
        <div className="container nav-inner">
          <Logo />

          <ul className="nav-links">
            <li>
              <NavLink to="/" end className="nav-link">Home</NavLink>
            </li>
            <li className="dd">
              <span className="nav-link" tabIndex={0} role="button">
                Resources <ChevronDown size={15} />
              </span>
              <ul className="dd-menu">
                {RESOURCE_LINKS.map(([label, to]) => (
                  <li key={to}><Link to={to}>{label}</Link></li>
                ))}
                <li className="dd-sub-title">About</li>
                {ABOUT_LINKS.map(([label, to]) => (
                  <li key={to} className="dd-sub"><Link to={to}>{label}</Link></li>
                ))}
              </ul>
            </li>
            <li><NavLink to="/contact" className="nav-link">Contact</NavLink></li>
            <li><NavLink to="/donate" className="nav-link"><Heart size={15} /> Donate</NavLink></li>
          </ul>

          <div className="nav-icons">
            {user?.is_staff && (
              <button className="icon-btn" onClick={() => navigate('/manage')} aria-label="Admin panel" title="Admin panel">
                <LayoutDashboard size={19} />
              </button>
            )}
            {user ? (
              <button className="icon-btn" onClick={() => navigate('/profile')} aria-label="Profile" title="Profile">
                {profilePic ? (
                  <img src={profilePic} alt={user.name} style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <User size={19} />
                )}
              </button>
            ) : (
              <Link to="/auth" state={{ from: pathname }} className="btn btn-gold btn-sm signin-btn">
                <LogIn size={15} /> Sign in
              </Link>
            )}
            <button className="icon-btn" onClick={() => navigate('/cart')} aria-label="Cart" title="Cart">
              <ShoppingCart size={19} />
              {count > 0 && <span className="cart-badge" key={count}>{count}</span>}
            </button>
            <button className="icon-btn burger" onClick={() => setOpen(true)} aria-label="Open menu">
              <Menu size={21} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer, slides in from the right */}
      <div className={`drawer-overlay ${open ? 'show' : ''}`} onClick={() => setOpen(false)} />
      <aside className={`drawer ${open ? 'show' : ''}`} aria-hidden={!open}>
        <div className="drawer-head">
          <Logo showText={false} />
          <button className="icon-btn" onClick={() => setOpen(false)} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>

        {user ? (
          <div className="drawer-user">
            <span className="avatar">{initial}</span>
            <div>
              <strong>{user.name}</strong>
              <div style={{ fontSize: '.75rem', opacity: .75 }}>{user.email}</div>
            </div>
          </div>
        ) : (
          <div className="drawer-user" style={{ justifyContent: 'space-between' }}>
            <div><strong>Welcome</strong><div style={{ fontSize: '.75rem', opacity: .75 }}>Sign in to watch and read</div></div>
            <Link to="/auth" state={{ from: pathname }} className="btn btn-gold btn-sm" style={{ opacity: 1, transform: 'none', width: 'auto' }}>Sign in</Link>
          </div>
        )}

        <nav>
          <Link to="/" style={{ '--i': 0 }}>Home</Link>
          <button className="drawer-toggle" style={{ '--i': 1 }} onClick={() => setMobRes((v) => !v)}>
            Resources <ChevronDown size={18} style={{ transform: mobRes ? 'rotate(180deg)' : 'none', transition: '.3s' }} />
          </button>
          <div className={`sub ${mobRes ? 'open' : ''}`}>
            {RESOURCE_LINKS.map(([label, to]) => (
              <Link key={to} to={to} style={{ '--i': 2 }}>{label}</Link>
            ))}
            <Link to="/about#pastor" style={{ '--i': 2 }}>About — Pastor&apos;s Biography</Link>
            <Link to="/about#mission" style={{ '--i': 2 }}>About — Mission</Link>
            <Link to="/about#vision" style={{ '--i': 2 }}>About — Vision</Link>
          </div>
          <Link to="/contact" style={{ '--i': 2 }}>Contact</Link>
          <Link to="/donate" style={{ '--i': 3 }}>Donate</Link>
          {user ? <Link to="/profile" style={{ '--i': 4 }}>Profile</Link> : <Link to="/auth" state={{ from: pathname }} style={{ '--i': 4 }}>Sign in / Create account</Link>}
          {user?.is_staff && <Link to="/manage" style={{ '--i': 4 }}>Admin panel</Link>}
          <Link to="/cart" style={{ '--i': 5 }}>
            Cart {count > 0 && <span className="cart-badge" style={{ position: 'static' }}>{count}</span>}
          </Link>
        </nav>

        <div className="drawer-foot">
          <Link to="/resources/sabbath-school" className="btn btn-gold" style={{ opacity: 1, transform: 'none', justifyContent: 'center' }}>
            Latest Sabbath Lesson
          </Link>
        </div>
      </aside>
    </>
  );
}
