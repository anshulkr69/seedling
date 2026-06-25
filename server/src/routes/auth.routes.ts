import { Router, type Request, type Response } from 'express';
import { supabaseAdmin } from '../config/supabase.js';

const router = Router();

/**
 * POST /auth/check-email
 * Public route to verify if an email exists in our system.
 * Uses supabaseAdmin auth listUsers since client-side check is blocked by RLS.
 */
router.post('/check-email', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }

    console.log(`[Check Email] Checking registration for: ${email}`);

    // Call Supabase Admin API to list users with email filter
    const { data, error } = await (supabaseAdmin.auth.admin as any).listUsers({
      filter: email
    });

    if (error) {
      console.error('[Check Email] Supabase Admin Error:', error.message);
      res.status(500).json({ error: 'Failed to verify email registration' });
      return;
    }

    const users = data?.users || [];
    const exists = users.some((u: any) => u.email?.toLowerCase() === email.toLowerCase());

    res.json({ exists });
  } catch (err: any) {
    console.error('[Check Email] Server Error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

export default router;
