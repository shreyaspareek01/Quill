import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Feather } from 'lucide-react';
import { getPosts } from '../api/posts';
import { getUsers } from '../api/users';
import { followUser, unfollowUser, getFollowStatus } from '../api/follows';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import PostCard from '../components/PostCard';

/* ── People row (mirrors WriterRow in RightSidebar) ── */
function PeopleRow({ writer, currentUserId, toast }) {
  const navigate = useNavigate();
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const isOwn = currentUserId === writer.id;

  useEffect(() => {
    if (!currentUserId || isOwn) return;
    getFollowStatus(writer.id).then(r => setFollowing(r.data.is_following)).catch(() => {});
  }, [writer.id, currentUserId, isOwn]);

  const handleFollow = useCallback(async (e) => {
    e.stopPropagation();
    if (!currentUserId) { toast.error('Sign in to follow'); return; }
    setLoading(true);
    try {
      if (following) { await unfollowUser(writer.id); setFollowing(false); }
      else           { await followUser(writer.id);   setFollowing(true);  }
    } catch { toast.error('Failed'); }
    finally { setLoading(false); }
  }, [following, writer.id, currentUserId, toast]);

  const displayName = writer.full_name || writer.username || writer.email?.split('@')[0] || 'Writer';
  const handle      = writer.username || writer.email?.split('@')[0] || 'writer';
  const bio         = writer.bio || null;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '14px',
      padding: '16px 0', borderBottom: '1px solid var(--color-border)',
    }}>
      {/* Avatar */}
      <div
        onClick={() => navigate(`/profile/${writer.id}`)}
        className="avatar avatar-md"
        style={{
          width: '44px', height: '44px', flexShrink: 0, cursor: 'pointer',
          background: writer.avatar_url ? `url(${writer.avatar_url}) center/cover` : undefined,
        }}
      />

      {/* Info */}
      <div
        onClick={() => navigate(`/profile/${writer.id}`)}
        style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '2px' }}>
          <span style={{ fontSize: '15px', fontWeight: 700 }}>{displayName}</span>
          <Feather size={10} strokeWidth={2} style={{ color: 'var(--color-gold)', flexShrink: 0 }} />
        </div>
        <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>@{handle}</span>
        {bio && (
          <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '4px', lineHeight: 1.4 }}
            className="truncate">
            {bio}
          </p>
        )}
      </div>

      {/* Follow button */}
      {!isOwn && (
        <button
          onClick={handleFollow}
          disabled={loading}
          style={{
            fontSize: '12px', fontWeight: 700, padding: '6px 16px',
            borderRadius: 'var(--radius-full)', flexShrink: 0,
            border: following ? '1px solid var(--color-border-strong)' : '1px solid var(--color-ink)',
            backgroundColor: following ? 'transparent' : 'var(--color-ink)',
            color: following ? 'var(--color-text-secondary)' : '#FFF',
            transition: 'all var(--duration-fast) var(--ease-out)',
            opacity: loading ? 0.6 : 1,
          }}
          onMouseEnter={e => { if (!following) { e.currentTarget.style.backgroundColor = 'var(--color-gold)'; e.currentTarget.style.borderColor = 'var(--color-gold)'; }}}
          onMouseLeave={e => { if (!following) { e.currentTarget.style.backgroundColor = 'var(--color-ink)'; e.currentTarget.style.borderColor = 'var(--color-ink)'; }}}
        >
          {following ? 'Following' : 'Follow'}
        </button>
      )}
    </div>
  );
}

/* ── Main page ── */
export default function ExplorePage() {
  const { user } = useAuth();
  const toast = useToast();

  const [tab, setTab]         = useState('posts');   // 'posts' | 'people'
  const [query, setQuery]     = useState('');
  const [posts, setPosts]     = useState([]);
  const [people, setPeople]   = useState([]);
  const [loading, setLoading] = useState(true);
  const debounceRef           = useRef(null);

  /* ── Fetch posts (with optional search) ── */
  const fetchPosts = useCallback(async (q = '') => {
    setLoading(true);
    try {
      const params = { limit: 50 };
      if (q) params.search = q;
      const { data } = await getPosts(params);
      setPosts(data);
    } catch { toast.error('Failed to load posts'); }
    finally { setLoading(false); }
  }, [toast]);

  /* ── Fetch people (client-side filter by query) ── */
  const fetchPeople = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getUsers();
      setPeople(data);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  }, [toast]);

  /* Initial load */
  useEffect(() => { fetchPosts(); fetchPeople(); }, [fetchPosts, fetchPeople]);

  /* Re-search posts on query change (debounced 300ms) */
  useEffect(() => {
    if (tab !== 'posts') return;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchPosts(query), 300);
    return () => clearTimeout(debounceRef.current);
  }, [query, tab, fetchPosts]);

  /* Filter people client-side */
  const filteredPeople = query.trim()
    ? people.filter(u => {
        const q = query.toLowerCase();
        return (
          u.full_name?.toLowerCase().includes(q) ||
          u.username?.toLowerCase().includes(q)   ||
          u.email?.toLowerCase().includes(q)
        );
      })
    : people;

  const handleDelete = (id) => setPosts(p => p.filter(x => x.Post.id !== id));

  const tabStyle = (t) => ({
    padding: '14px 0', fontSize: '12px', fontWeight: 600,
    textTransform: 'uppercase', letterSpacing: 'var(--ls-wide)',
    color: tab === t ? 'var(--color-gold)' : 'var(--color-text-muted)',
    borderBottom: `2px solid ${tab === t ? 'var(--color-gold)' : 'transparent'}`,
    transition: 'all var(--duration-fast) var(--ease-out)',
    marginBottom: '-1px',
  });

  return (
    <div className="fade-in">
      {/* ── Header ── */}
      <div style={{ marginBottom: '20px' }}>
        <h1 className="font-serif" style={{ fontSize: '28px', fontWeight: 700, marginBottom: '16px' }}>
          Explore
        </h1>

        {/* Search input */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          border: '1px solid var(--color-border)', borderRadius: 'var(--radius-full)',
          padding: '10px 16px', backgroundColor: 'var(--color-surface)',
          transition: 'border-color var(--duration-fast) var(--ease-out)',
        }}
          onFocus={e => e.currentTarget.style.borderColor = 'var(--color-gold)'}
          onBlur={e  => e.currentTarget.style.borderColor = 'var(--color-border)'}
        >
          <Search size={16} strokeWidth={1.2} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={tab === 'posts' ? 'Search posts…' : 'Search writers…'}
            style={{ flex: 1, fontSize: '14px', color: 'var(--color-text-primary)' }}
          />
          {query && (
            <button onClick={() => setQuery('')}
              style={{ fontSize: '12px', color: 'var(--color-text-muted)', padding: '2px 6px' }}>
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{
        display: 'flex', gap: '32px',
        borderBottom: '1px solid var(--color-border)',
        marginBottom: '20px', position: 'sticky',
        top: 'var(--shell-topbar-height)',
        backgroundColor: 'var(--color-bg)', zIndex: 10,
      }}>
        <button style={tabStyle('posts')} onClick={() => { setTab('posts'); fetchPosts(query); }}>
          Posts
        </button>
        <button style={tabStyle('people')} onClick={() => { setTab('people'); }}>
          People
        </button>
      </div>

      {/* ── Content ── */}
      {loading ? (
        Array.from({ length: 5 }).map((_, i) => (
          <div key={i} style={{ padding: '20px 0', borderBottom: '1px solid var(--color-border)' }}>
            <div className="skeleton" style={{ height: '80px', width: '100%', borderRadius: 'var(--radius-sm)' }} />
          </div>
        ))
      ) : tab === 'posts' ? (
        posts.length === 0 ? (
          <div style={{ padding: '80px 0', textAlign: 'center' }}>
            <p className="font-serif" style={{ fontSize: '20px', marginBottom: '8px' }}>
              {query ? `No posts matching "${query}"` : 'Nothing to explore yet'}
            </p>
            <p className="text-caption">
              {query ? 'Try a different search term.' : 'Posts from everyone will appear here.'}
            </p>
          </div>
        ) : (
          posts.map(({ Post, votes, has_voted, has_reposted, comment_count, repost_count }) => (
            <PostCard
              key={Post.id} post={Post} votes={votes}
              hasVoted={has_voted} hasReposted={has_reposted}
              comment_count={comment_count} repost_count={repost_count}
              onDelete={handleDelete}
            />
          ))
        )
      ) : (
        /* ── People tab ── */
        filteredPeople.length === 0 ? (
          <div style={{ padding: '80px 0', textAlign: 'center' }}>
            <p className="font-serif" style={{ fontSize: '20px', marginBottom: '8px' }}>
              {query ? `No writers matching "${query}"` : 'No writers found'}
            </p>
          </div>
        ) : (
          filteredPeople.map(w => (
            <PeopleRow
              key={w.id}
              writer={w}
              currentUserId={user?.id}
              toast={toast}
            />
          ))
        )
      )}
    </div>
  );
}
