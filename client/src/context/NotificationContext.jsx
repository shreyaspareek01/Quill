import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { getUnreadCount, markAllRead } from '../api/notifications';

const NotificationContext = createContext(null);

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export function NotificationProvider({ children }) {
  const { user, token } = useAuth();
  const toast = useToast();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const eventSourceRef = useRef(null);

  // Fetch initial unread count when user logs in
  useEffect(() => {
    if (!token) {
      setUnreadCount(0);
      setNotifications([]);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      return;
    }

    // Load initial count
    getUnreadCount()
      .then(({ data }) => setUnreadCount(data.count))
      .catch(() => {});

    // Open real-time SSE stream
    const url = `${API_BASE_URL}/notifications/stream?token=${token}`;
    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      if (event.data === ': keepalive' || event.data.trim() === '') return;
      try {
        const newNotifs = JSON.parse(event.data);
        if (Array.isArray(newNotifs) && newNotifs.length > 0) {
          // Increment count
          setUnreadCount((prev) => prev + newNotifs.length);
          // Prepend to current session list of live notifications
          setNotifications((prev) => [...newNotifs, ...prev]);

          // Display a brief micro-toast for the latest one
          const latest = newNotifs[0];
          let message = 'New notification';
          const actorName = latest.actor.name;
          if (latest.type === 'like') {
            message = `${actorName} liked your post: "${latest.post?.title || ''}"`;
          } else if (latest.type === 'comment') {
            message = `${actorName} commented on your post: "${latest.post?.title || ''}"`;
          } else if (latest.type === 'follow') {
            message = `${actorName} started following you`;
          } else if (latest.type === 'repost') {
            message = `${actorName} reposted your article`;
          }

          toast.success(message);
        }
      } catch (err) {
        console.error('Failed to parse SSE payload', err);
      }
    };

    es.onerror = () => {
      // EventSource auto-reconnects natively, no need to manually reopen
    };

    return () => {
      if (es) {
        es.close();
      }
    };
  }, [token, toast]);

  const clearUnread = async () => {
    try {
      await markAllRead();
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark notifications read', err);
    }
  };

  return (
    <NotificationContext.Provider value={{ unreadCount, setUnreadCount, notifications, setNotifications, clearUnread }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
};
