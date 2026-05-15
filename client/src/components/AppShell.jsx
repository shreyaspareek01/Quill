import Sidebar from './Sidebar';
import TopBar from './TopBar';
import RightSidebar from './RightSidebar';

export default function AppShell({ children }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-main">
        <TopBar />
        <main className="app-content">
          {children}
        </main>
      </div>
      <RightSidebar />
    </div>
  );
}
