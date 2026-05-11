import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Feather, Globe, Code } from 'lucide-react';
import { loginUser } from '../api/auth';
import { getUsers } from '../api/users';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import './AuthPage.css';

export default function LoginPage() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '' });
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
      const usersRes = await getUsers();
      const currentUser = usersRes.data.find(u => u.email === form.email);
      login(data.access_token, currentUser || { email: form.email });
      toast.success('Welcome back to Quill');
      navigate('/feed');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-split-layout fade-in">
      <div className="auth-split__left">
        <Link to="/" className="auth-split__logo">
          <Feather size={28} strokeWidth={1.5} color="var(--color-gold)" />
          <span>Quill</span>
        </Link>
        <div className="auth-split__quote-wrap">
          <blockquote className="auth-split__quote">
            "Every great idea starts as a sentence."
          </blockquote>
          <cite className="auth-split__cite">— The Art of Writing</cite>
        </div>
        <div className="auth-split__texture" />
      </div>

      <div className="auth-split__right">
        <div className="auth-split__form-container">
          <header className="auth-split__header">
            <h1 className="auth-split__title">Sign in</h1>
            <p className="auth-split__subtitle">Reclaim your refined space for writing.</p>
          </header>

          <div className="auth-social-buttons">
            <button className="auth-social-btn">
              <Globe size={18} strokeWidth={1.2} />
              <span>Continue with Google</span>
            </button>
            <button className="auth-social-btn">
              <Code size={18} strokeWidth={1.2} />
              <span>Continue with Github</span>
            </button>
          </div>

          <div className="auth-divider">
            <span className="text-label">or</span>
          </div>

          <form onSubmit={handleSubmit} className="auth-split__form">
            <div className="auth-input-field">
              <label>Email address</label>
              <input
                name="email"
                type="email"
                className="auth-input"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="auth-input-field">
              <label>Password</label>
              <input
                name="password"
                type="password"
                className="auth-input"
                placeholder="Your password"
                value={form.password}
                onChange={handleChange}
                required
              />
            </div>

            {error && <p className="text-caption" style={{ color: 'var(--color-destructive)' }}>{error}</p>}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ marginTop: 'var(--space-12)' }}
            >
              {loading ? 'Authenticating...' : 'Sign in to Quill'}
            </button>
          </form>

          <p className="text-caption" style={{ textAlign: 'center' }}>
            New to Quill? <Link to="/register" className="link-gold">Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
