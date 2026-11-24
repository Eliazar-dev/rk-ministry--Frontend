import { Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, LogOut, Lock, Upload, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { http } from '../api/http';
import { useState } from 'react';

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [pw, setPw] = useState({ current: '', password: '', confirm: '' });
  const [pwMsg, setPwMsg] = useState('');
  const [pwErr, setPwErr] = useState('');
  const [pwBusy, setPwBusy] = useState(false);

  const savePassword = async (e) => {
    e.preventDefault();
    setPwErr('');
    setPwMsg('');
    if (pw.password.length < 6) return setPwErr('Password must be at least 6 characters.');
    if (pw.password !== pw.confirm) return setPwErr('The two passwords do not match.');
    setPwBusy(true);
    try {
      await http('/auth/password/', {
        method: 'POST',
        body: { password: pw.password, current_password: pw.current || undefined },
      });
      setPwMsg('Password saved. You can now sign in with it too.');
      setPw({ current: '', password: '', confirm: '' });
      setTimeout(() => window.location.reload(), 1200);
    } catch (ex) {
      setPwErr(ex.message);
    } finally {
      setPwBusy(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File must be less than 5MB');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'unsigned_preset');

      const cloudRes = await fetch('https://api.cloudinary.com/v1_1/dtoxfbfr/image/upload', {
        method: 'POST',
        body: formData,
      });

      const cloudData = await cloudRes.json();

      if (cloudData.error) {
        throw new Error(cloudData.error.message);
      }

      await http('/auth/me/', {
        method: 'PATCH',
        body: { profile_picture: cloudData.secure_url },
      });

      window.location.reload();
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const removeProfilePicture = async () => {
    try {
      await http('/auth/me/', {
        method: 'PATCH',
        body: { profile_picture: '' },
      });
      window.location.reload();
    } catch (err) {
      setError('Failed to remove profile picture');
    }
  };

  return (
    <>
      <section className="page-banner">
        <div className="container">
          <div className="profile-head">
            {user.profile_picture ? (
              <img src={user.profile_picture} alt={user.name} style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <span className="avatar">{user.name[0].toUpperCase()}</span>
            )}
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

            <div className="field">
              <label>Profile picture</label>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <label className="btn btn-navy" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <Upload size={17} />
                  {uploading ? 'Uploading...' : 'Upload photo'}
                  <input type="file" accept="image/*" onChange={handleFileUpload} disabled={uploading} style={{ display: 'none' }} />
                </label>
                {user.profile_picture && (
                  <button className="btn btn-navy" onClick={removeProfilePicture} style={{ background: '#8b0000' }}>
                    <X size={17} /> Remove
                  </button>
                )}
              </div>
              {error && <p style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: 4 }}>{error}</p>}
            </div>

            <div className="field">
              <label><Lock size={14} style={{ verticalAlign: -2, marginRight: 4 }} />Password</label>
              {user.has_password === false && (
                <p style={{ fontSize: '0.85rem', color: '#8fa3c8', margin: '0 0 8px' }}>You sign in with email codes — set a password if you prefer.</p>
              )}
              <form onSubmit={savePassword} style={{ display: 'grid', gap: 8 }}>
                {user.has_password && (
                  <input type="password" placeholder="Current password" autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} required />
                )}
                <input type="password" placeholder={user.has_password ? 'New password' : 'Choose a password'} autoComplete="new-password" value={pw.password} onChange={(e) => setPw({ ...pw, password: e.target.value })} required minLength={6} />
                <input type="password" placeholder="Confirm password" autoComplete="new-password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} required minLength={6} />
                {pwErr && <p style={{ color: '#dc2626', fontSize: '0.85rem', margin: 0 }}>{pwErr}</p>}
                {pwMsg && <p style={{ color: '#16a34a', fontSize: '0.85rem', margin: 0 }}>{pwMsg}</p>}
                <button className="btn btn-navy" type="submit" disabled={pwBusy} style={{ justifySelf: 'start' }}>
                  {pwBusy ? 'Saving…' : user.has_password ? 'Change password' : 'Set password'}
                </button>
              </form>
            </div>

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
