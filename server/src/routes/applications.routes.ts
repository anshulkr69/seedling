import { Router } from 'express';
import { authMiddleware, requireOrg } from '../middleware/auth.middleware.js';
import {
  createApplication,
  listApplications,
  getApplicationById,
  updateApplication,
} from '../controllers/applications.controller.js';
import type { AuthenticatedRequest } from '../types/index.js';

const router = Router();

// All application routes require auth + org profile
router.use(authMiddleware as any);
router.use(requireOrg as any);

// POST /applications — Create a new application
router.post('/', (req, res) => createApplication(req as AuthenticatedRequest, res));

// GET /applications — List all applications (paginated, filterable by status)
router.get('/', (req, res) => listApplications(req as AuthenticatedRequest, res));

// GET /applications/:id — Get a single application with grant details
router.get('/:id', (req, res) => getApplicationById(req as AuthenticatedRequest, res));

// PATCH /applications/:id — Update an application
router.patch('/:id', (req, res) => updateApplication(req as AuthenticatedRequest, res));

export default router;
