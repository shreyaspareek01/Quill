import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { getPosts, getFollowingPosts } from '../api/posts';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import PostCard from '../components/PostCard';

export default function FeedPage() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(searchParams.get('search') ? 'search' : 'for-you');
  const [trending, setTrending] = useState([]);
  const [trendingOpen, setTrendingOpen] = useState(false);

  useEffect(() => {
    getPosts({ limit: 5 }).then(({ data }) => setTrending(data)).catch(() => {});
  }, []);

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

      <div className="mobile-trending">
        {trending.length > 0 && (
          <div style={{ marginBottom: 'var(--space-8)' }}>
            <button onClick={() => setTrendingOpen(!trendingOpen)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '10px 0', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 'var(--ls-wide)', color: 'var(--color-text-muted)' }}>
              <span>Trending</span>
              <ChevronDown size={16} strokeWidth={1.5} style={{ transform: trendingOpen ? 'rotate(180deg)' : 'none', transition: 'transform var(--duration-fast) var(--ease-out)' }} />
            </button>
            {trendingOpen && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {trending.slice(0, 5).map(({ Post, votes }) => (
                  <div key={Post.id}
                    onClick={() => navigate(`/posts/${Post.id}`)}
                    style={{ padding: '8px 12px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', transition: 'background-color var(--duration-fast) var(--ease-out)' }}>
                    <p className="font-serif" style={{ fontSize: '14px', fontWeight: 600, lineHeight: 1.3, marginBottom: '2px' }}>
                      {Post.title.length > 50 ? Post.title.slice(0, 50) + '...' : Post.title}
                    </p>
                    <span className="text-caption" style={{ fontSize: '11px' }}>{votes} likes</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

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
