import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ThumbsUp, Edit2, Trash2, ArrowLeft, User, Calendar } from 'lucide-react';
import { getPost, deletePost } from '../api/posts';
import { castVote } from '../api/votes';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Navbar from '../components/Navbar';
import PageWrapper from '../components/PageWrapper';
import './PostDetail.css';

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function PostDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [votes, setVotes]       = useState(0);
  const [voted, setVoted]       = useState(false);
  const [voteLoading, setVoteLoading] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await getPost(id);
        setData(res.data);
        setVotes(res.data.votes);
      } catch {
        toast.error('Post not found.');
        navigate('/feed');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  const handleVote = async () => {
    if (voteLoading) return;
    setVoteLoading(true);
    const dir = voted ? 0 : 1;
    try {
      await castVote(data.Post.id, dir);
      setVoted(!voted);
      setVotes(v => v + (dir === 1 ? 1 : -1));
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Vote failed.');
    } finally {
      setVoteLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await deletePost(data.Post.id);
      toast.success('Post deleted.');
      navigate('/feed');
    } catch {
      toast.error('Could not delete post.');
    }
  };

  if (loading) return (
    <>
      <Navbar />
      <div className="page-content">
        <div className="page-container post-detail__skeleton">
          <div className="skeleton" style={{ height: '2.5rem', width: '60%' }} />
          <div className="skeleton" style={{ height: '1rem', width: '30%', marginTop: '1rem' }} />
          <div className="skeleton" style={{ height: '1rem', width: '100%', marginTop: '2rem' }} />
          <div className="skeleton" style={{ height: '1rem', width: '90%', marginTop: '0.75rem' }} />
          <div className="skeleton" style={{ height: '1rem', width: '95%', marginTop: '0.75rem' }} />
        </div>
      </div>
    </>
  );

  if (!data) return null;
  const { Post } = data;
  const isOwner = user?.id === Post.owner_id;

  return (
    <>
      <Navbar />
      <PageWrapper>
        <div className="page-content">
          <div className="page-container">
            <div className="post-detail">
              {/* Back */}
              <Link to="/feed" className="post-detail__back">
                <ArrowLeft size={15} strokeWidth={2} />
                Back to feed
              </Link>

              {/* Header */}
              <header className="post-detail__header">
                {!Post.published && <span className="badge badge-muted">Draft</span>}
                <h1 className="post-detail__title">{Post.title}</h1>
                <span className="gold-line" />
                <div className="post-detail__meta">
                  <span className="post-detail__meta-item">
                    <User size={13} strokeWidth={1.5} />
                    <Link to={`/profile/${Post.owner_id}`} className="post-detail__author-link">
                      {Post.owner?.email?.split('@')[0]}
                    </Link>
                  </span>
                  <span className="post-detail__meta-sep">·</span>
                  <span className="post-detail__meta-item">
                    <Calendar size={13} strokeWidth={1.5} />
                    {formatDate(Post.created_at)}
                  </span>
                </div>
              </header>

              {/* Content */}
              <div className="post-detail__content">
                {Post.content.split('\n').map((para, i) =>
                  para.trim() ? <p key={i}>{para}</p> : <br key={i} />
                )}
              </div>

              {/* Actions */}
              <footer className="post-detail__footer">
                <button
                  id="detail-vote-btn"
                  className={`btn post-detail__vote-btn ${voted ? 'post-detail__vote-btn--active' : 'btn-ghost'}`}
                  onClick={handleVote}
                  disabled={voteLoading}
                >
                  <ThumbsUp size={15} strokeWidth={2} />
                  {votes} {votes === 1 ? 'upvote' : 'upvotes'}
                </button>

                {isOwner && (
                  <div className="post-detail__owner-actions">
                    <Link to={`/posts/${Post.id}/edit`} className="btn btn-ghost btn-sm" id="detail-edit-btn">
                      <Edit2 size={14} strokeWidth={2} /> Edit
                    </Link>
                    <button onClick={handleDelete} className="btn btn-danger btn-sm" id="detail-delete-btn">
                      <Trash2 size={14} strokeWidth={2} /> Delete
                    </button>
                  </div>
                )}
              </footer>
            </div>
          </div>
        </div>
      </PageWrapper>
    </>
  );
}
