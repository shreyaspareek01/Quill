import Sidebar from './Sidebar';
import TopBar from './TopBar';
import RightSidebar from './RightSidebar';

export default function AppShell({ children }) {
  return (
    <div className="app-shell">
      {/* Left Column: Navigation */}
      <Sidebar />

      {/* Center Column: Main Content */}
      <div className="app-main">
        <TopBar />
        <main className="app-content">
          <div className="fade-in">
            {children}
          </div>
        </main>
      </div>

      {/* Right Column: Discovery */}
      <RightSidebar />
    </div>
  );
}
