import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../api/axios';

export default function FollowersListPage() {
  const { id } = useParams();
  const location = useLocation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const isFollowers = location.pathname.endsWith('/followers');

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const type = isFollowers ? 'followers' : 'following';
        const { data } = await api.get(`/follows/${id}/${type}`);
        setUsers(data);
      } catch { toast.error('Failed to load'); }
      finally { setLoading(false); }
    })();
  }, [id, isFollowers, toast]);

  return (
    <div className="fade-in" style={{ maxWidth: '500px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <button onClick={() => navigate(-1)} className="btn-icon"><ArrowLeft size={20} strokeWidth={1.5} /></button>
        <h1 className="font-serif" style={{ fontSize: '22px', fontWeight: 700 }}>
          {isFollowers ? 'Followers' : 'Following'}
        </h1>
      </div>

      {loading ? (
        Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton" style={{ height: '48px', width: '100%', marginBottom: '8px' }} />
        ))
      ) : users.length === 0 ? (
        <div style={{ padding: '48px 0', textAlign: 'center' }}>
          <p className="font-serif" style={{ fontSize: '18px', marginBottom: '8px' }}>
            {isFollowers ? 'No followers yet' : 'Not following anyone'}
          </p>
          <p className="text-caption">
            {isFollowers ? 'Share your profile to gain followers.' : 'Discover users to follow.'}
          </p>
        </div>
      ) : (
        users.map(u => (
          <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0', borderBottom: '1px solid var(--color-border)' }}>
            <div className="avatar avatar-sm" style={{ width: '40px', height: '40px', background: u.avatar_url ? `url(${u.avatar_url}) center/cover` : undefined }} />
            
            <Link to={`/profile/${u.id}`} style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '14px', fontWeight: 600 }}>{u.full_name || u.username || u.email?.split('@')[0] || 'User'}</div>
              <div className="text-caption" style={{ fontSize: '12px' }}>@{u.username || u.email?.split('@')[0] || 'user'}</div>
            </Link>
          </div>
        ))
      )}
    </div>
  );
}
