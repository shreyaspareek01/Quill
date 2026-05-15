import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]   = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('quill_token');
    const savedUser  = localStorage.getItem('quill_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = useCallback((tokenData, userData) => {
    localStorage.setItem('quill_token', tokenData);
    localStorage.setItem('quill_user', JSON.stringify(userData));
    setToken(tokenData);
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('quill_token');
    localStorage.removeItem('quill_user');
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, token, login, logout, isAuthenticated: !!token, loading }), [user, token, login, logout, loading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
