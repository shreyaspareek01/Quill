import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import RightSidebar from './RightSidebar';
import MobileNav from './MobileNav';

export default function AppShell({ children }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-main">
        <TopBar onMenuToggle={() => setDrawerOpen(!drawerOpen)} />
        <main className="app-content">
          {children}
        </main>
      </div>
      <RightSidebar />
      <MobileNav />

      {drawerOpen && <div className="drawer-backdrop" onClick={() => setDrawerOpen(false)} />}
      <aside className={`mobile-drawer ${drawerOpen ? 'open' : ''}`}>
        <Sidebar />
      </aside>
    </div>
  );
}
