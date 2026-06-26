import type { Response, NextFunction } from 'express';
import { createUserClient, supabaseAdmin } from '../config/supabase.js';
import { env } from '../config/env.js';
import type { AuthenticatedRequest } from '../types/index.js';
import jwt from 'jsonwebtoken';

/**
 * Auth middleware — validates the token either natively via Supabase or manually via JWT_SECRET.
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

    let user: any = null;
    let optionAError: any = null;
    let optionBError: any = null;

    // Method 1: Verify user natively using a user-scoped Supabase client
    try {
      const userClient = createUserClient(token);
      const { data: { user: supabaseUser }, error: authError } = await userClient.auth.getUser();
      if (authError) {
        optionAError = authError;
      } else if (supabaseUser) {
        user = supabaseUser;
        console.log('✅ Option A (Supabase auth.getUser) Succeeded. User ID:', user.id);
      }
    } catch (err: any) {
      optionAError = err;
    }

    // Method 2: Fallback to manual verification using the JWT_SECRET (UUID secret key)
    if (!user) {
      console.log('⚠️ Option A Failed. Error detail:', optionAError);
      console.log('🔄 Attempting Option B (manual jwt.verify)...');
      try {
        const decoded = jwt.verify(token, env.JWT_SECRET) as any;
        if (decoded) {
          user = {
            id: decoded.sub || decoded.id,
            email: decoded.email,
          };
          console.log('✅ Option B (manual jwt.verify) Succeeded. User ID:', user.id);
        }
      } catch (jwtErr: any) {
        optionBError = jwtErr;
        console.error('❌ Option B (manual jwt.verify) Failed. Error detail:', jwtErr.message);
      }
    }

    if (!user) {
      console.error('❌ Both Option A and Option B failed to authenticate the token.');
      console.error('   - Option A Error:', optionAError);
      console.error('   - Option B Error:', optionBError);
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }

    // Look up the user's organization using the admin client to avoid dependency on Anon Key RLS during auth resolution
    const { data: org, error: orgError } = await supabaseAdmin
      .from('organizations')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (orgError) {
      console.error('❌ Error looking up organization:', orgError.message);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }

    console.log('✅ Organization profile found:', org ? org.id : 'none');

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
