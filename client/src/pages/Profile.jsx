import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Link as LinkIcon, Calendar, Mail, Feather, ArrowLeft } from 'lucide-react';
import { getUser } from '../api/users';
import { getPosts } from '../api/posts';
import { getFollowStatus, followUser, unfollowUser } from '../api/follows';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import PostCard from '../components/PostCard';

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
}

export default function ProfilePage() {
  const { id } = useParams();
  const { user: me } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posts');
  const [followStatus, setFollowStatus] = useState({ is_following: false, followers_count: 0, following_count: 0 });
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [userRes, postsRes] = await Promise.all([
          getUser(id),
          getPosts({ limit: 50 }),
        ]);
        setProfile(userRes.data);
        const userPosts = postsRes.data.filter(p => p.Post.owner_id === parseInt(id));
        setPosts(userPosts);
        if (me) {
          getFollowStatus(id).then(r => setFollowStatus(r.data)).catch(() => {});
        }
      } catch { toast.error('Could not load profile'); }
      finally { setLoading(false); }
    })();
  }, [id, me, toast]);

  const handleDelete = (postId) => setPosts(prev => prev.filter(p => p.Post.id !== postId));

  const handleFollow = async () => {
    if (!me) { toast.error('Sign in to follow'); return; }
    setFollowLoading(true);
    try {
      if (followStatus.is_following) {
        await unfollowUser(parseInt(id));
        setFollowStatus(prev => ({ ...prev, is_following: false, followers_count: Math.max(0, prev.followers_count - 1) }));
        toast.success('Unfollowed');
      } else {
        await followUser(parseInt(id));
        setFollowStatus(prev => ({ ...prev, is_following: true, followers_count: prev.followers_count + 1 }));
        toast.success('Following');
      }
    } catch { toast.error('Action failed'); }
    finally { setFollowLoading(false); }
  };

  const isMe = me?.id === parseInt(id);
  const displayName = profile?.full_name || profile?.username || profile?.email?.split('@')[0] || 'Writer';
  const username = profile?.username || profile?.email?.split('@')[0] || 'writer';

  if (loading) {
    return (
      <div className="fade-in">
        <div className="skeleton" style={{ height: '180px', width: '100%', borderRadius: 'var(--radius-md)', marginBottom: '24px' }} />
        <div className="skeleton" style={{ height: '40px', width: '200px', marginBottom: '12px' }} />
        <div className="skeleton" style={{ height: '20px', width: '300px', marginBottom: '24px' }} />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="fade-in">
      <button onClick={() => navigate(-1)}
        style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-muted)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: 'var(--ls-wide)', marginBottom: '16px' }}>
        <ArrowLeft size={16} strokeWidth={1.5} />
        <span>Back</span>
      </button>

      <div style={{ position: 'relative', marginBottom: '24px' }}>
        <div style={{
          height: '180px', borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)',
          marginBottom: '-48px',
          backgroundImage: 'radial-gradient(var(--color-border) 1px, transparent 1px)',
          backgroundSize: '20px 20px', opacity: 0.6,
        }} />
      </div>

      <div style={{ padding: '0 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px' }}>
          <div className="avatar avatar-lg" style={{ border: '4px solid var(--color-bg)', position: 'relative', width: '88px', height: '88px' }}>
            <span style={{ fontSize: '28px', fontWeight: 600, color: 'var(--color-text-muted)' }}>{displayName[0]?.toUpperCase()}</span>
            <div style={{ position: 'absolute', bottom: 0, right: 0, width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'var(--color-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--color-bg)' }}>
              <Feather size={10} strokeWidth={2.5} color="#FFF" />
            </div>
          </div>
          <div>
            {isMe ? (
              <button className="btn btn-ghost btn-sm">Edit Profile</button>
            ) : (
              me && (
                <button onClick={handleFollow} disabled={followLoading}
                  className="btn btn-sm"
                  style={{
                    backgroundColor: followStatus.is_following ? 'transparent' : 'var(--color-ink)',
                    color: followStatus.is_following ? 'var(--color-text-primary)' : '#FFF',
                    border: followStatus.is_following ? '1px solid var(--color-border-strong)' : '1px solid var(--color-ink)',
                  }}>
                  {followStatus.is_following ? 'Following' : 'Follow'}
                </button>
              )
            )}
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h1 className="font-serif" style={{ fontSize: '32px', fontWeight: 700, lineHeight: 1.1, marginBottom: '4px' }}>{displayName}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span style={{ color: 'var(--color-gold)', fontSize: '13px', fontWeight: 500 }}>@{username}</span>
            <span className="text-caption" style={{ fontSize: '11px' }}>— Joined {formatDate(profile.created_at)}</span>
          </div>
          {profile.bio && <p style={{ fontSize: '15px', lineHeight: 1.6, color: 'var(--color-text-secondary)', marginBottom: '12px' }}>{profile.bio}</p>}
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            {profile.location && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--color-text-muted)' }}>
                <MapPin size={13} strokeWidth={1.5} /> {profile.location}
              </div>
            )}
            {profile.website && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--color-text-muted)' }}>
                <LinkIcon size={13} strokeWidth={1.5} />
                <a href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`} target="_blank" rel="noopener noreferrer"
                  style={{ color: 'var(--color-gold)' }}
                  onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                  onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
                  {profile.website.replace(/^https?:\/\//, '')}
                </a>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '32px', padding: '16px 0', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)', marginBottom: '24px' }}>
          <div><span style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', fontWeight: 600 }}>{posts.length}</span><span className="text-label" style={{ fontSize: '10px', marginLeft: '8px' }}>Essays</span></div>
          <div><span style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', fontWeight: 600 }}>{followStatus.following_count}</span><span className="text-label" style={{ fontSize: '10px', marginLeft: '8px' }}>Following</span></div>
          <div><span style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', fontWeight: 600 }}>{followStatus.followers_count}</span><span className="text-label" style={{ fontSize: '10px', marginLeft: '8px' }}>Followers</span></div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '24px', borderBottom: '1px solid var(--color-border)', marginBottom: '8px' }}>
        {['posts', 'highlights', 'media'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            style={{
              padding: '12px 0', fontSize: '13px', fontWeight: activeTab === tab ? 600 : 500,
              color: activeTab === tab ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
              position: 'relative', textTransform: 'uppercase', letterSpacing: 'var(--ls-wide)',
              transition: 'color var(--duration-fast) var(--ease-out)',
            }}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {activeTab === tab && <div style={{ position: 'absolute', bottom: -1, left: 0, right: 0, height: 2, backgroundColor: 'var(--color-gold)' }} />}
          </button>
        ))}
      </div>

      <div>
        {posts.length > 0 ? (
          posts.map(({ Post, votes, has_voted }) => (
            <PostCard key={Post.id} post={Post} votes={votes} hasVoted={has_voted} onDelete={handleDelete} />
          ))
        ) : (
          <div style={{ padding: '64px 0', textAlign: 'center' }}>
            <p className="font-serif" style={{ fontSize: '20px', marginBottom: '8px' }}>No thoughts shared yet</p>
            <p className="text-caption">This space is waiting for your first sentence.</p>
          </div>
        )}
      </div>
    </div>
  );
}
