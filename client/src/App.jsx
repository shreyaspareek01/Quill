import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppShell from './components/AppShell';

import LandingPage     from './pages/Landing';
import LoginPage       from './pages/Login';
import RegisterPage    from './pages/Register';
import FeedPage        from './pages/Feed';
import PostDetailPage  from './pages/PostDetail';
import PostFormPage    from './pages/PostForm';
import ProfilePage     from './pages/Profile';
import BookmarksPage   from './pages/Bookmarks';
import ExplorePage     from './pages/Explore';
import EditProfilePage from './pages/EditProfile';
import FollowersListPage from './pages/FollowersList';
import NotFoundPage    from './pages/NotFound';

const AuthenticatedLayout = ({ children }) => (
  <ProtectedRoute>
    <AppShell>{children}</AppShell>
  </ProtectedRoute>
);

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <ToastProvider>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/feed" element={<AuthenticatedLayout><FeedPage /></AuthenticatedLayout>} />
              <Route path="/explore" element={<AuthenticatedLayout><ExplorePage /></AuthenticatedLayout>} />
              <Route path="/posts/new" element={<AuthenticatedLayout><PostFormPage /></AuthenticatedLayout>} />
              <Route path="/posts/:id" element={<AuthenticatedLayout><PostDetailPage /></AuthenticatedLayout>} />
              <Route path="/posts/:id/edit" element={<AuthenticatedLayout><PostFormPage /></AuthenticatedLayout>} />
              <Route path="/profile/:id" element={<AuthenticatedLayout><ProfilePage /></AuthenticatedLayout>} />
              <Route path="/profile/:id/followers" element={<AuthenticatedLayout><FollowersListPage /></AuthenticatedLayout>} />
              <Route path="/profile/:id/following" element={<AuthenticatedLayout><FollowersListPage /></AuthenticatedLayout>} />
              <Route path="/bookmarks" element={<AuthenticatedLayout><BookmarksPage /></AuthenticatedLayout>} />
              <Route path="/settings/edit" element={<AuthenticatedLayout><EditProfilePage /></AuthenticatedLayout>} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </ToastProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
