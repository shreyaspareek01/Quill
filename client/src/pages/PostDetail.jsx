import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  MessageCircle, 
  Repeat, 
  Heart, 
  Bookmark, 
  Share2,
  Edit2,
  Trash2,
  Feather
} from 'lucide-react';
import { getPost, deletePost } from '../api/posts';
import { castVote } from '../api/votes';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import './PostDetail.css';

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
  });
}

export default function PostDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [voteLoading, setVoteLoading] = useState(false);
  const [voted, setVoted] = useState(false);
  const [votes, setVotes] = useState(0);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await getPost(id);
        setData(res.data);
        setVotes(res.data.votes);
        setVoted(res.data.has_voted);
      } catch {
        toast.error('Post not found.');
        navigate('/feed');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id, navigate, toast]);

  const handleVote = async () => {
    if (voteLoading) return;
    if (!user) {
      toast.error('Sign in to appreciate this thought.');
      return;
    }
    setVoteLoading(true);
    const dir = voted ? 0 : 1;
    try {
      await castVote(data.Post.id, dir);
      setVoted(!voted);
      setVotes(v => v + (dir === 1 ? 1 : -1));
    } catch (err) {
      toast.error('Vote failed.');
    } finally {
      setVoteLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this post? This cannot be undone.')) return;
    try {
      await deletePost(data.Post.id);
      toast.success('Post deleted.');
      navigate('/feed');
    } catch {
      toast.error('Could not delete post.');
    }
  };

  if (loading) {
    return (
      <div className="post-detail-page fade-in">
        <div className="post-detail__article">
          <div className="skeleton" style={{ height: '48px', width: '70%', marginBottom: '32px' }} />
          <div className="skeleton" style={{ height: '24px', width: '100%', marginBottom: '12px' }} />
          <div className="skeleton" style={{ height: '24px', width: '90%', marginBottom: '12px' }} />
        </div>
      </div>
    );
  }

  if (!data) return null;
  const { Post } = data;
  const isOwner = user?.id === Post.owner_id;
  const username = Post.owner?.email?.split('@')[0] || 'writer';

  return (
    <div className="post-detail-page fade-in">
      <header className="post-detail__top">
        <button onClick={() => navigate(-1)} className="btn-back">
          <ArrowLeft size={18} strokeWidth={1.2} />
          <span>Back to Collective</span>
        </button>
      </header>

      <article className="post-detail__article">
        <header className="article-header">
          {Post.title && (
            <h1 className="article-title font-serif">{Post.title}</h1>
          )}
          
          <div className="article-author">
            <div className="user-avatar-md" style={{ width: '40px', height: '40px' }} />
            <div className="author-details">
              <div className="flex items-center gap-8">
                <span className="author-name font-serif">{username}</span>
                <Feather size={12} strokeWidth={2} color="var(--color-gold)" />
              </div>
              <span className="text-label" style={{ fontSize: '10px' }}>@{username}</span>
            </div>
            <div className="ml-auto">
              <span className="text-label" style={{ fontSize: '10px' }}>{formatDate(Post.created_at)}</span>
            </div>
          </div>
        </header>

        <div className="article-content">
          {Post.content.split('\n').map((para, i) => 
            para.trim() ? <p key={i}>{para}</p> : <br key={i} />
          )}
        </div>

        {Post.image_url && (
          <div className="article-media">
            <img src={Post.image_url} alt="" loading="lazy" />
          </div>
        )}

        <footer className="article-footer">
          <div className="article-stats">
            <div className="stat-item">
              <span className="stat-num">{votes}</span>
              <span className="stat-label">Appreciations</span>
            </div>
            <div className="stat-item">
              <span className="stat-num">12</span>
              <span className="stat-label">Reposts</span>
            </div>
          </div>

          <div className="article-actions">
            <button className="action-btn" onClick={handleVote}>
              <Heart size={20} strokeWidth={1.1} style={{ color: voted ? 'var(--color-gold)' : 'inherit' }} />
            </button>
            <button className="action-btn">
              <MessageCircle size={20} strokeWidth={1.1} />
            </button>
            <button className="action-btn">
              <Repeat size={20} strokeWidth={1.1} />
            </button>
            <button className="action-btn">
              <Bookmark size={20} strokeWidth={1.1} />
            </button>
            <button className="action-btn" style={{ marginLeft: 'auto' }}>
              <Share2 size={20} strokeWidth={1.1} />
            </button>
          </div>
        </footer>

        <section className="article-replies">
          <h3 className="replies-title text-label">Dialogue</h3>
          <div className="reply-form">
            <div className="user-avatar-sm" style={{ width: '28px', height: '28px' }} />
            <textarea 
              className="reply-textarea font-serif italic" 
              placeholder="Join the conversation..." 
              rows={1}
            />
            <button className="btn btn-primary btn-sm">Respond</button>
          </div>
          
          <div className="replies-list">
            {/* Sample reply for visual style */}
            <div className="reply-item">
              <div className="user-avatar-sm" />
              <div className="reply-body">
                <header className="reply-header">
                  <span className="font-serif" style={{ fontSize: '14px' }}>Elena Ferrante</span>
                  <span className="text-label" style={{ fontSize: '10px', marginLeft: '8px' }}>2h ago</span>
                </header>
                <p className="reply-text">This observation on the texture of thought is exactly why I find Quill so necessary.</p>
              </div>
            </div>
          </div>
        </section>
      </article>
    </div>
  );
}
