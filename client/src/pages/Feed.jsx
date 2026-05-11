import { useState, useEffect, useCallback } from "react";
import { getPosts } from "../api/posts";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import PostCard from "../components/PostCard";
import "./Feed.css";

export default function FeedPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("for-you");

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getPosts({ limit: 30 });
      setPosts(data);
    } catch {
      toast.error("Failed to load posts.");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleDelete = (id) =>
    setPosts((prev) => prev.filter((p) => p.Post.id !== id));

  return (
    <div className="feed-page">
      {/* Filter Tabs - Premium & Understated */}
      <div className="feed-tabs">
        <button 
          className={`feed-tab ${activeTab === 'for-you' ? 'active' : ''}`}
          onClick={() => setActiveTab('for-you')}
        >
          For you
        </button>
        <button 
          className={`feed-tab ${activeTab === 'following' ? 'active' : ''}`}
          onClick={() => setActiveTab('following')}
        >
          Following
        </button>
      </div>

      {/* Post List */}
      <div className="feed-posts">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="feed-post-skeleton border-bottom">
              <div className="skeleton" style={{ height: '160px', width: '100%', marginBottom: '24px' }} />
            </div>
          ))
        ) : (
          posts.map(({ Post, votes, has_voted }) => (
            <PostCard
              key={Post.id}
              post={Post}
              votes={votes}
              hasVoted={has_voted}
              onDelete={handleDelete}
              variant="feed"
            />
          ))
        )}
      </div>
    </div>
  );
}
