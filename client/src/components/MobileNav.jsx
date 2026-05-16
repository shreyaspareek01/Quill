import { Link, useLocation } from 'react-router-dom';
import { Home, Compass, Bookmark, User, PenTool } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function MobileNav() {
  const location = useLocation();
  const { user } = useAuth();

  const isActive = (path) => {
    if (path === '/feed') return location.pathname === '/feed';
    if (path === '/explore') return location.pathname === '/explore';
    if (path === '/bookmarks') return location.pathname === '/bookmarks';
    if (path.startsWith('/profile/'))
      return location.pathname === path || location.pathname.startsWith(path + '/');
    return false;
  };

  return (
    <nav className="mobile-nav">
      <Link to="/feed" className={isActive('/feed') ? 'active' : ''}>
        <Home size={22} strokeWidth={1.5} />
        <span>Home</span>
      </Link>
      <Link to="/explore" className={isActive('/explore') ? 'active' : ''}>
        <Compass size={22} strokeWidth={1.5} />
        <span>Explore</span>
      </Link>
      <Link to="/posts/new" className="write-btn">
        <PenTool size={20} strokeWidth={1.5} />
      </Link>
      <Link to="/bookmarks" className={isActive('/bookmarks') ? 'active' : ''}>
        <Bookmark size={22} strokeWidth={1.5} />
        <span>Bookmarks</span>
      </Link>
      <Link to={`/profile/${user?.id}`} className={isActive(`/profile/${user?.id}`) ? 'active' : ''}>
        <User size={22} strokeWidth={1.5} />
        <span>Profile</span>
      </Link>
    </nav>
  );
}
