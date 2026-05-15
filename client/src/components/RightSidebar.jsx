import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPosts } from '../api/posts';

export default function RightSidebar() {
  const navigate = useNavigate();
  const [trendingPosts, setTrendingPosts] = useState([]);

  useEffect(() => {
    getPosts({ limit: 5 }).then(({ data }) => setTrendingPosts(data)).catch(() => {});
  }, []);

  return (
    <aside className="app-sidebar">
      <section style={{ marginBottom: 'var(--space-48)' }}>
        <h3 className="text-label" style={{ marginBottom: 'var(--space-20)' }}>Trending</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {trendingPosts.slice(0, 5).map(({ Post, votes }) => (
            <div key={Post.id}
              onClick={() => navigate(`/posts/${Post.id}`)}
              style={{
                padding: '12px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                transition: 'background-color var(--duration-fast) var(--ease-out)',
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-gold-subtle)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <p className="font-serif" style={{ fontSize: '14px', fontWeight: 600, lineHeight: 1.3, marginBottom: '4px' }}>
                {Post.title.length > 50 ? Post.title.slice(0, 50) + '...' : Post.title}
              </p>
              <span className="text-caption" style={{ fontSize: '11px' }}>{votes} appreciations</span>
            </div>
          ))}
          {trendingPosts.length === 0 && (
            <p className="text-caption" style={{ padding: '12px 0' }}>No posts yet</p>
          )}
        </div>
      </section>

      <section>
        <h3 className="text-label" style={{ marginBottom: 'var(--space-20)' }}>About</h3>
        <p className="text-caption" style={{ lineHeight: 1.6, marginBottom: 'var(--space-16)' }}>
          A refined space for writing and sharing ideas.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '12px', color: 'var(--color-text-muted)' }}>
          <span>© 2026 Quill</span>
          <span>·</span>
          <span>Privacy</span>
          <span>·</span>
          <span>Terms</span>
        </div>
      </section>
    </aside>
  );
}
