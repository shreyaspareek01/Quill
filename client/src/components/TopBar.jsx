import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Sun, Moon, Menu, X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function TopBar({ onMenuToggle }) {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/feed?search=${encodeURIComponent(query.trim())}`);
      setSearchOpen(false);
    }
  };

  return (
    <header className="app-topbar">
      <button className="mobile-menu-btn" onClick={onMenuToggle} aria-label="Toggle menu">
        <Menu size={20} strokeWidth={1.5} />
      </button>

      {searchOpen ? (
        <form className="search-bar search-bar-mobile" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search posts..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoFocus
            style={{ width: '100%', fontSize: '13px', color: 'var(--color-text-primary)' }}
          />
          <button type="button" onClick={() => setSearchOpen(false)} className="btn-icon" style={{ width: '28px', height: '28px', flexShrink: 0 }}>
            <X size={16} strokeWidth={1.5} />
          </button>
        </form>
      ) : (
        <form className="search-bar" onSubmit={handleSearch}>
          <Search size={16} strokeWidth={1.5} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
          <input type="text" placeholder="Search posts..." value={query} onChange={e => setQuery(e.target.value)} />
        </form>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button className="btn-icon mobile-search-toggle" onClick={() => setSearchOpen(true)} aria-label="Open search">
          <Search size={18} strokeWidth={1.5} />
        </button>
        <button onClick={toggleTheme} className="btn-icon" title="Toggle theme">
          {theme === 'light' ? <Moon size={18} strokeWidth={1.5} /> : <Sun size={18} strokeWidth={1.5} />}
        </button>
      </div>
    </header>
  );
}
