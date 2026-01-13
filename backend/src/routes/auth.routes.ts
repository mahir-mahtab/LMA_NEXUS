import { Router, IRouter } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';

const router: IRouter = Router();

/**
 * @route   POST /api/v1/auth/login
 * @desc    Authenticate user and return tokens
 * @access  Public
 */
router.post('/login', authController.login);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user (invalidate refresh token)
 * @access  Public
 */
router.post('/logout', authController.logout);

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh access token using refresh token
 * @access  Public
 */
router.post('/refresh', authController.refresh);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current authenticated user
 * @access  Private
 */
router.get('/me', authenticate, authController.me);

/**
 * @route   GET /api/v1/auth/sessions
 * @desc    Get all active sessions for current user
 * @access  Private
 */
router.get('/sessions', authenticate, authController.getSessions);

/**
 * @route   POST /api/v1/auth/logout-all
 * @desc    Logout from all sessions
 * @access  Private
 */
router.post('/logout-all', authenticate, authController.logoutAll);

export default router;
