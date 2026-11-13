import { Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, LogOut, Upload, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { http } from '../api/http';
import { useState } from 'react';

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

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
