import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service.js';
import { loginSchema, refreshTokenSchema } from '../schemas/index.js';
import { ZodError } from 'zod';

/**
 * Login controller
 * POST /api/v1/auth/login
 */
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Validate request body
    const validated = loginSchema.parse(req.body);

    const userAgent = req.headers['user-agent'];
    const ipAddress = req.ip || req.socket.remoteAddress;

    const result = await authService.login(
      validated.email,
      validated.password,
      userAgent,
      ipAddress
    );

    if (!result.success) {
      const statusCode = result.error?.code === 'UNAUTHORIZED' ? 401 : 400;
      res.status(statusCode).json({
        success: false,
        error: result.error,
      });
      return;
    }

    res.json({
      success: true,
      data: {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: result.user,
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.errors[0]?.message || 'Validation failed',
          details: error.errors,
        },
      });
      return;
    }
    next(error);
  }
};

/**
 * Logout controller
 * POST /api/v1/auth/logout
 */
export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Refresh token is required',
        },
      });
      return;
    }

    const result = await authService.logout(refreshToken);

    if (!result.success) {
      res.status(404).json({
        success: false,
        error: result.error,
      });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh token controller
 * POST /api/v1/auth/refresh
 */
export const refresh = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const validated = refreshTokenSchema.parse(req.body);

    const result = await authService.refreshAccessToken(validated.refreshToken);

    if (!result.success) {
      res.status(401).json({
        success: false,
        error: result.error,
      });
      return;
    }

    res.json({
      success: true,
      data: {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.errors[0]?.message || 'Validation failed',
          details: error.errors,
        },
      });
      return;
    }
    next(error);
  }
};

/**
 * Get current user controller (protected route)
 * GET /api/v1/auth/me
 */
export const me = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
      return;
    }

    const result = await authService.getCurrentUser(req.user.id);

    if (!result.success) {
      res.status(404).json({
        success: false,
        error: result.error,
      });
      return;
    }

    res.json({
      success: true,
      data: {
        session: result.session,
        user: result.user,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all sessions for current user (protected route)
 * GET /api/v1/auth/sessions
 */
export const getSessions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
      return;
    }

    const sessions = await authService.getSessionsForUser(req.user.id);

    res.json({
      success: true,
      data: sessions.map((s) => ({
        id: s.id,
        userId: s.userId,
        createdAt: s.createdAt.toISOString(),
        expiresAt: s.expiresAt.toISOString(),
      })),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout from all sessions (protected route)
 * POST /api/v1/auth/logout-all
 */
export const logoutAll = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
      return;
    }

    await authService.logoutAll(req.user.id);

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};
