import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import Toast, { ToastVariant } from './Toast';

export interface ToastData {
  id: string;
  variant: ToastVariant;
  title: string;
  message?: string;
  duration?: number;
  dismissible?: boolean;
}

interface ToastContextType {
  addToast: (toast: Omit<ToastData, 'id'>) => string;
  removeToast: (id: string) => void;
  clearAllToasts: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: React.ReactNode;
  maxToasts?: number;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ 
  children, 
  maxToasts = 5 
}) => {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = useCallback((toast: Omit<ToastData, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast: ToastData = { ...toast, id };

    setToasts(prev => {
      const updated = [newToast, ...prev];
      // Limit the number of toasts
      return updated.slice(0, maxToasts);
    });

    return id;
  }, [maxToasts]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast, clearAllToasts }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
};

interface ToastContainerProps {
  toasts: ToastData[];
  onDismiss: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div 
      className="fixed top-4 right-4 z-50 space-y-2"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          {...toast}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  );
};

// Convenience hooks for different toast types
export const useToastHelpers = () => {
  const { addToast } = useToast();

  const success = useCallback(
    (title: string, message?: string, options?: Partial<ToastData>) =>
      addToast({ variant: 'success', title, message, ...options }),
    [addToast]
  );

  const error = useCallback(
    (title: string, message?: string, options?: Partial<ToastData>) =>
      addToast({ variant: 'error', title, message, ...options }),
    [addToast]
  );

  const warning = useCallback(
    (title: string, message?: string, options?: Partial<ToastData>) =>
      addToast({ variant: 'warning', title, message, ...options }),
    [addToast]
  );

  const info = useCallback(
    (title: string, message?: string, options?: Partial<ToastData>) =>
      addToast({ variant: 'info', title, message, ...options }),
    [addToast]
  );

  return useMemo(
    () => ({ success, error, warning, info }),
    [success, error, warning, info]
  );
};

export default ToastContainer;