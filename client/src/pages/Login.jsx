import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Feather, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { loginUser } from '../api/auth';
import { getUsers } from '../api/users';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import PageWrapper from '../components/PageWrapper';
import './AuthPage.css';

export default function LoginPage() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await loginUser(form);
      // Fetch current user info
      const usersRes = await getUsers();
      const currentUser = usersRes.data.find(u => u.email === form.email);
      login(data.access_token, currentUser || { email: form.email });
      toast.success('Welcome back to Quill!');
      navigate('/feed');
    } catch (err) {
      const msg = err.response?.data?.detail || 'Invalid credentials. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper>
      <div className="auth-page">
        <div className="auth-brand">
          <Link to="/" className="auth-logo">
            <Feather size={20} strokeWidth={1.5} />
            <span>Quill</span>
          </Link>
          <div className="auth-brand-text">
            <h2>Words have power.</h2>
            <p>Sign in and reclaim yours.</p>
          </div>
        </div>

        <div className="auth-card card">
          <div className="auth-card__header">
            <span className="label">Welcome back</span>
            <h3 className="auth-card__title">Sign in to Quill</h3>
            <span className="gold-line" />
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="input-group">
              <label className="input-label" htmlFor="login-email">Email address</label>
              <div className="input-icon-wrap">
                <Mail size={15} className="input-icon" strokeWidth={1.5} />
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  className={`input input--icon ${error ? 'error' : ''}`}
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="login-password">Password</label>
              <div className="input-icon-wrap">
                <Lock size={15} className="input-icon" strokeWidth={1.5} />
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  className={`input input--icon input--icon-right ${error ? 'error' : ''}`}
                  placeholder="Your password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="input-icon-right-btn"
                  onClick={() => setShowPassword(p => !p)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={15} strokeWidth={1.5} /> : <Eye size={15} strokeWidth={1.5} />}
                </button>
              </div>
            </div>

            {error && <p className="error-msg">{error}</p>}

            <button
              id="login-submit"
              type="submit"
              className="btn btn-primary auth-submit"
              disabled={loading}
            >
              {loading ? <span className="auth-spinner" /> : 'Sign in'}
            </button>
          </form>

          <p className="auth-switch">
            New to Quill?{' '}
            <Link to="/register" className="auth-switch-link">Create an account</Link>
          </p>
        </div>
      </div>
    </PageWrapper>
  );
}
