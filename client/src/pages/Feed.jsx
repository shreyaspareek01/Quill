import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Search, PenLine, FileText } from "lucide-react";
import { getPosts } from "../api/posts";
import { useToast } from "../context/ToastContext";
import Navbar from "../components/Navbar";
import PostCard from "../components/PostCard";
import PageWrapper from "../components/PageWrapper";
import "./Feed.css";

function PostCardSkeleton() {
  return (
    <div className="post-skeleton card">
      <div className="skeleton" style={{ height: "1.2rem", width: "70%" }} />
      <div
        className="skeleton"
        style={{ height: "0.9rem", width: "100%", marginTop: "0.5rem" }}
      />
      <div
        className="skeleton"
        style={{ height: "0.9rem", width: "85%", marginTop: "0.35rem" }}
      />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: "1.2rem",
          paddingTop: "1rem",
          borderTop: "1px solid var(--border)",
        }}
      >
        <div className="skeleton" style={{ height: "0.75rem", width: "40%" }} />
        <div
          className="skeleton"
          style={{ height: "1.6rem", width: "60px", borderRadius: "99px" }}
        />
      </div>
    </div>
  );
}

export default function FeedPage() {
  const toast = useToast();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getPosts({ search: debouncedSearch, limit: 30 });
      setPosts(data);
    } catch {
      toast.error("Failed to load posts.");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleDelete = (id) =>
    setPosts((prev) => prev.filter((p) => p.Post.id !== id));

  return (
    <>
      <Navbar />
      <PageWrapper>
        <div className="page-content">
          <div className="page-container">
            {/* Header */}
            <div className="feed__header">
              <div>
                <span className="label feed__eyebrow">Quill</span>
                <h1 className="feed__title">What's on people's minds</h1>
              </div>
              <Link
                to="/posts/new"
                className="btn btn-primary feed__write-btn"
                id="feed-create-post"
              >
                <PenLine size={15} strokeWidth={2} />
                New post
              </Link>
            </div>

            {/* Search */}
            <div className="feed__search-wrap">
              <Search
                size={16}
                className="feed__search-icon"
                strokeWidth={1.5}
              />
              <input
                id="feed-search"
                type="text"
                className="input feed__search"
                placeholder="Search posts by title…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Grid */}
            {loading ? (
              <div className="feed__grid">
                {Array.from({ length: 6 }).map((_, i) => (
                  <PostCardSkeleton key={i} />
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="feed__empty">
                <FileText
                  size={40}
                  strokeWidth={1}
                  className="feed__empty-icon"
                />
                <h3>No posts yet</h3>
                <p>
                  {debouncedSearch
                    ? "No posts match your search."
                    : "Be the first to write something."}
                </p>
                {!debouncedSearch && (
                  <Link
                    to="/posts/new"
                    className="btn btn-primary"
                    style={{ marginTop: "1rem" }}
                  >
                    Write the first post
                  </Link>
                )}
              </div>
            ) : (
              <div className="feed__grid">
                {posts.map(({ Post, votes }) => (
                  <PostCard
                    key={Post.id}
                    post={Post}
                    votes={votes}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </PageWrapper>
    </>
  );
}
