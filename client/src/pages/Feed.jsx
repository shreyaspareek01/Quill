import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getPosts, getFollowingPosts } from '../api/posts';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import PostCard from '../components/PostCard';

export default function FeedPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(searchParams.get('search') ? 'search' : 'for-you');

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      let data;
      if (activeTab === 'following' && user) {
        const res = await getFollowingPosts({ limit: 30 });
        data = res.data;
      } else {
        const params = { limit: 30 };
        const search = searchParams.get('search');
        if (search) params.search = search;
        const res = await getPosts(params);
        data = res.data;
      }
      setPosts(data);
    } catch { toast.error('Failed to load posts'); }
    finally { setLoading(false); }
  }, [toast, searchParams, activeTab, user]);

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
            <div key={i} style={{ padding: '20px 0', borderBottom: '1px solid var(--color-border)' }}>
              <div className="skeleton" style={{ height: '100px', width: '100%' }} />
            </div>
          ))
        ) : posts.length === 0 ? (
          <div style={{ padding: '80px 0', textAlign: 'center' }}>
            <p className="font-serif" style={{ fontSize: '20px', marginBottom: '8px' }}>
              {activeTab === 'following' ? 'No posts from followed users' : 'No posts yet'}
            </p>
            <p className="text-caption">
              {activeTab === 'following' ? 'Follow some users to see their posts here.' : 'Be the first to share something.'}
            </p>
          </div>
        ) : (
          posts.map(({ Post, votes, has_voted, has_reposted, comment_count, repost_count }) => (
            <PostCard key={Post.id} post={Post} votes={votes} hasVoted={has_voted} hasReposted={has_reposted} comment_count={comment_count} repost_count={repost_count} onDelete={handleDelete} />
          ))
        )}
      </div>
    </div>
  );
}
