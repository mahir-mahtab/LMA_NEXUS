import { prisma } from '../index.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { generateAccessToken, generateRefreshToken, verifyToken } from '../utils/jwt.js';
import { JwtPayload } from '../middleware/auth.js';

export interface LoginResult {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  user?: {
    id: string;
    email: string;
    name: string;
    avatarUrl?: string | null;
    createdAt: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface LogoutResult {
  success: boolean;
  error?: {
    code: string;
    message: string;
  };
}

export interface RefreshResult {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  error?: {
    code: string;
    message: string;
  };
}

export interface SessionResult {
  success: boolean;
  session?: {
    id: string;
    userId: string;
    createdAt: string;
    expiresAt: string;
  };
  user?: {
    id: string;
    email: string;
    name: string;
    avatarUrl?: string | null;
    createdAt: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Authenticate user with email and password
 */
export async function login(
  email: string,
  password: string,
  userAgent?: string,
  ipAddress?: string
): Promise<LoginResult> {
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

  // Find user by email (case-insensitive)
  const user = await prisma.user.findFirst({
    where: {
      email: {
        equals: email.toLowerCase().trim(),
        mode: 'insensitive',
      },
    },
  });

  if (!user) {
    return {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid email or password',
      },
    };
  }

  // Verify password
  const isValidPassword = await comparePassword(password, user.password);
  if (!isValidPassword) {
    return {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid email or password',
      },
    };
  }

  // Generate tokens
  const jwtPayload: JwtPayload = {
    userId: user.id,
    email: user.email,
  };

  const accessToken = generateAccessToken(jwtPayload);
  const refreshToken = generateRefreshToken(jwtPayload);

  // Create session
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  const session = await prisma.session.create({
    data: {
      userId: user.id,
      expiresAt,
    },
  });

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { updatedAt: new Date() },
  });

  // Create LOGIN audit event
  await prisma.auditEvent.create({
    data: {
      workspaceId: null, // Global event
      actorId: user.id,
      actorName: user.name,
      eventType: 'LOGIN',
      targetType: 'session',
      targetId: session.id,
      afterState: JSON.stringify({
        email: user.email,
        ipAddress: ipAddress || 'unknown',
        userAgent: userAgent || 'unknown',
      }),
    },
  });

  return {
    success: true,
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt.toISOString(),
    },
  };
}

/**
 * Logout user by invalidating session
 */
export async function logout(refreshToken: string): Promise<LogoutResult> {
  if (!refreshToken) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Refresh token is required',
      },
    };
  }

  try {
    const payload = verifyToken(refreshToken);

    // Get user info for audit log
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, name: true, email: true },
    });

    // Create LOGOUT audit event before deleting sessions
    if (user) {
      await prisma.auditEvent.create({
        data: {
          workspaceId: null, // Global event
          actorId: user.id,
          actorName: user.name,
          eventType: 'LOGOUT',
          targetType: 'session',
          targetId: payload.userId,
          afterState: JSON.stringify({
            email: user.email,
          }),
        },
      });
    }

    // Remove all sessions for this user
    await prisma.session.deleteMany({ where: { userId: payload.userId } });

    return { success: true };
  } catch {
    return {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid refresh token',
      },
    };
  }
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<RefreshResult> {
  if (!refreshToken) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Refresh token is required',
      },
    };
  }

  // Find session with this refresh token
  let payload: JwtPayload;
  try {
    payload = verifyToken(refreshToken);
  } catch {
    return {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid refresh token',
      },
    };
  }

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });

  if (!user) {
    return {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'User not found',
      },
    };
  }

  // Require at least one active session
  const session = await prisma.session.findFirst({
    where: { userId: user.id, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  });

  if (!session) {
    return {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Session expired',
      },
    };
  }

  // Generate new tokens
  const jwtPayload: JwtPayload = {
    userId: user.id,
    email: user.email,
  };

  const newAccessToken = generateAccessToken(jwtPayload);
  const newRefreshToken = generateRefreshToken(jwtPayload);

  // Update session with new refresh token
  const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await prisma.session.update({
    where: { id: session.id },
    data: { expiresAt: newExpiresAt },
  });

  return {
    success: true,
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
}

/**
 * Get current session and user by access token (for /me endpoint)
 */
export async function getCurrentUser(userId: string): Promise<SessionResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'User not found',
      },
    };
  }

  // Get latest session
  const session = await prisma.session.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  });

  return {
    success: true,
    session: session
      ? {
          id: session.id,
          userId: session.userId,
          createdAt: session.createdAt.toISOString(),
          expiresAt: session.expiresAt.toISOString(),
        }
      : undefined,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt.toISOString(),
    },
  };
}

/**
 * Validate session (check if not expired)
 */
export async function isSessionValid(sessionId: string): Promise<boolean> {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
  });

  if (!session) {
    return false;
  }

  return new Date() <= session.expiresAt;
}

/**
 * Get all active sessions for a user
 */
export async function getSessionsForUser(userId: string) {
  const now = new Date();
  return prisma.session.findMany({
    where: {
      userId,
      expiresAt: { gt: now },
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Delete all sessions for a user (logout everywhere)
 */
export async function logoutAll(userId: string): Promise<LogoutResult> {
  // Get user info for audit log
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true },
  });

  // Create LOGOUT audit event before deleting sessions
  if (user) {
    await prisma.auditEvent.create({
      data: {
        workspaceId: null, // Global event
        actorId: user.id,
        actorName: user.name,
        eventType: 'LOGOUT',
        targetType: 'session',
        targetId: userId,
        afterState: JSON.stringify({
          email: user.email,
          logoutType: 'all_sessions',
        }),
      },
    });
  }

  await prisma.session.deleteMany({
    where: { userId },
  });

  return { success: true };
}
