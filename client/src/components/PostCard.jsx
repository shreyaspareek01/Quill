import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Heart, Bookmark, Share2, MoreHorizontal, Feather, Clock, Flag, Edit3, Trash2 } from 'lucide-react';
import { castVote } from '../api/votes';
import { bookmarkPost, removeBookmark } from '../api/bookmarks';
import { followUser, unfollowUser, getFollowStatus } from '../api/follows';
import { deletePost } from '../api/posts';
import { reportPost } from '../api/reports';
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

export default function PostCard({ post, votes: initialVotes, hasVoted: initialVoted, comment_count: initialComments, onDelete, onFollowChange }) {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const isOwner = user?.id === post.owner_id;

  const [votes, setVotes] = useState(initialVotes || 0);
  const [voted, setVoted] = useState(initialVoted || false);
  const [bookmarked, setBookmarked] = useState(false);
  const [following, setFollowing] = useState(false);
  const [voteLoading, setVoteLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (user && !isOwner) {
      getFollowStatus(post.owner_id).then(r => setFollowing(r.data.is_following)).catch(() => {});
    }
  }, [user, post.owner_id, isOwner]);
  const displayName = post.owner?.full_name || post.owner?.username || post.owner?.email?.split('@')[0] || 'User';
  const username = post.owner?.username || post.owner?.email?.split('@')[0] || 'user';

  const handleVote = async (e) => {
    e.stopPropagation();
    if (voteLoading || !user) { if (!user) toast.error('Sign in to like'); return; }
    setVoteLoading(true);
    const dir = voted ? 0 : 1;
    try {
      await castVote(post.id, dir);
      setVoted(!voted);
      setVotes(v => v + (dir === 1 ? 1 : -1));
    } catch { toast.error('Failed'); }
    finally { setVoteLoading(false); }
  };

  const handleBookmark = async (e) => {
    e.stopPropagation();
    if (!user) { toast.error('Sign in to save'); return; }
    try {
      if (bookmarked) { await removeBookmark(post.id); setBookmarked(false); toast.success('Removed'); }
      else { await bookmarkPost(post.id); setBookmarked(true); toast.success('Saved'); }
    } catch { toast.error('Failed'); }
  };

  const handleFollow = async (e) => {
    e.stopPropagation();
    if (!user) { toast.error('Sign in to follow'); return; }
    try {
      if (following) { await unfollowUser(post.owner_id); setFollowing(false); }
      else { await followUser(post.owner_id); setFollowing(true); }
      onFollowChange?.(post.owner_id, !following);
    } catch { toast.error('Failed'); }
  };

  const handleShare = async (e) => {
    e.stopPropagation();
    if (navigator.share) {
      try { await navigator.share({ title: post.title, url: `${window.location.origin}/posts/${post.id}` }); } catch {}
    } else {
      await navigator.clipboard.writeText(`${window.location.origin}/posts/${post.id}`);
      toast.success('Link copied');
    }
  };

  return (
    <article
      onClick={() => navigate(`/posts/${post.id}`)}
      style={{
        padding: '20px 0', borderBottom: '1px solid var(--color-border)',
        cursor: 'pointer', transition: 'background-color var(--duration-fast) var(--ease-out)',
      }}
      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(var(--color-bg-rgb), 0.3)'}
      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div className="avatar avatar-sm" style={{ width: '36px', height: '36px', background: post.owner?.avatar_url ? `url(${post.owner.avatar_url}) center/cover` : undefined }} onClick={e => { e.stopPropagation(); navigate(`/profile/${post.owner_id}`); }} />
          
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
              onMouseEnter={e => { if (!following) { e.currentTarget.style.backgroundColor = 'var(--color-gold)'; e.currentTarget.style.borderColor = 'var(--color-gold)'; }}}
              onMouseLeave={e => { if (!following) { e.currentTarget.style.backgroundColor = 'var(--color-ink)'; e.currentTarget.style.borderColor = 'var(--color-ink)'; }}}
            >
              {following ? 'Following' : 'Follow'}
            </button>
          )}
          <button className="btn-icon" style={{ width: '32px', height: '32px' }}
            onClick={e => { e.stopPropagation(); setMenuOpen(!menuOpen); }}>
            <MoreHorizontal size={16} strokeWidth={1.5} />
          </button>
          {menuOpen && (
            <div style={{
              position: 'absolute', top: '100%', right: 0, zIndex: 50,
              backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow-lg)',
              padding: '4px', minWidth: '160px',
            }}
              onClick={e => e.stopPropagation()}
            >
              {isOwner && <button onClick={() => { navigate(`/posts/${post.id}/edit`); setMenuOpen(false); }}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 12px', textAlign: 'left', fontSize: '13px', borderRadius: 'var(--radius-xs)' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-gold-subtle)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              ><Edit3 size={14} strokeWidth={1.5} /> Edit</button>}
              {isOwner && <button onClick={async () => {
                if (!window.confirm('Delete this post?')) return;
                try { await deletePost(post.id); toast.success('Deleted'); onDelete?.(post.id); } catch { toast.error('Failed'); }
                setMenuOpen(false);
              }}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 12px', textAlign: 'left', fontSize: '13px', borderRadius: 'var(--radius-xs)', color: 'var(--color-destructive)' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-gold-subtle)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              ><Trash2 size={14} strokeWidth={1.5} /> Delete</button>}
              <button onClick={async () => { try { await reportPost(post.id); toast.success('Reported'); } catch { toast.error('Already reported'); } setMenuOpen(false); }}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 12px', textAlign: 'left', fontSize: '13px', borderRadius: 'var(--radius-xs)', color: 'var(--color-destructive)' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-gold-subtle)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              ><Flag size={14} strokeWidth={1.5} /> Report</button>
            </div>
          )}
        </div>
      </div>

      <div style={{ paddingLeft: '46px' }}>
        {post.title && (
          <h2 className="font-serif" style={{ fontSize: '20px', fontWeight: 700, lineHeight: 1.2, marginBottom: '6px', letterSpacing: 'var(--ls-tight)' }}>
            {post.title}
          </h2>
        )}
        <p className="text-body" style={{ fontSize: '15px', lineHeight: 1.6 }}>
          {post.content.length > 280 ? (
            <>{post.content.slice(0, 280)}<span style={{ opacity: 0.4 }}>... </span>
              <span style={{ color: 'var(--color-gold)', fontWeight: 600, fontSize: '13px' }}>Read more</span>
            </>
          ) : post.content}
        </p>
        {post.image_url && (
          <div style={{ marginTop: '10px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
            <img src={post.image_url} alt="" loading="lazy" style={{ width: '100%', maxHeight: '360px', objectFit: 'cover', display: 'block' }} />
          </div>
        )}
      </div>

      <div style={{ paddingLeft: '46px', marginTop: '14px' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <button onClick={handleVote} disabled={voteLoading}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: voted ? 'var(--color-gold)' : 'var(--color-text-muted)' }}>
            <Heart size={16} strokeWidth={1.5} fill={voted ? 'var(--color-gold)' : 'none'} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{votes}</span>
          </button>
          <button onClick={e => { e.stopPropagation(); navigate(`/posts/${post.id}`); }}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--color-text-muted)' }}>
            <MessageCircle size={16} strokeWidth={1.5} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{initialComments ?? 0}</span>
          </button>
          <button onClick={handleBookmark}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: bookmarked ? 'var(--color-gold)' : 'var(--color-text-muted)' }}>
            <Bookmark size={16} strokeWidth={1.5} fill={bookmarked ? 'var(--color-gold)' : 'none'} />
          </button>
          <button onClick={handleShare} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--color-text-muted)', marginLeft: 'auto' }}>
            <Share2 size={16} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </article>
  );
}
