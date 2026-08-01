import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Feather } from 'lucide-react';
import { getPosts } from '../api/posts';
import { getUsers } from '../api/users';
import { followUser, unfollowUser, getFollowStatus } from '../api/follows';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

function WriterRow({ writer, currentUserId, toast }) {
  const navigate = useNavigate();
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(false);

  const isOwn = currentUserId === writer.id;

  useEffect(() => {
    if (!currentUserId || isOwn) return;
    getFollowStatus(writer.id)
      .then(r => setFollowing(r.data.is_following))
      .catch(() => {});
  }, [writer.id, currentUserId, isOwn]);

  const handleFollow = useCallback(async (e) => {
    e.stopPropagation();
    if (!currentUserId) { toast.error('Sign in to follow'); return; }
    setLoading(true);
    try {
      if (following) {
        await unfollowUser(writer.id);
        setFollowing(false);
      } else {
        await followUser(writer.id);
        setFollowing(true);
      }
    } catch { toast.error('Failed'); }
    finally { setLoading(false); }
  }, [following, writer.id, currentUserId, toast]);

  const displayName = writer.full_name || writer.username || writer.email?.split('@')[0] || 'Writer';
  const handle = writer.username || writer.email?.split('@')[0] || 'writer';

  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '8px 0', borderBottom: '1px solid var(--color-border)',
      }}
    >
      {/* Avatar */}
      <div
        onClick={() => navigate(`/profile/${writer.id}`)}
        className="avatar avatar-sm"
        style={{
          width: '34px', height: '34px', flexShrink: 0, cursor: 'pointer',
          background: writer.avatar_url ? `url(${writer.avatar_url}) center/cover` : undefined,
        }}
      />

      {/* Info */}
      <div
        onClick={() => navigate(`/profile/${writer.id}`)}
        style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, lineHeight: 1.2 }}
            className="truncate">{displayName}</span>
          <Feather size={9} strokeWidth={2} style={{ color: 'var(--color-gold)', flexShrink: 0 }} />
        </div>
        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>@{handle}</span>
      </div>

      {/* Follow button — hidden for own profile */}
      {!isOwn && (
        <button
          onClick={handleFollow}
          disabled={loading}
          style={{
            fontSize: '11px', fontWeight: 700, padding: '4px 10px',
            borderRadius: 'var(--radius-full)',
            border: following ? '1px solid var(--color-border-strong)' : '1px solid var(--color-ink)',
            backgroundColor: following ? 'transparent' : 'var(--color-ink)',
            color: following ? 'var(--color-text-secondary)' : '#FFF',
            transition: 'all var(--duration-fast) var(--ease-out)',
            whiteSpace: 'nowrap', flexShrink: 0,
            opacity: loading ? 0.6 : 1,
          }}
          onMouseEnter={e => {
            if (!following) {
              e.currentTarget.style.backgroundColor = 'var(--color-gold)';
              e.currentTarget.style.borderColor = 'var(--color-gold)';
            }
          }}
          onMouseLeave={e => {
            if (!following) {
              e.currentTarget.style.backgroundColor = 'var(--color-ink)';
              e.currentTarget.style.borderColor = 'var(--color-ink)';
            }
          }}
        >
          {following ? 'Following' : 'Follow'}
        </button>
      )}
    </div>
  );
}

export default function RightSidebar() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [trendingPosts, setTrendingPosts] = useState([]);
  const [writers, setWriters] = useState([]);

  useEffect(() => {
    getPosts({ limit: 5 }).then(({ data }) => setTrendingPosts(data)).catch(() => {});
  }, []);

  useEffect(() => {
    getUsers()
      .then(({ data }) => {
        // Exclude self, show up to 5
        const others = data.filter(u => u.id !== user?.id).slice(0, 5);
        setWriters(others);
      })
      .catch(() => {});
  }, [user?.id]);

  return (
    <aside className="app-sidebar">
      {/* ── Trending Posts ── */}
      <section style={{ marginBottom: 'var(--space-48)' }}>
        <h3 className="text-label" style={{ marginBottom: 'var(--space-20)' }}>Trending Posts</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {trendingPosts.slice(0, 5).map(({ Post, votes }) => (
            <div
              key={Post.id}
              onClick={() => navigate(`/posts/${Post.id}`)}
              style={{
                padding: '10px 12px', borderRadius: 'var(--radius-sm)',
                cursor: 'pointer', transition: 'background-color var(--duration-fast) var(--ease-out)',
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-gold-subtle)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <p className="font-serif" style={{ fontSize: '14px', fontWeight: 600, lineHeight: 1.3, marginBottom: '4px' }}>
                {Post.title.length > 50 ? Post.title.slice(0, 50) + '…' : Post.title}
              </p>
              <span className="text-caption" style={{ fontSize: '11px' }}>{votes} likes</span>
            </div>
          ))}
          {trendingPosts.length === 0 && (
            <p className="text-caption" style={{ padding: '10px 0' }}>No posts yet</p>
          )}
        </div>
      </section>

      {/* ── Writers to Follow ── */}
      {writers.length > 0 && (
        <section style={{ marginBottom: 'var(--space-48)' }}>
          <h3 className="text-label" style={{ marginBottom: 'var(--space-16)' }}>Writers to Follow</h3>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {writers.map(w => (
              <WriterRow
                key={w.id}
                writer={w}
                currentUserId={user?.id}
                toast={toast}
              />
            ))}
          </div>
          <button
            onClick={() => navigate('/explore')}
            style={{
              marginTop: 'var(--space-16)', fontSize: '12px',
              color: 'var(--color-gold)', fontWeight: 600,
              transition: 'color var(--duration-fast) var(--ease-out)',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--color-gold-hover)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--color-gold)'}
          >
            Discover more writers →
          </button>
        </section>
      )}

      {/* ── Footer ── */}
      <section>
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
