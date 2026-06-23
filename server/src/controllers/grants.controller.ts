import type { Response } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import type { AuthenticatedRequest } from '../types/index.js';

/**
 * GET /grants
 * Lists active grants from the global grants table with pagination, filtering, and sorting.
 *
 * Query params:
 *   ?page=1&limit=20          — Pagination
 *   ?cause=Education          — Filter by cause area (partial match)
 *   ?funder=DST               — Filter by funder name (partial match)
 *   ?deadline_before=2026-12  — Only grants with deadline before this date
 *   ?sort=deadline&order=asc  — Sort field and direction
 *   ?search=keyword           — Full-text search in title and description
 */
export async function listGrants(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const offset = (page - 1) * limit;

    const cause = req.query.cause as string | undefined;
    const funder = req.query.funder as string | undefined;
    const deadlineBefore = req.query.deadline_before as string | undefined;
    const search = req.query.search as string | undefined;
    const sortField = (req.query.sort as string) || 'deadline';
    const sortOrder = (req.query.order as string) === 'desc' ? false : true; // ascending by default

    // Build query
    let query = supabaseAdmin
      .from('grants')
      .select('*', { count: 'exact' })
      .eq('is_active', true);

    // Apply filters
    if (cause) {
      query = query.contains('cause_areas', [cause]);
    }
    if (funder) {
      query = query.ilike('funder', `%${funder}%`);
    }
    if (deadlineBefore) {
      query = query.lte('deadline', deadlineBefore);
    }
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Apply sorting and pagination
    const validSortFields = ['deadline', 'created_at', 'title', 'funder', 'budget_max'];
    const safeSortField = validSortFields.includes(sortField) ? sortField : 'deadline';

    query = query
      .order(safeSortField, { ascending: sortOrder })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching grants:', error.message);
      res.status(500).json({ error: 'Failed to fetch grants' });
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
    console.error('listGrants error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /grants/:id
 * Returns a single active grant's full details.
 */
export async function getGrantById(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { data, error } = await supabaseAdmin
      .from('grants')
      .select('*')
      .eq('id', req.params.id!)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      console.error('Error fetching grant:', error.message);
      res.status(500).json({ error: 'Failed to fetch grant' });
      return;
    }

    if (!data) {
      res.status(404).json({ error: 'Grant not found' });
      return;
    }

    res.json({ data });
  } catch (err) {
    console.error('getGrantById error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /grants/matches
 * Returns grant matches scoped to the authenticated user's org, joined with grant details.
 * Defaults to non-dismissed matches.
 *
 * Query params:
 *   ?is_dismissed=false   — Filter by dismissed status (default: false)
 *   ?min_score=50         — Minimum fit score filter
 *   ?page=1&limit=20      — Pagination
 */
export async function getMatches(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const offset = (page - 1) * limit;

    const isDismissed = req.query.is_dismissed === 'true';
    const minScore = parseInt(req.query.min_score as string) || 0;

    let query = supabaseAdmin
      .from('grant_matches')
      .select('*, grants(*)', { count: 'exact' })
      .eq('org_id', req.user.orgId!)
      .eq('is_dismissed', isDismissed)
      .gte('fit_score', minScore)
      .order('fit_score', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching matches:', error.message);
      res.status(500).json({ error: 'Failed to fetch matches' });
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
    console.error('getMatches error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * PATCH /grants/matches/:id/dismiss
 * Toggles is_dismissed on a match record. Verifies org ownership.
 */
export async function dismissMatch(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    // First get the current state
    const { data: existing } = await supabaseAdmin
      .from('grant_matches')
      .select('id, is_dismissed')
      .eq('id', req.params.id!)
      .eq('org_id', req.user.orgId!)
      .maybeSingle();

    if (!existing) {
      res.status(404).json({ error: 'Match not found' });
      return;
    }

    // Toggle is_dismissed
    const { data, error } = await supabaseAdmin
      .from('grant_matches')
      .update({ is_dismissed: !existing.is_dismissed })
      .eq('id', req.params.id!)
      .eq('org_id', req.user.orgId!)
      .select()
      .single();

    if (error) {
      console.error('Error dismissing match:', error.message);
      res.status(500).json({ error: 'Failed to update match' });
      return;
    }

    res.json({ data });
  } catch (err) {
    console.error('dismissMatch error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
