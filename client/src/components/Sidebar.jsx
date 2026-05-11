import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Compass, 
  Bell, 
  Mail, 
  Bookmark, 
  User, 
  Settings, 
  PenTool,
  Feather,
  MoreHorizontal
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

export default function Sidebar() {
  const location = useLocation();
  const { user } = useAuth();
  const username = user?.email?.split('@')[0] || 'Writer';

  const navItems = [
    { name: 'Home', path: '/feed', icon: Home },
    { name: 'Explore', path: '/explore', icon: Compass },
    { name: 'Notifications', path: '/notifications', icon: Bell },
    { name: 'Messages', path: '/messages', icon: Mail },
    { name: 'Bookmarks', path: '/bookmarks', icon: Bookmark },
    { name: 'Profile', path: `/profile/${user?.id}`, icon: User },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside className="app-nav">
      <div className="nav-logo">
        <Link to="/feed" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Feather size={24} strokeWidth={1.5} style={{ color: 'var(--color-gold)' }} />
          <span className="font-serif" style={{ fontSize: '20px', fontWeight: '600' }}>Quill</span>
        </Link>
      </div>

      <nav className="nav-list">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link 
              key={item.name} 
              to={item.path} 
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={20} strokeWidth={1.5} className="nav-icon" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="compose-btn-wrap">
        <Link to="/posts/new" className="btn btn-primary" style={{ width: '100%' }}>
          <PenTool size={16} strokeWidth={1.5} />
          <span>Write</span>
        </Link>
      </div>

      <div className="profile-shortcut">
        <div className="profile-shortcut-inner">
          <Link to={`/profile/${user?.id}`} className="flex items-center gap-12 group" style={{ flex: 1, minWidth: 0 }}>
            <div className="user-avatar-md" style={{ width: '40px', height: '40px' }} />
            <div className="flex flex-col min-w-0">
              <span className="font-serif text-body truncate" style={{ fontSize: '15px', lineHeight: '1.2' }}>{username}</span>
              <span className="text-label truncate" style={{ fontSize: '10px', marginTop: '2px' }}>@{username}</span>
            </div>
          </Link>
          <button className="text-muted hover:text-primary transition-colors p-4">
            <MoreHorizontal size={18} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </aside>
  );
}
