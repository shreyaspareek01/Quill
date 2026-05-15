import { Link } from 'react-router-dom';
import { Feather, ArrowRight } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="fade-in" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', textAlign: 'center' }}>
      <div style={{ marginBottom: '48px' }}>
        <Feather size={48} strokeWidth={1.2} style={{ color: 'var(--color-gold)' }} />
      </div>
      <h1 className="font-serif" style={{ fontSize: '72px', lineHeight: 1.05, letterSpacing: '-0.03em', marginBottom: '16px', maxWidth: '700px' }}>
        Write.
        <br />
        Share.
        <br />
        Be Heard.
      </h1>
      <p style={{ fontSize: '18px', color: 'var(--color-text-secondary)', maxWidth: '420px', marginBottom: '40px', lineHeight: 1.6 }}>
        A refined space for thought, writing, and meaningful conversation.
      </p>
      <div style={{ display: 'flex', gap: '12px' }}>
        <Link to="/register" className="btn btn-primary" style={{ padding: '14px 32px', fontSize: '15px' }}>
          Get Started <ArrowRight size={16} strokeWidth={1.5} />
        </Link>
        <Link to="/login" className="btn btn-ghost" style={{ padding: '14px 32px', fontSize: '15px' }}>
          Sign In
        </Link>
      </div>
      <p className="text-caption" style={{ marginTop: '48px', fontSize: '12px' }}>
        &copy; 2026 Quill
      </p>
    </div>
  );
}
