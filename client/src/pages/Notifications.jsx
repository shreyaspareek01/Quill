import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Heart, MessageSquare, UserPlus, Repeat, Check } from 'lucide-react';
import { getNotifications } from '../api/notifications';
import { useNotifications } from '../context/NotificationContext';
import { useToast } from '../context/ToastContext';

export default function NotificationsPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { clearUnread, setUnreadCount } = useNotifications();
  const [localNotifications, setLocalNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifs = async () => {
    try {
      const { data } = await getNotifications(40);
      setLocalNotifications(data);
    } catch (err) {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
    // Clear unread count when opening notifications page
    clearUnread().then(() => setUnreadCount(0));
  }, []);

  // Simple format time-ago helper
  const formatTimeAgo = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffSec < 60) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    return `${diffDay}d ago`;
  };

  const getIcon = (type) => {
    switch (type) {
      case 'like':
        return <Heart size={16} fill="var(--color-gold)" style={{ color: 'var(--color-gold)' }} />;
      case 'comment':
        return <MessageSquare size={16} style={{ color: 'var(--color-gold)' }} />;
      case 'follow':
        return <UserPlus size={16} style={{ color: 'var(--color-gold)' }} />;
      case 'repost':
        return <Repeat size={16} style={{ color: 'var(--color-gold)' }} />;
      default:
        return null;
    }
  };

  const handleMarkAllRead = async () => {
    await clearUnread();
    setLocalNotifications(prev => prev.map(n => ({ ...n, read: true })));
    toast.success('All notifications marked as read');
  };

  return (
    <div className="fade-in" style={{ maxWidth: '640px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => navigate(-1)} className="btn-icon">
            <ArrowLeft size={20} strokeWidth={1.5} />
          </button>
          <h1 className="font-serif" style={{ fontSize: '24px', fontWeight: 700 }}>Notifications</h1>
        </div>

        {localNotifications.some(n => !n.read) && (
          <button
            onClick={handleMarkAllRead}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--color-gold)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              transition: 'background var(--duration-fast)',
            }}
            onMouseEnter={e => e.target.style.background = 'var(--color-gold-subtle)'}
            onMouseLeave={e => e.target.style.background = 'transparent'}
          >
            <Check size={14} />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {loading ? (
        Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton" style={{ height: '72px', width: '100%', marginBottom: '12px', borderRadius: 'var(--radius-sm)' }} />
        ))
      ) : localNotifications.length === 0 ? (
        <div style={{ padding: '64px 0', textAlign: 'center' }}>
          <p className="font-serif" style={{ fontSize: '20px', marginBottom: '8px' }}>All quiet here</p>
          <p className="text-caption">We will let you know when readers interact with your stories.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', backgroundColor: 'var(--color-border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
          {localNotifications.map((notif) => (
            <div
              key={notif.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '16px',
                backgroundColor: notif.read ? 'var(--color-bg)' : 'var(--color-gold-subtle)',
                transition: 'background-color var(--duration-fast) ease',
                position: 'relative',
              }}
            >
              {!notif.read && (
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: '3px',
                    backgroundColor: 'var(--color-gold)',
                  }}
                />
              )}

              <Link to={`/profile/${notif.actor.id}`} style={{ flexShrink: 0 }}>
                <div
                  className="avatar"
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: notif.actor.avatar_url ? `url(${notif.actor.avatar_url}) center/cover` : 'var(--color-border)',
                  }}
                />
              </Link>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', flexShrink: 0 }}>
                    {getIcon(notif.type)}
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                    {formatTimeAgo(notif.created_at)}
                  </span>
                </div>

                <div style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>
                  <Link to={`/profile/${notif.actor.id}`} style={{ fontWeight: 600, color: 'var(--color-text-primary)', textDecoration: 'none' }}>
                    {notif.actor.name}
                  </Link>{' '}
                  {notif.type === 'like' && 'liked your post'}
                  {notif.type === 'comment' && 'commented on your post'}
                  {notif.type === 'follow' && 'started following you'}
                  {notif.type === 'repost' && 'reposted your article'}

                  {notif.post && (
                    <Link
                      to={`/posts/${notif.post.id}`}
                      style={{
                        display: 'block',
                        marginTop: '4px',
                        fontSize: '13px',
                        color: 'var(--color-gold)',
                        textDecoration: 'none',
                        fontWeight: 500,
                      }}
                      className="truncate"
                    >
                      "{notif.post.title}"
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
