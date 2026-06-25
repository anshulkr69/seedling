import type { Response } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import type { AuthenticatedRequest } from '../types/index.js';
import { createApplicationSchema, updateApplicationSchema } from '../validators/application.validator.js';

/**
 * POST /applications
 * Creates a new application with status 'exploring'.
 * Verifies that the grant exists and is active.
 */
export async function createApplication(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const parsed = createApplicationSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.format() });
      return;
    }

    // Verify grant exists and is active
    const { data: grant } = await supabaseAdmin
      .from('grants')
      .select('id')
      .eq('id', parsed.data.grant_id)
      .eq('is_active', true)
      .maybeSingle();

    if (!grant) {
      res.status(404).json({ error: 'Grant not found or is no longer active' });
      return;
    }

    // Check if an application already exists for this org + grant
    const { data: existing } = await supabaseAdmin
      .from('applications')
      .select('id')
      .eq('org_id', req.user.orgId!)
      .eq('grant_id', parsed.data.grant_id)
      .maybeSingle();

    if (existing) {
      res.status(409).json({
        error: 'An application for this grant already exists',
        application_id: existing.id,
      });
      return;
    }

    const { data, error } = await supabaseAdmin
      .from('applications')
      .insert({
        org_id: req.user.orgId,
        grant_id: parsed.data.grant_id,
        status: 'Exploring',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating application:', error.message);
      res.status(500).json({ error: 'Failed to create application' });
      return;
    }

    res.status(201).json({ data });
  } catch (err) {
    console.error('createApplication error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /applications
 * Lists all applications for the authenticated org, joined with grant details.
 *
 * Query params:
 *   ?status=drafting    — Filter by status
 *   ?page=1&limit=20   — Pagination
 */
export async function listApplications(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const offset = (page - 1) * limit;
    const status = req.query.status as string | undefined;

    let query = supabaseAdmin
      .from('applications')
      .select('*, grants(id, title, funder, deadline, budget_min, budget_max)', { count: 'exact' })
      .eq('org_id', req.user.orgId!);

    if (status) {
      query = query.eq('status', status);
    }

    query = query
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching applications:', error.message);
      res.status(500).json({ error: 'Failed to fetch applications' });
      return;
    }

    res.json({
      data,
      pagination: {
        page,
        limit,
        total: count ?? 0,
        totalPages: Math.ceil((count ?? 0) / limit),
      },
    });
  } catch (err) {
    console.error('listApplications error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /applications/:id
 * Returns a single application with full grant details. Verifies ownership.
 */
export async function getApplicationById(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { data, error } = await supabaseAdmin
      .from('applications')
      .select('*, grants(*)')
      .eq('id', req.params.id!)
      .eq('org_id', req.user.orgId!)
      .maybeSingle();

    if (error) {
      console.error('Error fetching application:', error.message);
      res.status(500).json({ error: 'Failed to fetch application' });
      return;
    }

    if (!data) {
      res.status(404).json({ error: 'Application not found' });
      return;
    }

    res.json({ data });
  } catch (err) {
    console.error('getApplicationById error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * PATCH /applications/:id
 * Updates application fields (status, draft content, compliance, etc.). Verifies ownership.
 */
export async function updateApplication(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const parsed = updateApplicationSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.format() });
      return;
    }

    const updateData: Record<string, unknown> = {
      ...parsed.data,
      updated_at: new Date().toISOString(),
    };

    // Auto-set submitted_at when status changes to 'Submitted'
    if (parsed.data.status === 'Submitted' && !parsed.data.submitted_at) {
      updateData.submitted_at = new Date().toISOString();
    }

    const { data, error } = await supabaseAdmin
      .from('applications')
      .update(updateData)
      .eq('id', req.params.id!)
      .eq('org_id', req.user.orgId!)
      .select()
      .maybeSingle();

    if (error) {
      console.error('Error updating application:', error.message);
      res.status(500).json({ error: 'Failed to update application' });
      return;
    }

    if (!data) {
      res.status(404).json({ error: 'Application not found' });
      return;
    }

    res.json({ data });
  } catch (err) {
    console.error('updateApplication error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
