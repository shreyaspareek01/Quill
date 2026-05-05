import { Link, useNavigate } from 'react-router-dom';
import { Feather, ArrowRight, Quote } from 'lucide-react';
import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import PageWrapper from '../components/PageWrapper';
import './Landing.css';

const quotes = [
  { text: "The pen is mightier than the sword.", author: "Edward Bulwer-Lytton" },
  { text: "Fill your paper with the breathings of your heart.", author: "William Wordsworth" },
  { text: "A writer only begins a book. A reader finishes it.", author: "Samuel Johnson" },
];

export default function LandingPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) navigate('/feed', { replace: true });
  }, [isAuthenticated, navigate]);

  const q = quotes[Math.floor(Math.random() * quotes.length)];

  return (
    <PageWrapper>
      <div className="landing">
        {/* Minimal top bar */}
        <header className="landing__header">
          <div className="landing__logo">
            <Feather size={16} strokeWidth={1.5} />
            <span>Quill</span>
          </div>
          <nav className="landing__nav">
            <Link to="/login" className="landing__nav-link">Sign in</Link>
            <Link to="/register" className="btn btn-primary btn-sm">Start writing</Link>
          </nav>
        </header>

        {/* Hero */}
        <main className="landing__hero">
          <div className="landing__hero-inner">
            <span className="label landing__eyebrow">A place for ideas</span>
            <h1 className="landing__headline">
              Write. Share.<br />
              <em className="landing__headline-em">Be Heard.</em>
            </h1>
            <p className="landing__sub">
              Quill is a refined space for writers, thinkers, and storytellers
              to share ideas that matter — and discover the ones that move them.
            </p>
            <div className="landing__cta">
              <Link to="/register" className="btn btn-primary landing__cta-main">
                Pick up your quill
                <ArrowRight size={16} strokeWidth={2} />
              </Link>
              <Link to="/login" className="btn btn-ghost">
                I have an account
              </Link>
            </div>
          </div>

          {/* Decorative quote card */}
          <div className="landing__quote-card card">
            <Quote size={28} className="landing__quote-icon" strokeWidth={1} />
            <p className="landing__quote-text">{q.text}</p>
            <span className="label landing__quote-author">— {q.author}</span>
          </div>
        </main>

        {/* Features strip */}
        <section className="landing__features">
          {[
            { emoji: '✍️', title: 'Write',   desc: 'Craft posts with a distraction-free editor.' },
            { emoji: '👍', title: 'Vote',    desc: 'Surface the ideas that resonate most.' },
            { emoji: '🔍', title: 'Discover', desc: 'Search and explore a curated feed.' },
          ].map(f => (
            <div key={f.title} className="landing__feature">
              <span className="landing__feature-emoji">{f.emoji}</span>
              <h4>{f.title}</h4>
              <p>{f.desc}</p>
            </div>
          ))}
        </section>

        <footer className="landing__footer">
          <span className="label">© {new Date().getFullYear()} Quill — Write beautifully.</span>
        </footer>
      </div>
    </PageWrapper>
  );
}
