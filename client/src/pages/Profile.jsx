import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { User, Calendar, FileText } from 'lucide-react';
import { getUser } from '../api/users';
import { getPosts } from '../api/posts';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Navbar from '../components/Navbar';
import PageWrapper from '../components/PageWrapper';
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
  }, [id]);

  const handleDelete = (postId) => setPosts(prev => prev.filter(p => p.Post.id !== postId));
  const isMe = me?.id === parseInt(id);

  return (
    <>
      <Navbar />
      <PageWrapper>
        <div className="page-content">
          <div className="page-container">
            {loading ? (
              <div className="profile__skeleton">
                <div className="skeleton" style={{ height: '5rem', width: '5rem', borderRadius: '50%' }} />
                <div className="skeleton" style={{ height: '1.5rem', width: '200px' }} />
                <div className="skeleton" style={{ height: '1rem', width: '150px' }} />
              </div>
            ) : profile && (
              <>
                {/* Profile Card */}
                <div className="profile__card card">
                  <div className="profile__avatar">
                    <User size={28} strokeWidth={1} />
                  </div>
                  <div className="profile__info">
                    <h2 className="profile__name">{profile.email.split('@')[0]}</h2>
                    <div className="profile__meta">
                      <span className="profile__meta-item">
                        <User size={13} strokeWidth={1.5} />
                        {profile.email}
                      </span>
                      <span className="profile__meta-sep">·</span>
                      <span className="profile__meta-item">
                        <Calendar size={13} strokeWidth={1.5} />
                        Joined {formatDate(profile.created_at)}
                      </span>
                    </div>
                    {isMe && <span className="badge badge-gold profile__you-badge">You</span>}
                  </div>
                </div>

                {/* Posts */}
                <div className="profile__posts-header">
                  <h3 className="profile__posts-title">
                    {isMe ? 'Your posts' : `Posts by ${profile.email.split('@')[0]}`}
                  </h3>
                  <span className="label">{posts.length} {posts.length === 1 ? 'post' : 'posts'}</span>
                </div>

                {posts.length === 0 ? (
                  <div className="feed__empty">
                    <FileText size={36} strokeWidth={1} className="feed__empty-icon" />
                    <h3>No posts yet</h3>
                    {isMe && (
                      <Link to="/posts/new" className="btn btn-primary" style={{ marginTop: '1rem' }}>
                        Write your first post
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="feed__grid" style={{ marginTop: 'var(--space-5)' }}>
                    {posts.map(({ Post, votes }) => (
                      <PostCard key={Post.id} post={Post} votes={votes} onDelete={handleDelete} />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </PageWrapper>
    </>
  );
}
