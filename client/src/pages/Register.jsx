import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Feather } from 'lucide-react';
import { registerUser } from '../api/auth';
import { useToast } from '../context/ToastContext';

export default function RegisterPage() {
  const toast = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '', fullName: '', username: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await registerUser({ email: form.email, password: form.password, full_name: form.fullName, username: form.username || undefined });
      toast.success('Welcome to Quill');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed');
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
          <h1 className="font-serif" style={{ fontSize: '32px', fontWeight: 700, marginBottom: '8px' }}>Join Quill</h1>
          <p className="text-caption">Begin your writing journey.</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label className="text-label" style={{ display: 'block', marginBottom: '6px', fontSize: '10px' }}>Full Name</label>
            <input name="fullName" type="text" value={form.fullName} onChange={e => setForm(prev => ({ ...prev, fullName: e.target.value }))}
              placeholder="Your name" required
              style={{ width: '100%', padding: '12px 0', border: 'none', borderBottom: '1px solid var(--color-border-strong)', fontSize: '16px', backgroundColor: 'transparent', color: 'var(--color-text-primary)' }} />
          </div>
          <div>
            <label className="text-label" style={{ display: 'block', marginBottom: '6px', fontSize: '10px' }}>Username</label>
            <input name="username" type="text" value={form.username} onChange={e => setForm(prev => ({ ...prev, username: e.target.value }))}
              placeholder="yourhandle"
              style={{ width: '100%', padding: '12px 0', border: 'none', borderBottom: '1px solid var(--color-border-strong)', fontSize: '16px', backgroundColor: 'transparent', color: 'var(--color-text-primary)' }} />
          </div>
          <div>
            <label className="text-label" style={{ display: 'block', marginBottom: '6px', fontSize: '10px' }}>Email</label>
            <input name="email" type="email" value={form.email} onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
              placeholder="you@example.com" required
              style={{ width: '100%', padding: '12px 0', border: 'none', borderBottom: '1px solid var(--color-border-strong)', fontSize: '16px', backgroundColor: 'transparent', color: 'var(--color-text-primary)' }} />
          </div>
          <div>
            <label className="text-label" style={{ display: 'block', marginBottom: '6px', fontSize: '10px' }}>Password</label>
            <input name="password" type="password" value={form.password} onChange={e => setForm(prev => ({ ...prev, password: e.target.value }))}
              placeholder="Create a password" required
              style={{ width: '100%', padding: '12px 0', border: 'none', borderBottom: '1px solid var(--color-border-strong)', fontSize: '16px', backgroundColor: 'transparent', color: 'var(--color-text-primary)' }} />
          </div>
          {error && <p style={{ fontSize: '13px', color: 'var(--color-destructive)' }}>{error}</p>}
          <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '14px', marginTop: '8px' }}>
            {loading ? 'Creating...' : 'Create Account'}
          </button>
        </form>

        <p className="text-caption" style={{ textAlign: 'center', marginTop: '24px' }}>
          Already on Quill? <Link to="/login" style={{ color: 'var(--color-gold)', fontWeight: 600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
