import { Router } from 'express';
import { authMiddleware, requireOrg } from '../middleware/auth.middleware.js';
import {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
} from '../controllers/projects.controller.js';
import type { AuthenticatedRequest } from '../types/index.js';

const router = Router();

// All project routes require auth + a completed org profile
router.use(authMiddleware as any);
router.use(requireOrg as any);

// POST /org/projects — Create a new project
router.post('/', (req, res) => createProject(req as AuthenticatedRequest, res));

// GET /org/projects — List all projects (paginated)
router.get('/', (req, res) => getProjects(req as AuthenticatedRequest, res));

// GET /org/projects/:id — Get a single project
router.get('/:id', (req, res) => getProjectById(req as AuthenticatedRequest, res));

// PATCH /org/projects/:id — Update a project
router.patch('/:id', (req, res) => updateProject(req as AuthenticatedRequest, res));

// DELETE /org/projects/:id — Delete a project
router.delete('/:id', (req, res) => deleteProject(req as AuthenticatedRequest, res));

export default router;
