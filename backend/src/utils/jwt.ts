import jwt, { SignOptions } from 'jsonwebtoken';
import { JwtPayload } from '../middleware/auth.js';

const getSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }
  return secret;
};

/**
 * Generate an access token
 */
export const generateAccessToken = (payload: JwtPayload): string => {
  const expiresIn = (process.env.JWT_EXPIRES_IN || '15m') as jwt.SignOptions['expiresIn'];
  return jwt.sign(payload, getSecret(), { expiresIn });
};

/**
 * Generate a refresh token
 */
export const generateRefreshToken = (payload: JwtPayload): string => {
  const expiresIn = (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'];
  return jwt.sign(payload, getSecret(), { expiresIn });
};

/**
 * Verify and decode a token
 */
export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, getSecret()) as JwtPayload;
};

/**
 * Decode a token without verification (for debugging)
 */
export const decodeToken = (token: string): JwtPayload | null => {
  try {
    return jwt.decode(token) as JwtPayload | null;
  } catch {
    return null;
  }
};
