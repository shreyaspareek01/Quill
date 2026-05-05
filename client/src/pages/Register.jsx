import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Feather, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { registerUser } from '../api/auth';
import { useToast } from '../context/ToastContext';
import PageWrapper from '../components/PageWrapper';
import './AuthPage.css';

export default function RegisterPage() {
  const toast = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '', confirm: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors(prev => ({ ...prev, [e.target.name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.email) errs.email = 'Email is required.';
    if (form.password.length < 6) errs.password = 'Password must be at least 6 characters.';
    if (form.password !== form.confirm) errs.confirm = 'Passwords do not match.';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      await registerUser({ email: form.email, password: form.password });
      toast.success('Account created! Please sign in.');
      navigate('/login');
    } catch (err) {
      const msg = err.response?.data?.detail || 'Registration failed. Try again.';
      setErrors({ general: typeof msg === 'string' ? msg : 'Something went wrong.' });
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
            <h2>Every great story<br />starts somewhere.</h2>
            <p>Yours begins right here.</p>
          </div>
        </div>

        <div className="auth-card card">
          <div className="auth-card__header">
            <span className="label">Get started</span>
            <h3 className="auth-card__title">Create your account</h3>
            <span className="gold-line" />
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="input-group">
              <label className="input-label" htmlFor="reg-email">Email address</label>
              <div className="input-icon-wrap">
                <Mail size={15} className="input-icon" strokeWidth={1.5} />
                <input
                  id="reg-email"
                  name="email"
                  type="email"
                  className={`input input--icon ${errors.email ? 'error' : ''}`}
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>
              {errors.email && <p className="error-msg">{errors.email}</p>}
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="reg-password">Password</label>
              <div className="input-icon-wrap">
                <Lock size={15} className="input-icon" strokeWidth={1.5} />
                <input
                  id="reg-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  className={`input input--icon input--icon-right ${errors.password ? 'error' : ''}`}
                  placeholder="Min. 6 characters"
                  value={form.password}
                  onChange={handleChange}
                  required
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
              {errors.password && <p className="error-msg">{errors.password}</p>}
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="reg-confirm">Confirm password</label>
              <div className="input-icon-wrap">
                <Lock size={15} className="input-icon" strokeWidth={1.5} />
                <input
                  id="reg-confirm"
                  name="confirm"
                  type={showPassword ? 'text' : 'password'}
                  className={`input input--icon ${errors.confirm ? 'error' : ''}`}
                  placeholder="Repeat your password"
                  value={form.confirm}
                  onChange={handleChange}
                  required
                />
              </div>
              {errors.confirm && <p className="error-msg">{errors.confirm}</p>}
            </div>

            {errors.general && <p className="error-msg">{errors.general}</p>}

            <button
              id="register-submit"
              type="submit"
              className="btn btn-primary auth-submit"
              disabled={loading}
            >
              {loading ? <span className="auth-spinner" /> : 'Create account'}
            </button>
          </form>

          <p className="auth-switch">
            Already have an account?{' '}
            <Link to="/login" className="auth-switch-link">Sign in</Link>
          </p>
        </div>
      </div>
    </PageWrapper>
  );
}
