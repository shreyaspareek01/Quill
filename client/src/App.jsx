import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';

import LandingPage   from './pages/Landing';
import LoginPage     from './pages/Login';
import RegisterPage  from './pages/Register';
import FeedPage      from './pages/Feed';
import PostDetailPage from './pages/PostDetail';
import PostFormPage  from './pages/PostForm';
import ProfilePage   from './pages/Profile';
import NotFoundPage  from './pages/NotFound';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public */}
            <Route path="/"         element={<LandingPage />} />
            <Route path="/login"    element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected */}
            <Route path="/feed" element={
              <ProtectedRoute><FeedPage /></ProtectedRoute>
            } />
            <Route path="/posts/new" element={
              <ProtectedRoute><PostFormPage /></ProtectedRoute>
            } />
            <Route path="/posts/:id" element={
              <ProtectedRoute><PostDetailPage /></ProtectedRoute>
            } />
            <Route path="/posts/:id/edit" element={
              <ProtectedRoute><PostFormPage /></ProtectedRoute>
            } />
            <Route path="/profile/:id" element={
              <ProtectedRoute><ProfilePage /></ProtectedRoute>
            } />

            {/* Fallback */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
