import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getPosts } from '../api/posts';
import { useToast } from '../context/ToastContext';
import PostCard from '../components/PostCard';

export default function FeedPage() {
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(searchParams.get('search') ? 'search' : 'for-you');

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 30 };
      const search = searchParams.get('search');
      if (search) params.search = search;
      const { data } = await getPosts(params);
      setPosts(data);
    } catch { toast.error('Failed to load posts'); }
    finally { setLoading(false); }
  }, [toast, searchParams]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const handleDelete = (id) => setPosts(prev => prev.filter(p => p.Post.id !== id));

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', gap: '24px', borderBottom: '1px solid var(--color-border)', marginBottom: '8px', position: 'sticky', top: 'var(--shell-topbar-height)', backgroundColor: 'rgba(var(--color-bg-rgb), 0.85)', backdropFilter: 'blur(12px)', zIndex: 10 }}>
        {['for-you', 'following'].map(tab => (
          <button key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '16px 0', fontSize: '13px', fontWeight: activeTab === tab ? 600 : 500,
              color: activeTab === tab ? 'var(--color-gold)' : 'var(--color-text-muted)',
              textTransform: 'uppercase', letterSpacing: 'var(--ls-wide)',
              position: 'relative', transition: 'color var(--duration-fast) var(--ease-out)',
            }}
          >
            {tab === 'for-you' ? 'For You' : 'Following'}
            {activeTab === tab && <div style={{ position: 'absolute', bottom: -1, left: 0, right: 0, height: 2, backgroundColor: 'var(--color-gold)' }} />}
          </button>
        ))}
      </div>

      {searchParams.get('search') && (
        <p className="text-caption" style={{ padding: '12px 0 4px' }}>
          Results for "<strong>{searchParams.get('search')}</strong>"
        </p>
      )}

      <div>
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ padding: '24px 0', borderBottom: '1px solid var(--color-border)' }}>
              <div className="skeleton" style={{ height: '120px', width: '100%' }} />
            </div>
          ))
        ) : posts.length === 0 ? (
          <div style={{ padding: '80px 0', textAlign: 'center' }}>
            <p className="font-serif" style={{ fontSize: '20px', marginBottom: '8px' }}>No posts yet</p>
            <p className="text-caption">The well is dry. Be the first to write.</p>
          </div>
        ) : (
          posts.map(({ Post, votes, has_voted }) => (
            <PostCard key={Post.id} post={Post} votes={votes} hasVoted={has_voted} onDelete={handleDelete} />
          ))
        )}
      </div>
    </div>
  );
}
