import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function TopBar() {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) navigate(`/feed?search=${encodeURIComponent(query.trim())}`);
  };

  return (
    <header className="app-topbar">
      <form className="search-bar" onSubmit={handleSearch}>
        <Search size={16} strokeWidth={1.5} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
        <input type="text" placeholder="Search posts..." value={query} onChange={e => setQuery(e.target.value)} />
      </form>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button onClick={toggleTheme} className="btn-icon" title="Toggle theme">
          {theme === 'light' ? <Moon size={18} strokeWidth={1.5} /> : <Sun size={18} strokeWidth={1.5} />}
        </button>
      </div>
    </header>
  );
}
