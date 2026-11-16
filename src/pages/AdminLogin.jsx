import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { LogoImg } from '../components/Logo';

export default function AdminLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setLoading(true);

    try {
      const result = await login(form);
      if (result.user.is_staff) {
        navigate('/manage');
      } else {
        setErr('This login is for staff only. Please use the regular login page.');
      }
    } catch (error) {
      setErr(error.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-container">
        <div className="admin-login-header">
          <div className="admin-login-logo">
            <LogoImg alt="Richard Kwanya Snr Ministry" />
          </div>
          <h1>Admin Portal</h1>
          <p>Richard Kwanya Snr Ministry Management</p>
        </div>

        <form onSubmit={submit} className="admin-login-form">
          {err && <div className="error-banner">{err}</div>}

          <div className="field">
            <label>Admin Email</label>
            <input
              type="email"
              value={form.email}
              onChange={set('email')}
              placeholder="Enter your admin email"
              required
            />
          </div>

          <div className="field">
            <label>Password</label>
            <input
              type="password"
              value={form.password}
              onChange={set('password')}
              placeholder="Enter your password"
              required
            />
          </div>

          <button type="submit" className="btn btn-gold btn-block" disabled={loading}>
            {loading ? 'Signing in...' : <><Lock size={18} /> Sign In to Admin Panel</>}
          </button>
        </form>

        <div className="admin-login-footer">
          <Link to="/auth" className="text-link">
            ← Back to regular login
          </Link>
        </div>
      </div>
    </div>
  );
}
