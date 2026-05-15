import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Feather } from 'lucide-react';
import { loginUser } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function LoginPage() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await loginUser(form);
      login(data.access_token, data.user);
      toast.success('Welcome back');
      navigate('/feed');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
            <Feather size={24} strokeWidth={1.5} style={{ color: 'var(--color-gold)' }} />
            <span className="font-serif" style={{ fontSize: '24px', fontWeight: 700 }}>Quill</span>
          </Link>
          <h1 className="font-serif" style={{ fontSize: '32px', fontWeight: 700, marginBottom: '8px' }}>Welcome back</h1>
          <p className="text-caption">Sign in to continue writing.</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label className="text-label" style={{ display: 'block', marginBottom: '6px', fontSize: '10px' }}>Email</label>
            <input name="email" type="email" value={form.email} onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
              placeholder="you@example.com" required
              style={{ width: '100%', padding: '12px 0', border: 'none', borderBottom: '1px solid var(--color-border-strong)', fontSize: '16px', backgroundColor: 'transparent', color: 'var(--color-text-primary)' }} />
          </div>
          <div>
            <label className="text-label" style={{ display: 'block', marginBottom: '6px', fontSize: '10px' }}>Password</label>
            <input name="password" type="password" value={form.password} onChange={e => setForm(prev => ({ ...prev, password: e.target.value }))}
              placeholder="Your password" required
              style={{ width: '100%', padding: '12px 0', border: 'none', borderBottom: '1px solid var(--color-border-strong)', fontSize: '16px', backgroundColor: 'transparent', color: 'var(--color-text-primary)' }} />
          </div>
          {error && <p style={{ fontSize: '13px', color: 'var(--color-destructive)' }}>{error}</p>}
          <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '14px', marginTop: '8px' }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-caption" style={{ textAlign: 'center', marginTop: '24px' }}>
          New to Quill? <Link to="/register" style={{ color: 'var(--color-gold)', fontWeight: 600 }}>Create an account</Link>
        </p>
      </div>
    </div>
  );
}
