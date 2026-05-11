import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  MapPin, 
  Link as LinkIcon, 
  Calendar, 
  Mail,
  Feather
} from 'lucide-react';
import { getUser } from '../api/users';
import { getPosts } from '../api/posts';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import PostCard from '../components/PostCard';
import './Profile.css';

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
}

export default function ProfilePage() {
  const { id } = useParams();
  const { user: me } = useAuth();
  const toast = useToast();

  const [profile, setProfile]  = useState(null);
  const [posts, setPosts]      = useState([]);
  const [loading, setLoading]  = useState(true);
  const [activeTab, setActiveTab] = useState('posts');

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
      } catch {
        toast.error('Could not load profile.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, toast]);

  const handleDelete = (postId) => setPosts(prev => prev.filter(p => p.Post.id !== postId));
  const isMe = me?.id === parseInt(id);
  const username = profile?.email?.split('@')[0] || 'writer';

  if (loading) {
    return (
      <div className="profile-page fade-in">
        <div className="skeleton" style={{ height: '300px', width: '100%', borderRadius: 'var(--radius-sm)' }} />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="profile-page fade-in">
      <header className="profile__header">
        <div className="profile__banner" />
        
        <div className="profile__header-content">
          <div className="profile__top-row">
            <div className="profile__avatar-container">
              <div className="user-avatar-lg" style={{ border: '4px solid var(--color-bg)', position: 'relative' }}>
                <div className="avatar-verified">
                  <Feather size={12} strokeWidth={2.5} color="var(--color-bg)" />
                </div>
              </div>
            </div>
            
            <div className="profile__actions">
              {isMe ? (
                <button className="btn btn-ghost btn-sm" style={{ border: '1px solid var(--color-border-strong)' }}>
                  Edit Profile
                </button>
              ) : (
                <div className="flex gap-12">
                  <button className="btn btn-ghost btn-sm" style={{ padding: '8px' }}>
                    <Mail size={16} strokeWidth={1.5} />
                  </button>
                  <button className="btn btn-primary btn-sm">Follow</button>
                </div>
              )}
            </div>
          </div>

          <div className="profile__identity">
            <h1 className="font-serif" style={{ fontSize: '36px', lineHeight: '1.1', marginBottom: '4px' }}>
              {username}
            </h1>
            <div className="flex items-center gap-8">
              <span className="text-label" style={{ color: 'var(--color-gold)' }}>@{username}</span>
              <span className="text-muted" style={{ fontSize: '11px' }}>— Joined {formatDate(profile.created_at)}</span>
            </div>
            
            <p className="profile__bio">
              Essays on the intersection of language, technology, and the human spirit. 
              Currently exploring the aesthetics of digital silence.
            </p>

            <div className="profile__meta-strip">
              <div className="profile__meta-item">
                <MapPin size={13} strokeWidth={1.5} />
                <span>San Francisco, CA</span>
              </div>
              <div className="profile__meta-item">
                <LinkIcon size={13} strokeWidth={1.5} />
                <a href="#" className="link-gold">quill.org/{username}</a>
              </div>
            </div>

            <div className="profile__stats-grid">
              <div className="profile__stat">
                <span className="stat-value">{posts.length}</span>
                <span className="stat-label">Essays</span>
              </div>
              <div className="profile__stat">
                <span className="stat-value">1,204</span>
                <span className="stat-label">Following</span>
              </div>
              <div className="profile__stat">
                <span className="stat-value">4.2k</span>
                <span className="stat-label">Followers</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <nav className="profile__tabs">
        {['Essays', 'Highlights', 'Media', 'Appreciations'].map(tab => (
          <button 
            key={tab}
            className={`profile__tab ${activeTab === tab.toLowerCase() ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.toLowerCase())}
          >
            {tab}
          </button>
        ))}
      </nav>

      <div className="profile__content">
        {posts.length > 0 ? (
          posts.map(({ Post, votes, has_voted }) => (
            <PostCard 
              key={Post.id} 
              post={Post} 
              votes={votes} 
              hasVoted={has_voted}
              onDelete={handleDelete} 
            />
          ))
        ) : (
          <div className="empty-state">
            <p className="font-serif" style={{ fontSize: '20px' }}>No thoughts shared yet.</p>
            <p className="text-caption">This space is waiting for your first sentence.</p>
          </div>
        )}
      </div>
    </div>
  );
}
