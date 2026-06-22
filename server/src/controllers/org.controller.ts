import type { Response } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import type { AuthenticatedRequest } from '../types/index.js';
import { createOrgSchema, updateOrgSchema } from '../validators/org.validator.js';

/**
 * POST /org/profile
 * Creates a new organization profile during onboarding step 1.
 * Requires auth but does NOT require an existing org (since we're creating one).
 */
export async function createProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    // Check if user already has an org
    if (req.user.orgId) {
      res.status(409).json({ error: 'Organization profile already exists' });
      return;
    }

    // Validate request body
    const parsed = createOrgSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.format() });
      return;
    }

    // Insert the new organization
    const { data, error } = await supabaseAdmin
      .from('organizations')
      .insert({
        user_id: req.user.userId,
        ...parsed.data,
        onboarding_step: 1,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating org profile:', error.message);
      res.status(500).json({ error: 'Failed to create organization profile' });
      return;
    }

    res.status(201).json({ data });
  } catch (err) {
    console.error('createProfile error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /org/profile
 * Returns the org profile for the authenticated user.
 */
export async function getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { data, error } = await supabaseAdmin
      .from('organizations')
      .select('*')
      .eq('user_id', req.user.userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching org profile:', error.message);
      res.status(500).json({ error: 'Failed to fetch organization profile' });
      return;
    }

    if (!data) {
      res.status(404).json({ error: 'Organization profile not found' });
      return;
    }

    res.json({ data });
  } catch (err) {
    console.error('getProfile error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * PATCH /org/profile
 * Partial update of org fields. Used during onboarding steps 2-4 and from settings page.
 */
export async function updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user.orgId) {
      res.status(404).json({ error: 'Organization profile not found. Create one first.' });
      return;
    }

    // Validate request body
    const parsed = updateOrgSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.format() });
      return;
    }

    const { data, error } = await supabaseAdmin
      .from('organizations')
      .update({
        ...parsed.data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', req.user.orgId)
      .select()
      .single();

    if (error) {
      console.error('Error updating org profile:', error.message);
      res.status(500).json({ error: 'Failed to update organization profile' });
      return;
    }

    res.json({ data });
  } catch (err) {
    console.error('updateProfile error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
