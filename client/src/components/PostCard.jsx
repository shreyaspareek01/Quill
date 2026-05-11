import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  MessageCircle, 
  Repeat, 
  Heart, 
  Bookmark, 
  Share2,
  MoreHorizontal,
  Plus,
  Feather,
  Clock
} from 'lucide-react';
import { castVote } from '../api/votes';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import './PostCard.css';

function formatDate(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);

  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  
  return date.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric',
  });
}

export default function PostCard({ post, votes: initialVotes, hasVoted: initialVoted, onDelete }) {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [votes, setVotes] = useState(initialVotes || 0);
  const [voted, setVoted] = useState(initialVoted || false);
  const [voteLoading, setVoteLoading] = useState(false);

  const isOwner = user?.id === post.owner_id;
  const username = post.owner?.email?.split('@')[0] || 'writer';
  const isVerified = true; 

  const handleVote = async (e) => {
    e.stopPropagation();
    if (voteLoading) return;
    if (!user) {
      toast.error('Sign in to appreciate this thought.');
      return;
    }
    setVoteLoading(true);
    const newDir = voted ? 0 : 1;
    try {
      await castVote(post.id, newDir);
      setVoted(!voted);
      setVotes(v => v + (newDir === 1 ? 1 : -1));
    } catch (err) {
      toast.error('Unable to complete action.');
    } finally {
      setVoteLoading(false);
    }
  };

  return (
    <article className="post-card" onClick={() => navigate(`/posts/${post.id}`)}>
      <header className="post-card__header">
        <div className="post-card__author-info">
          <div className="user-avatar-md" style={{ width: '32px', height: '32px' }} />
          <div className="post-card__author-details">
            <div className="post-card__author-name-row">
              <span className="post-card__name font-serif">{username}</span>
              {isVerified && (
                <Feather size={12} strokeWidth={2} style={{ color: 'var(--color-gold)' }} />
              )}
              <span className="text-label" style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>@{username}</span>
            </div>
            <div className="post-card__meta">
              <Clock size={10} strokeWidth={1.5} />
              <time style={{ fontFamily: 'var(--font-mono)', fontSize: '10px' }}>{formatDate(post.created_at)}</time>
              <span style={{ fontSize: '10px' }}>·</span>
              <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>4 min read</span>
            </div>
          </div>
        </div>
        
        <div className="post-card__options" onClick={e => e.stopPropagation()}>
          {!isOwner && (
            <button className="post-card__follow-btn">
              <Plus size={10} strokeWidth={2.5} />
              <span>Follow</span>
            </button>
          )}
          <button className="btn-icon" style={{ opacity: 0.5 }}>
            <MoreHorizontal size={16} strokeWidth={1.2} />
          </button>
        </div>
      </header>

      <div className="post-card__body">
        {post.title && (
          <h2 className="post-card__title font-serif">{post.title}</h2>
        )}
        <p className="post-card__content text-body">
          {post.content.length > 280 ? (
            <>
              {post.content.slice(0, 280)}
              <span style={{ opacity: 0.5 }}>...</span>
              <span className="post-card__read-more link-gold">Continue reading</span>
            </>
          ) : post.content}
        </p>
        
        {post.image_url && (
          <div className="post-card__media">
            <img src={post.image_url} alt="" loading="lazy" />
          </div>
        )}
      </div>

      <footer className="post-card__footer" onClick={e => e.stopPropagation()}>
        <div className="post-card__actions">
          <button className="post-card__action-btn">
            <MessageCircle size={17} strokeWidth={1.1} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>12</span>
          </button>
          
          <button className="post-card__action-btn">
            <Repeat size={17} strokeWidth={1.1} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>4</span>
          </button>

          <button 
            className={`post-card__action-btn ${voted ? 'active' : ''}`}
            onClick={handleVote}
            disabled={voteLoading}
          >
            <Heart size={17} strokeWidth={1.1} style={{ color: voted ? 'var(--color-gold)' : 'inherit' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: voted ? 'var(--color-gold)' : 'inherit' }}>{votes}</span>
          </button>

          <button className="post-card__action-btn">
            <Bookmark size={17} strokeWidth={1.1} />
          </button>

          <button className="post-card__action-btn" style={{ marginLeft: 'auto' }}>
            <Share2 size={17} strokeWidth={1.1} />
          </button>
        </div>
      </footer>
    </article>
  );
}
