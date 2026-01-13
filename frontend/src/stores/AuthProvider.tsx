/**
 * Auth Provider
 * Manages authentication state, login/logout methods, and redirect logic
 * Requirements: 1.1, 1.3
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User, Session } from '../types/user';
import * as authService from '../services/authService';

const SESSION_STORAGE_KEY = 'lma-nexus-session-id';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const storedSessionId = localStorage.getItem(SESSION_STORAGE_KEY);
        if (storedSessionId) {
          const restoredSession = await authService.getCurrentSession(storedSessionId);
          if (restoredSession) {
            const restoredUser = await authService.getUserBySession(storedSessionId);
            if (restoredUser) {
              setSession(restoredSession);
              setUser(restoredUser);
            } else {
              // Session exists but user not found - clear invalid session
              localStorage.removeItem(SESSION_STORAGE_KEY);
            }
          } else {
            // Session expired or invalid - clear it
            localStorage.removeItem(SESSION_STORAGE_KEY);
          }
        }
      } catch (error) {
        console.error('Failed to restore session:', error);
        localStorage.removeItem(SESSION_STORAGE_KEY);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await authService.login(email, password);
      
      if (result.success && result.session && result.user) {
        setSession(result.session);
        setUser(result.user);
        localStorage.setItem(SESSION_STORAGE_KEY, result.session.id);
        return { success: true };
      }
      
      return { 
        success: false, 
        error: result.error?.message || 'Login failed' 
      };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: 'An unexpected error occurred' 
      };
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    try {
      if (session) {
        await authService.logout(session.id);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local state regardless of API result
      setSession(null);
      setUser(null);
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }, [session]);

  const value: AuthContextValue = {
    user,
    session,
    isAuthenticated: !!session && !!user,
    isLoading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access auth context
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export { SESSION_STORAGE_KEY };
