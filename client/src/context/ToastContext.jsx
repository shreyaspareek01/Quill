import { createContext, useContext, useState, useCallback, useRef, useMemo } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const [removing, setRemoving] = useState(false);
  const timerRef = useRef(null);
  const showingRef = useRef(false);

  const show = useCallback((message, type = 'default') => {
    if (showingRef.current) return;
    showingRef.current = true;
    setRemoving(false);
    setToast({ message, type });
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setRemoving(true);
      setTimeout(() => {
        setToast(null);
        showingRef.current = false;
      }, 300);
    }, 3000);
  }, []);

  const toastApi = useMemo(() => ({
    success: (msg) => show(msg, 'success'),
    error:   (msg) => show(msg, 'error'),
    info:    (msg) => show(msg, 'default'),
  }), [show]);

  return (
    <ToastContext.Provider value={toastApi}>
      {children}
      {toast && (
        <div className={`toast ${toast.type} ${removing ? 'removing' : ''}`}>
          <span>{toast.message}</span>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};
