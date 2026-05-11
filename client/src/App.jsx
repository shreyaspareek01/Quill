import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppShell from './components/AppShell';

import LandingPage   from './pages/Landing';
import LoginPage     from './pages/Login';
import RegisterPage  from './pages/Register';
import FeedPage      from './pages/Feed';
import PostDetailPage from './pages/PostDetail';
import PostFormPage  from './pages/PostForm';
import ProfilePage   from './pages/Profile';
import NotFoundPage  from './pages/NotFound';

const AuthenticatedLayout = ({ children }) => (
  <ProtectedRoute>
    <AppShell>
      {children}
    </AppShell>
  </ProtectedRoute>
);

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <ToastProvider>
            <Routes>
              {/* Public */}
              <Route path="/"         element={<LandingPage />} />
              <Route path="/login"    element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Protected */}
              <Route path="/feed" element={
                <AuthenticatedLayout><FeedPage /></AuthenticatedLayout>
              } />
              <Route path="/posts/new" element={
                <AuthenticatedLayout><PostFormPage /></AuthenticatedLayout>
              } />
              <Route path="/posts/:id" element={
                <AuthenticatedLayout><PostDetailPage /></AuthenticatedLayout>
              } />
              <Route path="/posts/:id/edit" element={
                <AuthenticatedLayout><PostFormPage /></AuthenticatedLayout>
              } />
              <Route path="/profile/:id" element={
                <AuthenticatedLayout><ProfilePage /></AuthenticatedLayout>
              } />

              {/* Fallback */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </ToastProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
