import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Heart, Bookmark, Share2, MoreHorizontal, Feather, Clock } from 'lucide-react';
import { castVote } from '../api/votes';
import { bookmarkPost, removeBookmark, getBookmarkStatus } from '../api/bookmarks';
import { followUser, unfollowUser, getFollowStatus } from '../api/follows';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

function formatDate(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function PostCard({ post, votes: initialVotes, hasVoted: initialVoted, onDelete, onFollowChange }) {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [votes, setVotes] = useState(initialVotes || 0);
  const [voted, setVoted] = useState(initialVoted || false);
  const [bookmarked, setBookmarked] = useState(false);
  const [following, setFollowing] = useState(false);
  const [voteLoading, setVoteLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const isOwner = user?.id === post.owner_id;
  const displayName = post.owner?.full_name || post.owner?.username || post.owner?.email?.split('@')[0] || 'Writer';
  const username = post.owner?.username || post.owner?.email?.split('@')[0] || 'writer';

  const handleVote = async (e) => {
    e.stopPropagation();
    if (voteLoading || !user) { if (!user) toast.error('Sign in to vote'); return; }
    setVoteLoading(true);
    const dir = voted ? 0 : 1;
    try {
      await castVote(post.id, dir);
      setVoted(!voted);
      setVotes(v => v + (dir === 1 ? 1 : -1));
    } catch { toast.error('Vote failed'); }
    finally { setVoteLoading(false); }
  };

  const handleBookmark = async (e) => {
    e.stopPropagation();
    if (!user) { toast.error('Sign in to bookmark'); return; }
    try {
      if (bookmarked) { await removeBookmark(post.id); setBookmarked(false); toast.success('Bookmark removed'); }
      else { await bookmarkPost(post.id); setBookmarked(true); toast.success('Bookmarked'); }
    } catch { toast.error('Action failed'); }
  };

  const handleFollow = async (e) => {
    e.stopPropagation();
    if (!user) { toast.error('Sign in to follow'); return; }
    try {
      if (following) { await unfollowUser(post.owner_id); setFollowing(false); toast.success('Unfollowed'); }
      else { await followUser(post.owner_id); setFollowing(true); toast.success('Following'); }
      onFollowChange?.(post.owner_id, !following);
    } catch { toast.error('Action failed'); }
  };

  return (
    <article
      onClick={() => navigate(`/posts/${post.id}`)}
      style={{
        padding: '24px 0', borderBottom: '1px solid var(--color-border)',
        cursor: 'pointer', transition: 'background-color var(--duration-fast) var(--ease-out)',
      }}
      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(var(--color-bg-rgb), 0.3)'}
      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div className="avatar avatar-sm" style={{ width: '36px', height: '36px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-muted)' }}>{displayName[0]?.toUpperCase()}</span>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '14px', fontWeight: 600 }}>{displayName}</span>
              <Feather size={10} strokeWidth={2} style={{ color: 'var(--color-gold)' }} />
              <span className="text-caption" style={{ fontSize: '12px' }}>@{username}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
              <Clock size={10} strokeWidth={1.5} style={{ color: 'var(--color-text-muted)' }} />
              <span className="text-caption" style={{ fontSize: '11px' }}>{formatDate(post.created_at)}</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' }}>
          {!isOwner && user && (
            <button onClick={handleFollow}
              style={{
                fontSize: '11px', fontWeight: 600, padding: '4px 12px',
                borderRadius: 'var(--radius-full)', border: following ? '1px solid var(--color-border-strong)' : '1px solid var(--color-ink)',
                backgroundColor: following ? 'transparent' : 'var(--color-ink)',
                color: following ? 'var(--color-text-primary)' : '#FFF',
                transition: 'all var(--duration-fast) var(--ease-out)',
              }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = following ? '' : 'var(--color-gold)'; e.currentTarget.style.borderColor = following ? '' : 'var(--color-gold)'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = following ? 'transparent' : 'var(--color-ink)'; e.currentTarget.style.borderColor = following ? 'var(--color-border-strong)' : 'var(--color-ink)'; }}
            >
              {following ? 'Following' : 'Follow'}
            </button>
          )}
          <button className="btn-icon" style={{ width: '32px', height: '32px' }}
            onClick={e => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
          >
            <MoreHorizontal size={16} strokeWidth={1.5} />
          </button>
          {menuOpen && (
            <div style={{
              position: 'absolute', top: '100%', right: 0, zIndex: 50,
              backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow-lg)',
              padding: '4px', minWidth: '140px',
            }}>
              {isOwner && <button onClick={e => { e.stopPropagation(); navigate(`/posts/${post.id}/edit`); setMenuOpen(false); }}
                style={{ display: 'block', width: '100%', padding: '8px 12px', textAlign: 'left', fontSize: '13px', borderRadius: 'var(--radius-xs)' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-gold-subtle)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >Edit</button>}
              {isOwner && <button onClick={async (e) => { e.stopPropagation(); setMenuOpen(false); onDelete?.(post.id); }}
                style={{ display: 'block', width: '100%', padding: '8px 12px', textAlign: 'left', fontSize: '13px', borderRadius: 'var(--radius-xs)', color: 'var(--color-destructive)' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-gold-subtle)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >Delete</button>}
            </div>
          )}
        </div>
      </div>

      <div style={{ paddingLeft: '46px' }}>
        {post.title && (
          <h2 className="font-serif" style={{ fontSize: '22px', fontWeight: 700, lineHeight: 1.2, marginBottom: '8px', letterSpacing: 'var(--ls-tight)' }}>
            {post.title}
          </h2>
        )}
        <p className="text-body" style={{ fontSize: '15px', lineHeight: 1.6 }}>
          {post.content.length > 280 ? (
            <>{post.content.slice(0, 280)}<span style={{ opacity: 0.4 }}>... </span>
              <span style={{ color: 'var(--color-gold)', fontWeight: 600, fontSize: '13px' }}>Continue reading</span>
            </>
          ) : post.content}
        </p>
        {post.image_url && (
          <div style={{ marginTop: '12px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
            <img src={post.image_url} alt="" loading="lazy" style={{ width: '100%', maxHeight: '400px', objectFit: 'cover', display: 'block' }} />
          </div>
        )}
      </div>

      <div style={{ paddingLeft: '46px', marginTop: '16px' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <button onClick={handleVote} disabled={voteLoading}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: voted ? 'var(--color-gold)' : 'var(--color-text-muted)', transition: 'color var(--duration-fast) var(--ease-out)' }}>
            <Heart size={16} strokeWidth={1.5} fill={voted ? 'var(--color-gold)' : 'none'} />
            <span style={{ fontFamily: 'var(--font-mono)' }}>{votes}</span>
          </button>
          <button onClick={e => { e.stopPropagation(); navigate(`/posts/${post.id}`); }}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--color-text-muted)', transition: 'color var(--duration-fast) var(--ease-out)' }}>
            <MessageCircle size={16} strokeWidth={1.5} />
          </button>
          <button onClick={handleBookmark}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: bookmarked ? 'var(--color-gold)' : 'var(--color-text-muted)', transition: 'color var(--duration-fast) var(--ease-out)' }}>
            <Bookmark size={16} strokeWidth={1.5} fill={bookmarked ? 'var(--color-gold)' : 'none'} />
          </button>
          <button style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--color-text-muted)', marginLeft: 'auto' }}>
            <Share2 size={16} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </article>
  );
}
