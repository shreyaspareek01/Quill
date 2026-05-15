import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, ArrowLeft } from 'lucide-react';
import { getBookmarks } from '../api/bookmarks';
import { useToast } from '../context/ToastContext';

export default function BookmarksPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBookmarks()
      .then(({ data }) => setBookmarks(data))
      .catch(() => toast.error('Failed to load bookmarks'))
      .finally(() => setLoading(false));
  }, [toast]);

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <button onClick={() => navigate(-1)} className="btn-icon"><ArrowLeft size={20} strokeWidth={1.5} /></button>
        <h1 className="font-serif" style={{ fontSize: '24px', fontWeight: 700 }}>Bookmarks</h1>
      </div>

      {loading ? (
        Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="skeleton" style={{ height: '60px', width: '100%', marginBottom: '12px' }} />
        ))
      ) : bookmarks.length === 0 ? (
        <div style={{ padding: '64px 0', textAlign: 'center' }}>
          <Bookmark size={32} strokeWidth={1.2} style={{ color: 'var(--color-text-muted)', marginBottom: '16px' }} />
          <p className="font-serif" style={{ fontSize: '20px', marginBottom: '8px' }}>No bookmarks yet</p>
          <p className="text-caption">Save posts to read later.</p>
        </div>
      ) : (
        bookmarks.map(b => (
          <div key={b.id} onClick={() => navigate(`/posts/${b.id}`)}
            style={{ padding: '16px 0', borderBottom: '1px solid var(--color-border)', cursor: 'pointer' }}>
            <p className="font-serif" style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>{b.title}</p>
            <p className="text-caption">{b.content}...</p>
          </div>
        ))
      )}
    </div>
  );
}
