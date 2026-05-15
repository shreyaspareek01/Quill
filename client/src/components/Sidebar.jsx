import { Link, useLocation } from 'react-router-dom';
import { Home, Compass, Bell, Bookmark, User, PenTool, Feather, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const displayName = user?.full_name || user?.username || user?.email?.split('@')[0] || 'Writer';

  const navItems = [
    { name: 'Home', path: '/feed', icon: Home },
    { name: 'Explore', path: '/explore', icon: Compass },
    { name: 'Bookmarks', path: '/bookmarks', icon: Bookmark },
    { name: 'Profile', path: `/profile/${user?.id}`, icon: User },
  ];

  return (
    <aside className="app-nav" style={{ gap: '8px' }}>
      <div style={{ padding: '8px 12px', marginBottom: '16px' }}>
        <Link to="/feed" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Feather size={22} strokeWidth={1.5} style={{ color: 'var(--color-gold)' }} />
          <span className="font-serif" style={{ fontSize: '20px', fontWeight: 700 }}>Quill</span>
        </Link>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
          return (
            <Link key={item.name} to={item.path}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '10px 12px', borderRadius: 'var(--radius-sm)',
                fontSize: '15px', fontWeight: isActive ? 600 : 500,
                color: isActive ? 'var(--color-gold)' : 'var(--color-text-secondary)',
                backgroundColor: isActive ? 'var(--color-gold-subtle)' : 'transparent',
                transition: 'all var(--duration-fast) var(--ease-out)',
              }}
              onMouseEnter={e => { if (!isActive) { e.target.style.backgroundColor = 'var(--color-gold-subtle)'; e.target.style.color = 'var(--color-gold)'; }}}
              onMouseLeave={e => { if (!isActive) { e.target.style.backgroundColor = 'transparent'; e.target.style.color = 'var(--color-text-secondary)'; }}}
            >
              <Icon size={20} strokeWidth={1.5} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <Link to="/posts/new"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          padding: '12px', borderRadius: 'var(--radius-sm)',
          backgroundColor: 'var(--color-ink)', color: '#FFF',
          fontSize: '14px', fontWeight: 600, marginBottom: '8px',
          transition: 'all var(--duration-fast) var(--ease-out)',
        }}
        onMouseEnter={e => { e.target.style.backgroundColor = 'var(--color-gold)'; }}
        onMouseLeave={e => { e.target.style.backgroundColor = 'var(--color-ink)'; }}
      >
        <PenTool size={16} strokeWidth={1.5} />
        <span>Write</span>
      </Link>

      <div style={{ padding: '12px 0 4px', borderTop: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Link to={`/profile/${user?.id}`} style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
          <div className="avatar avatar-sm" style={{ width: '36px', height: '36px', background: user?.avatar_url ? `url(${user.avatar_url}) center/cover` : undefined }} />
          
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '14px', fontWeight: 600, lineHeight: 1.2 }} className="truncate">{displayName}</div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }} className="truncate">@{user?.username || displayName.toLowerCase()}</div>
          </div>
        </Link>
        <button onClick={logout} className="btn-icon" title="Sign out" style={{ width: '32px', height: '32px' }}>
          <LogOut size={16} strokeWidth={1.5} />
        </button>
      </div>
    </aside>
  );
}
