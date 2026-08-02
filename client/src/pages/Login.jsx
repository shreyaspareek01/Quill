import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Feather } from 'lucide-react';
import { loginUser, loginGoogle } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function LoginPage() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleClick = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      toast.error('Google Client ID not configured. Please add VITE_GOOGLE_CLIENT_ID to your .env file.');
      return;
    }
    
    const redirectUri = window.location.origin + '/login';
    const scope = 'openid email profile';
    const responseType = 'id_token';
    const state = Math.random().toString(36).substring(2);
    const nonce = Math.random().toString(36).substring(2);
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` + 
      `client_id=${encodeURIComponent(clientId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=${encodeURIComponent(responseType)}` +
      `&scope=${encodeURIComponent(scope)}` +
      `&state=${encodeURIComponent(state)}` +
      `&nonce=${encodeURIComponent(nonce)}`;
      
    window.location.href = authUrl;
  };

  useEffect(() => {
    const handleHashCallback = async () => {
      const hash = window.location.hash;
      if (hash) {
        const params = new URLSearchParams(hash.substring(1));
        const idToken = params.get('id_token');
        if (idToken) {
          window.history.replaceState(null, '', window.location.pathname);
          
          setLoading(true);
          setError('');
          try {
            const { data } = await loginGoogle(idToken);
            login(data.access_token, data.user);
            toast.success('Welcome to Quill!');
            navigate('/feed');
          } catch (err) {
            setError(err.response?.data?.detail || 'Google sign-in failed');
            toast.error('Google sign-in failed');
          } finally {
            setLoading(false);
          }
        }
      }
    };
    handleHashCallback();
  }, [navigate, login, toast]);

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

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '8px 0' }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--color-border)' }} />
            <span className="text-caption" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>or</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--color-border)' }} />
          </div>

          <button
            type="button"
            onClick={handleGoogleClick}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              width: '100%',
              padding: '12px',
              border: '1px solid var(--color-border-strong)',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'transparent',
              color: 'var(--color-text-primary)',
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all var(--duration-fast) var(--ease-out)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = 'var(--color-gold-subtle)';
              e.currentTarget.style.borderColor = 'var(--color-gold)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.borderColor = 'var(--color-border-strong)';
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path d="M17.64 9.2c0-.63-.06-1.25-.16-1.84H9v3.47h4.84a4.14 4.14 0 0 1-1.8 2.71v2.26h2.91c1.7-1.56 2.69-3.86 2.69-6.6z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.47-.8 5.96-2.2l-2.91-2.26a5.6 5.6 0 0 1-8.54-3L.48 12.8A8.99 8.99 0 0 0 9 18z" fill="#34A853"/>
              <path d="M3.51 10.54a5.4 5.4 0 0 1 0-3.48L.48 4.7a8.99 8.99 0 0 0 0 8.64l3.03-2.8z" fill="#FBBC05"/>
              <path d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59A9 9 0 0 0 .48 4.7l3.03 2.81a5.6 5.6 0 0 1 5.49-3.93z" fill="#EA4335"/>
            </svg>
            <span>Continue with Google</span>
          </button>
        </div>

        <p className="text-caption" style={{ textAlign: 'center', marginTop: '24px' }}>
          New to Quill? <Link to="/register" style={{ color: 'var(--color-gold)', fontWeight: 600 }}>Create an account</Link>
        </p>
      </div>
    </div>
  );
}
