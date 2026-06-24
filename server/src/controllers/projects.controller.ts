import type { Response } from 'express';
import { createUserClient } from '../config/supabase.js';
import type { AuthenticatedRequest } from '../types/index.js';
import { createProjectSchema, updateProjectSchema } from '../validators/project.validator.js';

/**
 * POST /org/projects
 * Creates a new project in the Memory Vault.
 */
export async function createProject(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const parsed = createProjectSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.format() });
      return;
    }

    const userClient = createUserClient(req.user.accessToken);
    const { data, error } = await userClient
      .from('projects')
      .insert({
        org_id: req.user.orgId,
        ...parsed.data,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating project:', error.message, error.details, error.hint);
      res.status(500).json({ 
        error: 'Failed to create project', 
        details: error.message,
        hint: error.hint,
        code: error.code
      });
      return;
    }

    res.status(201).json({ data });
  } catch (err: any) {
    console.error('createProject error:', err);
    res.status(500).json({ error: 'Internal server error', details: err?.message });
  }
}

/**
 * GET /org/projects
 * Lists all projects for the authenticated org, with pagination.
 * Query params: ?page=1&limit=10
 */
export async function getProjects(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
    const offset = (page - 1) * limit;

    const userClient = createUserClient(req.user.accessToken);

    // Get total count
    const { count, error: countError } = await userClient
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', req.user.orgId!);

    if (countError) {
      console.error('Error counting projects:', countError.message);
      res.status(500).json({ error: 'Failed to fetch projects' });
      return;
    }

    // Get paginated data
    const { data, error } = await userClient
      .from('projects')
      .select('*')
      .eq('org_id', req.user.orgId!)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching projects:', error.message);
      res.status(500).json({ error: 'Failed to fetch projects' });
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
    console.error('getProjects error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /org/projects/:id
 * Returns a single project detail. Enforces ownership via org_id.
 */
export async function getProjectById(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userClient = createUserClient(req.user.accessToken);
    const { data, error } = await userClient
      .from('projects')
      .select('*')
      .eq('id', req.params.id!)
      .eq('org_id', req.user.orgId!)
      .maybeSingle();

    if (error) {
      console.error('Error fetching project:', error.message);
      res.status(500).json({ error: 'Failed to fetch project' });
      return;
    }

    if (!data) {
      // Return 404 (not 403) to avoid leaking existence of other org's projects
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    res.json({ data });
  } catch (err) {
    console.error('getProjectById error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * PATCH /org/projects/:id
 * Partial update of a project. Verifies ownership.
 */
export async function updateProject(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const parsed = updateProjectSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.format() });
      return;
    }

    const userClient = createUserClient(req.user.accessToken);
    const { data, error } = await userClient
      .from('projects')
      .update({
        ...parsed.data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', req.params.id!)
      .eq('org_id', req.user.orgId!)
      .select()
      .maybeSingle();

    if (error) {
      console.error('Error updating project:', error.message);
      res.status(500).json({ error: 'Failed to update project' });
      return;
    }

    if (!data) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    res.json({ data });
  } catch (err) {
    console.error('updateProject error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * DELETE /org/projects/:id
 * Hard deletes a project. Verifies ownership.
 */
export async function deleteProject(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userClient = createUserClient(req.user.accessToken);
    
    // First check if the project exists and belongs to the org
    const { data: existing } = await userClient
      .from('projects')
      .select('id')
      .eq('id', req.params.id!)
      .eq('org_id', req.user.orgId!)
      .maybeSingle();

    if (!existing) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const { error } = await userClient
      .from('projects')
      .delete()
      .eq('id', req.params.id!)
      .eq('org_id', req.user.orgId!);

    if (error) {
      console.error('Error deleting project:', error.message);
      res.status(500).json({ error: 'Failed to delete project' });
      return;
    }

    res.status(204).send();
  } catch (err) {
    console.error('deleteProject error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
