import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageCircle, Heart, Bookmark, Share2, Edit2, Trash2, Feather, Send } from 'lucide-react';
import { getPost, deletePost } from '../api/posts';
import { castVote } from '../api/votes';
import { bookmarkPost, removeBookmark, getBookmarkStatus } from '../api/bookmarks';
import { getComments, createComment } from '../api/comments';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}
function timeAgo(d) {
  const date = new Date(d);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function PostDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [voted, setVoted] = useState(false);
  const [votes, setVotes] = useState(0);
  const [bookmarked, setBookmarked] = useState(false);
  const [voteLoading, setVoteLoading] = useState(false);
  const [comments, setComments] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [postRes, commentsRes] = await Promise.all([
          getPost(id),
          getComments(id).catch(() => ({ data: [] })),
        ]);
        setData(postRes.data);
        setVotes(postRes.data.votes);
        setVoted(postRes.data.has_voted);
        setComments(commentsRes.data || []);
        if (user) {
          getBookmarkStatus(id).then(r => setBookmarked(r.data.bookmarked)).catch(() => {});
        }
      } catch { toast.error('Post not found'); navigate('/feed'); }
      finally { setLoading(false); }
    })();
  }, [id, user, navigate, toast]);

  const handleVote = async () => {
    if (voteLoading || !user) { if (!user) toast.error('Sign in to like'); return; }
    setVoteLoading(true);
    const dir = voted ? 0 : 1;
    try {
      await castVote(data.Post.id, dir);
      setVoted(!voted);
      setVotes(v => v + (dir === 1 ? 1 : -1));
    } catch { toast.error('Failed'); }
    finally { setVoteLoading(false); }
  };

  const handleBookmark = async () => {
    if (!user) { toast.error('Sign in to save'); return; }
    try {
      if (bookmarked) { await removeBookmark(data.Post.id); setBookmarked(false); toast.success('Removed'); }
      else { await bookmarkPost(data.Post.id); setBookmarked(true); toast.success('Saved'); }
    } catch { toast.error('Failed'); }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/posts/${data.Post.id}`;
    if (navigator.share) {
      try { await navigator.share({ title: data.Post.title, url }); } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this post?')) return;
    try { await deletePost(data.Post.id); toast.success('Deleted'); navigate('/feed'); }
    catch { toast.error('Could not delete'); }
  };

  const handleReply = async () => {
    if (!replyText.trim() || !user) return;
    setReplyLoading(true);
    try {
      const { data: newComment } = await createComment({ content: replyText.trim(), post_id: parseInt(id) });
      setComments(prev => [...prev, newComment]);
      setReplyText('');
      toast.success('Reply posted');
    } catch { toast.error('Failed'); }
    finally { setReplyLoading(false); }
  };

  if (loading) {
    return (
      <div className="fade-in">
        <div className="skeleton" style={{ height: '36px', width: '60%', marginBottom: '20px' }} />
        <div className="skeleton" style={{ height: '16px', width: '100%', marginBottom: '8px' }} />
        <div className="skeleton" style={{ height: '16px', width: '90%', marginBottom: '8px' }} />
        <div className="skeleton" style={{ height: '16px', width: '70%' }} />
      </div>
    );
  }

  if (!data) return null;
  const { Post } = data;
  const isOwner = user?.id === Post.owner_id;
  const displayName = Post.owner?.full_name || Post.owner?.username || Post.owner?.email?.split('@')[0] || 'User';
  const username = Post.owner?.username || Post.owner?.email?.split('@')[0] || 'user';

  return (
    <div className="fade-in" style={{ paddingBottom: 'var(--space-80)' }}>
      <button onClick={() => navigate(-1)}
        style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-muted)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: 'var(--ls-wide)', marginBottom: '24px' }}>
        <ArrowLeft size={16} strokeWidth={1.5} />
        <span>Back</span>
      </button>

      <article style={{ maxWidth: 'var(--shell-content-max)', margin: '0 auto' }}>
        <header style={{ marginBottom: '32px' }}>
          {Post.title && (
            <h1 className="font-serif" style={{ fontSize: '36px', lineHeight: 1.15, letterSpacing: 'var(--ls-tight)', marginBottom: '20px' }}>
              {Post.title}
            </h1>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '16px', borderBottom: '1px solid var(--color-border)' }}>
            <div className="avatar avatar-md" onClick={() => navigate(`/profile/${Post.owner_id}`)} style={{ cursor: 'pointer' }}>
              <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text-muted)' }}>{displayName[0]?.toUpperCase()}</span>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '16px', fontWeight: 600 }}>{displayName}</span>
                <Feather size={11} strokeWidth={2} style={{ color: 'var(--color-gold)' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                <span className="text-caption" style={{ fontSize: '12px' }}>@{username}</span>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '10px' }}>·</span>
                <span className="text-caption" style={{ fontSize: '12px' }}>{formatDate(Post.created_at)}</span>
              </div>
            </div>
            {isOwner && (
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '4px' }}>
                <button className="btn-icon" onClick={() => navigate(`/posts/${Post.id}/edit`)} title="Edit">
                  <Edit2 size={16} strokeWidth={1.5} />
                </button>
                <button className="btn-icon" onClick={handleDelete} title="Delete" style={{ color: 'var(--color-destructive)' }}>
                  <Trash2 size={16} strokeWidth={1.5} />
                </button>
              </div>
            )}
          </div>
        </header>

        <div style={{ fontSize: '17px', lineHeight: 1.8, color: 'var(--color-text-secondary)', marginBottom: '40px' }}>
          {Post.content.split('\n').map((para, i) =>
            para.trim() ? <p key={i} style={{ marginBottom: '1.5em' }}>{para}</p> : <br key={i} />
          )}
        </div>

        {Post.image_url && (
          <div style={{ margin: '40px 0', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
            <img src={Post.image_url} alt="" loading="lazy" style={{ width: '100%', display: 'block' }} />
          </div>
        )}

        <footer style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', gap: '24px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '15px', fontWeight: 600 }}>{votes}</span>
              <span className="text-label" style={{ fontSize: '10px' }}>Likes</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '15px', fontWeight: 600 }}>{comments.length}</span>
              <span className="text-label" style={{ fontSize: '10px' }}>Comments</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '20px', alignItems: 'center', color: 'var(--color-text-muted)' }}>
            <button onClick={handleVote} disabled={voteLoading} className="btn-icon"
              style={{ color: voted ? 'var(--color-gold)' : 'inherit', width: '36px', height: '36px' }}>
              <Heart size={20} strokeWidth={1.5} fill={voted ? 'var(--color-gold)' : 'none'} />
            </button>
            <button className="btn-icon" style={{ width: '36px', height: '36px' }}>
              <MessageCircle size={20} strokeWidth={1.5} />
            </button>
            <button onClick={handleBookmark} className="btn-icon"
              style={{ color: bookmarked ? 'var(--color-gold)' : 'inherit', width: '36px', height: '36px' }}>
              <Bookmark size={20} strokeWidth={1.5} fill={bookmarked ? 'var(--color-gold)' : 'none'} />
            </button>
            <button onClick={handleShare} className="btn-icon" style={{ marginLeft: 'auto', width: '36px', height: '36px' }}>
              <Share2 size={20} strokeWidth={1.5} />
            </button>
          </div>
        </footer>

        <section style={{ marginTop: '48px' }}>
          <h3 className="text-label" style={{ marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid var(--color-border)' }}>
            Comments ({comments.length})
          </h3>

          {user ? (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div className="avatar avatar-sm" style={{ width: '32px', height: '32px', flexShrink: 0 }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)' }}>
                  {(user?.full_name || user?.email || 'U')[0]?.toUpperCase()}
                </span>
              </div>
              <div style={{ flex: 1 }}>
                <textarea value={replyText} onChange={e => setReplyText(e.target.value)}
                  placeholder="Write a comment..."
                  rows={2}
                  style={{
                    width: '100%', padding: '8px 0', fontSize: '14px', lineHeight: 1.5,
                    border: 'none', borderBottom: '1px solid var(--color-border-strong)',
                    resize: 'none', backgroundColor: 'transparent', color: 'var(--color-text-primary)',
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                  <button onClick={handleReply} disabled={replyLoading || !replyText.trim()}
                    className="btn btn-primary btn-sm" style={{ opacity: !replyText.trim() ? 0.5 : 1 }}>
                    <Send size={14} strokeWidth={1.5} />
                    <span>Comment</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-caption" style={{ marginBottom: '24px' }}>Sign in to leave a comment.</p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {comments.length === 0 ? (
              <div style={{ padding: '20px 0', textAlign: 'center' }}>
                <p className="text-caption">No comments yet.</p>
              </div>
            ) : (
              comments.map(c => (
                <div key={c.id} style={{ display: 'flex', gap: '10px' }}>
                  <div className="avatar avatar-sm" style={{ width: '32px', height: '32px', flexShrink: 0 }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)' }}>
                      {(c.user?.full_name || c.user?.email || 'U')[0]?.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600 }}>{c.user?.full_name || c.user?.username || c.user?.email?.split('@')[0] || 'User'}</span>
                      <span className="text-caption" style={{ fontSize: '11px' }}>· {timeAgo(c.created_at)}</span>
                    </div>
                    <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--color-text-secondary)' }}>{c.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </article>
    </div>
  );
}
