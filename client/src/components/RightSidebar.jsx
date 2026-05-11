import { Link } from 'react-router-dom';
import './RightSidebar.css';

export default function RightSidebar() {
  const trends = [
    { topic: 'The Future of AI', category: 'Technology', posts: '1.2k' },
    { topic: 'Stoic Resilience', category: 'Philosophy', posts: '852' },
    { topic: 'Minimalist Design', category: 'Design', posts: '2.4k' },
    { topic: 'Post-Digital Age', category: 'Culture', posts: '640' },
  ];

  const suggestedWriters = [
    { name: 'Elena Ferrante', bio: 'Novelist & Essayist' },
    { name: 'Ta-Nehisi Coates', bio: 'Writer & Journalist' },
    { name: 'Zadie Smith', bio: 'Literary Critic' },
  ];

  return (
    <aside className="app-sidebar">
      <section className="sidebar-section">
        <h2 className="sidebar-section-title">Trending Insights</h2>
        <div className="flex flex-col">
          {trends.map((item, i) => (
            <div key={i} className="trend-item group cursor-pointer">
              <span className="text-label" style={{ fontSize: '9px', color: 'var(--color-gold)' }}>{item.category}</span>
              <p className="font-serif trend-topic" style={{ fontSize: '16px', color: 'var(--color-text-primary)' }}>{item.topic}</p>
              <p className="text-caption" style={{ fontSize: '12px' }}>{item.posts} readers</p>
            </div>
          ))}
        </div>
        <Link to="/explore" className="sidebar-link">
          Explore all trends
        </Link>
      </section>

      <section className="sidebar-section" style={{ marginTop: 'var(--space-64)' }}>
        <h2 className="sidebar-section-title">Writers to Follow</h2>
        <div className="flex flex-col">
          {suggestedWriters.map((item, i) => (
            <div key={i} className="writer-item">
              <div className="user-avatar-md" style={{ width: '40px', height: '40px' }} />
              <div className="writer-info">
                <p className="font-serif writer-name truncate">{item.name}</p>
                <p className="writer-bio truncate">{item.bio}</p>
              </div>
              <button className="btn-follow">
                Follow
              </button>
            </div>
          ))}
        </div>
        <Link to="/explore/writers" className="sidebar-link">
          Discover more writers
        </Link>
      </section>

      <footer style={{ marginTop: 'var(--space-80)', paddingTop: 'var(--space-24)', borderTop: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontSize: '11px' }}>
        <div className="flex flex-wrap gap-16">
          <Link to="/about" className="hover:text-primary transition-colors">About</Link>
          <Link to="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
          <Link to="/terms" className="hover:text-primary transition-colors">Terms</Link>
          <span style={{ marginLeft: 'auto' }}>© 2026 Quill</span>
        </div>
      </footer>
    </aside>
  );
}
