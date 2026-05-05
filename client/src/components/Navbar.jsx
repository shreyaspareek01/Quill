import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { PenLine, LogOut, User, Feather } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import './Navbar.css';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = () => {
    logout();
    toast.info('You have been signed out.');
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
      <div className="navbar__inner page-container">
        {/* Logo */}
        <Link to={isAuthenticated ? '/feed' : '/'} className="navbar__logo">
          <Feather size={18} strokeWidth={1.5} />
          <span>Quill</span>
        </Link>

        {/* Nav links + actions */}
        <nav className="navbar__nav">
          {isAuthenticated ? (
            <>
              <Link
                to="/feed"
                className={`navbar__link ${isActive('/feed') ? 'navbar__link--active' : ''}`}
              >
                Feed
              </Link>
              <Link
                to="/posts/new"
                className="btn btn-primary btn-sm navbar__write-btn"
              >
                <PenLine size={14} strokeWidth={2} />
                Write
              </Link>
              <Link
                to={`/profile/${user?.id}`}
                className="navbar__avatar"
                title={user?.email}
              >
                <User size={15} strokeWidth={1.5} />
              </Link>
              <button onClick={handleLogout} className="navbar__logout" title="Sign out">
                <LogOut size={15} strokeWidth={1.5} />
              </button>
            </>
          ) : (
            <>
              <Link to="/login"  className="navbar__link">Sign in</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Join Quill</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
