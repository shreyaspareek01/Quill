import { Link, useNavigate } from 'react-router-dom';
import { Feather, PenTool, Users, Sparkles } from 'lucide-react';
import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './Landing.css';

export default function LandingPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) navigate('/feed', { replace: true });
  }, [isAuthenticated, navigate]);

  return (
    <div className="landing-page fade-in">
      {/* Editorial Header */}
      <header className="landing-header">
        <div className="landing-header__inner">
          <Link to="/" className="landing-logo">
            <Feather size={22} strokeWidth={1.5} color="var(--color-gold)" />
            <span>Quill</span>
          </Link>
          <div className="landing-nav">
            <Link to="/login" className="nav-link">Sign in</Link>
            <Link to="/register" className="btn btn-primary btn-sm">Start Writing</Link>
          </div>
        </div>
      </header>

      <main className="landing-main">
        {/* Hero: The Statement */}
        <section className="landing-hero">
          <div className="hero-content">
            <span className="text-label" style={{ color: 'var(--color-gold)', marginBottom: 'var(--space-24)', display: 'block' }}>
              Introducing Quill
            </span>
            <h1 className="hero-title font-serif">
              A refined space for <br />
              <span className="italic">writers & thinkers.</span>
            </h1>
            <p className="hero-subtitle">
              Quill is a luxury social network designed for the depth of human thought. 
              No noise. No algorithms. Just ideas that matter.
            </p>
            <div className="hero-actions">
              <Link to="/register" className="btn btn-primary">Begin your journey</Link>
              <Link to="/feed" className="link-gold" style={{ fontSize: '15px' }}>Explore the collective</Link>
            </div>
          </div>
        </section>

        {/* The Philosophy Strip */}
        <section className="philosophy-strip">
          <div className="philosophy-item">
            <PenTool size={20} strokeWidth={1.2} />
            <span>Focus on the craft</span>
          </div>
          <div className="philosophy-item">
            <Users size={20} strokeWidth={1.2} />
            <span>Intellectual community</span>
          </div>
          <div className="philosophy-item">
            <Sparkles size={20} strokeWidth={1.2} />
            <span>Quality over engagement</span>
          </div>
        </section>

        {/* Feature: The Canvas */}
        <section className="landing-feature">
          <div className="feature-grid">
            <div className="feature-text">
              <h2 className="font-serif">The distraction-free canvas.</h2>
              <p>
                Our editor is designed to fade away, leaving you with nothing but your thoughts 
                and a perfectly typeset page. It's the digital equivalent of high-end stationery.
              </p>
            </div>
            <div className="feature-visual">
              <div className="mock-editor">
                <div className="mock-header" />
                <div className="mock-body">
                  <div className="skeleton" style={{ height: '32px', width: '60%', marginBottom: '24px' }} />
                  <div className="skeleton" style={{ height: '14px', width: '100%', marginBottom: '12px' }} />
                  <div className="skeleton" style={{ height: '14px', width: '90%', marginBottom: '12px' }} />
                  <div className="skeleton" style={{ height: '14px', width: '95%', marginBottom: '12px' }} />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="footer-inner">
          <div className="footer-brand font-serif">Quill</div>
          <div className="footer-links">
            <Link to="/about">About</Link>
            <Link to="/manifesto">Manifesto</Link>
            <Link to="/privacy">Privacy</Link>
            <span className="text-muted">© 2026</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
