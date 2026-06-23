import { Router } from 'express';
import { authMiddleware, requireOrg } from '../middleware/auth.middleware.js';
import {
  listGrants,
  getGrantById,
  getMatches,
  dismissMatch,
} from '../controllers/grants.controller.js';
import type { AuthenticatedRequest } from '../types/index.js';

const router = Router();

// All grants routes require auth + org profile
router.use(authMiddleware as any);
router.use(requireOrg as any);

// GET /grants/matches — must come BEFORE /:id to avoid route collision
router.get('/matches', (req, res) => getMatches(req as AuthenticatedRequest, res));

// PATCH /grants/matches/:id/dismiss — toggle dismiss state
router.patch('/matches/:id/dismiss', (req, res) => dismissMatch(req as AuthenticatedRequest, res));

// GET /grants — list all active grants (paginated, filterable)
router.get('/', (req, res) => listGrants(req as AuthenticatedRequest, res));

// GET /grants/:id — single grant detail
router.get('/:id', (req, res) => getGrantById(req as AuthenticatedRequest, res));

export default router;
