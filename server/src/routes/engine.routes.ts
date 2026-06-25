import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authMiddleware, requireOrg } from '../middleware/auth.middleware.js';
import { triggerMatch, generateDraft } from '../controllers/engine.controller.js';
import type { AuthenticatedRequest } from '../types/index.js';

const router = Router();

// All engine routes require auth + org profile
router.use(authMiddleware as any);
router.use(requireOrg as any);

/**
 * Per-org rate limiter for draft generation.
 * Max 10 draft requests per org per hour.
 * Keyed by orgId so different orgs have independent limits.
 */
const draftRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  keyGenerator: (req) => {
    const authReq = req as AuthenticatedRequest;
    return authReq.user?.orgId ?? 'unknown';
  },
  message: {
    error: 'Draft generation rate limit exceeded. Maximum 10 drafts per hour.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /engine/match — trigger matching for the authenticated org
router.post('/match', (req, res) => triggerMatch(req as AuthenticatedRequest, res));

// POST /engine/draft — generate a draft (rate limited: 10/org/hour)
router.post('/draft', draftRateLimiter, (req, res) => generateDraft(req as AuthenticatedRequest, res));

export default router;
