import { Link } from 'react-router-dom';
import { Feather } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="fade-in" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', textAlign: 'center' }}>
      <Feather size={40} strokeWidth={1.2} style={{ color: 'var(--color-gold)', marginBottom: '24px' }} />
      <h1 className="font-serif" style={{ fontSize: '48px', fontWeight: 700, marginBottom: '12px' }}>404</h1>
      <p className="text-caption" style={{ fontSize: '16px', marginBottom: '32px' }}>This page doesn't exist.</p>
      <Link to="/feed" className="btn btn-primary">Back to Feed</Link>
    </div>
  );
}
