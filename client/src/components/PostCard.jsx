import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ThumbsUp, Edit2, Trash2, User, Calendar } from 'lucide-react';
import { castVote } from '../api/votes';
import { deletePost } from '../api/posts';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import './PostCard.css';

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

export default function PostCard({ post, votes: initialVotes, hasVoted: initialVoted, onDelete }) {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [votes, setVotes] = useState(initialVotes || 0);
  const [voted, setVoted] = useState(initialVoted || false);
  const [voteLoading, setVoteLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const isOwner = user?.id === post.owner_id;

  const handleVote = async (e) => {
    e.stopPropagation();
    if (voteLoading) return;
    setVoteLoading(true);
    const newDir = voted ? 0 : 1;
    try {
      await castVote(post.id, newDir);
      setVoted(!voted);
      setVotes(v => v + (newDir === 1 ? 1 : -1));
    } catch (err) {
      const msg = err.response?.data?.detail || 'Could not vote right now.';
      toast.error(typeof msg === 'string' ? msg : 'Vote failed.');
    } finally {
      setVoteLoading(false);
    }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this post? This cannot be undone.')) return;
    setDeleteLoading(true);
    try {
      await deletePost(post.id);
      toast.success('Post deleted.');
      onDelete?.(post.id);
    } catch {
      toast.error('Could not delete post.');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <article
      className="post-card card"
      onClick={() => navigate(`/posts/${post.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && navigate(`/posts/${post.id}`)}
    >
      <div className="post-card__body">
        {!post.published && (
          <span className="badge badge-muted post-card__draft">Draft</span>
        )}
        <h3 className="post-card__title">{post.title}</h3>
        <p className="post-card__snippet">
          {post.content.length > 160 ? post.content.slice(0, 160) + '…' : post.content}
        </p>
      </div>

      <footer className="post-card__footer">
        <div className="post-card__meta">
          <span className="post-card__meta-item">
            <User size={11} strokeWidth={1.5} />
            {post.owner?.email?.split('@')[0]}
          </span>
          <span className="post-card__meta-sep">·</span>
          <span className="post-card__meta-item">
            <Calendar size={11} strokeWidth={1.5} />
            {formatDate(post.created_at)}
          </span>
        </div>

        <div className="post-card__actions" onClick={e => e.stopPropagation()}>
          <button
            className={`post-card__vote-btn ${voted ? 'post-card__vote-btn--active' : ''}`}
            onClick={handleVote}
            disabled={voteLoading}
            title="Upvote"
            id={`vote-post-${post.id}`}
          >
            <ThumbsUp size={13} strokeWidth={2} />
            <span>{votes}</span>
          </button>

          {isOwner && (
            <>
              <Link
                to={`/posts/${post.id}/edit`}
                className="post-card__icon-btn"
                title="Edit"
                id={`edit-post-${post.id}`}
                onClick={e => e.stopPropagation()}
              >
                <Edit2 size={13} strokeWidth={2} />
              </Link>
              <button
                className="post-card__icon-btn post-card__icon-btn--danger"
                onClick={handleDelete}
                disabled={deleteLoading}
                title="Delete"
                id={`delete-post-${post.id}`}
              >
                <Trash2 size={13} strokeWidth={2} />
              </button>
            </>
          )}
        </div>
      </footer>
    </article>
  );
}
