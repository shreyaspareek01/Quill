import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, ArrowLeft } from 'lucide-react';
import { getPosts } from '../api/posts';
import { useToast } from '../context/ToastContext';
import PostCard from '../components/PostCard';

export default function ExplorePage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getPosts({ limit: 50 });
      setPosts(data);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }, [toast]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const handleDelete = (id) => setPosts(p => p.filter(x => x.Post.id !== id));

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <button onClick={() => navigate(-1)} className="btn-icon"><ArrowLeft size={20} strokeWidth={1.5} /></button>
        <Compass size={22} strokeWidth={1.5} style={{ color: 'var(--color-gold)' }} />
        <h1 className="font-serif" style={{ fontSize: '24px', fontWeight: 700 }}>Explore</h1>
      </div>

      {loading ? (
        Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{ padding: '24px 0', borderBottom: '1px solid var(--color-border)' }}>
            <div className="skeleton" style={{ height: '100px', width: '100%' }} />
          </div>
        ))
      ) : posts.length === 0 ? (
        <div style={{ padding: '80px 0', textAlign: 'center' }}>
          <p className="font-serif" style={{ fontSize: '20px', marginBottom: '8px' }}>Nothing to explore yet</p>
          <p className="text-caption">Posts from everyone will appear here.</p>
        </div>
      ) : (
        posts.map(({ Post, votes, has_voted, has_reposted, comment_count, repost_count }) => (
          <PostCard key={Post.id} post={Post} votes={votes} hasVoted={has_voted} hasReposted={has_reposted} comment_count={comment_count} repost_count={repost_count} onDelete={handleDelete} />
        ))
      )}
    </div>
  );
}
