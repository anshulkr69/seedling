import type { Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import type { AuthenticatedRequest } from '../types/index.js';

/**
 * Auth middleware — validates the Supabase JWT and attaches user info to the request.
 *
 * Flow:
 * 1. Extract Bearer token from Authorization header
 * 2. Verify token with Supabase Auth (getUser validates signature + expiry)
 * 3. Look up the user's org from the organizations table
 * 4. Attach { userId, orgId, accessToken } to req.user
 *
 * orgId will be null if the user hasn't completed onboarding yet.
 * Routes that require an org should check req.user.orgId !== null.
 */
export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Missing or invalid Authorization header' });
      return;
    }

    const token = authHeader.substring(7); // strip "Bearer "

    // Verify the JWT with Supabase Auth
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }

    // Look up the user's organization
    const { data: org, error: orgError } = await supabaseAdmin
      .from('organizations')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (orgError) {
      console.error('Error looking up organization:', orgError.message);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }

    // Attach user info to request
    req.user = {
      userId: user.id,
      orgId: org?.id ?? null,
      accessToken: token,
    };

    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Guard middleware — ensures the user has a completed org profile.
 * Use this AFTER authMiddleware on routes that require an org to exist.
 */
export async function requireOrg(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.user?.orgId) {
    res.status(403).json({
      error: 'Organization profile required. Complete onboarding first.',
    });
    return;
  }
  next();
}
