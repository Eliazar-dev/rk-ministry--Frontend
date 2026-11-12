import { Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <>
      <section className="page-banner">
        <div className="container">
          <div className="profile-head">
            <span className="avatar">{user.name[0].toUpperCase()}</span>
            <div>
              <h1 style={{ fontSize: '2rem' }}>{user.name}</h1>
              <p style={{ marginTop: 2 }}>{user.email}</p>
            </div>
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container" style={{ maxWidth: 640 }}>
          <div className="form-card">
            <h3 style={{ marginBottom: 14 }}>My account</h3>
            <div className="field"><label>Name</label><input value={user.name} readOnly /></div>
            <div className="field"><label>Email</label><input value={user.email} readOnly /></div>
            {user.is_staff && (
              <Link to="/manage" className="btn btn-gold" style={{ marginRight: 10 }}><LayoutDashboard size={17} /> Admin panel</Link>
            )}
            <button className="btn btn-navy" onClick={() => { logout(); navigate('/auth'); }}>
              <LogOut size={17} /> Sign out
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
