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

    // Fetch current organization data to check guards
    const { data: existingOrg, error: fetchErr } = await supabaseAdmin
      .from('organizations')
      .select('*')
      .eq('id', req.user.orgId)
      .single();

    if (fetchErr || !existingOrg) {
      res.status(404).json({ error: 'Organization profile not found in database.' });
      return;
    }

    // Guard step increments
    const targetStep = parsed.data.onboarding_step;
    if (targetStep !== undefined && targetStep > existingOrg.onboarding_step) {
      // Step 2 requires Step 1 completed (name, type, location)
      if (targetStep >= 2) {
        const name = parsed.data.name || existingOrg.name;
        const type = parsed.data.type || existingOrg.type;
        const location = parsed.data.location || existingOrg.location;
        if (!name || !type || !location) {
          res.status(400).json({ error: 'Prerequisite fields for Onboarding Step 1 (Name, Type, Location) are missing.' });
          return;
        }
      }
      
      // Step 3 requires Step 2 completed (mission_statement)
      if (targetStep >= 3) {
        const mission = parsed.data.mission_statement || existingOrg.mission_statement;
        if (!mission) {
          res.status(400).json({ error: 'Prerequisite fields for Onboarding Step 2 (Mission Statement) are missing.' });
          return;
        }
      }

      // Step 4 requires Step 3 completed (team_size, annual_turnover_range)
      if (targetStep >= 4) {
        const teamSize = parsed.data.team_size !== undefined ? parsed.data.team_size : existingOrg.team_size;
        const turnover = parsed.data.annual_turnover_range || existingOrg.annual_turnover_range;
        if (teamSize === undefined || teamSize === null || !turnover) {
          res.status(400).json({ error: 'Prerequisite fields for Onboarding Step 3 (Team Size, Annual Turnover Range) are missing.' });
          return;
        }
      }
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
