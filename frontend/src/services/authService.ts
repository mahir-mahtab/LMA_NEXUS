/**
 * Authentication Service
 * Handles user login, logout, and session management
 * Requirements: 1.1, 1.2, 1.3, 1.4
 */

import { User, Session } from '../types/user';
import { ServiceError } from './types';

// API Base URL - configure for your environment
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api/v1';

// Storage keys
const ACCESS_TOKEN_KEY = 'lma_access_token';
const REFRESH_TOKEN_KEY = 'lma_refresh_token';
const USER_KEY = 'lma_user';

/**
 * Login result type
 */
export interface LoginResult {
  success: boolean;
  session?: Session;
  user?: User;
  error?: ServiceError;
}

/**
 * Logout result type
 */
export interface LogoutResult {
  success: boolean;
  error?: ServiceError;
}

/**
 * API Response types
 */
interface ApiLoginResponse {
  success: boolean;
  data?: {
    accessToken: string;
    refreshToken: string;
    user: {
      id: string;
      email: string;
      name: string;
      avatarUrl?: string | null;
      createdAt: string;
    };
  };
  error?: {
    code: string;
    message: string;
  };
}

interface ApiMeResponse {
  success: boolean;
  data?: {
    session?: {
      id: string;
      userId: string;
      createdAt: string;
      expiresAt: string;
    };
    user: {
      id: string;
      email: string;
      name: string;
      avatarUrl?: string | null;
      createdAt: string;
    };
  };
  error?: {
    code: string;
    message: string;
  };
}

interface ApiRefreshResponse {
  success: boolean;
  data?: {
    accessToken: string;
    refreshToken: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Get stored access token
 */
export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

/**
 * Get stored refresh token
 */
export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

/**
 * Get stored user
 */
export function getStoredUser(): User | null {
  const userJson = localStorage.getItem(USER_KEY);
  if (!userJson) return null;
  try {
    return JSON.parse(userJson);
  } catch {
    return null;
  }
}

/**
 * Store auth tokens and user
 */
function storeAuth(accessToken: string, refreshToken: string, user: User): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

/**
 * Clear stored auth data
 */
function clearAuth(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/**
 * Make authenticated API request
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const accessToken = getAccessToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  return response.json();
}

/**
 * Authenticate user with email and password
 * Creates a session and returns tokens on success
 * Requirements: 1.1, 1.2, 1.4
 */
export async function login(email: string, password: string): Promise<LoginResult> {
  // Validate inputs
  if (!email || !email.trim()) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Email is required',
      },
    };
  }

  if (!password || !password.trim()) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Password is required',
      },
    };
  }

  try {
    const response = await apiRequest<ApiLoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (!response.success || !response.data) {
      return {
        success: false,
        error: response.error || {
          code: 'UNKNOWN_ERROR',
          message: 'Login failed',
        },
      };
    }

    const { accessToken, refreshToken, user: apiUser } = response.data;

    // Map API user to frontend User type (convert null to undefined)
    const user: User = {
      id: apiUser.id,
      email: apiUser.email,
      name: apiUser.name,
      avatarUrl: apiUser.avatarUrl ?? undefined,
      createdAt: apiUser.createdAt,
    };

    // Store auth data
    storeAuth(accessToken, refreshToken, user);

    // Create session object for compatibility
    const session: Session = {
      id: 'session-from-token',
      userId: user.id,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };

    return {
      success: true,
      session,
      user,
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: 'Unable to connect to server',
      },
    };
  }
}

/**
 * Terminate user session
 * Requirements: 1.3
 */
export async function logout(sessionId?: string): Promise<LogoutResult> {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    clearAuth();
    return { success: true };
  }

  try {
    await apiRequest('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });

    clearAuth();
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    // Clear local auth even if server request fails
    clearAuth();
    return { success: true };
  }
}

/**
 * Refresh access token
 */
export async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    return false;
  }

  try {
    const response = await apiRequest<ApiRefreshResponse>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.success || !response.data) {
      clearAuth();
      return false;
    }

    const user = getStoredUser();
    if (user) {
      storeAuth(response.data.accessToken, response.data.refreshToken, user);
    }

    return true;
  } catch (error) {
    console.error('Token refresh error:', error);
    clearAuth();
    return false;
  }
}

/**
 * Get current session by checking with backend
 * Returns null if session doesn't exist or is expired
 */
export async function getCurrentSession(sessionId?: string): Promise<Session | null> {
  const accessToken = getAccessToken();

  if (!accessToken) {
    return null;
  }

  try {
    const response = await apiRequest<ApiMeResponse>('/auth/me');

    if (!response.success || !response.data?.session) {
      // Try to refresh token
      const refreshed = await refreshAccessToken();
      if (!refreshed) {
        return null;
      }
      
      // Retry after refresh
      const retryResponse = await apiRequest<ApiMeResponse>('/auth/me');
      if (!retryResponse.success || !retryResponse.data?.session) {
        return null;
      }
      return retryResponse.data.session;
    }

    return response.data.session;
  } catch (error) {
    console.error('Get session error:', error);
    return null;
  }
}

/**
 * Get user by session ID (or current session)
 * Returns null if session is invalid or user not found
 */
export async function getUserBySession(sessionId?: string): Promise<User | null> {
  const accessToken = getAccessToken();

  if (!accessToken) {
    return null;
  }

  try {
    const response = await apiRequest<ApiMeResponse>('/auth/me');

    if (!response.success || !response.data?.user) {
      // Try to refresh token
      const refreshed = await refreshAccessToken();
      if (!refreshed) {
        return null;
      }
      
      // Retry after refresh
      const retryResponse = await apiRequest<ApiMeResponse>('/auth/me');
      if (!retryResponse.success || !retryResponse.data?.user) {
        return null;
      }
      
      // Map and update stored user
      const apiUser = retryResponse.data.user;
      const user: User = {
        id: apiUser.id,
        email: apiUser.email,
        name: apiUser.name,
        avatarUrl: apiUser.avatarUrl ?? undefined,
        createdAt: apiUser.createdAt,
      };
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      return user;
    }

    // Map and update stored user
    const apiUser = response.data.user;
    const user: User = {
      id: apiUser.id,
      email: apiUser.email,
      name: apiUser.name,
      avatarUrl: apiUser.avatarUrl ?? undefined,
      createdAt: apiUser.createdAt,
    };
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    return user;
  } catch (error) {
    console.error('Get user error:', error);
    return null;
  }
}

/**
 * Check if a session is valid (exists and not expired)
 */
export async function isSessionValid(sessionId?: string): Promise<boolean> {
  const session = await getCurrentSession(sessionId);
  return session !== null;
}

/**
 * Get all active sessions for current user
 */
export async function getSessionsForUser(userId?: string): Promise<Session[]> {
  const accessToken = getAccessToken();

  if (!accessToken) {
    return [];
  }

  try {
    const response = await apiRequest<{
      success: boolean;
      data?: Array<{
        id: string;
        userId: string;
        createdAt: string;
        expiresAt: string;
      }>;
    }>('/auth/sessions');

    if (!response.success || !response.data) {
      return [];
    }

    // Map to Session interface
    return response.data.map((s) => ({
      id: s.id,
      userId: s.userId,
      createdAt: s.createdAt,
      expiresAt: s.expiresAt,
    }));
  } catch (error) {
    console.error('Get sessions error:', error);
    return [];
  }
}

/**
 * Check if user is authenticated (has valid tokens)
 */
export function isAuthenticated(): boolean {
  return !!getAccessToken();
}
