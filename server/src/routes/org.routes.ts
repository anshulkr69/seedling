import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { createProfile, getProfile, updateProfile } from '../controllers/org.controller.js';
import type { AuthenticatedRequest } from '../types/index.js';

const router = Router();

// All org routes require authentication
router.use(authMiddleware as any);

// POST /org/profile — Create org (onboarding step 1)
// Auth required, but org doesn't need to exist yet
router.post('/profile', (req, res) => createProfile(req as AuthenticatedRequest, res));

// GET /org/profile — Get org profile
router.get('/profile', (req, res) => getProfile(req as AuthenticatedRequest, res));

// PATCH /org/profile — Update org profile (onboarding steps 2-4 + settings)
router.patch('/profile', (req, res) => updateProfile(req as AuthenticatedRequest, res));

export default router;
