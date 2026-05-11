import { Search, Bell, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import './TopBar.css';

export default function TopBar() {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();

  return (
    <header className="app-topbar">
      <div className="search-container">
        <Search size={16} strokeWidth={1.2} className="text-muted" />
        <input 
          type="text" 
          placeholder="Explore the collective..." 
          className="search-input" 
        />
      </div>

      <div className="topbar-actions">
        <button 
          onClick={toggleTheme}
          className="text-muted hover:text-gold transition-colors p-4"
          title="Toggle theme"
          style={{ display: 'flex', alignItems: 'center' }}
        >
          {theme === 'light' ? <Moon size={20} strokeWidth={1.2} /> : <Sun size={20} strokeWidth={1.2} />}
        </button>

        <button 
          className="text-muted hover:text-gold transition-colors relative p-4"
          style={{ display: 'flex', alignItems: 'center' }}
        >
          <Bell size={20} strokeWidth={1.2} />
          <span 
            className="absolute" 
            style={{ 
              top: '4px', 
              right: '4px', 
              width: '8px', 
              height: '8px', 
              backgroundColor: 'var(--color-gold)', 
              borderRadius: '50%',
              border: '2px solid var(--color-bg)'
            }} 
          />
        </button>

        <div 
          className="user-avatar-sm" 
          style={{ 
            width: '32px', 
            height: '32px', 
            cursor: 'pointer',
            border: '1px solid var(--color-border)',
            marginLeft: 'var(--space-8)'
          }} 
        />
      </div>
    </header>
  );
}
